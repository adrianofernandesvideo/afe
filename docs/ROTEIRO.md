# Roteiro do AFE

**Português (BR)** · [English](en/ROADMAP.md)

O que já existe, as decisões que guiam o projeto e as ideias para depois. Atualize este arquivo quando
algo daqui ficar pronto (e registre no [CHANGELOG](CHANGELOG.md)).

## Estado atual — versão 2.4 beta

**Pronto e testado** (`python testes/teste_rapido.py --video`: 165 conferências passando):

- **Abrir:** qualquer arte `.html` de tamanho fixo, com páginas e atualização automática ao salvar.
- **Editar:** selecionar (um ou vários), mover (mouse, setas, ímã no centro), tamanho, giro, opacidade,
  esconder, texto, centralizar, voltar ao original.
- **Caixa de transformação com alças:** cantos (tamanho), lados (largura/altura), bolinha (girar); a caixa
  gira junto; itens acrescentados mudam de tamanho de verdade.
- **Barra rápida:** alinhar na arte (bordas e centro), opacidade, frente/trás, esconder, travar, original.
  Camada travada (o clique passa por ela; Ctrl+clique seleciona); botão direito na arte e na lista de
  camadas; Alt + roda alterna entre os elementos embaixo do mouse.
- **Campos de número que arrastam** (Shift rápido, Alt fino); duplo clique num slider volta ao padrão. Ao
  arrastar na arte: Shift trava o eixo, Alt anda devagar, Ctrl solta o ímã.
- **Efeitos:** glow e sombras em camadas, cor do texto, ajustes de imagem, copiar/colar efeitos.
- **Forma:** cantos, preenchimento e contorno em cor ou gradiente.
- **Camadas:** árvore, esconder, travar, frente/trás, apagar itens acrescentados, **mesclagem (blend mode)** no topo
  da lista e no botão direito.
- **Assets:** formas, texto, imagens da pasta da arte e **bibliotecas** de fora (`--biblioteca`; a imagem é
  copiada para a arte ao usar). Pastas `placeholders` ficam de fora. **Usar como fundo.** **Granulado** (grão de
  filme, animado ou não). **Imagens do computador:** soltar na arte (vira camada) ou na aba Assets (Assets gerais).
- **Peças em código** de um design system (`components/`): janela "Escolher peça" com prévia e instruções; a
  peça entra na arte como item editável, com o CSS copiado.
- **Animação:** keyframes (com gravação automática), ‹ ◇ › ao lado dos campos, folha de keyframes em
  frames, curva (easing) por chave com gráfico, copiar/colar e marcar várias chaves, tempo da camada
  (aparece/some, delay) e Escalonar, 10 entradas, 12 efeitos contínuos, frame da capa, duração por página.
- **Vídeo:** MP4 da página, com motion blur opcional (sem/leve/normal/forte). Play com **loop** (liga/desliga).
- **Tela:** efeitos à esquerda, camadas à direita; barra de baixo com o play no centro; atalhos em lista.
- **⚙ Config:** tecla de cada comando e papel de Shift/Alt/Ctrl no mouse, guardados no navegador.
- Desfazer/refazer (300 passos); salvar guarda a versão anterior.
- **Distribuição:** release a cada push com executável (Windows, macOS, Linux) e demo online no GitHub Pages; o `.zip` traz um guia para a IA de quem usa (`AGENTS.md`).
- Portátil: pasta única, servidor com `--raiz`, `ligar.py`, arte de exemplo, teste automático.

## Decisões que guiam o projeto

- **A arte nunca é reescrita.** As mudanças são dados num arquivo ao lado dela (`<arte>.edicoes.js`); uma
  biblioteca dentro da arte aplica. Ver ARQUITETURA.
- **Chaves em tempo absoluto.** Mover a camada no tempo desloca as chaves junto. Ver DESCOBERTAS.
- **Entrada é um efeito ligável**, não um pacote de keyframes: dá para trocar, ajustar e tirar sem bagunçar
  as chaves, e ela acompanha o tempo da camada.
- **Alças dos lados:** itens acrescentados (formas, imagens, texto, peças) mudam de tamanho de verdade;
  elementos da arte esticam.
- **A arte se basta.** Tudo o que ela usa (imagens e CSS de bibliotecas) é copiado para a pasta dela, e o
  render roda sem internet.
- **Nada de dependências** no editor: Python padrão no servidor, JavaScript puro na tela.

## Ideias e pendências (sem data — contribuições bem-vindas)

**Edição**
- Efeitos e Forma para vários selecionados ao mesmo tempo (hoje: o principal + "colar nos selecionados").
- Agrupar camadas (mover e colorir juntas).
- Alinhar bordas entre elementos e distribuir espaços iguais; ímã em outros elementos (com uma tecla).
- Alças para vários selecionados de uma vez (hoje só o principal); inclinar (skew); espelhar.
- Zoom e arrastar a visão da arte (hoje ela sempre encaixa na tela).
- Trocar a fonte do texto acrescentado.
- Nomear camadas pelo editor (hoje: `data-nome` no código da arte).
- Esconder os efeitos que não se aplicam ao tipo de elemento selecionado.
- Copiar/colar efeitos pelo menu do botão direito.
- Arrastar uma ARTE (.html) do computador para dentro do editor (imagens já dá).
- Exportar o frame atual como PNG.

**Animação**
- ‹ ◇ › de keyframe também nos efeitos (brilho, sombras); hoje só na aba Transformar.
- Entradas: arrastar o fim da faixa na folha para mudar a duração; "transformar em keyframes"; texto letra
  por letra / palavra por palavra; **saídas** (antes do "Some no frame"); escolher a curva da entrada.
- Miniatura animada de cada entrada no menu (como a bolinha das curvas).
- Folha de keyframes: zoom/rolagem horizontal para animações longas; marcar chaves com um retângulo;
  Ctrl+X e duplicar; arrastar um losango de canal movendo só aquele canal.
- Curva por canal (hoje a curva é da chave inteira) e editor de curva à mão (alças).
- Escalonar com ordem invertida ou aleatória; mostrar a barra de tempo nas camadas de dentro de um grupo.
- Efeitos contínuos: direção da órbita; cores do glitch RGB.
- Motion blur por camada e uma prévia aproximada no editor.

**Assets e peças**
- "Nova arte a partir de um modelo": criar um `.html` novo, já ligado, a partir de uma peça de arte inteira
  (capa de carrossel, story, thumbnail).
- Arrastar a peça da janela direto para a arte; trocar as cores da peça pelos tokens; aba com os tokens.
- Mostrar a descrição de cada asset (a partir de um `README.md` na pasta da biblioteca).
- Uma biblioteca de demonstração em `demos/` (imagens e um mini design system inventado, com `components/`)
  para mostrar a aba Assets e as peças em código sem precisar de uma marca de verdade.
- Imagem de fundo: escolher o enquadramento, escurecer/desfocar e "fundo em todas as páginas".

**Config e plataforma**
- Exportar/importar as preferências; tornar configuráveis as setas, o Esc e o Shift+clique da lista e da
  folha.
- Conferir no macOS e no Linux (até aqui só foi usado no Windows).
- **Editor multi-idioma** (português e inglês, para começar). Hoje a tela está em português, com termos
  técnicos em inglês (Assets, frame, keyframe, glow, Wiggle, Blur). Os textos estão espalhados no
  `app/index.html` e nos módulos de `app/js/`: o caminho é juntar todos num catálogo por idioma (ex.:
  `app/idiomas/pt-BR.js`, `en.js`), trocar os textos fixos por chaves e pôr a escolha do idioma na tela ⚙ Config.
  Os nomes dos presets (entradas, contínuos, curvas) já estão juntos em `presets.js`.
- Manter a documentação em inglês (`docs/en/`) em dia com a em português.

## Limites conhecidos

- A edição é presa à posição do elemento na estrutura da arte: se a estrutura mudar, a edição daquele
  elemento é ignorada (nunca cai no elemento errado). Passar as edições para o código antes de
  reestruturar.
- Texto que a arte ajusta por medição só mostra o ajuste final depois de salvar (a arte recarrega).
- Fundo "original" com várias imagens + contorno em gradiente pode perder tamanhos/posições do fundo.
- Filtros com a mesma função repetida (dois `blur`): a aba Efeitos edita a primeira.
- A arte precisa ter tamanho fixo; páginas responsivas não têm "tamanho" para o editor.
- Elemento que a arte posiciona com a propriedade CSS `translate` (rara; não confundir com
  `transform: translate(...)`, que funciona): mover ou dar entrada nele substitui esse `translate`.
- Camada com keyframes editada fora do modo Animar: a mudança vira chave no frame da capa (o editor
  avisa). Para escolher o frame, ligue o Animar.
- A curva e o tempo valem para a camada inteira; elementos de dentro de um grupo não herdam o tempo no
  editor (ficam invisíveis porque o grupo está invisível, mas a linha deles na folha não mostra isso).
