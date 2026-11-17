// sw.js — o "servidor" da demo online do AFE (GitHub Pages).
//
// No GitHub Pages não há o servidor.py: só arquivos parados. Este service worker roda dentro do navegador de
// quem abre a demo e responde os pedidos /api/... que o editor faz, imitando o servidor.py:
//   - a lista de artes e de imagens vem de demo-indice.json (montado pelo distribuir/montar_site.py);
//   - "Salvar" grava as edições no próprio navegador (Cache Storage), e o <arte>.edicoes.js que a arte carrega
//     passa a vir de lá. Nada sai do computador da pessoa; outra pessoa abrindo a demo vê a arte original;
//   - vídeo, bibliotecas e peças em código não existem aqui (respondem com um aviso).
// O demo.js (no editor) registra este arquivo e oferece "baixar minhas edições" e "voltar ao original".

const ESCOPO = new URL(self.registration.scope).pathname;          // ex.: /afe/
const CACHE = 'afe-demo-edicoes';
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

async function api(rota, url, pedido) {
  try {
    const ind = await pegarIndice();
    const q = url.searchParams;
    const arte = (caminho) => ind.artes.find((a) => a.caminho === caminho);
    switch (rota) {
      case 'info': return json(200, { versao: ind.versao, pasta: 'demo online', raiz: '', demo: true });
      case 'artes': return json(200, { itens: ind.artes.map(({ caminho, ligada }) => ({ caminho, ligada })) });
      case 'assets': return json(200, { itens: ind.assets[(q.get('pasta') || '').replace(/^\/+|\/+$/g, '')] || [] });
      case 'biblioteca': case 'pecas': return json(200, { bibliotecas: [] });
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
