# Arquitetura do AFE

**Português (BR)** · [English](en/ARCHITECTURE.md)

Para quem vai mexer no código do editor (uma pessoa, ou um assistente de IA numa conversa nova).
Leia também [DESCOBERTAS.md](DESCOBERTAS.md): explica as decisões que parecem estranhas.

## 1. As três peças

```
┌────────────────────────── navegador ──────────────────────────┐
│  app/  (a tela do editor)                                      │
│   ┌─────────────────────────────────────────────┐              │
│   │ <iframe>  a ARTE  +  edicoes-lib.js (EDLIB) │  ← mesma     │
│   │           + <arte>.edicoes.js (EDICOES)     │    origem    │
│   └─────────────────────────────────────────────┘              │
└──────────────▲────────────────────────────────────────────────┘
               │ http://localhost:8765   /editor/  /arte/  /api/
        servidor.py  ──lê e grava──▶  PASTA DAS ARTES  (--raiz)
                     ──roda──▶ render_anim.py  (vídeo)
```

1. **`arte/edicoes-lib.js`** (vira `window.EDLIB` dentro da arte) — aplica as edições. É a única peça
   que precisa estar junto de cada arte; funciona sem o editor (render de PNG/vídeo, navegador).
2. **`app/`** — a tela. JavaScript puro em módulos (`<script type="module">`), sem instalação nem
   "build". Fala com a arte pelo iframe (mesma origem) e usa a **EDLIB da própria arte** para aplicar
   as mudanças ao vivo: o que se vê no editor é exatamente o que a arte fará sozinha depois.
3. **`servidor.py`** — entrega a tela e as artes, grava o arquivo de edições e dispara o vídeo.

**Ideia central:** o editor nunca altera o código da arte. Ele produz **dados** (o arquivo de
edições); a arte se "auto-edita" ao abrir.

## 2. O arquivo de edições (formato 2)

`<arte>.edicoes.js` (ou o que a arte declarar em `<script src="...edicoes.js">`):

```js
window.EDICOES = {
  "_formato": 2,
  "3": {                                // uma entrada por página ("1" em artes de página única)
    "_dur": 8,                          // duração da animação em s (só se ≠ 5)
    "_capa": 2,                         // instante da capa em s (só se não for o fim): o que o PNG mostra
    "_mb": 0.5,                         // motion blur do vídeo: abertura do obturador (0.25/0.5/1); só se ligado
    "_novos": [                         // itens acrescentados (aba Assets)
      { "id": "n1", "tipo": "img", "src": "assets/x.webp", "w": 320, "left": 100, "top": 200 },
      { "id": "n2", "tipo": "texto", "html": "Oi", "fs": 64, "left": 0, "top": 0 },
      { "id": "n3", "tipo": "retangulo", "w": 360, "h": 200, "left": 0, "top": 0 },  // ou "circulo"
      { "id": "n4", "tipo": "img", "src": "assets/x.webp", "fundo": true, "escondeu": ["0"] },  // imagem de fundo
      { "id": "n5", "tipo": "html", "nome": "Badge", "html": "<span class=…>Novo</span>",       // peça em código
        "css": ["assets/biblioteca/Marca/css/tokens.css"], "contexto": { "fontFamily": "…", "color": "…" },
        "estilo": ".row{display:flex}", "w": 420, "left": 0, "top": 0 }
    ],
    "5/0": {                            // edições de UMA camada, pela posição dela (ver "caminho")
      "sig": "h2.titulo",               // tag.classe: confere se ainda é o mesmo elemento
      "x": -12, "y": 30,                // deslocamento em px          → CSS translate
      "s": 1.1, "r": 5,                 // escala e giro (graus)       → CSS scale / rotate
      "sx": 1.2, "sy": 0.9,             // esticado da largura/altura → CSS scale: (s·sx) (s·sy)
      "o": 0.8, "oculto": true, "z": 6, // opacidade, esconder, ordem  → opacity / visibility / z-index
      "trava": true,                    // camada travada no editor (o clique passa por ela); a arte ignora
      "html": "texto novo",             // texto (innerHTML)
      "filtro": "…", "tsombra": "…", "csombra": "…", "cor": "…",   // filter / text-shadow / box-shadow / color
      "raio": 24,                       // cantos: número = px, texto = "50%"
      "bg": "…", "bd": "…",             // background / border prontos em CSS
      "forma": { "fill": {…}, "stroke": {…}, "orig": {…} },        // estado dos controles da aba Forma
      "kf": [ { "t": 0, "x": 0, "y": 0, "s": 1, "r": 0, "o": 1, "ease": "saida" }, { "t": 1, "y": -40 } ],   // keyframes
      "anim": [ { "tipo": "wiggle", "int": 4, "vel": 1 } ],         // efeitos contínuos
      "ini": 0.5, "fim": 4,                                         // tempo da camada: aparece / some (s)
      "ent": { "tipo": "subir", "dur": 1, "int": 80 }              // entrada: dura "dur" s a partir de "ini"
    },
    "#n1": { "sig": "img.ed-novo", "x": 10 }                         // edições de um item novo
  }
}
```

- **Caminho** = posição do elemento dentro da raiz da arte: `"5/0"` é o 1º filho do 6º filho. Itens
  novos usam `"#id"` (e `"#id/0"` para o que há dentro deles).
- **Imagem de fundo** (`fundo: true` num item `img`): a lib a cria cobrindo a raiz (`100% × 100%`,
  `object-fit: cover`), com `z-index: -1` e sem receber cliques, e põe `isolation: isolate` na raiz —
  sem isso o `-1` a levaria para trás do fundo da própria raiz. `escondeu` guarda os caminhos das camadas
  de fundo da arte que o editor escondeu ao colocar o fundo (para devolver ao apagar). Um por página.
- **Peça em código** (`tipo: "html"`): a lib cria um bloco com aquele HTML e garante que a arte carrega os
  arquivos de `css` — os `<link>` entram no **começo** do `<head>`, na ordem pedida, para os estilos da
  própria arte valerem por cima. `contexto` = o que a peça herdava em volta na prévia (fonte, cor, tamanho
  e altura da letra, alinhamento). `estilo` = regras de arrumação da prévia (`.row`, `.col`), valendo só
  dentro da peça (`[data-ed-id="n5"]{ … }`, CSS aninhado). Os elementos de dentro são editáveis pelos
  caminhos `#n5/0/1…`.
- **Raiz** = `#post`, ou o elemento com `data-ed-raiz`, ou `window.EDLIB_RAIZ` (seletor); senão o `<body>`.
- Chaves que começam com `_` são da página, não de camada.
- **Keyframes** (`kf`): `t` em segundos, sempre em frame inteiro (30 fps). Cada chave guarda só as
  propriedades que ela define. Propriedades animáveis: `x y s r o filtro tsombra csombra`
  (`ANIM_PROPS` em `base.js`).
- **Curva** (`ease`, opcional): como o valor anda **desta chave até a próxima** (convenção do Blender).
  Nomes: `suave` (padrão, não é gravado) · `linear` · `entrada` · `saida` · `recuo` · `quique` · `degrau`.
  A conta de cada uma fica em `CURVAS` na lib; os nomes mostrados na tela, em `presets.js`. A curva é
  da chave inteira (todos os canais). Em textos CSS (brilho, sombras) o valor nunca passa do ponto.
  `t` e `ease` são os únicos campos da chave que não são propriedade animada.
- **Tempo da camada** (`ini`, `fim`, opcionais, em segundos e em frame inteiro): a camada só aparece de
  `ini` até `fim` (sem `ini` = desde o começo; sem `fim` ou `fim` no final = até o fim). Fora disso a lib
  põe `visibility: hidden`. As chaves (`kf`) continuam em **tempo absoluto**: "mover a camada" é somar
  o mesmo deslocamento em `ini`, `fim` e em todas as chaves (`deslocar()` em `tempo-camada.js`);
  "cortar" muda só `ini` ou só `fim`.
- **Entrada** (`ent`): efeito calculado pela lib (função `entrada()`), somado por cima dos valores do
  instante — como os contínuos, mas só de `ini` até `ini + dur`. `int` = força (px, % ou graus, conforme o
  tipo). Tipos e nomes em `ENTRADAS` (`presets.js`).
- **Capa** (`_capa`, por página): o instante que a arte mostra parada. `EDLIB.finalizar()` desenha esse
  instante; sem `_capa`, o fim da animação. No editor, fora do modo Animar, `S.tempo` fica na capa.
- Valores padrão não são gravados (o `doc.limparVazios()` tira).
- **Versões.** `VERSAO` da lib = `formato.revisão` (hoje 2.8). Função nova que arquivos antigos
  continuam entendendo (ex.: `ease`): suba só a revisão (2.1 → 2.2) na lib **e** `LIB_ATUAL` em
  `arte.js` — o editor avisa quando a cópia da lib dentro da arte é mais antiga (ela continua abrindo).
  Mudou o formato de um jeito que quebra arquivos antigos? Aumente `FORMATO` (em `doc.js`) e o número
  inteiro de `VERSAO`, e trate o formato antigo ao carregar. Registre no CHANGELOG.

## 3. A biblioteca da arte — `EDLIB`

| Para a arte chamar | |
|---|---|
| `await EDLIB.preparar(N)` | cria os itens novos e troca os textos editados (antes de medir textos) |
| `EDLIB.finalizar(N)` | aplica estilos e põe a animação no instante da capa |
| `await EDLIB.aplicarTudo(N)` | os dois de uma vez |
| `<script src="…lib" data-auto>` | modo automático: aplica tudo no `load` e marca `data-pronto` |
| `EDLIB.quadro(N, t)` | desenha o instante `t` (o render de vídeo chama quadro a quadro). Deixa TODOS os elementos editados no estado certo: os animados no instante `t`, os outros no valor parado, e devolve ao original os que perderam todas as edições |
| `EDLIB.info()` | `{ versao, pagina, paginas, largura, altura }` |
| `EDLIB.curvas` · `EDLIB.curva(nome, u)` | nomes das curvas (easing) e a conta de uma delas (o editor desenha o gráfico com ela) |
| `EDLIB.capa(N)` | instante da capa da página, em segundos |

Usado pelo editor: `raiz · caminho(el) · achar(c) · assinatura(el) · estilo(el, e) · limpar() ·
criarNovos · aplicarTexto · aplicarEstilos · texto · abrirTexto · htmlOriginal · htmlSem ·
valores(n, c, t, ed) · animado · duracao · normCor · lerp`.

Como ela mexe na arte sem estragar: na primeira vez que encosta num elemento, anota o estilo que a arte
tinha (`el.__ed`); cada propriedade posta é lembrada e pode ser devolvida ao original. `limpar()`
devolve tudo — o editor chama antes de reaplicar o documento (desfazer, apagar…).

Depois de mudar a lib: rode `python ligar.py` nas artes em andamento (atualiza a cópia) e o teste.

## 4. O servidor

Rotas em `servidor.py` (lista no topo do arquivo). Regras que **não podem** afrouxar:
só `127.0.0.1`; confere `Host`/`Origin`; POST só JSON; só grava, dentro da `--raiz`, (1) o arquivo de
edições que a própria arte declara e (2) cópias de imagens de uma biblioteca em
`<pasta da arte>/assets/biblioteca/` — sem nunca apagar nem trocar um arquivo de conteúdo diferente; o
único programa que roda é o `render_anim.py`.

**Bibliotecas de assets** (`--biblioteca [NOME=]PASTA`, pode repetir): pastas de imagens, em qualquer
lugar do disco, mostradas na aba Assets de todas as artes. O servidor só **lê** imagens delas
(`/api/biblioteca` lista, `/bib/<nome>/<imagem>` entrega a miniatura). Usar um item chama
`/api/usar-asset`, que copia a imagem para a pasta da arte e devolve o caminho relativo — é esse caminho
que entra em `_novos[].src`. Assim o arquivo de edições nunca aponta para fora da pasta da arte.
`PULAR` (nomes de pasta ignorados, em minúsculas) inclui `placeholders`.

**Peças em código** — convenção de um design system exportado, ao lado (ou dentro) da pasta de imagens:
`components/<Nome>/preview.html` (a peça montada; no começo pode vir
`<!-- @dsCard group="Elementos" width=1080 height=240 -->`), `components/<Nome>/README.md` (como usar) e os
`.css` da marca na raiz e em `components/`. `GET /api/pecas` lista; `GET /ds/<biblioteca>/...` entrega os
arquivos (a prévia sai com `<base>` e os `<link>` do CSS já postos); `POST /api/usar-peca` copia para a arte
o CSS (sem `@import` de endereços da internet) e as imagens pedidas. A prévia roda na mesma origem do
editor (como a arte): só aponte `--biblioteca` para pastas em que você confia.

## 5. O app — módulos

Tudo em `app/js/`. Cada arquivo começa com um comentário dizendo o que faz. Dependem só "para baixo":

| Arquivo | Responsabilidade |
|---|---|
| `base.js` | estado `S`, recados `ouvir/avisar`, utilitários, status. Não importa ninguém |
| `api.js` | chamadas ao servidor · `css-valores.js` cores/sombras/filtros · `presets.js` catálogos (efeitos contínuos e curvas) |
| `menu.js` | menu do botão direito: `abrirMenu(x, y, itens, opções)` — reaproveitável em qualquer painel |
| `curvas.js` | desenho das curvas: `grafico(id)` (SVG), bolinha animada, `abrirCurvas()` |
| `arte.js` | iframe: carregar, medir, encaixar, `achar/caminho`, `nomeDe`, vigiar o disco |
| `doc.js` | **documento de edições**: `mudar`, `editar`, histórico, `reaplicar`, `salvar` |
| `texto.js` | edição de texto na arte · `selecao.js` seleção e contornos |
| `paineis.js` | modos (Editar/Animar), painéis laterais, abas |
| `camada-acoes.js` | ações sobre camadas usadas por vários lugares: frente/trás, esconder, travar, `sobOPonto()` (o que está embaixo do mouse), itens do menu da camada |
| `barra-rapida.js` | a faixa de atalhos abaixo da barra de cima |
| `alcas.js` | alças da caixa de seleção: tamanho, largura/altura, girar (as contas estão explicadas no topo do arquivo) |
| `alinhar.js` · `palco.js` · `navegacao.js` | centralizar e ordem de leitura · mouse sobre a arte · páginas e troca de arte |
| `tempo.js` | relógio da animação (tocar, `tocarTrecho`, capa) e operações de keyframe (gravar, apagar, curva, copiar/colar) |
| `tempo-camada.js` | tempo de cada camada: começo/fim, mover no tempo, cortar, escalonar (tudo em frames) |
| `painel-*.js` | uma aba cada: transformar, efeitos, forma, camadas, assets, animacao |
| `painel-pecas.js` | peças em código do design system: lista na aba Assets, janela "Escolher peça", inserção |
| `folha.js` | folha de keyframes: desenho, chaves marcadas, barra da camada, arrastos, menu do botão direito |
| `barra-topo.js` · `barra-tempo.js` · `campos.js` · `atalhos.js` | ligações com a tela. `atalhos.js` = tabela `COMANDOS` (tecla padrão, quando vale, o que faz) |
| `config.js` · `painel-config.js` | preferências de quem usa (tecla de cada comando, papel de Shift/Alt/Ctrl), guardadas no `localStorage` · a tela ⚙ |
| `main.js` | entrada: importa tudo, expõe `window.ED` (depuração/testes), abre a arte |

### Estado: `S` (em `base.js`)
Arte aberta (`arquivo, pagina, total, larg, alt, escala, w, d, lib`), modos (`editando, animando,
tocando`), documento (`edicoes, sujo`), seleção (`sel, selCaminho, selPaths`), `hover`, `editTexto`,
`tempo`, abas. **Nenhum módulo guarda cópia do que está em `S`.** `S.tempo` fora do modo Animar é sempre
o instante da capa (`tempo.capa()`); ao ligar o Animar vai para 0.

### Recados: `avisar(tipo, origem)` / `ouvir(tipos, fn)`
Quem muda algo avisa; quem mostra algo ouve. Tipos: `arte · doc · selecao · tempo · modo · aba · layout ·
hover · salvo · clique-arte · chave` (chaves marcadas na folha / o que está copiado). Os recados de uma ação são entregues juntos, no fim dela (microtarefa):
cada ouvinte roda uma vez, com um `Map tipo → origens`. Um painel que causou a mudança usa
`soDe(lote, MEUS, 'doc', 'meu-nome')` para não se redesenhar no meio da digitação.

### Um passo só do desfazer
Três jeitos, do mais simples ao mais geral: `lote: 'chave'` (mudanças com a mesma chave em menos de 0,6 s);
`historia: false` nos passos seguintes de um arrasto que o próprio módulo controla; e
`doc.abrirGesto()` … `doc.fecharGesto()` quando quem arrasta não sabe quem vai mudar o documento (o
arrasto dentro de um campo de número dispara os eventos do campo — cada painel reage como sempre).

### Regras de ouro
1. **Só `doc.js` altera `S.edicoes`.** Use `mudar(fn, opções)` para camadas (vira keyframe sozinho se a
   camada for animada) e `editar(fn, opções)` para o resto (keyframes, itens, duração). Eles cuidam de
   histórico, "não salvo", aplicar na arte e avisar.
2. Dentro de `mudar(fn)`, **leia valores com `atual(p, c)`**, nunca direto de `e`: com keyframes, `e` não
   é o valor na tela.
3. A seleção é guardada por **caminho**; elementos podem ser recriados a qualquer `reaplicar()`.
4. A tela nunca depende de a janela estar visível (nada de `requestAnimationFrame` para atualizar
   painéis; só o "tocar" usa).
5. Nada específico de um projeto dentro da pasta do AFE (nomes de pastas, classes, cores de marca).

## 6. Receitas

**Nova propriedade editável** (ex.: desfoque de fundo)
1. `arte/edicoes-lib.js`: aplique em `estilo()` com `por(el, 'propCss', e.nova)`; se for atalho CSS com
   várias declarações, registre em `FAMILIAS`; simples, em `SIMPLES`.
2. Controle na aba certa (`painel-*.js`) chamando `mudar((e) => { e.nova = valor; }, { origem, lote })`.
3. Animável? acrescente em `ANIM_PROPS` (`base.js`), em `CANAIS` (`folha.js`) e em `gravarChave` (`tempo.js`).
4. Documente o campo na seção 2, teste em `testes/teste_rapido.py`.

**Novo efeito contínuo**: a conta em `continuos()` da lib + uma linha em `app/js/presets.js`. Pronto: o
menu e a folha leem do catálogo.

**Nova entrada**: um `case` na função `entrada()` da lib (recebe `uu` de 0 a 1 e soma em `v.x`, `v.y`,
`v.s`, `v.r`, `v.o` ou `v.filtro`; no fim o efeito tem de ser zero) + uma linha em `ENTRADAS` de
`presets.js`. O menu, o cartão e a folha leem do catálogo. Suba a revisão da lib.

**Nova curva (easing)**: a conta em `CURVAS` da lib (recebe `u` de 0 a 1, devolve quanto do caminho já
andou) + uma linha em `CURVAS` de `presets.js` + o formato do losango em `editor.css` (`.losango.c-nome`).
Suba a revisão da lib (ver "Versões").

**Operação nova em keyframes**: em `tempo.js`, recebendo `refs` = `[{ c, k, canais }]` (camada, a chave,
e `canais` = `null` para a chave inteira ou um `Set` de canais). Quem chama pega as chaves com
`chavesAlvo()` de `folha.js` (as marcadas; sem nenhuma, as dos selecionados no frame da cabeça).
`refs` apontam direto para os objetos do documento: use e descarte, não guarde entre ações.

**Operação nova no tempo da camada**: em `tempo-camada.js`. Tire uma `fotoDe(c)` de cada camada antes
de mexer (começo, fim e chaves, em frames) e faça as contas a partir da foto com `deslocar(foto, df)` ou
`cortar(foto, parte, f)` dentro de `editar()`. Em arrastos, a foto é a do começo do arrasto. Operações
de um clique usam `reaplicar: true`; no meio de um arrasto, chame `S.lib.quadro(...)` depois do `editar`.

**Item novo no menu do botão direito**: no `contextmenu` do painel, `abrirMenu(ev.clientX, ev.clientY,
[{ rotulo, acao, dica, atalho, marcado, desligado }, '-', { titulo }])`.

**Nova aba**: `<button data-aba="x">` e `<div class="painel" id="pn-x">` no `index.html`; arquivo
`painel-x.js` que ouve os recados e só desenha se `visivel('x')`; importe no `main.js`.

**Novo tipo de item** (aba Assets): crie o elemento em `criarNovos()` da lib; o "tile" e os dados em
`painel-assets.js`.

**Novo atalho**: uma linha em `COMANDOS` (`atalhos.js`) — `id`, `grupo`, `nome`, `padrao` (tecla, ou `''`),
`quando` e `fazer`. Aparece sozinho na tela ⚙ Config. O `id` fica gravado nas preferências das pessoas: não
mude depois. Registre na tabela do MANUAL.

**Nova tecla do mouse** (um Shift/Alt/Ctrl com papel novo): uma linha em `PAPEIS` (`config.js`) e, no código
do mouse, `temMod(ev, 'papel')` — nunca `ev.shiftKey` direto, senão a escolha da pessoa não vale.

**Ação nova sobre camadas** (usada em mais de um lugar): a função em `camada-acoes.js`; o botão na
`barra-rapida.js` e/ou um item em `itensDeCamada()` (aparece no botão direito da arte e da lista).

**Nova rota no servidor**: em `api_get`/`do_POST`, sempre validando caminhos com `dentro()`; a chamada
correspondente em `api.js`.

## 7. Testar

- `python testes/teste_rapido.py [--video] [--ver]` — usa o editor de verdade numa pasta temporária.
  **Rode antes de dar qualquer mudança por pronta.** Acrescente uma conferência para cada função nova.
- No navegador, `window.ED` dá acesso aos módulos: `ED.S`, `ED.doc.entrada()`, `ED.tempo.irPara(1)`…
- Erros de módulo aparecem no console (F12) — um `import` errado impede o editor de abrir.

## 8. Convenções

Português nos nomes e comentários; comentário no topo de cada arquivo; funções curtas; nada de
dependências externas; aparência só em `editor.css`; textos da tela em linguagem simples.

## 9. Integrar com artes geradas por código

- Artes montadas por script (que marcam `data-pronto` quando terminam) usam o "modo manual": chamam
  `EDLIB.preparar/finalizar` antes de marcar `data-pronto`. A cópia da lib fica onde a arte já aponta
  (o `ligar.py` respeita a tag `<script>` existente); numa arte nova, ao lado do `.html`.
- Um gerador de PNG próprio não precisa saber do editor: a arte aplica as próprias edições ao abrir. Basta
  esperar `data-pronto` antes de tirar a foto.
- `render_anim.py` grava em `out/` ao lado da arte, ou na pasta de `--saida`.
- `servidor.py` não lista as pastas de `PULAR` (renders, dependências, `placeholders`). Se o seu projeto guarda
  renders ou código em outra pasta, acrescente o nome lá.
- Antes de mudar a **estrutura** de uma arte já editada, passe as edições para o código e esvazie o
  arquivo de edições (ver "Bom saber" no MANUAL).
