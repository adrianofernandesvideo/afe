// painel-assets.js — aba "Assets": formas básicas, texto, as imagens das bibliotecas (assets da marca) e as
// imagens da pasta da arte.
// Arrastar para a arte (ou clicar: vai para o centro) cria um "item novo" em P._novos, com um id próprio
// ("n1", "n2"...). O caminho de um item novo é "#id" — não depende da posição dele entre os elementos.
// O render de PNG/vídeo só enxerga a pasta da arte. Por isso: da pasta da arte aparece tudo o que já está lá;
// de uma biblioteca (pasta de fora, ligada com --biblioteca no servidor) a imagem é COPIADA para
// <pasta da arte>/assets/biblioteca/... na hora em que é usada.
// Pastas chamadas "placeholders" (imagens provisórias de modelo) não aparecem — o servidor pula.
// Imagem de FUNDO (botão "fundo" no canto da miniatura, ou botão direito): cobre a arte toda e fica atrás de
// tudo; as camadas de fundo que a arte já tinha são escondidas e voltam quando o fundo é apagado. Um por página.
import { S, $, esc, pastaDe, ouvir, aviso } from './base.js';
import { api, urlArte, urlBiblioteca } from './api.js';
import { achar, raiz, caminho, visual, eNovo } from './arte.js';
import { pag, entrada, editar } from './doc.js';
import { abrirMenu } from './menu.js';
import { selecionar } from './selecao.js';
import { definirEdicao, visivel } from './paineis.js';

let lista = null, daArte = null;                            // imagens listadas e de qual arte são
let bibliotecas = [];                                       // [{ nome, pasta, itens }] — as mesmas para todas as artes
const eItemNovo = (c) => /^#[^/]+$/.test(c);
const BOTAO_FUNDO = '<button class="fundo" data-acao="fundo" title="Usar como FUNDO da arte: cobre a arte toda e fica atrás de tudo">fundo</button>';
export const novosSelecionados = () => S.selPaths.some(eItemNovo);

async function carregar() {
  daArte = S.arquivo;
  try { bibliotecas = (await api.biblioteca()).bibliotecas || []; } catch (e) { bibliotecas = []; }
  try { lista = (await api.assets(pastaDe(S.arquivo))).itens || []; } catch (e) { lista = []; }
  desenhar();
}
function desenhar() {
  const filtro = $('buscaAsset').value.trim().toLowerCase(), grupos = {};
  const passa = (x) => !filtro || x.toLowerCase().includes(filtro);
  const grupoDe = (s, semPasta) => s.replace(/[^/]*$/, '').replace(/\/$/, '') || semPasta;
  const aberto = (n) => (n <= 30 || filtro ? 'open' : '');
  // bibliotecas: um bloco por pasta (Fundos, Ícones...). O que já foi copiado delas para esta arte não se repete embaixo.
  const jaCopiados = new Set();
  let daBiblioteca = '';
  for (const b of bibliotecas) {
    const porGrupo = {};
    for (const s of b.itens) {
      jaCopiados.add(`assets/biblioteca/${b.pasta}/${s}`);
      if (passa(s)) (porGrupo[grupoDe(s, 'geral')] = porGrupo[grupoDe(s, 'geral')] || []).push(s);
    }
    daBiblioteca += Object.entries(porGrupo).map(([g, itens]) => `<details ${aberto(itens.length)}>
      <summary title="Biblioteca de assets: ao usar, a imagem é copiada para a pasta desta arte">★ ${esc(b.nome)} › ${esc(g)} (${itens.length})</summary><div class="grade">
      ${itens.map((s) => `<div class="tile" draggable="true" data-tipo="img" data-bib="${esc(b.nome)}" data-src="${esc(s)}" title="${esc(s.split('/').pop())}">
        <img loading="lazy" src="${esc(urlBiblioteca(b.nome, s))}">${BOTAO_FUNDO}</div>`).join('')}</div></details>`).join('');
  }
  for (const s of (lista || []).filter((x) => passa(x) && !jaCopiados.has(x))) {
    const g = grupoDe(s, 'pasta da arte');
    (grupos[g] = grupos[g] || []).push(s);
  }
  const formas = `<details open><summary>Formas e texto</summary><div class="grade">
      <div class="tile" draggable="true" data-tipo="retangulo" title="Retângulo"><div class="forma"></div></div>
      <div class="tile" draggable="true" data-tipo="circulo" title="Círculo"><div class="forma circ"></div></div>
      <div class="tile" draggable="true" data-tipo="texto" title="Texto" style="font:700 22px system-ui;color:#fff">Aa</div>
    </div></details>`;
  const pasta = pastaDe(S.arquivo);
  const imgs = Object.entries(grupos).map(([g, itens]) => `<details ${aberto(itens.length)}>
      <summary title="Imagens que estão na pasta desta arte">Desta arte › ${esc(g)} (${itens.length})</summary><div class="grade">
      ${itens.map((s) => `<div class="tile" draggable="true" data-tipo="img" data-src="${esc(s)}" title="${esc(s.split('/').pop())}">
        <img loading="lazy" src="${esc(urlArte(pasta + s))}">${BOTAO_FUNDO}</div>`).join('')}</div></details>`).join('');
  $('listaAssets').innerHTML = formas + daBiblioteca
    + (imgs || (lista && !daBiblioteca ? '<div class="vazio">Nenhuma imagem na pasta desta arte.</div>' : ''));
}
ouvir(['aba', 'arte', 'modo'], () => { if (visivel('assets') && daArte !== S.arquivo) carregar(); });
$('buscaAsset').addEventListener('input', desenhar);

const dadosDe = (tile) => ({ tipo: tile.dataset.tipo, src: tile.dataset.src, bib: tile.dataset.bib });
$('listaAssets').addEventListener('dragstart', (ev) => {
  const t = ev.target.closest('.tile');
  if (!t) return;
  ev.dataTransfer.setData('text/plain', 'ed-asset:' + JSON.stringify(dadosDe(t)));
  ev.dataTransfer.effectAllowed = 'copy';
});
$('listaAssets').addEventListener('click', (ev) => {
  const t = ev.target.closest('.tile');
  if (!t) return;
  if (ev.target.closest('[data-acao="fundo"]')) usarComoFundo(dadosDe(t)); else adicionarNovo(dadosDe(t));
});
$('listaAssets').addEventListener('contextmenu', (ev) => {  // botão direito numa imagem
  const t = ev.target.closest('.tile[data-tipo="img"]');
  if (!t) return;
  ev.preventDefault();
  abrirMenu(ev.clientX, ev.clientY, [
    { rotulo: 'Pôr na arte', dica: 'no centro', acao: () => adicionarNovo(dadosDe(t)) },
    { rotulo: 'Usar como fundo', dica: 'cobre a arte toda, atrás de tudo', acao: () => usarComoFundo(dadosDe(t)) },
  ]);
});
// soltar dentro da arte (o documento é novo a cada carga)
ouvir('arte', () => {
  const d = S.d;
  if (!d || !S.lib) return;
  d.addEventListener('dragover', (ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; });
  d.addEventListener('drop', (ev) => {
    const s = ev.dataTransfer.getData('text/plain') || '';
    if (!s.startsWith('ed-asset:')) return;
    ev.preventDefault();
    adicionarNovo(JSON.parse(s.slice(9)), ev.clientX, ev.clientY);
  });
});

// caminho da imagem a partir da pasta da arte. Se ela é de uma biblioteca, primeiro vai uma cópia para a pasta da arte.
async function srcNaArte(dados) {
  if (!dados.bib) return dados.src;
  try { return (await api.usarAsset(S.arquivo, dados.bib, dados.src)).src; }
  catch (e) { aviso('não consegui copiar o asset para a pasta da arte: ' + e.message, 'erro', 5000); return null; }
}
const proximoId = () => 'n' + (1 + Math.max(0, ...(pag()._novos || []).map((n) => +String(n.id).slice(1) || 0)));

// cria um item novo com o centro em (x, y) — coordenadas da tela da arte; sem x/y, no centro da arte
export async function adicionarNovo(dados, x, y) {
  if (!S.lib) return null;
  if (!S.editando) definirEdicao(true);
  const r = raiz().getBoundingClientRect();
  const cx = (x ?? r.left + r.width / 2) - r.left, cy = (y ?? r.top + r.height / 2) - r.top;   // dentro da raiz
  let item;
  if (dados.tipo === 'img') {
    const src = await srcNaArte(dados);
    if (!src) return null;
    const im = new Image();
    im.src = urlArte(pastaDe(S.arquivo) + src);
    await im.decode().catch(() => {});
    const nw = im.naturalWidth || 300, nh = im.naturalHeight || 300, w = Math.min(320, nw), h = w * nh / nw;
    item = { tipo: 'img', src, w: Math.round(w), left: Math.round(cx - w / 2), top: Math.round(cy - h / 2) };
  } else if (dados.tipo === 'texto') {
    item = { tipo: 'texto', html: 'Texto novo', fs: 64, left: Math.round(cx - 170), top: Math.round(cy - 36) };
  } else {
    const w = dados.tipo === 'circulo' ? 220 : 360, h = dados.tipo === 'circulo' ? 220 : 200;
    item = { tipo: dados.tipo, w, h, left: Math.round(cx - w / 2), top: Math.round(cy - h / 2) };
  }
  const id = proximoId();
  editar((P) => { (P._novos = P._novos || []).push({ id, ...item }); }, { reaplicar: true });
  selecionar(achar('#' + id));
  return id;
}
// apaga os itens novos entre os caminhos dados (os outros são ignorados) e as edições deles
export function removerNovos(caminhos = S.selPaths) {
  const ids = caminhos.filter(eItemNovo).map((c) => c.slice(1));
  if (!ids.length) return false;
  return editar((P) => {
    // apagar a imagem de fundo traz de volta as camadas de fundo da arte que ela tinha escondido
    for (const n of (P._novos || []).filter((x) => ids.includes(x.id))) for (const c of n.escondeu || []) if (P[c]) delete P[c].oculto;
    P._novos = (P._novos || []).filter((n) => !ids.includes(n.id));
    for (const c of Object.keys(P)) if (c[0] === '#' && ids.includes(c.slice(1).split('/')[0])) delete P[c];
  }, { reaplicar: true });                                  // (reaplicar tira da seleção o que deixou de existir)
}

// ── imagem de fundo ──
// Camadas de fundo que a arte já tem: os primeiros elementos da raiz que cobrem a arte toda e não têm nada
// dentro (um <canvas> desenhado, uma imagem, um bloco de cor). Param no primeiro que tiver conteúdo.
function camadasDeFundo() {
  const r = raiz(), tam = r.getBoundingClientRect(), achadas = [];
  for (const el of r.children) {
    if (!visual(el)) continue;
    const b = el.getBoundingClientRect();
    const cobre = b.width >= tam.width * 0.95 && b.height >= tam.height * 0.95;
    if (eNovo(el) || !cobre || el.children.length || (el.textContent || '').trim()) break;
    const c = caminho(el);
    if (c && !entrada(c).oculto) achadas.push(c);
  }
  return achadas;
}
// Usa a imagem como fundo da página: cobre a arte toda (sem deformar) e fica atrás de tudo. Só um fundo por
// página: escolher outro troca. As camadas de fundo da arte são escondidas (voltam ao apagar o fundo, ou no 👁).
export async function usarComoFundo(dados) {
  if (!S.lib || dados.tipo !== 'img') return null;
  if (S.lib.versao < 2.4) { aviso('a biblioteca desta arte é antiga — rode o ligar.py nela para usar imagem de fundo', 'sujo', 5000); return null; }
  if (!S.editando) definirEdicao(true);
  const src = await srcNaArte(dados);
  if (!src) return null;
  const antigos = (pag()._novos || []).filter((n) => n.fundo);
  const esconder = antigos.length ? [] : camadasDeFundo();   // (trocando de fundo, as da arte já estão escondidas)
  const escondeu = [...antigos.flatMap((n) => n.escondeu || []), ...esconder];
  const id = proximoId();
  editar((P) => {
    for (const n of antigos) delete P['#' + n.id];
    P._novos = (P._novos || []).filter((n) => !n.fundo);
    for (const c of esconder) entrada(c, true).oculto = true;
    P._novos.push({ id, tipo: 'img', src, fundo: true, ...(escondeu.length ? { escondeu } : {}) });
  }, { reaplicar: true });
  selecionar(achar('#' + id));
  aviso(antigos.length ? 'fundo trocado' : 'fundo colocado atrás de tudo'
    + (esconder.length ? ` · escondi ${esconder.length} camada${esconder.length > 1 ? 's' : ''} de fundo da arte (o 👁 da aba Camadas traz de volta)` : ''), 'vivo', 6000);
  return id;
}
