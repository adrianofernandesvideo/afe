# How to contribute

[Português (BR)](CONTRIBUINDO.md) · **English**

Thanks for wanting to improve AFE! Usage reports, ideas and fixes all help.

> The code and its comments are in **Portuguese**; the documentation exists in both languages ([docs/en/](docs/en/)
> for English). Contributions in English are welcome — issues and pull requests can be written in English or
> Portuguese.

## Before you start

1. Read [SETUP](docs/en/SETUP.md) (how to open the editor) and [ARCHITECTURE](docs/en/ARCHITECTURE.md) (how the
   code is organized). [DISCOVERIES](docs/en/DISCOVERIES.md) explains the decisions that look odd — worth
   reading before "fixing" something.
2. Open ideas are listed in the [ROADMAP](docs/en/ROADMAP.md), under *Ideas and open items*.

## When you change the code

- **Run the automated test** before proposing the change:

  ```bash
  python testes/teste_rapido.py          # ~1 minute
  python testes/teste_rapido.py --video  # also renders a video (needs ffmpeg)
  ```

  It drives the real editor in a hidden browser, in a temporary folder (it doesn't touch your files).
  A new feature needs a new check in the test.
- **Log it in the CHANGELOG** in plain language; if you learned something non-obvious, add it to DISCOVERIES.
- **Docs come in two languages:** when you change a document, update both versions (`docs/` in Portuguese,
  `docs/en/` in English). If you can only write one, say so in the pull request and someone will translate it.
- **Changed the artwork library** (`arte/edicoes-lib.js`)? Bump its revision in three places: the header
  comment, `const VERSAO`, and `LIB_ATUAL` in `app/js/arte.js`. Copy the file to `exemplo/` as well.

## Releases and the online demo (automatic)

Every push to `main` creates a **new release** with the executable for Windows, macOS and Linux, and updates
the **online demo** (GitHub Pages). To skip both for a commit, put `[skip ci]` in its message. The base version
is `VERSAO` in `servidor.py`: change it to `2.4` and releases restart at `2.4.0-beta`. Details in
[distribuir/LEIA.md](distribuir/LEIA.md).

## Conventions

- No dependencies: the server uses only Python's standard library, and the interface is plain JavaScript
  (ES modules) with no build step.
- Names and comments in Portuguese; a comment at the top of each file saying what it does.
- Short functions; styling only in `app/editor.css`; interface text in plain language.
- The editor is project-independent: no paths, names or brands from a specific project inside this folder —
  each project's specifics come in through the server's parameters (`--raiz`, `--biblioteca`).

## License of contributions

The project is AGPL-3.0 ([LICENSE](LICENSE)). By sending a contribution, you agree that it is released under
the same license.

## Reporting a problem

Tell us your system (Windows, macOS, Linux), Python and browser versions, what you did, what you expected and
what happened. If you can, attach a minimal artwork that shows the problem and the browser console message
(F12).
