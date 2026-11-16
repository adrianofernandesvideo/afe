// painel-animacao.js — aba "Animação": a entrada do elemento (subir, zoom, glitch...), o tempo da camada (em
// que frame começa e some), o Escalonar (vários entrando um depois do outro) e os efeitos contínuos (wiggle,
// flutuar, pulsar, piscar...).
// Entrada: uma por camada; escolher vale para todos os selecionados, e mexer no cartão vale para todos os
// selecionados que têm entrada. Ao escolher, o editor toca só aquele trecho, uma vez.
// O menu é montado a partir do catálogo (presets.js), agrupado. Cada efeito aplicado aparece como um
// cartão com "força" e "vel" (quantas vezes por loop). Acrescentar vale para todos os selecionados;
// os cartões mostram e editam os do elemento principal.
// (O easing e o copiar/colar de chaves ficam na barra do tempo e na folha. As contas do tempo da camada ficam
// em tempo-camada.js; as contas dos efeitos, na biblioteca da arte.)
import { S, $, FPS, esc, noFrame, frameDe, ouvir, soDe } from './base.js';
import { entrada, mudar } from './doc.js';
import { visivel } from './paineis.js';
import { CONTINUOS, GRUPOS, ENTRADAS, GRUPOS_ENTRADA, ENTRADA_FRAMES } from './presets.js';
import { tocar, tocarTrecho } from './tempo.js';
import { inicioDe, fimDe, definirInicio, definirFim, escalonar } from './tempo-camada.js';

const MEUS = ['selecao', 'doc', 'arte', 'aba', 'modo'];
const menu = $('selPreset'), cartoes = $('presets');

menu.innerHTML = '<option value="">+ Adicionar efeito contínuo…</option>' + GRUPOS.map((g) =>
  `<optgroup label="– ${esc(g)} –">${Object.entries(CONTINUOS).filter(([, p]) => p.grupo === g)
    .map(([tipo, p]) => `<option value="${tipo}">${esc(p.nome)}</option>`).join('')}</optgroup>`).join('');

const menuEntrada = $('selEntrada'), cartaoEntrada = $('cartaoEntrada');
menuEntrada.innerHTML = '<option value="">▶ Escolher a entrada…</option>' + GRUPOS_ENTRADA.map((g) =>
  `<optgroup label="– ${esc(g)} –">${Object.entries(ENTRADAS).filter(([, p]) => p.grupo === g)
    .map(([tipo, p]) => `<option value="${tipo}">${esc(p.nome)}</option>`).join('')}</optgroup>`).join('');

function desenharEntrada() {
  menuEntrada.disabled = !S.sel;
  const ent = S.sel ? entrada().ent : null;
  if (!ent) { cartaoEntrada.innerHTML = S.sel ? '<div class="vazio">Este elemento não tem entrada.</div>' : ''; return; }
  const p = ENTRADAS[ent.tipo] || { nome: ent.tipo, un: '', forca: 1 };
  cartaoEntrada.innerHTML = `<div class="chip">
    <span class="nomep">▶ ${esc(p.nome)}</span>
    <span><button data-acao="ver" title="Tocar a entrada">▶</button> <button data-acao="tirar" title="Remover a entrada">✕</button></span>
    <div class="ctrl"><label title="quanto tempo a entrada leva (30 frames = 1 segundo)">duração
        <input type="number" data-k="dur" min="1" step="1" value="${frameDe(ent.dur || 1)}"> <span>frames</span></label>
      ${p.forca ? `<label title="de quão longe (ou quão pequeno, girado, desfocado) ele vem">força
        <input type="number" data-k="int" min="0" step="1" value="${ent.int}"> <span>${p.un}</span></label>` : ''}</div>
  </div>`;
}
// toca a entrada do elemento principal: do começo da camada até um pouco depois de ele chegar
function verEntrada() {
  const e = entrada();
  if (e.ent) tocarTrecho(e.ini || 0, (e.ini || 0) + (e.ent.dur || 1) + 0.4);
}
// campos do tempo da camada: mostram o elemento principal; mudar vale para todos os selecionados
function desenharTempo() {
  const tem = !!S.sel;
  $('inIni').disabled = $('inFim').disabled = !tem;
  $('btnEscalonar').disabled = $('inEsc').disabled = $('selEscOrdem').disabled = S.selPaths.length < 2;
  if (document.activeElement !== $('inIni')) $('inIni').value = tem ? inicioDe(S.selCaminho) : '';
  if (document.activeElement !== $('inFim')) $('inFim').value = tem ? fimDe(S.selCaminho) ?? '' : '';
}
function desenhar() {
  desenharEntrada();
  desenharTempo();
  menu.disabled = !S.sel;
  if (!S.sel) { cartoes.innerHTML = '<div class="vazio">Selecione algo na arte.</div>'; return; }
  cartoes.innerHTML = (entrada().anim || []).map((a, i) => {
    const p = CONTINUOS[a.tipo] || { nome: a.tipo, un: '' };
    return `<div class="chip" data-i="${i}">
      <span class="nomep">〰 ${esc(p.nome)}</span>
      <button data-acao="tirar" title="Remover">✕</button>
      <div class="ctrl"><label title="intensidade">força <input type="number" data-k="int" min="0" step="1" value="${a.int}">
        <span>${p.un}</span></label>
      <label title="quantas vezes por loop">vel <input type="number" data-k="vel" min="1" max="20" step="1" value="${a.vel}"></label></div>
    </div>`;
  }).join('') || '<div class="vazio">Nenhum efeito contínuo neste elemento.</div>';
}
ouvir(MEUS, (lote) => {
  if (!visivel('animacao')) return;
  if (soDe(lote, MEUS, 'doc', 'animacao')) return;          // estou digitando num cartão: não redesenha
  desenhar();
});

menu.addEventListener('change', () => {
  const tipo = menu.value;
  menu.value = '';
  if (!tipo || !S.sel) return;
  mudar((e) => { (e.anim = e.anim || []).push({ tipo, int: CONTINUOS[tipo].forca, vel: CONTINUOS[tipo].vel || 1 }); }, { pausar: false });
  tocar();                                                  // já mostra o efeito andando
});
cartoes.addEventListener('input', (ev) => {
  const cartao = ev.target.closest('.chip'), k = ev.target.dataset.k;
  if (!cartao || !k) return;
  const i = +cartao.dataset.i;
  let v = Math.max(0, +ev.target.value || 0);
  if (k === 'vel') v = Math.max(1, Math.round(v));
  mudar((e) => { if (e.anim && e.anim[i]) e.anim[i][k] = v; },
    { em: 'principal', lote: 'continuo-' + i + k, origem: 'animacao', pausar: false });
});
menuEntrada.addEventListener('change', () => {
  const tipo = menuEntrada.value;
  menuEntrada.value = '';
  if (!tipo || !S.sel) return;
  // trocar de entrada mantém a duração; a força volta ao padrão da entrada nova (as unidades mudam)
  mudar((e) => { e.ent = { tipo, dur: (e.ent && e.ent.dur) || noFrame(ENTRADA_FRAMES / FPS), int: ENTRADAS[tipo].forca }; }, { pausar: false });
  verEntrada();
});
cartaoEntrada.addEventListener('input', (ev) => {
  const k = ev.target.dataset.k;
  if (!k) return;
  const n = Math.max(0, +ev.target.value || 0);
  const v = k === 'dur' ? noFrame(Math.max(1, Math.round(n)) / FPS) : n;
  mudar((e) => { if (e.ent) e.ent[k] = v; }, { lote: 'entrada-' + k, origem: 'animacao', pausar: false });
});
cartaoEntrada.addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-acao]');
  if (!b) return;
  if (b.dataset.acao === 'ver') verEntrada();
  else mudar((e) => { delete e.ent; });
});
$('inIni').addEventListener('change', (ev) => definirInicio(ev.target.value));
$('inFim').addEventListener('change', (ev) => definirFim(ev.target.value.trim() === '' ? null : ev.target.value));
$('btnEscalonar').onclick = () => escalonar($('inEsc').value, $('selEscOrdem').value);
cartoes.addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-acao="tirar"]');
  if (!b) return;
  const i = +b.closest('.chip').dataset.i;
  mudar((e) => { if (e.anim) e.anim.splice(i, 1); }, { em: 'principal', pausar: false });
});
