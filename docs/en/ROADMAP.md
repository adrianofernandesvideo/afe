# AFE — roadmap

[Português (BR)](../ROTEIRO.md) · **English**

What already exists, the decisions that guide the project and the ideas for later. Update this file when
something here is done (and log it in the [CHANGELOG](CHANGELOG.md)).

## Current state — version 2.4 beta

**Done and tested** (`python testes/teste_rapido.py --video`: 165 checks passing):

- **Open:** any fixed-size `.html` artwork, with pages and automatic refresh on save.
- **Edit:** select (one or many), move (mouse, arrows, snap to center), size, rotation, opacity, hide, text,
  center, reset to original.
- **Transform box with handles:** corners (size), sides (width/height), dot (rotate); the box rotates along;
  added items really change size.
- **Quick bar:** align to the artwork (edges and center), opacity, front/back, hide, lock, reset. Locked layers
  (clicks pass through; Ctrl+click selects); right-click on the artwork and the layer list; Alt + wheel
  cycles through the elements under the mouse.
- **Draggable number fields** (Shift fast, Alt fine); double-click a slider to reset it. When dragging on the
  artwork: Shift locks the axis, Alt moves slowly, Ctrl releases the snap.
- **Effects:** layered glows and shadows, text color, image adjustments, copy/paste effects.
- **Shape:** corners, fill and outline in a color or gradient.
- **Layers:** tree, hide, lock, front/back, delete added items, **blend mode** at the top of the list and on the
  right-click menu.
- **Assets:** shapes, text, images from the artwork's folder and external **libraries** (`--biblioteca`; the
  image is copied into the art when used). `placeholders` folders are left out. **Use as background.** **Grain** (film grain, animated or
  not). **Images from the computer:** drop on the artwork (becomes a layer) or on the Assets tab (Assets gerais).
- **Code components** from a design system (`components/`): an "Escolher peça" (pick a component) window with
  preview and instructions; the component lands in the art as an editable item, with its CSS copied.
- **Animation:** keyframes (with auto-record), ‹ ◇ › next to the fields, keyframe sheet in frames, easing curve
  per key with a graph, copy/paste and multi-select keys, layer timing (appear/disappear, delay) and Stagger,
  10 entrances, 12 continuous effects, cover frame, duration per page.
- **Video:** the page as MP4, with optional motion blur (none/light/normal/strong). Play with **loop** (on/off).
- **Screen:** effects on the left, layers on the right; bottom bar with play in the center; shortcuts as a list.
- **⚙ Config:** the key for each command and the role of Shift/Alt/Ctrl with the mouse, stored in the browser.
- Undo/redo (300 steps); saving keeps the previous version.
- **Distribution:** a release on every push with an executable (Windows, macOS, Linux) and an online demo on GitHub Pages; the `.zip` ships a guide for the user's AI (`AGENTS.md`).
- Portable: a single folder, server with `--raiz`, `ligar.py`, sample artwork, automated test.

## Decisions that guide the project

- **The artwork is never rewritten.** Changes are data in a file next to it (`<art>.edicoes.js`); a library
  inside the art applies them. See ARCHITECTURE.
- **Keys in absolute time.** Moving a layer in time shifts its keys along. See DISCOVERIES.
- **An entrance is a toggleable effect**, not a bundle of keyframes: you can swap, tweak and remove it without
  messing up the keys, and it follows the layer's timing.
- **Side handles:** added items (shapes, images, text, components) really change size; the artwork's own
  elements stretch.
- **The artwork is self-sufficient.** Everything it uses (library images and CSS) is copied into its folder,
  and rendering works offline.
- **No dependencies** in the editor: standard Python on the server, plain JavaScript in the interface.

## Ideas and open items (no dates — contributions welcome)

**Editing**
- Effects and Shape for several selected elements at once (today: the main one + "paste to selected").
- Group layers (move and color them together).
- Align edges between elements and distribute equal spacing; snap to other elements (with a key).
- Handles for several selected elements at once (today only the main one); skew; mirror.
- Zoom and pan the view of the artwork (today it always fits the screen).
- Change the font of added text.
- Name layers from the editor (today: `data-nome` in the art's code).
- Hide the effects that don't apply to the selected element's type.
- Copy/paste effects from the right-click menu.
- Drag an ARTWORK (.html) from the computer into the editor (images already work).
- Export the current frame as PNG.

**Animation**
- ‹ ◇ › keyframe buttons on the effects too (glow, shadows); today only on the Transform tab.
- Entrances: drag the end of the strip in the sheet to change the duration; "convert to keyframes"; text letter
  by letter / word by word; **exits** (before "Some no frame"); pick the entrance's curve.
- An animated thumbnail of each entrance in the menu (like the curves' ball).
- Keyframe sheet: horizontal zoom/scroll for long animations; select keys with a rectangle; Ctrl+X and
  duplicate; drag a channel diamond moving only that channel.
- Per-channel curves (today the curve belongs to the whole key) and a hand-made curve editor (handles).
- Stagger in reverse or random order; show the timing bar on layers inside a group.
- Continuous effects: orbit direction; RGB glitch colors.
- Per-layer motion blur and an approximate preview in the editor.

**Assets and components**
- "New artwork from a template": create a new, already connected `.html` from a whole-artwork component
  (carousel cover, story, thumbnail).
- Drag the component from the window straight onto the artwork; swap the component's colors for the tokens; a
  tab with the tokens.
- Show each asset's description (from a `README.md` in the library folder).
- A demo library in `demos/` (images and a made-up mini design system with `components/`) to show the Assets
  tab and the code components without needing a real brand.
- Background image: choose the framing, darken/blur it, and "background on every page".

**Config and platform**
- Export/import preferences; make the arrows, Esc and the Shift+click in the list and the sheet configurable.
- Check on macOS and Linux (so far it has only been used on Windows).
- **Multi-language editor** (Portuguese and English, to start). Today the interface is in Portuguese, with some
  technical terms in English (Assets, frame, keyframe, glow, Wiggle, Blur). The texts are spread across
  `app/index.html` and the modules in `app/js/`: the way to go is to gather them into one catalog per
  language (e.g. `app/idiomas/pt-BR.js`, `en.js`), replace the hard-coded texts with keys and add the language
  choice to the ⚙ Config screen. The preset names (entrances, continuous effects, curves) are already
  gathered in `presets.js`.
- Keep the English documentation (`docs/en/`) in step with the Portuguese one.

## Known limits

- An edit is tied to the element's position in the artwork's structure: if the structure changes, that
  element's edit is ignored (it never lands on the wrong element). Move edits into the code before
  restructuring.
- Text that the artwork fits by measuring only shows the final fit after saving (the art reloads).
- An "original" background with several images + a gradient outline may lose background sizes/positions.
- Filters with the same function repeated (two `blur`s): the Effects tab edits the first one.
- The artwork needs a fixed size; responsive pages have no "size" for the editor.
- An element the artwork positions with the CSS `translate` property (rare; not to be confused with
  `transform: translate(...)`, which works): moving it or giving it an entrance replaces that `translate`.
- A layer with keyframes edited outside Animate mode: the change becomes a key at the cover frame (the editor
  warns). To choose the frame, turn on Animate.
- The curve and the timing apply to the whole layer; elements inside a group don't inherit the timing in the
  editor (they're invisible because the group is invisible, but their row in the sheet doesn't show that).
