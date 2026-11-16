"""
render_anim.py — gera o MP4 de uma pagina animada no AFE
====================================================================
A animacao (keyframes e efeitos continuos) fica no arquivo de edicoes da arte. Este script abre a arte,
desenha cada quadro com EDLIB.quadro(pagina, t) e junta tudo num MP4 com o ffmpeg.
O botao "Gerar video" do editor chama exatamente isto.

  python render_anim.py CAMINHO/arte.html --pagina 2
  python render_anim.py CAMINHO/arte.html --pagina 2 --fps 30 --escala 1 --saida PASTA

Saida:  <nome da arte>-NN.mp4  em --saida PASTA, se for passada; senao, na pasta "out" ao lado da arte.
Duracao: a definida no editor para a pagina (padrao 5 s). A animacao fecha o loop.

MOTION BLUR (opcional, por pagina: campo "_mb" das edicoes, escolhido no editor; ou --mb aqui)
  Como o obturador de uma camera: cada quadro do video e a MEDIA de varias fotos tiradas enquanto o
  "obturador" esta aberto. _mb = quanto do intervalo entre dois quadros ele fica aberto
  (0.25 leve · 0.5 normal, o "180 graus" do cinema · 1 forte). Quanto mais aberto, mais fotos por quadro
  (4 / 8 / 12), entao o video demora mais para ficar pronto (4x a 12x). A mistura e feita pelo ffmpeg
  (filtro tmix). O PNG e a prévia do editor nao tem blur.

Precisa de: Python com playwright, um navegador (Edge ou Chrome) e ffmpeg no PATH.
Este script NAO instala nada: se faltar algo, ele avisa o que falta.
"""
import argparse
import functools
import http.server
import shutil
import subprocess
import sys
import threading
from pathlib import Path

# a saida vai sempre em UTF-8 (caminhos com acento chegam inteiros a quem le: o servidor, o terminal)
for _fluxo in (sys.stdout, sys.stderr):
    try:
        _fluxo.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass


def falhar(msg):
    print("ERRO: " + msg, flush=True)
    raise SystemExit(1)


ap = argparse.ArgumentParser()
ap.add_argument("arte", help="caminho do arquivo .html da arte")
ap.add_argument("--pagina", type=int, default=1)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--escala", type=float, default=1, help="1 = tamanho da arte (ex.: 1080 de largura)")
ap.add_argument("--saida", help="pasta onde gravar o MP4")
ap.add_argument("--mb", type=float, help="motion blur: 0 = sem; 0.25 leve; 0.5 normal; 1 forte (padrao: o da pagina)")
A = ap.parse_args()

ARTE = Path(A.arte).resolve()
if not ARTE.is_file():
    falhar(f"arte nao encontrada: {ARTE}")
PASTA, N = ARTE.parent, A.pagina

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    falhar("falta o Playwright do Python (pip install playwright). Este script nao instala nada sozinho.")
if not shutil.which("ffmpeg"):
    falhar("falta o ffmpeg no PATH (https://ffmpeg.org). Este script nao instala nada sozinho.")


def pasta_de_saida():
    if A.saida:
        d = Path(A.saida).resolve()
    else:
        d = PASTA / "out"
    d.mkdir(parents=True, exist_ok=True)
    return d


class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def abrir_navegador(p):
    """Edge, depois Chrome, depois o Chromium do Playwright."""
    erros = []
    for canal in ("msedge", "chrome", None):
        try:
            return p.chromium.launch(channel=canal, args=["--force-color-profile=srgb"]) if canal \
                else p.chromium.launch(args=["--force-color-profile=srgb"])
        except Exception as e:  # noqa: BLE001
            erros.append(f"{canal or 'chromium'}: {str(e).splitlines()[0]}")
    falhar("nao consegui abrir um navegador (" + " | ".join(erros) + ")")


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Silencioso, directory=str(PASTA)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f"http://127.0.0.1:{srv.server_address[1]}/{ARTE.name}?pagina={N}"
saida = pasta_de_saida() / f"{ARTE.stem}-{N:02d}.mp4"

with sync_playwright() as p:
    nav = abrir_navegador(p)
    pg = nav.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=A.escala)
    pg.goto(url)
    try:
        pg.wait_for_selector('body[data-pronto="1"]', timeout=20000)
    except Exception:  # noqa: BLE001
        falhar('a arte nao avisou que terminou de carregar (<body data-pronto="1">). Ela esta ligada ao editor?')
    if not pg.evaluate("!!(window.EDLIB && EDLIB.versao >= 2)"):
        falhar("a arte nao esta ligada ao editor (ou usa uma versao antiga da edicoes-lib.js): rode o ligar.py nela.")
    inf = pg.evaluate("EDLIB.info()")
    L, H = inf["largura"], inf["altura"]
    pg.set_viewport_size({"width": L, "height": H})
    dur = pg.evaluate(f"EDLIB.duracao({N})")
    total = max(1, round(dur * A.fps))
    W, Hh = round(L * A.escala) // 2 * 2, round(H * A.escala) // 2 * 2      # H.264 pede lados pares
    # motion blur: abertura do obturador (0 a 1) e quantas fotos por quadro (mais aberto = mais fotos,
    # para o rastro sair liso e nao em "copias")
    mb = A.mb if A.mb is not None else float(pg.evaluate("n => ((window.EDICOES || {})[n] || {})._mb || 0", N) or 0)
    mb = min(1.0, max(0.0, mb))
    am = min(12, max(4, round(16 * mb))) if mb > 0 else 1
    filtro = f"scale={W}:{Hh}"
    if am > 1:
        # o ffmpeg recebe am fotos por quadro; tmix faz a media de am seguidas; select fica com a ultima de cada
        # grupo (a que tem o grupo inteiro na media) e setpts devolve o ritmo normal
        filtro = f"tmix=frames={am},select='eq(mod(n\\,{am})\\,{am - 1})',setpts=N/({A.fps}*TB)," + filtro
        print(f"motion blur ligado: obturador {mb:g}, {am} fotos por quadro (demora ~{am}x mais)", flush=True)
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(A.fps * am), "-i", "-",
         "-vf", filtro, "-r", str(A.fps), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17",
         "-preset", "medium", "-movflags", "+faststart", str(saida)],
        stdin=subprocess.PIPE)
    for i in range(total):
        for k in range(am):                    # foto k: o obturador abre no instante do quadro e fica aberto mb
            t = (i + mb * k / am) / A.fps
            pg.evaluate(f"EDLIB.quadro({N}, {t})")
            ff.stdin.write(pg.screenshot(clip={"x": 0, "y": 0, "width": L, "height": H}, type="png"))
        if i % 15 == 0 or i == total - 1:
            print(f"quadro {i + 1}/{total}", flush=True)
    ff.stdin.close()
    ff.wait()
    nav.close()

if ff.returncode != 0:
    falhar("o ffmpeg nao conseguiu montar o video")
print("SAIDA " + str(saida.resolve()), flush=True)
