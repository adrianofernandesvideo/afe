// painel-forma.js — aba "Forma": arredondamento, preenchimento e contorno (cor ou gradiente) do elemento principal.
// Guarda no documento:
//   e.raio   arredondamento — número (px) ou texto com % (ex.: "50%" = círculo). Só quando o usuário mexe nele.
//   e.forma  o estado dos controles { fill, stroke, orig }   (para reabrir a aba como estava)
//   e.bg / e.bd   o resultado em CSS (background e border), que a arte aplica.
// Contorno em gradiente: borda transparente + 2 fundos (o preenchimento só até a borda — "padding-box" —
// e o gradiente por baixo de tudo — "border-box"). Funciona com cantos arredondados.
import { S, $, r1, ouvir, soDe } from './base.js';
import { entrada, mudar } from './doc.js';
import { visivel } from './paineis.js';
import { lerCor, corCss } from './css-valores.js';

const caixa = $('pn-forma');
const MEUS = ['selecao', 'doc', 'arte', 'aba', 'modo'];
const MODOS = [['original', 'Original'], ['nenhum', 'Nenhum'], ['cor', 'Cor'], ['gradiente', 'Gradiente']];
let fm = null, visto = '';

const estilo = () => S.w.getComputedStyle(S.sel);
const copia = (o) => JSON.parse(JSON.stringify(o));
const chave = (cs) => [S.selCaminho, JSON.stringify(entrada().forma || 0), cs.borderTopLeftRadius,
  cs.backgroundColor, cs.borderTopColor, cs.borderTopWidth].join('§');

function ler() {
  const e = entrada(), cs = estilo();
  const raioCss = cs.borderTopLeftRadius || '0px';
  const bgc = lerCor(cs.backgroundColor), bdc = lerCor(cs.borderTopColor);
  const base = e.forma ? copia(e.forma) : {
    fill: { modo: 'original', c1: bgc.a ? bgc.cor : '#10a6ff', a1: bgc.a || 0.2, c2: '#d501e8', a2: 1, ang: 135 },
    stroke: { modo: 'original', w: parseFloat(cs.borderTopWidth) || 3, c1: bdc.cor, a1: bdc.a || 1, c2: '#ff4d82', a2: 1, ang: 135 },
    orig: { img: cs.backgroundImage, cor: cs.backgroundColor },      // fundo que a arte tinha (para compor o contorno)
  };
  return { ...base, raio: parseFloat(raioCss) || 0, un: raioCss.trim().endsWith('%') ? '%' : 'px' };
}
// monta o CSS de fundo e borda a partir dos controles (null = não mexe naquela parte)
function compor(f) {
  const c = (cor, a) => corCss({ cor, a });
  const F = f.fill, C = f.stroke;
  let fundoCamada, fundo = null;
  if (F.modo === 'nenhum') { fundo = 'transparent'; fundoCamada = 'linear-gradient(transparent, transparent)'; }
  else if (F.modo === 'cor') { fundo = c(F.c1, F.a1); fundoCamada = `linear-gradient(${fundo}, ${fundo})`; }
  else if (F.modo === 'gradiente') fundoCamada = fundo = `linear-gradient(${F.ang}deg, ${c(F.c1, F.a1)}, ${c(F.c2, F.a2)})`;
  else fundoCamada = f.orig.img && f.orig.img !== 'none' ? f.orig.img : `linear-gradient(${f.orig.cor}, ${f.orig.cor})`;
  let bg = F.modo === 'original' ? null : fundo, bd = null;
  if (C.modo === 'nenhum') bd = 'none';
  else if (C.modo === 'cor') bd = `${C.w}px solid ${c(C.c1, C.a1)}`;
  else if (C.modo === 'gradiente') {
    bd = `${C.w}px solid transparent`;
    bg = `${fundoCamada} padding-box, linear-gradient(${C.ang}deg, ${c(C.c1, C.a1)}, ${c(C.c2, C.a2)}) border-box`;
  }
  return { bg, bd };
}
// grupo = 'raio' | 'fill' | 'stroke'.  passo = true: troca de tipo (um passo próprio no desfazer)
function gravar(grupo, passo = false) {
  mudar((e) => {
    if (grupo === 'raio') { e.raio = fm.un === '%' ? fm.raio + '%' : fm.raio; return; }
    const { bg, bd } = compor(fm);
    if (bg != null) e.bg = bg; else delete e.bg;
    if (bd != null) e.bd = bd; else delete e.bd;
    if (fm.fill.modo === 'original' && fm.stroke.modo === 'original') delete e.forma;   // voltou tudo ao original
    else e.forma = copia({ fill: fm.fill, stroke: fm.stroke, orig: fm.orig });
  }, { em: 'principal', lote: passo ? null : 'forma-' + grupo, origem: 'forma' });
  visto = chave(estilo());
}

const seletor = (grupo, v) => `<div class="ajuste">Tipo<select data-g="${grupo}" data-k="modo">${MODOS.map(([k, n]) =>
  `<option value="${k}" ${k === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
function htmlCores(grupo, g) {
  if (g.modo === 'original' || g.modo === 'nenhum') return '';
  const cor = (rot, kc, ka) => `<div class="ajuste">${rot}<input type="color" data-g="${grupo}" data-k="${kc}" value="${g[kc]}"><output></output></div>
    <div class="ajuste">Opacidade<input type="range" data-g="${grupo}" data-k="${ka}" data-padrao="100" min="0" max="100" value="${Math.round(g[ka] * 100)}">
      <output>${Math.round(g[ka] * 100)}%</output></div>`;
  return cor('Cor', 'c1', 'a1') + (g.modo !== 'gradiente' ? '' : cor('Cor 2', 'c2', 'a2') +
    `<div class="ajuste">Ângulo<input type="range" data-g="${grupo}" data-k="ang" data-padrao="135" min="0" max="360" value="${g.ang}"><output>${g.ang}°</output></div>`);
}
function desenhar() {
  if (!S.sel) { caixa.innerHTML = '<div class="vazio">Selecione uma caixa, selo, painel ou pílula.</div>'; fm = null; visto = ''; return; }
  fm = ler();
  visto = chave(estilo());
  const maxRaio = fm.un === '%' ? 50 : 300, comLinha = fm.stroke.modo === 'cor' || fm.stroke.modo === 'gradiente';
  caixa.innerHTML = `
    <h4>Arredondamento</h4>
    <div class="ajuste">Cantos (${fm.un})<input type="range" data-g="raio" data-k="raio" data-padrao="original" title="Arredondamento dos cantos" min="0" max="${maxRaio}" value="${fm.raio}">
      <input type="number" data-g="raio" data-k="raio" min="0" value="${r1(fm.raio)}"></div>
    <h4>Preenchimento</h4>
    ${seletor('fill', fm.fill.modo)}${htmlCores('fill', fm.fill)}
    <h4>Contorno</h4>
    ${seletor('stroke', fm.stroke.modo)}
    ${comLinha ? `<div class="ajuste">Espessura<input type="range" data-g="stroke" data-k="w" data-padrao="3" min="0" max="20" step="0.5" value="${fm.stroke.w}">
      <input type="number" data-g="stroke" data-k="w" min="0" step="0.5" value="${fm.stroke.w}"></div>` : ''}
    ${htmlCores('stroke', fm.stroke)}
    <p class="dica">"Original" mantém o que a arte já tem. A opacidade do elemento inteiro fica na aba Transformar.</p>`;
}

ouvir(MEUS, (lote) => {
  if (!visivel('forma')) return;
  if (soDe(lote, MEUS, 'doc', 'forma')) return;             // fui eu que mudei: mantém os campos (e o foco)
  if (S.sel && fm && !lote.has('aba') && !lote.has('modo') && chave(estilo()) === visto) return;
  desenhar();
});

// "Cantos": o padrão é o arredondamento que a arte já tinha — duplo clique tira a edição e mostra o original
caixa.addEventListener('dblclick', (ev) => {
  if (!fm || ev.target.type !== 'range' || ev.target.dataset.k !== 'raio') return;
  mudar((e) => { delete e.raio; }, { em: 'principal', lote: 'forma-raio' });
  desenhar();
});
caixa.addEventListener('input', (ev) => {
  const t = ev.target, g = t.dataset.g, k = t.dataset.k;
  if (!fm || !g || !k) return;
  if (k === 'modo') { fm[g].modo = t.value; gravar(g, true); desenhar(); return; }
  const alvo = g === 'raio' ? fm : fm[g];
  alvo[k] = (k === 'c1' || k === 'c2') ? t.value : (k === 'a1' || k === 'a2') ? +t.value / 100 : +t.value || 0;
  // espelha no outro controle (slider <-> número) e no rótulo ao lado
  const linha = t.closest('.ajuste');
  linha.querySelectorAll(`[data-k="${k}"]`).forEach((x) => { if (x !== t) x.value = t.value; });
  const o = linha.querySelector('output');
  if (o && k === 'ang') o.textContent = t.value + '°';
  if (o && (k === 'a1' || k === 'a2')) o.textContent = t.value + '%';
  gravar(g);
});
