# AFE — changelog

[Português (BR)](../CHANGELOG.md) · **English**

Newest on top. When you change something, add a line here (in both languages).

## 2.3 beta — 2026-11-16 · first public version (beta)

First open-source version. The editor was born inside a private media-production project; the versions below
tell that story. This version removed everything that belonged to that project:

- **Render video:** always writes to `out/` next to the artwork (or to `--saida`). The shortcut that looked for
  the original project's render folder is gone.
- **`ligar.py`:** the library copy goes next to the `.html` (or wherever the artwork already points). The
  special rule for one of the original project's folders is gone.
- **Server:** the list of skipped folders (`PULAR`) now has only generic names (`out`, `build`,
  `node_modules`, `__pycache__`, `fonts`, `placeholders`).
- **License:** GNU AGPL v3 (`LICENSE` file).
- **Demo artworks** (`demos/artes/`): a post and a 7-page carousel about AFE itself, animated with AFE; screenshot
  and GIF in the README.
- **Documentation:** generic examples instead of the original project's; new README and contributing guide;
  everything in Portuguese and English (`docs/en/`); `.gitignore`.

## 2.2 — 2026-11-15 · motion blur in the video

**New**
- **Blur** (timeline bar, next to 🎞 Gerar vídeo): *none · light · normal · strong*, per page. The video gets a
  motion trail, like a camera. The editor's preview and the PNG stay unblurred.
- Cost: the video takes ~4× (light), ~8× (normal) or ~12× (strong) longer to render. E.g. a 5 s 1080×1350
  artwork → ~20 s without blur, ~2 min 20 s on normal.

**Code**
- `render_anim.py`: for each frame it takes several photos with the "shutter" open (`_mb` = how much of the
  interval between frames: 0.25 / 0.5 / 1) and ffmpeg averages them (`tmix` + `select` + `setpts`). New
  `--mb` command-line option. The artwork library didn't need to change.
- Pages gained the `_mb` field (only stored when on).

Test: 148 checks (149 with `--video`; the test video is rendered with light blur and the frame count is checked).

## 2.1 — 2026-11-15 · more continuous effects

**New** (Animation tab › Continuous effects)
- Movement: **Balançar (sway)**, **Órbita (orbit)**, **Quique (bounce)**.
- Size: **Batida de coração (heartbeat)** — two beats and a pause.
- Glow: **Glitch RGB leve (light RGB glitch)** — now and then the colors "split" into pink and cyan.
- Opacity: **Estrobo suave (soft strobe)** — on and off.
- Each effect can start with its own **vel** (speed) value (`vel` field in `presets.js`).

**Library 2.8** — artworks connected earlier need `ligar.py` again for the new effects to show up in the
PNG/video (the editor warns "biblioteca antiga" — old library).

Test: 147 checks (148 with `--video`).

## 2.0.1 — 2026-11-15 · components that couldn't be picked

**Fixes** (*Escolher peça* window)
- Components whose preview *adjusts* a brand class: nothing was selectable. The editor treated every class
  mentioned in the preview's `<style>` as "layout", even if it was a brand class. Now a brand class = one found
  in the brand's .css files.
- Components with clipping or masking (`clip-path`, `mask`): they were selected, but the outline was clipped
  too and it looked like they weren't. The highlight became a box drawn on top of the preview.
- Pieces the brand makes ignore the mouse (decorative layers) now also take the click in the preview.
- Previews with no brand classes (loose drawings, color tables): they now offer the whole drawing (svg), the
  image or the nearest block with a class. A loose svg comes into the artwork at the preview's size and follows
  the item's width.
- Stacked layers (a drawing + its glow): the click grabs the set; the trail still lets you go down a level.

Test: 145 checks (146 with `--video`).

## 2.0 — 2026-11-15 · design system components in the Assets tab

**New**
- **Brand code components in the Assets tab:** if the library has a `components/` folder (an exported design
  system), each component appears under *★ Brand › Peças › group*, with a live thumbnail.
- **"Escolher peça" window:** the large preview next to the instructions (the component's README). Hover and
  click the piece you want; the trail at the top shows the levels (e.g. `ds-card › ds-title`) and lets you go up
  to the outer block. **＋ Pôr na arte** inserts it (or double-click the piece); **⧉ Copiar o código** copies the
  HTML.
- **In the artwork the component is a ★ item:** move, handles, animate, entrances, hide, lock — and the texts
  inside change with a double-click. The side handles change the real width (the text reflows).
- **The brand's CSS comes along:** the editor copies the library's `.css` files (and the images the component
  uses) to the artwork's `assets/biblioteca/<Brand>/`, and the artwork loads them **before** the styles it
  already had (the artwork's styles still win). In the copy, `@import`s of internet addresses (Google fonts)
  are removed: the artwork has to work offline, with the fonts it brings itself.

**Format / artwork library (version 2.7)** — new item `tipo: "html"`:
`{ html, css: [files], contexto: {font, color…}, estilo, nome, w }`.

**Server** — new routes `GET /api/pecas`, `GET /ds/<library>/<file>`, `POST /api/usar-peca`; it now also copies
`.css` files from a library into the artwork's folder.

**Not yet:** "new artwork from a template" (carousel cover, story, thumbnail…) — for now those templates come in
as one big component in an existing artwork.

**Code** — new module `painel-pecas.js`. Test: 142 checks (143 with `--video`).

## 1.9 — 2026-11-15 · Config screen (shortcuts and mouse keys)

**New**
- **⚙ Config** (button at the top): choose the key for each command and what Shift, Alt and Ctrl do with the
  mouse. Stored in the browser (on this computer); doesn't touch the artworks. *Voltar tudo ao padrão* resets.
- **New shortcuts** (all changeable): **E** ✎ Editar · **A** 🎬 Animar · **1–6** tabs (Transform, Effects,
  Shape, Animation, Layers, Assets) · **T** edit the text · **H** hide/show · **L** lock/unlock · **]** front ·
  **[** back · **K** record ◆ Chave. Commands with no default key, ready to get one: side panels, minimize the
  timeline, center, reset, cover, open Config.
- **Configurable mouse keys:** lock to axis / move slowly / release the snap (when dragging); free corners /
  from the center (handles); fast / fine (number fields); add to selection / ignore the lock / cycle with the
  wheel (selecting).

**Code**
- `atalhos.js` became a table (`COMANDOS`): each command with its default key, when it applies and what it does.
- New modules `config.js` (preferences) and `painel-config.js` (the screen). Mouse code asks
  `temMod(ev, 'role')` instead of looking at `ev.shiftKey`.
- Test: 132 checks (133 with `--video`).

## 1.8.1 — 2026-11-15 · double-click on sliders

- **Double-click a slider to reset it to its default:** image adjustments (Blur 0, Brightness / Saturation /
  Contrast 100), color opacity (100), gradient angle (135), outline thickness (3), quick bar opacity (100). On
  **Cantos** (corners), the default is the rounding the artwork already had (the edit is removed). The hint
  shows when hovering over the slider.
- To give a new slider a default: `data-padrao="value"` on it (the rest is automatic, in `campos.js`).
- Test: 126 checks (127 with `--video`).

## 1.8 — 2026-11-15 · quick bar, locking layers, right-click, Alt + wheel

**New**
- **Quick bar** (strip below the top bar, with ✎ Editar on): align to the artwork (left, center, right, top,
  middle, bottom), opacity (slider + number), ⤒ Front / ⤓ Back, hide, lock and ↺ Original.
- **Lock layer:** a click on the artwork passes through it and grabs what's behind (good for backgrounds and big
  blocks). **Ctrl+click** selects it anyway; the layer list shows 🔒 (click the padlock to unlock).
- **Right-click** an element of the artwork or a row of the layer list: front/back, hide, lock, edit the text,
  reset — and, on the artwork, *Selecionar o que está embaixo* (select what's underneath — the list of elements
  stacked at that point).
- **Alt + mouse wheel** over the artwork: cycles the selection through the elements stacked under the mouse.
- **Align to the edges** of the artwork (before there was only centering).

**Behavior changes**
- A click on the artwork now passes through what can't be selected: clicking over a background drawing
  (`<canvas>`) selects the element behind it, instead of clearing the selection.

**Fixes**
- Shift + mouse wheel (fast size on the artwork, steps of 10 in fields) only decreased in browsers that turn the
  wheel into a horizontal scroll when Shift is held.

**Format** — new optional layer field: `trava` (lock; the artwork ignores it, it's editor-only).

**Code**
- New modules `barra-rapida.js` and `camada-acoes.js` (actions shared by the bar, the list and the menus).
- Test: 124 checks (125 with `--video`).

## 1.7 — 2026-11-15 · transform box with handles

**New**
- **Handles on the selection box** (like Photoshop's free transform), on the main element:
  - **corners:** proportional size — the opposite corner stays put (Shift = free, width and height separate);
  - **sides:** only the width or only the height;
  - **dot on top:** rotate (Shift = in 15° steps);
  - **Alt:** scales from the center.
- **The box rotates with the element** (before it always stayed straight around it).
- **Largura % and Altura %** (width/height) in the Transform tab (stretch in one direction only), with ‹ ◇ ›
  keyframe buttons.
- **Added items really change size:** on a shape, the handles change the real width and height (the border and
  corners don't distort); on an added image or text, the corners change the image's width / the font size. The
  artwork's own elements **stretch** (the artwork's layout doesn't change).

**Format / artwork library (version 2.6)**
- New optional layer fields: `sx` and `sy` (width / height stretch; 1 = normal). Animatable.

**Code**
- New module `alcas.js`; `selecao.caixaDe()` returns the "real" box (center, size, rotation).
- Test: 117 checks (118 with `--video`).

## 1.6 — 2026-11-15 · draggable fields, mouse keys, keyframe next to the field, inline text fix

**Fixes**
- **Move, scale, rotate and entrances didn't work on "inline" text runs** (`<span>`, `<em>` — e.g. the colored
  word in a title): the browser ignores those movements on that kind of element. Now the run becomes an
  "inline block" when it needs to move (the text doesn't shift).
- **The same thing showed up twice in the layer list:** a wrapper that only contains a text (the title line +
  the colored word inside it) now shows as a single layer — the inner one, which is what a click selects. The
  outer one is still reachable through **⬆ Bloco de fora**.

**New**
- **Draggable number fields:** click and drag sideways inside any number field to change the value (Shift = 10×
  faster, Alt = fine adjustment). The whole drag is one Ctrl+Z. A simple click still works for typing; the
  field's spinner arrows still work.
- **Keys when dragging an element on the artwork:** Shift locks to an axis (only sideways or only up/down), Alt
  moves 4× slower, Ctrl releases the snap. *(Before: Alt released the snap.)*
- **Keyframe next to the field** (like CapCut): with 🎬 Animar on, X, Y, Size, Rotate and Opacity get **‹ ◇ ›**
  — ◇ adds or removes a key for that property only at the current frame (◆ = there's a key here); ‹ › jump to
  its previous/next key.

**Format / artwork library (version 2.5)** — no new field; only the inline text behavior.

**Code**
- `doc.abrirGesto()` / `fecharGesto()`: several changes in a row become a single undo step.
- Test: 110 checks (111 with `--video`).

## 1.5 — 2026-11-15 · use an image as the background

**New**
- **Use as background:** on any image in the Assets tab, the **fundo** button (shows on hover) or right-click →
  *Usar como fundo*. The image covers the whole artwork without distortion and sits behind everything.
- The background layers the artwork already had (a drawing or image covering everything) are hidden in the same
  action; **deleting the background brings them back**. One background per page: picking another replaces it.
- The background image shows at the end of the layer list as *★ fundo · name*; on the artwork, clicks pass
  through it (it's selected from the layer list).
- Right-click an image in the Assets tab: *Pôr na arte* / *Usar como fundo*.

**Format / artwork library (version 2.4)**
- A new image item accepts `fundo: true` (and `escondeu: [paths]`, the layers it hid).
- With a background image, the artwork's root gets `isolation: isolate` (restored without the background).

**Code**
- Test: 98 checks (99 with `--video`).

## 1.4 — 2026-11-15 · asset library (brand assets in the Assets tab)

**New**
- **Asset library:** an external image folder (e.g. the brand assets) shows in the Assets tab of every artwork,
  organized by its subfolders (★ Brand › Fundos, ★ Brand › Ícones…). Turned on in the server with
  `--biblioteca [NAME=]FOLDER` (can be repeated). When an item is used, the image is copied to
  `<artwork folder>/assets/biblioteca/<NAME>/…`, because the PNG and the video only see the artwork's folder.
- **Placeholders off the panel:** folders named `placeholders` (temporary template images) no longer show in
  the Assets tab, neither in the artwork's folder nor in the library. The files stay on disk.
- In the Assets tab, the artwork's own images come after the library, labeled *Desta arte ›* (from this artwork).

**Server**
- New routes: `GET /api/biblioteca`, `GET /bib/<library>/<image>`, `POST /api/usar-asset`.
- The server now writes a second thing (besides the edits file): copies of **images** from a library, always in
  the artwork folder's `assets/biblioteca/`. It never deletes or replaces an existing file with different
  content (it writes under another name).

**Code**
- Test: 93 checks (94 with `--video`).

## 1.3 — 2026-11-14 · entrances, cover frame and curves with drawings

**New**
- **Entrances** (Animation tab → *Entrada*): Appear, Blurred → sharp, Rise, Drop in, From the left, From the
  right, Zoom (pop), Spin in, Fall and bounce, Glitch. One per layer. Plays at the start of the layer (default:
  30 frames) and then stops; a card with **duration** and **strength**; ▶ plays the preview. The entrance follows
  the delay and Stagger. In the sheet: a yellow strip at the start of the bar.
- **Cover frame** (🖼 Capa in the timeline bar, ▼ on the ruler): the instant the artwork shows when still — in
  the PNG, in the browser and in the editor outside Animate mode. Default: the **last frame** (everything has
  come in).
- **Curve menu with drawings:** each curve shows a graph and a ball moving with it (in the timeline bar and on
  the diamond's right-click). Generated by code, with the same math as the animation.
- A warning when a change made outside Animate mode becomes a keyframe (a layer with keys).
- Animation tab reorganized: Entrance · Layer timing · Stagger · Continuous effect.

**Behavior change**
- Before, the still artwork (PNG) and the editor outside Animate showed **frame 0**. Now they show the **cover**
  (default: the end). On a page with only continuous effects nothing changes (the end equals the start of the
  loop).
- Turning 🎬 Animar on moves the playhead to frame 0; turning it off goes back to the cover.

**Format / artwork library (version 2.3)**
- New optional fields: `ent` on the layer (`{ tipo, dur, int }`) and `_capa` on the page (seconds).
- `EDLIB.curva(name, u)` (the math of a curve) and `EDLIB.capa(n)`.
- "Flicker opacity" starts from the opacity the artwork already had (it used to assume 100%).

**Code**
- New module `curvas.js` (graph, ball, curve menu); `menu.js` accepts drawings in items and opens upward;
  `ENTRADAS` catalog in `presets.js`; `tocarTrecho()`, `capa()`, `definirCapa()` in `tempo.js`.
- Test: 87 checks (88 with `--video`).

## 1.2 — 2026-11-14 · layer timing and Stagger

**New**
- **Layer timing** (After Effects style): each layer can have a frame where it **appears** and one where it
  **disappears**. Outside that span it's invisible in the video.
- **Layer bar in the keyframe sheet** (blue strip behind the diamonds): dragging the middle moves the whole
  layer in time (the keys go along — that's the "delay"); the ends trim the start and the end without touching
  the keys. With several layers selected, dragging one bar moves them all.
- **Animation tab:** **Começa no frame** (starts at frame; moves the layer with its keys) and **Some no frame**
  (disappears at frame) fields.
- **⏱ Escalonar (Stagger):** with several selected, each one starts N frames after the previous one — in reading
  order (top→bottom, left→right) or in the order they were selected. 0 = all together.
- Right-click on the layer's row: *Começar aqui* (start here), *Cortar o começo aqui* / *o fim aqui* (trim the
  start / end here), *Tirar os cortes* (remove trims).
- **Selected** layers now show in the sheet even without animation (that's where you give them timing).

**Format / artwork library (version 2.2)**
- New optional layer fields: `ini` and `fim` (seconds). Old files still work.
- `EDLIB.quadro()` became sturdier: a layer that stops being animated (or loses all its edits) returns to the
  right state on the next frame, without rebuilding the whole artwork.

**Fixes**
- A key only took effect **one frame after** its frame (the stored time, with 4 decimals, lands a hair after the
  frame's real instant). Almost invisible with smooth curves; visible with Step.

**Code**
- New module `tempo-camada.js` (start/end, move, trim, stagger); `ordemDeLeitura()` in `alinhar.js`.
- Test: 73 checks (74 with `--video`).

## 1.1 — 2026-11-14 · easing curves and copy/paste of keys

**New**
- **Easing curve per keyframe:** Smooth (default), Linear, Accelerate, Brake, Overshoot, Bounce and Step. It
  applies to the segment from the key to the next one. Pick it in the **Curva** menu of the timeline bar or by
  right-clicking the diamond. The diamond's shape shows the curve.
- **Copy and paste keys:** Ctrl+C / Ctrl+V (or the ⧉ Copiar / ⎘ Colar buttons). Pastes where the playhead is: on
  the same element (another frame) or on the selected elements. Works across pages.
- **Mark several keys** with Shift+click: dragging moves the group (keeping the spacing), Delete deletes them
  all, Ctrl+C copies them all.
- **Right-click menu** in the keyframe sheet: curve, copy, paste here, delete; on the layer's name, "copy all
  keys of this layer".
- The editor warns when the library copy inside the artwork is older than its own (run `ligar.py`).

**Format / artwork library (version 2.1)**
- New optional key field: `ease` (the curve's name). Old files still work (no `ease` = smooth). The default
  curve isn't stored.
- `EDLIB.curvas` lists the curves the library knows.
- CSS strings (glow, shadows) never overshoot with the Overshoot/Bounce curves: out-of-range values would break
  the CSS.

**Fixes** (found while reviewing stage 1)
- Saving twice in the same second kept only one copy of the previous version (the second copy overwrote the
  first). It was also the cause of an intermittent test failure.
- Dragging a key onto another: sometimes the one standing still won, not the dragged one.
- Dragging keys to the edge of the sheet no longer "squashes" the group (it stops whole at the edge).

**Code**
- New module `menu.js` (reusable right-click menu). New `chave` message.
- Curve and copy/paste operations in `tempo.js`; `CURVAS` catalog in `presets.js`.
- Test: 60 checks (61 with `--video`), including the screen layout (minimize, panels).

## 1.0 — 2026-11-13 · portable folder, modular code, fixes

**Organization**
- The editor moved into a single self-contained folder (then called `editor-artes/`) that can be copied into any project.
  Before: loose files inside the project where it was born.
- The server takes the artwork folder through `--raiz`; new addresses: `/editor/`, `/arte/`, `/api/`.
- `ligar.py` (connects any artwork; automatic and manual modes), `exemplo/` sample artwork,
  `testes/teste_rapido.py`.
- Documentation: LEIA, MANUAL, ARQUITETURA, ROTEIRO, DESCOBERTAS and this changelog.
- Interface code rewritten as 22 small modules (before: 7 files with shared global variables); CSS in its own
  file; a single state (`S`) and messages between modules.

**Format / artwork library (version 2)**
- API for the artwork: `EDLIB.preparar` / `finalizar` / `aplicarTudo` (before: `criarNovos`, `aplicarTexto`,
  `aplicarPosicao`); automatic mode with `data-auto`; `EDLIB.info()`.
- Configurable root (`#post`, `data-ed-raiz`, `EDLIB_RAIZ`, or `<body>`); layer names with `data-nome`.
- Added items with their own id (`#n1`) instead of position.
- One edits file per artwork (`<art>.edicoes.js`); the old `edicoes.js` still works.

**New**
- Redo (Ctrl+Shift+Z / Ctrl+Y); undo still works after saving and across pages.
- Artwork field with the list of artworks in the folder (✓ = connected); opens the last one used.
- ◆ Chave and ✕ Chave apply to every selected element; grouped continuous effects menu.
- The layer list's 👁 no longer changes the selection.

**Fixes**
- Changing something that doesn't animate (hide, color, order) on a layer with keyframes created an empty key.
- The Shape tab turned a circle into a rounded square (radius in % read as px) and stored the rounding even
  when the user didn't touch it.
- The Effects tab reordered the filter functions (changing the result in artworks with blur + brightness).
- Resetting to original could wipe the artwork's own `background`/`border` styles.
- Editing a paragraph's text after moving a word in it embedded the word's style in the text.
- Switching pages left outlines from the old selection.
- Dragging a diamond (or the ruler) and releasing over the artwork left the drag "stuck".
- Space/Enter could repeat the last button clicked instead of play/pause.
- The rendered video's link broke in folders with accents in the name.
- Moving an element and the block containing it, together, moved the inner one twice.
- Flicker/breathe the glow could use an outdated base glow after undo.
- Changing the duration, the sheet or items ignored part of the history rules (now everything goes through
  `doc.mudar` / `doc.editar`).
- Server: checks `Host`/`Origin`, requires JSON, pins file types (modules on Windows).

**Performance**
- One action = one redraw per panel (before: one per selected element, on every mouse move).
- The keyframe sheet is no longer rebuilt when moving the playhead or playing (only the playhead moves).
- Lists (layers, effects, shape) only redraw when what they show has changed.
- The library doesn't rewrite styles that already have the right value (on every animation frame).
- "Live" mode polls once per second (it was twice) and pauses with the window hidden.

## 0.6 — 2026-11-13 · new screen layout
Reorganized screen (top bar; left Layers | Assets; right Transform | Effects | Shape | Animation), minimizable
timeline, multi-select with Shift+click.

## 0.5 — 2026-11-12 · keyframe sheet
Blender-style sheet counted in frames: summary, layers, channels, ruler with a blue playhead; click, drag and
delete keys; keyframes always on whole frames.

## 0.4 — 2026-11-12 · layers, shape, assets, animation
A panel with Layers/Effects/Shape; an assets drawer; keyframes with auto-record; continuous effects (wiggle,
float, pulse, flicker…); MP4 video rendering.

## 0.3 — 2026-11-12 · effects and alignment
Effects panel (layered glow, shadows, color, image adjustments, copy/paste); centering; snapping.

## 0.2 — 2026-11-12 · manual editor
Select, drag, wheel = size, double-click = text, undo, save to `edicoes.js`.

## 0.1 — 2026-11-12 · viewer
Artwork fitted to the screen, page switching, automatic reload.
