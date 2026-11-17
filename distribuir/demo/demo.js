// demo.js — só na demo online (o montar_site.py põe este arquivo no <head> do editor).
// 1. garante que o sw.js (o "servidor" dentro do navegador) está ligado antes de o editor pedir qualquer coisa;
// 2. mostra o selo "DEMO ONLINE" com: baixar minhas edições · voltar ao original · baixar o AFE.
(function () {
  const BASE = location.pathname.replace(/\/editor(\/.*)?$/, '');
  const REPO = '{{REPO}}';                                     // trocado pelo montar_site.py (dono/repositório)
  const sw = navigator.serviceWorker;

  if (!sw) { aoAbrir(() => selo('Este navegador não deixa a demo funcionar (sem service worker). Tente o Chrome, o Edge ou o Firefox fora da janela anônima.')); return; }
  sw.register(BASE + '/sw.js', { scope: BASE + '/' }).catch(() => {});
  if (sw.controller) { try { sessionStorage.removeItem('afe-demo-recarregou'); } catch (e) { /* ok */ } }
  else {                                                       // primeira visita (ou Ctrl+Shift+R): espera o sw.js e recarrega uma vez
    let ja = false;
    try { ja = sessionStorage.getItem('afe-demo-recarregou') === '1'; sessionStorage.setItem('afe-demo-recarregou', '1'); } catch (e) { /* ok */ }
    if (!ja) { sw.ready.then(() => location.reload()); return; }
    aoAbrir(() => selo('O navegador bloqueou a demo (janela anônima ou cookies bloqueados?). Abra numa janela normal.'));
    return;
  }
  aoAbrir(() => selo(null));

  function aoAbrir(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  function selo(problema) {
    const css = document.createElement('style');
    css.textContent = `
      #afeDemo { position:fixed; left:50%; top:9px; transform:translateX(-50%); z-index:99999; font:12px system-ui, sans-serif; color:#e8e8f0; }
      #afeDemo > button { background:#ff4d82; color:#14000a; font-weight:700; letter-spacing:.06em; border-radius:999px; padding:4px 11px; font-size:11px; }
      #afeDemo .afe-demo-caixa { display:none; position:absolute; left:50%; transform:translateX(-50%); top:30px; width:300px; background:#151524;
        border:1px solid #2a2a40; border-radius:10px; padding:12px; box-shadow:0 10px 30px rgba(0,0,0,.5); line-height:1.45; }
      #afeDemo.aberto .afe-demo-caixa { display:block; }
      #afeDemo .afe-demo-caixa p { margin:0 0 10px; color:#c8c8d8; }
      #afeDemo .afe-demo-caixa b { color:#3df5ff; }
      #afeDemo .acoes { display:flex; flex-direction:column; gap:6px; }
      #afeDemo .acoes button, #afeDemo .acoes a { text-align:left; background:#22223a; color:#e8e8f0; border:0; border-radius:6px;
        padding:7px 9px; text-decoration:none; cursor:pointer; font:inherit; }
      #afeDemo .acoes a.forte { background:#3df5ff; color:#06121a; font-weight:600; }`;
    document.head.appendChild(css);
    const el = document.createElement('div');
    el.id = 'afeDemo';
    const baixar = REPO.includes('/') ? `https://github.com/${REPO}/releases` : '#';
    el.innerHTML = `<button type="button" title="sobre a demo online">DEMO ONLINE · beta</button>
      <div class="afe-demo-caixa">${problema ? `<p><b>⚠</b> ${problema}</p>` : `
        <p>Esta é a <b>demo online</b> do AFE. Edite à vontade: ao salvar, as edições ficam <b>só neste navegador</b>
        (nada é enviado). Gerar vídeo e as bibliotecas de assets só funcionam no AFE instalado.</p>`}
        <div class="acoes">
          ${problema ? '' : `<button type="button" data-a="baixar">⬇ Baixar minhas edições (.edicoes.js)</button>
          <button type="button" data-a="limpar">↺ Voltar esta arte ao original</button>`}
          <a class="forte" href="${baixar}" target="_blank" rel="noopener">Baixar o AFE (Windows · macOS · Linux)</a>
        </div></div>`;
    document.body.appendChild(el);
    el.firstElementChild.onclick = () => el.classList.toggle('aberto');
    if (problema) el.classList.add('aberto');
    el.addEventListener('click', async (ev) => {
      const a = ev.target.closest('[data-a]');
      if (!a) return;
      const ed = await arquivoDeEdicoes();
      if (!ed) return alert('Abra uma arte primeiro.');
      const url = new URL(BASE + '/arte/' + ed, location.origin).href;
      if (a.dataset.a === 'baixar') {
        const texto = await (await fetch(url, { cache: 'no-store' })).text();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([texto], { type: 'text/javascript' }));
        link.download = ed.split('/').pop();
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      } else if (confirm('Apagar as edições salvas desta arte neste navegador e voltar ao original?')) {
        await (await caches.open('afe-demo-edicoes')).delete(url);
        location.reload();
      }
    });
  }

  async function arquivoDeEdicoes() {
    const arquivo = new URLSearchParams(location.search).get('arquivo');
    const ind = await (await fetch(BASE + '/demo-indice.json')).json();
    const a = ind.artes.find((x) => x.caminho === arquivo);
    return a && a.edicoes;
  }
})();
