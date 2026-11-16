// painel-efeitos.js — aba "Efeitos": brilho/sombra da forma (drop-shadow em camadas), sombra do texto,
// sombra da caixa, cor do texto e ajustes de imagem (desfoque, brilho, saturação, contraste).
// Lê o estilo que o navegador calculou para o elemento principal, mostra como camadas editáveis e grava
// de volta como texto CSS:  e.filtro · e.tsombra · e.csombra · e.cor.   (Leitura e escrita: css-valores.js.)
import { S, $, r1, ouvir, soDe, aviso } from './base.js';
import { mudar } from './doc.js';
import { visivel } from './paineis.js';
import { lerCor, corCss, lerSombras, montarSombras, novaSombra, lerFiltro, montarFiltro, ajusteDe, definirAjuste } from './css-valores.js';

const caixa = $('pn-efeitos');
const MEUS = ['selecao', 'doc', 'arte', 'aba', 'modo'];
let fx = null, copiado = null, visto = '';
// ajustes de imagem: [função CSS, rótulo, mín, máx, passo, unidade, valor padrão (duplo clique no slider)]
const AJUSTES = [['blur', 'Desfoque', 0, 20, 0.5, 'px', 0], ['brightness', 'Brilho', 0, 200, 1, '%', 100],
  ['saturate', 'Saturação', 0, 300, 1, '%', 100], ['contrast', 'Contraste', 0, 200, 1, '%', 100]];

const estilo = () => S.w.getComputedStyle(S.sel);
const chave = (cs) => [S.selCaminho, cs.filter, cs.textShadow, cs.boxShadow, cs.color].join('§');
// camadas de sombra de uma parte: 'filtro' (as drop-shadow do filtro) | 'texto' | 'caixa'
const sombras = (parte) => (parte === 'filtro' ? fx.filtro.filter((i) => i.fn === 'drop-shadow') : fx[parte]);

function htmlCamada(parte, i, c) {
  return `<div class="camada" data-parte="${parte}" data-i="${i}">
    <div class="l1"><input type="color" data-k="cor" value="${c.cor}" title="Cor">
      <input type="range" data-k="a" data-padrao="100" min="0" max="100" value="${Math.round(c.a * 100)}" title="Opacidade da cor">
      <button class="x" data-acao="tirar" title="Remover camada">✕</button></div>
    <div class="l2"><label>X <input type="number" data-k="x" step="1" value="${r1(c.x)}"></label>
      <label>Y <input type="number" data-k="y" step="1" value="${r1(c.y)}"></label>
      <label>Desfoque <input type="number" data-k="b" step="1" min="0" value="${r1(c.b)}"></label>
      ${parte === 'caixa' ? `<label>Espalhar <input type="number" data-k="e" step="1" value="${r1(c.e)}"></label>` : ''}</div></div>`;
}
function desenhar() {
  if (!S.sel) { caixa.innerHTML = '<div class="vazio">Selecione algo na arte para ver os efeitos.</div>'; fx = null; visto = ''; return; }
  const cs = estilo();
  visto = chave(cs);
  fx = { filtro: lerFiltro(cs.filter), texto: lerSombras(cs.textShadow), caixa: lerSombras(cs.boxShadow), cor: lerCor(cs.color) };
  const bloco = (parte) => sombras(parte).map((c, i) => htmlCamada(parte, i, c)).join('') || '<div class="vazio">nenhuma</div>';
  caixa.innerHTML = `
    <h4>Brilho / sombra da forma <button data-acao="mais" data-parte="filtro">+ camada</button></h4>
    <p class="dica">Segue o contorno do elemento (recortes em PNG, textos, ícones). Várias camadas somam o glow.</p>
    ${bloco('filtro')}
    <h4>Sombra do texto <button data-acao="mais" data-parte="texto">+ camada</button></h4>
    ${bloco('texto')}
    <h4>Sombra da caixa <button data-acao="mais" data-parte="caixa">+ camada</button></h4>
    ${bloco('caixa')}
    <h4>Cor do texto</h4>
    <div class="ajuste">Cor<input type="color" data-parte="cor" data-k="cor" value="${fx.cor.cor}"><output></output></div>
    <h4>Ajustes de imagem</h4>
    ${AJUSTES.map(([fn, nome, min, max, passo, un, padrao]) => { const v = ajusteDe(fx.filtro, fn); return `<div class="ajuste">${nome}
      <input type="range" data-parte="ajuste" data-k="${fn}" data-un="${un}" data-padrao="${padrao}" min="${min}" max="${max}" step="${passo}" value="${v}">
      <output>${r1(v)}${un}</output></div>`; }).join('')}
    <h4>Copiar efeitos</h4>
    <div class="botoes"><button data-acao="copiar">Copiar</button>
      <button data-acao="colar" ${copiado ? '' : 'disabled'}>Colar nos selecionados</button></div>
    <p class="dica">Copia brilho, sombras e cor deste elemento para colar em outros.</p>`;
}
// grava no documento só a parte que mudou (só no elemento principal).
// passo = true: ação única (acrescentar/tirar camada) — um passo próprio no desfazer;
// senão, mexidas seguidas no mesmo controle (slider, número) contam como um passo só.
function gravar(parte, passo = false) {
  mudar((e) => {
    if (parte === 'filtro' || parte === 'ajuste') e.filtro = montarFiltro(fx.filtro);
    if (parte === 'texto') e.tsombra = montarSombras(fx.texto, false);
    if (parte === 'caixa') e.csombra = montarSombras(fx.caixa, true);
    if (parte === 'cor') e.cor = corCss(fx.cor);
  }, { em: 'principal', lote: passo ? null : 'efeitos-' + parte, origem: 'efeitos' });
  visto = chave(estilo());
}

ouvir(MEUS, (lote) => {
  if (!visivel('efeitos')) return;
  if (soDe(lote, MEUS, 'doc', 'efeitos')) return;           // fui eu que mudei: mantém os campos (e o foco)
  if (S.sel && fx && !lote.has('aba') && !lote.has('modo') && chave(estilo()) === visto) return;   // nada mudou aqui
  desenhar();
});

caixa.addEventListener('input', (ev) => {
  const t = ev.target, k = t.dataset.k;
  if (!fx || !k) return;
  const cam = t.closest('.camada');
  const parte = cam ? cam.dataset.parte : t.dataset.parte;
  if (cam) {
    const c = sombras(parte)[+cam.dataset.i];
    c[k] = k === 'cor' ? t.value : k === 'a' ? +t.value / 100 : +t.value || 0;
  } else if (parte === 'cor') fx.cor = { cor: t.value, a: 1 };
  else {
    definirAjuste(fx.filtro, k, +t.value);
    t.parentElement.querySelector('output').textContent = r1(t.value) + t.dataset.un;
  }
  gravar(parte);
});
caixa.addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-acao]');
  if (!b || !S.sel || !fx) return;
  const acao = b.dataset.acao;
  if (acao === 'mais') {
    const parte = b.dataset.parte, nova = novaSombra();
    if (parte === 'filtro') fx.filtro.push({ fn: 'drop-shadow', ...nova }); else fx[parte].push(nova);
    gravar(parte, true); desenhar();
  } else if (acao === 'tirar') {
    const cam = b.closest('.camada'), parte = cam.dataset.parte, alvo = sombras(parte)[+cam.dataset.i];
    const lista = parte === 'filtro' ? fx.filtro : fx[parte];
    lista.splice(lista.indexOf(alvo), 1);
    gravar(parte, true); desenhar();
  } else if (acao === 'copiar') {
    const cs = estilo();
    copiado = { filtro: cs.filter, tsombra: cs.textShadow, csombra: cs.boxShadow, cor: cs.color };
    desenhar(); aviso('efeitos copiados');
  } else if (acao === 'colar' && copiado) {
    mudar((e) => Object.assign(e, copiado));                // em todos os selecionados
  }
});
