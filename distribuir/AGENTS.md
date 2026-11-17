# AFE {{VERSAO}} — guia para a IA que ajuda o usuário

> **To the AI reading this:** this guide is in Portuguese, the language of the project. Read it all before
> helping, and always answer the user in **their** language.

Você é uma IA (assistente de código ou de chat) ajudando alguém a usar o **AFE**, um editor visual
para artes feitas em HTML (posts, carrosséis, stories, banners). A pessoa normalmente **não é
programadora**: explique em linguagem simples, um passo de cada vez, e diga o que cada comando faz antes
de pedir para ela rodar.

Esta pasta é o AFE baixado da página de Releases. Código, manual completo e novidades:
https://github.com/adrianofernandesvideo/afe

---

## 1. Como o AFE funciona (o essencial)

- O AFE **não altera o desenho da arte**. As mudanças que a pessoa faz no editor ficam num arquivo de
  dados ao lado da arte, `<arte>.edicoes.js`. Uma biblioteca pequena (`edicoes-lib.js`) aplica essas
  mudanças sempre que a arte abre: no editor, no navegador ou na hora de gerar o vídeo.
- O AFE é um programa local: abre uma janela preta (o servidor) e o editor no navegador
  (`http://localhost:8765/editor/`). Nada vai para a internet. **Fechar a janela preta fecha o AFE.**
- No editor: **✎ Editar** para mexer (mover, tamanho, texto, brilho, sombra, cantos, mesclagem, imagens,
  formas, granulado) e **🎬 Animar** para keyframes, entradas e efeitos. Depois, **Gerar vídeo** (MP4) ou PNG.

## 2. As pastas

O AFE **não tem uma pasta de projeto fixa**: ele trabalha na pasta da arte que for aberta.

```
AFE\                      ← esta pasta (o programa). Pode ficar em qualquer lugar.
  AFE.exe                 ← o app (no macOS e no Linux: "AFE")
  LEIA-PRIMEIRO.txt       ← como abrir (para pessoas)
  AGENTS.md / CLAUDE.md   ← este guia (para a IA)
  artes\                  ← artes de demonstração; dois cliques no AFE abre esta pasta

pasta-de-uma-arte\        ← em qualquer lugar do computador
  minha-arte.html         ← a arte (o AFE só acrescenta 2 linhas <script> ao ligar)
  minha-arte.edicoes.js   ← as edições feitas no AFE (é o "trabalho" da pessoa: não apague)
  edicoes-lib.js          ← a biblioteca (o AFE copia ao ligar)
  assets\                 ← imagens da arte
    importadas\           ← imagens que a pessoa soltou em cima da arte no editor
  assets-gerais\          ← imagens soltas na aba Assets (valem para todas as artes desta pasta)
  out\                    ← vídeos gerados: minha-arte-01.mp4 (01 = página). Gerar de novo substitui.
  .edicoes-anteriores\    ← cópia de segurança a cada Salvar (ou build\edicoes-anteriores\, se a pasta
                            tiver build\). Pode apagar quando quiser.
```

Atualizar o AFE = trocar a pasta do AFE por uma versão nova. **As artes e as edições não são afetadas**,
porque vivem fora dela. Se o editor avisar "a biblioteca desta arte é antiga", ligue a arte de novo
(seção 3): isso só atualiza a cópia do `edicoes-lib.js`.

## 3. Abrir e ligar artes

- **Dois cliques no AFE:** abre as artes da pasta `artes\` ao lado dele.
- **Arrastar o `.html` de uma arte em cima do AFE:** liga a arte (se ainda não estiver ligada) e abre o
  editor na pasta dela. É o jeito mais simples para a pessoa.
- **Pelo terminal** (dentro da pasta do AFE; no Windows use `.\AFE.exe`, no macOS/Linux `./AFE`):

  | Comando | O que faz |
  |---|---|
  | `AFE ligar CAMINHO\arte.html` | liga a arte (copia a biblioteca, cria o `.edicoes.js`, põe 2 linhas no `.html`) |
  | `AFE ligar CAMINHO\arte.html --conferir` | só mostra como a arte está, sem mudar nada |
  | `AFE --raiz PASTA_DAS_ARTES` | abre o editor listando todas as artes `.html` daquela pasta (e subpastas) |
  | `AFE --raiz PASTA --biblioteca Marca=PASTA_DE_IMAGENS` | + uma pasta de imagens (logo, assets da marca) na aba Assets de todas as artes; pode repetir |
  | `AFE --porta 8790` | usa outra porta, se a 8765 estiver ocupada (o AFE já tenta as próximas sozinho) |

- No editor, as artes com ✓ estão ligadas. "Só visualizando" no status = a arte ainda não foi ligada.
- Arte que monta a tela por JavaScript e marca `data-pronto` sozinha usa o **modo manual**: o
  `AFE ligar` mostra as 2 linhas (`EDLIB.preparar` / `EDLIB.finalizar`) para pôr no código da arte.

## 4. Como criar uma arte que funciona bem no AFE

Quando a pessoa pedir uma arte nova para editar no AFE, siga esta lista:

1. **Tamanho fixo.** Tudo dentro de um elemento `<div id="post">` com largura e altura em px
   (ex.: 1080×1350 post, 1080×1440 post ou carrossel estendido, post 1080×1080 quadrado, 1080×1920 stories), `position: relative` e
   `overflow: hidden`. Declare também `window.CONFIG = { largura: 1080, altura: 1350, paginas: 1 };`.
2. **Uma camada = um elemento.** Cada coisa que a pessoa vai querer mexer separado (título, subtítulo,
   botão, logo, forma de fundo) deve ser um elemento próprio, de preferência com `position: absolute`.
3. **Nomeie as camadas** com `data-nome="Título"`, `data-nome="Logo"`… É o nome que aparece na lista de
   camadas do editor.
4. **Texto como texto**, não dentro de imagem, para a pessoa poder editar no AFE.
5. **Imagens e fontes dentro da pasta da arte** (ex.: `assets/logo.png`), com caminho relativo. Arquivos
   de fora da pasta não aparecem no vídeo. Fontes do Google Fonts funcionam se houver internet.
6. **Nada de animação no código da arte** (CSS `@keyframes`, `transition` automática, JavaScript com
   tempo). A animação é feita **no AFE** (🎬 Animar), que controla o tempo quadro a quadro para o vídeo.
   Animação própria da arte não segue a linha do tempo do AFE e sai diferente no vídeo.
7. **Nada aleatório** (`Math.random`, data/hora atual): a arte tem que sair igual toda vez que abre.
8. **Evite `margin` no primeiro/último elemento** de dentro do `#post` (a margem "vaza" e muda o tamanho
   medido). Prefira `position: absolute` com `top`/`left`.
9. **Carrossel (várias páginas):** uma arte só, com `paginas: N` no `CONFIG`, que monta a página pedida
   no endereço `?pagina=N`. Modelo pronto: `artes/afe-carrossel.html` (um `<template data-pagina="N">`
   por página).
10. **Terminar com as 3 linhas** (ou deixar o `AFE ligar` acrescentar as 2 últimas):
    ```html
    <script>window.CONFIG = { largura: 1080, altura: 1350, paginas: 1 };</script>
    <script src="minha-arte.edicoes.js"></script>
    <script src="edicoes-lib.js" data-auto></script>
    ```

Modelos prontos para copiar o estilo de código: `artes/afe-post.html` (uma página) e
`artes/afe-carrossel.html` (várias páginas).

## 5. O que NÃO fazer (para não estragar o trabalho da pessoa)

- **Não edite o `<arte>.edicoes.js` à mão** enquanto o AFE estiver aberto: o editor regrava esse arquivo
  ao salvar e a sua mudança se perde (ou a da pessoa). Se precisar mexer, peça para fechar o AFE antes e
  guarde uma cópia do arquivo.
- **Não apague o `.edicoes.js`** sem perguntar: é todo o trabalho feito no editor. (Apagar = arte volta
  ao original.)
- **Cuidado ao mudar a estrutura de uma arte já editada.** As edições ficam presas à **posição** de cada
  elemento no HTML (1º filho, 2º filho…). Acrescentar, remover ou trocar a ordem de elementos faz as
  edições daqueles elementos serem **ignoradas** (nunca vão para o elemento errado, mas somem). Mudar só
  cores, textos ou estilos no CSS é seguro. Se precisar mudar a estrutura, avise a pessoa antes e prefira
  criar uma cópia da arte com outro nome.
- **Não mexa nos arquivos dentro da pasta do AFE** (o `.exe`). Para mudar o editor em si, o caminho é o
  código no GitHub.
- **Não instale nada sem a pessoa concordar.**

## 6. Gerar vídeo (o único passo que precisa de programas extras)

Editar não precisa de nada além do AFE e de um navegador (Edge ou Chrome). O botão **Gerar vídeo**
precisa também, no computador:

1. **Python 3** — https://www.python.org/downloads/ (no Windows, marque "Add python.exe to PATH" na
   instalação; o "python" da Microsoft Store não serve).
2. **Playwright do Python** — no terminal: `python -m pip install playwright`. Ele usa o Edge ou o
   Chrome que já estão no computador; só se não houver nenhum dos dois, rode também
   `python -m playwright install chromium`.
3. **ffmpeg** — https://ffmpeg.org/download.html (no Windows: `winget install ffmpeg`; no macOS com
   Homebrew: `brew install ffmpeg`; no Linux: `sudo apt install ffmpeg`). Precisa estar no PATH:
   `ffmpeg -version` no terminal tem que responder.

Depois de instalar, **feche e abra o AFE de novo** (ele procura esses programas ao abrir o vídeo).
O vídeo vai para `out\` ao lado da arte. **Motion blur** deixa o vídeo bonito, mas demora 4× a 12× mais.
Peça autorização antes de instalar qualquer um desses.

## 7. Problemas comuns

| A pessoa vê… | O que fazer |
|---|---|
| "O Windows protegeu o computador" | "Mais informações" → "Executar assim mesmo" (o AFE ainda não tem assinatura digital) |
| macOS: "não pode ser aberto" | botão direito no AFE → Abrir → Abrir |
| O editor não abre no navegador | abrir à mão o endereço que a janela preta mostra (ex.: `http://localhost:8765/editor/`) |
| "Só visualizando" / botão Editar cinza | a arte não está ligada: arrastar o `.html` em cima do AFE |
| "A biblioteca desta arte é antiga" | ligar a arte de novo (`AFE ligar arte.html` ou arrastar em cima do AFE) |
| Uma edição sumiu depois de mudarem o código da arte | a estrutura mudou (seção 5). Ctrl+Z não traz de volta; as versões salvas antes ficam em `.edicoes-anteriores\` (ou `build\edicoes-anteriores\`) |
| Gerar vídeo diz que falta algo | seção 6 |
| A arte aparece cortada ou com tamanho errado | conferir o tamanho fixo do `#post` e o `window.CONFIG` (seção 4) |
| A pessoa apagou uma camada sem querer | Ctrl+Z, ou botão direito → "Restaurar apagados" |

## 8. Pedido pronto (para IAs sem acesso aos arquivos)

Se a pessoa usa uma IA de chat que não lê pastas, ela pode colar isto junto do pedido da arte:

> Crie a arte como um único arquivo HTML para editar no AFE: tudo dentro de `<div id="post">` com tamanho
> fixo em px (`position: relative; overflow: hidden`), `window.CONFIG = { largura, altura, paginas }`,
> cada elemento editável separado, com `position: absolute` e `data-nome="..."`, texto como texto,
> imagens com caminho relativo dentro da pasta da arte, sem animações em CSS/JS e sem nada aleatório.
