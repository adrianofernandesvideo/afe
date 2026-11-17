// api.js — conversa com o servidor.py. Só este arquivo conhece os endereços /api/... e /arte/...
// BASE: o começo do endereço antes de /editor/. No servidor.py é vazio; na demo online (GitHub Pages) é o nome do
// repositório (ex.: /afe), e lá quem responde os /api/... é o distribuir/demo/sw.js, dentro do navegador.
export const BASE = location.pathname.replace(/\/editor(\/.*)?$/, '');

async function pedir(url, corpo) {
  const r = await fetch(url, corpo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) }
    : { cache: 'no-store' });
  let j = null;
  try { j = await r.json(); } catch (e) { /* resposta sem JSON */ }
  if (!r.ok || !j) throw new Error((j && j.erro) || 'erro ' + r.status);
  return j;
}

export const api = {
  info: () => pedir(BASE + '/api/info'),
  artes: () => pedir(BASE + '/api/artes'),                                           // { itens: [{caminho, ligada}] }
  assets: (pasta) => pedir(BASE + '/api/assets?pasta=' + encodeURIComponent(pasta)), // { itens: [caminho dentro da pasta] }
  biblioteca: () => pedir(BASE + '/api/biblioteca'),                                 // { bibliotecas: [{nome, pasta, itens}] }
  // copia uma imagem da biblioteca para a pasta da arte → { src } (caminho a partir da pasta da arte)
  usarAsset: (arquivo, biblioteca, asset) => pedir(BASE + '/api/usar-asset', { arquivo, biblioteca, asset }),
  pecas: () => pedir(BASE + '/api/pecas'),                                           // { bibliotecas: [{nome, pasta, css, pecas}] }
  // prepara a arte para uma peça: copia o CSS da marca e as imagens dela → { css: [...], imagens: {pedida: caminho} }
  usarPeca: (arquivo, biblioteca, imagens) => pedir(BASE + '/api/usar-peca', { arquivo, biblioteca, imagens }),
  marcas: (arquivo) => pedir(BASE + '/api/marcas?arquivo=' + encodeURIComponent(arquivo)),   // { marca } muda se o arquivo mudar
  // imagem do computador: destino 'arte' → { src } (a partir da pasta da arte) · 'geral' → { biblioteca, asset }
  importar: (arquivo, destino, nome, dados) => pedir(BASE + '/api/importar', { arquivo, destino, nome, dados }),
  salvar: (arquivo, edicoes) => pedir(BASE + '/api/salvar', { arquivo, edicoes }),
  video: (arquivo, pagina) => pedir(BASE + '/api/video', { arquivo, pagina }),      // { id }
  videoStatus: (id) => pedir(BASE + '/api/video-status?id=' + encodeURIComponent(id)),
};

// endereço de um arquivo da pasta das artes (a arte, uma imagem, um vídeo gerado)
export const urlArte = (rel) => BASE + '/arte/' + rel.split('/').map(encodeURIComponent).join('/');
// endereço de um arquivo do design system de uma biblioteca (a prévia de uma peça, o README dela...)
export const urlDs = (nome, rel) => BASE + '/ds/' + encodeURIComponent(nome) + '/' + rel.split('/').map(encodeURIComponent).join('/');
// endereço de uma imagem de uma biblioteca de assets (miniatura)
export const urlBiblioteca = (nome, rel) => BASE + '/bib/' + encodeURIComponent(nome) + '/' + rel.split('/').map(encodeURIComponent).join('/');
