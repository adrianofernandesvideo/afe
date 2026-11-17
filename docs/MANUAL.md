# Manual do AFE

**Português (BR)** · [English](en/MANUAL.md)

Como usar o editor no dia a dia. (Para abrir o editor e ligar uma arte, veja o [LEIA.md](../LEIA.md).)

## A tela

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◧  ◀ 3/20 ▶  [ arte aberta ▾ ]   ✎ Editar  🎬 Animar   ↶ ↷  💾 Salvar  status  ◨ │
├───────────────┬──────────────────────────────────┬───────────────────────────┤
│ Transformar│Efeitos│Forma│                       │ Camadas│Assets             │
│ Animação                  │      A  ARTE         │                           │
│        (esquerda)         │                      │        (direita)          │
├───────────────────────────┴──────────────────────┴───────────────────────────┤
│ folha de keyframes (aparece com 🎬 Animar)                                    │
│ Duração · frame   ⧉ Copiar ⎘ Colar  ⟲ ◂ ▶ ▸  ‹ ◆ Chave › ✕  Curva ▾   Motion Blur  🖼 Capa  🎞 Gerar vídeo ▾ │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Campo da arte** (topo): clique para escolher outra arte da pasta. ✓ = já ligada ao editor.
- **◀ ▶**: páginas (carrossel). Sem nada selecionado, as setas ← → do teclado também trocam.
- **◧ ◨**: mostram/escondem os painéis da esquerda e da direita (para a arte ficar maior).
- **Barra rápida** (segunda faixa, aparece com ✎ Editar): o que se usa toda hora, sem abrir abas —
  **alinhar na arte** (6 botões: esquerda, centro, direita, topo, meio, base), **opacidade**, **⤒ Frente /
  ⤓ Trás**, **👁 Esconder**, **🔒 Travar** e **↺ Original**. Vale para os selecionados.
- **status**: `● ao vivo`, `● editando`, `● não salvo`, `salvo ✓`.

Sem o **✎ Editar** ligado, o editor é só um visualizador: mostra a arte encaixada na tela e
**recarrega sozinho** quando o arquivo da arte muda no disco.

## Selecionar

- **Clique** num elemento da arte. O selecionado ganha contorno ciano.
- **Shift+clique** soma (ou tira) um elemento: os outros ficam com contorno tracejado. O último
  clicado é o **principal**.
- **⬆ Bloco de fora** (aba Transformar): clicou numa palavra e queria o parágrafo? Sobe um nível.
- **Aba Camadas**: selecione pela lista (também com Shift). É o único jeito de pegar o fundo.
- **Elementos empilhados:** **Alt + roda do mouse** em cima da arte alterna a seleção entre os que estão
  embaixo do cursor; o **botão direito** também lista *Selecionar o que está embaixo*.
- **Camada travada (🔒):** o clique na arte passa por ela e pega o que está atrás. Trave fundos e blocos
  grandes que você seleciona sem querer (botão **🔒 Travar** da barra rápida, ou botão direito → *Travar*).
  Para selecionar uma travada: **Ctrl+clique**, ou pela lista de camadas. Clique no cadeado da lista para
  destravar.
- **Botão direito** num elemento (ou numa linha da lista de camadas): frente/trás, esconder, travar, editar
  o texto, voltar ao original.
- **Esc** solta a seleção.

## Mover, tamanho, giro, opacidade (aba Transformar)

| Fazer | Como |
|---|---|
| mover | arrastar · setas (1 px; com Shift, 10 px) · campos **X** e **Y** |
| mover em linha reta | enquanto arrasta, segure **Shift**: anda só para os lados ou só para cima/baixo |
| mover devagar | enquanto arrasta, segure **Alt**: anda 4× mais devagar (ajuste fino) |
| grudar no centro | ao arrastar perto do centro aparece uma linha rosa e o elemento gruda; **Ctrl** desliga |
| alinhar | barra rápida: esquerda, centro, direita, topo, meio e base da arte · aba Transformar: **⇔ Centro** / **⇕ Centro** em relação à arte ou ao bloco de fora |
| tamanho | **alças dos cantos** da caixa · roda do mouse em cima do elemento (Shift: mais rápido) · campo **Tamanho %** |
| só a largura / só a altura | **alças dos lados** da caixa · linha **Esticar %** (**L** e **A**) — com a corrente 🔗 ligada (padrão), mudar uma muda a outra na mesma proporção; clique na corrente para soltar |
| girar | **bolinha** em cima da caixa (Shift: de 15 em 15 graus) · campo **Girar °** |
| opacidade | campo **Opacidade %** |
| esconder | caixa **Esconder** (ou o 👁 na aba Camadas) |
| voltar ao que era | **↺** no fim de cada linha volta só aquela linha ao padrão (posição 0, tamanho 100, giro 0…) · **↺ Original** tira todas as edições dos selecionados (pede confirmação; Ctrl+Z desfaz) |

**As alças da caixa** (quadradinhos brancos em volta do selecionado):
- **Cantos:** aumentam ou diminuem por igual; o canto oposto fica parado. Com **Shift**, largura e altura
  ficam livres.
- **Lados:** mudam só a largura ou só a altura; o lado oposto fica parado.
- **Alt** (em qualquer alça): muda a partir do centro, crescendo para os dois lados.
- **Bolinha ciano em cima:** gira. A caixa gira junto com o elemento.
- **O que muda de verdade:** numa **forma** acrescentada por você (★ retângulo, círculo), a largura e a
  altura reais — a borda e os cantos arredondados não deformam. Numa **imagem** ou **texto**
  acrescentados, os cantos mudam o tamanho real; os lados esticam. Nos **elementos da arte**, as alças
  esticam o elemento (como uma foto), sem mexer na montagem da arte. Para voltar: **↺ Original**, ou
  100 em Tamanho/Largura/Altura.
- As alças valem para o elemento principal. Enquanto você edita um texto ou a animação toca, elas somem.

As unidades (px, %, °) aparecem em cinza **dentro** da caixa: é só visual — digite apenas o número.
**Esconder** fica no título da seção. A lista **Atalhos** recolhe e abre no ▸ / ▾ ao lado do título.

Na aba, cada propriedade é uma linha: **Posição** (X e Y lado a lado), **Tamanho %**, **Esticar %** (L 🔗 A),
**Girar °** e **Opacidade %**. Com 🎬 Animar, cada linha ganha ‹ ◇ › — nos pares, um ◇ só grava os dois.

Com vários selecionados, tudo isso vale para todos. Em X e Y, o campo mostra o valor do principal e
todos andam **a mesma distância**.

**Campos de número** (em todas as abas): **clique e arraste para os lados** dentro do campo para mudar o
valor — Shift anda 10× mais rápido, Alt faz o ajuste fino. Um clique simples seleciona o valor para
digitar; a roda do mouse em cima do campo também aumenta/diminui (Shift: de 10 em 10).

**Sliders** (réguas de arrastar): **duplo clique volta ao valor padrão** — brilho, saturação e contraste
em 100, desfoque em 0, opacidades em 100. No slider **Cantos** (aba Forma), o padrão é o arredondamento
original da arte.

> Shift apertado **antes** do clique soma o elemento à seleção. Para travar o eixo, comece a arrastar e
> só então segure Shift.

## Texto

**Duplo clique** no texto (ou **✎ Texto**): o contorno fica amarelo, é só digitar. **Esc** ou um clique
fora termina. Destaques coloridos dentro do texto são mantidos.

> Em textos que a arte ajusta sozinha para caber (títulos "justificados pelo tamanho"), o ajuste certo
> só aparece **depois de salvar** — o editor recarrega a arte e ela mede o texto novo.

## Efeitos (glows e sombras)

Mostra os efeitos do elemento principal, separados em **camadas** que você pode mexer, acrescentar
(**+ camada**) e tirar (**✕**):

- **Brilho / sombra da forma** — acompanha o contorno do elemento (recortes em PNG, textos, ícones). Várias
  camadas somadas formam o glow. Cada camada: cor, opacidade da cor, X, Y e desfoque.
- **Sombra do texto** e **Sombra da caixa** (o brilho em volta de selos, pílulas e painéis).
- **Cor do texto.**
- **Ajustes de imagem:** desfoque, brilho, saturação e contraste.
- **Mesclagem (blend mode)** fica na aba **Camadas** e no botão direito — veja abaixo.
- **Copiar / Colar nos selecionados:** copia tudo isso de um elemento e aplica igual em outros.

## Forma (cantos, preenchimento, contorno)

Para caixas, selos, painéis, pílulas e formas acrescentadas:

- **Cantos:** arredondamento (em px; em formas redondas, em %).
- **Preenchimento** e **Contorno:** *Original* (não mexe), *Nenhum*, *Cor* ou *Gradiente* (duas cores e
  ângulo). O contorno em gradiente funciona com cantos arredondados.
- Com um **★ granulado** selecionado, a aba mostra os ajustes do grão (veja "Granulado" em Assets).

## Camadas (direita)

Lista tudo o que há na arte — **o de cima da lista fica na frente**.

- **▸** abre os elementos de dentro de um bloco. **👁** mostra/esconde.
- **⤒ Frente / ⤓ Trás** mudam a ordem. **🗑** (ou **Delete**) apaga a camada selecionada, depois de confirmar: um
  item ★ sai das edições; um elemento da **arte** some da arte e da lista (o código da arte não muda). Para trazer
  de volta: **Ctrl+Z**, ou o aviso "N apagada(s) · restaurar" no topo da lista, ou o botão direito → *Restaurar apagados*.
- **🎬** ao lado do nome = a camada tem animação. **◐** = a camada tem mesclagem.
- **Mesclagem** (no topo da lista): o *blend mode* da camada selecionada, como no Photoshop — *Normal*,
  *Escurecer, Multiplicação, Superexposição de cores*, *Clarear, Tela, Subexposição de cores, Adição*,
  *Sobrepor, Luz suave, Luz direta*, *Diferença, Exclusão*, *Matiz, Saturação, Cor, Luminosidade*. Também no
  **botão direito** (na arte ou na lista) → *Mesclagem ▸*. Aparece igual no PNG e no vídeo.
  > A camada mescla com o que está atrás dela **dentro do mesmo bloco**. Se o bloco de fora estiver girado,
  > animado ou com opacidade, ela mescla só com o que há dentro dele.

## Assets (direita)

De cima para baixo:

0. **★ Peças** (ex.: *★ Marca › Peças › Elementos*) — as peças em código do design system da marca: selos,
   painéis, títulos, listas, pílula do site… Veja "Peças da marca" abaixo.
1. **Formas e texto** — retângulo, círculo, texto e **Grão** (granulado, veja abaixo).
2. **★ Biblioteca** (ex.: *★ Marca › Fundos*, *★ Marca › Ícones*) — os assets da marca, iguais para
   todas as artes, organizados pelas pastas da biblioteca.
   **★ Assets gerais** é a biblioteca das imagens que você trouxe do computador para a aba Assets.
3. **Desta arte ›** — as imagens que estão na pasta da própria arte.

**Imagens do computador:** arraste um arquivo (PNG, JPG, WebP, GIF ou AVIF, até 15 MB) do computador e solte:
- **em cima da arte** (ou da lista de camadas): a imagem é copiada para `assets/importadas/` na pasta da arte
  e vira uma camada ★ onde você soltou;
- **na aba Assets**: vai para **★ Assets gerais** (pasta `assets-gerais/` dentro da pasta das artes) e aparece
  para **todas as artes**; ao usar numa arte, ela é copiada para a pasta dessa arte.

Nunca troca um arquivo que já exista: com o mesmo nome e outro conteúdo, grava ao lado com um sufixo.

**Granulado (Grão):** um grão de filme gerado pelo próprio AFE, sem imagem de textura. Entra cobrindo a arte
toda, **travado** (o clique na arte passa por ele — selecione pela lista de camadas) e em **Sobrepor**. Na aba
**Forma**: *Força*, *Grão* (fino, médio, grosso), *Cor* (preto e branco ou colorido) e *Animado* (o grão
"ferve", 12 vezes por segundo). O grão animado depende só do instante: o vídeo sai igual ao editor. Para mais
discreto, use **Luz suave** na mesclagem ou baixe a opacidade.

**Arraste** para a arte, ou **clique** para pôr no centro. O item entra marcado com ★ na lista de
camadas e pode ser movido, estilizado e animado como qualquer outro; **Delete** apaga. O campo de
busca filtra pelo nome do arquivo.

> **Por que a biblioteca copia a imagem?** O PNG e o vídeo só enxergam a pasta da arte. Por isso, ao
> usar um item da biblioteca, o editor guarda uma cópia em `assets/biblioteca/` dentro da pasta da arte
> (uma vez só — usar de novo aproveita a mesma cópia).
>
> **Para pôr uma imagem nova na biblioteca:** copie o arquivo para a pasta da biblioteca (numa das
> subpastas, ou crie outra) e reabra a aba Assets. Pastas chamadas `placeholders` não aparecem: são
> para imagens provisórias de modelo.
>
> A imagem entra pequena (até 320 px de largura) e na frente de tudo; aumente com a roda do mouse.

**Peças da marca** (o design system)
1. Abra um grupo de peças e clique numa: abre a janela **Escolher peça**, com a prévia de um lado e as
   **instruções de uso** do outro.
2. Passe o mouse na prévia e **clique no pedaço que você quer** (ele fica com contorno amarelo). A trilha em
   cima mostra onde ele está — por exemplo `ds-cartao › ds-titulo` — e clicar num nome dela sobe para o bloco
   de fora (a peça inteira, com fundo e enfeites) ou volta.
3. **＋ Pôr na arte** (ou duplo clique no pedaço). A peça entra no centro da arte como um item ★.
4. Na arte: mova, mude o tamanho pelas alças (as dos lados mudam a largura e o texto se reorganiza), anime, e
   **troque os textos com duplo clique**. Para selecionar um pedaço de dentro, clique nele; **⬆ Bloco de fora**
   volta para a peça inteira.
5. **⧉ Copiar o código** copia o HTML do pedaço, para colar no código de uma arte.

> A peça depende do CSS da marca. Ao usar a primeira peça, o editor copia esse CSS para
> `assets/biblioteca/` dentro da pasta da arte. Ele entra **antes** dos estilos que a arte já tem — se a arte
> mudou alguma coisa da marca, a mudança dela continua valendo.
>
> **Fontes:** a cópia do CSS não busca fontes na internet. A peça usa as fontes que a arte já carrega
> (ponha os arquivos de fonte na pasta da arte e carregue com `@font-face`); sem elas, aparece uma fonte
> parecida.
>
> Os modelos de arte inteira (capa de carrossel, story, thumbnail) também aparecem na lista e entram como
> uma peça grande. Criar uma arte nova a partir de um modelo ainda não existe.

**Usar uma imagem como fundo**
- Passe o mouse na imagem e clique no botão **fundo** que aparece no canto (ou botão direito → *Usar como
  fundo*). Ela cobre a arte toda, sem deformar, e vai para trás de tudo.
- O fundo que a arte já tinha é escondido na mesma hora (o editor avisa quantas camadas escondeu). Se
  preferir os dois juntos, reative-as no **👁** da aba Camadas.
- **Trocar:** clique em **fundo** em outra imagem. **Tirar:** selecione *★ fundo · nome* no fim da lista
  de camadas e aperte **Delete** — o fundo original da arte volta.
- A imagem de fundo se seleciona pela lista de camadas (clicar na arte não pega ela, para não atrapalhar).
  Depois de selecionada, dá para mover, aumentar, mudar a opacidade e animar como qualquer item.

## Animação

**Desfazer / Refazer:** botões **↶ Desfazer** e **↷ Refazer** no centro da barra de cima (ou Ctrl+Z e Ctrl+Shift+Z / Ctrl+Y).

Ligue **🎬 Animar**: aparece a linha do tempo, contada em **frames** (30 por segundo). A cabeça vai para
o frame 0. Com o Animar desligado, o editor mostra a **capa** (veja abaixo).

**Entrada** (aba Animação, à direita) — como o elemento chega
1. Selecione o elemento (ou vários) e escolha no menu **▶ Escolher a entrada…**:
   *Aparecer · Desfocado → nítido · Subir · Descer · Vir da esquerda · Vir da direita · Zoom (pop) ·
   Girar e entrar · Cair e quicar · Glitch*. O editor toca a entrada uma vez para você ver.
2. No cartão: **duração** (em frames; 30 = 1 segundo) e **força** (de quão longe, quão pequeno, quão
   girado ou desfocado ele vem). **▶** toca de novo, **✕** tira a entrada.
3. A entrada acontece no **começo da camada**: se você atrasar a camada ("Começa no frame", arrastar a
   barra azul ou Escalonar), a entrada vai junto. Na folha ela aparece como uma faixa amarela no
   começo da barra.

Cada elemento tem uma entrada só (escolher outra troca). Mexer no cartão vale para todos os
selecionados que têm entrada. Receita rápida de carrossel animado: selecione os blocos → escolha
*Subir* → **⏱ Escalonar** a cada 5 frames.

**🖼 Capa** — o que aparece quando a arte está parada
- O PNG (e o editor com o Animar desligado) mostra **um** instante da animação: a capa. Sem você
  escolher, é o **último frame** — quando tudo já entrou.
- Para trocar: leve a cabeça ao frame desejado e clique **🖼 Capa** (ou botão direito na régua →
  *Usar o frame N como capa*). A marca **▼** amarela na régua mostra onde ela está.
- Capa no último frame = voltar ao padrão.

**Keyframes**
1. Selecione o elemento, leve a cabeça (linha azul) ao frame desejado e clique **◆ Chave**: grava
   posição, tamanho, giro, opacidade e brilho naquele frame.
2. Vá para outro frame e **mexa no elemento** (arrastar, tamanho, efeitos…): a chave desse frame é
   gravada sozinha. Entre uma chave e outra o movimento é suavizado.
3. **‹ ›** pulam entre as chaves; **✕ Chave** apaga a do frame atual.

**Keyframe de uma propriedade só** (aba Transformar, com o Animar ligado): ao lado de X, Y, Tamanho,
Girar e Opacidade aparecem **‹ ◇ ›**. O **◇** grava a chave só daquela propriedade no frame atual (vira
**◆** amarelo; clicar de novo tira). **‹ ›** levam a cabeça à chave anterior/próxima daquela propriedade.
Serve, por exemplo, para animar só a opacidade sem prender a posição.

**Folha de keyframes** (igual à do Blender)
- Linhas: **Resumo** › cada camada animada › (abrindo com ▸) os canais — Posição X/Y, Tamanho, Giro,
  Opacidade, Brilho — e os efeitos contínuos.
- **Régua:** clique ou arraste para mover a cabeça.
- **Losango:** clique = marca a chave e vai para o frame · **Shift+clique** = marca mais uma (ou
  desmarca) · arraste = move as marcadas juntas · **Delete** = apaga as marcadas (num canal, apaga só
  aquele canal) · **botão direito** = menu com curva, copiar, colar e apagar.
- **Barra azul da camada** (atrás dos losangos): mostra quando a camada aparece. Veja "Tempo da
  camada" abaixo.
- As camadas selecionadas na arte aparecem na folha mesmo sem animação.
- **▾** (canto direito da barra) minimiza a folha.

**Curva (easing)** — como o valor anda de uma chave até a próxima. Marque a chave **de onde o movimento
sai** (ou pare a cabeça em cima dela) e escolha no menu **Curva** da barra, ou clique com o botão
direito no losango. O menu mostra, para cada curva, um **gráfico** (o tempo anda para a direita, o
valor sobe) e uma **bolinha** fazendo aquele movimento:

| Curva | Como anda | Losango |
|---|---|---|
| **Suave** (padrão) | sai e chega devagar (ease in-out) | losango |
| **Linear** | velocidade constante | quadrado |
| **Acelerar** | sai devagar e acelera (ease in) | gota com a ponta para a direita |
| **Frear** | sai rápido e chega devagar (ease out) | gota com a ponta para a esquerda |
| **Recuo** | passa um pouco do ponto e volta | bolinha |
| **Quique** | chega e quica | bolinha com anel |
| **Degrau** | fica parado e troca de uma vez na próxima chave | barrinha |

A curva vale para tudo o que a chave guarda (posição, tamanho, giro…). Passe o mouse no losango para
ver o nome da curva.

**Copiar e colar chaves**
- **Ctrl+C** (ou **⧉ Copiar**) copia as chaves marcadas na folha; sem nenhuma marcada, a chave do
  elemento selecionado no frame da cabeça.
- **Ctrl+V** (ou **⎘ Colar**) cola **onde a cabeça está**:
  - *no mesmo elemento, em outro frame:* copie, leve a cabeça ao frame novo e cole;
  - *em outro elemento:* copie, clique no outro elemento na arte (pode selecionar vários com Shift)
    e cole. Vale também em outra página.
- Copiou várias chaves? Elas mantêm a distância entre si: a primeira cai na cabeça, as outras depois.
- **Animação inteira de um elemento para outro:** botão direito no nome da camada, na folha →
  *Copiar todas as chaves desta camada*; selecione o outro elemento, cabeça no frame 0, Ctrl+V.
- Botão direito numa linha da folha → *Colar nesta camada*: cola direto naquela camada, no frame do mouse.
- Chaves copiadas de várias camadas ao mesmo tempo (ex.: pelo losango do Resumo) voltam cada uma para
  a sua camada, no frame novo.
- O que passar do fim da animação não é colado (o editor avisa). A posição copiada é o
  **deslocamento** do elemento: o outro elemento faz o mesmo movimento a partir do lugar dele.

**Tempo da camada** — em que frame cada elemento aparece e some (como as barras do After Effects)

| Fazer | Como |
|---|---|
| atrasar a entrada (delay) | arraste o **meio da barra azul** na folha, ou digite em **Começa no frame** (aba Animação). As chaves vão junto |
| cortar o começo | arraste a **ponta esquerda** da barra (as chaves ficam onde estão) |
| fazer sumir antes do fim | arraste a **ponta direita**, ou digite em **Some no frame** (vazio = fica até o final) |
| mover várias de uma vez | selecione os elementos (Shift+clique) e arraste a barra de um deles |
| voltar ao normal | botão direito na linha da camada → **Tirar os cortes** |

Clique na barra (sem arrastar) leva a cabeça até ali. Botão direito na linha da camada também tem
*Começar aqui* e *Cortar o começo/fim aqui*. Fora do trecho da barra a camada fica invisível — na
prévia e no vídeo.

**⏱ Escalonar** (aba Animação) — vários elementos entrando um depois do outro:
1. Selecione os elementos com Shift+clique (ex.: 3 quadrados, cada um com a sua animação — dica: anime
   um, copie as chaves dele e cole nos outros).
2. Escolha de quantos em quantos frames e a ordem: **de leitura** (de cima para baixo, da esquerda
   para a direita, como estão na tela) ou **a ordem em que você selecionou**.
3. Clique **⏱ Escalonar**. O primeiro fica onde está; cada um dos outros é movido inteiro (com as
   chaves) para começar depois do anterior. Mudou de ideia? Troque o número e clique de novo.
   **0** junta todos outra vez.

**Efeitos contínuos** (aba Animação, à direita): repetem em loop, sem emenda. Cada um tem **força** e
**vel** (quantas vezes por loop), e dá para somar vários no mesmo elemento.

| Grupo | Efeito | O que faz | Força |
|---|---|---|---|
| Movimento | Wiggle suave | treme de leve, sem padrão | px |
| Movimento | Flutuar | sobe e desce | px |
| Movimento | Balançar (giro) | gira para um lado e para o outro | graus |
| Movimento | Órbita | anda num círculo pequeno | raio em px |
| Movimento | Quique | pula e bate no chão | altura em px |
| Tamanho | Pulsar | cresce e encolhe | % |
| Tamanho | Batida de coração | duas batidas seguidas e uma pausa | % |
| Brilho | Piscar o glow · Respirar o glow | o brilho falha / vai e volta (precisa de um glow na aba Efeitos) | % |
| Brilho | Glitch RGB leve | de vez em quando as cores descolam em rosa e ciano | px |
| Opacidade | Piscar a opacidade | falhas rápidas de transparência | % |
| Opacidade | Estrobo suave | acende e apaga em ritmo fixo | % |

**Duração:** 5 s por padrão (campo na barra do tempo), por página.

**🎞 Gerar vídeo:** salva e gera o MP4 da página (tamanho da arte, 30 fps), mostrando o andamento; o
link aparece ao lado do botão. O PNG da arte mostra a **capa** (veja acima).

**Tocar e loop:** ▶ toca a animação. O botão **⟲** (ao lado do ◂) liga/desliga o **loop**: aceso (padrão), o
play repete; apagado, toca uma vez e para no fim. **Shift + ▶** (ou Shift + Espaço) faz o contrário do botão,
só daquela vez. A escolha fica guardada no navegador.

**Motion Blur:** o seletor ao lado de 🖼 Capa deixa o **vídeo** com rastro de movimento,
como numa câmera: *sem*, *leve*, *normal* (o padrão do cinema) ou *forte*. Vale por página. A prévia aqui
no editor e o PNG ficam sem blur. O vídeo demora mais para sair: ~4× no leve, ~8× no normal, ~12× no forte.
Só aparece em quem se move rápido; o que está parado fica nítido. Ao escolher um blur, o editor avisa quantas vezes
mais o vídeo vai demorar.

## Salvar, desfazer, refazer

- **💾 Salvar** (Ctrl+S) grava as edições no arquivo ao lado da arte e recarrega para mostrar o
  resultado final. O botão fica amarelo enquanto há algo não salvo.
- **↶ / ↷** (Ctrl+Z / Ctrl+Shift+Z ou Ctrl+Y): até 300 passos, inclusive depois de salvar e ao trocar
  de página. Se o passo desfeito for de outra página, o editor vai até ela.
- Cada gravação guarda a versão anterior (veja "Onde ficam as suas edições" no LEIA.md).

## ⚙ Config — atalhos e teclas do mouse

O botão **⚙** no topo abre as configurações. Elas ficam guardadas **neste navegador, neste computador**, e
não mudam nada nas artes.

- **Atalhos de teclado:** clique na tecla de um comando e aperte a combinação nova (Esc desiste). **✕** deixa
  o comando sem atalho; **↺** volta à tecla padrão. Se a tecla escolhida já era de outro comando, o outro
  fica sem atalho e a tela avisa qual foi.
- **Teclas ao usar o mouse:** o que Shift, Alt e Ctrl fazem enquanto você arrasta ou clica (travar no eixo,
  andar devagar, soltar o ímã, cantos livres, somar à seleção…). Dentro de um bloco, escolher uma tecla que
  já estava em uso troca as duas de lugar.
- **↺ Voltar tudo ao padrão** desfaz todas as trocas.
- As setas (mover) e o Esc (soltar a seleção) são fixos. Com a tela aberta, os atalhos não disparam.
- Atalhos de uma letra só não valem enquanto você digita num campo ou edita um texto da arte.

## Atalhos

*(Estas são as teclas padrão; todas as que têm ⚙ podem ser trocadas na Config.)*

| Tecla | O que faz |
|---|---|
| Clique / Shift+clique | selecionar / somar à seleção |
| Arrastar | mover — Shift = trava no eixo · Alt = devagar · Ctrl = sem ímã |
| Arrastar dentro de um campo de número | muda o valor — Shift = rápido · Alt = fino |
| Duplo clique num slider | volta ao valor padrão |
| Ctrl+clique | seleciona mesmo uma camada travada |
| Alt + roda do mouse (na arte) | alterna entre os elementos embaixo do mouse |
| Botão direito (na arte ou na lista de camadas) | menu da camada |
| Alças da caixa | cantos = tamanho (Shift = livre) · lados = largura/altura · bolinha = girar (Shift = 15°) · Alt = do centro |
| Setas (Shift = 10 px) | mover 1 px — sem seleção, ← → trocam de página |
| Roda do mouse (Shift = rápido) | tamanho |
| Duplo clique · Esc | editar texto · terminar |
| Delete | apaga as chaves marcadas na folha, ou os itens ★ selecionados |
| Shift+clique num losango | marca mais uma chave (ou desmarca) |
| Botão direito na folha | menu: curva, copiar, colar, apagar · na linha da camada: começar/cortar aqui |
| Arrastar a barra azul da camada | meio = move a camada no tempo · pontas = cortam o começo / o fim |
| Ctrl+C · Ctrl+V (com 🎬 Animar) | copiar chaves · colar onde a cabeça está |
| Esc | solta a seleção |
| Ctrl+Z · Ctrl+Shift+Z / Ctrl+Y | desfazer · refazer |
| Ctrl+S | salvar ⚙ |
| E · A | ligar/desligar ✎ Editar · 🎬 Animar ⚙ |
| 1 2 3 4 · 5 6 | abas Transformar, Efeitos, Forma, Animação · Camadas, Assets ⚙ |
| T | editar o texto do selecionado ⚙ |
| H · L | esconder/mostrar · travar/destravar ⚙ |
| ] · [ | trazer para a frente · mandar para trás ⚙ |
| K (com 🎬 Animar) | gravar ◆ Chave ⚙ |
| Espaço (com 🎬 Animar) | tocar / pausar |
| Shift + Espaço / Shift + ▶ | tocar o contrário do loop, só desta vez ⚙ |
| `,` e `.` (com 🎬 Animar) | frame anterior / próximo |

## Bom saber

- **Uma palavra colorida dentro de um título é um elemento separado.** Clicar nela seleciona a palavra
  (para mudar a cor ou animar só ela); **⬆ Bloco de fora** sobe para a linha, e de novo para o título.
- **"Só visualizando"** no status = a arte ainda não foi ligada ao editor (o botão Editar fica cinza).
- **As edições ficam presas ao lugar do elemento na estrutura da arte.** Se o código da arte mudar de
  estrutura (um bloco a mais, uma ordem diferente), a edição daquele elemento é **ignorada** — ela
  nunca vai parar no elemento errado. Por isso, antes de mudar a estrutura de uma arte já editada, as
  edições devem ser passadas para o código.
- **Efeitos e Forma** mostram e editam o elemento principal; "Colar nos selecionados" vale para todos.
- **Arrastar um losango** move a chave inteira daquele frame (todos os canais juntos). Soltar em cima
  de outra chave junta as duas (vale a que foi arrastada).
- **"A biblioteca desta arte é antiga"** no status = o editor ganhou funções novas depois que a arte
  foi ligada. Rode `python ligar.py <arte.html>` de novo (na pasta do AFE) (só atualiza a cópia da biblioteca).
- Ao encurtar a duração, chaves além do novo fim continuam existindo (aparecem fora da régua).
- **"camada com keyframes: a mudança virou chave no frame N"** = você mexeu, com o Animar desligado, num
  elemento que tem keyframes. A mudança foi gravada no frame da capa. Se não era isso, Ctrl+Z, ligue o
  🎬 Animar e vá ao frame certo antes de mexer. (Elementos só com entrada ou efeito contínuo não têm
  esse problema: a mudança vale para a animação toda.)
- **"⚠ camada passa do fim"** depois de escalonar ou atrasar = a animação daquela camada não cabe mais
  inteira no vídeo. Aumente a **Duração** (barra do tempo) ou diminua o intervalo.
- O primeiro da fila do Escalonar começa no frame 0, que é o normal: por isso a barra dele continua
  clarinha ("sem corte").
