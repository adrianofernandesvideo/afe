# AFE — guia de instalação

**Português (BR)** · [English](docs/en/SETUP.md)

Editor visual para artes feitas em HTML (posts, carrosséis, stories, banners): você abre a arte no
navegador e ajusta **com o mouse**, sem mexer no código — mover, mudar tamanho e texto, glows e
sombras, cantos e contornos, acrescentar imagens e formas, animar com keyframes e gerar o vídeo.

Esta pasta é **completa e independente**: não depende de nenhum projeto. Para usar com outro
projeto ou cliente, basta copiá-la (veja "Levar para outro projeto").

| Quero… | Leia |
|---|---|
| usar o editor | [docs/MANUAL.md](docs/MANUAL.md) |
| saber o que já existe e o que vem depois | [docs/ROTEIRO.md](docs/ROTEIRO.md) |
| mexer no código do editor | [docs/ARQUITETURA.md](docs/ARQUITETURA.md) |
| entender por que algo é feito de um jeito estranho | [docs/DESCOBERTAS.md](docs/DESCOBERTAS.md) |
| ver o que mudou em cada versão | [docs/CHANGELOG.md](docs/CHANGELOG.md) |

## Como funciona, em uma frase

O editor **não altera o código da arte**: ele grava as suas mudanças num arquivo de dados ao lado dela
(`<arte>.edicoes.js`), e uma pequena biblioteca dentro da arte aplica essas mudanças sempre que a arte
abre — no editor, no navegador ou na hora de gerar o PNG/vídeo.

## Abrir o editor

> **Sem Python?** Baixe o executável na página de *Releases* do GitHub (Windows, macOS ou Linux), descompacte e
> dê dois cliques em **AFE**: ele abre o editor com as artes da pasta `artes/` ao lado dele. Para uma arte sua,
> arraste o `.html` dela em cima do AFE. Também há a demo online (link no README).

Todos os comandos rodam **de dentro da pasta do AFE** (as artes podem ficar em qualquer lugar):

```bash
python servidor.py --raiz PASTA_DAS_ARTES
```

Depois abra `http://localhost:8765/editor/` no navegador (Edge ou Chrome). O campo no topo lista as
artes `.html` da pasta; as que têm ✓ já estão ligadas ao editor.

- `--raiz` é a pasta onde ficam as artes (pode ter subpastas). `--porta 8765` troca a porta.
- `--biblioteca Marca=PASTA_DE_IMAGENS` (opcional, pode repetir): uma pasta de imagens — os assets da
  marca do cliente, por exemplo — que aparece na aba Assets de **todas** as artes, organizada pelas
  subpastas dela. "Marca" é o nome que aparece na tela; a pasta pode ficar em qualquer lugar.
  **Peças em código:** se ao lado da pasta de imagens (ou dentro dela) houver uma pasta `components/` — um
  design system exportado, com `components/<Nome>/preview.html`, `README.md` e os `.css` da marca — as
  peças também aparecem na aba Assets, prontas para pôr na arte.
- O servidor só atende este computador. Só grava o arquivo de edições de cada arte e, quando você usa uma
  imagem ou uma peça da biblioteca, cópias (imagens e CSS da marca) dentro da pasta da arte
  (`assets/biblioteca/`).

Exemplo com uma biblioteca: `python servidor.py --raiz ../minhas-artes --biblioteca
Marca=../minha-marca/assets`.

## Ligar uma arte ao editor

Uma arte só pode ser editada depois de "ligada" (uma vez só por arte):

```bash
python ligar.py CAMINHO/da/arte.html
```

Isso copia a biblioteca para junto da arte, cria o arquivo de edições vazio e acrescenta duas linhas
`<script>` no `.html`. Há dois modos, escolhidos sozinhos:

- **automático** — arte comum, que não avisa quando termina de montar: pronto, é só abrir no editor.
- **manual** — arte que monta a tela por código e marca `data-pronto` (geradas por script): o ligar.py
  mostra 2 linhas para colocar no código da arte, antes de ela marcar `data-pronto`:

  ```js
  await EDLIB.preparar(N);   // itens novos + textos editados (ANTES de medir textos)
  // ...ajustes da arte que medem o texto...
  EDLIB.finalizar(N);        // posição, tamanho, efeitos, forma, animação
  ```

`python ligar.py arte.html --conferir` mostra como a arte está, sem mudar nada.
Rodar o `ligar.py` de novo numa arte já ligada só atualiza a cópia da biblioteca.

**O que a arte precisa ter:** tamanho fixo (ex.: 1080×1350) e, de preferência, um elemento que
contenha tudo com `id="post"` (ou o atributo `data-ed-raiz`). Opcional: `window.CONFIG = { largura,
altura, paginas }` e `data-nome="..."` nos elementos para dar nome às camadas.

## Teste rápido (2 minutos)

```bash
python servidor.py --raiz exemplo
```

Abra `http://localhost:8765/editor/?arquivo=exemplo.html`, clique em **✎ Editar** e mexa à
vontade: é uma arte de exemplo, feita para isso.

Para conferir que tudo funciona depois de mexer no código do editor:

```bash
python testes/teste_rapido.py
```

Ele usa o editor de verdade num navegador escondido (selecionar, mover, texto, efeitos, forma, camadas,
assets, keyframes, curvas, copiar/colar, tempo da camada, escalonar, entradas, capa, salvar) e mostra o que passou. Com `--video` também gera um vídeo de teste.

## Levar para outro projeto ou cliente

1. Copie a pasta do AFE inteira para qualquer lugar (ou baixe do GitHub).
2. Ligue as artes do projeto: `python ligar.py caminho/arte.html`.
3. Abra: `python servidor.py --raiz pasta-das-artes`.

Para **editar** basta o Python 3 (o servidor só usa a biblioteca padrão) e um navegador (Edge ou Chrome).
Para **gerar vídeo** é preciso também o Playwright do Python e o ffmpeg — o editor avisa se faltar algo, e
não instala nada sozinho. O teste automático usa o Playwright.

## O que tem nesta pasta

```
(pasta do AFE)/
  README.md             apresentação do projeto (README.en.md = em inglês)
  LEIA.md               este arquivo
  CONTRIBUINDO.md       como contribuir (teste, changelog, convenções) (CONTRIBUTING.md = em inglês)
  LICENSE               licença GNU AGPL v3
  servidor.py           liga o editor (servidor local)
  ligar.py              liga uma arte ao editor
  render_anim.py        gera o MP4 de uma página animada (o botão "Gerar vídeo" usa; grava em out/)
  app/                  a tela do editor
    index.html            estrutura      editor.css   aparência
    js/                   comportamento, um arquivo por assunto (comece por main.js)
  arte/edicoes-lib.js   biblioteca que vai dentro de cada arte (o ligar.py copia)
  exemplo/              arte mínima para testar e servir de modelo
  demos/                artes de demonstração (post e carrossel sobre o AFE)
  distribuir/           monta o executável e a demo online (os workflows de .github/ usam)
  .github/workflows/    release a cada push + demo online no GitHub Pages
  testes/teste_rapido.py  conferência automática do editor
  docs/                 manual, arquitetura, roteiro, descobertas, histórico (docs/en/ = em inglês)
```

## Onde ficam as suas edições

- Num arquivo ao lado da arte: `<nome da arte>.edicoes.js` (em artes antigas, `edicoes.js`).
- A cada **Salvar**, a versão anterior é guardada em `build/edicoes-anteriores/` (ou
  `.edicoes-anteriores/`, se a pasta da arte não tiver `build/`). Pode apagar quando quiser.
- Apagar o arquivo de edições (ou deixá-lo com `window.EDICOES = {};`) devolve a arte ao original.
