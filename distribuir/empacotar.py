"""
empacotar.py — monta o EXECUTAVEL do AFE e o .zip que vai para o release
=========================================================================
  python distribuir/empacotar.py --versao 2.3.4-beta [--sistema windows] [--saida build/release] [--testar]

Quem roda: o GitHub Actions (.github/workflows/release.yml), a cada push na main, uma vez em cada sistema
(Windows, macOS e Linux: o PyInstaller so gera o executavel do sistema em que roda).

Precisa do PyInstaller (pip install pyinstaller). O GitHub Actions instala sozinho, na maquina dele; no seu
computador so e preciso se voce quiser gerar o executavel a mao.

O que sai (em --saida):
  AFE-<versao>-<sistema>.zip
    AFE-<versao>/
      AFE.exe (ou AFE)      o servidor.py + a tela do editor + o ligar.py, num arquivo so (nao precisa de Python)
      artes/                as artes de demonstracao (o executavel abre esta pasta)
      LEIA-PRIMEIRO.txt     como usar
      AGENTS.md, CLAUDE.md  guia para a IA de quem usa (como o AFE funciona, como criar artes, o que nao mexer)
      LICENSE
--testar: liga o executavel numa porta livre e confere se ele responde (o editor, a API e uma arte), e
         confere o "AFE ligar" numa arte nova.
"""
import argparse
import json
import os
import platform
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
import zipfile
from pathlib import Path

for _fluxo in (sys.stdout, sys.stderr):
    try:
        _fluxo.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass

EDITOR = Path(__file__).resolve().parent.parent
AQUI = Path(__file__).resolve().parent
PULAR_COPIA = shutil.ignore_patterns(".*", "__pycache__", "build", "out")


def sistema_atual():
    return {"win32": "windows", "darwin": "macos"}.get(sys.platform, "linux")


def gerar_executavel(versao, trabalho):
    """Roda o PyInstaller. Devolve o caminho do executavel."""
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        sys.exit("O PyInstaller nao esta instalado (pip install pyinstaller). Este script nao instala nada sozinho.")
    fontes = trabalho / "fontes"
    fontes.mkdir(parents=True)
    # copia do servidor.py com a versao completa carimbada (o arquivo do repositorio nao muda)
    texto = (EDITOR / "servidor.py").read_text(encoding="utf-8")
    texto, n = re.subn(r'^VERSAO = "[^"]*"', f'VERSAO = "{versao}"', texto, count=1, flags=re.M)
    if not n:
        sys.exit("nao achei a linha VERSAO = ... no servidor.py")
    (fontes / "servidor.py").write_text(texto, encoding="utf-8")
    shutil.copy2(EDITOR / "ligar.py", fontes / "ligar.py")
    dados = lambda origem, destino: ["--add-data", f"{origem}{os.pathsep}{destino}"]  # noqa: E731
    cmd = [sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean", "--onefile", "--console", "--name", "AFE",
           "--distpath", str(trabalho / "dist"), "--workpath", str(trabalho / "work"), "--specpath", str(trabalho),
           "--paths", str(fontes), "--hidden-import", "ligar",
           *dados(EDITOR / "app", "app"), *dados(EDITOR / "arte", "arte"), *dados(EDITOR / "render_anim.py", "."),
           str(fontes / "servidor.py")]
    print("gerando o executavel (PyInstaller)…", flush=True)
    subprocess.run(cmd, check=True)
    exe = trabalho / "dist" / ("AFE.exe" if sys.platform == "win32" else "AFE")
    if not exe.is_file():
        sys.exit(f"o PyInstaller terminou, mas nao achei {exe}")
    return exe


def porta_livre():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def testar_ligar(exe, trabalho):
    """'AFE ligar arte.html' (o mesmo caminho de arrastar a arte em cima do executavel) liga uma arte nova."""
    pasta = trabalho / "teste-ligar"
    pasta.mkdir(parents=True)
    arte = pasta / "arte teste.html"
    arte.write_text('<!doctype html><html><body><div id="post" style="width:300px;height:200px">oi</div></body></html>',
                    encoding="utf-8")
    r = subprocess.run([str(exe), "ligar", str(arte)], capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=120, stdin=subprocess.DEVNULL)
    html = arte.read_text(encoding="utf-8")
    ok = (r.returncode == 0 and (pasta / "edicoes-lib.js").is_file() and (pasta / "arte teste.edicoes.js").is_file()
          and "edicoes-lib.js" in html and "arte teste.edicoes.js" in html)
    if not ok:
        sys.exit(f"'AFE ligar' nao ligou a arte (saida {r.returncode}):\n{r.stdout}\n{r.stderr}")
    print("teste ok: 'AFE ligar' ligou uma arte nova", flush=True)


def testar(exe, artes):
    """Liga o executavel e confere as respostas. Sai com erro se algo falhar."""
    porta = porta_livre()
    proc = subprocess.Popen([str(exe), "--raiz", str(artes), "--porta", str(porta)],
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace",
                            env={**os.environ, "AFE_NAO_ABRIR": "1"})
    base = f"http://127.0.0.1:{porta}"
    pegar = lambda rota: urllib.request.urlopen(base + rota, timeout=5).read()  # noqa: E731
    try:
        for _ in range(120):                         # o executavel de um arquivo so demora para abrir na 1a vez
            try:
                info = json.loads(pegar("/api/info"))
                break
            except OSError:
                if proc.poll() is not None:
                    sys.exit("o executavel fechou sozinho:\n" + (proc.stdout.read() if proc.stdout else ""))
                time.sleep(0.5)
        else:
            sys.exit("o executavel nao respondeu em 60 s")
        artes_lista = json.loads(pegar("/api/artes"))["itens"]
        assert b"<title>AFE" in pegar("/editor/"), "a tela do editor nao veio"
        assert artes_lista and all(a["ligada"] for a in artes_lista), "as artes de demonstracao nao vieram ligadas"
        assert pegar("/arte/" + urllib.request.quote(artes_lista[0]["caminho"])), "a arte nao abriu"
        print(f"teste ok: AFE {info['versao']} respondeu com {len(artes_lista)} artes", flush=True)
    finally:
        fechar(proc)


def fechar(proc):
    """Fecha o executavel. No Windows, o executavel de um arquivo so roda em dois processos (o que abre o pacote
    e o AFE de fato): fecha os dois, senao o segundo segura o arquivo e a porta."""
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
    else:
        proc.terminate()
    try:
        proc.wait(timeout=10)
    except subprocess.TimeoutExpired:
        proc.kill()


def zipar(pasta, destino):
    """Zipa a pasta mantendo a permissao de executar (no macOS e no Linux)."""
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(pasta.rglob("*")):
            if p.is_file():
                info = zipfile.ZipInfo.from_file(p, p.relative_to(pasta.parent).as_posix())
                if p.name == "AFE":
                    info.external_attr = 0o100755 << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, p.read_bytes())


def main():
    ap = argparse.ArgumentParser(description="monta o executavel do AFE e o .zip do release")
    ap.add_argument("--versao", required=True, help="ex.: 2.3.4-beta")
    ap.add_argument("--sistema", default=None, help="nome no arquivo: windows, macos, linux (padrao: este)")
    ap.add_argument("--saida", default=str(EDITOR / "build" / "release"))
    ap.add_argument("--testar", action="store_true", help="liga o executavel e confere se responde")
    a = ap.parse_args()
    if not re.fullmatch(r"[0-9A-Za-z.+-]+", a.versao):
        sys.exit("versao invalida (use so letras, numeros, ponto, + e -)")
    sistema = a.sistema or sistema_atual()
    saida = Path(a.saida).resolve()
    trabalho = saida / f"_trabalho-{sistema}"
    if trabalho.exists():
        shutil.rmtree(trabalho)
    exe = gerar_executavel(a.versao, trabalho)

    pasta = saida / f"AFE-{a.versao}"
    if pasta.exists():
        shutil.rmtree(pasta)
    pasta.mkdir(parents=True)
    shutil.copy2(exe, pasta / exe.name)
    shutil.copytree(EDITOR / "demos" / "artes", pasta / "artes", ignore=PULAR_COPIA)
    for nome in ("LEIA-PRIMEIRO.txt", "AGENTS.md", "CLAUDE.md"):   # textos com {{VERSAO}}; o .txt no Windows vai com CRLF
        texto = (AQUI / nome).read_text(encoding="utf-8").replace("{{VERSAO}}", a.versao)
        crlf = sistema == "windows" and nome.endswith(".txt")
        (pasta / nome).write_text(texto, encoding="utf-8", newline="\r\n" if crlf else "\n")
    shutil.copy2(EDITOR / "LICENSE", pasta / "LICENSE")
    if a.testar:
        testar(pasta / exe.name, pasta / "artes")
        testar_ligar(pasta / exe.name, trabalho)

    zipado = saida / f"AFE-{a.versao}-{sistema}-{platform.machine().lower() or 'x'}.zip"
    zipar(pasta, zipado)
    shutil.rmtree(pasta)
    shutil.rmtree(trabalho)
    print(f"pronto: {zipado}  ({zipado.stat().st_size // 1024} KB)", flush=True)


if __name__ == "__main__":
    main()
