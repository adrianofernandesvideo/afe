// css-valores.js — lê e escreve valores de CSS (cores, sombras, filtros) como dados simples.
// Funções puras: não tocam na tela nem no estado. Usado pelas abas Efeitos e Forma.

// ── cores: { cor: '#rrggbb', a: 0..1 } ──
const hex2 = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
export function lerCor(s) {
  s = (s || '').trim(); let m;
  if ((m = s.match(/^rgba?\(([^)]+)\)$/i))) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return { cor: '#' + hex2(p[0]) + hex2(p[1]) + hex2(p[2]), a: p[3] != null ? p[3] : 1 };
  }
  if ((m = s.match(/^color\(srgb\s+([^)]+)\)$/i))) {      // o navegador devolve assim as cores misturadas (color-mix)
    const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
    return { cor: '#' + hex2(p[0] * 255) + hex2(p[1] * 255) + hex2(p[2] * 255), a: p[3] != null ? p[3] : 1 };
  }
  if (/^#[0-9a-f]{6}$/i.test(s)) return { cor: s, a: 1 };
  return { cor: '#ffffff', a: 1 };
}
// sempre rgba(...): a animação só consegue misturar duas cores se as duas estiverem no mesmo formato
export function corCss(c) {
  const n = parseInt(c.cor.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${+(+c.a).toFixed(2)})`;
}

// ── sombras: { cor, a, x, y, b (desfoque), e (espalhar), inset } ──
function dividir(s) {                                      // separa por vírgula fora de parênteses
  const r = []; let nivel = 0, atual = '';
  for (const ch of s) {
    if (ch === '(') nivel++; else if (ch === ')') nivel--;
    if (ch === ',' && !nivel) { r.push(atual); atual = ''; } else atual += ch;
  }
  if (atual.trim()) r.push(atual);
  return r;
}
function lerSombra(item) {
  const mc = item.match(/(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/i);
  const resto = mc ? item.replace(mc[0], ' ') : item;
  const n = (resto.match(/-?\d*\.?\d+/g) || []).map(Number);
  return { ...lerCor(mc ? mc[0] : '#fff'), x: n[0] || 0, y: n[1] || 0, b: n[2] || 0, e: n[3] || 0, inset: /inset/.test(resto) };
}
const num = (v) => +(+v).toFixed(1);
export const lerSombras = (s) => (!s || s === 'none' ? [] : dividir(s).map(lerSombra));
// caixa = true para box-shadow (tem "espalhar"); false para text-shadow
export const montarSombras = (lista, caixa) => lista.map((c) =>
  `${c.inset ? 'inset ' : ''}${num(c.x)}px ${num(c.y)}px ${num(c.b)}px ${caixa ? num(c.e) + 'px ' : ''}${corCss(c)}`).join(', ') || 'none';
export const novaSombra = () => ({ cor: '#3df5ff', a: 1, x: 0, y: 0, b: 12, e: 0, inset: false });

// ── filtro: lista NA ORDEM do CSS (a ordem muda o resultado, então editar não pode embaralhar) ──
//   { fn:'drop-shadow', cor, a, x, y, b } | { fn:'blur'|'brightness'|'saturate'|'contrast', v } | { fn:'outro', txt }
export const NEUTRO = { blur: 0, brightness: 100, saturate: 100, contrast: 100 };   // valor que "não faz nada"
const pct = (a) => (a.trim().endsWith('%') ? parseFloat(a) : parseFloat(a) * 100);
export function lerFiltro(s) {
  const itens = [];
  if (!s || s === 'none') return itens;
  for (const m of s.matchAll(/([\w-]+)\(((?:[^()]|\([^()]*\))*)\)/g)) {
    const [txt, fn, arg] = m;
    if (fn === 'drop-shadow') itens.push({ fn, ...lerSombra(arg) });
    else if (fn === 'blur') itens.push({ fn, v: parseFloat(arg) || 0 });
    else if (fn in NEUTRO) itens.push({ fn, v: pct(arg) });
    else itens.push({ fn: 'outro', txt });
  }
  return itens;
}
export function montarFiltro(itens) {
  const p = [];
  for (const i of itens) {
    if (i.fn === 'drop-shadow') p.push(`drop-shadow(${corCss(i)} ${num(i.x)}px ${num(i.y)}px ${num(i.b)}px)`);
    else if (i.fn === 'outro') p.push(i.txt);
    else if (i.v !== NEUTRO[i.fn]) p.push(i.fn === 'blur' ? `blur(${num(i.v)}px)` : `${i.fn}(${num(i.v)}%)`);
  }
  return p.join(' ') || 'none';
}
export const ajusteDe = (itens, fn) => { const i = itens.find((x) => x.fn === fn); return i ? i.v : NEUTRO[fn]; };
// muda um ajuste (desfoque, brilho...). Se o filtro ainda não tinha esse ajuste, ele entra antes das sombras.
export function definirAjuste(itens, fn, v) {
  const i = itens.find((x) => x.fn === fn);
  if (i) { i.v = v; return; }
  const pos = itens.findIndex((x) => x.fn === 'drop-shadow');
  itens.splice(pos < 0 ? itens.length : pos, 0, { fn, v });
}
