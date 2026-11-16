# Discoveries

[Português (BR)](../DESCOBERTAS.md) · **English**

What we learned building the editor — the traps and the reason behind each solution. Read this before
"simplifying" something that looks too complicated. Add every new lesson here (in both languages).

## Applying edits to an artwork that isn't ours

- **Move/scale/rotate with the `translate`, `scale` and `rotate` properties** (not `transform`): they add up
  with the `transform` the art already uses (e.g. `translateX(-50%)` for centering) instead of wiping it.
- **Restoring a CSS shorthand to the original is tricky.** `background`, `border` and `border-radius` touch
  several declarations at once; reading `el.style.background` doesn't always give back what was there. The
  library stores **every declaration in the family** (`FAMILIAS`) and puts them back one by one.
- **Only touch what was edited.** A first version reset every property on each apply and wiped the art's own
  styles. Today every property set is remembered (`__ed.postos`) and only that one is restored.
- **Text goes in BEFORE measuring; style goes in AFTER.** Artworks that fit the font by measuring text need to
  measure the already edited text; and `scale`/`translate` change the result of `getBoundingClientRect`, so
  they can't be applied while measuring. Hence `preparar()` and `finalizar()`.
- **Saving typed text without "baking in" styles.** If a word inside a paragraph was moved and then the
  paragraph is edited, the paragraph's `innerHTML` would come with the word's `style` embedded — and undo
  would never clean it. The library strips the inner elements' edits in a **clone** (`htmlSem`) before
  saving; the original text is read the same way.
- **Restore from the outside in.** `limpar()` first restores the texts of the outermost elements (their
  original already brings the inner ones clean) and skips the ones that were replaced along with them.
- **Position in the structure + a check (`sig`).** Identifying the element by its path is simple and doesn't
  require marking up the art; the `sig` (tag.class) avoids applying to the wrong element if the structure
  changes.
- **Added items have their own id (`#n1`).** They used to be identified by their position among the children:
  deleting one meant renumbering the edits of all the following ones.
- **A circle is a radius in %.** `parseFloat('50%')` gives 50 — storing that as 50 px turned the circle into a
  rounded square. The radius is only stored when the user changes it, and it keeps its unit.
- **Gradient outline with rounded corners:** `border-image` ignores `border-radius`. Solution: a transparent
  border + two backgrounds, one clipped to `padding-box` (the fill) and the gradient on `border-box`.
- **The order of `filter` functions changes the result.** The Effects tab reads the filter as an ordered list
  and writes it back in the same order; a new adjustment goes before the shadows.

## Colors and animation

- **The browser returns colors in different formats** (`rgb()`, `rgba()`, `color(srgb …)` for `color-mix`).
  Everything is normalized to `rgba(r, g, b, a)`: only then can you mix two colors and change the alpha
  (flickering the glow).
- **Interpolating CSS strings number by number:** if two values have the same "shape" (the same text between
  the numbers), each number is mixed. It works for shadows, filters and colors without writing a parser for
  each. Different shapes → swap halfway.
- **A perfect loop:** continuous effects only use whole cycles within the duration; noise = a sum of sines with
  phases drawn from a fixed seed (same result in the preview and in the video).
- **Everything on whole frames (30 fps).** Keys at "fractional" instants don't match the video. When showing
  the frame use `floor(t × 30 + 0.01)`: `22/30 × 30` gives `21.999…`.
- **A layer with keyframes: a change becomes a key.** If the change went to the "base" value, the key on top
  would hide it. `doc.mudar` hands the function a disguise (`Proxy`) of the layer and separates what it writes
  to the animatable properties. Changing something that doesn't animate (hide, color) does **not** create a key.
- **Reading the right value:** with keyframes, the value on screen isn't `e.x`. Always `atual(p, c)`.

## The browser and the editor's interface

- **JavaScript modules need the right type from the server.** On Windows, Python may serve `.js` as
  `text/plain` and the browser refuses the module. The server pins the types (`MIMES`).
- **The iframe "swallows" the mouse.** When dragging something from the editor's interface over the art, the
  events stop arriving and the drag gets "stuck". During those drags the art gets `pointer-events: none`
  (class `arrastando`) and every `mousemove` checks whether the button is still pressed.
- **Space and Enter repeat the last button clicked.** After clicking "✕ Chave", pressing space to play would
  delete another key. Focus leaves the buttons right after the click (`campos.js`).
- **Clicking the art doesn't take focus away from an interface field** (the click is cancelled so it doesn't
  select text). The stage removes focus by hand; otherwise the arrows would change the field instead of moving
  the element.
- **Don't depend on the window being visible.** With the window minimized, `requestAnimationFrame` and
  screenshots stop. Messages between modules use microtasks; only "play" uses rAF.
- **Redrawing a panel mid-typing steals the field's focus.** Each change carries its "origin"; the panel that
  caused it doesn't redraw, and the others only redraw if what they show changed.
- **Number fields:** selecting everything on focus (type over it) and accepting the mouse wheel avoided many
  typos ("2445" instead of "45").
- **Screenshots can lag behind** (showing the previous instant). When testing, check the state through code
  (`window.ED`) and take another screenshot.

## Server, files and rendering

- **Paths with accents.** On Windows, a Python script's output isn't UTF-8 by default: a path like
  `Vídeos_ação` reached the next process corrupted (and the video link broke). All scripts force UTF-8 output.
- **Local server security:** another page open in the browser can send requests to `localhost`. Hence:
  checking `Host`/`Origin`, requiring JSON on POST, validating every path (`dentro()`) and only writing the
  edits file the art itself declares.
- **One edits file per artwork** (`<art>.edicoes.js`): with one `edicoes.js` per folder, two artworks in the
  same folder overwrote each other. Older artworks with `edicoes.js` still work — the server writes to the
  file the art's `<script>` points to.
- **The library has to be in the artwork's folder.** Renderers only serve the job's folder; a "central"
  library wouldn't be found. That's why `ligar.py` copies it (and each job keeps the version it used).
- **Synthetic mouse tests** need `buttons: 1` on `mousemove`, or the editor thinks the button was released.
- **A paragraph's margin "leaks" out of the artwork** (margin collapsing) and shifts the root: the measured
  size grows. An artwork should have a fixed-size root and, preferably, `window.CONFIG`.
- **A file name with a timestamp down to the second isn't unique.** The Save backup used `YYYYMMDD-HHMMSS`:
  two saves in the same second shared the name and the second wiped the first. The automated test failed
  "every now and then" because of it — an intermittent failure is almost always a timing race, worth
  investigating instead of just re-running.

## Keyframes: curves and copy/paste (v1.1)

- **The curve lives on the key the segment LEAVES from** (like Blender). One key = one `ease` field; the last
  segment needs nothing. The alternative (incoming + outgoing curve, like After Effects) doubles the controls
  with no gain for light animations.
- **Curves that overshoot (Overshoot, Bounce) break CSS strings.** In `filter`/`box-shadow`, mixing number by
  number with `u > 1` produces negative blur or colors above 255: the browser drops the whole declaration and
  the glow disappears for a few frames. For strings, `u` is clamped between 0 and 1.
- **A new field on the key has to be excluded from the "properties".** `valores()` treats every key field as an
  animated value, except `t` and `ease` (`NAO_E_VALOR`). And an "empty key" is one with no `ANIM_PROPS` — not
  one that "only has `t`".
- **"The dragged one wins" doesn't happen by itself.** When merging two keys on the same frame, their order in
  the list decided who won. Now the order is explicit (dragged ones last).
- **A group of keys while dragging: clamp the offset, not each key.** Clamping each key to 0..end squashes the
  group at the edge; the right thing is to clamp the whole group's `df`.
- **Paste: decide the destination by "how many layers it came from".** From one layer → it goes to the selected
  ones (the "same animation on another element" case). From several → each goes back to its own (the "repeat
  this moment later" case). Trying to guess source→destination pairs is confusing.
- **Ctrl+C/Ctrl+V only become editor shortcuts outside fields and text being edited** — otherwise they break
  normal copy/paste for whoever is typing.
- **The library copy inside the artwork gets old.** The editor uses the art's own EDLIB to show the preview; if
  it's old, the new feature "doesn't work" with no error at all. That's why the library has a revision (2.1)
  and the editor compares it with `LIB_ATUAL` and warns in the status.
- **The right-click menu closes on the window's `blur`:** clicks inside the art's iframe don't reach the
  editor's interface; what does arrive is the loss of focus.

## Layer timing and Stagger (v1.2)

- **Keys in absolute time, not "relative to the layer's start".** With relative time the delay would be a
  single number, but EVERY place that uses a key's time (record, sheet, drag, copy/paste, jump) would have to
  convert — many places to get wrong. With absolute time, only the library gained the rule "outside ini..fim
  it's hidden", and "moving the layer" became an editor operation that shifts start, end and keys together.
  Cost: moving the layer changes several numbers (hence `fotoDe`).
- **Always drag from a snapshot of the start.** Adding each `mousemove`'s step accumulates rounding and "loses"
  what hit the edge. Storing the initial state and applying the total offset at each step is exact and undoes
  correctly.
- **A time with 4 decimals lands AFTER the frame.** Frame 5 is 5/30 = 0.16666… s; stored it becomes 0.1667. In
  the comparison `key.t <= t` the key only took effect on the next frame. The library compares with a 1 ms
  slack (`FOLGA`). This applies to keys and to the layer's start/end.
- **`quadro()` has to take care of whoever STOPPED being animated.** It only looked at animated ones: a layer
  that lost its timing (or all its edits) mid-drag stayed hidden "forever". Now it restores the still value
  of non-animated ones and resets the ones with no edits left.
- **"Animated" includes having its own timing.** A page whose only animation is an element that comes in later
  also renders a video, shows up in the sheet and gets the clapperboard in the layer list.
- **The "normal" value isn't stored** (starts at 0, goes to the end). Good consequence: a clean file. Thing to
  remember: mid-drag the layer may vanish from the document (back to normal) and reappear — the code can't
  keep a reference to its edit, only the path.
- **A row in the sheet for whatever is selected.** Without it there was no way to give timing to a layer with
  no animation yet (it didn't even show in the sheet).
- **The bar takes the whole row: click vs drag.** A click (under 3 px) still moves the playhead; only a drag
  moves the layer. The handles sit OUTSIDE the bar, otherwise a diamond at the start would cover the handle.
- **Reading order = rows first.** Sorting only by "top" shuffles same-row elements of different heights. They
  are grouped by row (close centers) and, within a row, left to right.
- **Frame 0 and the PNG.** With layer timing (and, later, entrance presets) frame 0 may be empty, and the PNG
  showed frame 0. It was left as an open decision ("cover frame") in the roadmap.

## Entrances, cover and drawing the curves (v1.3)

- **Entrance as an effect, not as keyframes.** The plan was for the preset to "generate normal keys".
  Problems: swapping or removing the preset would require knowing which keys were its own; adjusting the
  duration would mean dragging key by key; and — worst of all — editing the position of an element with keys
  outside Animate mode creates a new key without the person noticing. As an effect (`ent`, computed in the
  library), the "resting" position is still a single value: changing it applies to the whole animation. And
  the effect starts at `ini`, so delay and Stagger work without doing anything.
- **The effect has to end at zero.** Every entrance is "how much is left to arrive" (1 → 0). At the end of the
  duration the function simply doesn't touch anything — so there's no jump on the last frame.
- **The starting opacity isn't always 1.** `v.o ?? 1` made an element at 50% opacity in the art finish the
  entrance at 100% and then jump to 50%. The library reads the still opacity once (`base.o`).
- **An empty frame 0.** With entrances, nothing has appeared yet at frame 0. What broke: the PNG (came out
  empty) and normal editing (you couldn't click what was invisible). One solution: the **cover** — the instant
  the art shows when still — defaulting to the end. Outside Animate, the editor stays on the cover.
- **The art opens on the cover, the editor has its own instant.** On load, the editor always redraws at
  `S.tempo` (it used to redraw only if `S.tempo` was different from 0).
- **Graph and ball in code, with the real math.** The library exposes `curva(name, u)`; the editor samples the
  function for the SVG and for the browser animation's frames (`element.animate`). No GIF, no image, and no way
  for the drawing to lie about the curve. The browser animation doesn't use `requestAnimationFrame` in our code
  (golden rule 4).
- **A menu on a footer button opens upward** (`acima: true`); otherwise it covered its own button.
- **Photos of the editor in a hidden browser.** Capturing the app window fails with the window minimized. To
  check the look: Playwright opens the editor (server already running), builds the scene through `window.ED`
  without saving anything and takes the photo. That's how a clipped field in the Animation tab was spotted.

## Asset library (v1.4)

- **The edits file never points outside the artwork's folder.** The brand assets live in one folder, but the
  PNG/video renderer only serves the job's folder. Instead of teaching every renderer to see another folder,
  the editor copies the image into the art when it's used. The art stays "self-contained": you can move its
  folder or send it to another computer.
- **Copy without breaking things:** if a file with the same name and different content already exists (the
  library changed later), the new copy gets a suffix; the old one, which some page may be using, stays.
- **Whatever is project-specific stays OUTSIDE the editor.** The brand folder comes in through a server
  parameter (`--biblioteca`), set by whoever starts the editor. There are no project paths inside
  the AFE folder.
- **"Remove the placeholders" = don't show them, don't delete them.** Temporary images are often referenced by
  artwork templates. Hiding the `placeholders` folder takes them off the panel without breaking anything.
- **A test that reads the response as text breaks on images.** The test helper decoded everything as UTF-8;
  for routes that return an image, only the status code matters.

## Background image (v1.5)

- **You can't put the new item "at the start" of the art.** Edit paths are each element's position among its
  siblings: inserting something before would shift them all and the edits would land on the wrong elements.
  A new item always goes at the end; "behind everything" is solved with `z-index: -1`.
- **`z-index: -1` needs `isolation: isolate` on the root.** Without its own "stacking world", the -1 goes behind
  the root's own background and the image disappears. The library turns isolation on only while there's a
  background image and restores the original value afterwards.
- **Artworks often have the background as an element** (a drawn `<canvas>`, a block of color) — and it sits in
  front of the -1. That's why "use as background" hides the art's background layers in the same action and
  remembers which ones (`escondeu`), to restore them on delete. The rule to recognize them is conservative:
  the FIRST children of the root that cover the whole artwork and have nothing inside; it stops at the first
  one with content (a block that wraps the whole artwork is never hidden).
- **The background doesn't take clicks.** If it did, clicking the "empty" part of the art would select (and
  drag) the background instead of clearing the selection. It's selected from the layer list — like a drawn
  background.
- **The layer list follows the HTML order; the background image is the exception.** It's the last element but
  shows behind everything: the list puts it at the end.

## Inline text, draggable fields (v1.6)

- **The browser ignores move/scale/rotate on "inline" elements.** `translate`, `scale` and `rotate` have no
  effect on a plain `<span>` — with no error at all: the style is stored and nothing happens. Color, shadow and
  opacity work, which hides the problem. The library switches to `inline-block` only when the edit asks for
  movement (or the layer is animated) and restores the original afterwards. Measured: the text doesn't move.
- **Careful when measuring an inline element:** its box (`getBoundingClientRect`) changes height when it
  becomes `inline-block`, but the text doesn't move. To check the TEXT's position, measure a `Range` of the
  content.
- **"The same thing twice" is almost always a wrapper.** An element that only contains another with the same
  text is, for the user, one thing. The list shows the inner one (the one a click selects); the outer one only
  shows if it has edits or is selected — it never becomes unreachable.
- **Dragging inside a field: focus is the problem.** With a normal click, the browser starts selecting the
  field's text and that selection GIVES focus BACK to it mid-drag (`blur()` doesn't hold). The fix: cancel the
  `mousedown` and give focus by hand only when it was a simple click. The field's spinner arrows are exempt
  from this rule (the right-most 18 px).
- **Add up little by little, don't multiply the total.** With Shift/Alt changing the speed mid-drag,
  `total × factor` jumps the moment the key is pressed. Adding `step × factor` on each movement doesn't.
- **Test from the outside while someone is using the screen.** The editor tab in the app may have unsaved work:
  always investigate and take photos in a hidden browser (Playwright), never in that tab.

## Transform box (v1.7)

- **The browser scales around the center; people expect the opposite side to stay put.** So every handle
  changes two things: the scale and the position (x, y), so the fixed point doesn't move. The math is done in
  the element's own axes (the mouse is "un-rotated" first), so it works with rotation.
- **Stretching ≠ resizing.** Changing the real width of an element of the art reflows its layout (and the art
  often measures its texts by itself): unpredictable. The artwork's elements only **stretch** (`sx`, `sy`).
  Items added by the editor have no layout to preserve: they really change size.
- **Preview on the element, save on release.** Changing an item's real size through the document would rebuild
  the art (and reload images) on every mouse move. During the drag the style is changed straight on the
  element; on release, a single save. It's the only exception to the rule "everything goes through the doc",
  along with the text being edited.
- **The rotated box can't be measured, it has to be computed.** The browser only returns the straight
  rectangle around the rotated element. That rectangle's center is the true center; the size comes from
  `offsetWidth × the edits' scale`. Rotation given by the art itself (CSS) isn't included: the box stays
  straight.
- **A repeated class name hides things elsewhere.** The new handles used `.alca`, which the layer bar in the
  sheet already used: the new ones' `display:none` made the old ones vanish. The test caught it. Styles for a
  new piece always with the parent in front (`#caixaSel .alca`).
- **A version number in two places.** The library's header comment said 2.6 and the constant 2.5: the editor
  warned "old library" for the new library itself. When bumping the revision, check both and `LIB_ATUAL`.

## Quick bar, locking and what's under the mouse (v1.8)

- **One function for "what the mouse grabs".** The click, the hover outline, Alt + wheel and the right-click
  all ask the same thing: `sobOPonto(x, y)` — the stack of elements at that point, front to back, already
  without the ones that can't be selected and without the locked ones. The click used to look only at the
  front element; with locking that wasn't enough.
- **Locking = leaving the mouse's stack, nothing more.** It doesn't block editing from the panels or the list.
  It's enough for the real problem ("I keep selecting the background by accident") and doesn't create a state
  where the person can no longer change the layer.
- **The same action in three places calls for its own module.** Front/back, hide and lock were (or would be)
  repeated in the layer list, the bar and the menus: they went to `camada-acoes.js`.
- **A menu opened by a click inside the art:** the editor's interface doesn't see the following clicks on the
  art (they belong to another document). The stage tells the menu to close on every `mousedown` on the art.
- **Shift + wheel may arrive as a horizontal scroll** (`deltaX`, with `deltaY` at zero). Whoever only looks at
  `deltaY` always sees "down". Use `deltaY || deltaX`.
- **A test that depends on where things are breaks when another test moves things.** The Alt + wheel check
  assumed two elements under the mouse; an earlier test had left a third one on top. The check now asks the
  editor for the stack and verifies the order.

## Config: shortcuts and mouse keys (v1.9)

- **Configurable shortcuts call for a table, not `if`s.** The shortcuts were a chain of `if (key === ...)`. For
  people to change the key, each command has to exist as data (name, default key, when it applies, what it
  does). As a bonus the Config screen builds itself from the table.
- **Store only the difference from the default.** That way, when a new version changes a default or adds a
  command, whoever never changed anything gets the update; and "back to default" is just deleting the entry.
- **A command that "doesn't apply right now" lets the key through.** Ctrl+C is only "copy keys" if there's a
  key to copy; otherwise the browser copies the text normally. Each command's `quando` decides.
- **A single letter as a shortcut needs care for whoever is typing:** it doesn't work in fields or while an
  artwork's text is being edited (only commands marked `emCampo` / `emTexto`, like Save and Undo).
- **A repeated key:** between commands, the one that already used the key is left without a shortcut (and the
  screen says which); between mouse keys in the same block, the two swap places — there, a role can never be
  left without a key.
- **Closing with Esc without "leaking".** The Esc that closes Config also reached the editor's shortcuts and
  cleared the selection. Whoever handles the key first has to stop propagation.
- **Photos in a fresh browser context:** preferences live in `localStorage`; photos and tests that change them
  must undo it at the end (or use their own context) so as not to contaminate the rest.

## Design system components (v2.0)

- **A "component" isn't a file: it's a piece of a preview.** Each `preview.html` shows several things at once
  (5 badges in a row; a panel inside a scene with a background and decorations). There's no guessing the right
  piece — the person chooses: clicks what they want and goes up a level through the trail.
- **What belongs to the brand and what is just layout:** the classes defined in the preview's own `<style>`
  (`.row`, `.col`) are layout; the others come from the brand's CSS. This rule doesn't depend on any project's
  class prefix.
- **The piece comes out of the rendered DOM, not out of the file.** Components built by a script (charts,
  drawn lines) become static HTML in the art — without bringing the script along.
- **What the component inherited disappears when it moves house.** Font and color came from the preview's
  `<body>`. The editor notes what the piece inherited (`contexto`) and the library puts it back on the
  component's block.
- **New CSS goes at the start of `<head>`.** At the end, the brand's CSS would override what the art adjusted
  (same specificity, comes later = wins). At the start, the art stays in charge.
- **`@import` of internet fonts doesn't go into the art.** Rendering runs offline: an `@import` that doesn't
  answer delays or changes the result. In the preview inside the editor the fonts load normally (that's how
  the design system works); in the art's copy, the line is removed.
- **Live thumbnails, but lazy ones.** Each thumbnail is the preview itself in a shrunk `<iframe>`. The groups
  start closed and the iframes are `loading="lazy"`: they only load when the group opens. They live in a block
  separate from the image list, which is rebuilt on every keystroke in the search (it would reload everything).
- **Text with `text-transform` fools the test:** `innerText` returns in uppercase what the CSS shows in
  uppercase. To check the real text, `textContent`.
- **A child of `display:flex` becomes a block.** A `<span>` inside a flex row has a computed `display` of
  `block`, not `inline`: the component gets a fixed width. That's expected.

## Picking a piece in a preview (v2.0.1)

- **"Class mentioned in the preview's `<style>`" doesn't mean "class only from the preview".** Previews adjust
  brand classes (`.ds-line{filter:none}`). To know whose class it is, read the brand's .css files
  (`document.styleSheets` with an `href`, going into `@import` and `@media`).
- **An `outline` on the element itself disappears with `clip-path` and `mask`.** The selection highlight has to
  be a separate box on top; as a bonus it doesn't pollute the classes of the element that will be copied.
- **The brand's `pointer-events:none` hides the piece from the mouse.** In a picking preview, force
  `pointer-events:auto` on everything (except the highlight box).
- **Sweep every component, not just the sample ones.** A script that clicks the center of every element of
  every preview found, in minutes, four whole components with nothing selectable.

## Motion blur (v2.2)

- **Camera blur = the average of photos within the frame.** For each frame, N photos at instants spread across
  the shutter opening; ffmpeg mixes them: `tmix=frames=N,select='eq(mod(n\,N)\,N-1)',setpts=N/(FPS*TB)`, with
  the input at FPS×N. The `select` keeps the last photo of each group — the only one whose average includes the
  whole group.
- **Photos proportional to the opening** (4/8/12): the spacing between photos stays similar, and the trail
  comes out smooth instead of as "copies" of the element.
- **The shutter opens at the frame's instant** (not centered): it never asks for a negative instant or goes
  past the end, so it doesn't mix the end of the animation into the start.
- **Check with an artwork that moves.** The sample artwork has no animation: the blur only shows on a copy with
  fast motion (slide, rotate, bounce).
