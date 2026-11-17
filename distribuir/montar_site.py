"""
montar_site.py — monta a DEMO ONLINE do AFE (o site do GitHub Pages)
=====================================================================
  python distribuir/montar_site.py [--saida build/site] [--artes demos/artes] [--versao 2.3-dev]

Quem roda: o GitHub Actions (.github/workflows/demo-online.yml), a cada push na main. Roda tambem no seu
computador, para conferir: depois e so servir a pasta de saida (ex.: python -m http.server -d build/site).

O site e feito so de arquivos parados (o GitHub Pages nao roda Python):
  index.html          abre a demo (liga o sw.js e vai para o editor com a arte de exemplo)
  sw.js               o "servidor" da demo, dentro do navegador (responde os /api/...; ver distribuir/demo/sw.js)
  demo-indice.json    a lista de artes e imagens (o que o servidor.py acharia andando pela pasta)
  editor/             a pasta app/ do editor + demo.js (selo "DEMO ONLINE")
  arte/               as artes de demonstracao (demos/artes)
Nao instala nada e nao acessa a internet.
"""
import argparse
import json
import os
import shutil
import sys
from pathlib import Path

for _fluxo in (sys.stdout, sys.stderr):
    try:
        _fluxo.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass

EDITOR = Path(__file__).resolve().parent.parent
DEMO = Path(__file__).resolve().parent / "demo"
sys.path.insert(0, str(EDITOR))
import servidor  # noqa: E402  (usa as mesmas regras do servidor para achar artes e imagens)

PULAR_COPIA = shutil.ignore_patterns(".*", "__pycache__", "build", "out")


def main():
    ap = argparse.ArgumentParser(description="monta a demo online do AFE (site estatico)")
    ap.add_argument("--saida", default=str(EDITOR / "build" / "site"))
    ap.add_argument("--artes", default=str(EDITOR / "demos" / "artes"))
    ap.add_argument("--arte-inicial", default="afe-post.html", help="a arte que a demo abre primeiro")
    ap.add_argument("--versao", default=None, help="versao mostrada no editor (padrao: a do servidor.py + 'demo')")
    ap.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", ""), help="dono/repositorio (link de download)")
    a = ap.parse_args()

    saida, artes = Path(a.saida).resolve(), Path(a.artes).resolve()
    if not artes.is_dir():
        sys.exit(f"pasta das artes nao encontrada: {artes}")
    if saida.exists():
        if not (saida / "demo-indice.json").is_file() and any(saida.iterdir()):
            sys.exit(f"{saida} ja existe e nao parece uma demo montada antes: escolha outra --saida")
        shutil.rmtree(saida)
    saida.mkdir(parents=True)

    # editor e artes
    shutil.copytree(EDITOR / "app", saida / "editor", ignore=PULAR_COPIA)
    shutil.copytree(artes, saida / "arte", ignore=PULAR_COPIA)

    # o indice (com as mesmas funcoes do servidor.py: mesma lista que o editor veria no computador)
    servidor.RAIZ = saida / "arte"
    itens, pastas = [], set()
    for p in servidor.andar(servidor.RAIZ, {".html"}, 800):
        texto = p.read_text(encoding="utf-8", errors="ignore")
        ed = servidor.arquivo_de_edicoes(p)
        itens.append({"caminho": p.relative_to(servidor.RAIZ).as_posix(), "ligada": "edicoes-lib.js" in texto,
                      "edicoes": ed.relative_to(servidor.RAIZ).as_posix() if ed else None})
        pastas.add(p.parent)
    itens.sort(key=lambda i: (not i["ligada"], i["caminho"].lower()))
    assets = {}
    for pasta in pastas:
        chave = pasta.relative_to(servidor.RAIZ).as_posix()
        assets["" if chave == "." else chave] = [x.relative_to(pasta).as_posix()
                                                 for x in servidor.andar(pasta, servidor.IMAGENS, 3000)]
    versao = a.versao or servidor.VERSAO + "-demo"
    (saida / "demo-indice.json").write_text(json.dumps(
        {"versao": versao, "repo": a.repo, "artes": itens, "assets": assets}, ensure_ascii=False, indent=1), encoding="utf-8")

    # o "servidor" da demo, a pagina de entrada e o selo
    inicial = a.arte_inicial if any(i["caminho"] == a.arte_inicial for i in itens) else (itens[0]["caminho"] if itens else "")
    shutil.copy2(DEMO / "sw.js", saida / "sw.js")
    (saida / "index.html").write_text((DEMO / "index.html").read_text(encoding="utf-8")
                                      .replace("{{ARTE}}", inicial), encoding="utf-8")
    (saida / "editor" / "demo.js").write_text((DEMO / "demo.js").read_text(encoding="utf-8")
                                              .replace("{{REPO}}", a.repo), encoding="utf-8")
    pagina = saida / "editor" / "index.html"
    html = pagina.read_text(encoding="utf-8")
    ponto = next((m for m in ('<meta charset="utf-8">', "<head>") if m in html), None)
    if not ponto:
        sys.exit("nao achei o <head> de app/index.html")
    pagina.write_text(html.replace(ponto, ponto + '\n<script src="demo.js"></script>', 1), encoding="utf-8")
    (saida / ".nojekyll").write_text("", encoding="utf-8")       # o GitHub Pages serve os arquivos como estao

    print(f"demo online montada em {saida}  ({len(itens)} artes, versao {versao})")
    print(f"  conferir:  python -m http.server 8790 -d \"{saida}\"   e abra  http://localhost:8790/")


if __name__ == "__main__":
    main()
