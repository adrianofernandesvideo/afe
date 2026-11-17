# AFE — manual

[Português (BR)](../MANUAL.md) · **English**

How to use the editor day to day. (To open the editor and connect an artwork, see [SETUP.md](SETUP.md).)

> The interface is in Portuguese. Button and field names appear here exactly as on screen, with a translation
> the first time they show up — e.g. **✎ Editar** (Edit).

## The screen

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◧  ◀ 3/20 ▶  [ open artwork ▾ ]  ✎ Editar  🎬 Animar   ↶ ↷  💾 Salvar  status  ◨ │
├───────────────┬──────────────────────────────────┬───────────────────────────┤
│ Transformar│Efeitos│Forma│                       │ Camadas│Assets             │
│ Animação                  │     THE ARTWORK      │                           │
│          (left)           │                      │         (right)           │
├───────────────────────────┴──────────────────────┴───────────────────────────┤
│ keyframe sheet (shows up with 🎬 Animar)                                       │
│ Duração · frame   ⧉ Copiar ⎘ Colar  ⟲ ◂ ▶ ▸  ‹ ◆ Chave › ✕  Curva ▾   Motion Blur  🖼 Capa  🎞 Gerar vídeo ▾ │
└──────────────────────────────────────────────────────────────────────────────┘
```

Top bar: **✎ Editar** (Edit), **🎬 Animar** (Animate), **↶ ↷** (undo/redo), **💾 Salvar** (Save). Left tabs:
**Camadas** (Layers), **Assets**. Right tabs: **Transformar** (Transform), **Efeitos** (Effects), **Forma**
(Shape), **Animação** (Animation). Timeline: **Duração** (Duration), **Chave** (Key), **Curva** (Curve),
**Copiar / Colar** (Copy / Paste), **Capa** (Cover), **Gerar vídeo** (Render video).

- **Artwork field** (top): click to pick another artwork from the folder. ✓ = already connected to the editor.
- **◀ ▶**: pages (carousel). With nothing selected, the ← → keys also switch pages.
- **◧ ◨**: show/hide the left and right panels (so the artwork gets bigger).
- **Quick bar** (second strip, shows up with ✎ Editar): what you use all the time, without opening tabs —
  **alinhar na arte** (align to the artwork; 6 buttons: left, center, right, top, middle, bottom),
  **opacidade** (opacity), **⤒ Frente / ⤓ Trás** (Front / Back), **👁 Esconder** (Hide), **🔒 Travar** (Lock)
  and **↺ Original** (reset). Applies to the selected elements.
- **status**: `● ao vivo` (live), `● editando` (editing), `● não salvo` (unsaved), `salvo ✓` (saved).

With **✎ Editar** off, the editor is only a viewer: it shows the artwork fitted to the screen and **reloads
by itself** when the artwork's file changes on disk.

## Selecting

- **Click** an element in the artwork. The selected one gets a cyan outline.
- **Shift+click** adds (or removes) an element: the others get a dashed outline. The last one clicked is the
  **main** one.
- **⬆ Bloco de fora** (outer block; Transform tab): clicked a word and wanted the paragraph? Goes up one level.
- **Camadas (Layers) tab**: select from the list (also with Shift). It's the only way to grab the background.
- **Stacked elements:** **Alt + mouse wheel** over the artwork cycles the selection through the elements under
  the cursor; the **right-click** menu also lists *Selecionar o que está embaixo* (select what's underneath).
- **Locked layer (🔒):** a click on the artwork passes through it and grabs what's behind. Lock backgrounds and
  big blocks you keep selecting by accident (**🔒 Travar** in the quick bar, or right-click → *Travar*). To
  select a locked one: **Ctrl+click**, or use the layer list. Click the padlock in the list to unlock.
- **Right-click** an element (or a row in the layer list): front/back, hide, lock, edit the text, reset.
- **Esc** clears the selection.

## Move, size, rotation, opacity (Transformar tab)

| To do | How |
|---|---|
| move | drag · arrow keys (1 px; with Shift, 10 px) · **X** and **Y** fields |
| move in a straight line | while dragging, hold **Shift**: it only moves sideways or only up/down |
| move slowly | while dragging, hold **Alt**: it moves 4× slower (fine adjustment) |
| snap to the center | when dragging near the center a pink line appears and the element snaps; **Ctrl** turns it off |
| align | quick bar: left, center, right, top, middle and bottom of the artwork · Transform tab: **⇔ Centro** / **⇕ Centro** (center) relative to the artwork or the outer block |
| size | **corner handles** of the box · mouse wheel over the element (Shift: faster) · **Tamanho %** (Size) field |
| width only / height only | **side handles** of the box · the **Esticar %** (stretch) row, **L** (width) and **A** (height) — with the 🔗 chain on (default), changing one changes the other in proportion; click the chain to unlink |
| rotate | the **dot** above the box (Shift: in 15° steps) · **Girar °** (Rotate) field |
| opacity | **Opacidade %** field |
| hide | **Esconder** checkbox (or the 👁 in the Layers tab) |
| go back to how it was | **↺** at the end of each row resets just that row (position 0, size 100, rotation 0…) · **↺ Original** removes every edit from the selected elements (asks first; Ctrl+Z undoes) |

**The box handles** (small white squares around the selection):
- **Corners:** scale evenly; the opposite corner stays put. With **Shift**, width and height are free.
- **Sides:** change only the width or only the height; the opposite side stays put.
- **Alt** (on any handle): scales from the center, growing both ways.
- **Cyan dot on top:** rotates. The box rotates with the element.
- **What really changes:** on a **shape** you added (★ rectangle, circle), the real width and height — the
  border and rounded corners don't distort. On an added **image** or **text**, the corners change the real
  size; the sides stretch. On the **artwork's own elements**, the handles stretch the element (like a photo),
  without touching how the art is built. To go back: **↺ Original**, or 100 in Size/Width/Height.
- The handles apply to the main element. While you edit a text or the animation plays, they disappear.

Units (px, %, °) show in grey **inside** the box: visual only — type just the number. **Esconder** (hide) sits
in the section title. The **Atalhos** list collapses and opens with the ▸ / ▾ next to its title.

In the tab, each property is one row: **Posição** (position, X and Y side by side), **Tamanho %** (size),
**Esticar %** (stretch, L 🔗 A), **Girar °** (rotate) and **Opacidade %** (opacity). With 🎬 Animar each row gets
‹ ◇ › — on the pairs, a single ◇ keys both.

With several elements selected, all of this applies to all of them. In X and Y, the field shows the main
element's value and all of them move **the same distance**.

**Number fields** (in every tab): **click and drag sideways** inside the field to change the value — Shift
moves 10× faster, Alt does fine adjustment. A simple click selects the value for typing; the mouse wheel over
the field also increases/decreases it (Shift: in steps of 10).

**Sliders**: **double-click resets to the default value** — brightness, saturation and contrast at 100, blur
at 0, opacities at 100. On the **Cantos** (Corners) slider (Shape tab), the default is the artwork's original
rounding.

> Shift held **before** the click adds the element to the selection. To lock the axis, start dragging and only
> then hold Shift.

## Text

**Double-click** the text (or **✎ Texto**): the outline turns yellow, just type. **Esc** or a click outside
finishes. Colored highlights inside the text are kept.

> In texts the artwork fits by itself (titles "justified by size"), the right fit only appears **after
> saving** — the editor reloads the artwork and it measures the new text.

## Efeitos (glows and shadows)

Shows the main element's effects, split into **layers** you can tweak, add (**+ camada**, + layer) and remove
(**✕**):

- **Brilho / sombra da forma** (shape glow / shadow) — follows the element's outline (PNG cutouts, texts,
  icons). Several layers together make the glow. Each layer: color, color opacity, X, Y and blur.
- **Sombra do texto** (text shadow) and **Sombra da caixa** (box shadow — the glow around badges, pills and
  panels).
- **Cor do texto** (text color).
- **Image adjustments:** blur, brightness, saturation and contrast.
- **Blend mode** (*Mesclagem*) lives in the **Camadas** tab and the right-click menu — see below.
- **Copiar / Colar nos selecionados** (Copy / Paste to selected): copies all of the above from one element and
  applies it to others.

## Forma (corners, fill, outline)

For boxes, badges, panels, pills and added shapes:

- **Cantos** (corners): rounding (in px; on round shapes, in %).
- **Preenchimento** (fill) and **Contorno** (outline): *Original* (leave as is), *Nenhum* (none), *Cor*
  (color) or *Gradiente* (two colors and an angle). The gradient outline works with rounded corners.
- With a **★ granulado** (grain) selected, the tab shows the grain settings (see "Grain" under Assets).

## Camadas (Layers, right)

Lists everything in the artwork — **the top of the list is in front**.

- **▸** opens the elements inside a block. **👁** shows/hides.
- **⤒ Frente / ⤓ Trás** change the order. **🗑** (or **Delete**) deletes the selected layer after a confirmation: a ★
  item leaves the edits; an element of the **artwork** disappears from the artwork and the list (the artwork's code
  doesn't change). To bring it back: **Ctrl+Z**, the "N apagada(s) · restaurar" notice at the top of the list, or
  right-click → *Restaurar apagados* (restore deleted).
- **🎬** next to the name = the layer is animated. **◐** = the layer has a blend mode.
- **Mesclagem** (blend mode, at the top of the list): the selected layer's blend mode, as in Photoshop — Normal,
  Darken, Multiply, Color Burn, Lighten, Screen, Color Dodge, Add (*Adição*), Overlay, Soft Light, Hard Light,
  Difference, Exclusion, Hue, Saturation, Color, Luminosity (names on screen in Portuguese). Also on the
  **right-click menu** (on the artwork or the list) → *Mesclagem ▸*. Same in the PNG and the video.
  > A layer blends with what's behind it **inside the same block**. If the outer block is rotated, animated or
  > has opacity, it only blends with what's inside that block.

## Assets (right)

From top to bottom:

0. **★ Peças** (components; e.g. *★ Brand › Peças › Elementos*) — the code components of the brand's design
   system: badges, panels, titles, lists, the website pill… See "Brand components" below.
1. **Formas e texto** (shapes and text) — rectangle, circle, text and **Grão** (grain, see below).
2. **★ Library** (e.g. *★ Brand › Fundos*, *★ Brand › Ícones*) — the brand assets, the same for every artwork,
   organized by the library's folders.
   **★ Assets gerais** (general assets) is the library of images you brought from your computer into the Assets tab.
3. **Desta arte ›** (from this artwork) — the images in the artwork's own folder.

**Images from your computer:** drag a file (PNG, JPG, WebP, GIF or AVIF, up to 15 MB) from your computer and drop it:
- **on the artwork** (or the layer list): the image is copied to `assets/importadas/` in the artwork's folder and
  becomes a ★ layer where you dropped it;
- **on the Assets tab**: it goes to **★ Assets gerais** (the `assets-gerais/` folder inside the artworks folder)
  and shows up for **every artwork**; when used in an artwork, it's copied into that artwork's folder.

An existing file is never replaced: same name with different content is saved alongside with a suffix.

**Grain (*Grão* / granulado):** film grain generated by AFE itself, no texture image needed. It covers the whole
artwork, comes in **locked** (clicks on the artwork go through it — select it from the layer list) and in
**Overlay**. In the **Forma** tab: *Força* (strength), *Grão* (fine, medium, coarse), *Cor* (black & white or
color) and *Animado* (the grain "boils", 12 times a second). Animated grain depends only on the time, so the
video matches the editor. For something subtler, use **Soft Light** or lower the opacity.

**Drag** onto the artwork, or **click** to place it in the center. The item is marked with ★ in the layer list
and can be moved, styled and animated like any other; **Delete** removes it. The search field filters by file
name.

> **Why does the library copy the image?** The PNG and the video only see the artwork's folder. So, when you
> use a library item, the editor keeps a copy in `assets/biblioteca/` inside the artwork's folder (only once —
> using it again reuses the same copy).
>
> **To add a new image to the library:** copy the file into the library folder (into one of the subfolders, or
> create another) and reopen the Assets tab. Folders named `placeholders` don't show up: they're for
> temporary template images.
>
> The image comes in small (up to 320 px wide) and in front of everything; enlarge it with the mouse wheel.

**Brand components** (the design system)
1. Open a group of components and click one: the **Escolher peça** (pick a component) window opens, with the
   preview on one side and the **usage instructions** on the other.
2. Hover over the preview and **click the piece you want** (it gets a yellow outline). The trail at the top
   shows where it sits — e.g. `ds-card › ds-title` — and clicking a name in it goes up to the outer block (the
   whole component, with background and decorations) or back.
3. **＋ Pôr na arte** (put in the artwork; or double-click the piece). The component lands in the center of the
   artwork as a ★ item.
4. In the artwork: move it, resize it with the handles (the side handles change the width and the text
   reflows), animate it, and **change its texts with a double-click**. To select a piece inside, click it;
   **⬆ Bloco de fora** goes back to the whole component.
5. **⧉ Copiar o código** (copy the code) copies the piece's HTML, to paste into an artwork's code.

> The component depends on the brand's CSS. When you use the first component, the editor copies that CSS to
> `assets/biblioteca/` inside the artwork's folder. It is loaded **before** the styles the artwork already
> has — if the artwork changed something from the brand, its change still wins.
>
> **Fonts:** the CSS copy doesn't fetch fonts from the internet. The component uses the fonts the artwork
> already loads (put the font files in the artwork's folder and load them with `@font-face`); without them, a
> similar font shows up.
>
> Whole-artwork templates (carousel cover, story, thumbnail) also appear in the list and come in as one big
> component. Creating a new artwork from a template doesn't exist yet.

**Using an image as the background**
- Hover over the image and click the **fundo** (background) button in its corner (or right-click → *Usar como
  fundo*). It covers the whole artwork, without distortion, and goes behind everything.
- The background the artwork already had is hidden right away (the editor says how many layers it hid). If
  you'd rather keep both, turn them back on with the **👁** in the Layers tab.
- **Swap:** click **fundo** on another image. **Remove:** select *★ fundo · name* at the bottom of the layer
  list and press **Delete** — the artwork's original background comes back.
- The background image is selected from the layer list (clicking the artwork doesn't grab it, so it doesn't
  get in the way). Once selected, you can move it, enlarge it, change its opacity and animate it like any item.

## Animação (Animation)

Turn on **🎬 Animar**: the timeline appears, counted in **frames** (30 per second). The playhead goes to
frame 0. With Animar off, the editor shows the **cover** (see below).

**Entrada** (entrance; Animation tab, on the right) — how the element arrives
1. Select the element (or several) and pick from the **▶ Escolher a entrada…** (pick the entrance) menu:
   *Aparecer* (appear) · *Desfocado → nítido* (blurred → sharp) · *Subir* (rise) · *Descer* (drop in) ·
   *Vir da esquerda / da direita* (from the left / right) · *Zoom (pop)* · *Girar e entrar* (spin in) ·
   *Cair e quicar* (fall and bounce) · *Glitch*. The editor plays the entrance once so you can see it.
2. On the card: **duração** (duration, in frames; 30 = 1 second) and **força** (strength — how far, how small,
   how rotated or blurred it comes from). **▶** plays it again, **✕** removes the entrance.
3. The entrance happens at the **start of the layer**: if you delay the layer ("Começa no frame", dragging the
   blue bar, or Escalonar), the entrance goes along. In the sheet it shows as a yellow strip at the start of
   the bar.

Each element has a single entrance (picking another replaces it). Changing the card applies to every selected
element that has an entrance. Quick recipe for an animated carousel: select the blocks → pick *Subir* →
**⏱ Escalonar** (stagger) every 5 frames.

**🖼 Capa** (cover) — what shows when the artwork is still
- The PNG (and the editor with Animar off) shows **one** instant of the animation: the cover. Unless you pick
  one, it's the **last frame** — when everything has come in.
- To change it: move the playhead to the frame you want and click **🖼 Capa** (or right-click the ruler →
  *Usar o frame N como capa*). The yellow **▼** mark on the ruler shows where it is.
- Cover on the last frame = back to the default.

**Keyframes**
1. Select the element, move the playhead (blue line) to the frame you want and click **◆ Chave** (key): it
   records position, size, rotation, opacity and glow at that frame.
2. Go to another frame and **change the element** (drag, size, effects…): that frame's key is recorded by
   itself. Between two keys the motion is smoothed.
3. **‹ ›** jump between keys; **✕ Chave** deletes the key at the current frame.

**Single-property keyframe** (Transform tab, with Animar on): next to X, Y, Size, Rotate and Opacity you get
**‹ ◇ ›**. The **◇** records a key for that property only at the current frame (it turns into a yellow **◆**;
clicking again removes it). **‹ ›** move the playhead to that property's previous/next key. Useful, for
example, to animate only the opacity without pinning the position.

**Keyframe sheet** (like Blender's dope sheet)
- Rows: **Resumo** (summary) › each animated layer › (opening with ▸) the channels — Position X/Y, Size,
  Rotation, Opacity, Glow — and the continuous effects.
- **Ruler:** click or drag to move the playhead.
- **Diamond:** click = marks the key and goes to its frame · **Shift+click** = marks one more (or unmarks) ·
  drag = moves the marked keys together · **Delete** = deletes the marked keys (on a channel row, only that
  channel) · **right-click** = menu with curve, copy, paste and delete.
- **Layer's blue bar** (behind the diamonds): shows when the layer is visible. See "Layer timing" below.
- Layers selected in the artwork show up in the sheet even without animation.
- **▾** (right end of the bar) minimizes the sheet.

**Curva (easing curve)** — how the value travels from one key to the next. Mark the key **the motion leaves
from** (or park the playhead on it) and pick from the **Curva** menu in the bar, or right-click the diamond.
For each curve the menu shows a **graph** (time goes right, value goes up) and a **ball** doing that motion:

| Curve | How it moves | Diamond |
|---|---|---|
| **Suave** (smooth; default) | slow out and slow in (ease in-out) | diamond |
| **Linear** | constant speed | square |
| **Acelerar** (accelerate) | starts slow and speeds up (ease in) | drop pointing right |
| **Frear** (brake) | starts fast and arrives slowly (ease out) | drop pointing left |
| **Recuo** (overshoot) | goes a little past and comes back | dot |
| **Quique** (bounce) | arrives and bounces | dot with a ring |
| **Degrau** (step) | holds still and jumps at the next key | small bar |

The curve applies to everything the key holds (position, size, rotation…). Hover over the diamond to see the
curve's name.

**Copying and pasting keys**
- **Ctrl+C** (or **⧉ Copiar**) copies the keys marked in the sheet; with none marked, the selected element's
  key at the playhead's frame.
- **Ctrl+V** (or **⎘ Colar**) pastes **where the playhead is**:
  - *on the same element, at another frame:* copy, move the playhead to the new frame and paste;
  - *on another element:* copy, click the other element in the artwork (you can select several with Shift)
    and paste. Also works on another page.
- Copied several keys? They keep their spacing: the first lands on the playhead, the others after it.
- **A whole animation from one element to another:** right-click the layer's name in the sheet → *Copiar todas
  as chaves desta camada* (copy all keys of this layer); select the other element, playhead at frame 0,
  Ctrl+V.
- Right-click a row in the sheet → *Colar nesta camada* (paste into this layer): pastes straight into that
  layer, at the frame under the mouse.
- Keys copied from several layers at once (e.g. from the Summary diamond) each go back to their own layer, at
  the new frame.
- Anything past the end of the animation is not pasted (the editor tells you). The copied position is the
  element's **offset**: the other element makes the same motion starting from its own place.

**Tempo da camada** (layer timing) — which frame each element appears and disappears at (like After Effects
layer bars)

| To do | How |
|---|---|
| delay the entrance | drag the **middle of the blue bar** in the sheet, or type in **Começa no frame** (starts at frame; Animation tab). The keys move along |
| trim the start | drag the **left end** of the bar (the keys stay where they are) |
| make it disappear before the end | drag the **right end**, or type in **Some no frame** (disappears at frame; empty = stays until the end) |
| move several at once | select the elements (Shift+click) and drag one of their bars |
| back to normal | right-click the layer's row → **Tirar os cortes** (remove trims) |

Clicking the bar (without dragging) moves the playhead there. Right-clicking the layer's row also offers
*Começar aqui* (start here) and *Cortar o começo/fim aqui* (trim start/end here). Outside the bar's span the
layer is invisible — in the preview and in the video.

**⏱ Escalonar** (stagger; Animation tab) — several elements coming in one after another:
1. Select the elements with Shift+click (e.g. 3 squares, each with its own animation — tip: animate one, copy
   its keys and paste them on the others).
2. Choose the interval in frames and the order: **de leitura** (reading order — top to bottom, left to right,
   as they appear on screen) or **a ordem em que você selecionou** (the order you selected them).
3. Click **⏱ Escalonar**. The first one stays put; each of the others is moved whole (with its keys) to start
   after the previous one. Changed your mind? Change the number and click again. **0** brings them all back
   together.

**Continuous effects** (Animation tab, on the right): loop seamlessly. Each one has **força** (strength) and
**vel** (speed — how many times per loop), and you can stack several on the same element.

| Group | Effect | What it does | Strength |
|---|---|---|---|
| Movement | Wiggle suave (soft wiggle) | shakes gently, with no pattern | px |
| Movement | Flutuar (float) | goes up and down | px |
| Movement | Balançar (giro) (sway) | rotates one way and the other | degrees |
| Movement | Órbita (orbit) | travels a small circle | radius in px |
| Movement | Quique (bounce) | jumps and hits the floor | height in px |
| Size | Pulsar (pulse) | grows and shrinks | % |
| Size | Batida de coração (heartbeat) | two beats in a row and a pause | % |
| Glow | Piscar o glow · Respirar o glow (flicker / breathe the glow) | the glow flickers / fades in and out (needs a glow in the Effects tab) | % |
| Glow | Glitch RGB leve (light RGB glitch) | now and then the colors split into pink and cyan | px |
| Opacity | Piscar a opacidade (flicker opacity) | quick transparency glitches | % |
| Opacity | Estrobo suave (soft strobe) | turns on and off at a steady pace | % |

**Duração** (duration): 5 s by default (field in the timeline bar), per page.

**🎞 Gerar vídeo** (render video): saves and renders the page's MP4 (artwork size, 30 fps), showing the
progress; the link appears next to the button. The artwork's PNG shows the **cover** (see above).

**Play and loop:** ▶ plays the animation. The **⟲** button (next to ◂) turns the **loop** on/off: lit
(default), play repeats; off, it plays once and stops at the end. **Shift + ▶** (or Shift + Space) does the
opposite of the button, just that once. The choice is remembered by the browser.

**Motion Blur:** the selector next to 🖼 Capa gives the **video** a motion trail, like a camera:
*sem* (none), *leve* (light), *normal* (the cinema standard) or *forte* (strong). Set per page. The preview in
the editor and the PNG stay unblurred. The video takes longer to render: ~4× on light, ~8× on normal, ~12× on
strong. It only shows on things that move fast; whatever stands still stays sharp.

## Saving, undo, redo

- **💾 Salvar** (Ctrl+S) writes the edits to the file next to the artwork and reloads to show the final
  result. The button turns yellow while there is something unsaved.
- **↶ / ↷** (Ctrl+Z / Ctrl+Shift+Z or Ctrl+Y): up to 300 steps, even after saving and when switching pages. If
  the undone step belongs to another page, the editor goes there.
- Every save keeps the previous version (see "Where your edits live" in [SETUP.md](SETUP.md)).

## ⚙ Config — shortcuts and mouse keys

The **⚙** button at the top opens the settings. They are stored **in this browser, on this computer**, and
don't change anything in the artworks.

- **Atalhos de teclado** (keyboard shortcuts): click a command's key and press the new combination (Esc
  cancels). **✕** leaves the command without a shortcut; **↺** goes back to the default key. If the chosen key
  already belonged to another command, that one is left without a shortcut and the screen tells you which.
- **Teclas ao usar o mouse** (keys while using the mouse): what Shift, Alt and Ctrl do while you drag or click
  (lock to axis, move slowly, release the snap, free corners, add to selection…). Within a block, choosing a
  key that was already in use swaps the two.
- **↺ Voltar tudo ao padrão** (reset everything) undoes all changes.
- The arrow keys (move) and Esc (clear selection) are fixed. With the screen open, shortcuts don't fire.
- Single-letter shortcuts don't work while you type in a field or edit an artwork's text.

## Shortcuts

*(These are the default keys; all marked ⚙ can be changed in Config.)*

| Key | What it does |
|---|---|
| Click / Shift+click | select / add to selection |
| Drag | move — Shift = lock to axis · Alt = slow · Ctrl = no snap |
| Drag inside a number field | changes the value — Shift = fast · Alt = fine |
| Double-click a slider | back to the default value |
| Ctrl+click | selects even a locked layer |
| Alt + mouse wheel (on the artwork) | cycles through the elements under the mouse |
| Right-click (on the artwork or the layer list) | layer menu |
| Box handles | corners = size (Shift = free) · sides = width/height · dot = rotate (Shift = 15°) · Alt = from the center |
| Arrows (Shift = 10 px) | move 1 px — with no selection, ← → switch pages |
| Mouse wheel (Shift = fast) | size |
| Double-click · Esc | edit text · finish |
| Delete | deletes the keys marked in the sheet, or the selected ★ items |
| Shift+click on a diamond | marks one more key (or unmarks) |
| Right-click on the sheet | menu: curve, copy, paste, delete · on the layer row: start/trim here |
| Drag the layer's blue bar | middle = moves the layer in time · ends = trim the start / end |
| Ctrl+C · Ctrl+V (with 🎬 Animar) | copy keys · paste where the playhead is |
| Esc | clears the selection |
| Ctrl+Z · Ctrl+Shift+Z / Ctrl+Y | undo · redo |
| Ctrl+S | save ⚙ |
| E · A | toggle ✎ Editar · 🎬 Animar ⚙ |
| 1 2 3 4 · 5 6 | Transform, Effects, Shape, Animation tabs · Layers, Assets ⚙ |
| T | edit the selected element's text ⚙ |
| H · L | hide/show · lock/unlock ⚙ |
| ] · [ | bring forward · send backward ⚙ |
| K (with 🎬 Animar) | record ◆ Chave (key) ⚙ |
| Space (with 🎬 Animar) | play / pause |
| Shift + Space / Shift + ▶ | play the opposite of the loop setting, just this once ⚙ |
| `,` and `.` (with 🎬 Animar) | previous / next frame |

## Good to know

- **A colored word inside a title is a separate element.** Clicking it selects the word (to change its color
  or animate just it); **⬆ Bloco de fora** goes up to the line, and again to the title.
- **"Só visualizando"** (view only) in the status = the artwork hasn't been connected to the editor yet (the
  Editar button is grayed out).
- **Edits are tied to the element's place in the artwork's structure.** If the artwork's code changes
  structure (one more block, a different order), that element's edit is **ignored** — it never lands on the
  wrong element. So, before changing the structure of an artwork that has edits, move the edits into the code.
- **Efeitos and Forma** show and edit the main element; "Colar nos selecionados" applies to all of them.
- **Dragging a diamond** moves the whole key at that frame (all channels together). Dropping it on another key
  merges the two (the dragged one wins).
- **"A biblioteca desta arte é antiga"** (this artwork's library is old) in the status = the editor gained new
  features after the artwork was connected. Run `python ligar.py <art.html>` again (from the AFE folder) (it only
  updates the copy of the library).
- When you shorten the duration, keys past the new end still exist (they show outside the ruler).
- **"camada com keyframes: a mudança virou chave no frame N"** (layer with keyframes: the change became a key
  at frame N) = you changed, with Animar off, an element that has keyframes. The change was recorded at the
  cover frame. If that wasn't what you wanted, Ctrl+Z, turn on 🎬 Animar and go to the right frame before
  changing it. (Elements with only an entrance or a continuous effect don't have this problem: the change
  applies to the whole animation.)
- **"⚠ camada passa do fim"** (layer goes past the end) after staggering or delaying = that layer's animation
  no longer fits whole in the video. Increase the **Duração** (timeline bar) or reduce the interval.
- The first one in the Escalonar queue starts at frame 0, which is normal: that's why its bar stays light
  ("no trim").
