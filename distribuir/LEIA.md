# distribuir/ — releases, executável e demo online

**Português (BR)** · *English summary at the end*

Tudo aqui roda **sozinho no GitHub** (GitHub Actions), a cada push na `main` (vários commits enviados juntos
geram um release só). Ninguém precisa rodar nada no próprio computador para publicar.

| Arquivo | O que faz |
|---|---|
| `../.github/workflows/release.yml` | a cada push: escolhe a próxima versão, gera e testa o executável em Windows, macOS e Linux, cria o release |
| `../.github/workflows/demo-online.yml` | a cada push: monta e publica a demo online no GitHub Pages |
| `empacotar.py` | gera o executável (PyInstaller) e o `.zip` do release, e testa o executável |
| `LEIA-PRIMEIRO.txt` | o "como usar" que vai dentro do `.zip` |
| `montar_site.py` | monta o site da demo online (só arquivos parados) |
| `demo/sw.js` | o "servidor" da demo, dentro do navegador de quem testa |
| `demo/demo.js` | o selo "DEMO ONLINE" (baixar minhas edições · voltar ao original · baixar o AFE) |
| `demo/index.html` | a página de entrada da demo |

## Versões

`<VERSAO do servidor.py>.<número>-beta` — ex.: `2.3.0-beta`, `2.3.1-beta`, `2.3.2-beta`… O número é o maior já
usado + 1, então um release **nunca** sobrescreve outro. Para a próxima versão grande, mude `VERSAO` no
`servidor.py` (ex.: `"2.4"`): os releases recomeçam em `2.4.0-beta`. Quando o AFE sair do beta, deixe
`CANAL: ""` no `release.yml` (as versões perdem o `-beta` e deixam de ser *pre-release*).

Um commit que **não** deve gerar release nem atualizar a demo: ponha `[skip ci]` na mensagem.

## Primeira vez (uma vez só)

1. **Demo online:** o GitHub Pages grátis só funciona em repositório **público**. Enquanto o repositório for
   privado, o workflow da demo pula a publicação (sem erro). Depois de torná-lo público:
   *Settings → Pages → Build and deployment → Source: **GitHub Actions***, e rode o workflow "Demo online" em
   *Actions → Demo online → Run workflow* (ou faça um commit). Endereço: `https://<usuario>.github.io/<repositorio>/`.
2. **Releases:** não precisam de nada. Cada publicação aparece em *Releases*; a demo aparece em *Deployments*.

## Avisos para quem baixa

- O executável não tem assinatura digital: o Windows mostra "O Windows protegeu o computador" (→ *Mais
  informações → Executar assim mesmo*) e o macOS pede *botão direito → Abrir*. Assinar custa (certificado
  pago) — fica como ideia para depois.
- O executável de macOS é para Mac com Apple Silicon (M1 em diante).
- Gerar vídeo pelo executável precisa do Python com Playwright e do ffmpeg no computador.

## Conferir no seu computador (opcional)

```bash
python distribuir/montar_site.py --saida build/site
python -m http.server 8790 -d build/site
```

Abra `http://localhost:8790/`. (O executável só dá para gerar com o PyInstaller instalado:
`python distribuir/empacotar.py --versao 0.0.0-teste --testar`.)

---

**English summary.** Every push to `main` triggers two GitHub Actions workflows: `release.yml` picks the next
free version (`<VERSAO>.<n>-beta`, never overwriting an existing one), builds and tests the executable on
Windows, macOS and Linux with `empacotar.py` (PyInstaller) and publishes a release with the three `.zip` files;
`demo-online.yml` builds the static online demo with `montar_site.py` and deploys it to GitHub Pages (public
repositories only; set *Settings → Pages → Source* to *GitHub Actions* once). In the demo, `demo/sw.js` is a
service worker that plays the server's role inside the browser; edits stay in the visitor's browser. Put
`[skip ci]` in a commit message to skip both.
