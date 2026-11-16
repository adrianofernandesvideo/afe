// alcas.js — as alças da caixa de seleção (como a "transformação livre" do Photoshop). Valem para o elemento
// principal. As alças são os <i class="alca"> dentro de #caixaSel; quem desenha a caixa é selecao.js.
//   cantos   tamanho proporcional (Shift = livre: largura e altura separadas)
//   lados    só a largura ou só a altura
//   bolinha  girar (Shift = de 15 em 15 graus)
//   Alt      muda a partir do centro (sem Alt, o lado/canto oposto fica parado)
//   (Shift e Alt são as teclas padrão; trocam-se em ⚙ Config — papéis "alcaLivre" e "alcaCentro")
// O que cada alça muda de verdade:
//   elemento da arte ....... estica: campos "s" (tamanho), "sx" e "sy" (largura/altura), sem mexer no layout
//   forma acrescentada ..... largura e altura reais do item (a borda e os cantos não deformam)
//   imagem/texto acrescentados: cantos = tamanho real (largura da imagem, tamanho da letra); lados = estica
//   peça em código (com largura definida): lados esquerdo/direito = largura real (o texto se reorganiza)
// Contas em pixels da arte. O elemento é desenhado assim: centro C, girado em "r", escala (s·sx, s·sy) em volta
// do centro. Se P é o ponto que não pode sair do lugar e a alça foi levada até o mouse M, a escala nova de cada
// eixo sai de (M − P) medido nos eixos do elemento; depois o centro é recolocado para P continuar onde estava.
import { S, $, avisar } from './base.js';
import { pag, atual, mudar, editar } from './doc.js';
import { caixaDe } from './selecao.js';
import { terminarTexto } from './texto.js';
import { temMod } from './config.js';

let arrasto = null;
const MINIMO = 0.05;                                        // menor fator de tamanho (não deixa virar do avesso)

const girar = (p, graus) => { const a = graus * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }; };
// ponto do mouse em pixels da arte
function ponto(ev) {
  const m = $('moldura').getBoundingClientRect();
  return { x: (ev.clientX - m.left) / S.escala, y: (ev.clientY - m.top) / S.escala };
}
// o item acrescentado (★) deste caminho, se for um
function itemDe(c) {
  const id = /^#[^/]+$/.test(c || '') ? c.slice(1) : null;
  return id ? (pag()._novos || []).find((n) => n.id === id) || null : null;
}

$('caixaSel').addEventListener('mousedown', (ev) => {
  const alca = ev.target.closest('.alca');
  if (!alca || ev.button !== 0 || !S.sel || !S.lib) return;
  ev.preventDefault(); ev.stopPropagation();
  terminarTexto();
  const c = S.selCaminho, g = caixaDe(S.sel, c), item = itemDe(c);
  const s0 = atual('s', c), sx0 = atual('sx', c), sy0 = atual('sy', c);
  const [hx, hy] = alca.dataset.h === 'giro' ? [0, 0] : alca.dataset.h.split(',').map(Number);
  arrasto = {
    c, el: S.sel, item, giro: alca.dataset.h === 'giro', hx, hy, m0: ponto(ev), movido: false,
    C0: { x: g.cx, y: g.cy }, r0: g.giro, x0: atual('x', c), y0: atual('y', c), s0, sx0, sy0,
    w: g.larg / (s0 * sx0), h: g.alt / (s0 * sy0),          // tamanho do elemento sem a escala das edições
    real: null,                                             // tamanho real novo de um item (gravado ao soltar)
  };
  document.body.classList.add('arrastando');                // a arte para de "engolir" o mouse
});

addEventListener('mousemove', (ev) => {
  const a = arrasto;
  if (!a) return;
  if (!(ev.buttons & 1)) { terminar(); return; }            // o botão foi solto fora da janela
  const m = ponto(ev);
  if (!a.movido && Math.hypot(m.x - a.m0.x, m.y - a.m0.y) < 2) return;
  const primeiro = !a.movido;
  a.movido = true;
  if (a.giro) {
    const angulo = (p) => Math.atan2(p.y - a.C0.y, p.x - a.C0.x) * 180 / Math.PI;
    let r = a.r0 + angulo(m) - angulo(a.m0);
    if (temMod(ev, 'alcaLivre')) r = Math.round(r / 15) * 15;
    mudar((e) => { e.r = r; }, { em: [a.c], historia: primeiro });
    return;
  }
  const Sx = a.s0 * a.sx0, Sy = a.s0 * a.sy0;               // escala do começo, em cada eixo
  const alca = { x: a.hx * a.w / 2, y: a.hy * a.h / 2 };    // onde a alça fica (sem escala, a partir do centro)
  const fixo = temMod(ev, 'alcaCentro') ? { x: 0, y: 0 } : { x: -alca.x, y: -alca.y };   // Alt: o centro fica parado; senão, o lado oposto
  const P = girar({ x: fixo.x * Sx, y: fixo.y * Sy }, a.r0);
  P.x += a.C0.x; P.y += a.C0.y;
  const v = girar({ x: m.x - P.x, y: m.y - P.y }, -a.r0);   // do ponto fixo até o mouse, nos eixos do elemento
  const d = { x: (alca.x - fixo.x) * Sx, y: (alca.y - fixo.y) * Sy };   // do ponto fixo até a alça, no começo
  let fx = a.hx ? v.x / d.x : 1, fy = a.hy ? v.y / d.y : 1; // quanto cada eixo cresceu em relação ao começo
  const canto = a.hx && a.hy, proporcional = canto && !temMod(ev, 'alcaLivre');
  if (proporcional) fx = fy = (v.x * d.x + v.y * d.y) / (d.x * d.x + d.y * d.y);   // mouse projetado na diagonal
  if (a.hx) fx = Math.max(MINIMO, fx);
  if (a.hy) fy = Math.max(MINIMO, fy);
  // centro novo: o ponto fixo continua exatamente onde estava
  const volta = girar({ x: -fixo.x * Sx * fx, y: -fixo.y * Sy * fy }, a.r0);
  const dx = P.x + volta.x - a.C0.x, dy = P.y + volta.y - a.C0.y;

  const tipo = a.item && a.item.tipo;
  const forma = tipo === 'retangulo' || tipo === 'circulo';
  const larguraDaPeca = tipo === 'html' && a.item.w && a.hx && !a.hy;
  if (forma || larguraDaPeca || (proporcional && (tipo === 'img' || tipo === 'texto'))) {   // tamanho REAL do item
    const w = a.w * fx, h = a.h * fy;
    a.real = { left: Math.round((a.item.left || 0) + dx - (w - a.w) / 2), top: Math.round((a.item.top || 0) + dy - (h - a.h) / 2) };
    if (tipo === 'texto') a.real.fs = Math.max(4, Math.round((a.item.fs || 56) * fx));
    else a.real.w = Math.max(4, Math.round(w));
    if (forma) a.real.h = Math.max(4, Math.round(h));
    // prévia direto no elemento (refazer a arte a cada passo recarregaria as imagens); grava ao soltar
    Object.assign(a.el.style, { left: a.real.left + 'px', top: a.real.top + 'px' });
    if (a.real.fs) a.el.style.fontSize = a.real.fs + 'px'; else a.el.style.width = a.real.w + 'px';
    if (forma) a.el.style.height = a.real.h + 'px';
    avisar('layout');
    return;
  }
  mudar((e) => {                                            // estica (o layout da arte não muda)
    if (proporcional) e.s = a.s0 * fx;
    else { if (a.hx) e.sx = a.sx0 * fx; if (a.hy) e.sy = a.sy0 * fy; }
    e.x = a.x0 + dx; e.y = a.y0 + dy;
  }, { em: [a.c], historia: primeiro });
});

function terminar() {
  const a = arrasto;
  arrasto = null;
  document.body.classList.remove('arrastando');
  if (!a || !a.real) return;
  const id = a.item.id, novo = a.real;
  editar((P) => { const it = (P._novos || []).find((n) => n.id === id); if (it) Object.assign(it, novo); }, { reaplicar: true });
}
addEventListener('mouseup', terminar);
