// curvas.js — o desenho de cada curva (easing): um graficozinho e uma bolinha que anda com aquela curva.
// As contas vêm da biblioteca da arte (S.lib.curva): o desenho mostra exatamente o que a animação faz.
// Tudo é gerado por código (SVG + animação do navegador): sem imagens, sem GIFs.
//   grafico(id)                 SVG pequeno: o tempo anda para a direita, o valor sobe
//   abrirCurvas(x, y, atual…)   menu com todas as curvas (gráfico + nome + bolinha)
//   itensDeCurva / animarBolinhas   para montar as curvas dentro de outro menu (botão direito do losango)
import { S } from './base.js';
import { CURVAS } from './presets.js';
import { abrirMenu } from './menu.js';

const PONTOS = 40;
// quanto do caminho já andou no instante u (0..1). No fim do trecho o valor é sempre o da chave seguinte.
const valor = (id, u) => (u >= 1 ? 1 : S.lib && S.lib.curva ? S.lib.curva(id, u) : u);

// As duas linhas claras são a chave de saída (embaixo) e a de chegada (em cima); a curva pode passar um pouco
// da de cima (Recuo).
export function grafico(id, larg = 46, alt = 30) {
  const Y = (v) => +(((1.22 - v) / 1.34) * alt).toFixed(2);
  const pts = [];
  for (let i = 0; i < PONTOS; i++) pts.push(`${+((i / PONTOS) * larg).toFixed(2)},${Y(valor(id, i / PONTOS))}`);
  pts.push(`${larg},${Y(valor(id, 0.9999))}`, `${larg},${Y(1)}`);   // (o Degrau sobe de uma vez só no fim)
  return `<svg class="graf" viewBox="0 0 ${larg} ${alt}" width="${larg}" height="${alt}" aria-hidden="true">
    <line x1="0" x2="${larg}" y1="${Y(0)}" y2="${Y(0)}"/><line x1="0" x2="${larg}" y1="${Y(1)}" y2="${Y(1)}"/>
    <polyline points="${pts.join(' ')}"/></svg>`;
}

// itens de menu, um por curva.  aoEscolher(id)
export function itensDeCurva(atual, aoEscolher) {
  return Object.entries(CURVAS).map(([id, c]) => ({
    rotulo: c.nome, dica: c.dica, marcado: id === atual, acao: () => aoEscolher(id),
    icone: grafico(id), extra: `<span class="pista-bola"><i class="bola" data-curva="${id}"></i></span>`,
  }));
}
// põe as bolinhas de um menu para andar: espera um instante, vai com a curva, fica parada no fim, recomeça
export function animarBolinhas(dentro) {
  if (!dentro) return;
  for (const b of dentro.querySelectorAll('.bola[data-curva]')) {
    if (!b.animate) continue;
    const id = b.dataset.curva, curso = (b.parentElement.clientWidth - b.offsetWidth) * 0.86;   // (sobra para o Recuo passar)
    const quadros = [{ offset: 0, transform: 'translateX(0)' }];
    for (let i = 0; i <= 30; i++) quadros.push({ offset: 0.08 + (i / 30) * 0.62, transform: `translateX(${+(valor(id, i / 30) * curso).toFixed(2)}px)` });
    quadros.push({ offset: 1, transform: `translateX(${curso}px)` });
    b.animate(quadros, { duration: 1900, iterations: Infinity });
  }
}
// menu só com as curvas.  opcoes: as do abrirMenu (ex.: { acima: true } para abrir para cima de um botão)
export function abrirCurvas(x, y, atual, aoEscolher, opcoes = {}) {
  const el = abrirMenu(x, y, [{ titulo: 'Curva até a próxima chave' }, ...itensDeCurva(atual, aoEscolher)], { classe: 'curvas', ...opcoes });
  animarBolinhas(el);
  return el;
}
