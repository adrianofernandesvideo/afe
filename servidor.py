"""
servidor.py — liga o AFE (so neste computador: 127.0.0.1)
=====================================================================
  python servidor.py --raiz PASTA_DAS_ARTES [--porta 8765]

Depois abra  http://localhost:8765/editor/   (o editor lista as artes .html que achar na pasta).

O que ele serve:
  /editor/...        a tela do editor (pasta app/ ao lado deste arquivo)
  /arte/<caminho>    os arquivos da PASTA_DAS_ARTES (as artes carregam por aqui dentro do editor)
  /api/...           pedidos do editor:
      GET  /api/info                       pasta e versao
      GET  /api/artes                      artes .html encontradas (e se ja estao ligadas ao editor)
      GET  /api/assets?pasta=<pasta>       imagens dentro da pasta da arte (aba Assets)
      GET  /api/biblioteca                 imagens das bibliotecas de assets (--biblioteca)
      GET  /bib/<biblioteca>/<imagem>      uma imagem da biblioteca (miniatura na aba Assets)
      GET  /api/pecas                      pecas feitas em codigo de cada biblioteca (pasta components/)
      GET  /ds/<biblioteca>/<arquivo>      arquivo do design system da biblioteca: a previa de uma peca
                                           (components/<Nome>/preview.html, ja com o CSS da marca), CSS, imagens
      GET  /api/marcas?arquivo=<arte>      "carimbo" da arte e das edicoes (o editor recarrega se mudar)
      POST /api/salvar   {arquivo, edicoes}    grava as edicoes da arte
      POST /api/video    {arquivo, pagina}     gera o MP4 da pagina (roda render_anim.py)
      POST /api/usar-asset {arquivo, biblioteca, asset}   copia uma imagem da biblioteca para a pasta da arte
      POST /api/usar-peca  {arquivo, biblioteca, imagens} copia o CSS da marca (e as imagens da peca) para a arte
      GET  /api/video-status?id=...        andamento do video

Seguranca (de proposito, bem fechado):
  * so atende 127.0.0.1 e confere Host/Origin (outra pagina aberta no navegador nao consegue mandar pedidos);
  * so grava duas coisas, sempre dentro da PASTA_DAS_ARTES:
      - o arquivo de edicoes que a propria arte declara (<script src="....edicoes.js">);
      - copias de IMAGENS e de arquivos .css de uma biblioteca (--biblioteca), em
        <pasta da arte>/assets/biblioteca/...
        (nunca apaga nem troca um arquivo que ja exista com outro conteudo);
  * antes de trocar esse arquivo, guarda a versao anterior em build/edicoes-anteriores/
    (ou .edicoes-anteriores/ se a pasta da arte nao tiver build/);
  * o unico programa que ele roda e o render_anim.py desta pasta.
Nao instala nada e nao acessa a internet.
"""
import argparse
import datetime
import hashlib
import http.server
import itertools
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import urllib.parse
from pathlib import Path

# a saida vai sempre em UTF-8 (caminhos com acento chegam inteiros a quem le: o servidor, o terminal)
for _fluxo in (sys.stdout, sys.stderr):
    try:
        _fluxo.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass

VERSAO = "2.3"                         # (no executavel dos releases vira a versao completa, ex.: 2.3.4-beta)
# CONGELADO = rodando como executavel (AFE.exe, feito pelo PyInstaller nos releases do GitHub). Ai os arquivos
# do editor (app/, arte/, render_anim.py) vem de dentro do executavel, e as artes ficam ao lado dele.
CONGELADO = bool(getattr(sys, "frozen", False))
AQUI = Path(getattr(sys, "_MEIPASS", Path(__file__).parent)).resolve()   # (resolve: nome longo da pasta, ex.: ADRIAN~1)
APP = AQUI / "app"
RAIZ = Path.cwd()                      # definido de verdade em main()
PORTA = 8765

IMAGENS = {".png", ".webp", ".jpg", ".jpeg", ".svg", ".gif", ".avif"}
# pastas que nao guardam artes nem assets de arte (o nome e comparado em minusculas; pastas que comecam
# com "." tambem ficam de fora). "placeholders" = imagens provisorias de modelo: nao sao para usar numa
# arte de verdade. Seu projeto tem outra pasta de renders ou de codigo? Acrescente o nome aqui.
PULAR = {"out", "build", "node_modules", "__pycache__", "fonts", "placeholders"}
# Bibliotecas de assets: pastas de imagens (ex.: os assets da marca) que aparecem na aba Assets de todas as
# artes. Lista de {"nome", "pasta" (nome de pasta seguro), "raiz" (Path)}. Vem de --biblioteca.
BIBLIOTECAS = []
LOCAIS = {"localhost", "127.0.0.1", "::1", "[::1]"}
TAG_EDICOES = re.compile(r"""<script[^>]+src=["']([^"'?#]*edicoes\.js)["']""", re.I)
VIDEOS = {}                            # id -> {"proc", "linhas", "saida"}
contador = itertools.count(1)

MIMES = {
    ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8",
    ".json": "application/json; charset=utf-8", ".md": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml", ".webp": "image/webp", ".avif": "image/avif", ".png": "image/png",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
    ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
    ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".wav": "audio/wav",
}


# ───────────────────────── caminhos (sempre dentro da raiz) ─────────────────────────
def dentro(base, rel):
    """Caminho 'rel' dentro de 'base' (ou None se tentar sair dela)."""
    if rel is None:
        return None
    partes = [p for p in str(rel).replace("\\", "/").split("/") if p not in ("", ".")]
    if any(p == ".." or ":" in p for p in partes):
        return None
    alvo = base.joinpath(*partes).resolve()
    return alvo if alvo == base or base in alvo.parents else None


def arte_de(rel):
    """A arte .html pedida (ou None se nao existir / estiver fora da raiz)."""
    p = dentro(RAIZ, rel)
    return p if p and p.is_file() and p.suffix.lower() == ".html" else None


def arquivo_de_edicoes(arte):
    """Arquivo de edicoes que a arte declara no <script src="...edicoes.js"> (ou None se nao esta ligada)."""
    try:
        m = TAG_EDICOES.search(arte.read_text(encoding="utf-8", errors="ignore"))
    except OSError:
        return None
    if not m:
        return None
    alvo = dentro(arte.parent, urllib.parse.unquote(m.group(1)))
    if not alvo or not alvo.name.endswith("edicoes.js") or not (alvo == RAIZ or RAIZ in alvo.parents):
        return None
    return alvo


def carimbo_de(p):
    try:
        s = p.stat()
        return f"{s.st_mtime_ns}-{s.st_size}"
    except OSError:
        return "-"


def andar(base, extensoes, limite):
    """Arquivos com as extensoes dadas dentro de base (ate 6 niveis), pulando pastas que nao sao de arte."""
    # (numa biblioteca que e a raiz de um design system, components/ guarda as pecas em codigo: nao e pasta de imagens)
    fora = {d["ds"] / "components" for d in BIBLIOTECAS if d["ds"]}
    achados = []
    for pasta, pastas, arquivos in os.walk(base):
        atual = Path(pasta)
        pastas[:] = sorted(d for d in pastas if d.lower() not in PULAR and not d.startswith(".") and (atual / d) != AQUI / "app"
                           and (atual / d) not in fora
                           and (atual / d) != AQUI / "testes")
        if len(atual.relative_to(base).parts) >= 6:
            pastas[:] = []
        for nome in sorted(arquivos):
            if Path(nome).suffix.lower() in extensoes:
                achados.append(atual / nome)
                if len(achados) >= limite:
                    return achados
    return achados


# ───────────────────────── pecas feitas em codigo (design system da biblioteca) ─────────────────────────
# Convencao (a de um design system exportado): ao lado da pasta de imagens — ou dentro dela — ha uma pasta
#   components/<Nome>/preview.html   a peca montada (um HTML pequeno que usa as classes do CSS da marca)
#   components/<Nome>/README.md      como usar (opcional)
#   *.css na raiz e em components/   o CSS da marca (tokens.css, bundle.css...)
# No comeco do preview.html pode vir  <!-- @dsCard group="Elementos" width=1080 height=240 -->  (grupo e tamanho).
CARTAO = re.compile(r"<!--\s*@dsCard\b([^>]*)-->")
ATRIBUTO = re.compile(r"""(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))""")
IMPORT_REMOTO = re.compile(r"""@import\s+(?:url\(\s*)?["']?https?://[^;]*;[ \t]*\r?\n?""", re.I)
ARQUIVOS_DS = IMAGENS | {".css", ".md", ".woff", ".woff2", ".ttf", ".otf"}


def ds_de(raiz):
    """Raiz do design system de uma biblioteca: a pasta que tem components/ (a propria ou a de cima). Ou None."""
    if (raiz / "components").is_dir():
        return raiz
    if raiz.name.lower() == "assets" and (raiz.parent / "components").is_dir():
        return raiz.parent
    return None


def css_do_ds(ds):
    """Os .css da marca, na ordem em que devem carregar: os da raiz (tokens) e depois os de components/."""
    return [p.relative_to(ds).as_posix() for pasta in (ds, ds / "components") for p in sorted(pasta.glob("*.css"))]


def pecas_de(ds):
    """Lista das pecas: [{nome, grupo, largura, altura, resumo}]."""
    lista = []
    for pasta in sorted((ds / "components").iterdir()):
        previa = pasta / "preview.html"
        if not previa.is_file():
            continue
        m = CARTAO.search(previa.read_text(encoding="utf-8", errors="replace")[:600])
        attrs = {k: a or b or c for k, a, b, c in ATRIBUTO.findall(m.group(1))} if m else {}
        resumo = ""
        leia = pasta / "README.md"
        if leia.is_file():
            for linha in leia.read_text(encoding="utf-8", errors="replace").splitlines():
                if linha.strip() and not linha.lstrip().startswith("#"):
                    resumo = linha.strip()[:300]
                    break
        num = lambda v, padrao: int(v) if str(v or "").isdigit() else padrao  # noqa: E731
        lista.append({"nome": pasta.name, "grupo": attrs.get("group") or "Peças", "resumo": resumo,
                      "largura": num(attrs.get("width"), 1080), "altura": num(attrs.get("height"), 600)})
    return lista


def copiar_sem_trocar(dados, destino):
    """Grava 'dados' em 'destino'. Se ja existir OUTRO conteudo com esse nome, grava ao lado com um sufixo
    (nunca troca um arquivo que a arte pode estar usando). Devolve o caminho em que os dados estao."""
    if destino.exists() and destino.read_bytes() != dados:
        destino = destino.with_name(f"{destino.stem}-{hashlib.sha1(dados).hexdigest()[:6]}{destino.suffix}")
    if not destino.exists():
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(dados)
    return destino


def biblioteca_de(nome):
    """A biblioteca com este nome (ou None)."""
    return next((b for b in BIBLIOTECAS if b["nome"] == nome), None)


def imagem_da_biblioteca(nome, rel):
    """Arquivo de imagem 'rel' dentro da biblioteca 'nome' (ou None: nao existe, nao e imagem, ou tenta sair dela)."""
    bib = biblioteca_de(nome)
    p = dentro(bib["raiz"], rel) if bib else None
    return p if p and p.is_file() and p.suffix.lower() in IMAGENS else None


# ───────────────────────── servidor ─────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):
    server_version = "EditorArtes/" + VERSAO
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, **MIMES}

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")      # o editor sempre ve a versao mais nova
        super().end_headers()

    def translate_path(self, path):
        partes = [urllib.parse.unquote(p) for p in urllib.parse.urlparse(path).path.split("/") if p]
        if partes[:1] == ["ds"] and len(partes) >= 3:         # /ds/<biblioteca>/<arquivo do design system>
            bib = biblioteca_de(partes[1])
            alvo = dentro(bib["ds"], "/".join(partes[2:])) if bib and bib["ds"] else None
            ok = alvo and alvo.is_file() and alvo.suffix.lower() in ARQUIVOS_DS
            return str(alvo if ok else APP / "__nao_existe__")
        if partes[:1] == ["bib"] and len(partes) >= 3:        # /bib/<biblioteca>/<imagem>: so imagens
            alvo = imagem_da_biblioteca(partes[1], "/".join(partes[2:]))
            return str(alvo if alvo else APP / "__nao_existe__")
        base = APP if partes[:1] == ["editor"] else RAIZ if partes[:1] == ["arte"] else None
        alvo = dentro(base, "/".join(partes[1:])) if base else None
        return str(alvo if alvo else APP / "__nao_existe__")

    def responder(self, codigo, dados):
        corpo = json.dumps(dados, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def redirecionar(self, para):
        self.send_response(302)
        self.send_header("Location", para)
        self.end_headers()

    def pedido_local(self):
        """So aceita pedidos feitos por este computador, a partir da propria tela do editor."""
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0].lower()
        if host not in LOCAIS:
            return False
        origem = self.headers.get("Origin")
        if origem and (urllib.parse.urlparse(origem).hostname or "").lower() not in LOCAIS:
            return False
        return True

    def ler_json(self):
        if not (self.headers.get("Content-Type") or "").lower().startswith("application/json"):
            raise ValueError("o pedido precisa ser JSON")
        tam = int(self.headers.get("Content-Length") or 0)
        if tam > 20_000_000:
            raise ValueError("pedido grande demais")
        return json.loads(self.rfile.read(tam).decode("utf-8"))

    # ── leitura ──
    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        if url.path.startswith("/api/"):
            if not self.pedido_local():
                return self.responder(403, {"erro": "pedido de fora deste computador"})
            try:
                return self.api_get(url.path, urllib.parse.parse_qs(url.query))
            except Exception as e:  # noqa: BLE001
                return self.responder(500, {"erro": str(e)})
        if url.path.startswith("/ds/") and url.path.endswith("/preview.html"):
            return self.previa_da_peca(url.path)
        if url.path in ("", "/", "/editor", "/_visualizar.html"):          # (o ultimo e o endereco antigo do editor)
            return self.redirecionar("/editor/" + ("?" + url.query if url.query else ""))
        return super().do_GET()

    def previa_da_peca(self, caminho):
        """/ds/<biblioteca>/components/<Nome>/preview.html: a previa da peca, ja apontando para o CSS da marca.
        (O arquivo exportado nao traz os <link>: quem mostra a peca e que junta o CSS.)"""
        partes = [urllib.parse.unquote(p) for p in caminho.split("/") if p]
        bib = biblioteca_de(partes[1]) if len(partes) == 5 and partes[2] == "components" else None
        previa = dentro(bib["ds"], "/".join(partes[2:])) if bib and bib["ds"] else None
        if not previa or not previa.is_file():
            return self.send_error(404)
        raiz = "/ds/" + urllib.parse.quote(partes[1]) + "/"
        cabeca = f'<base href="{raiz}components/{urllib.parse.quote(partes[3])}/">' + "".join(
            f'<link rel="stylesheet" href="{raiz}{urllib.parse.quote(c)}">' for c in css_do_ds(bib["ds"]))
        html = previa.read_text(encoding="utf-8", errors="replace")
        html, n = re.subn(r"<head[^>]*>", lambda m: m.group(0) + cabeca, html, count=1, flags=re.I)
        corpo = (html if n else cabeca + html).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def api_get(self, rota, q):
        um = lambda k: (q.get(k) or [""])[0]  # noqa: E731
        if rota == "/api/info":
            return self.responder(200, {"versao": VERSAO, "pasta": RAIZ.name, "raiz": str(RAIZ)})
        if rota == "/api/artes":
            itens = []
            for p in andar(RAIZ, {".html"}, 800):
                try:
                    ligada = "edicoes-lib.js" in p.read_text(encoding="utf-8", errors="ignore")
                except OSError:
                    ligada = False
                itens.append({"caminho": p.relative_to(RAIZ).as_posix(), "ligada": ligada})
            itens.sort(key=lambda i: (not i["ligada"], i["caminho"].lower()))
            return self.responder(200, {"itens": itens})
        if rota == "/api/assets":
            pasta = dentro(RAIZ, um("pasta"))
            if not pasta or not pasta.is_dir():
                return self.responder(403, {"erro": "pasta invalida"})
            itens = [p.relative_to(pasta).as_posix() for p in andar(pasta, IMAGENS, 3000)]
            return self.responder(200, {"itens": itens})
        if rota == "/api/biblioteca":
            return self.responder(200, {"bibliotecas": [
                {"nome": b["nome"], "pasta": b["pasta"],
                 "itens": [p.relative_to(b["raiz"]).as_posix() for p in andar(b["raiz"], IMAGENS, 3000)]}
                for b in BIBLIOTECAS]})
        if rota == "/api/pecas":
            return self.responder(200, {"bibliotecas": [
                {"nome": b["nome"], "pasta": b["pasta"], "css": css_do_ds(b["ds"]), "pecas": pecas_de(b["ds"])}
                for b in BIBLIOTECAS if b["ds"]]})
        if rota == "/api/marcas":
            arte = arte_de(um("arquivo"))
            if not arte:
                return self.responder(404, {"erro": "arte nao encontrada"})
            ed = arquivo_de_edicoes(arte)
            return self.responder(200, {"marca": carimbo_de(arte) + "|" + (carimbo_de(ed) if ed else "sem")})
        if rota == "/api/video-status":
            v = VIDEOS.get(um("id"))
            if not v:
                return self.responder(404, {"erro": "video nao encontrado"})
            rodando = v["proc"].poll() is None
            return self.responder(200, {
                "rodando": rodando, "ok": (not rodando and v["proc"].returncode == 0),
                "ultima": v["linhas"][-1] if v["linhas"] else "", "saida": v["saida"], "caminho": v["caminho"]})
        return self.responder(404, {"erro": "rota desconhecida"})

    # ── gravacao ──
    def do_POST(self):
        if not self.pedido_local():
            return self.responder(403, {"erro": "pedido de fora deste computador"})
        try:
            pedido = self.ler_json()
            if self.path == "/api/salvar":
                return self.salvar(pedido)
            if self.path == "/api/video":
                return self.video(pedido)
            if self.path == "/api/usar-asset":
                return self.usar_asset(pedido)
            if self.path == "/api/usar-peca":
                return self.usar_peca(pedido)
            return self.responder(404, {"erro": "rota desconhecida"})
        except ValueError as e:
            self.responder(400, {"erro": str(e)})
        except Exception as e:  # noqa: BLE001
            self.responder(500, {"erro": str(e)})

    def salvar(self, pedido):
        arte = arte_de(pedido.get("arquivo"))
        if not arte:
            return self.responder(404, {"erro": "arte nao encontrada dentro da pasta das artes"})
        edicoes = pedido.get("edicoes")
        if not isinstance(edicoes, dict):
            return self.responder(400, {"erro": "formato invalido"})
        alvo = arquivo_de_edicoes(arte)
        if not alvo:
            return self.responder(409, {"erro": "esta arte ainda nao esta ligada ao editor (rode o ligar.py nela)"})
        texto = (
            "// Edicoes feitas a mao no AFE. Gerado automaticamente: nao edite por aqui.\n"
            "// Formato explicado em edicoes-lib.js (e em docs/ARQUITETURA.md do editor).\n"
            "window.EDICOES = " + json.dumps(edicoes, ensure_ascii=False, indent=1) + ";\n"
        )
        if alvo.exists():
            if alvo.read_text(encoding="utf-8", errors="replace") == texto:
                return self.responder(200, {"ok": True, "igual": True})
            guarda = arte.parent / "build" / "edicoes-anteriores" if (arte.parent / "build").is_dir() \
                else arte.parent / ".edicoes-anteriores"
            guarda.mkdir(parents=True, exist_ok=True)
            agora = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            copia = guarda / f"{alvo.stem}-{agora}.js"
            n = 1
            while copia.exists():                 # duas gravacoes no mesmo segundo: nao sobrescreve a anterior
                n += 1
                copia = guarda / f"{alvo.stem}-{agora}-{n}.js"
            shutil.copy2(alvo, copia)
        alvo.write_text(texto, encoding="utf-8", newline="\n")
        self.responder(200, {"ok": True})

    def usar_asset(self, pedido):
        """Copia uma imagem da biblioteca para <pasta da arte>/assets/biblioteca/<biblioteca>/... e devolve o
        caminho dela a partir da pasta da arte. O PNG e o video so enxergam a pasta da arte: por isso a copia."""
        arte = arte_de(pedido.get("arquivo"))
        bib = biblioteca_de(pedido.get("biblioteca"))
        origem = imagem_da_biblioteca(pedido.get("biblioteca"), pedido.get("asset"))
        if not arte or not bib or not origem:
            return self.responder(404, {"erro": "arte ou asset nao encontrado"})
        base = arte.parent / "assets" / "biblioteca" / bib["pasta"]
        destino = dentro(base, origem.relative_to(bib["raiz"]).as_posix())
        if not destino or not (RAIZ in destino.parents):
            return self.responder(403, {"erro": "destino invalido"})
        destino = copiar_sem_trocar(origem.read_bytes(), destino)   # (se ja ha OUTRO arquivo com este nome, nao troca)
        self.responder(200, {"ok": True, "src": destino.relative_to(arte.parent).as_posix()})

    def usar_peca(self, pedido):
        """Prepara a arte para receber uma peca da biblioteca: copia para a pasta da arte o CSS da marca e as
        imagens que a peca usa, e devolve os caminhos (a partir da pasta da arte).
        No CSS copiado saem os @import de enderecos da internet (fontes do Google, por exemplo): a arte tem de
        funcionar sem rede, com as fontes que ela mesma traz."""
        arte = arte_de(pedido.get("arquivo"))
        bib = biblioteca_de(pedido.get("biblioteca"))
        if not arte or not bib or not bib["ds"]:
            return self.responder(404, {"erro": "arte ou biblioteca de pecas nao encontrada"})
        ds, base = bib["ds"], arte.parent / "assets" / "biblioteca" / bib["pasta"]
        rel = lambda p: p.relative_to(arte.parent).as_posix()  # noqa: E731
        css = []
        for c in css_do_ds(ds):
            texto = IMPORT_REMOTO.sub("", (ds / c).read_text(encoding="utf-8", errors="replace"))
            css.append(rel(copiar_sem_trocar(texto.encode("utf-8"), base / "css" / c.replace("/", "-"))))
        imagens = {}
        for pedida in pedido.get("imagens") or []:
            origem = dentro(ds, pedida)
            if not origem or not origem.is_file() or origem.suffix.lower() not in IMAGENS:
                continue
            # imagem que tambem aparece na aba Assets vai para o mesmo lugar que iria por la (sem copia repetida)
            dentro_das_imagens = bib["raiz"] == origem.parent or bib["raiz"] in origem.parents
            destino = dentro(base, origem.relative_to(bib["raiz"]).as_posix()) if dentro_das_imagens \
                else dentro(base / "ds", origem.relative_to(ds).as_posix())
            if destino and RAIZ in destino.parents:
                imagens[pedida] = rel(copiar_sem_trocar(origem.read_bytes(), destino))
        self.responder(200, {"ok": True, "css": css, "imagens": imagens})

    def video(self, pedido):
        arte = arte_de(pedido.get("arquivo"))
        script = AQUI / "render_anim.py"
        if not arte or not script.is_file():
            return self.responder(404, {"erro": "arte ou gerador de video nao encontrado"})
        python = python_para_video()
        if not python:
            return self.responder(501, {"erro": "gerar video precisa do Python 3 com Playwright e do ffmpeg "
                                                "instalados neste computador (veja o LEIA)"})
        pagina = int(pedido.get("pagina") or 1)
        proc = subprocess.Popen(
            python + ["-u", str(script), str(arte), "--pagina", str(pagina)],
            cwd=str(arte.parent), stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding="utf-8", errors="replace",
            env={**os.environ, "PYTHONIOENCODING": "utf-8"})
        vid = str(next(contador))
        reg = {"proc": proc, "linhas": [], "saida": "", "caminho": ""}
        VIDEOS[vid] = reg

        def ler():
            for linha in proc.stdout:
                linha = linha.strip()
                if not linha:
                    continue
                reg["linhas"].append(linha)
                if linha.startswith("SAIDA "):
                    p = Path(linha[6:]).resolve()
                    reg["caminho"] = str(p)
                    if RAIZ in p.parents:                    # dentro da pasta das artes: vira link no editor
                        reg["saida"] = p.relative_to(RAIZ).as_posix()

        threading.Thread(target=ler, daemon=True).start()
        self.responder(200, {"ok": True, "id": vid})


class Servidor(http.server.ThreadingHTTPServer):
    """O servidor HTTP do AFE. No Windows, "reusar o endereco" deixaria dois programas ouvindo a mesma porta
    (e o editor falaria com o errado): la a porta e pedida com exclusividade, e se estiver ocupada da erro."""
    allow_reuse_address = sys.platform != "win32"

    def server_bind(self):
        if sys.platform == "win32" and hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def python_para_video():
    """Comando do Python que roda o render_anim.py. No executavel nao ha Python dentro: usa o do computador,
    se houver (o video tambem precisa do Playwright e do ffmpeg). Devolve uma lista ou None."""
    if not CONGELADO:
        return [sys.executable]
    pastas = [d for d in os.environ.get("PATH", "").split(os.pathsep)
              if d and "WindowsApps" not in d]        # (o "python" falso da Microsoft Store so abre a loja)
    for nome, extra in (("python3", []), ("python", []), ("py", ["-3"])):
        for pasta in pastas:
            achado = shutil.which(nome, path=pasta)
            if achado:
                return [achado, *extra]
    return None


def raiz_padrao():
    """Pasta das artes quando --raiz nao e dado: a atual; no executavel, a pasta 'artes' ao lado dele."""
    if not CONGELADO:
        return Path(".")
    perto = Path(sys.executable).resolve().parent
    return perto / "artes" if (perto / "artes").is_dir() else perto


def ligar_arte(args):
    """Roda o ligar.py (que vai dentro do executavel) com estes argumentos."""
    sys.argv = ["ligar", *args]
    import ligar  # noqa: F401  (o ligar.py roda ao ser importado)


def main():
    global RAIZ, PORTA
    abrir_arte = ""
    if CONGELADO and sys.argv[1:2] == ["ligar"]:      # AFE ligar arte.html  = o ligar.py, de dentro do executavel
        return ligar_arte(sys.argv[2:])
    if CONGELADO and len(sys.argv) == 2 and sys.argv[1].lower().endswith(".html") and Path(sys.argv[1]).is_file():
        # arte arrastada em cima do executavel: liga (se ainda nao estiver) e abre o editor na pasta dela
        arte = Path(sys.argv[1]).resolve()
        ligar_arte([str(arte)])
        sys.argv = [sys.argv[0], "--raiz", str(arte.parent)]
        abrir_arte = "?arquivo=" + urllib.parse.quote(arte.name)
    ap = argparse.ArgumentParser(description="AFE: servidor local")
    ap.add_argument("--raiz", default=None, help="pasta onde ficam as artes .html (padrao: a pasta atual)")
    ap.add_argument("--porta", type=int, default=None, help="porta (padrao: 8765)")
    ap.add_argument("--abrir", action="store_true", help="abre o editor no navegador (o executavel sempre abre)")
    ap.add_argument("--biblioteca", action="append", default=[], metavar="[NOME=]PASTA",
                    help="pasta de imagens que aparece na aba Assets de todas as artes (pode repetir)")
    a = ap.parse_args()
    RAIZ, PORTA = (Path(a.raiz) if a.raiz else raiz_padrao()).resolve(), a.porta or PORTA
    if not RAIZ.is_dir():
        sys.exit(f"Pasta das artes nao encontrada: {RAIZ}")
    for item in a.biblioteca:
        nome, _, pasta = item.rpartition("=") if "=" in item and not Path(item).exists() else ("", "", item)
        raiz = Path(pasta).resolve()
        if not raiz.is_dir():
            print(f"  (biblioteca ignorada: pasta nao encontrada: {raiz})", flush=True)
            continue
        nome = nome.strip() or (raiz.parent.name if raiz.name.lower() == "assets" else raiz.name)
        BIBLIOTECAS.append({"nome": nome, "pasta": re.sub(r"[^\w.-]+", "-", nome).strip("-") or "biblioteca", "raiz": raiz,
                            "ds": ds_de(raiz)})
    if not (APP / "index.html").is_file():
        sys.exit(f"Nao achei a tela do editor em {APP} (a pasta do editor esta completa?)")
    # porta ocupada (outro AFE aberto?): sem --porta, tenta as seguintes
    for tentativa in range(10):
        try:
            srv = Servidor(("127.0.0.1", PORTA), Handler)
            break
        except OSError:
            if a.porta or tentativa == 9:
                sys.exit(f"A porta {PORTA} esta ocupada. Feche o outro programa ou use --porta OUTRA.")
            PORTA += 1
    print(f"AFE {VERSAO}\n  artes: {RAIZ}", flush=True)
    for b in BIBLIOTECAS:
        print(f"  biblioteca \"{b['nome']}\": {b['raiz']}" + (f"  (+ pecas em {b['ds'] / 'components'})" if b["ds"] else ""), flush=True)
    print(f"  abra:  http://localhost:{PORTA}/editor/", flush=True)
    if a.abrir or CONGELADO:
        import webbrowser
        if not os.environ.get("AFE_NAO_ABRIR"):          # (o teste do release liga o executavel sem navegador)
            threading.Timer(0.6, webbrowser.open, [f"http://localhost:{PORTA}/editor/{abrir_arte}"]).start()
    if CONGELADO:
        print("  (deixe esta janela aberta enquanto usa o editor; para fechar, feche a janela)", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    if not CONGELADO:
        main()
    else:
        # no executavel aberto com dois cliques, a janela fecharia antes de dar para ler um erro: espera o Enter
        try:
            main()
        except SystemExit as fim:
            if fim.code not in (None, 0):
                print(fim.code if isinstance(fim.code, str) else f"(saiu com erro {fim.code})", flush=True)
                try:
                    input("\nAperte Enter para fechar.")
                except EOFError:
                    pass
                raise
