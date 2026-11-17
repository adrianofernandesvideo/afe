// painel-pecas.js — as PEÇAS feitas em código de uma biblioteca (o design system da marca), na aba Assets.
// Uma peça é um HTML pequeno (components/<Nome>/preview.html) que usa as classes do CSS da marca, com um
// README explicando o uso. Aqui:
//   · a aba Assets lista as peças por grupo, com uma miniatura viva (a própria prévia, encolhida);
//   · clicar numa abre a janela "Escolher peça": a prévia grande + as instruções. Passe o mouse e clique no
//     pedaço que quer (a trilha em cima mostra onde ele está e deixa subir de nível); "Pôr na arte" insere.
// O que vai para a arte é o HTML daquele pedaço, como ele está desenhado na prévia (peças montadas por script
// viram HTML parado). O editor copia o CSS da marca e as imagens usadas para a pasta da arte (api.usarPeca) e
// a biblioteca da arte (item "html") se encarrega de carregar o CSS.
// Quem decide o que é "pedaço da marca": as classes. Um elemento é uma peça quando usa alguma classe definida
// no CSS da marca (os arquivos .css que a prévia carrega). As classes que só existem no <style> da própria
// prévia são de arrumação (fileira, coluna). Uma classe da marca que a prévia apenas ajusta continua da marca.
// O destaque (tracejado ao passar o mouse, amarelo no escolhido) é uma caixa desenhada POR CIMA da prévia, não
// um contorno no elemento: peças com recorte ou máscara (clip-path, mask) cortariam o contorno e pareceriam
// não selecionar. E a prévia inteira recebe o mouse, mesmo as peças que a marca fez "atravessáveis".
import { S, $, esc, ouvir, aviso } from './base.js';
import { api, urlDs } from './api.js';
import { achar } from './arte.js';
import { pag, editar } from './doc.js';
import { selecionar } from './selecao.js';
import { definirEdicao, visivel } from './paineis.js';

const lista = $('listaPecas'), janela = $('pecas'), quadro = $('pecaQuadro');
let bibliotecas = null;                                     // [{ nome, pasta, css, pecas: [{nome, grupo, largura, altura, resumo}] }]
let aberta = null;                                          // { bib, peca, doc, locais (classes de arrumação), sel (elemento escolhido) }
const LARGURA_MINI = 226;

// ── lista na aba Assets ──
async function carregar() {
  try { bibliotecas = (await api.pecas()).bibliotecas || []; } catch (e) { bibliotecas = []; }
  desenhar();
}
function desenhar() {
  let h = '';
  for (const b of bibliotecas || []) {
    const grupos = [...new Set(b.pecas.map((p) => p.grupo))];
    h += grupos.map((g) => {
      const itens = b.pecas.filter((p) => p.grupo === g);
      return `<details class="grupo-pecas"><summary title="Peças em código do design system: clique numa para escolher o pedaço e pôr na arte">★ ${esc(b.nome)} › Peças › ${esc(g)} (${itens.length})</summary>
        ${itens.map((p) => { const k = LARGURA_MINI / p.largura; return `<div class="peca" data-bib="${esc(b.nome)}" data-nome="${esc(p.nome)}" title="${esc(p.resumo)}">
          <div class="mini" style="height:${Math.round(p.altura * k)}px"><iframe loading="lazy" tabindex="-1" title="${esc(p.nome)}"
            src="${esc(urlDs(b.nome, `components/${p.nome}/preview.html`))}" style="width:${p.largura}px;height:${p.altura}px;transform:scale(${k})"></iframe></div>
          <div class="rot">${esc(p.nome)}</div></div>`; }).join('')}</details>`;
    }).join('');
  }
  lista.innerHTML = h;
  filtrar();
}
// a busca da aba Assets também vale aqui (pelo nome e pelo resumo da peça)
function filtrar() {
  const f = $('buscaAsset').value.trim().toLowerCase();
  for (const g of lista.querySelectorAll('.grupo-pecas')) {
    let tem = false;
    for (const p of g.querySelectorAll('.peca')) {
      const ok = !f || (p.dataset.nome + ' ' + p.title).toLowerCase().includes(f);
      p.hidden = !ok; tem = tem || ok;
    }
    g.hidden = !tem;
    if (f && tem) g.open = true;
  }
}
ouvir(['aba', 'modo', 'arte'], () => { if (visivel('assets') && !bibliotecas) carregar(); });
$('buscaAsset').addEventListener('input', filtrar);
lista.addEventListener('click', (ev) => {
  const p = ev.target.closest('.peca');
  if (p) abrirPeca(p.dataset.bib, p.dataset.nome);
});

// ── janela "Escolher peça" ──
// texto simples a partir do README (é só para ler: nada dele é executado)
const lerMarkdown = (md) => esc(md).split(/\r?\n/).filter((l) => !/^\s*#\s/.test(l))
  .map((l) => l.replace(/^\s*[-*]\s+/, '• ').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>'))
  .join('\n').trim();

export async function abrirPeca(nomeBib, nome) {
  const bib = (bibliotecas || []).find((b) => b.nome === nomeBib), peca = bib && bib.pecas.find((p) => p.nome === nome);
  if (!peca) return;
  aberta = { bib, peca, doc: null, locais: new Set(), sel: null };
  janela.hidden = false;
  document.body.classList.add('config-aberta');             // (os atalhos do editor ficam quietos, como na Config)
  $('pecaNome').textContent = peca.nome;
  $('pecaLeia').innerHTML = esc(peca.resumo);
  const k = Math.min(1, 640 / peca.largura, 520 / peca.altura);
  Object.assign(quadro.style, { width: peca.largura + 'px', height: peca.altura + 'px', transform: `scale(${k})` });
  Object.assign($('pecaPalco').style, { width: Math.round(peca.largura * k) + 'px', height: Math.round(peca.altura * k) + 'px' });
  quadro.src = urlDs(bib.nome, `components/${peca.nome}/preview.html`);
  atualizarJanela();
  try {
    const r = await fetch(urlDs(bib.nome, `components/${peca.nome}/README.md`), { cache: 'no-store' });
    if (r.ok && aberta && aberta.peca === peca) $('pecaLeia').innerHTML = lerMarkdown(await r.text());
  } catch (e) { /* sem README: fica o resumo */ }
}
export function fecharPeca() {
  if (janela.hidden) return;
  janela.hidden = true; aberta = null;
  quadro.removeAttribute('src');
  document.body.classList.remove('config-aberta');
}
// classe da marca = definida no CSS da marca (sem conseguir ler esse CSS: toda classe que não é só da prévia)
const daMarca = (c) => (aberta.marca ? aberta.marca.has(c) : !aberta.locais.has(c));
const ePeca = (el) => !!el && el.nodeType === 1 && el !== aberta.doc.body && el !== aberta.doc.documentElement
  && !el.classList.contains('ed-pick-caixa') && [...el.classList].some(daMarca);
// camadas empilhadas: irmãos do mesmo tamanho no mesmo lugar, dentro de uma peça (ex.: um desenho + o brilho
// dele). Sozinha, uma camada é meio efeito — o mouse pega o conjunto (a trilha ainda deixa descer).
function empilhado(el) {
  const pai = el.parentElement;
  if (!pai || !ePeca(pai) || pai.children.length < 2) return false;
  const a = pai.children[0].getBoundingClientRect();
  return [...pai.children].every((f) => {
    const b = f.getBoundingClientRect();
    return Math.abs(b.left - a.left) < 2 && Math.abs(b.top - a.top) < 2 && Math.abs(b.width - a.width) < 2 && Math.abs(b.height - a.height) < 2;
  });
}
// Pedaço AVULSO: prévias que não usam classes da marca (um desenho em SVG, uma tabela de cores) também têm o
// que pegar — o desenho inteiro (<svg>), uma imagem, ou o bloco com classe mais próximo. Um bloco que tem
// peças da marca dentro não conta: é só a arrumação delas.
const temPecaDentro = (el) => [...el.querySelectorAll('[class]')].some(ePeca);
const eAvulso = (el) => !!el && el.nodeType === 1 && el !== aberta.doc.body && el !== aberta.doc.documentElement
  && !el.classList.contains('ed-pick-caixa') && !el.closest('svg svg, svg *:not(svg)')
  && (el.classList.length > 0 || /^(svg|IMG)$/.test(el.tagName)) && !temPecaDentro(el);
// o pedaço que o mouse pega: o elemento (ou o mais próximo em volta dele) que usa uma classe da marca;
// se não houver, o pedaço avulso mais próximo
function pedacoEm(de) {
  let el = de;
  while (el && !ePeca(el)) el = el.parentElement;
  while (el && empilhado(el)) el = el.parentElement;
  if (el) return el;
  for (el = de; el && el.nodeType === 1; el = el.parentElement) if (eAvulso(el)) return el;
  return null;
}
// põe a caixa de destaque em volta do elemento (ou esconde)
function destacar(caixa, el) {
  if (!caixa) return;
  if (!el) { caixa.style.display = 'none'; return; }
  const r = el.getBoundingClientRect(), w = aberta.doc.defaultView;
  Object.assign(caixa.style, { display: 'block', left: r.left + w.scrollX - 4 + 'px', top: r.top + w.scrollY - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
}
function escolher(el) {
  if (!aberta) return;
  aberta.sel = el;
  destacar(aberta.caixaSel, el);
  atualizarJanela();
}
const rotulo = (el) => [...el.classList].find(daMarca) || el.classList[0] || el.tagName.toLowerCase();
function atualizarJanela() {
  const sel = aberta && aberta.sel, trilha = [];
  for (let el = sel; el && el !== aberta.doc.body; el = el.parentElement) if (el === sel || ePeca(el) || (!ePeca(sel) && eAvulso(el))) trilha.unshift(el);
  aberta.trilha = trilha;
  $('pecaTrilha').innerHTML = sel
    ? trilha.map((el, i) => `<button data-i="${i}" class="${el === sel ? 'ativo' : ''}" title="Escolher este nível">${esc(rotulo(el))}</button>`).join('<span>›</span>')
    : '<span class="dica">Passe o mouse na prévia e clique no pedaço que você quer.</span>';
  $('pecaPor').disabled = $('pecaCopiar').disabled = !sel;
}
quadro.addEventListener('load', () => {
  if (!aberta || !quadro.getAttribute('src')) return;
  const doc = quadro.contentDocument;
  aberta.doc = doc;
  // classes de arrumação = as definidas no <style> da própria prévia
  for (const st of doc.querySelectorAll('style')) for (const m of st.textContent.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) aberta.locais.add(m[1]);
  aberta.estiloLocal = [...doc.querySelectorAll('style')].map((st) => st.textContent).join('\n');
  // classes da marca = as que aparecem nos arquivos .css que a prévia carrega (e nos que eles importam)
  const marca = new Set();
  const ler = (folha) => {
    let regras; try { regras = folha.cssRules; } catch (e) { return; }
    for (const r of regras) {
      if (r.styleSheet) ler(r.styleSheet);
      else if (r.selectorText) for (const m of r.selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) marca.add(m[1]);
      else if (r.cssRules) ler(r);
    }
  };
  for (const folha of doc.styleSheets) if (folha.href) ler(folha);
  aberta.marca = marca.size ? marca : null;
  const meu = doc.createElement('style');
  meu.textContent = '*:not(.ed-pick-caixa){pointer-events:auto !important;cursor:pointer}'
    + '.ed-pick-caixa{position:absolute;display:none;box-sizing:border-box;pointer-events:none;z-index:2147483647}';
  doc.head.append(meu);
  const novaCaixa = (borda) => { const c = doc.createElement('div'); c.className = 'ed-pick-caixa'; c.style.border = borda; doc.documentElement.append(c); return c; };
  const caixaSobre = novaCaixa('4px dashed #3df5ff');
  aberta.caixaSel = novaCaixa('6px solid #ffd73d');
  let sobre = null;
  doc.addEventListener('mouseover', (ev) => {
    const p = pedacoEm(ev.target);
    if (p === sobre) return;
    sobre = p;
    destacar(caixaSobre, p);
  });
  doc.addEventListener('mouseleave', () => { sobre = null; destacar(caixaSobre, null); });
  doc.addEventListener('click', (ev) => { ev.preventDefault(); escolher(pedacoEm(ev.target)); });
  doc.addEventListener('dblclick', (ev) => { ev.preventDefault(); if (aberta.sel) porNaArte(); });
  doc.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') fecharPeca(); });
});
$('pecaTrilha').addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-i]');
  if (b && aberta) escolher(aberta.trilha[+b.dataset.i]);
});
$('pecaFechar').onclick = fecharPeca;
janela.addEventListener('mousedown', (ev) => { if (ev.target === janela) fecharPeca(); });
addEventListener('keydown', (ev) => { if (!janela.hidden && ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fecharPeca(); } }, true);

// Clone selected piece into an inert document so detached elements do not trigger network requests
const inertDocument = document.createElement('template').content.ownerDocument;
const copiaLimpa = () => inertDocument.importNode(aberta.sel, true);
$('pecaCopiar').onclick = async () => {
  if (!aberta || !aberta.sel) return;
  try { await navigator.clipboard.writeText(copiaLimpa().outerHTML); aviso('código da peça copiado'); }
  catch (e) { aviso('não consegui copiar (o navegador não deixou)', 'erro'); }
};
$('pecaPor').onclick = porNaArte;

// insere o pedaço escolhido no centro da arte
async function porNaArte() {
  if (!aberta || !aberta.sel || !S.lib) return;
  if (S.lib.versao < 2.7) { aviso('a biblioteca desta arte é antiga — rode o ligar.py nela para usar peças', 'sujo', 5000); return; }
  const { bib, peca, doc, sel } = aberta, win = doc.defaultView;
  const caixa = sel.getBoundingClientRect(), emVolta = win.getComputedStyle(sel.parentElement);
  const emBloco = !win.getComputedStyle(sel).display.startsWith('inline');
  const copia = copiaLimpa();
  const w = Math.ceil(caixa.width), h = Math.ceil(caixa.height);
  // um desenho (svg) solto perde o tamanho que as regras da prévia davam: passa a acompanhar a largura do item
  const desenho = sel.tagName === 'svg';
  if (desenho) Object.assign(copia.style, { position: 'static', display: 'block', width: '100%', height: 'auto', aspectRatio: `${w} / ${h}`, maxWidth: 'none', margin: '0' });
  // imagens da peça: endereço dentro do design system → cópia na pasta da arte
  const prefixo = urlDs(bib.nome, ''), imgs = [copia, ...copia.querySelectorAll('img')].filter((el) => el.tagName === 'IMG' && el.getAttribute('src'));
  const noDs = (im) => { const u = new URL(im.getAttribute('src'), doc.baseURI); return u.origin === location.origin && u.pathname.startsWith(prefixo) ? decodeURIComponent(u.pathname.slice(prefixo.length)) : null; };
  let pronto;
  try { pronto = await api.usarPeca(S.arquivo, bib.nome, imgs.map(noDs).filter(Boolean)); }
  catch (e) { aviso('não consegui copiar o CSS da marca para a pasta da arte: ' + e.message, 'erro', 5000); return; }
  for (const im of imgs) { const novo = pronto.imagens[noDs(im)]; if (novo) im.setAttribute('src', novo); }
  // regras de arrumação da prévia só vão junto se o pedaço usa alguma classe delas
  const usaLocal = [copia, ...copia.querySelectorAll('*')].some((el) => [...el.classList].some((c) => aberta.locais.has(c)));
  const item = {
    tipo: 'html', nome: peca.nome, html: copia.outerHTML, css: pronto.css,
    contexto: { fontFamily: emVolta.fontFamily, fontSize: emVolta.fontSize, lineHeight: emVolta.lineHeight, color: emVolta.color, textAlign: emVolta.textAlign },
    left: Math.round((S.larg - w) / 2), top: Math.round((S.alt - h) / 2),
    ...(emBloco || desenho ? { w } : {}), ...(usaLocal ? { estilo: aberta.estiloLocal } : {}),
  };
  fecharPeca();
  if (!S.editando) definirEdicao(true);
  const id = 'n' + (1 + Math.max(0, ...(pag()._novos || []).map((n) => +String(n.id).slice(1) || 0)));
  editar((P) => { (P._novos = P._novos || []).push({ id, ...item }); }, { reaplicar: true });
  selecionar(achar('#' + id));
  aviso(`peça "${peca.nome}" na arte — duplo clique num texto dela para trocar`, 'vivo', 5000);
}
export const _pecas = () => bibliotecas;
