// menu.js — o menu do botão direito (um só na tela por vez).
//   abrirMenu(x, y, itens, opções)   x, y = posição do mouse na janela. Devolve o elemento do menu.
//   itens: { rotulo, acao, dica, atalho, marcado, desligado, icone, extra }  |  { titulo }  |  '-' (linha)
//          icone / extra = HTML pronto, escrito pelo próprio editor (um desenho antes / depois do nome)
//   opções: classe (classe CSS a mais no menu) · acima: true (abre para cima do ponto, ex.: de um botão no rodapé)
// Fecha sozinho ao escolher, clicar fora, apertar uma tecla, ou quando a janela muda/perde o foco
// (clicar dentro da arte tira o foco da tela do editor).
import { esc } from './base.js';

let aberto = null, posicao = [0, 0];
// onde o último menu abriu (um submenu, como o da mesclagem, abre no mesmo lugar)
export const posicaoDoMenu = () => posicao;

export function fecharMenu() {
  if (aberto) { aberto.remove(); aberto = null; }
}
export function abrirMenu(x, y, itens, { classe = '', acima = false } = {}) {
  fecharMenu();
  posicao = [x, y];
  const el = document.createElement('div');
  el.className = 'menu ' + classe;
  el.innerHTML = itens.map((it, i) => (it === '-' ? '<hr>'
    : it.titulo ? `<div class="tit">${esc(it.titulo)}</div>`
    : `<button data-i="${i}" ${it.desligado ? 'disabled' : ''}><span class="marca">${it.marcado ? '✓' : ''}</span>${it.icone || ''}
        <span class="rot">${esc(it.rotulo)}${it.dica ? `<small>${esc(it.dica)}</small>` : ''}</span>
        ${it.extra || ''}${it.atalho ? `<kbd>${esc(it.atalho)}</kbd>` : ''}</button>`)).join('');
  document.body.append(el);
  const r = el.getBoundingClientRect();                     // não deixa sair da janela
  el.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px';
  el.style.top = Math.max(4, Math.min(acima ? y - r.height : y, innerHeight - r.height - 4)) + 'px';
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-i]');
    if (!b || b.disabled) return;
    fecharMenu();
    itens[+b.dataset.i].acao();
  });
  el.addEventListener('contextmenu', (ev) => ev.preventDefault());
  aberto = el;
  return el;
}
export const menuAberto = () => !!aberto;

addEventListener('mousedown', (ev) => { if (aberto && !aberto.contains(ev.target)) fecharMenu(); }, true);
addEventListener('keydown', (ev) => {
  if (!aberto) return;
  fecharMenu();
  if (ev.key === 'Escape') ev.stopPropagation();            // o Esc só fecha o menu (não solta a seleção)
}, true);
addEventListener('blur', fecharMenu);
addEventListener('resize', fecharMenu);
