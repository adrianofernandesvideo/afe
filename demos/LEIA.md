# Artes de demonstração

*(English: demo artworks made only with code — an animated post and a 7-page animated carousel about AFE itself.
Open them with the command below and turn on 🎬 Animar. The texts are in Portuguese.)*

Artes feitas só com código (formas, CSS e SVG), sem imagens nem fontes de terceiros. Elas falam do próprio AFE e
servem para ver, na prática, tudo o que ele faz. A animação de cada uma fica no arquivo `.edicoes.js` ao lado — o
código das artes não tem animação nenhuma.

| Arte | O que mostra |
|---|---|
| `artes/afe-post.html` | post 1080×1350: entradas uma depois da outra, efeitos contínuos (glitch, flutuar, pulsar), keyframes de um cursor e motion blur no vídeo |
| `artes/afe-carrossel.html` | carrossel de 7 páginas: cada página mostra a função que descreve (caixa de seleção, Escalonar, motion blur…) |

## Abrir

Dentro da pasta do AFE:

```bash
python servidor.py --raiz demos/artes
```

Abra `http://localhost:8765/editor/`, escolha a arte no campo de cima e ligue o **🎬 Animar**. Use **◀ ▶** para
trocar as páginas do carrossel e **🎞 Gerar vídeo** para exportar a página aberta.

> Mexer à vontade: para voltar ao original, apague o `.edicoes.js` da arte (ou use **↺ Original**). Atenção: o
> arquivo de edições é a própria animação da demonstração — apagado, a arte fica parada.
