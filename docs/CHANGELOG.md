# Histórico do AFE

**Português (BR)** · [English](en/CHANGELOG.md)

Mais novo em cima. Ao mudar algo, acrescente uma linha aqui (e na versão em inglês).

## 2.4 beta — 2026-11-17 · mesclagem, granulado, imagens do computador e tela reorganizada

**Novidades**
- **Mesclagem (blend mode)** por camada, com os modos do Photoshop que o navegador tem (Multiplicação, Tela,
  Sobrepor, Luz suave, Diferença, Cor…): no topo da aba Camadas e no botão direito (*Mesclagem ▸*). Campo `mix`.
- **Granulado:** item novo na aba Assets (Grão). Grão gerado pela própria arte (sem imagem), com força, tamanho,
  cor e animado ("ferve" 12×/s, sempre igual no mesmo instante: o vídeo bate com o editor). Entra travado e em
  Sobrepor; ajustes na aba Forma.
- **Imagens do computador:** solte um PNG/JPG/WebP/GIF/AVIF em cima da arte (vira camada; arquivo em
  `assets/importadas/`) ou na aba Assets (vai para **★ Assets gerais**, `assets-gerais/` na pasta das artes, e
  vale para todas as artes). Rota nova `/api/importar`, que confere o conteúdo e nunca troca arquivo existente.
  Funciona também na demo online (fica no navegador).
- **Loop:** botão ⟲ na barra de baixo (aceso por padrão; apagado = toca uma vez). Shift + play faz o contrário,
  só daquela vez. Fica guardado no navegador.

**Tela**
- Efeitos (Transformar, Efeitos, Forma, Animação) à **esquerda**; Camadas e Assets à **direita**.
- Barra de baixo reorganizada: tempo à esquerda, play no centro exato, chaves e curva logo depois, Motion Blur,
  Capa e Gerar vídeo à direita; ✕ vermelho apaga a chave.
- Atalhos da aba Transformar em lista (um por linha, em grupos), com as teclas lidas do ⚙.
- Aba Transformar em linhas: **Posição** (X e Y lado a lado), **Tamanho**, **Esticar** (L 🔗 A, com corrente que
  liga largura e altura na mesma proporção), **Girar**, **Opacidade**. Cada linha com ‹ ◇ › (um ◇ para o par) e
  **↺** que volta só aquela linha ao padrão.
- Barra de baixo sempre numa linha, com os grupos separados; em telas menores os botões ficam só com o ícone.
- Barras de cima centralizadas como a de baixo, com os grupos separados; **↶ Desfazer / ↷ Refazer** com nome.
- Caixas de número com a unidade dentro (px, %, °, em cinza; só visual), todas do mesmo tamanho; mais espaço e uma
  linha fina entre as seções das abas; Esconder no título; lista de Atalhos recolhível (▸/▾).
- **Apagar** vale também para elementos da arte (🗑, Delete ou botão direito): somem da arte e da lista, com
  confirmação; voltam com Ctrl+Z ou "Restaurar apagados". Campo `apagado` (biblioteca 2.91).
- Confirmação antes de **Voltar ao original** e de **Voltar tudo ao padrão** (⚙); aviso de quanto o motion blur
  deixa o vídeo mais lento.

**Biblioteca da arte:** versão 2.91 (`mix`, o item `granulado` e `apagado`). Rode o `ligar.py` nas suas artes para atualizar.

## 2.3 beta — 2026-11-16 · releases automáticos, executável e demo online

- **Endereço com modo:** `?modo=editar` ou `?modo=animar` abre o editor já com o modo ligado (no animar, a
  animação toca uma vez e para no fim). A demo online abre assim.
- **Release a cada push** (`.github/workflows/release.yml`): cada push na `main` cria um release novo, com
  número que nunca se repete (`<VERSAO do servidor.py>.<n>-beta`), notas automáticas e o **executável** para
  Windows, macOS e Linux (`distribuir/empacotar.py`, com PyInstaller na máquina do GitHub). Cada executável é
  ligado e testado antes de publicar.
- **Executável:** abre o navegador sozinho, usa a pasta `artes/` ao lado dele, aceita uma arte `.html` arrastada
  em cima (liga e abre) e `AFE ligar arte.html`. Se a porta estiver ocupada, tenta a seguinte. Gerar vídeo usa
  o Python do computador, se houver.
- **Demo online** (`.github/workflows/demo-online.yml`, GitHub Pages): o editor de verdade com as artes de
  `demos/artes`. Um *service worker* (`distribuir/demo/sw.js`) faz o papel do servidor dentro do navegador; as
  edições ficam só no navegador de quem testa, com "baixar minhas edições" e "voltar ao original".
- **App:** os endereços (`/api`, `/arte`…) passam a respeitar a pasta em que o editor está (`BASE` em `api.js`),
  para funcionar em `usuario.github.io/afe/`.
- **Servidor:** no Windows, a porta é pedida com exclusividade (antes, dois programas podiam ouvir a mesma porta);
  `VERSAO` = 2.3; opção `--abrir`.

## 2.3 beta — 2026-11-16 · primeira versão pública (beta)

Primeira versão em código aberto. O editor nasceu dentro de um projeto privado de produção de mídia; as
versões abaixo contam essa história. Nesta versão saiu tudo o que era daquele projeto:

- **Gerar vídeo:** grava sempre em `out/` ao lado da arte (ou em `--saida`). Saiu o atalho que procurava a
  pasta de renders do projeto de origem.
- **`ligar.py`:** a cópia da biblioteca vai ao lado do `.html` (ou para onde a arte já aponta). Saiu a
  regra especial de uma pasta do projeto de origem.
- **Servidor:** a lista de pastas ignoradas (`PULAR`) ficou só com nomes genéricos (`out`, `build`,
  `node_modules`, `__pycache__`, `fonts`, `placeholders`).
- **Licença:** GNU AGPL v3 (arquivo `LICENSE`).
- **Artes de demonstração** (`demos/artes/`): um post e um carrossel de 7 páginas sobre o próprio AFE, animados
  pelo AFE; print e GIF no README.
- **Documentação:** exemplos genéricos no lugar dos do projeto de origem; README e guia de contribuição
  novos; tudo em português e em inglês (`docs/en/`); `.gitignore`.

## 2.2 — 2026-11-15 · motion blur no vídeo

**Novidades**
- **Blur** (barra do tempo, ao lado de 🎞 Gerar vídeo): *sem · leve · normal · forte*, por página. O vídeo sai
  com rastro de movimento, como numa câmera. A prévia do editor e o PNG continuam sem blur.
- Custo: o vídeo demora ~4× (leve), ~8× (normal) ou ~12× (forte) mais para gerar. Ex.: 5 s de arte
  1080×1350 → ~20 s sem blur, ~2 min 20 s no normal.

**Código**
- `render_anim.py`: para cada quadro tira várias fotos com o "obturador" aberto (`_mb` = quanto do
  intervalo entre quadros: 0.25 / 0.5 / 1) e o ffmpeg faz a média (`tmix` + `select` + `setpts`).
  Novo `--mb` na linha de comando. Não precisou mudar a biblioteca das artes.
- Página ganhou o campo `_mb` (só gravado quando ligado).

Teste: 148 conferências (149 com `--video`; o vídeo de teste sai com blur leve e confere o nº de quadros).

## 2.1 — 2026-11-15 · mais efeitos contínuos

**Novidades** (aba Animação › Efeitos contínuos)
- Movimento: **Balançar (giro)**, **Órbita**, **Quique**.
- Tamanho: **Batida de coração** (duas batidas e uma pausa).
- Brilho: **Glitch RGB leve** (de vez em quando as cores "descolam" em rosa e ciano).
- Opacidade: **Estrobo suave** (acende e apaga).
- Cada efeito pode entrar com a sua própria **vel** inicial (campo `vel` em `presets.js`).

**Biblioteca 2.8** — artes ligadas antes precisam do `ligar.py` de novo para os efeitos novos aparecerem no
PNG/vídeo (o editor avisa "biblioteca antiga").

Teste: 147 conferências (148 com `--video`).

## 2.0.1 — 2026-11-15 · peças que não deixavam escolher

**Correções** (janela *Escolher peça*)
- Peças cuja prévia *ajusta* uma classe da marca: nada era selecionável. O editor
  tratava como "arrumação" toda classe citada no `<style>` da prévia, mesmo sendo da marca. Agora classe da
  marca = a que está nos arquivos .css da marca.
- Peças com recorte ou máscara (`clip-path`, `mask`): selecionavam, mas o contorno era
  cortado junto e parecia que não. O destaque virou uma caixa desenhada por cima da prévia.
- Peças que a marca faz ignorar o mouse (camadas decorativas) agora também recebem o clique na prévia.
- Prévias sem classes da marca (desenhos soltos, tabelas de cores): passam a oferecer o desenho
  inteiro (svg), a imagem ou o bloco com classe mais próximo. Um svg solto entra na arte com o tamanho da prévia
  e acompanha a largura do item.
- Camadas empilhadas (um desenho + o brilho dele): o clique pega o conjunto; a trilha ainda deixa descer.

Teste: 145 conferências (146 com `--video`).

## 2.0 — 2026-11-15 · peças do design system na aba Assets

**Novidades**
- **Peças em código da marca na aba Assets:** se a biblioteca tem uma pasta `components/` (um design system
  exportado), cada peça aparece em *★ Marca › Peças › grupo*, com uma miniatura viva.
- **Janela "Escolher peça":** a prévia grande ao lado das instruções (o README da peça). Passe o mouse e
  clique no pedaço que quer; a trilha em cima mostra os níveis (ex.: `ds-cartao › ds-titulo`) e deixa subir
  para o bloco de fora. **＋ Pôr na arte** insere (ou duplo clique no pedaço); **⧉ Copiar o código** copia o HTML.
- **Na arte a peça é um item ★:** mover, alças, animar, entradas, esconder, travar — e os textos de dentro
  trocam com duplo clique. As alças dos lados mudam a largura de verdade (o texto se reorganiza).
- **O CSS da marca vai junto:** o editor copia os `.css` da biblioteca (e as imagens que a peça usa) para
  `assets/biblioteca/<Marca>/` da arte, e a arte passa a carregá-los **antes** dos estilos que já tinha (os
  da arte continuam valendo por cima). Na cópia saem os `@import` de endereços da internet (fontes do
  Google): a arte tem de funcionar sem rede, com as fontes que ela mesma traz.

**Formato / biblioteca da arte (versão 2.7)** — item novo `tipo: "html"`:
`{ html, css: [arquivos], contexto: {fonte, cor…}, estilo, nome, w }`.

**Servidor** — rotas novas `GET /api/pecas`, `GET /ds/<biblioteca>/<arquivo>`, `POST /api/usar-peca`; passa a
copiar também arquivos `.css` de uma biblioteca para a pasta da arte.

**Ainda não:** "nova arte a partir de um modelo" (capa de carrossel, story, thumbnail…) — por enquanto
esses modelos entram como uma peça grande numa arte que já existe.

**Código** — módulo novo `painel-pecas.js`. Teste: 142 conferências (143 com `--video`).

## 1.9 — 2026-11-15 · tela de Config (atalhos e teclas do mouse)

**Novidades**
- **⚙ Config** (botão no topo): escolher a tecla de cada comando e o que Shift, Alt e Ctrl fazem ao usar o
  mouse. Fica guardado no navegador (neste computador); não mexe nas artes. *Voltar tudo ao padrão* desfaz.
- **Atalhos novos** (todos trocáveis): **E** ✎ Editar · **A** 🎬 Animar · **1–6** abas (Transformar, Efeitos,
  Forma, Animação, Camadas, Assets) · **T** editar o texto · **H** esconder/mostrar · **L** travar/destravar ·
  **]** frente · **[** trás · **K** gravar ◆ Chave. Comandos sem tecla padrão, prontos para receber uma:
  painéis laterais, minimizar a linha do tempo, centralizar, voltar ao original, capa, abrir a Config.
- **Teclas do mouse configuráveis:** travar no eixo / andar devagar / soltar o ímã (ao arrastar); cantos
  livres / a partir do centro (alças); rápido / fino (campos de número); somar à seleção / ignorar a trava /
  alternar com a roda (selecionar).

**Código**
- `atalhos.js` virou uma tabela (`COMANDOS`): cada comando com tecla padrão, quando vale e o que faz.
- Módulos novos `config.js` (preferências) e `painel-config.js` (a tela). O código do mouse pergunta
  `temMod(ev, 'papel')` em vez de olhar `ev.shiftKey`.
- Teste: 132 conferências (133 com `--video`).

## 1.8.1 — 2026-11-15 · duplo clique nos sliders

- **Duplo clique num slider volta ao valor padrão:** ajustes de imagem (Desfoque 0, Brilho / Saturação /
  Contraste 100), opacidade das cores (100), ângulo do gradiente (135), espessura do contorno (3),
  opacidade da barra rápida (100). Em **Cantos**, o padrão é o arredondamento que a arte já tinha (a
  edição é retirada). A dica aparece ao passar o mouse no slider.
- Para dar um padrão a um slider novo: `data-padrao="valor"` nele (o resto é automático, em `campos.js`).
- Teste: 126 conferências (127 com `--video`).

## 1.8 — 2026-11-15 · barra rápida, travar camada, botão direito, Alt + roda

**Novidades**
- **Barra rápida** (faixa abaixo da barra de cima, com ✎ Editar ligado): alinhar na arte (esquerda, centro,
  direita, topo, meio, base), opacidade (régua + número), ⤒ Frente / ⤓ Trás, esconder, travar e ↺ Original.
- **Travar camada:** o clique na arte passa por ela e pega o que está atrás (bom para fundos e blocos
  grandes). **Ctrl+clique** seleciona mesmo assim; a lista de camadas mostra 🔒 (clique no cadeado destrava).
- **Botão direito** num elemento da arte ou numa linha da lista de camadas: frente/trás, esconder, travar,
  editar o texto, voltar ao original — e, na arte, *Selecionar o que está embaixo* (lista dos elementos
  empilhados naquele ponto).
- **Alt + roda do mouse** em cima da arte: alterna a seleção entre os elementos empilhados embaixo do mouse.
- **Alinhar nas bordas** da arte (antes só havia centralizar).

**Mudanças de comportamento**
- O clique na arte agora atravessa o que não dá para selecionar: clicar por cima de um desenho de fundo
  (`<canvas>`) seleciona o elemento que está atrás dele, em vez de soltar a seleção.

**Correções**
- Shift + roda do mouse (tamanho rápido na arte e de 10 em 10 nos campos) só diminuía em navegadores que
  transformam a roda em rolagem lateral quando o Shift está apertado.

**Formato** — campo novo e opcional na camada: `trava` (a arte ignora; é só do editor).

**Código**
- Módulos novos `barra-rapida.js` e `camada-acoes.js` (ações compartilhadas por barra, lista e menus).
- Teste: 124 conferências (125 com `--video`).

## 1.7 — 2026-11-15 · caixa de transformação com alças

**Novidades**
- **Alças na caixa de seleção** (como a transformação livre do Photoshop), no elemento principal:
  - **cantos:** tamanho proporcional — o canto oposto fica parado (Shift = livre, largura e altura separadas);
  - **lados:** só a largura ou só a altura;
  - **bolinha em cima:** girar (Shift = de 15 em 15 graus);
  - **Alt:** muda a partir do centro.
- **A caixa gira junto com o elemento** (antes ficava sempre reta em volta dele).
- **Largura % e Altura %** na aba Transformar (esticar só num sentido), com ‹ ◇ › de keyframe.
- **Itens acrescentados mudam de tamanho de verdade:** numa forma, as alças mudam a largura e a altura
  reais (a borda e os cantos não deformam); numa imagem ou texto acrescentados, os cantos mudam a largura
  da imagem / o tamanho da letra. Elementos da arte **esticam** (o layout da arte não muda).

**Formato / biblioteca da arte (versão 2.6)**
- Campos novos e opcionais na camada: `sx` e `sy` (esticado da largura / da altura; 1 = normal). Animáveis.

**Código**
- Módulo novo `alcas.js`; `selecao.caixaDe()` devolve a caixa "de verdade" (centro, tamanho, giro).
- Teste: 117 conferências (118 com `--video`).

## 1.6 — 2026-11-15 · campos que arrastam, teclas do mouse, keyframe ao lado do campo, correção do texto em linha

**Correções**
- **Mover, aumentar, girar e as entradas não funcionavam em trechos de texto "em linha"** (`<span>`, `<em>`
  — por exemplo a palavra colorida de um título): o navegador ignora esses movimentos nesse tipo de
  elemento. Agora o trecho vira "bloco em linha" quando precisa se mexer (o texto não sai do lugar).
- **A mesma coisa aparecia duas vezes na lista de camadas:** um embrulho que só contém um texto (a linha
  do título + a palavra colorida dentro dela) agora aparece como uma camada só — a de dentro, que é a
  que o clique seleciona. O de fora continua acessível pelo **⬆ Bloco de fora**.

**Novidades**
- **Campos de número que arrastam:** clique e arraste para os lados dentro de qualquer campo de número
  para mudar o valor (Shift = 10× mais rápido, Alt = ajuste fino). O arrasto inteiro é um Ctrl+Z. Um
  clique simples continua servindo para digitar; as setinhas do campo continuam funcionando.
- **Teclas ao arrastar um elemento na arte:** Shift trava no eixo (só para os lados ou só para
  cima/baixo), Alt anda 4× mais devagar, Ctrl solta o ímã. *(Antes: Alt soltava o ímã.)*
- **Keyframe ao lado do campo** (como no CapCut): com o 🎬 Animar ligado, X, Y, Tamanho, Girar e Opacidade
  ganham **‹ ◇ ›** — ◇ põe ou tira a chave só daquela propriedade no frame atual (◆ = tem chave aqui);
  ‹ › pulam para a chave anterior/próxima dela.

**Formato / biblioteca da arte (versão 2.5)** — sem campo novo; só o comportamento do texto em linha.

**Código**
- `doc.abrirGesto()` / `fecharGesto()`: várias mudanças seguidas viram um passo só do desfazer.
- Teste: 110 conferências (111 com `--video`).

## 1.5 — 2026-11-15 · usar imagem como fundo

**Novidades**
- **Usar como fundo:** em qualquer imagem da aba Assets, o botão **fundo** (aparece ao passar o mouse) ou o
  botão direito → *Usar como fundo*. A imagem cobre a arte toda sem deformar e fica atrás de tudo.
- As camadas de fundo que a arte já tinha (um desenho ou imagem que cobre tudo) são escondidas na mesma
  ação; **apagar o fundo traz elas de volta**. Um fundo por página: escolher outro troca.
- A imagem de fundo aparece no fim da lista de camadas como *★ fundo · nome*; na arte, o clique passa por
  ela (seleciona-se pela lista de camadas).
- Botão direito numa imagem da aba Assets: *Pôr na arte* / *Usar como fundo*.

**Formato / biblioteca da arte (versão 2.4)**
- Item novo de imagem aceita `fundo: true` (e `escondeu: [caminhos]`, as camadas que ele escondeu).
- Com imagem de fundo, a raiz da arte recebe `isolation: isolate` (volta ao que era sem o fundo).

**Código**
- Teste: 98 conferências (99 com `--video`).

## 1.4 — 2026-11-15 · biblioteca de assets (assets da marca na aba Assets)

**Novidades**
- **Biblioteca de assets:** uma pasta de imagens de fora (ex.: os assets da marca) aparece na aba Assets
  de todas as artes, organizada pelas subpastas (★ Marca › Fundos, ★ Marca › Ícones…). Liga-se no
  servidor com `--biblioteca [NOME=]PASTA` (pode repetir). Ao usar um item, a imagem é copiada para
  `<pasta da arte>/assets/biblioteca/<NOME>/…`, porque o PNG e o vídeo só enxergam a pasta da arte.
- **Placeholders fora da barra:** pastas chamadas `placeholders` (imagens provisórias de modelo) não
  aparecem mais na aba Assets, nem na pasta da arte nem na biblioteca. Os arquivos continuam no disco.
- Na aba Assets, as imagens da própria arte ficam depois da biblioteca, com o rótulo *Desta arte ›*.

**Servidor**
- Rotas novas: `GET /api/biblioteca`, `GET /bib/<biblioteca>/<imagem>`, `POST /api/usar-asset`.
- O servidor passou a gravar uma segunda coisa (além do arquivo de edições): cópias de **imagens** de
  uma biblioteca, sempre em `assets/biblioteca/` da pasta da arte. Nunca apaga nem troca um arquivo
  que já exista com outro conteúdo (grava com outro nome).

**Código**
- Teste: 93 conferências (94 com `--video`).

## 1.3 — 2026-11-14 · entradas, frame da capa e curvas com desenho

**Novidades**
- **Entradas** (aba Animação → *Entrada*): Aparecer, Desfocado → nítido, Subir, Descer, Vir da esquerda,
  Vir da direita, Zoom (pop), Girar e entrar, Cair e quicar, Glitch. Uma por camada. Roda no começo da
  camada (padrão: 30 frames) e depois some; cartão com **duração** e **força**; ▶ toca a prévia.
  A entrada anda junto com o delay e com o Escalonar. Na folha: faixa amarela no começo da barra.
- **Frame da capa** (🖼 Capa na barra do tempo, ▼ na régua): o instante que a arte mostra parada — no
  PNG, no navegador e no editor fora do modo Animar. Padrão: o **último frame** (tudo já entrou).
- **Menu de curvas com desenho:** cada curva mostra um gráfico e uma bolinha andando com ela (na barra
  do tempo e no botão direito do losango). Gerado por código, com a mesma conta da animação.
- Aviso quando uma mudança feita fora do modo Animar vira keyframe (camada com chaves).
- Aba Animação reorganizada: Entrada · Tempo da camada · Escalonar · Efeito contínuo.

**Mudança de comportamento**
- Antes, a arte parada (PNG) e o editor fora do Animar mostravam o **frame 0**. Agora mostram a **capa**
  (padrão: o fim). Em página só com efeitos contínuos nada muda (o fim é igual ao começo do loop).
- Ligar o 🎬 Animar leva a cabeça ao frame 0; desligar volta para a capa.

**Formato / biblioteca da arte (versão 2.3)**
- Campos novos e opcionais: `ent` na camada (`{ tipo, dur, int }`) e `_capa` na página (segundos).
- `EDLIB.curva(nome, u)` (a conta de uma curva) e `EDLIB.capa(n)`.
- "Piscar a opacidade" parte da opacidade que a arte já tinha (antes supunha 100%).

**Código**
- Módulo novo `curvas.js` (gráfico, bolinha, menu de curvas); `menu.js` aceita desenho nos itens e abre
  para cima; catálogo `ENTRADAS` em `presets.js`; `tocarTrecho()`, `capa()`, `definirCapa()` em `tempo.js`.
- Teste: 87 conferências (88 com `--video`).

## 1.2 — 2026-11-14 · tempo da camada e Escalonar

**Novidades**
- **Tempo da camada** (estilo After Effects): cada camada pode ter um frame em que **aparece** e um em
  que **some**. Fora desse trecho ela fica invisível no vídeo.
- **Barra da camada na folha de keyframes** (faixa azul atrás dos losangos): arrastar o meio move a
  camada inteira no tempo (as chaves vão junto — é o "delay"); as pontas cortam o começo e o fim sem
  mexer nas chaves. Com várias camadas selecionadas, arrastar a barra de uma move todas.
- **Aba Animação:** campos **Começa no frame** (move a camada com as chaves) e **Some no frame**.
- **⏱ Escalonar:** com vários selecionados, cada um começa N frames depois do anterior — na ordem de
  leitura (cima→baixo, esquerda→direita) ou na ordem em que foram selecionados. 0 = todos juntos.
- Botão direito na linha da camada: *Começar aqui*, *Cortar o começo aqui*, *Cortar o fim aqui*,
  *Tirar os cortes*.
- As camadas **selecionadas** agora aparecem na folha mesmo sem animação (é por ali que se dá um tempo
  a elas).

**Formato / biblioteca da arte (versão 2.2)**
- Campos novos e opcionais na camada: `ini` e `fim` (segundos). Arquivos antigos continuam valendo.
- `EDLIB.quadro()` ficou mais firme: camada que deixa de ser animada (ou perde todas as edições) volta
  ao estado certo no quadro seguinte, sem precisar refazer a arte inteira.

**Correções**
- Uma chave só passava a valer **um frame depois** do frame dela (o tempo gravado, com 4 casas, fica um
  tiquinho depois do instante real do frame). Quase invisível nas curvas suaves; visível no Degrau.

**Código**
- Módulo novo `tempo-camada.js` (começo/fim, mover, cortar, escalonar); `ordemDeLeitura()` em `alinhar.js`.
- Teste: 73 conferências (74 com `--video`).

## 1.1 — 2026-11-14 · curvas (easing) e copiar/colar de chaves

**Novidades**
- **Curva (easing) por keyframe:** Suave (padrão), Linear, Acelerar, Frear, Recuo, Quique e Degrau. Vale
  para o trecho que sai da chave até a próxima. Escolha no menu **Curva** da barra do tempo ou com o
  botão direito no losango. O formato do losango mostra a curva.
- **Copiar e colar chaves:** Ctrl+C / Ctrl+V (ou os botões ⧉ Copiar / ⎘ Colar). Cola onde a cabeça
  está: no mesmo elemento (outro frame) ou nos elementos selecionados. Funciona entre páginas.
- **Marcar várias chaves** com Shift+clique: arrastar move o grupo (sem mudar o espaçamento), Delete
  apaga todas, Ctrl+C copia todas.
- **Menu do botão direito** na folha de keyframes: curva, copiar, colar aqui, apagar; no nome da
  camada, "copiar todas as chaves desta camada".
- O editor avisa quando a cópia da biblioteca dentro da arte é mais antiga que a dele (rodar o `ligar.py`).

**Formato / biblioteca da arte (versão 2.1)**
- Campo novo e opcional na chave: `ease` (nome da curva). Arquivos antigos continuam valendo (sem
  `ease` = suave). A curva padrão não é gravada.
- `EDLIB.curvas` lista as curvas que a biblioteca conhece.
- Textos CSS (brilho, sombras) nunca passam do ponto nas curvas Recuo/Quique: valores fora da faixa
  quebrariam o CSS.

**Correções** (achadas na revisão da etapa 1)
- Salvar duas vezes no mesmo segundo guardava só uma cópia da versão anterior (a segunda cópia
  sobrescrevia a primeira). Era também a causa de uma falha intermitente no teste.
- Arrastar uma chave para cima de outra: às vezes valia a que estava parada, e não a arrastada.
- Arrastar chaves até a borda da folha não "amassa" mais o grupo (ele para inteiro na borda).

**Código**
- Módulo novo `menu.js` (menu do botão direito, reaproveitável). Recado novo `chave`.
- Operações de curva e copiar/colar em `tempo.js`; catálogo `CURVAS` em `presets.js`.
- Teste: 60 conferências (61 com `--video`), incluindo a organização da tela (minimizar, painéis).

## 1.0 — 2026-11-13 · pasta portátil, código em módulos, correções

**Organização**
- O editor passou a morar numa pasta única e independente (então chamada `editor-artes/`), copiável para qualquer
  projeto. Antes: arquivos soltos dentro do projeto onde ele nasceu.
- Servidor recebe a pasta das artes por `--raiz`; endereços novos: `/editor/`, `/arte/`, `/api/`.
- `ligar.py` (liga qualquer arte; modos automático e manual), arte de `exemplo/`, `testes/teste_rapido.py`.
- Documentação: LEIA, MANUAL, ARQUITETURA, ROTEIRO, DESCOBERTAS e este histórico.
- Código da tela reescrito em 22 módulos pequenos (antes: 7 arquivos com variáveis globais
  compartilhadas); CSS em arquivo próprio; estado único (`S`) e recados entre módulos.

**Formato / biblioteca da arte (versão 2)**
- API para a arte: `EDLIB.preparar` / `finalizar` / `aplicarTudo` (antes: `criarNovos`,
  `aplicarTexto`, `aplicarPosicao`); modo automático com `data-auto`; `EDLIB.info()`.
- Raiz configurável (`#post`, `data-ed-raiz`, `EDLIB_RAIZ`, ou `<body>`); nomes de camada com `data-nome`.
- Itens acrescentados com id próprio (`#n1`) em vez de posição.
- Um arquivo de edições por arte (`<arte>.edicoes.js`); o antigo `edicoes.js` continua valendo.

**Novidades**
- Refazer (Ctrl+Shift+Z / Ctrl+Y); desfazer continua valendo depois de salvar e entre páginas.
- Campo da arte com lista das artes da pasta (✓ = ligada); abre a última usada.
- ◆ Chave e ✕ Chave valem para todos os selecionados; menu de efeitos contínuos agrupado.
- 👁 da lista de camadas não muda mais a seleção.

**Correções**
- Mudar algo que não anima (esconder, cor, ordem) numa camada com keyframes criava uma chave vazia.
- Aba Forma transformava círculo em quadrado arredondado (raio em % lido como px) e gravava o
  arredondamento mesmo sem o usuário mexer nele.
- Aba Efeitos reordenava as funções do filtro (mudava o resultado em artes com desfoque + brilho).
- Voltar ao original podia apagar estilos próprios da arte em `background`/`border`.
- Editar o texto de um parágrafo depois de mover uma palavra dele embutia o estilo da palavra no texto.
- Trocar de página deixava contornos da seleção antiga.
- Arrastar um losango (ou a régua) e soltar em cima da arte deixava o arrasto "preso".
- Espaço/Enter podiam repetir o último botão clicado em vez de tocar/pausar.
- Link do vídeo gerado quebrava em pastas com acento no nome.
- Mover um elemento e o bloco que o contém, juntos, movia o de dentro em dobro.
- Piscar/respirar o glow podiam usar um brilho-base desatualizado depois de desfazer.
- Mexer na duração, na folha ou nos itens ignorava parte das regras do histórico (agora tudo passa
  por `doc.mudar` / `doc.editar`).
- Servidor: confere `Host`/`Origin`, exige JSON, fixa os tipos de arquivo (módulos no Windows).

**Desempenho**
- Uma ação = um redesenho de cada painel (antes: um por elemento selecionado, a cada movimento do mouse).
- A folha de keyframes não é mais refeita ao mover a cabeça ou tocar (só a cabeça anda).
- Listas (camadas, efeitos, forma) só se redesenham quando o que mostram mudou.
- A lib não reescreve estilos que já estão com o valor certo (a cada quadro da animação).
- O "ao vivo" faz 1 consulta por segundo (eram 2) e pausa com a janela escondida.

## 0.6 — 2026-11-13 · tela reorganizada
Tela reorganizada (barra de cima; esquerda Camadas | Assets; direita Transformar | Efeitos | Forma |
Animação), linha do tempo minimizável, seleção múltipla com Shift+clique.

## 0.5 — 2026-11-12 · folha de keyframes
Folha estilo Blender contada em frames: resumo, camadas, canais, régua com cabeça azul; clicar,
arrastar e apagar chaves; keyframes sempre em frame inteiro.

## 0.4 — 2026-11-12 · camadas, forma, assets, animação
Painel com Camadas/Efeitos/Forma; gaveta de assets; keyframes com gravação automática; efeitos
contínuos (wiggle, flutuar, pulsar, piscar…); gerar vídeo MP4.

## 0.3 — 2026-11-12 · efeitos e alinhamento
Painel de efeitos (glow em camadas, sombras, cor, ajustes de imagem, copiar/colar); centralizar; ímã.

## 0.2 — 2026-11-12 · editor manual
Selecionar, arrastar, roda = tamanho, duplo clique = texto, desfazer, salvar em `edicoes.js`.

## 0.1 — 2026-11-12 · visualizador
Arte encaixada na tela, troca de página, recarregar automático.
