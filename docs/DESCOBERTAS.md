# Descobertas

**Português (BR)** · [English](en/DISCOVERIES.md)

O que aprendemos construindo o editor — as armadilhas e o porquê de cada solução. Leia antes de
"simplificar" algo que parece complicado demais. Acrescente aqui cada lição nova (também na versão em inglês).

## Aplicar edições numa arte que não é nossa

- **Mover/escalar/girar com as propriedades `translate`, `scale` e `rotate`** (e não `transform`):
  elas somam com o `transform` que a arte já usa (ex.: `translateX(-50%)` para centralizar) em vez de
  apagá-lo.
- **Devolver um "atalho" do CSS ao original é traiçoeiro.** `background`, `border` e `border-radius`
  mexem em várias declarações de uma vez; ler `el.style.background` nem sempre devolve o que estava lá.
  A lib guarda **todas as declarações da família** (`FAMILIAS`) e as recoloca uma a uma.
- **Só mexer no que foi editado.** Uma primeira versão repunha todas as propriedades a cada aplicação e
  apagava estilos próprios da arte. Hoje cada propriedade posta é lembrada (`__ed.postos`) e só ela é
  devolvida.
- **Texto entra ANTES das medições; estilo entra DEPOIS.** Artes que ajustam a fonte medindo o texto
  precisam medir o texto já editado; e `scale`/`translate` mudam o resultado de
  `getBoundingClientRect`, então não podem estar aplicados na hora de medir. Daí `preparar()` e
  `finalizar()`.
- **Guardar o texto digitado sem "assar" estilos.** Se uma palavra dentro do parágrafo foi movida e
  depois o parágrafo é editado, o `innerHTML` do parágrafo viria com o `style` da palavra embutido — e
  desfazer nunca mais limparia. A lib tira as edições dos elementos de dentro num **clone**
  (`htmlSem`) antes de guardar; o texto original é lido do mesmo jeito.
- **Voltar ao original de fora para dentro.** `limpar()` restaura primeiro os textos dos elementos mais
  externos (o original deles já traz os internos limpos) e pula os que foram substituídos junto.
- **Posição na estrutura + conferência (`sig`).** Identificar o elemento pelo caminho é simples e não
  exige marcar a arte; a `sig` (tag.classe) evita aplicar no elemento errado se a estrutura mudar.
- **Itens acrescentados têm id próprio (`#n1`).** Antes eram identificados pela posição entre os
  filhos: apagar um obrigava a renumerar as edições de todos os seguintes.
- **Círculo é raio em %.** `parseFloat('50%')` dá 50 — gravar isso como 50 px transformava o círculo
  em quadrado arredondado. O raio só é gravado quando o usuário mexe nele, e mantém a unidade.
- **Contorno em gradiente com cantos arredondados:** `border-image` ignora o `border-radius`. Solução:
  borda transparente + dois fundos, um cortado em `padding-box` (o preenchimento) e o gradiente em
  `border-box`.
- **A ordem das funções do `filter` muda o resultado.** A aba Efeitos lê o filtro como lista ordenada e
  regrava na mesma ordem; ajuste novo entra antes das sombras.

## Cores e animação

- **O navegador devolve cores em formatos diferentes** (`rgb()`, `rgba()`, `color(srgb …)` para
  `color-mix`). Tudo é normalizado para `rgba(r, g, b, a)`: só assim dá para misturar duas cores e
  mexer no alfa (piscar o glow).
- **Interpolar textos CSS número a número:** se dois valores têm a mesma "forma" (mesmo texto entre os
  números), mistura-se cada número. Serve para sombras, filtros e cores sem escrever um interpretador
  para cada um. Formas diferentes → troca no meio do caminho.
- **Loop perfeito:** efeitos contínuos usam só ciclos inteiros dentro da duração; ruído = soma de senos
  com fases sorteadas por uma semente fixa (mesmo resultado na prévia e no vídeo).
- **Tudo em frames inteiros (30 fps).** Chaves em instantes "quebrados" não batem com o vídeo. Ao
  mostrar o frame use `floor(t × 30 + 0.01)`: `22/30 × 30` dá `21.999…`.
- **Camada com keyframes: mexer vira chave.** Se a mudança fosse para o valor "base", a chave por cima
  esconderia a mudança. O `doc.mudar` entrega à função um disfarce (`Proxy`) da camada e separa o que
  ela grava nas propriedades animáveis. Mudar algo que não anima (esconder, cor) **não** cria chave.
- **Ler o valor certo:** com keyframes, o valor na tela não é `e.x`. Sempre `atual(p, c)`.

## Navegador e tela do editor

- **Módulos JavaScript exigem o tipo certo do servidor.** No Windows, o Python pode servir `.js` como
  `text/plain` e o navegador recusa o módulo. O servidor fixa os tipos (`MIMES`).
- **O iframe "engole" o mouse.** Ao arrastar algo da tela do editor passando por cima da arte, os
  eventos param de chegar e o arrasto fica "preso". Durante esses arrastos a arte fica com
  `pointer-events: none` (classe `arrastando`) e todo `mousemove` confere se o botão ainda está apertado.
- **Espaço e Enter repetem o último botão clicado.** Depois de clicar em "✕ Chave", apertar espaço para
  tocar apagaria outra chave. O foco sai dos botões logo após o clique (`campos.js`).
- **Clicar na arte não tira o foco de um campo da tela** (o clique é cancelado para não selecionar
  texto). O palco tira o foco à mão; senão as setas mexeriam no campo em vez de mover o elemento.
- **Não depender da janela visível.** Com a janela minimizada, `requestAnimationFrame` e as capturas de
  tela param. Os recados entre módulos usam microtarefa; só o "tocar" usa rAF.
- **Redesenhar um painel no meio da digitação tira o foco do campo.** Cada mudança leva a "origem"; o
  painel que a causou não se redesenha, e os outros só se redesenham se o que mostram mudou.
- **Campos de número:** selecionar tudo ao focar (digitar por cima) e aceitar a roda do mouse evitou
  muitos erros de digitação ("2445" em vez de "45").
- **Capturas de tela podem vir atrasadas** (mostram o instante anterior). Ao testar, confira o estado
  pelo código (`window.ED`) e tire outra captura.

## Servidor, arquivos e render

- **Caminhos com acento.** No Windows, a saída de um script Python não é UTF-8 por padrão: um caminho
  como `Vídeos_ação` chegava corrompido de um processo para outro (e o link do vídeo quebrava). Todos
  os scripts forçam UTF-8 na saída.
- **Segurança de servidor local:** outra página aberta no navegador pode mandar pedidos para
  `localhost`. Por isso: conferir `Host`/`Origin`, exigir JSON no POST, validar todo caminho (`dentro()`)
  e gravar só o arquivo de edições que a própria arte declara.
- **Um arquivo de edições por arte** (`<arte>.edicoes.js`): com um `edicoes.js` por pasta, duas artes
  na mesma pasta se sobrescreviam. Artes antigas com `edicoes.js` continuam valendo — o servidor grava
  no arquivo que o `<script>` da arte aponta.
- **A lib precisa estar na pasta da arte.** Os renders servem só a pasta do trabalho; uma lib "central"
  não seria encontrada. Por isso o `ligar.py` copia (e cada trabalho fica com a versão que usou).
- **Testes sintéticos de mouse** precisam de `buttons: 1` nos `mousemove`, senão o editor entende que
  o botão foi solto.
- **Margem de parágrafo "vaza" para fora da arte** (colapso de margens) e desloca a raiz: o tamanho
  medido cresce. Arte deve ter raiz com tamanho fixo e, de preferência, `window.CONFIG`.
- **Nome de arquivo com data até o segundo não é único.** A cópia de segurança do Salvar usava
  `AAAAMMDD-HHMMSS`: dois salvamentos no mesmo segundo dividiam o nome e o segundo apagava o primeiro.
  O teste automático falhava "de vez em quando" por isso — falha intermitente quase sempre é corrida
  de tempo, vale investigar em vez de rodar de novo.

## Keyframes: curvas e copiar/colar (v1.1)

- **A curva mora na chave de onde o trecho SAI** (igual ao Blender). Uma chave = um campo `ease`; o
  último trecho não precisa de nada. A alternativa (curva de chegada + curva de saída, como no After
  Effects) dobra os controles sem ganho para animações leves.
- **Curvas que passam do ponto (Recuo, Quique) quebram textos CSS.** Em `filter`/`box-shadow`, misturar
  número a número com `u > 1` gera desfoque negativo ou cor acima de 255: o navegador descarta a
  declaração inteira e o brilho some por alguns quadros. Para textos, `u` fica preso entre 0 e 1.
- **Campo novo na chave precisa sair da lista de "propriedades".** `valores()` trata todo campo da
  chave como valor animado, menos `t` e `ease` (`NAO_E_VALOR`). E "chave vazia" é a que não tem
  nenhuma `ANIM_PROPS` — não a que "só tem `t`".
- **"A arrastada vale por cima" não acontece sozinho.** Ao juntar duas chaves no mesmo frame, a ordem
  em que elas estão na lista decidia quem ganhava. Agora a ordem é explícita (as arrastadas por último).
- **Grupo de chaves no arrasto: limitar o deslocamento, não cada chave.** Prender cada chave em
  0..fim amassa o grupo na borda; o certo é limitar o `df` do grupo inteiro.
- **Colar: decidir o destino por "de quantas camadas veio".** De uma camada → vai para os selecionados
  (é o caso "mesma animação em outro elemento"). De várias → cada uma volta para a sua (é o caso
  "repetir este momento mais tarde"). Tentar adivinhar pares origem→destino confunde.
- **Ctrl+C/Ctrl+V só viram atalho do editor fora de campos e de texto em edição** — senão quebram o
  copiar/colar normal de quem está digitando.
- **A cópia da lib dentro da arte envelhece.** O editor usa a EDLIB da própria arte para mostrar a
  prévia; se ela for antiga, a função nova "não funciona" sem erro nenhum. Por isso a lib tem revisão
  (2.1) e o editor compara com `LIB_ATUAL` e avisa no status.
- **Menu do botão direito fecha com `blur` da janela:** cliques dentro do iframe da arte não chegam à
  tela do editor; o que chega é a perda de foco.

## Tempo da camada e Escalonar (v1.2)

- **Chaves em tempo absoluto, não "relativas ao começo da camada".** Com tempo relativo o delay seria
  um número só, mas TODO lugar que usa o tempo de uma chave (gravar, folha, arrastar, copiar/colar,
  pular) teria de converter — muitos pontos para errar. Com tempo absoluto, só a lib ganhou a regra
  "fora de ini..fim fica escondida" e "mover a camada" virou uma operação do editor que desloca
  começo, fim e chaves juntos. Custo: mover a camada mexe em vários números (por isso a `fotoDe`).
- **Arrasto sempre a partir de uma foto do começo.** Somar o passo de cada `mousemove` acumula
  arredondamento e "perde" o que bateu na borda. Guardar o estado inicial e aplicar o deslocamento
  total a cada passo é exato e desfaz certo.
- **Tempo com 4 casas cai DEPOIS do frame.** O frame 5 é 5/30 = 0,16666… s; gravado vira 0,1667. Na
  conta `chave.t <= t` a chave só valia no frame seguinte. A lib compara com uma folga de 1 ms (`FOLGA`).
  Vale para chaves e para o começo/fim da camada.
- **`quadro()` precisa cuidar de quem DEIXOU de ser animado.** Ele só olhava os animados: uma camada
  que perdia o tempo (ou todas as edições) no meio de um arrasto ficava escondida "para sempre". Agora
  ele repõe o valor parado dos não animados e devolve ao original os que não têm mais edição.
- **"Animado" inclui ter tempo próprio.** Página cuja única animação é um elemento que entra depois
  também gera vídeo, aparece na folha e ganha a claquete na lista de camadas.
- **O valor "normal" não é gravado** (começa no 0, vai até o final). Consequência boa: arquivo limpo.
  Consequência a lembrar: no meio de um arrasto a camada pode sumir do documento (voltou ao normal) e
  reaparecer — o código não pode guardar referência à edição dela, só o caminho.
- **Linha na folha para o que está selecionado.** Sem isso não havia por onde dar tempo a uma camada
  ainda sem animação (ela nem aparecia na folha).
- **A barra ocupa a linha inteira: clique x arrasto.** Clique (menos de 3 px) continua levando a cabeça;
  só o arrasto move a camada. As alças ficam para FORA da barra, senão um losango em cima do começo
  tampava a alça.
- **Ordem de leitura = linhas primeiro.** Ordenar só por "topo" embaralha elementos da mesma linha com
  alturas diferentes. Agrupa-se por linha (meios próximos) e, dentro da linha, da esquerda para a direita.
- **Frame 0 e o PNG.** Com tempo de camada (e, depois, presets de entrada) o frame 0 pode estar vazio,
  e o PNG mostra o frame 0. Ficou como decisão pendente ("frame da capa") no ROTEIRO.

## Entradas, capa e desenho das curvas (v1.3)

- **Entrada como efeito, não como keyframes.** O plano era o preset "gerar chaves normais". Problemas:
  trocar ou tirar o preset exigiria saber quais chaves eram dele; ajustar a duração seria arrastar
  chave por chave; e — o pior — editar a posição de um elemento com chaves fora do modo Animar cria
  uma chave nova sem a pessoa ver. Como efeito (`ent`, calculado na lib), a posição "de descanso"
  continua sendo um valor só: mexer nela vale para a animação toda. E o efeito parte de `ini`, então
  delay e Escalonar funcionam sem fazer nada.
- **O efeito tem de terminar em zero.** Toda entrada é "quanto falta para chegar" (1 → 0). No fim da
  duração a função simplesmente não mexe em nada — assim não há salto no último quadro.
- **Opacidade de partida não é sempre 1.** `v.o ?? 1` fazia um elemento com 50% de opacidade na arte
  terminar a entrada em 100% e depois pular para 50%. A lib lê a opacidade parada uma vez (`base.o`).
- **Frame 0 vazio.** Com entradas, no frame 0 nada apareceu ainda. O que quebrava: o PNG (saía vazio) e
  a edição normal (não dava para clicar no que estava invisível). Solução única: a **capa** — o
  instante que a arte mostra parada — com padrão no fim. Fora do Animar o editor fica na capa.
- **A arte abre na capa, o editor tem o instante dele.** Ao carregar, o editor sempre redesenha no
  `S.tempo` (antes só redesenhava se `S.tempo` fosse diferente de 0).
- **Gráfico e bolinha por código, com a conta de verdade.** A lib expõe `curva(nome, u)`; o editor
  amostra a função para o SVG e para os quadros da animação do navegador (`element.animate`). Sem GIF,
  sem imagem, e impossível o desenho mentir sobre a curva. A animação do navegador não usa
  `requestAnimationFrame` no nosso código (regra de ouro 4).
- **Menu num botão do rodapé abre para cima** (`acima: true`); senão ele cobria o próprio botão.
- **Fotos do editor num navegador escondido.** A captura da janela do app falha com a janela minimizada.
  Para conferir o visual: Playwright abre o editor (servidor já rodando), monta a cena pelo `window.ED`
  sem salvar nada e tira a foto. Foi assim que se viu um campo cortado na aba Animação.

## Biblioteca de assets (v1.4)

- **O arquivo de edições nunca aponta para fora da pasta da arte.** Os assets da marca moram numa pasta
  só, mas o render de PNG/vídeo serve apenas a pasta do trabalho. Em vez de ensinar todos os renders a
  enxergar outra pasta, o editor copia a imagem para a arte na hora do uso. A arte continua
  "autocontida": dá para mover ou mandar a pasta dela para outro computador.
- **Copiar sem estragar:** se já existe um arquivo com o mesmo nome e conteúdo diferente (a biblioteca
  mudou depois), a cópia nova ganha um sufixo; a antiga, que alguma página pode estar usando, fica.
- **O que é específico do projeto fica FORA do editor.** A pasta da marca entra por um parâmetro do
  servidor (`--biblioteca`), configurado por quem liga o editor. Dentro da pasta do AFE não há caminho
  de projeto nenhum.
- **"Remover os placeholders" = não mostrar, não apagar.** Imagens provisórias costumam estar citadas por
  modelos de arte. Esconder a pasta `placeholders` tira da barra sem quebrar nada.
- **Teste que lê a resposta como texto quebra com imagem.** O ajudante do teste decodificava tudo como
  UTF-8; para rotas que devolvem imagem só o código importa.

## Imagem de fundo (v1.5)

- **Não dá para pôr o item novo "no começo" da arte.** Os caminhos das edições são a posição de cada
  elemento entre os irmãos: inserir algo antes deslocaria todos e as edições cairiam nos elementos
  errados. Item novo entra sempre no fim; "atrás de tudo" se resolve com `z-index: -1`.
- **`z-index: -1` precisa de `isolation: isolate` na raiz.** Sem um "mundo de camadas" próprio, o -1 vai
  para trás do fundo da própria raiz e a imagem some. A lib liga o isolamento só enquanto há imagem de
  fundo e devolve o valor original depois.
- **A arte costuma ter o fundo como elemento** (um `<canvas>` desenhado, um bloco de cor) — e ele fica na
  frente do -1. Por isso "usar como fundo" esconde as camadas de fundo da arte na mesma ação e guarda
  quais foram (`escondeu`), para devolver ao apagar. A regra para reconhecê-las é conservadora: os
  PRIMEIROS filhos da raiz que cobrem a arte toda e não têm nada dentro; para no primeiro com conteúdo
  (um bloco que embrulha a arte inteira nunca é escondido).
- **Fundo não recebe clique.** Se recebesse, clicar no "vazio" da arte selecionaria (e arrastaria) o
  fundo em vez de soltar a seleção. Seleciona-se pela lista de camadas — igual ao fundo desenhado.
- **A lista de camadas segue a ordem do HTML; a imagem de fundo é exceção.** Ela é o último elemento mas
  aparece atrás de tudo: a lista a mostra no fim.

## Texto em linha, campos que arrastam (v1.6)

- **O navegador ignora mover/aumentar/girar em elementos "em linha".** `translate`, `scale` e `rotate` não
  têm efeito num `<span>` comum — sem erro nenhum: o estilo é gravado e nada acontece. Cor, sombra e
  opacidade funcionam, o que disfarça o problema. A lib troca para `inline-block` só quando a edição pede
  movimento (ou a camada é animada) e devolve o original depois. Medido: o texto não sai do lugar.
- **Cuidado ao medir um elemento em linha:** a caixa dele (`getBoundingClientRect`) muda de altura ao virar
  `inline-block`, mas o texto não se move. Para conferir a posição do TEXTO, meça um `Range` do conteúdo.
- **"A mesma coisa duas vezes" quase sempre é embrulho.** Um elemento que só contém outro com o mesmo texto
  é, para quem usa, uma coisa só. A lista mostra o de dentro (o que o clique seleciona); o de fora só
  aparece se tiver edições ou estiver selecionado — nunca fica inalcançável.
- **Arrastar dentro de um campo: o foco é o problema.** Com o clique normal, o navegador começa a selecionar
  o texto do campo e essa seleção DEVOLVE o foco a ele no meio do arrasto (`blur()` não segura). O jeito:
  cancelar o `mousedown` e dar o foco à mão só quando foi um clique simples. As setinhas do campo ficam
  de fora dessa regra (os 18 px da direita).
- **Somar aos poucos, não multiplicar o total.** Com Shift/Alt mudando a velocidade no meio do arrasto,
  `total × fator` dá um pulo na hora em que a tecla é apertada. Somar `passo × fator` a cada movimento não.
- **Testar por fora quando a pessoa está usando a tela.** A aba do editor no app pode ter trabalho não
  salvo de quem usa: investigar e fotografar sempre num navegador escondido (Playwright), nunca nela.

## Caixa de transformação (v1.7)

- **O navegador escala em volta do centro; a pessoa espera que o lado oposto fique parado.** Por isso toda
  alça muda duas coisas: a escala e a posição (x, y), de modo que o ponto fixo não saia do lugar. A conta
  é feita nos eixos do próprio elemento (o mouse é "desgirado" antes), então funciona com giro.
- **Esticar ≠ redimensionar.** Mudar a largura real de um elemento da arte refaz o layout dela (e a arte
  costuma medir os textos por conta própria): imprevisível. Elementos da arte só **esticam** (`sx`, `sy`).
  Itens acrescentados pelo editor não têm layout a preservar: mudam de tamanho de verdade.
- **Prévia no elemento, gravação ao soltar.** Mudar o tamanho real de um item pelo documento refaria a
  arte (e recarregaria as imagens) a cada movimento do mouse. Durante o arrasto o estilo é mexido direto no
  elemento; ao soltar, uma única gravação. É a única exceção à regra "tudo passa pelo doc", junto com o
  texto em edição.
- **A caixa com giro não dá para medir, tem de calcular.** O navegador só devolve o retângulo reto em volta
  do elemento girado. O centro desse retângulo é o centro verdadeiro; o tamanho vem de
  `offsetWidth × escala das edições`. Giro dado pela própria arte (CSS) não entra: a caixa fica reta.
- **Nome de classe repetido esconde coisas em outro canto.** As alças novas usaram `.alca`, que a barra da
  camada na folha já usava: o `display:none` das novas sumiu com as antigas. O teste pegou. Estilo de peça
  nova sempre com o pai na frente (`#caixaSel .alca`).
- **Número de versão em dois lugares.** O comentário do topo da lib dizia 2.6 e a constante, 2.5: o editor
  avisava "biblioteca antiga" para a própria biblioteca nova. Ao subir a revisão, conferir os dois e o
  `LIB_ATUAL`.

## Barra rápida, trava e o que está embaixo do mouse (v1.8)

- **Uma função só para "o que o mouse pega".** O clique, o contorno ao passar o mouse, o Alt + roda e o
  botão direito perguntam a mesma coisa: `sobOPonto(x, y)` — a pilha de elementos naquele ponto, do da
  frente para o de trás, já sem os que não dá para selecionar e sem os travados. Antes o clique olhava
  só o elemento da frente; com a trava isso não bastava.
- **Travar = sair da pilha do mouse, nada mais.** Não bloqueia edição pelos painéis nem pela lista. É o
  suficiente para o problema real ("seleciono o fundo sem querer") e não cria um estado em que a pessoa
  não consegue mais mexer na camada.
- **A mesma ação em três lugares pede um módulo próprio.** Frente/trás, esconder e travar estavam (ou
  estariam) repetidos na lista de camadas, na barra e nos menus: foram para `camada-acoes.js`.
- **Menu aberto por clique dentro da arte:** a tela do editor não vê os cliques seguintes na arte (são de
  outro documento). O palco avisa o menu para fechar a cada `mousedown` na arte.
- **Shift + roda pode chegar como rolagem lateral** (`deltaX`, com `deltaY` zerado). Quem só olha o
  `deltaY` vê sempre "para baixo". Usar `deltaY || deltaX`.
- **Teste que depende de onde as coisas estão quebra quando outro teste move as coisas.** A conferência do
  Alt + roda supunha dois elementos sob o mouse; um teste anterior tinha deixado um terceiro por cima.
  A conferência agora pergunta ao editor qual é a pilha e confere a ordem.

## Config: atalhos e teclas do mouse (v1.9)

- **Atalho configurável pede tabela, não `if`.** Os atalhos eram uma sequência de `if (tecla === ...)`. Para a
  pessoa trocar a tecla, cada comando precisa existir como dado (nome, tecla padrão, quando vale, o que
  faz). De quebra a tela de Config se monta sozinha a partir da tabela.
- **Gravar só a diferença em relação ao padrão.** Assim, quando uma versão nova muda um padrão ou cria um
  comando, quem nunca mexeu recebe a novidade; e "voltar ao padrão" é só apagar a entrada.
- **Comando que "não vale agora" deixa a tecla passar.** Ctrl+C só é "copiar chaves" se houver chave para
  copiar; senão o navegador copia o texto normalmente. O `quando` de cada comando decide.
- **Letra sozinha como atalho exige cuidado com quem está digitando:** não vale em campos nem com um texto
  da arte em edição (só comandos marcados `emCampo` / `emTexto`, como Salvar e Desfazer).
- **Tecla repetida:** entre comandos, o que já usava a tecla fica sem atalho (e a tela diz qual); entre
  teclas do mouse do mesmo bloco, as duas trocam de lugar — ali nunca pode sobrar um papel sem tecla.
- **Fechar com Esc sem "vazar".** O Esc que fecha a Config também chegava aos atalhos do editor e soltava a
  seleção. Quem trata a tecla primeiro precisa parar a propagação.
- **Foto num contexto novo do navegador:** as preferências ficam no `localStorage`; fotos e testes que mexem
  nelas devem desfazer no fim (ou usar um contexto próprio) para não contaminar o resto.

## Peças do design system (v2.0)

- **Uma "peça" não é um arquivo: é um pedaço de uma prévia.** Cada `preview.html` mostra várias coisas de uma
  vez (5 selos numa fileira; um painel dentro de um cenário com fundo e enfeites). Não dá para adivinhar o
  pedaço certo — quem escolhe é a pessoa: clica no que quer e sobe de nível pela trilha.
- **Quem é da marca e quem é só arrumação:** as classes definidas no `<style>` da própria prévia (`.row`,
  `.col`) são arrumação; as outras vêm do CSS da marca. Essa regra não depende do prefixo das classes de
  nenhum projeto.
- **O pedaço sai do DOM desenhado, não do arquivo.** Peças montadas por script (gráficos, linhas desenhadas)
  viram HTML parado na arte — sem levar o script junto.
- **O que a peça herdava some quando ela muda de casa.** Fonte e cor vinham do `<body>` da prévia. O editor
  anota o que o pedaço herdava (`contexto`) e a lib repõe no bloco da peça.
- **CSS novo entra no começo do `<head>`.** No fim, o CSS da marca passaria por cima do que a arte ajustou
  (mesma força, vem depois = ganha). No começo, a arte continua mandando.
- **`@import` de fontes da internet não vai para a arte.** O render roda sem rede: um `@import` que não
  responde atrasa ou muda o resultado. Na prévia dentro do editor as fontes carregam normalmente (é como o
  design system funciona); na cópia da arte, a linha sai.
- **Miniaturas vivas, mas preguiçosas.** Cada miniatura é a própria prévia num `<iframe>` encolhido. Os
  grupos começam fechados e os iframes são `loading="lazy"`: só carregam quando o grupo abre. Ficam num
  bloco separado da lista de imagens, que é refeita a cada tecla da busca (recarregaria tudo).
- **Texto com `text-transform` engana o teste:** `innerText` devolve em maiúsculas o que o CSS mostra em
  maiúsculas. Para conferir o texto de verdade, `textContent`.
- **Filho de `display:flex` vira bloco.** Um `<span>` dentro de uma fileira flex tem `display` calculado
  `block`, não `inline`: a peça ganha largura fixa. É o esperado.

## Escolher pedaço numa prévia (v2.0.1)

- **"Classe citada no `<style>` da prévia" não quer dizer "classe só da prévia".** Prévias ajustam classes da
  marca (`.ds-linha{filter:none}`). Para saber de quem é a classe, leia os arquivos .css da marca
  (`document.styleSheets` com `href`, entrando nos `@import` e `@media`).
- **Contorno (`outline`) no próprio elemento some com `clip-path` e `mask`.** Destaque de seleção deve ser uma
  caixa à parte, por cima; de quebra não suja as classes do elemento que será copiado.
- **`pointer-events:none` da marca esconde a peça do mouse.** Numa prévia de escolha, force
  `pointer-events:auto` em tudo (menos na caixa de destaque).
- **Varra todas as peças, não só as do exemplo.** Um script que clica no centro de cada elemento de cada prévia
  achou em minutos quatro peças inteiras sem nada selecionável.

## Motion blur (v2.2)

- **Blur de câmera = média de fotos dentro do quadro.** Para cada quadro, N fotos em instantes espalhados pela
  abertura do obturador; o ffmpeg mistura: `tmix=frames=N,select='eq(mod(n\,N)\,N-1)',setpts=N/(FPS*TB)`,
  com a entrada a FPS×N. O `select` fica com a última foto de cada grupo — a única cuja média tem o grupo
  inteiro.
- **Fotos proporcionais à abertura** (4/8/12): o espaço entre as fotos fica parecido, e o rastro sai liso em vez
  de "cópias" do elemento.
- **Obturador abre no instante do quadro** (não centrado): nunca pede instante negativo nem passa do fim, então
  não mistura o fim da animação no começo.
- **Conferir com uma arte que se mexe.** A arte de exemplo não tem animação: o blur só se vê numa cópia com
  movimento rápido (deslizar, girar, quicar).
