// selecao.js — o que está selecionado (um ou vários elementos) e os contornos desenhados por cima da arte.
// A seleção é guardada por CAMINHO (S.selPaths): os elementos podem ser recriados, os caminhos não mudam.
// O "principal" (S.sel / S.selCaminho) é o último clicado: é ele que as abas Efeitos e Forma mostram.
import { S, $, ouvir, avisar } from './base.js';
import { achar, caminho } from './arte.js';
import { terminarTexto } from './texto.js';
import { atual } from './doc.js';

// seleciona um elemento. somar = true (Shift+clique): acrescenta ou tira da seleção
export function selecionar(el, somar = false) {
  terminarTexto();
  const c = el ? caminho(el) : null;
  if (somar && c) {
    const i = S.selPaths.indexOf(c);
    if (i >= 0) S.selPaths.splice(i, 1); else S.selPaths.push(c);
  } else S.selPaths = c ? [c] : [];
  S.selCaminho = S.selPaths[S.selPaths.length - 1] || null;
  S.sel = S.selCaminho ? achar(S.selCaminho) : null;
  avisar('selecao');
}
export const selecionados = () => S.selPaths.map(achar).filter(Boolean);
// caminhos para MOVER: sem os que estão dentro de outro selecionado (o de dentro já anda junto com o de fora)
export const paraMover = () => S.selPaths.filter((c) => !S.selPaths.some((p) => p !== c && c.startsWith(p + '/')));
export function definirHover(el) {
  if (S.hover === el) return;
  S.hover = el;
  avisar('hover');
}

// ── contornos (ficam por cima do iframe, na escala da tela) ──
// Caixa "de verdade" de um elemento, em pixels da arte: centro, largura, altura e giro. Sem giro, é o retângulo
// que o navegador mede (exato). Com giro, o tamanho vem do elemento × a escala das edições, e a caixa gira junto.
// (Giro que a própria arte dá ao elemento por CSS não entra na conta: a caixa fica reta em volta dele.)
export function caixaDe(el, c) {
  const b = el.getBoundingClientRect(), giro = atual('r', c) || 0;
  let larg = b.width, alt = b.height;
  if (giro && el.offsetWidth) {
    larg = el.offsetWidth * atual('s', c) * atual('sx', c);
    alt = el.offsetHeight * atual('s', c) * atual('sy', c);
  }
  return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, larg, alt, giro };
}
// caixa do elemento principal: gira junto com ele e mostra as alças (alcas.js cuida do arrasto delas)
function caixaPrincipal() {
  const div = $('caixaSel'), el = S.sel;
  if (!S.editando || !S.lib || !el || !el.isConnected) { div.style.display = 'none'; return; }
  const g = caixaDe(el, S.selCaminho), k = S.escala, larg = Math.max(2, g.larg * k), alt = Math.max(2, g.alt * k);
  Object.assign(div.style, { display: 'block', left: g.cx * k - larg / 2 + 'px', top: g.cy * k - alt / 2 + 'px',
    width: larg + 'px', height: alt + 'px', rotate: g.giro ? g.giro + 'deg' : '' });
  div.classList.toggle('com-alcas', !S.editTexto && !S.tocando);
  div.classList.toggle('estreita', larg < 44);              // caixa pequena: ficam só as alças dos cantos
  div.classList.toggle('baixa', alt < 44);
}
function caixa(div, el) {
  if (!S.editando || !el || !el.isConnected) { div.style.display = 'none'; return; }
  const r = el.getBoundingClientRect(), k = S.escala;
  Object.assign(div.style, { display: 'block', left: r.left * k + 'px', top: r.top * k + 'px',
    width: Math.max(2, r.width * k) + 'px', height: Math.max(2, r.height * k) + 'px' });
}
function contornos() {
  caixaPrincipal();
  $('caixaSel').classList.toggle('texto', !!S.editTexto);
  caixa($('caixaHover'), S.hover && S.hover !== S.sel ? S.hover : null);
  const extras = S.editando && S.lib ? selecionados().filter((el) => el !== S.sel) : [];
  const box = $('caixasExtra');
  while (box.children.length < extras.length) { const dv = document.createElement('div'); dv.className = 'caixa extra'; box.append(dv); }
  [...box.children].forEach((dv, i) => caixa(dv, extras[i] || null));
}
ouvir(['selecao', 'doc', 'tempo', 'arte', 'layout', 'modo', 'hover', 'aba'], contornos);
