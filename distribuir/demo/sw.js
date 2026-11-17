// sw.js — o "servidor" da demo online do AFE (GitHub Pages).
//
// No GitHub Pages não há o servidor.py: só arquivos parados. Este service worker roda dentro do navegador de
// quem abre a demo e responde os pedidos /api/... que o editor faz, imitando o servidor.py:
//   - a lista de artes e de imagens vem de demo-indice.json (montado pelo distribuir/montar_site.py);
//   - "Salvar" grava as edições no próprio navegador (Cache Storage), e o <arte>.edicoes.js que a arte carrega
//     passa a vir de lá. Nada sai do computador da pessoa; outra pessoa abrindo a demo vê a arte original;
//   - imagens trazidas do computador também ficam no navegador (Cache Storage "afe-demo-arquivos"): as da arte em
//     arte/<pasta>/assets/importadas/, as de "Assets gerais" em bib/Assets gerais/ (a lista delas em __gerais.json);
//   - vídeo e peças em código não existem aqui (respondem com um aviso).
// O demo.js (no editor) registra este arquivo e oferece "baixar minhas edições" e "voltar ao original".

const ESCOPO = new URL(self.registration.scope).pathname;          // ex.: /afe/
const CACHE = 'afe-demo-edicoes';
const ARQUIVOS = 'afe-demo-arquivos';                             // imagens trazidas do computador
const GERAIS = 'Assets gerais';
const IMAGENS = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' };
let indice = null;

async function pegarIndice() {
  if (!indice) indice = await (await fetch(ESCOPO + 'demo-indice.json', { cache: 'no-cache' })).json();
  return indice;
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (ev) => ev.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(ESCOPO)) return;
  const rota = url.pathname.slice(ESCOPO.length);                    // 'api/info', 'arte/x.edicoes.js'...
  if (rota.startsWith('api/')) ev.respondWith(api(rota.slice(4), url, ev.request));
  else if (rota.startsWith('arte/') && rota.endsWith('edicoes.js')) ev.respondWith(edicoes(ev.request, url));
  else if (rota.startsWith('arte/') || rota.startsWith('bib/')) ev.respondWith(arquivo(ev.request, url));
});

const json = (codigo, dados) => new Response(JSON.stringify(dados), {
  status: codigo, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const NAO_TEM = 'não disponível na demo online — baixe o AFE (página de Releases do GitHub) para usar no seu computador';
// endereço do arquivo de edições de uma arte, escrito do mesmo jeito que o navegador escreve o do pedido
const chave = (edicoes) => new URL(ESCOPO + 'arte/' + edicoes, location.origin).href;

// o <arte>.edicoes.js: o salvo neste navegador, se houver; senão o original do site.
// Sempre com "no-store": sem isso o navegador guarda o <script> na memória e, ao recarregar a arte depois de
// salvar, reaproveita a versão velha sem nem perguntar a este arquivo (o servidor.py faz o mesmo).
async function edicoes(pedido, url) {
  const salvo = await (await caches.open(CACHE)).match(url.origin + url.pathname);
  const r = salvo || await fetch(url.origin + url.pathname, { cache: 'no-store' });
  return new Response(await r.text(), { status: r.status, headers: {
    'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' } });
}

// uma imagem trazida do computador (se houver), senão o arquivo do site
async function arquivo(pedido, url) {
  const salvo = await (await caches.open(ARQUIVOS)).match(url.origin + url.pathname);
  return salvo || fetch(pedido);
}
const endereco = (rel) => new URL(ESCOPO + rel, location.origin).href;
const pastaDe = (caminho) => caminho.replace(/[^/]*$/, '');
const limpo = (nome) => (nome.replace(/\.[^.]*$/, '').replace(/[^\w.-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60) || 'imagem');
async function gravar(rel, dados, tipo) {                // nunca troca um que já existe: põe -2, -3... no nome
  const c = await caches.open(ARQUIVOS);
  const m = rel.match(/^(.*?)(\.[^.]*)$/);
  let final = rel;
  for (let n = 2; await c.match(endereco(final)); n++) final = m[1] + '-' + n + m[2];
  await c.put(endereco(final), new Response(dados, { headers: { 'Content-Type': tipo } }));
  return final;
}
async function gerais() {
  const r = await (await caches.open(ARQUIVOS)).match(endereco('__gerais.json'));
  return r ? r.json() : [];
}
async function importadasDa(pasta) {                    // imagens trazidas para a pasta desta arte
  const chaves = await (await caches.open(ARQUIVOS)).keys(), base = endereco('arte/' + pasta);
  return chaves.map((k) => decodeURIComponent(k.url)).filter((u) => u.startsWith(decodeURIComponent(base)))
    .map((u) => u.slice(decodeURIComponent(base).length)).filter((u) => !u.startsWith('assets/biblioteca/'));
}

async function api(rota, url, pedido) {
  try {
    const ind = await pegarIndice();
    const q = url.searchParams;
    const arte = (caminho) => ind.artes.find((a) => a.caminho === caminho);
    switch (rota) {
      case 'info': return json(200, { versao: ind.versao, pasta: 'demo online', raiz: '', demo: true });
      case 'artes': return json(200, { itens: ind.artes.map(({ caminho, ligada }) => ({ caminho, ligada })) });
      case 'assets': {
        const pasta = (q.get('pasta') || '').replace(/^\/+|\/+$/g, '');
        const extra = await importadasDa(pasta ? pasta + '/' : '');
        return json(200, { itens: [...(ind.assets[pasta] || []), ...extra] });
      }
      case 'biblioteca': return json(200, { bibliotecas: [{ nome: GERAIS, pasta: 'assets-gerais', itens: await gerais() }] });
      case 'pecas': return json(200, { bibliotecas: [] });
      case 'importar': {
        const p = await pedido.json(), a = arte(p.arquivo);
        const ext = String(p.nome || '').split('.').pop().toLowerCase();
        if (!a) return json(404, { erro: 'arte nao encontrada' });
        if (!IMAGENS[ext]) return json(400, { erro: 'so imagens PNG, JPG, WebP, GIF ou AVIF' });
        const dados = Uint8Array.from(atob(p.dados || ''), (c) => c.charCodeAt(0));
        const nome = limpo(String(p.nome)) + '.' + ext;
        if (p.destino === 'geral') {
          const rel = await gravar('bib/' + GERAIS + '/' + nome, dados, IMAGENS[ext]);
          const asset = rel.slice(('bib/' + GERAIS + '/').length), lista = await gerais();
          if (!lista.includes(asset)) lista.push(asset);
          await (await caches.open(ARQUIVOS)).put(endereco('__gerais.json'), json(200, lista));
          return json(200, { ok: true, biblioteca: GERAIS, asset });
        }
        const base = 'arte/' + pastaDe(a.caminho);
        const rel = await gravar(base + 'assets/importadas/' + nome, dados, IMAGENS[ext]);
        return json(200, { ok: true, src: rel.slice(base.length) });
      }
      case 'usar-asset': {                                // copia a imagem de Assets gerais para a pasta da arte
        const p = await pedido.json(), a = arte(p.arquivo);
        if (!a || p.biblioteca !== GERAIS) return json(404, { erro: 'arte ou asset nao encontrado' });
        const c = await caches.open(ARQUIVOS), r = await c.match(endereco('bib/' + GERAIS + '/' + p.asset));
        if (!r) return json(404, { erro: 'asset nao encontrado' });
        const base = 'arte/' + pastaDe(a.caminho), destino = base + 'assets/biblioteca/assets-gerais/' + p.asset;
        if (!(await c.match(endereco(destino)))) await c.put(endereco(destino), r);
        return json(200, { ok: true, src: destino.slice(base.length) });
      }
      case 'marcas': return arte(q.get('arquivo')) ? json(200, { marca: 'demo' }) : json(404, { erro: 'arte nao encontrada' });
      case 'salvar': {
        const p = await pedido.json();
        const a = arte(p.arquivo);
        if (!a || !a.edicoes) return json(404, { erro: 'arte nao encontrada' });
        if (!p.edicoes || typeof p.edicoes !== 'object') return json(400, { erro: 'formato invalido' });
        const texto = '// Edicoes feitas a mao no AFE (demo online). Gerado automaticamente: nao edite por aqui.\n'
          + 'window.EDICOES = ' + JSON.stringify(p.edicoes, null, 1) + ';\n';
        await (await caches.open(CACHE)).put(chave(a.edicoes), new Response(texto, {
          headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' } }));
        return json(200, { ok: true });
      }
      case 'video': case 'video-status':
        return json(501, { erro: 'gerar vídeo ' + NAO_TEM });
      default:
        return json(501, { erro: NAO_TEM });
    }
  } catch (e) {
    return json(500, { erro: String(e && e.message || e) });
  }
}
