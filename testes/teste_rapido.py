"""
teste_rapido.py — confere em ~1 minuto se o AFE continua funcionando
================================================================================
Rode depois de mexer no codigo do editor (e antes de dizer "esta pronto"):

  python testes/teste_rapido.py            abre o editor num navegador escondido e usa de verdade
  python testes/teste_rapido.py --video    tambem gera um video de teste (precisa do ffmpeg; +30 s)
  python testes/teste_rapido.py --ver      mostra o navegador enquanto testa

O que ele faz: copia a arte de exemplo para uma pasta temporaria FORA do editor (com espaco e acento no
nome, de proposito), liga a arte com o ligar.py, sobe o servidor.py numa porta livre e usa o editor como
uma pessoa usaria: selecionar, mover, desfazer/refazer, texto, efeitos, forma, camadas, assets,
biblioteca de assets, pecas em codigo, keyframes (curvas, copiar/colar, arrastar), tempo da camada, escalonar, entradas, capa, salvar... No fim mostra o que passou e o que falhou.

Nao altera nada na pasta do editor nem nas suas artes. Nao instala nada.
Precisa de: Python com playwright e um navegador (Edge ou Chrome).
"""
import base64
import json
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

for _fluxo in (sys.stdout, sys.stderr):
    try:
        _fluxo.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass

EDITOR = Path(__file__).resolve().parents[1]
COM_VIDEO, VISIVEL = "--video" in sys.argv, "--ver" in sys.argv
resultados = []


def ok(nome, passou, detalhe=""):
    resultados.append((nome, bool(passou), detalhe))
    print(("  ok     " if passou else "  FALHOU ") + nome + (f"   [{detalhe}]" if detalhe and not passou else ""), flush=True)


def tentar(nome, fn):
    """Roda um teste; qualquer erro vira FALHOU (e os outros testes continuam)."""
    try:
        fn()
    except Exception as e:  # noqa: BLE001
        ok(nome, False, str(e).splitlines()[0][:160])


def pedir(porta, caminho, corpo=None, cabecalhos=None):
    """Pedido direto ao servidor. Devolve (codigo, json ou texto)."""
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    cab = {"Content-Type": "application/json"} if corpo is not None else {}
    cab.update(cabecalhos or {})
    req = urllib.request.Request(f"http://127.0.0.1:{porta}{caminho}", data=dados, headers=cab)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            txt, cod = r.read().decode("utf-8", "replace"), r.status      # (uma imagem vira texto qualquer: so importa o codigo)
    except urllib.error.HTTPError as e:
        txt, cod = e.read().decode("utf-8", "replace"), e.code
    try:
        return cod, json.loads(txt)
    except ValueError:
        return cod, txt


try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sys.exit("Falta o Playwright do Python (pip install playwright). Peca antes de instalar.")

# ───────────────────────── preparar: pasta temporaria + arte ligada + servidor ─────────────────────────
tmp = Path(tempfile.mkdtemp(prefix="afe-teste-"))
pasta = tmp / "cliente ação"                         # espaco e acento de proposito
pasta.mkdir()
shutil.copy2(EDITOR / "exemplo" / "exemplo.html", pasta / "exemplo.html")
(pasta / "nua.html").write_text(
    '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}'
    '#post{position:relative;width:800px;height:600px;background:#123;color:#fff;font:60px sans-serif}p{margin:0}</style></head>'
    '<body>\n<div id="post"><p class="frase">Arte sem nada do editor</p></div>\n</body></html>\n', encoding="utf-8")

# biblioteca de assets FORA da pasta das artes (como os assets da marca de um cliente) + imagens na pasta da arte
PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
tmp_bib = Path(tempfile.mkdtemp(prefix="afe-bib-"))
marca = tmp_bib / "marca da empresa"
for rel in ("Fundos/fundo teste.png", "Placeholders/provisorio.png"):
    (marca / rel).parent.mkdir(parents=True, exist_ok=True)
    (marca / rel).write_bytes(PNG)
for rel in ("assets/real.png", "assets/placeholders/provisorio.png"):
    (pasta / rel).parent.mkdir(parents=True, exist_ok=True)
    (pasta / rel).write_bytes(PNG)

# arte com uma camada de fundo propria (um <canvas> que cobre tudo), para testar o "usar como fundo"
(pasta / "comfundo.html").write_text(
    '<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}'
    '#post{position:relative;width:800px;height:600px;background:#123;color:#fff;font:60px sans-serif}p{margin:0;position:relative}'
    '.bg{position:absolute;left:0;top:0;width:100%;height:100%;background:#345}</style></head>'
    '<body>\n<div id="post"><canvas class="bg" width="800" height="600"></canvas><p class="frase">Arte com fundo</p><p class="linha"><span class="cor">texto em linha</span></p></div>\n</body></html>\n',
    encoding="utf-8")

# a mesma biblioteca tambem tem PECAS em codigo (um mini design system): CSS da marca + uma peca com README
(marca / "tokens.css").write_text('@import url("https://fonts.example.invalid/css?family=X");\n:root { --mk-cor: rgb(255, 0, 80); }\n', encoding="utf-8")
(marca / "components" / "Selo").mkdir(parents=True)
(marca / "components" / "bundle.css").write_text(".mk-selo { display: inline-block; padding: 6px 14px; background: var(--mk-cor); color: #fff; font: 700 30px sans-serif; }\n"
                                                  ".mk-caixa { padding: 20px; border: 3px solid var(--mk-cor); }\n"
                                                  ".mk-traco { height: 24px; background: var(--mk-cor); pointer-events: none; clip-path: inset(0); }\n"
                                                  ".mk-neon { position: relative; } .mk-fio { display: block; height: 16px; background: #0af; }\n"
                                                  ".mk-neon > i + i { position: absolute; inset: 0; }\n", encoding="utf-8")
(marca / "components" / "Selo" / "README.md").write_text("# Selo\n\nEtiqueta curta da marca.\n\n- **Você fornece:** uma palavra.\n- Use `.mk-selo`.\n", encoding="utf-8")
(marca / "components" / "Selo" / "preview.html").write_text(
    '<!-- @dsCard group="Elementos" width=600 height=420 -->\n<!doctype html>\n<html><head><meta charset="utf-8">'
    '<style>body{margin:0;padding:30px;font-family:Georgia,serif;color:rgb(10, 20, 30)}.row{display:flex;gap:20px}.mk-traco{opacity:.9}.mk-neon>i{opacity:.9}.s{margin-top:6px}.v svg{width:200px;height:100px;display:block}.chao{fill:rgb(0, 120, 200)}</style></head>\n<body>\n'
    '<div class="mk-caixa"><div class="row"><span class="mk-selo">Novo</span><span class="mk-selo">Leak</span></div>'
    '<img class="mk-img" src="../../Fundos/fundo teste.png" width="40" height="40" alt=""><div class="mk-traco"></div><div class="s mk-neon"><i class="mk-fio"></i><i class="mk-fio"></i></div></div>'
    '<figure style="margin:10px 0 0"><div class="v"><svg viewBox="0 0 100 50"><rect class="chao" width="100" height="50"/></svg></div></figure>\n</body></html>\n', encoding="utf-8")

print("Preparando…", flush=True)
r1 = subprocess.run([sys.executable, str(EDITOR / "ligar.py"), str(pasta / "exemplo.html")], capture_output=True, text=True, encoding="utf-8")
r2 = subprocess.run([sys.executable, str(EDITOR / "ligar.py"), str(pasta / "nua.html")], capture_output=True, text=True, encoding="utf-8")
ok("ligar.py: arte ja com as linhas (copia a biblioteca e cria as edicoes)",
   r1.returncode == 0 and (pasta / "edicoes-lib.js").is_file() and (pasta / "exemplo.edicoes.js").is_file(), r1.stdout + r1.stderr)
nua = (pasta / "nua.html").read_text(encoding="utf-8")
ok("ligar.py: arte nua ganha as 2 linhas <script> (modo automatico)",
   r2.returncode == 0 and 'src="nua.edicoes.js"' in nua and "data-auto" in nua and (pasta / "nua.edicoes.js").is_file(), r2.stdout + r2.stderr)
subprocess.run([sys.executable, str(EDITOR / "ligar.py"), str(pasta / "comfundo.html")], capture_output=True, text=True, encoding="utf-8")
r3 = subprocess.run([sys.executable, str(EDITOR / "ligar.py"), str(pasta / "nua.html")], capture_output=True, text=True, encoding="utf-8")
ok("ligar.py: rodar de novo nao repete as linhas", (pasta / "nua.html").read_text(encoding="utf-8").count("edicoes-lib.js") == 1, r3.stdout)

with socket.socket() as s:
    s.bind(("127.0.0.1", 0))
    PORTA = s.getsockname()[1]
servidor = subprocess.Popen([sys.executable, "-u", str(EDITOR / "servidor.py"), "--raiz", str(tmp), "--porta", str(PORTA),
                             "--biblioteca", f"Marca={marca}"],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8")
ARTE = "cliente ação/exemplo.html"
erros_console = []

try:
    for _ in range(50):
        try:
            if pedir(PORTA, "/api/info")[0] == 200:
                break
        except OSError:
            time.sleep(0.1)
    else:
        raise SystemExit("o servidor nao subiu")

    # ───────────────────────── servidor: o que entrega e o que recusa ─────────────────────────
    print("Servidor…", flush=True)
    cod, artes = pedir(PORTA, "/api/artes")
    ok("lista as artes da pasta e sabe quais estao ligadas",
       cod == 200 and {a["caminho"] for a in artes["itens"] if a["ligada"]} == {ARTE, "cliente ação/nua.html", "cliente ação/comfundo.html"}, str(artes))
    ok("recusa gravar pedido que nao e JSON", pedir(PORTA, "/api/salvar", {"arquivo": ARTE, "edicoes": {}}, {"Content-Type": "text/plain"})[0] == 400)
    ok("recusa pedido vindo de outro site", pedir(PORTA, "/api/salvar", {"arquivo": ARTE, "edicoes": {}}, {"Origin": "http://site-qualquer.example"})[0] == 403)
    ok("recusa gravar fora da pasta das artes", pedir(PORTA, "/api/salvar", {"arquivo": "../fora.html", "edicoes": {}})[0] == 404)
    ok("recusa ler arquivo fora da pasta das artes", pedir(PORTA, "/arte/..%2F..%2Fservidor.py")[0] == 404)
    ok("entrega os .js do editor com o tipo certo (modulos)", "javascript" in urllib.request.urlopen(
        f"http://127.0.0.1:{PORTA}/editor/js/main.js").headers.get("Content-Type", ""))

    cod, bib = pedir(PORTA, "/api/biblioteca")
    ok("lista a biblioteca de assets (sem a pasta de placeholders)",
       cod == 200 and bib["bibliotecas"] == [{"nome": "Marca", "pasta": "Marca", "itens": ["Fundos/fundo teste.png"]},
                                             {"nome": "Assets gerais", "pasta": "assets-gerais", "itens": []}], str(bib))
    cod, da_arte = pedir(PORTA, "/api/assets?pasta=" + urllib.request.quote("cliente ação"))
    ok("na pasta da arte, a pasta de placeholders tambem nao aparece", cod == 200 and da_arte["itens"] == ["assets/real.png"], str(da_arte))
    ok("entrega a miniatura da biblioteca e recusa o que nao e imagem dela",
       pedir(PORTA, "/bib/Marca/Fundos/fundo%20teste.png")[0] == 200 and pedir(PORTA, "/bib/Marca/..%2F..%2Fservidor.py")[0] == 404
       and pedir(PORTA, "/api/usar-asset", {"arquivo": ARTE, "biblioteca": "Marca", "asset": "../fora.png"})[0] == 404)

    # imagens trazidas do computador (arrastar e soltar): para a arte e para "Assets gerais"
    PNG1 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    cod, imp = pedir(PORTA, "/api/importar", {"arquivo": ARTE, "destino": "arte", "nome": "../../foto nova.png", "dados": PNG1})
    ok("imagem do computador vai para assets/importadas da arte (nome limpo, sem sair da pasta)",
       cod == 200 and imp.get("src") == "assets/importadas/foto-nova.png" and (tmp / "cliente ação" / "assets" / "importadas" / "foto-nova.png").is_file(), str(imp))
    cod, imp = pedir(PORTA, "/api/importar", {"arquivo": ARTE, "destino": "geral", "nome": "geral.png", "dados": PNG1})
    ok("imagem solta na aba Assets vai para Assets gerais (vale para todas as artes)",
       cod == 200 and imp.get("asset") == "geral.png" and pedir(PORTA, "/api/biblioteca")[1]["bibliotecas"][1]["itens"] == ["geral.png"], str(imp))
    ok("recusa o que nao e imagem (conteudo falso, SVG)",
       pedir(PORTA, "/api/importar", {"arquivo": ARTE, "destino": "arte", "nome": "x.png", "dados": "bmFvIHNvdSBpbWFnZW0="})[0] == 400
       and pedir(PORTA, "/api/importar", {"arquivo": ARTE, "destino": "arte", "nome": "x.svg", "dados": "PHN2Zy8+"})[0] == 400)
    ok("a pasta assets-gerais nao aparece como imagens da pasta da arte",
       not any("assets-gerais" in x for x in pedir(PORTA, "/api/assets?pasta=")[1]["itens"]))

    cod, pcs = pedir(PORTA, "/api/pecas")
    ok("lista as pecas em codigo da biblioteca (grupo, tamanho, resumo, CSS da marca)",
       cod == 200 and pcs["bibliotecas"] == [{"nome": "Marca", "pasta": "Marca", "css": ["tokens.css", "components/bundle.css"],
                                             "pecas": [{"nome": "Selo", "grupo": "Elementos", "resumo": "Etiqueta curta da marca.", "largura": 600, "altura": 420}]}], str(pcs))
    cod, previa = pedir(PORTA, "/ds/Marca/components/Selo/preview.html")
    ok("entrega a previa da peca ja com o CSS da marca; recusa o que esta fora do design system",
       cod == 200 and '<base href="/ds/Marca/components/Selo/">' in previa and 'href="/ds/Marca/components/bundle.css"' in previa
       and pedir(PORTA, "/ds/Marca/components/Selo/README.md")[0] == 200 and pedir(PORTA, "/ds/Marca/..%2F..%2Fservidor.py")[0] == 404
       and pedir(PORTA, "/ds/Marca/components/..%2F..%2Fx/preview.html")[0] == 404, str(previa)[:200])
    ok("a pasta das pecas nao entra na lista de imagens", pedir(PORTA, "/api/biblioteca")[1]["bibliotecas"][0]["itens"] == ["Fundos/fundo teste.png"])

    # ───────────────────────── editor: usar de verdade ─────────────────────────
    print("Editor…", flush=True)
    with sync_playwright() as p:
        nav = None
        for canal in ("msedge", "chrome", None):
            try:
                nav = p.chromium.launch(channel=canal, headless=not VISIVEL) if canal else p.chromium.launch(headless=not VISIVEL)
                break
            except Exception:  # noqa: BLE001
                continue
        if not nav:
            raise SystemExit("nao consegui abrir um navegador (Edge/Chrome)")
        pg = nav.new_page(viewport={"width": 1600, "height": 1000})
        pg.set_default_timeout(8000)
        pg.on("pageerror", lambda e: erros_console.append("erro: " + str(e)))
        dialogos = []                                       # confirmacoes (apagar, voltar ao original...): aceita e anota
        pg.on("dialog", lambda d: (dialogos.append(d.message), d.accept()))
        pg.on("console", lambda m: erros_console.append("console: " + m.text) if m.type == "error" else None)
        js = pg.evaluate
        arte = pg.frame_locator("#quadro")
        quieto = lambda ms=120: pg.wait_for_timeout(ms)  # noqa: E731  (deixa os recados do editor chegarem)

        def abrir(rel):
            pg.goto(f"http://127.0.0.1:{PORTA}/editor/?arquivo={urllib.request.quote(rel)}")
            pg.wait_for_function("window.ED && ED.S.w && ED.S.d && ED.S.d.body.dataset.pronto === '1'", timeout=20000)
            quieto(200)

        def esperar_recarga(acao):
            """Faz a acao e espera a arte recarregar por inteiro (documento novo e pronto)."""
            js("window.__antes = ED.S.d")
            acao()
            pg.wait_for_function("ED.S.d !== window.__antes && !ED.S.sujo && ED.S.d.body.dataset.pronto === '1'", timeout=20000)
            quieto(300)

        def e(caminho=None):
            """Edicoes da camada (da selecionada, se nao disser qual)."""
            return js("c => ED.doc.entrada(c || undefined)", caminho)

        def centro(seletor):
            b = arte.locator(seletor).bounding_box()
            return b["x"] + b["width"] / 2, b["y"] + b["height"] / 2

        abrir(ARTE)
        ok("abre a arte ligada e le o tamanho e as paginas", js("!!ED.S.lib && ED.S.larg === 1080 && ED.S.alt === 1350 && ED.S.total === 1"), str(js("[ED.S.larg, ED.S.alt, ED.S.total]")))

        def t_editar():
            pg.click("#btnEditar"); quieto()
            ok("Editar liga e abre os paineis", js("ED.S.editando && document.querySelectorAll('#pn-camadas .cam').length >= 6 && getComputedStyle(document.getElementById('dir')).display !== 'none'"))
        tentar("Editar liga e abre os paineis", t_editar)

        def t_selecionar():
            arte.locator(".titulo").click(position={"x": 30, "y": 30}); quieto()
            ok("clicar na arte seleciona", js("ED.S.selCaminho !== null && ED.S.sel.classList.contains('titulo')") and "titulo" in pg.inner_text("#selNome"), pg.inner_text("#selNome"))
        tentar("clicar na arte seleciona", t_selecionar)

        def t_setas():
            for _ in range(3):
                pg.keyboard.press("ArrowRight")
            quieto()
            a = e().get("x")
            pg.keyboard.press("Control+z"); quieto(); b = e().get("x")
            pg.keyboard.press("Control+Shift+z"); quieto(); c = e().get("x")
            ok("setas movem; Ctrl+Z desfaz; Ctrl+Shift+Z refaz", a == 3 and b is None and c == 3 and pg.input_value("#inX") == "3", f"{a} {b} {c}")
        tentar("setas / desfazer / refazer", t_setas)

        def t_arrastar():
            x, y = centro(".titulo")
            pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 20, y + 10, steps=4); pg.mouse.move(x + 40, y + 24, steps=4); pg.mouse.up(); quieto()
            d = e()
            esperado = 3 + 40 / js("ED.S.escala")
            ok("arrastar move na escala certa", abs(d.get("x", 0) - esperado) <= 2 and d.get("y", 0) > 10, f"{d} esperado x≈{esperado:.0f}")
            tr = arte.locator(".titulo").evaluate("el => el.style.translate")
            ok("o movimento aparece na arte (translate)", tr.startswith(str(d.get("x"))), tr)
        tentar("arrastar", t_arrastar)

        def t_campos_e_teclas():
            # campo de numero: clicar e arrastar para os lados muda o valor (um passo so do desfazer)
            x0 = e().get("x", 0)
            b = pg.locator("#inX").bounding_box()
            cx, cy = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
            pg.mouse.move(cx, cy); pg.mouse.down(); pg.mouse.move(cx + 3, cy); pg.mouse.move(cx + 13, cy, steps=2); pg.mouse.move(cx + 28, cy, steps=3); pg.mouse.up(); quieto()
            x1 = e().get("x", 0)
            pg.keyboard.press("Control+z"); quieto()
            ok("arrastar dentro do campo de numero muda o valor (e desfaz de uma vez)", x1 == x0 + 25 and e().get("x", 0) == x0
               and js("document.activeElement.id") != "inX", f"{x0} {x1} {e().get('x')}")
            pg.locator("#inX").click(); quieto()
            ok("um clique simples no campo continua servindo para digitar", js("document.activeElement.id") == "inX")
            pg.locator("#inX").blur()
            # arrastar na arte com Shift: so anda no eixo em que o mouse andou mais
            d0 = e()
            x, y = centro(".titulo")
            pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 6, y + 2)
            pg.keyboard.down("Shift"); pg.mouse.move(x + 30, y + 8, steps=3); pg.mouse.move(x + 50, y + 14, steps=3); pg.mouse.up(); pg.keyboard.up("Shift"); quieto()
            d1 = e()
            ok("Shift ao arrastar trava no eixo", d1.get("x", 0) > d0.get("x", 0) + 50 and d1.get("y", 0) == d0.get("y", 0) and js("ED.S.selPaths.length") == 1, f"{d0} {d1}")
            pg.keyboard.press("Control+z"); quieto()
            pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 6, y)
            pg.keyboard.down("Alt"); pg.mouse.move(x + 46, y, steps=4); pg.mouse.up(); pg.keyboard.up("Alt"); quieto()
            d2 = e()
            esperado = (6 + 40 * 0.25) / js("ED.S.escala")
            ok("Alt ao arrastar anda 4x mais devagar", abs(d2.get("x", 0) - d0.get("x", 0) - esperado) <= 2, f"{d2.get('x', 0) - d0.get('x', 0)} esperado≈{esperado:.0f}")
            pg.keyboard.press("Control+z"); quieto()
        tentar("campos que arrastam e teclas do mouse", t_campos_e_teclas)

        def t_alcas():
            def puxar(h, dx, dy, tecla=None):
                b = pg.locator(f'#caixaSel .alca[data-h="{h}"]').bounding_box()
                x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
                pg.mouse.move(x, y); pg.mouse.down()
                if tecla:
                    pg.keyboard.down(tecla)
                pg.mouse.move(x + dx / 2, y + dy / 2, steps=3); pg.mouse.move(x + dx, y + dy, steps=3); pg.mouse.up()
                if tecla:
                    pg.keyboard.up(tecla)
                quieto(150)
            caixa = lambda: arte.locator(".titulo").bounding_box()  # noqa: E731
            arte.locator(".titulo").click(position={"x": 30, "y": 30}); quieto()
            ok("a caixa de selecao mostra 8 alcas e a de girar", pg.locator("#caixaSel .alca:visible").count() == 9)
            c0, d0 = caixa(), e()
            puxar("1,1", 60, 60 * c0["height"] / c0["width"])           # canto de baixo a direita, na diagonal
            c1, d1 = caixa(), e()
            f = (c0["width"] + 60) / c0["width"]
            ok("canto: aumenta por igual e o canto oposto nao sai do lugar", abs(d1.get("s", 1) / d0.get("s", 1) - f) < 0.02
               and abs(c1["x"] - c0["x"]) < 1.5 and abs(c1["y"] - c0["y"]) < 1.5 and "sx" not in d1, f"{d1.get('s')} esperado≈{f:.3f} {c0} {c1}")
            pg.keyboard.press("Control+z"); quieto(200)
            puxar("1,0", 50, 0)                                          # lado direito
            c2, d2 = caixa(), e()
            ok("lado: estica so a largura (a altura e o lado esquerdo ficam)", abs(d2.get("sx", 1) - (c0["width"] + 50) / c0["width"]) < 0.02 and "sy" not in d2
               and d2.get("s") == d0.get("s") and abs(c2["x"] - c0["x"]) < 1.5 and abs(c2["height"] - c0["height"]) < 1 and pg.input_value("#inSX") != "100", f"{d2} {c0} {c2}")
            pg.keyboard.press("Control+z"); quieto(200)
            puxar("giro", 80, 0, "Shift")                                # bolinha de girar, com Shift (de 15 em 15 graus)
            r = e().get("r", 0)
            ok("bolinha: gira o elemento (Shift = de 15 em 15 graus) e a caixa gira junto", r > 0 and r % 15 == 0
               and pg.locator("#caixaSel").evaluate("el => el.style.rotate") == f"{r}deg", str(r))
            pg.keyboard.press("Control+z"); quieto(200)
            ok("desfazer devolve tudo", e() == d0 and abs(caixa()["width"] - c0["width"]) < 0.5, f"{e()} {d0}")
        tentar("alcas da caixa de selecao", t_alcas)

        def t_rapida():
            post = arte.locator("#post").bounding_box()
            arte.locator(".selo").click(); quieto()
            ok("a barra rapida aparece no modo de edicao", pg.locator("#rapida").is_visible() and not pg.is_disabled('#rapida [data-al="esq"]')
               and pg.locator("#rapida [data-al] svg").count() == 6)
            pg.click('#rapida [data-al="esq"]'); quieto()
            b1 = arte.locator(".selo").bounding_box()
            pg.click('#rapida [data-al="base"]'); quieto()
            b2 = arte.locator(".selo").bounding_box()
            ok("alinhar na arte: esquerda e base", abs(b1["x"] - post["x"]) < 1 and abs(b2["y"] + b2["height"] - post["y"] - post["height"]) < 1, f"{post} {b1} {b2}")
            pg.keyboard.press("Control+z"); quieto(); pg.keyboard.press("Control+z"); quieto()
            pg.locator("#rpO").evaluate("el => { el.value = 40; el.dispatchEvent(new Event('input', { bubbles: true })); }"); quieto()
            ok("opacidade pela barra", e().get("o") == 0.4 and pg.input_value("#rpOn") == "40", str(e()))
            pg.locator("#rpO").blur()
            pg.keyboard.press("Control+z"); quieto()
            # travar: o clique na arte passa pela camada
            arte.locator(".b1").click(); quieto()
            cb1 = js("ED.S.selCaminho")
            pg.click("#rpTrava"); quieto()
            arte.locator(".selo").click(); quieto()
            arte.locator(".b1").click(); quieto()
            passou = js("ED.S.selCaminho")
            arte.locator(".b1").click(modifiers=["Control"]); quieto()
            ok("camada travada: o clique passa por ela; Ctrl+clique seleciona", e(cb1).get("trava") is True and passou != cb1 and js("ED.S.selCaminho") == cb1
               and pg.locator("#pn-camadas .cam.travada").count() == 1 and "Destravar" in pg.inner_text("#rpTrava"), f"{passou} {cb1}")
            pg.locator("#pn-camadas .cam.travada .cadeado").click(); quieto()
            ok("o cadeado da lista de camadas destrava", "trava" not in e(cb1) and pg.locator("#pn-camadas .cam.travada").count() == 0)
            # botao direito na arte: menu da camada
            arte.locator(".pilula").click(button="right"); quieto()
            n = pg.locator(".menu button").count()
            pg.locator(".menu button", has_text="Esconder").click(); quieto()
            ok("botao direito na arte abre o menu da camada", n >= 6 and js("ED.S.sel.className") == "pilula" and e().get("oculto") is True, f"{n} {e()}")
            pg.keyboard.press("Control+z"); quieto()
            # Alt + roda: alterna entre os elementos embaixo do mouse (a palavra amarela e o titulo)
            x, y = centro(".titulo em")
            pilha = js("([x, y]) => { const m = document.getElementById('moldura').getBoundingClientRect(); return ED.acoes.sobOPonto((x - m.left) / ED.S.escala, (y - m.top) / ED.S.escala).map(el => el.tagName); }", [x, y])
            pg.mouse.move(x, y); pg.keyboard.down("Alt")
            pg.mouse.wheel(0, 100); quieto(); a1 = js("ED.S.sel.tagName")
            pg.mouse.wheel(0, 100); quieto(); a2 = js("ED.S.sel.tagName")
            pg.keyboard.up("Alt")
            ok("Alt + roda alterna entre os elementos embaixo do mouse", len(pilha) >= 2 and "EM" in pilha and [a1, a2] == pilha[:2], f"{a1} {a2} {pilha}")
            arte.locator(".titulo").click(position={"x": 30, "y": 30}); quieto()
        tentar("barra rapida, travar e botao direito", t_rapida)

        def t_config():
            arte.locator(".selo").click(); quieto()
            pg.keyboard.press("h"); quieto()
            escondeu = e().get("oculto") is True
            pg.keyboard.press("h"); quieto()
            pg.keyboard.press("2"); quieto()
            aba2 = js("ED.S.abaEsq")
            pg.keyboard.press("1"); quieto()
            ok("atalhos novos: H esconde/mostra, 1 e 2 trocam de aba", escondeu and "oculto" not in e() and aba2 == "efeitos" and js("ED.S.abaEsq") == "transformar")
            # tela de Config: trocar a tecla de "Esconder / mostrar" para X
            pg.click("#btnConfig"); quieto()
            ok("a tela de Config lista os comandos e as teclas do mouse", pg.locator("#config").is_visible() and pg.locator("#cfgTeclas .cfg-linha").count() >= 25
               and pg.locator("#cfgMods select").count() == 10 and pg.inner_text('#cfgTeclas .cfg-linha[data-id="salvar"] .tecla') == "Ctrl + S")
            pg.keyboard.press("h"); quieto()
            parado = "oculto" not in e()                     # com a tela aberta os atalhos nao disparam
            pg.click('#cfgTeclas .cfg-linha[data-id="esconder"] [data-acao="capturar"]'); pg.keyboard.press("x"); quieto()
            pg.click('#cfgTeclas .cfg-linha[data-id="travar"] [data-acao="capturar"]'); pg.keyboard.press("h"); quieto()   # H era do Esconder (ja trocado): fica com o Travar
            pg.click('#cfgTeclas .cfg-linha[data-id="tras"] [data-acao="capturar"]'); pg.keyboard.press("x"); quieto()      # X era do Esconder: ele perde o atalho
            recado = pg.inner_text("#cfgRecado")
            teclas = [pg.inner_text(f'#cfgTeclas .cfg-linha[data-id="{i}"] .tecla') for i in ("esconder", "travar", "tras")]
            ok("trocar a tecla; quem usava a tecla escolhida fica sem atalho (e a tela avisa)", parado and teclas == ["—", "H", "X"] and "Esconder" in recado, f"{teclas} {recado}")
            # teclas do mouse: "travar no eixo" passa para o Ctrl (e "soltar o ima" troca com ele, indo para o Shift)
            pg.select_option('#cfgMods select[data-papel="eixo"]', "ctrl"); quieto()
            ok("trocar uma tecla do mouse troca de lugar com a que usava ela", js("[ED.config.modDe('eixo'), ED.config.modDe('semIma'), ED.config.modDe('devagar')]") == ["ctrl", "shift", "alt"])
            pg.keyboard.press("Escape"); quieto()
            pg.keyboard.press("h"); quieto()
            travou = e().get("trava") is True and "oculto" not in e()
            pg.keyboard.press("h"); quieto()
            d0 = e()
            x, y = centro(".selo")
            pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 6, y + 2)
            pg.keyboard.down("Control"); pg.mouse.move(x + 30, y + 8, steps=3); pg.mouse.move(x + 50, y + 14, steps=3); pg.mouse.up(); pg.keyboard.up("Control"); quieto()
            d1 = e()
            ok("as teclas novas valem na hora (H trava; Ctrl trava o eixo ao arrastar)", not pg.locator("#config").is_visible() and travou
               and d1.get("x", 0) > d0.get("x", 0) + 50 and d1.get("y", 0) == d0.get("y", 0), f"{travou} {d0} {d1}")
            pg.keyboard.press("Control+z"); quieto()
            # as escolhas ficam guardadas no navegador; "voltar tudo ao padrao" limpa
            guardado = js("JSON.parse(localStorage.getItem('afe:config'))")
            pg.click("#btnConfig"); quieto()
            pg.click("#cfgPadrao"); quieto()
            ok("fica guardado no navegador; 'voltar tudo ao padrao' desfaz", guardado["teclas"] == {"esconder": "", "travar": "h", "tras": "x"} and guardado["mods"] == {"eixo": "ctrl", "semIma": "shift"}
               and js("localStorage.getItem('afe:config')") is None and pg.inner_text('#cfgTeclas .cfg-linha[data-id="esconder"] .tecla') == "H", str(guardado))
            pg.click("#cfgFechar"); quieto()
            arte.locator(".titulo").click(position={"x": 30, "y": 30}); quieto()
        tentar("config: atalhos e teclas do mouse", t_config)

        def t_varios():
            arte.locator(".selo").click(modifiers=["Shift"]); quieto()
            n = js("ED.S.selPaths.length")
            antes = js("ED.S.selPaths.map(c => ED.doc.entrada(c).y || 0)")
            pg.keyboard.press("ArrowDown"); quieto()
            depois = js("ED.S.selPaths.map(c => ED.doc.entrada(c).y || 0)")
            ok("Shift+clique soma a selecao e a seta move todos", n == 2 and all(b - a == 1 for a, b in zip(antes, depois)), f"{n} {antes} {depois}")
            ok("contorno tracejado no segundo selecionado", js("[...document.querySelectorAll('#caixasExtra .caixa')].filter(c => c.style.display === 'block').length") == 1)
        tentar("selecao multipla", t_varios)

        def t_texto():
            arte.locator(".apoio").click(); quieto()
            arte.locator(".apoio").dblclick(position={"x": 60, "y": 20}); quieto()
            pg.keyboard.press("End"); pg.keyboard.type(" OK"); pg.keyboard.press("Escape"); quieto(200)
            h = e().get("html", "")
            ok("duplo clique edita o texto", "OK" in h and "OK" in arte.locator(".apoio").inner_text() and js("ED.S.editTexto === null"), h)
            pg.keyboard.press("Control+z"); quieto(200)
            ok("desfazer devolve o texto original", "OK" not in arte.locator(".apoio").inner_text() and "html" not in e())
            pg.keyboard.press("Control+y"); quieto(200)
        tentar("texto", t_texto)

        def t_efeitos():
            arte.locator(".b1").click(); quieto()
            pg.click('.abas[data-lado="esq"] [data-aba="efeitos"]'); quieto()
            n = pg.locator('#pn-efeitos .camada[data-parte="filtro"]').count()
            campo = pg.locator('#pn-efeitos .camada[data-parte="filtro"] input[data-k="b"]').first
            campo.fill("80"); quieto()
            f = e().get("filtro", "")
            ok("aba Efeitos le o glow e grava a mudanca", n == 1 and "80px" in f and campo.evaluate("el => el === document.activeElement"), f"{n} {f}")
            pg.locator('#pn-efeitos input[data-k="brightness"]').evaluate(
                "el => { el.value = 140; el.dispatchEvent(new Event('input', { bubbles: true })); }"); quieto()
            f = e().get("filtro", "")
            ok("ajuste de imagem entra ANTES da sombra (ordem do filtro preservada)", f.index("brightness(140%)") < f.index("drop-shadow"), f)
            sat = pg.locator('#pn-efeitos input[data-k="saturate"]')
            sat.evaluate("el => { el.value = 240; el.dispatchEvent(new Event('input', { bubbles: true })); }"); quieto()
            tinha = "saturate(240%)" in e().get("filtro", "")
            sat.dblclick(); quieto()
            f = e().get("filtro", "")
            ok("duplo clique num slider volta ao valor padrao", tinha and sat.input_value() == "100" and "saturate(240%)" not in f and "saturate(150%)" not in f
               and "brightness(140%)" in f and "padrão" in sat.get_attribute("title"), f)
            pg.click('#pn-efeitos button[data-acao="mais"][data-parte="caixa"]'); quieto()
            ok("+ camada cria sombra da caixa", "csombra" in e() and pg.locator('#pn-efeitos .camada[data-parte="caixa"]').count() == 1)
        tentar("efeitos", t_efeitos)

        def t_forma():
            arte.locator(".painel").click(); quieto()
            pg.click('.abas[data-lado="esq"] [data-aba="forma"]'); quieto()
            pg.select_option('#pn-forma select[data-g="stroke"]', "gradiente"); quieto()
            d = e()
            ok("contorno em gradiente (borda transparente + 2 fundos)", d.get("bd", "").endswith("solid transparent") and "border-box" in d.get("bg", "") and "raio" not in d, str({k: d.get(k) for k in ("bd", "bg", "raio")}))
            pg.locator('#pn-forma input[type=number][data-k="raio"]').fill("60"); quieto()
            ok("arredondamento so e gravado quando mexe nele", e().get("raio") == 60 and arte.locator(".painel").evaluate("el => getComputedStyle(el).borderTopLeftRadius") == "60px")
            pg.locator('#pn-forma input[type=range][data-k="raio"]').dblclick(); quieto(200)
            ok("duplo clique em 'Cantos' volta ao arredondamento da arte", "raio" not in e() and arte.locator(".painel").evaluate("el => getComputedStyle(el).borderTopLeftRadius") == "28px"
               and pg.locator('#pn-forma input[type=number][data-k="raio"]').input_value() == "28", str(e().get("raio")))
        tentar("forma", t_forma)

        def t_camadas():
            pg.click('.abas[data-lado="dir"] [data-aba="camadas"]'); quieto()
            sel = js("ED.S.selCaminho")
            linha = pg.locator("#pn-camadas .cam", has_text="AFE")
            linha.locator(".olho").click(); quieto()
            c = linha.get_attribute("data-c")
            ok("o olho esconde a camada sem mudar a selecao", e(c).get("oculto") is True and arte.locator(".pilula").evaluate("el => el.style.visibility") == "hidden" and js("ED.S.selCaminho") == sel)
            ok("a arte da nome as camadas (data-nome)", pg.locator("#pn-camadas .cam", has_text="Bolha ciano").count() == 1)
        tentar("camadas", t_camadas)

        def t_assets():
            pg.click('.abas[data-lado="dir"] [data-aba="assets"]'); quieto(300)
            pg.click('#listaAssets .tile[data-tipo="retangulo"]'); quieto(200)
            pg.click('#listaAssets .tile[data-tipo="circulo"]'); quieto(200)
            novos = js("ED.doc.pag()._novos.map(n => n.id)")
            ok("clicar num asset cria o item (com id proprio) e seleciona", novos == ["n1", "n2"] and js("ED.S.selCaminho") == "#n2" and arte.locator("[data-ed-id]").count() == 2, str(novos))
            pg.click('.abas[data-lado="esq"] [data-aba="forma"]'); quieto()
            pg.select_option('#pn-forma select[data-g="fill"]', "cor"); quieto()
            ok("mexer na Forma do circulo nao estraga o circulo (raio em %)", "raio" not in e() and arte.locator('[data-ed-id="n2"]').evaluate("el => getComputedStyle(el).borderTopLeftRadius") == "50%")
            arte.locator('[data-ed-id="n1"]').click(position={"x": 12, "y": 12}); quieto()
            pg.keyboard.press("ArrowLeft"); quieto()
            pg.keyboard.press("Delete"); quieto(200)
            ok("Delete apaga o item e as edicoes dele; o outro continua", js("ED.doc.pag()._novos.map(n => n.id)") == ["n2"] and "#n1" not in js("Object.keys(ED.doc.pag())") and "#n2" in js("Object.keys(ED.doc.pag())"))
            pg.keyboard.press("Control+z"); quieto(200)
            ok("desfazer traz o item de volta", arte.locator("[data-ed-id]").count() == 2)
        tentar("assets", t_assets)

        def t_biblioteca():
            pg.click('.abas[data-lado="dir"] [data-aba="assets"]'); quieto(300)
            tile = pg.locator('#listaAssets .tile[data-bib="Marca"]')
            ok("a biblioteca aparece na aba Assets, junto das imagens da arte", tile.count() == 1
               and pg.locator('#listaAssets .tile[data-src="assets/real.png"]').count() == 1 and pg.locator('#listaAssets .tile[data-src*="rovisorio"]').count() == 0)
            tile.click(); quieto(500)
            novo = js("ED.doc.pag()._novos.slice(-1)[0]")
            copia = pasta / "assets" / "biblioteca" / "Marca" / "Fundos" / "fundo teste.png"
            ok("usar um asset da biblioteca copia a imagem para a pasta da arte", novo.get("src") == "assets/biblioteca/Marca/Fundos/fundo teste.png"
               and copia.is_file() and arte.locator("[data-ed-id]").count() == 3
               and arte.locator('[data-ed-id="n3"]').evaluate("el => el.naturalWidth") == 1, str(novo))
            tile.click(); quieto(500)
            ok("usar de novo aproveita a mesma copia", len(list(copia.parent.iterdir())) == 1 and arte.locator("[data-ed-id]").count() == 4)
            pg.keyboard.press("Control+z"); quieto(200)
            pg.keyboard.press("Control+z"); quieto(200)
        tentar("biblioteca de assets", t_biblioteca)

        def t_pecas():
            cartao = pg.locator('#listaPecas .peca[data-nome="Selo"]')
            ok("as pecas aparecem na aba Assets, por grupo", cartao.count() == 1 and "Elementos (1)" in pg.locator("#listaPecas summary").text_content())
            pg.click("#listaPecas summary"); quieto(200)
            cartao.click()
            pg.wait_for_function("(() => { const d = document.getElementById('pecaQuadro').contentDocument; return d && d.readyState === 'complete' && d.querySelector('.mk-selo'); })()", timeout=10000)
            quieto(300)
            previa = pg.frame_locator("#pecaQuadro")
            ok("a janela da peca mostra a previa (com o CSS da marca) e as instrucoes", pg.locator("#pecas").is_visible() and "Você fornece" in pg.inner_text("#pecaLeia")
               and previa.locator(".mk-selo").first.evaluate("el => getComputedStyle(el).backgroundColor") == "rgb(255, 0, 80)" and pg.is_disabled("#pecaPor"))
            previa.locator(".mk-selo").first.click(); quieto()
            trilha = pg.locator("#pecaTrilha button").all_inner_texts()
            ok("clicar num pedaco escolhe; a trilha mostra os niveis (sem as classes de arrumacao)", trilha == ["mk-caixa", "mk-selo"] and not pg.is_disabled("#pecaPor"), str(trilha))
            # pecas dificeis: a previa ajusta a classe da marca, a peca ignora o mouse e tem recorte; camadas empilhadas
            previa.locator(".mk-traco").click(); quieto()
            t2 = pg.locator("#pecaTrilha button").all_inner_texts()
            caixa = previa.locator(".ed-pick-caixa").last.evaluate("el => getComputedStyle(el).display")
            ok("peca que a previa ajusta / que ignora o mouse / com recorte tambem se escolhe, com o destaque por cima", t2 == ["mk-caixa", "mk-traco"] and caixa == "block", str(t2) + caixa)
            previa.locator(".mk-fio").last.click(); quieto()
            t3 = pg.locator("#pecaTrilha button").all_inner_texts()
            ok("camadas empilhadas: o clique pega o conjunto", t3 == ["mk-caixa", "mk-neon"], str(t3))
            # previa sem classe da marca (um desenho solto): pega o desenho inteiro e ele entra com o tamanho certo
            previa.locator("svg rect").click(); quieto()
            t4 = pg.locator("#pecaTrilha button").all_inner_texts()
            pg.click("#pecaPor"); quieto(600)
            item = js("ED.doc.pag()._novos.slice(-1)[0]")
            caixa = arte.locator('[data-ed-id="n3"] svg').evaluate("el => { const r = el.getBoundingClientRect(), k = el.ownerDocument.defaultView.ED_ESCALA || 1; return [el.clientWidth, el.clientHeight, getComputedStyle(el.querySelector('rect')).fill]; }")
            ok("desenho sem classe da marca: escolhe o svg inteiro e entra na arte com o tamanho e as cores da previa", t4[-1] == "svg" and item["html"].startswith("<svg") and item.get("w") == 200
               and caixa == [200, 100, "rgb(0, 120, 200)"], str(t4) + str(caixa) + str(item)[:200])
            pg.keyboard.press("Control+z"); quieto(300)
            cartao.click()
            pg.wait_for_function("(() => { const d = document.getElementById('pecaQuadro').contentDocument; return d && d.readyState === 'complete' && d.querySelector('.ed-pick-caixa'); })()", timeout=10000)
            quieto(300)
            previa.locator(".mk-selo").first.click(); quieto()
            pg.click("#pecaPor"); quieto(600)
            item = js("ED.doc.pag()._novos.slice(-1)[0]")
            copia_css = pasta / "assets" / "biblioteca" / "Marca" / "css"
            el = arte.locator('[data-ed-id="n3"] .mk-selo')
            ok("'Por na arte' insere o pedaco como item, com o CSS da marca copiado para a arte", item["tipo"] == "html" and "Novo" in item["html"] and "ed-pick" not in item["html"]
               and item["css"] == ["assets/biblioteca/Marca/css/tokens.css", "assets/biblioteca/Marca/css/components-bundle.css"]
               and el.evaluate("el => getComputedStyle(el).backgroundColor") == "rgb(255, 0, 80)" and not pg.locator("#pecas").is_visible(), str(item)[:300])
            ok("o CSS copiado nao busca nada na internet; a peca herda a fonte e a cor da previa", "@import" not in (copia_css / "tokens.css").read_text(encoding="utf-8")
               and "--mk-cor" in (copia_css / "tokens.css").read_text(encoding="utf-8") and "Georgia" in item["contexto"]["fontFamily"] and item["contexto"]["color"] == "rgb(10, 20, 30)"
               and arte.locator("link[data-ed-css]").first.evaluate("el => el === document.head.firstElementChild")
               and js("[...ED.S.d.querySelectorAll('link[data-ed-css]')].map(l => l.dataset.edCss)") == item["css"])
            # um nivel acima (a caixa inteira, com a imagem): pela trilha
            cartao.click()
            pg.wait_for_function("(() => { const d = document.getElementById('pecaQuadro').contentDocument; return d && d.readyState === 'complete' && d.querySelector('.mk-selo'); })()", timeout=10000)
            quieto(300)
            previa.locator(".mk-selo").first.click(); quieto()
            pg.locator("#pecaTrilha button").first.click(); quieto()
            pg.click("#pecaPor"); quieto(600)
            item = js("ED.doc.pag()._novos.slice(-1)[0]")
            ok("subir de nivel pela trilha: a caixa vai inteira, com a imagem copiada e as regras de arrumacao", 'src="assets/biblioteca/Marca/Fundos/fundo teste.png"' in item["html"]
               and item.get("w", 0) > 300 and ".row" in item.get("estilo", "") and arte.locator('[data-ed-id="n4"] .row').evaluate("el => getComputedStyle(el).display") == "flex"
               and arte.locator('[data-ed-id="n4"] img').evaluate("el => el.naturalWidth") == 1 and "Selo" in pg.inner_text("#selNome"), str(item)[:400])
            pg.keyboard.press("Control+z"); quieto(300)
            pg.keyboard.press("Control+z"); quieto(300)
            ok("desfazer tira as pecas", arte.locator("[data-ed-id]").count() == 2)
        tentar("pecas do design system", t_pecas)

        def t_alcas_item():
            # forma acrescentada: as alcas mudam a largura/altura de verdade (nao esticam)
            arte.locator('[data-ed-id="n1"]').click(position={"x": 12, "y": 12}); quieto()
            item = lambda: js("ED.doc.pag()._novos.find(n => n.id === 'n1')")  # noqa: E731
            i0, k = item(), js("ED.S.escala")
            b = pg.locator('#caixaSel .alca[data-h="1,0"]').bounding_box()
            x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
            pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 20, y, steps=3); pg.mouse.move(x + 40, y, steps=3); pg.mouse.up(); quieto(300)
            i1 = item()
            ok("numa forma acrescentada, a alca muda a largura de verdade", abs(i1["w"] - (i0["w"] + 40 / k)) <= 2 and i1["h"] == i0["h"] and i1["left"] == i0["left"]
               and "sx" not in e() and arte.locator('[data-ed-id="n1"]').evaluate("el => el.offsetWidth") == i1["w"], f"{i0} {i1}")
            pg.keyboard.press("Control+z"); quieto(300)
            ok("e um Ctrl+Z desfaz", item() == i0, str(item()))
        tentar("alcas num item acrescentado", t_alcas_item)

        def t_animacao():
            pg.click("#btnAnimar"); quieto()
            arte.locator(".b2").click(); quieto()
            pg.click("#btnKf"); quieto()
            js("ED.tempo.irPara(1)"); quieto()
            for _ in range(5):
                pg.keyboard.press("ArrowUp")
            quieto()
            kf = e().get("kf", [])
            ok("◆ Chave grava; mexer em outro frame cria a chave sozinho", len(kf) == 2 and kf[0]["t"] == 0 and kf[1] == {"t": 1, "x": 0, "y": -5}, str(kf)[:200])
            ok("o valor 'parado' da camada nao muda (so as chaves)", "y" not in e() and "x" not in e())
            js("ED.tempo.irPara(0.5)"); quieto()
            y = js("ED.doc.atual('y')")
            ok("no meio do caminho o valor fica entre as duas chaves", -5 < y < 0, str(y))
            pg.click('.abas[data-lado="esq"] [data-aba="transformar"]'); quieto()
            pg.locator("#inOculto").check(); quieto()
            ok("mudar algo que nao anima NAO cria chave vazia", len(e().get("kf", [])) == 2 and e().get("oculto") is True)
            pg.locator("#inOculto").uncheck(); quieto()
            ok("a folha de keyframes mostra as chaves", pg.locator("#folha .fl.el .losango").count() == 2 and pg.inner_text("#cabecaNum") == "15")
            pg.locator("#folha .fl.el .losango").nth(1).click(); quieto()
            ok("clicar no losango leva a cabeca ao frame", pg.inner_text("#cabecaNum") == "30" and "frame 30" in pg.inner_text("#tempoTxt"))
            pg.keyboard.press("Delete"); quieto(200)
            ok("Delete apaga a chave marcada", len(e().get("kf", [])) == 1)
            pg.keyboard.press("Control+z"); quieto(200)
            pg.click('.abas[data-lado="esq"] [data-aba="animacao"]'); quieto()
            pg.select_option("#selPreset", "flutuar"); quieto(300)
            tocando = js("ED.S.tocando")
            pg.keyboard.press(" "); quieto()
            ok("efeito continuo entra, toca sozinho e o espaco pausa", len(e().get("anim", [])) == 1 and tocando and not js("ED.S.tocando") and pg.locator("#presets .chip").count() == 1)
            # os efeitos novos (v2.1): cada um mexe no que promete e fecha o loop (fim == comeco)
            r = js("""(() => { const L = ED.S.lib, c = ED.S.selCaminho, n = ED.S.pagina, dur = L.duracao ? L.duracao(n, ED.S.edicoes) : 5, sai = {};
              for (const [tipo, int, k] of [['balancar', 6, 'r'], ['orbita', 12, 'x'], ['quique', 24, 'y'], ['coracao', 8, 's'], ['estrobo', 60, 'o'], ['glitch-rgb', 6, 'filtro']]) {
                const ed = { [n]: { _dur: dur, [c]: { anim: [{ tipo, int, vel: 2 }] } } }, base = { o: 1, filtro: 'none' };
                const em = (t) => L.valores(n, c, t, ed, base)[k];
                const vals = []; for (let i = 0; i <= 200; i++) vals.push(em(dur * i / 200));
                const num = (x) => (typeof x === 'number' ? x : x ? 1 : 0);
                sai[tipo] = { fecha: typeof vals[0] === 'number' ? Math.abs(vals[0] - vals[200]) < 1e-6 : vals[0] === vals[200],
                  mexe: new Set(vals.map((x) => (typeof x === 'number' ? x.toFixed(3) : String(x)))).size > 3, min: Math.min(...vals.map(num)), max: Math.max(...vals.map(num)) };
              }
              return sai; })()""")
            ok("efeitos continuos novos: mexem e fecham o loop", all(x["fecha"] and x["mexe"] for x in r.values())
               and abs(r["balancar"]["max"] - 6) < 0.1 and r["quique"]["max"] <= 0.001 and r["quique"]["min"] < -23 and 1.07 < r["coracao"]["max"] < 1.09
               and 0.39 < r["estrobo"]["min"] < 0.45, str(r))
            pg.select_option("#selPreset", "quique"); quieto(300)
            ok("o menu tem os efeitos novos e cada um entra com a sua velocidade", pg.locator("#selPreset option").count() >= 13 and e()["anim"][-1] == {"tipo": "quique", "int": 24, "vel": 4}, str(e().get("anim")))
            pg.keyboard.press("Control+z"); quieto(200)
            if js("ED.S.tocando"): pg.keyboard.press(" "); quieto()
            pg.select_option("#selMb", "0.5"); quieto(200)
            mb1 = js("ED.doc.pag()._mb")
            pg.select_option("#selMb", "0"); quieto(200)
            ok("motion blur: escolhido por pagina, 'sem' nao fica gravado", mb1 == 0.5 and "_mb" not in js("ED.doc.pag()"), str(mb1))
        tentar("animacao", t_animacao)

        def t_tela():
            alt = js("document.querySelector('main').getBoundingClientRect().height")
            pg.click("#btnMini"); quieto()
            mini = js("getComputedStyle(document.getElementById('folha')).display === 'none' && getComputedStyle(document.getElementById('linhaTempo')).display !== 'none' && document.querySelector('main').getBoundingClientRect().height")
            pg.click("#btnMini"); quieto()
            ok("minimizar a linha do tempo esconde a folha e da mais espaco a arte", bool(mini) and mini > alt + 100 and js("getComputedStyle(document.getElementById('folha')).display") == "block", f"{alt} {mini}")
            larg = js("document.querySelector('main').getBoundingClientRect().width")
            pg.click("#btnEsq"); quieto()
            sem = js("getComputedStyle(document.getElementById('esq')).display === 'none' && document.querySelector('main').getBoundingClientRect().width")
            pg.click("#btnEsq"); quieto()
            ok("fechar o painel da esquerda da mais espaco a arte", bool(sem) and sem > larg + 100 and js("getComputedStyle(document.getElementById('esq')).display") == "flex", f"{larg} {sem}")
        tentar("organizacao da tela", t_tela)

        def t_chaves():
            los = pg.locator("#folha .fl.el .losango")
            quadros = lambda: js("(ED.doc.entrada().kf || []).map(k => Math.round(k.t * 30))")  # noqa: E731

            def arrastar(losango, dx):
                b = losango.bounding_box()
                x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
                pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + dx / 2, y, steps=3); pg.mouse.move(x + dx, y, steps=3); pg.mouse.up(); quieto(200)

            # curva (easing)
            ok("a biblioteca da arte conhece as curvas", js("ED.S.lib.versao >= ED.arte.LIB_ATUAL && ED.S.lib.curvas.length") == 7)
            los.nth(1).click(); quieto()
            ok("clicar no losango marca a chave e liga o menu de curva", js("ED.folha.chavesMarcadas().length") == 1 and not pg.is_disabled("#btnCurva")
               and pg.get_attribute("#btnCurva", "data-curva") == "suave" and pg.is_disabled("#btnKfColar"))
            los.nth(0).click(); quieto()
            pg.click("#btnCurva"); quieto()
            ok("o menu de curvas mostra um grafico e uma bolinha andando para cada curva", pg.locator(".menu.curvas svg.graf").count() == 7
               and js("[...document.querySelectorAll('.menu .bola')].filter(b => b.getAnimations().length === 1).length") == 7
               and js("document.querySelector('.menu').getBoundingClientRect().bottom <= document.getElementById('btnCurva').getBoundingClientRect().top"))
            pg.locator(".menu button", has_text="Frear").click(); quieto()
            js("ED.tempo.irPara(0.5)"); quieto()
            y, k0 = js("ED.doc.atual('y')"), e()["kf"][0]
            ok("curva 'Frear' vale no trecho que sai da chave (e muda o formato do losango)", k0.get("ease") == "saida" and abs(y + 4.375) < 0.01
               and "c-saida" in los.nth(0).get_attribute("class") and pg.get_attribute("#btnCurva", "data-curva") == "saida"
               and pg.inner_text("#curvaNome") == "Frear" and pg.locator("#curvaGraf svg").count() == 1, f"{k0.get('ease')} {y}")
            los.nth(0).click(button="right"); quieto()
            n = pg.locator(".menu button").count()
            pg.locator(".menu button", has_text="Linear").click(); quieto()
            ok("botao direito no losango abre o menu e troca a curva", n == 10 and e()["kf"][0].get("ease") == "linear" and pg.locator(".menu").count() == 0, f"{n} {e()['kf'][0]}")
            pg.click("#btnCurva"); quieto()
            pg.locator(".menu button", has_text="Suave").click(); quieto()
            ok("a curva padrao nao e gravada no arquivo", "ease" not in e()["kf"][0])

            # copiar e colar
            los.nth(1).click(); quieto()
            pg.keyboard.press("Control+c"); quieto()
            js("ED.tempo.irPara(2)"); quieto()
            pg.keyboard.press("Control+v"); quieto()
            kf = e()["kf"]
            ok("Ctrl+C / Ctrl+V cola a chave no mesmo elemento, onde a cabeca esta", len(kf) == 3 and kf[2] == {"t": 2, "x": 0, "y": -5}, str(kf)[-90:])
            arte.locator(".b1").click(); quieto()
            js("ED.tempo.irPara(1 / 3)"); quieto()
            pg.click("#btnKfColar"); quieto()
            kb = e().get("kf", [])
            ok("colar em outro elemento selecionado", len(kb) == 1 and kb[0].get("y") == -5 and round(kb[0]["t"] * 30) == 10, str(kb))
            pg.keyboard.press("Control+z"); quieto(200)
            ok("desfazer tira a chave colada", "kf" not in e())

            # arrastar: uma chave em cima da outra, e um grupo marcado com Shift
            los.nth(1).click(); quieto()
            js("ED.tempo.irPara(2)"); quieto()
            for _ in range(3):
                pg.keyboard.press("ArrowDown")
            quieto()                                         # a chave do frame 60 passa a valer y = -2
            ppf = js("document.querySelector('#folha .regua .pista').getBoundingClientRect().width / ED.tempo.totalFrames()")
            arrastar(los.nth(1), 30 * ppf)                   # leva a chave do frame 30 para cima da do frame 60
            kf = e()["kf"]
            ok("arrastar uma chave para cima de outra: vale a arrastada", len(kf) == 2 and kf[1]["t"] == 2 and kf[1]["y"] == -5, str(kf)[-90:])
            pg.keyboard.press("Control+z"); quieto(200)
            los.nth(1).click(); quieto()
            los.nth(2).click(modifiers=["Shift"]); quieto()
            ok("Shift+clique marca mais uma chave", js("ED.folha.chavesMarcadas().length") == 2 and pg.locator("#folha .fl.el .losango.marcado").count() == 2)
            arrastar(los.nth(1), 60)
            fr = quadros()
            ok("arrastar move o grupo marcado sem mudar o espacamento", len(fr) == 3 and fr[0] == 0 and fr[1] > 30 and fr[2] - fr[1] == 30
               and pg.locator("#folha .fl.el .losango.marcado").count() == 2, str(fr))
            pg.keyboard.press("Control+z"); quieto(200)
            ok("desfazer devolve o grupo ao lugar (um passo so)", quadros() == [0, 30, 60], str(quadros()))
            los.nth(1).click(); quieto()
            los.nth(2).click(modifiers=["Shift"]); quieto()
            pg.keyboard.press("Delete"); quieto(200)
            ok("Delete apaga todas as chaves marcadas", quadros() == [0], str(quadros()))
            pg.keyboard.press("Control+z"); quieto(200)
        tentar("curvas e copiar/colar de chaves", t_chaves)

        def t_chave_no_campo():
            quadros = lambda: js("(ED.doc.entrada().kf || []).map(k => Math.round(k.t * 30))")  # noqa: E731
            pg.click('.abas[data-lado="esq"] [data-aba="transformar"]'); quieto()
            pg.locator("#folha .fl.el .losango").nth(1).click(); quieto()      # seleciona a bolha (chaves em 0, 30, 60)
            js("ED.tempo.irPara(45 / 30)"); quieto()
            chave = pg.locator('.kfs[data-kf="r"] button[data-d="0"]')
            ok("com o Animar ligado, cada campo tem os botoes de keyframe", chave.is_visible() and chave.inner_text() == "◇" and pg.locator("#pn-transformar .kfs").count() == 5)
            chave.click(); quieto(200)
            k = [x for x in e()["kf"] if round(x["t"] * 30) == 45]
            ok("◇ poe a chave so daquela propriedade neste frame", k == [{"t": 1.5, "r": 0}] and chave.inner_text() == "◆", str(k))
            pg.click('.kfs[data-kf="r"] button[data-d="-1"]'); quieto()
            f_ant = pg.inner_text("#cabecaNum")
            pg.click('.kfs[data-kf="r"] button[data-d="1"]'); quieto()
            ok("‹ › pulam entre as chaves daquela propriedade", f_ant == "0" and pg.inner_text("#cabecaNum") == "45", f"{f_ant} {pg.inner_text('#cabecaNum')}")
            chave.click(); quieto(200)
            ok("◆ tira a chave (as outras continuam)", quadros() == [0, 30, 60] and chave.inner_text() == "◇", str(quadros()))
            pg.click('.abas[data-lado="esq"] [data-aba="animacao"]'); quieto()
        tentar("keyframe ao lado do campo", t_chave_no_campo)

        def t_tempo_camada():
            quadros = lambda c=None: js("c => (ED.doc.entrada(c || undefined).kf || []).map(k => Math.round(k.t * 30))", c)  # noqa: E731
            aparece = lambda sel: arte.locator(sel).evaluate("el => getComputedStyle(el).visibility") == "visible"  # noqa: E731
            ini = lambda: round(e().get("ini", 0) * 30)  # noqa: E731

            def campo(sel, valor):
                pg.locator(sel).evaluate("(el, v) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }", valor); quieto(200)

            def ir(frame):
                js("f => ED.tempo.irPara(f / 30)", frame); quieto()

            def arrastar(x, y, dx):
                pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + dx / 2, y, steps=3); pg.mouse.move(x + dx, y, steps=3); pg.mouse.up(); quieto(200)

            # campos da aba Animacao (a camada selecionada e a bolha magenta, com chaves nos frames 0, 30 e 60)
            pg.locator("#folha .fl.el .losango").nth(1).click(); quieto()
            campo("#inIni", "20")
            ok("'Comeca no frame' move a camada inteira, com as chaves", ini() == 20 and quadros() == [20, 50, 80], f"{ini()} {quadros()}")
            ir(19); antes = aparece(".b2")
            ir(20)
            ok("antes do comeco a camada nao aparece; no frame do comeco, aparece", not antes and aparece(".b2"), f"{antes}")
            campo("#inFim", "60")
            ir(59); a59 = aparece(".b2")
            ir(60); a60 = aparece(".b2")
            ok("'Some no frame' corta o fim sem mexer nas chaves", a59 and not a60 and quadros() == [20, 50, 80] and round(e()["fim"] * 30) == 60, f"{a59} {a60} {quadros()}")
            campo("#inFim", "")
            ok("campo vazio tira o corte do fim", "fim" not in e() and aparece(".b2"))

            # barra da camada na folha
            ppf = js("document.querySelector('#folha .regua .pista').getBoundingClientRect().width / ED.tempo.totalFrames()")
            b = pg.locator("#folha .fl.el .barra-camada").first.bounding_box()
            arrastar(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, 10 * ppf)
            ok("arrastar a barra na folha move a camada e as chaves", ini() == 30 and quadros() == [30, 60, 90], f"{ini()} {quadros()}")
            pg.keyboard.press("Control+z"); quieto(200)
            ok("o arrasto da barra e um passo so do desfazer", ini() == 20 and quadros() == [20, 50, 80], f"{ini()} {quadros()}")
            b = pg.locator("#folha .fl.el .barra-camada .alca.ini").first.bounding_box()
            arrastar(b["x"] + 2, b["y"] + 2, -10 * ppf)
            ok("a ponta da barra corta o comeco sem mexer nas chaves", ini() == 10 and quadros() == [20, 50, 80], f"{ini()} {quadros()}")
            ir(15)
            pg.locator("#folha .fl.el .tr").first.click(button="right"); quieto()
            n = pg.locator(".menu button").count()
            pg.locator(".menu button", has_text="Tirar os cortes").click(); quieto(200)
            ok("botao direito na linha da camada: tirar os cortes", n == 6 and "ini" not in e() and quadros() == [20, 50, 80], f"{n} {e().get('ini')}")
            ir(5)
            ok("sem corte, a camada volta a aparecer desde o comeco", aparece(".b2"))

            # escalonar: bolha magenta, bolha ciano e selo (nessa ordem de clique)
            ir(60)
            arte.locator(".b2").click(); quieto()
            arte.locator(".b1").click(modifiers=["Shift"]); quieto()
            arte.locator(".selo").click(modifiers=["Shift"]); quieto()
            cb2 = js("ED.S.selPaths[0]")
            inis = lambda: js("ED.S.selPaths.map(c => ED.camada.inicioDe(c))")  # noqa: E731
            pg.select_option("#selEscOrdem", "clique"); pg.fill("#inEsc", "8")
            pg.click("#btnEscalonar"); quieto(200)
            ok("Escalonar na ordem do clique: cada camada comeca depois da anterior, com as chaves", inis() == [0, 8, 16] and quadros(cb2) == [20, 50, 80], f"{inis()} {quadros(cb2)}")
            pg.select_option("#selEscOrdem", "leitura"); pg.fill("#inEsc", "4")
            pg.click("#btnEscalonar"); quieto(200)
            ok("Escalonar na ordem de leitura: selo, bolha da esquerda, bolha da direita", inis() == [8, 4, 0] and quadros(cb2) == [28, 58, 88], f"{inis()} {quadros(cb2)}")
            ir(2)
            ok("no frame 2 so o primeiro da fila aparece", aparece(".selo") and not aparece(".b1") and not aparece(".b2"))
            pg.fill("#inEsc", "0")
            pg.click("#btnEscalonar"); quieto(200)
            ok("Escalonar com 0 junta todos de novo (e todos aparecem)", inis() == [0, 0, 0] and quadros(cb2) == [20, 50, 80]
               and aparece(".selo") and aparece(".b1") and aparece(".b2"), f"{inis()} {quadros(cb2)}")
        tentar("tempo da camada e escalonar", t_tempo_camada)

        def t_entradas():
            opac = lambda sel: float(arte.locator(sel).evaluate("el => getComputedStyle(el).opacity"))  # noqa: E731
            ty = lambda sel: arte.locator(sel).evaluate("el => parseFloat((getComputedStyle(el).translate.split(' ')[1]) || 0)")  # noqa: E731

            def ir(frame):
                js("f => { ED.tempo.pausar(); ED.tempo.irPara(f / 30); }", frame); quieto()

            ok("a biblioteca da arte conhece as entradas e a capa", js("ED.S.lib.versao >= ED.arte.LIB_ATUAL && typeof ED.S.lib.capa === 'function'"))
            ir(60)
            arte.locator(".titulo").click(position={"x": 30, "y": 30}); quieto()
            y0 = ty(".titulo")
            pg.select_option("#selEntrada", "subir"); quieto(250)
            ent = e().get("ent")
            ok("escolher uma entrada grava o efeito (30 frames, forca padrao) e mostra o cartao", ent == {"tipo": "subir", "dur": 1, "int": 80}
               and pg.locator("#cartaoEntrada .chip").count() == 1 and pg.locator("#folha .fl.el .barra-entrada").count() == 1, str(ent))
            ir(0); o0, ya = opac(".titulo"), ty(".titulo")
            ir(15); o15, yb = opac(".titulo"), ty(".titulo")
            ir(30); o30, yc = opac(".titulo"), ty(".titulo")
            ok("a entrada 'Subir' vem de baixo e aparece; no fim esta no lugar", o0 == 0 and abs(ya - y0 - 80) < 0.5 and 0 < yb - y0 < 40 and o15 == 1
               and o30 == 1 and abs(yc - y0) < 0.01, f"{o0} {ya - y0} | {o15} {yb - y0} | {o30} {yc - y0}")
            pg.locator('#cartaoEntrada input[data-k="dur"]').fill("15"); quieto()
            ir(15)
            ok("o cartao muda a duracao (em frames)", abs(e()["ent"]["dur"] - 0.5) < 0.001 and abs(ty(".titulo") - y0) < 0.01 and e()["ent"]["int"] == 80)
            js("ED.camada.definirInicio(20)"); quieto(200)
            ir(19); antes = arte.locator(".titulo").evaluate("el => getComputedStyle(el).visibility")
            ir(20); o20 = opac(".titulo")
            ir(35); o35 = opac(".titulo")
            ok("a entrada comeca junto com a camada (anda com o delay)", antes == "hidden" and o20 == 0 and o35 == 1 and abs(ty(".titulo") - y0) < 0.01, f"{antes} {o20} {o35}")
            js("ED.camada.definirInicio(0)"); quieto(200)
            pg.select_option("#selEntrada", "zoom"); quieto(250)
            ent = e().get("ent")
            ok("trocar de entrada mantem a duracao e usa a forca da nova", ent == {"tipo": "zoom", "dur": 0.5, "int": 40}, str(ent))
            js("ED.tempo.pausar()")
            pg.click('#cartaoEntrada button[data-acao="tirar"]'); quieto(200)
            ir(0)
            ok("tirar a entrada devolve o elemento ao normal", "ent" not in e() and opac(".titulo") == 1 and pg.locator("#cartaoEntrada .chip").count() == 0)

            # capa: fora do Animar o editor (e o PNG) mostram a capa — por padrao, o fim da animacao
            pg.select_option("#selEntrada", "aparecer"); quieto(250)
            ir(0)
            invisivel = opac(".titulo") == 0
            pg.click("#btnAnimar"); quieto(200)
            fora = js("ED.S.tempo")
            ok("fora do Animar o editor mostra a capa (o fim): quem tem entrada ja aparece", invisivel and fora == 5 and opac(".titulo") == 1, f"{invisivel} {fora}")
            pg.click("#btnAnimar"); quieto(200)
            ok("ligar o Animar volta para o frame 0", js("ED.S.tempo") == 0 and opac(".titulo") == 0)
            ir(40)
            pg.click("#btnCapa"); quieto(200)
            capa = js("ED.doc.pag()._capa")
            pg.click("#btnAnimar"); quieto(200)
            ok("🖼 Capa usa o frame da cabeca (marca na regua) e vale fora do Animar", round(capa * 30) == 40 and round(js("ED.S.tempo") * 30) == 40)
            pg.click("#btnAnimar"); quieto(200)
            ok("a marca da capa aparece na regua", pg.locator("#folha .regua .capa").count() == 1 and "frame 40" in pg.locator("#folha .regua .capa").get_attribute("title"))
            ir(150)
            pg.click("#btnCapa"); quieto(200)
            ok("capa no ultimo frame = o padrao (nao e gravada)", "_capa" not in js("ED.doc.pag()"))
            ir(0)
        tentar("entradas e capa", t_entradas)

        def t_salvar():
            esperar_recarga(lambda: pg.keyboard.press("Control+s"))
            txt = (pasta / "exemplo.edicoes.js").read_text(encoding="utf-8")
            ok("Ctrl+S grava o arquivo de edicoes ao lado da arte", '"_formato": 2' in txt and '"kf"' in txt and '"_novos"' in txt)
            ok("ao reabrir, a propria arte aplica as edicoes", arte.locator(".titulo").evaluate("el => el.style.translate") != "" and arte.locator("[data-ed-id]").count() == 2 and "OK" in arte.locator(".apoio").inner_text())
            ok("depois de salvar a selecao e o desfazer continuam", js("ED.S.selCaminho !== null && ED.doc.podeDesfazer()"))
            sozinha = nav.new_page(viewport={"width": 1080, "height": 1350})
            sozinha.goto(f"http://127.0.0.1:{PORTA}/arte/{urllib.request.quote(ARTE)}")
            sozinha.wait_for_function("document.body.dataset.pronto === '1'", timeout=20000)
            ok("a arte aberta sozinha (como no PNG) mostra a capa: quem tem entrada aparece", sozinha.locator(".titulo").evaluate("el => getComputedStyle(el).opacity") == "1"
               and sozinha.evaluate("EDLIB.capa()") == 5)
            sozinha.close()
            arte.locator(".selo").click(); quieto(); pg.keyboard.press("ArrowUp"); quieto()
            esperar_recarga(lambda: pg.keyboard.press("Control+s"))
            ok("cada gravacao guarda a versao anterior", len(list((pasta / ".edicoes-anteriores").glob("*.js"))) == 2)
        tentar("salvar", t_salvar)

        if COM_VIDEO:
            def t_video():
                pg.select_option("#selMb", "0.25"); quieto(200)          # o video de teste sai com blur leve
                pg.click("#btnVideo")
                pg.wait_for_function("document.getElementById('videoStatus').textContent.startsWith('pronto') || document.getElementById('videoStatus').textContent.startsWith('erro')", timeout=240000)
                st = pg.inner_text("#videoStatus")
                mp4 = pasta / "out" / "exemplo-01.mp4"
                quadros = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames,r_frame_rate",
                                          "-of", "csv=p=0", str(mp4)], capture_output=True, text=True).stdout.strip()
                dur = js("ED.S.lib.duracao(ED.S.pagina, ED.S.edicoes)")
                ok("Gerar video cria o MP4 (pasta com acento no nome), com motion blur e o numero certo de quadros", st.startswith("pronto") and mp4.stat().st_size > 20000
                   and pg.locator("#videoStatus a").count() == 1 and quadros == f"30/1,{round(dur * 30)}", f"{st} | {quadros} | {dur}")
            tentar("video", t_video)

        def t_nua():
            abrir("cliente ação/nua.html")
            ok("arte ligada pelo ligar.py (modo automatico) abre editavel", js("!!ED.S.lib && ED.S.larg === 800 && ED.S.alt === 600 && !document.getElementById('btnEditar').disabled"),
               str(js("[!!ED.S.lib, ED.S.larg, ED.S.alt, document.getElementById('btnEditar').disabled]")))
            ok("trocar de arte zera o documento", js("JSON.stringify(ED.S.edicoes) === '{}' && !ED.S.sujo && !ED.doc.podeDesfazer()"))
        tentar("arte nua", t_nua)

        def t_fundo():
            abrir("cliente ação/comfundo.html")
            pg.click("#btnEditar"); quieto()
            pg.click('.abas[data-lado="dir"] [data-aba="assets"]'); quieto(400)
            vis = lambda sel: arte.locator(sel).evaluate("el => getComputedStyle(el).visibility")  # noqa: E731
            pg.locator('#listaAssets .tile[data-bib="Marca"]').hover()
            pg.locator('#listaAssets .tile[data-bib="Marca"] [data-acao="fundo"]').click(); quieto(500)
            item = js("ED.doc.pag()._novos[0]")
            caixa = arte.locator("[data-ed-fundo]").evaluate("el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return [r.width, r.height, s.zIndex, s.objectFit]; }")
            ok("'fundo' poe a imagem cobrindo a arte toda, atras de tudo", item.get("fundo") is True and item["src"].startswith("assets/biblioteca/Marca/")
               and caixa == [800, 600, "-1", "cover"] and arte.locator("#post").evaluate("el => getComputedStyle(el).isolation") == "isolate", f"{item} {caixa}")
            ok("as camadas de fundo que a arte tinha sao escondidas", item.get("escondeu") == ["0"] and vis("canvas.bg") == "hidden" and vis(".frase") == "visible", str(item))
            arte.locator("#post").click(position={"x": 700, "y": 500}); quieto()
            ok("clicar no vazio da arte nao pega a imagem de fundo", js("ED.S.selCaminho") is None)
            pg.locator('#listaAssets .tile[data-src="assets/real.png"]').hover()
            pg.locator('#listaAssets .tile[data-src="assets/real.png"] [data-acao="fundo"]').click(); quieto(500)
            novos = js("ED.doc.pag()._novos")
            ok("escolher outro fundo troca (um por pagina)", len(novos) == 1 and novos[0]["src"] == "assets/real.png" and novos[0].get("escondeu") == ["0"]
               and arte.locator("[data-ed-fundo]").count() == 1 and "fundo" in pg.inner_text("#selNome"), str(novos))
            pg.keyboard.press("Delete"); quieto(300)
            ok("apagar o fundo traz de volta o fundo da arte", js("ED.doc.pag()._novos") is None and vis("canvas.bg") == "visible"
               and arte.locator("#post").evaluate("el => el.style.isolation") == "" and js("JSON.stringify(ED.S.edicoes)") == "{}", js("JSON.stringify(ED.S.edicoes)"))
        tentar("usar como fundo", t_fundo)

        def t_em_linha():
            # <p class="linha"><span class="cor">texto em linha</span></p>: o clique pega o <span>, que e texto "em linha"
            pg.click('.abas[data-lado="dir"] [data-aba="camadas"]'); quieto()
            nomes = [n for n in pg.locator("#pn-camadas .cam .nome").all_inner_texts() if "texto em linha" in n]
            ok("embrulho de um texto so aparece como uma camada (nao duas)", len(nomes) == 1 and nomes[0].startswith("cor"), str(nomes))
            arte.locator(".cor").click(); quieto()
            antes = arte.locator(".cor").bounding_box()
            for _ in range(3):
                pg.keyboard.press("Shift+ArrowRight")
            quieto()
            depois = arte.locator(".cor").bounding_box()
            k = js("ED.S.escala")
            ok("mover funciona em texto 'em linha' (vira bloco em linha)", js("ED.S.sel.className") == "cor" and abs((depois["x"] - antes["x"]) / k - 30) < 1
               and arte.locator(".cor").evaluate("el => getComputedStyle(el).display") == "inline-block", f"{antes} {depois}")
            pg.keyboard.press("Control+z"); quieto(200)
            ok("sem a edicao o trecho volta a ser texto em linha", arte.locator(".cor").evaluate("el => getComputedStyle(el).display") == "inline"
               and arte.locator(".cor").evaluate("el => el.getAttribute('style')") is None)
            pg.click("#btnPai"); quieto()
            nomes = [n for n in pg.locator("#pn-camadas .cam .nome").all_inner_texts() if "texto em linha" in n]
            ok("o bloco de fora aparece na lista quando e selecionado", len(nomes) == 2, str(nomes))
        tentar("texto em linha", t_em_linha)

        def t_novidades():
            abrir(ARTE)
            # barra de baixo: o play no centro da barra; loop aceso por padrão, desliga e lembra
            if not js("ED.S.editando"):
                pg.click("#btnEditar"); quieto()
            if not js("ED.S.animando"):
                pg.click("#btnAnimar"); quieto()
            barra, play = pg.locator("#linhaTempo").bounding_box(), pg.locator("#btnPlay").bounding_box()
            ok("o play fica no centro da barra de baixo", abs((barra["x"] + barra["width"] / 2) - (play["x"] + play["width"] / 2)) < 60, f"{barra} {play}")
            ligado = js("document.getElementById('btnLoop').classList.contains('ativo')")
            pg.click("#btnLoop"); quieto()
            ok("botao de loop: aceso por padrao, clique desliga e fica lembrado", ligado and not js("ED.tempo.emLoop()")
               and js("localStorage.getItem('afe:loop')") == "0")
            pg.click("#btnLoop"); quieto()
            # lados trocados e atalhos em lista
            esq, dir_ = pg.locator("#esq").bounding_box(), pg.locator("#dir").bounding_box()
            ok("efeitos a esquerda, camadas a direita", pg.locator('#esq [data-aba="efeitos"]').count() == 1
               and pg.locator('#dir [data-aba="camadas"]').count() == 1 and esq["x"] < dir_["x"])
            ok("atalhos: um por linha", pg.locator("#listaAtalhos .at-linha").count() > 15)
            # Transformar: pares numa linha; corrente liga largura e altura; ↺ volta ao padrão
            pg.click('.abas[data-lado="esq"] [data-aba="transformar"]'); quieto()
            arte.locator(".selo").click(); quieto()
            pg.fill("#inSX", "150"); pg.press("#inSX", "Enter"); quieto()
            ligado = (e().get("sx"), e().get("sy"))
            pg.click("#btnElo"); pg.fill("#inSY", "80"); pg.press("#inSY", "Enter"); quieto(); pg.click("#btnElo"); quieto()
            solto = (e().get("sx"), e().get("sy"))
            pg.click('.tf-reset[data-reset="sx,sy"]'); quieto()
            # apagar um elemento da ARTE: pede confirmacao, some da arte e da lista; "restaurar" traz de volta
            arte.locator(".selo").click(); quieto()
            cs = js("ED.S.selCaminho"); n0 = pg.locator("#pn-camadas .cam").count(); dialogos.clear()
            pg.keyboard.press("Delete"); quieto(300)
            sumiu = js(f"getComputedStyle(ED.arte.achar({json.dumps(cs)})).display") == "none" and pg.locator("#pn-camadas .cam").count() == n0 - 1
            pg.click("#pn-camadas .apagados a"); quieto(300)
            ok("apagar elemento da arte: confirma, some, e 'restaurar' traz de volta",
               len(dialogos) == 1 and sumiu and js(f"getComputedStyle(ED.arte.achar({json.dumps(cs)})).display") != "none"
               and pg.locator("#pn-camadas .cam").count() == n0, str(dialogos))
            ok("Esticar: corrente ligada acompanha, solta nao; reset volta ao padrao",
               ligado == (1.5, 1.5) and solto == (1.5, 0.8) and "sx" not in e() and "sy" not in e(), f"{ligado} {solto} {e()}")
            # mesclagem pela aba Camadas e pelo botao direito; Ctrl+Z volta
            pg.click('.abas[data-lado="dir"] [data-aba="camadas"]'); quieto()
            arte.locator(".selo").click(); quieto()
            c = js("ED.S.selCaminho")
            pg.select_option('#pn-camadas select[data-acao="mescla"]', "multiply"); quieto()
            css = lambda: js(f"getComputedStyle(ED.arte.achar({json.dumps(c)})).mixBlendMode")  # noqa: E731
            antes = css()
            pg.keyboard.press("Control+z"); quieto(200)
            ok("mesclagem pela aba Camadas aplica na arte e o Ctrl+Z desfaz", e().get("mix") is None and antes == "multiply" and css() == "normal", antes)
            arte.locator(".selo").click(button="right"); quieto()
            pg.click(".menu button:has-text('Mesclagem')"); quieto()
            pg.click(".menu button:has-text('Tela')"); quieto()
            ok("mesclagem pelo botao direito na arte", e().get("mix") == "screen" and css() == "screen")
            pg.keyboard.press("Control+z"); quieto(200)
            # granulado: entra travado, em Sobrepor, cobre a arte; animado e sempre igual no mesmo instante
            pg.click('.abas[data-lado="dir"] [data-aba="assets"]'); quieto(300)
            pg.click('.tile[data-tipo="granulado"]'); quieto(400)
            g = js("ED.S.selCaminho")
            pos = lambda t: js(f"(ED.tempo.irPara({t}), ED.arte.achar({json.dumps(g)}).style.backgroundPosition)")  # noqa: E731
            ok("granulado: travado, em Sobrepor, do tamanho da arte, com o grao desenhado",
               e().get("trava") is True and e().get("mix") == "overlay" and js("ED.arte.nomeDe(ED.S.sel)") == "★ granulado"
               and js("ED.S.sel.getBoundingClientRect().width") == js("ED.S.larg") and "data:image/png" in js("ED.S.sel.style.backgroundImage"))
            a, b, a2 = pos(1), pos(1.1), pos(1)
            ok("granulado animado: muda com o tempo e repete igual no mesmo instante (video = editor)", a != b and a == a2 and js("ED.S.lib.animado(ED.S.pagina, ED.S.edicoes)"), f"{a} {b} {a2}")
            pg.click('.abas[data-lado="esq"] [data-aba="forma"]'); quieto()
            pg.select_option('#pn-forma select[data-gr="tam"]', "2"); quieto()
            ok("ajustes do granulado na aba Forma", js(f"ED.doc.pag()._novos.find(n => '#' + n.id === {json.dumps(g)}).gr.tam") == 2)
            pg.keyboard.press("Control+z"); quieto(); pg.keyboard.press("Control+z"); quieto()
            # imagem do computador solta em cima da arte vira camada
            pg.evaluate("""(png) => {
              const dt = new DataTransfer(), bin = Uint8Array.from(atob(png), (ch) => ch.charCodeAt(0));
              dt.items.add(new File([bin], 'solta.png', { type: 'image/png' }));
              const d = document.getElementById('quadro').contentDocument, el = d.elementFromPoint(100, 100);
              for (const t of ['dragover', 'drop']) el.dispatchEvent(new DragEvent(t, { dataTransfer: dt, bubbles: true, cancelable: true, clientX: 100, clientY: 100 }));
            }""", PNG1)
            pg.wait_for_function("(ED.doc.pag()._novos || []).some((n) => n.src === 'assets/importadas/solta.png')", timeout=8000)
            ok("imagem do computador solta na arte vira camada (gravada na pasta da arte)", (tmp / "cliente ação" / "assets" / "importadas" / "solta.png").is_file())
            pg.keyboard.press("Control+z"); quieto()
        tentar("novidades: barra, loop, lados, atalhos, mesclagem, granulado, importar", t_novidades)

        erros_console[:] = [x for x in erros_console if "ERR_NAME_NOT_RESOLVED" not in x]   # (fonte "da internet" da previa da peca: endereco falso no teste)
        ok("nenhum erro no console do navegador", not erros_console, " | ".join(erros_console)[:300])
        nav.close()
finally:
    servidor.terminate()
    try:
        servidor.wait(timeout=5)
    except subprocess.TimeoutExpired:
        servidor.kill()
    shutil.rmtree(tmp, ignore_errors=True)            # so as pastas temporarias criadas por este teste
    shutil.rmtree(tmp_bib, ignore_errors=True)

falhas = [r for r in resultados if not r[1]]
print(f"\n{len(resultados) - len(falhas)} de {len(resultados)} conferencias passaram." + ("" if not falhas else "  FALHAS:"))
for nome, _, detalhe in falhas:
    print(f"  - {nome}" + (f"   [{re.sub(chr(10), ' ', detalhe)[:300]}]" if detalhe else ""))
sys.exit(1 if falhas else 0)
