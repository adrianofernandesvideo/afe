// arte.js — a arte dentro do iframe: carregar, medir, encaixar na tela, achar elementos, dar nome às camadas
// e vigiar o disco (se o arquivo mudar, recarrega). Não conhece edições nem seleção: quem cuida disso
// se pendura em "aoCarregar" (roda quando a arte termina de carregar, antes do recado 'arte').
import { S, $, avisar, status, aviso, statusPadrao, espera } from './base.js';
import { api, urlArte } from './api.js';

export const aoCarregar = [];
// versão da arte/edicoes-lib.js que acompanha este editor. Arte com cópia mais antiga continua abrindo,
// mas as funções novas não aparecem nela: o editor avisa para rodar o ligar.py (ele atualiza a cópia).
export const LIB_ATUAL = 2.91;
let carregando = false, marca = null, cargas = 0;
const quadro = $('quadro');

const NAO_VISUAL = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'TITLE', 'BASE']);
// classes que só posicionam: não servem de nome para a camada
const GENERICAS = new Set(['abs', 'rel', 'centro', 'topo', 'base', 'fit', 'sombra', 'grande', 'row', 'col', 'flex', 'grid', 'box', 'wrap', 'container']);

// ── elementos da arte ──
export const achar = (c) => (S.lib && c ? S.lib.achar(c) : null);
export const caminho = (el) => (S.lib && el ? S.lib.caminho(el) : null);
export const raiz = () => (S.lib ? S.lib.raiz() : null);
export const visual = (el) => !!el && !NAO_VISUAL.has(el.tagName);
// item acrescentado pelo usuário (asset, forma, texto)?
export const eNovo = (el) => !!(el && el.dataset && el.dataset.edId && el.parentElement === raiz());

// nome amigável de um elemento (lista de camadas, folha de keyframes, aba Transformar)
export function nomeDe(el) {
  const arq = (src) => { const s = (src || '').split('/').pop().split('?')[0]; try { return decodeURIComponent(s); } catch (e) { return s; } };
  const curto = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
  const t = (el.textContent || '').trim().replace(/\s+/g, ' ');
  if (eNovo(el) && el.dataset.edGrao) return '★ granulado';
  if (eNovo(el)) return '★ ' + (el.dataset.edFundo ? 'fundo · ' : '') + (el.dataset.edPeca ? el.dataset.edPeca + ' ' : '') + (el.tagName === 'IMG' ? arq(el.getAttribute('src')) : t ? `“${curto(t, 24)}”` : 'forma');
  if (el.dataset && el.dataset.nome) return el.dataset.nome;            // a arte pode dar o nome: data-nome="Título"
  if (el.tagName === 'CANVAS') return 'fundo (desenho)';
  if (el.tagName === 'IMG') return 'imagem ' + arq(el.getAttribute('src')).replace(/\.\w+$/, '');
  const util = [...el.classList].find((c) => !GENERICAS.has(c));
  let nome = el.id || (util ? util.replace(/^[a-z]{1,3}-(?=.)/, '') : null);   // "ui-badge" -> "badge"
  if (!nome) nome = t ? 'bloco' : el.querySelector('img') ? 'grupo de imagens' : el.tagName === 'DIV' ? 'bloco vazio' : el.tagName.toLowerCase();
  return t ? `${nome} “${curto(t, 28)}”` : nome;
}

// ── carregar ──
export function recarregar() {
  if (!S.arquivo) return;
  carregando = true; marca = null; cargas++;               // nova carga: o "carimbo" do disco recomeça do zero
  status('carregando…');
  quadro.src = urlArte(S.arquivo) + '?pagina=' + S.pagina + '&v=' + Date.now();
  history.replaceState(null, '', '?arquivo=' + encodeURIComponent(S.arquivo) + '&pagina=' + S.pagina);
  try { localStorage.setItem('afe:ultima', S.arquivo); } catch (e) { /* sem armazenamento: tudo bem */ }
}

quadro.addEventListener('load', async () => {
  if (!S.arquivo || !quadro.getAttribute('src')) return;
  const w = quadro.contentWindow, d = w.document;
  // a arte avisa que terminou de montar com <body data-pronto="1"> (espera até 5 s)
  for (let i = 0; i < 100 && d.body && d.body.dataset.pronto !== '1'; i++) await espera(50);
  if (quadro.contentWindow.document !== d) return;                       // outra carga já começou
  S.w = w; S.d = d;
  S.lib = w.EDLIB && w.EDLIB.versao >= 2 ? w.EDLIB : null;
  let larg = 0, alt = 0, total = null;
  try {
    if (S.lib) ({ largura: larg, altura: alt, paginas: total } = S.lib.info());
    else {                                                                // arte não ligada: só dá para ver
      const r = (d.getElementById('post') || d.body).getBoundingClientRect();
      larg = Math.round(r.width); alt = Math.round(r.height);
      total = (w.CONFIG && w.CONFIG.paginas) || w.eval('typeof TOTAL === "number" ? TOTAL : null');
    }
  } catch (e) { /* fica com o tamanho padrão */ }
  S.larg = larg || 1080; S.alt = alt || 1350; S.total = total || null;
  encaixar();
  for (const fn of aoCarregar) fn();
  resolverSelecao();
  carregando = false;
  if (S.lib && S.lib.versao < LIB_ATUAL) status('a biblioteca desta arte é antiga — rode o ligar.py nela (funções novas não aparecem)', 'sujo');
  else if (S.lib) statusPadrao();
  else if (w.EDLIB) status('arte ligada com uma versão antiga — rode o ligar.py nela', 'sujo');
  else if (/Error response|404/.test(d.title || '')) status('arte não encontrada: ' + S.arquivo, 'erro');
  else status('só visualizando — esta arte ainda não está ligada ao editor', '');
  avisar('arte');
});

// ── encaixar a arte no espaço do meio ──
export function encaixar() {
  const m = document.querySelector('main').getBoundingClientRect();
  S.escala = Math.max(0.05, Math.min((m.width - 20) / S.larg, (m.height - 20) / S.alt));
  quadro.style.width = S.larg + 'px'; quadro.style.height = S.alt + 'px';
  quadro.style.transform = 'scale(' + S.escala + ')';
  const mo = $('moldura');
  mo.style.width = S.larg * S.escala + 'px'; mo.style.height = S.alt * S.escala + 'px';
  avisar('layout');
}
addEventListener('resize', encaixar);

// depois de recarregar ou refazer a arte, os elementos são outros: reencontra a seleção pelos caminhos
export function resolverSelecao() {
  S.selPaths = S.selPaths.filter((c) => achar(c));
  if (!S.selPaths.includes(S.selCaminho)) S.selCaminho = S.selPaths[S.selPaths.length - 1] || null;
  S.sel = S.selCaminho ? achar(S.selCaminho) : null;
}

// ── ao vivo: se a arte (ou o arquivo de edições) mudar no disco, recarrega ──
async function vigiar() {
  if (carregando || !S.arquivo || document.hidden) return;
  const carga = cargas;
  try {
    const nova = (await api.marcas(S.arquivo)).marca;
    if (carga !== cargas) return;                            // recarregou enquanto a resposta vinha: ignora
    if (marca && nova !== marca) {
      if (S.sujo) aviso('⚠ o arquivo mudou no disco — salve ou desfaça', 'sujo', 4000);
      else recarregar();
    }
    marca = nova;
    if ($('status').className === 'erro' && $('status').textContent.startsWith('sem conexão')) statusPadrao();
  } catch (e) {
    if (/não encontrada|nao encontrada/.test(e.message)) return;          // arte inexistente: o status já diz
    status('sem conexão com o servidor do editor', 'erro');
  }
}
setInterval(vigiar, 1000);
