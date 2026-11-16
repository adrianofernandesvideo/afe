"""
ligar.py — liga uma arte .html ao AFE
=================================================
  python ligar.py CAMINHO/arte.html              liga a arte (ou atualiza a biblioteca de uma ja ligada)
  python ligar.py CAMINHO/arte.html --conferir   so mostra como a arte esta, sem mudar nada
  python ligar.py CAMINHO/arte.html --auto       forca o modo automatico
  python ligar.py CAMINHO/arte.html --manual     forca o modo manual

O que ele faz (e so isto):
  1. copia arte/edicoes-lib.js para junto da arte (ao lado do .html; numa arte ja ligada, para onde ela ja aponta);
  2. cria o arquivo de edicoes vazio  <nome da arte>.edicoes.js  (se ainda nao existir);
  3. se a arte ainda nao carrega a biblioteca, acrescenta as duas linhas <script> no .html.

Modos (ele escolhe sozinho; da para forcar):
  automatico  a arte nao avisa quando termina de montar (nao usa data-pronto): a biblioteca aplica as
              edicoes quando a pagina carrega e marca <body data-pronto="1">. Nada mais a fazer.
  manual      a arte monta a tela por codigo e marca data-pronto ela mesma: depois de ligar, falta
              chamar a biblioteca no codigo da arte (o script mostra as linhas).

Rodar de novo numa arte ja ligada so atualiza a copia da biblioteca. Nada e apagado.
"""
import argparse
import re
import sys
from pathlib import Path

# a saida vai sempre em UTF-8 (caminhos com acento chegam inteiros a quem le: o servidor, o terminal)
for _fluxo in (sys.stdout, sys.stderr):
    try:
        _fluxo.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass

AQUI = Path(__file__).resolve().parent
LIB = AQUI / "arte" / "edicoes-lib.js"
TAG_LIB = re.compile(r"""<script[^>]+src=["']([^"'?#]*edicoes-lib\.js)["'][^>]*>""", re.I)
TAG_ED = re.compile(r"""<script[^>]+src=["']([^"'?#]*edicoes\.js)["'][^>]*>""", re.I)
SCRIPT_DA_ARTE = re.compile(r"<script(?![^>]*\bsrc\s*=)[^>]*>", re.I)       # primeiro <script> sem src
FIM_BODY = re.compile(r"</body\s*>", re.I)
VAZIO = ("// Edicoes feitas a mao no AFE. Gerado automaticamente: nao edite por aqui.\n"
         "window.EDICOES = {};\n")

ap = argparse.ArgumentParser(description="Liga uma arte .html ao AFE")
ap.add_argument("arte")
ap.add_argument("--auto", action="store_true")
ap.add_argument("--manual", action="store_true")
ap.add_argument("--conferir", action="store_true", help="so mostra o estado, sem mudar nada")
A = ap.parse_args()

arte = Path(A.arte).resolve()
if not arte.is_file() or arte.suffix.lower() != ".html":
    sys.exit(f"Nao achei a arte .html: {arte}")
if not LIB.is_file():
    sys.exit(f"Nao achei a biblioteca do editor em {LIB}")

pasta = arte.parent
bruto = arte.read_bytes()
html = bruto.decode("utf-8")
quebra = "\r\n" if "\r\n" in html else "\n"

tag_lib, tag_ed = TAG_LIB.search(html), TAG_ED.search(html)
ja_ligada = bool(tag_lib)
rel_lib = tag_lib.group(1) if tag_lib else "edicoes-lib.js"
rel_ed = tag_ed.group(1) if tag_ed else f"{arte.stem}.edicoes.js"
destino_lib, destino_ed = pasta / rel_lib, pasta / rel_ed
automatico = "data-auto" in tag_lib.group(0) if tag_lib else (A.auto or (not A.manual and not re.search(r"data-pronto|dataset\.pronto", html)))
chama_lib = bool(re.search(r"\bEDLIB\s*\.", html))


def igual(a, b):
    return b.is_file() and a.read_bytes() == b.read_bytes()


print(f"Arte: {arte}")
print(f"  biblioteca:  {rel_lib}  ({'em dia' if igual(LIB, destino_lib) else 'falta copiar/atualizar'})")
print(f"  edicoes:     {rel_ed}  ({'existe' if destino_ed.is_file() else 'ainda nao existe'})")
print(f"  no .html:    {'ja carrega a biblioteca' if ja_ligada else 'ainda nao carrega a biblioteca'}"
      f"  ·  modo {'automatico' if automatico else 'manual'}")
if A.conferir:
    if ja_ligada and not automatico and not chama_lib:
        print("  ATENCAO: modo manual, mas o codigo da arte nao chama EDLIB (veja as linhas no fim do LEIA.md).")
    raise SystemExit(0)

# 1) biblioteca
if not igual(LIB, destino_lib):
    destino_lib.parent.mkdir(parents=True, exist_ok=True)
    destino_lib.write_bytes(LIB.read_bytes())
    print("  -> biblioteca copiada")
# 2) arquivo de edicoes
if not destino_ed.is_file():
    destino_ed.parent.mkdir(parents=True, exist_ok=True)
    destino_ed.write_text(VAZIO, encoding="utf-8", newline="\n")
    print("  -> arquivo de edicoes criado (vazio)")
# 3) linhas no .html
if not ja_ligada:
    if automatico:
        linhas = [f'<script src="{rel_ed}"></script>', f'<script src="{rel_lib}" data-auto></script>']
        ponto = FIM_BODY.search(html)
    else:
        linhas = [f'<script src="{rel_lib}"></script>', f'<script src="{rel_ed}"></script>']
        ponto = SCRIPT_DA_ARTE.search(html) or FIM_BODY.search(html)
    if tag_ed:                                    # a arte ja tinha a linha das edicoes: nao repete
        linhas = [x for x in linhas if rel_ed not in x]
    pos = ponto.start() if ponto else len(html)
    inicio_linha = html.rfind("\n", 0, pos) + 1
    recuo = re.match(r"[ \t]*", html[inicio_linha:pos]).group(0) if html[inicio_linha:pos].strip() == "" else ""
    bloco = "".join(f"{x}{quebra}{recuo}" for x in linhas)
    html = html[:pos] + bloco + html[pos:]
    arte.write_bytes(html.encode("utf-8"))
    print(f"  -> {len(linhas)} linha(s) <script> acrescentada(s) no .html")

if automatico:
    print("Pronto: arte ligada no modo automatico. Abra no editor.")
elif chama_lib:
    print("Pronto: arte ligada (modo manual; o codigo dela ja chama a biblioteca).")
else:
    print("Quase: modo manual. No codigo da arte, ANTES de marcar data-pronto, acrescente:")
    print("    await EDLIB.preparar(N);     // itens novos + textos editados (antes de medir textos)")
    print("    ...ajustes da arte que medem o texto...")
    print("    EDLIB.finalizar(N);          // posicao, tamanho, efeitos, forma, animacao")
    print("  (N = numero da pagina; sem etapa de medir:  await EDLIB.aplicarTudo(N);)")
