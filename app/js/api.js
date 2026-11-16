// api.js — conversa com o servidor.py. Só este arquivo conhece os endereços /api/... e /arte/...

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
  info: () => pedir('/api/info'),
  artes: () => pedir('/api/artes'),                                           // { itens: [{caminho, ligada}] }
  assets: (pasta) => pedir('/api/assets?pasta=' + encodeURIComponent(pasta)), // { itens: [caminho dentro da pasta] }
  biblioteca: () => pedir('/api/biblioteca'),                                 // { bibliotecas: [{nome, pasta, itens}] }
  // copia uma imagem da biblioteca para a pasta da arte → { src } (caminho a partir da pasta da arte)
  usarAsset: (arquivo, biblioteca, asset) => pedir('/api/usar-asset', { arquivo, biblioteca, asset }),
  pecas: () => pedir('/api/pecas'),                                           // { bibliotecas: [{nome, pasta, css, pecas}] }
  // prepara a arte para uma peça: copia o CSS da marca e as imagens dela → { css: [...], imagens: {pedida: caminho} }
  usarPeca: (arquivo, biblioteca, imagens) => pedir('/api/usar-peca', { arquivo, biblioteca, imagens }),
  marcas: (arquivo) => pedir('/api/marcas?arquivo=' + encodeURIComponent(arquivo)),   // { marca } muda se o arquivo mudar
  salvar: (arquivo, edicoes) => pedir('/api/salvar', { arquivo, edicoes }),
  video: (arquivo, pagina) => pedir('/api/video', { arquivo, pagina }),      // { id }
  videoStatus: (id) => pedir('/api/video-status?id=' + encodeURIComponent(id)),
};

// endereço de um arquivo da pasta das artes (a arte, uma imagem, um vídeo gerado)
export const urlArte = (rel) => '/arte/' + rel.split('/').map(encodeURIComponent).join('/');
// endereço de um arquivo do design system de uma biblioteca (a prévia de uma peça, o README dela...)
export const urlDs = (nome, rel) => '/ds/' + encodeURIComponent(nome) + '/' + rel.split('/').map(encodeURIComponent).join('/');
// endereço de uma imagem de uma biblioteca de assets (miniatura)
export const urlBiblioteca = (nome, rel) => '/bib/' + encodeURIComponent(nome) + '/' + rel.split('/').map(encodeURIComponent).join('/');
