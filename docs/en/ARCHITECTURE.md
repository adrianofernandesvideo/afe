# AFE — architecture

[Português (BR)](../ARQUITETURA.md) · **English**

For whoever is going to change the editor's code (a person, or an AI assistant in a new conversation).
Also read [DISCOVERIES.md](DISCOVERIES.md): it explains the decisions that look odd.

> The code — file names, function names, data fields and comments — is in Portuguese. This document keeps the
> identifiers as they are and translates the explanations. A short glossary is at the end.

## 1. The three pieces

```
┌─────────────────────────── browser ───────────────────────────┐
│  app/  (the editor's interface)                                │
│   ┌─────────────────────────────────────────────┐              │
│   │ <iframe>  the ART +  edicoes-lib.js (EDLIB) │  ← same      │
│   │           + <art>.edicoes.js (EDICOES)      │    origin    │
│   └─────────────────────────────────────────────┘              │
└──────────────▲────────────────────────────────────────────────┘
               │ http://localhost:8765   /editor/  /arte/  /api/
        servidor.py  ──reads and writes──▶  ART FOLDER  (--raiz)
                     ──runs──▶ render_anim.py  (video)
```

1. **`arte/edicoes-lib.js`** (becomes `window.EDLIB` inside the art) — applies the edits. It's the only piece
   that has to sit next to each artwork; it works without the editor (PNG/video rendering, plain browser).
2. **`app/`** — the interface. Plain JavaScript in modules (`<script type="module">`), no install and no
   build. It talks to the art through the iframe (same origin) and uses **the art's own EDLIB** to apply
   changes live: what you see in the editor is exactly what the art will do by itself later.
3. **`servidor.py`** — serves the interface and the artworks, writes the edits file and starts the video
   render.

**Core idea:** the editor never changes the art's code. It produces **data** (the edits file); the art
"edits itself" when it opens.

## 2. The edits file (format 2)

`<art>.edicoes.js` (or whatever the art declares in `<script src="...edicoes.js">`):

```js
window.EDICOES = {
  "_formato": 2,
  "3": {                                // one entry per page ("1" in single-page artworks)
    "_dur": 8,                          // animation duration in s (only if ≠ 5)
    "_capa": 2,                         // cover instant in s (only if not the end): what the PNG shows
    "_mb": 0.5,                         // video motion blur: shutter opening (0.25/0.5/1); only if on
    "_novos": [                         // added items (Assets tab)
      { "id": "n1", "tipo": "img", "src": "assets/x.webp", "w": 320, "left": 100, "top": 200 },
      { "id": "n2", "tipo": "texto", "html": "Hi", "fs": 64, "left": 0, "top": 0 },
      { "id": "n3", "tipo": "retangulo", "w": 360, "h": 200, "left": 0, "top": 0 },  // or "circulo"
      { "id": "n4", "tipo": "img", "src": "assets/x.webp", "fundo": true, "escondeu": ["0"] },  // background image
      { "id": "n5", "tipo": "html", "nome": "Badge", "html": "<span class=…>New</span>",        // code component
        "css": ["assets/biblioteca/Marca/css/tokens.css"], "contexto": { "fontFamily": "…", "color": "…" },
        "estilo": ".row{display:flex}", "w": 420, "left": 0, "top": 0 }
    ],
    "5/0": {                            // edits for ONE layer, by its position (see "path")
      "sig": "h2.titulo",               // tag.class: checks it's still the same element
      "x": -12, "y": 30,                // offset in px                → CSS translate
      "s": 1.1, "r": 5,                 // scale and rotation (deg)    → CSS scale / rotate
      "sx": 1.2, "sy": 0.9,             // width/height stretch        → CSS scale: (s·sx) (s·sy)
      "o": 0.8, "oculto": true, "z": 6, // opacity, hidden, order      → opacity / visibility / z-index
      "trava": true,                    // layer locked in the editor (clicks pass through); the art ignores it
      "html": "new text",               // text (innerHTML)
      "filtro": "…", "tsombra": "…", "csombra": "…", "cor": "…",   // filter / text-shadow / box-shadow / color
      "raio": 24,                       // corners: number = px, string = "50%"
      "bg": "…", "bd": "…",             // ready-made CSS background / border
      "forma": { "fill": {…}, "stroke": {…}, "orig": {…} },        // state of the Shape tab controls
      "kf": [ { "t": 0, "x": 0, "y": 0, "s": 1, "r": 0, "o": 1, "ease": "saida" }, { "t": 1, "y": -40 } ],   // keyframes
      "anim": [ { "tipo": "wiggle", "int": 4, "vel": 1 } ],         // continuous effects
      "ini": 0.5, "fim": 4,                                         // layer timing: appears / disappears (s)
      "ent": { "tipo": "subir", "dur": 1, "int": 80 }              // entrance: lasts "dur" s from "ini"
    },
    "#n1": { "sig": "img.ed-novo", "x": 10 }                         // edits for an added item
  }
}
```

- **Path** (`caminho`) = the element's position inside the art's root: `"5/0"` is the 1st child of the 6th
  child. Added items use `"#id"` (and `"#id/0"` for what's inside them).
- **Background image** (`fundo: true` on an `img` item): the library creates it covering the root
  (`100% × 100%`, `object-fit: cover`), with `z-index: -1` and no pointer events, and sets `isolation:
  isolate` on the root — without it, `-1` would push it behind the root's own background. `escondeu` keeps
  the paths of the art's background layers that the editor hid when the background was set (to restore them
  on delete). One per page.
- **Code component** (`tipo: "html"`): the library creates a block with that HTML and makes sure the art loads
  the `css` files — the `<link>` tags go at the **start** of `<head>`, in the given order, so the art's own
  styles win. `contexto` = what the component inherited from its surroundings in the preview (font, color,
  font size and line height, alignment). `estilo` = the preview's layout rules (`.row`, `.col`), scoped to the
  component (`[data-ed-id="n5"]{ … }`, nested CSS). The elements inside are editable through the paths
  `#n5/0/1…`.
- **Root** = `#post`, or the element with `data-ed-raiz`, or `window.EDLIB_RAIZ` (a selector); otherwise
  `<body>`.
- Keys starting with `_` belong to the page, not to a layer.
- **Keyframes** (`kf`): `t` in seconds, always on a whole frame (30 fps). Each key stores only the properties it
  defines. Animatable properties: `x y s r o filtro tsombra csombra` (`ANIM_PROPS` in `base.js`).
- **Curve** (`ease`, optional): how the value travels **from this key to the next one** (Blender's
  convention). Names: `suave` (smooth; default, not stored) · `linear` · `entrada` (ease in) · `saida` (ease
  out) · `recuo` (overshoot) · `quique` (bounce) · `degrau` (step). Each one's math lives in `CURVAS` in the
  library; the names shown on screen, in `presets.js`. The curve belongs to the whole key (all channels). In
  CSS strings (glow, shadows) the value never overshoots. `t` and `ease` are the only key fields that aren't
  animated properties.
- **Layer timing** (`ini`, `fim`, optional, in seconds and on whole frames): the layer is only visible from
  `ini` to `fim` (no `ini` = from the start; no `fim` or `fim` at the end = until the end). Outside that the
  library sets `visibility: hidden`. Keys (`kf`) stay in **absolute time**: "moving the layer" means adding
  the same offset to `ini`, `fim` and every key (`deslocar()` in `tempo-camada.js`); "trimming" changes only
  `ini` or only `fim`.
- **Entrance** (`ent`): an effect computed by the library (function `entrada()`), added on top of the
  instant's values — like the continuous effects, but only from `ini` to `ini + dur`. `int` = strength (px, %
  or degrees, depending on the type). Types and names in `ENTRADAS` (`presets.js`).
- **Cover** (`_capa`, per page): the instant the art shows when still. `EDLIB.finalizar()` draws that instant;
  without `_capa`, the end of the animation. In the editor, outside Animate mode, `S.tempo` stays at the cover.
- Default values are not stored (`doc.limparVazios()` removes them).
- **Versions.** The library's `VERSAO` = `format.revision` (currently 2.8). A new feature that old files still
  understand (e.g. `ease`): bump only the revision (2.1 → 2.2) in the library **and** `LIB_ATUAL` in
  `arte.js` — the editor warns when the copy of the library inside an artwork is older (it still opens).
  Changed the format in a way that breaks old files? Increase `FORMATO` (in `doc.js`) and the whole number of
  `VERSAO`, and handle the old format on load. Log it in the CHANGELOG.

## 3. The art's library — `EDLIB`

| For the art to call | |
|---|---|
| `await EDLIB.preparar(N)` | creates the added items and swaps the edited texts (before measuring text) |
| `EDLIB.finalizar(N)` | applies styles and sets the animation to the cover instant |
| `await EDLIB.aplicarTudo(N)` | both at once |
| `<script src="…lib" data-auto>` | automatic mode: applies everything on `load` and sets `data-pronto` |
| `EDLIB.quadro(N, t)` | draws instant `t` (the video render calls it frame by frame). Leaves ALL edited elements in the right state: animated ones at instant `t`, the others at their still value, and restores the ones that lost all their edits |
| `EDLIB.info()` | `{ versao, pagina, paginas, largura, altura }` |
| `EDLIB.curvas` · `EDLIB.curva(nome, u)` | names of the easing curves and the math of one of them (the editor draws the graph with it) |
| `EDLIB.capa(N)` | the page's cover instant, in seconds |

Used by the editor: `raiz · caminho(el) · achar(c) · assinatura(el) · estilo(el, e) · limpar() ·
criarNovos · aplicarTexto · aplicarEstilos · texto · abrirTexto · htmlOriginal · htmlSem ·
valores(n, c, t, ed) · animado · duracao · normCor · lerp`.

How it changes the art without breaking it: the first time it touches an element, it notes the style the art
had (`el.__ed`); every property it sets is remembered and can be restored. `limpar()` restores everything —
the editor calls it before reapplying the document (undo, delete…).

After changing the library: run `python ligar.py` on the artworks in progress (updates their copy) and the test.

## 4. The server

Routes in `servidor.py` (listed at the top of the file). Rules that **must not** be loosened: only
`127.0.0.1`; checks `Host`/`Origin`; POST only accepts JSON; inside `--raiz` it only writes (1) the edits file
the art itself declares and (2) copies of library images/CSS in `<art folder>/assets/biblioteca/` — never
deleting or replacing a file with different content; the only program it runs is `render_anim.py`.

**Asset libraries** (`--biblioteca [NAME=]FOLDER`, can be repeated): image folders, anywhere on disk, shown in
the Assets tab of every artwork. The server only **reads** images from them (`/api/biblioteca` lists,
`/bib/<name>/<image>` serves the thumbnail). Using an item calls `/api/usar-asset`, which copies the image into
the art's folder and returns the relative path — that's the path stored in `_novos[].src`. That way the edits
file never points outside the art's folder. `PULAR` (folder names to skip, lowercase) includes
`placeholders`.

**Code components** — the convention of an exported design system, next to (or inside) the image folder:
`components/<Name>/preview.html` (the assembled component; it may start with
`<!-- @dsCard group="Elementos" width=1080 height=240 -->`), `components/<Name>/README.md` (how to use it) and
the brand's `.css` files at the root and in `components/`. `GET /api/pecas` lists; `GET /ds/<library>/...`
serves the files (the preview comes with `<base>` and the CSS `<link>` tags already in place);
`POST /api/usar-peca` copies into the art the CSS (without `@import` of internet addresses) and the requested
images. The preview runs on the editor's origin (like the art): only point `--biblioteca` at folders you
trust.

**Executable** (releases): the same `servidor.py`, packaged by PyInstaller (`distribuir/empacotar.py`).
`CONGELADO` tells whether it's the executable; then `AQUI` is the package's inner folder (`sys._MEIPASS`, with
`app/`, `arte/` and `render_anim.py`), the default `--raiz` is the `artes/` folder next to the executable, the
browser opens by itself, and `AFE ligar art.html` (or dropping the art onto it) runs the bundled `ligar.py`.
Video looks for a real Python on the PATH (`python_para_video`).

### Online demo (GitHub Pages)

`distribuir/montar_site.py` builds a files-only site: `editor/` (`app/` + `demo.js`), `arte/` (the
`demos/artes`), `demo-indice.json` (the lists the server would make) and `sw.js`. The **service worker** plays
the server inside the browser: it answers `/api/...` and serves the `<art>.edicoes.js` saved in the browser's
Cache Storage (or the original). That's why the app **never** uses fixed addresses: everything goes through
`api.js`, which adds the `BASE` (the folder before `/editor/`; empty with servidor.py, `/afe` on Pages). New
server route → answer it in `sw.js` too (even if only with a "not available in the demo" notice).

## 5. The app — modules

Everything in `app/js/`. Each file starts with a comment saying what it does. Dependencies only go "down":

| File | Responsibility |
|---|---|
| `base.js` | state `S`, messages `ouvir/avisar` (listen/notify), utilities, status. Imports nothing |
| `api.js` | server calls · `css-valores.js` colors/shadows/filters · `presets.js` catalogs (continuous effects, curves, entrances) |
| `menu.js` | right-click menu: `abrirMenu(x, y, itens, opções)` — reusable in any panel |
| `curvas.js` | drawing the curves: `grafico(id)` (SVG), animated ball, `abrirCurvas()` |
| `arte.js` | iframe: load, measure, fit, `achar/caminho` (find/path), `nomeDe`, watch the disk |
| `doc.js` | **edits document**: `mudar`, `editar`, history, `reaplicar`, `salvar` |
| `texto.js` | text editing on the art · `selecao.js` selection and outlines |
| `paineis.js` | modes (Edit/Animate), side panels, tabs |
| `camada-acoes.js` | layer actions used in several places: front/back, hide, lock, `sobOPonto()` (what's under the mouse), layer menu items |
| `barra-rapida.js` | the quick bar below the top bar |
| `alcas.js` | selection box handles: size, width/height, rotate (the math is explained at the top of the file) |
| `alinhar.js` · `palco.js` · `navegacao.js` | centering and reading order · mouse over the art · pages and switching artworks |
| `tempo.js` | animation clock (play, `tocarTrecho`, cover) and keyframe operations (record, delete, curve, copy/paste) |
| `tempo-camada.js` | each layer's timing: start/end, move in time, trim, stagger (all in frames) |
| `painel-*.js` | one tab each: transformar, efeitos, forma, camadas, assets, animacao |
| `painel-pecas.js` | design system code components: list in the Assets tab, "Escolher peça" window, insertion |
| `folha.js` | keyframe sheet: drawing, marked keys, layer bar, drags, right-click menu |
| `barra-topo.js` · `barra-tempo.js` · `campos.js` · `atalhos.js` | wiring to the interface. `atalhos.js` = the `COMANDOS` table (default key, when it applies, what it does) |
| `config.js` · `painel-config.js` | user preferences (each command's key, the role of Shift/Alt/Ctrl), stored in `localStorage` · the ⚙ screen |
| `main.js` | entry point: imports everything, exposes `window.ED` (debugging/tests), opens the art |

### State: `S` (in `base.js`)
Open artwork (`arquivo, pagina, total, larg, alt, escala, w, d, lib`), modes (`editando, animando, tocando`),
document (`edicoes, sujo`), selection (`sel, selCaminho, selPaths`), `hover`, `editTexto`, `tempo`, tabs.
**No module keeps a copy of what's in `S`.** Outside Animate mode, `S.tempo` is always the cover instant
(`tempo.capa()`); turning Animate on sets it to 0.

### Messages: `avisar(tipo, origem)` / `ouvir(tipos, fn)`
Whoever changes something notifies; whoever displays something listens. Types: `arte · doc · selecao · tempo ·
modo · aba · layout · hover · salvo · clique-arte · chave` (keys marked in the sheet / what's copied). An
action's messages are delivered together, at its end (microtask): each listener runs once, with a
`Map type → origins`. A panel that caused the change uses `soDe(lote, MEUS, 'doc', 'my-name')` so it doesn't
redraw itself mid-typing.

### A single undo step
Three ways, from simplest to most general: `lote: 'key'` (changes with the same key less than 0.6 s apart);
`historia: false` on the following steps of a drag the module itself controls; and `doc.abrirGesto()` …
`doc.fecharGesto()` when whoever drags doesn't know who will change the document (dragging inside a number
field fires the field's events — each panel reacts as usual).

### Golden rules
1. **Only `doc.js` changes `S.edicoes`.** Use `mudar(fn, options)` for layers (it becomes a keyframe by itself
   if the layer is animated) and `editar(fn, options)` for the rest (keyframes, items, duration). They handle
   history, "unsaved", applying to the art and notifying.
2. Inside `mudar(fn)`, **read values with `atual(p, c)`**, never straight from `e`: with keyframes, `e` isn't
   the value on screen.
3. The selection is stored by **path**; elements can be recreated on any `reaplicar()`.
4. The interface never depends on the window being visible (no `requestAnimationFrame` to update panels; only
   "play" uses it).
5. Nothing project-specific inside the AFE folder (folder names, classes, brand colors).

## 6. Recipes

**New editable property** (e.g. backdrop blur)
1. `arte/edicoes-lib.js`: apply it in `estilo()` with `por(el, 'cssProp', e.nova)`; if it's a CSS shorthand
   with several declarations, register it in `FAMILIAS`; if simple, in `SIMPLES`.
2. A control in the right tab (`painel-*.js`) calling `mudar((e) => { e.nova = value; }, { origem, lote })`.
3. Animatable? add it to `ANIM_PROPS` (`base.js`), `CANAIS` (`folha.js`) and `gravarChave` (`tempo.js`).
4. Document the field in section 2, test it in `testes/teste_rapido.py`.

**New continuous effect**: the math in the library's `continuos()` + one line in `app/js/presets.js`. Done: the
menu and the sheet read from the catalog.

**New entrance**: a `case` in the library's `entrada()` function (receives `uu` from 0 to 1 and adds to `v.x`,
`v.y`, `v.s`, `v.r`, `v.o` or `v.filtro`; at the end the effect must be zero) + one line in `ENTRADAS` in
`presets.js`. The menu, the card and the sheet read from the catalog. Bump the library revision.

**New easing curve**: the math in the library's `CURVAS` (receives `u` from 0 to 1, returns how much of the way
has been covered) + one line in `CURVAS` in `presets.js` + the diamond shape in `editor.css`
(`.losango.c-name`). Bump the library revision (see "Versions").

**New keyframe operation**: in `tempo.js`, receiving `refs` = `[{ c, k, canais }]` (layer, the key, and
`canais` = `null` for the whole key or a `Set` of channels). Callers get the keys with `chavesAlvo()` from
`folha.js` (the marked ones; if none, the selected elements' keys at the playhead's frame). `refs` point
straight at the document's objects: use and discard, don't keep them between actions.

**New layer-timing operation**: in `tempo-camada.js`. Take a `fotoDe(c)` ("snapshot of") each layer before
changing it (start, end and keys, in frames) and compute from the snapshot with `deslocar(foto, df)` or
`cortar(foto, parte, f)` inside `editar()`. In drags, the snapshot is the one from the start of the drag.
One-click operations use `reaplicar: true`; in the middle of a drag, call `S.lib.quadro(...)` after `editar`.

**New right-click menu item**: in the panel's `contextmenu`, `abrirMenu(ev.clientX, ev.clientY,
[{ rotulo, acao, dica, atalho, marcado, desligado }, '-', { titulo }])` (label, action, hint, shortcut,
checked, disabled, title).

**New tab**: `<button data-aba="x">` and `<div class="painel" id="pn-x">` in `index.html`; a `painel-x.js` file
that listens to the messages and only draws if `visivel('x')`; import it in `main.js`.

**New item type** (Assets tab): create the element in the library's `criarNovos()`; the tile and the data in
`painel-assets.js`.

**New shortcut**: one line in `COMANDOS` (`atalhos.js`) — `id`, `grupo`, `nome`, `padrao` (key, or `''`),
`quando` and `fazer` (group, name, default, when, do). It shows up by itself in the ⚙ Config screen. The `id`
is stored in people's preferences: don't change it later. Add it to the MANUAL's table.

**New mouse modifier** (a Shift/Alt/Ctrl with a new role): one line in `PAPEIS` (`config.js`) and, in the
mouse code, `temMod(ev, 'role')` — never `ev.shiftKey` directly, or the person's choice won't apply.

**New layer action** (used in more than one place): the function in `camada-acoes.js`; the button in
`barra-rapida.js` and/or an item in `itensDeCamada()` (shows in the art's and the list's right-click menu).

**New server route**: in `api_get`/`do_POST`, always validating paths with `dentro()`; the matching call in
`api.js`.

## 7. Testing

- `python testes/teste_rapido.py [--video] [--ver]` — drives the real editor in a temporary folder.
  **Run it before calling any change done.** Add a check for every new feature. (`--ver` = show the browser.)
- In the browser, `window.ED` gives access to the modules: `ED.S`, `ED.doc.entrada()`, `ED.tempo.irPara(1)`…
- Module errors show in the console (F12) — a wrong `import` keeps the editor from opening.

## 8. Conventions

Portuguese for names and comments; a comment at the top of each file; short functions; no external
dependencies; styling only in `editor.css`; interface text in plain language.

## 9. Integrating with code-generated artworks

- Artworks built by a script (which set `data-pronto` when they finish) use "manual mode": they call
  `EDLIB.preparar/finalizar` before setting `data-pronto`. The library copy lives wherever the art already
  points (`ligar.py` respects the existing `<script>` tag); in a new artwork, next to the `.html`.
- Your own PNG renderer doesn't need to know about the editor: the art applies its own edits when it opens.
  Just wait for `data-pronto` before taking the screenshot.
- `render_anim.py` writes to `out/` next to the art, or to the `--saida` folder.
- `servidor.py` doesn't list the folders in `PULAR` (renders, dependencies, `placeholders`). If your project
  keeps renders or code in another folder, add its name there.
- Before changing the **structure** of an artwork that has edits, move the edits into the code and empty the
  edits file (see "Good to know" in the MANUAL).

## Glossary (Portuguese → English)

| Term | Meaning |
|---|---|
| arte | artwork |
| edições / `edicoes` | edits |
| camada | layer |
| caminho | path (of an element) |
| chave / keyframe | key / keyframe |
| curva | easing curve |
| entrada | entrance |
| contínuo | continuous (looping) effect |
| capa | cover (still frame) |
| folha | (keyframe) sheet |
| peça | (code) component |
| biblioteca | library |
| novo / `_novos` | added item(s) |
| raiz | root |
| ligar | connect (an artwork) |
| salvar | save |
