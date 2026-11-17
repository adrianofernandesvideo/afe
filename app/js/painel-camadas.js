// painel-camadas.js — aba "Camadas": árvore dos elementos da arte (o de cima da lista fica na frente).
// Clique seleciona (Shift soma), 👁 mostra/esconde, ▸ abre os de dentro, Frente/Trás mudam a ordem (z-index),
// 🗑 apaga itens acrescentados (★), 🔒 = camada travada (clique no cadeado destrava), botão direito = menu da camada.
import { S, $, esc, ouvir } from './base.js';
import { achar, raiz, visual, nomeDe } from './arte.js';
import { pag } from './doc.js';
import { selecionar, definirHover } from './selecao.js';
import { definirEdicao, visivel } from './paineis.js';
import { removerNovos, novosSelecionados } from './painel-assets.js';
import { temTempo } from './tempo-camada.js';
import { mudarOrdem, alternarOculto, alternarTrava, itensDeCamada, definirMescla, apagarCamadas, apagados, restaurarApagados } from './camada-acoes.js';
import { MESCLAS } from './presets.js';
import { abrirMenu } from './menu.js';

const caixa = $('pn-camadas');
// "Embrulho" de um texto só: elemento que não tem texto próprio e tem um único elemento dentro, com texto
// (ex.: <span class="linha"><span class="cor">texto novo</span></span>). Na tela é uma coisa só; devolve o de dentro.
function unicoTexto(el) {
  const dentro = [...el.children].filter(visual);
  if (dentro.length !== 1 || !(dentro[0].textContent || '').trim()) return null;
  for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return null;   // tem texto próprio
  return dentro[0];
}
const abertas = new Set();                                  // caminhos com os "de dentro" à mostra
let visto = '';

// o que do documento aparece na lista (para não redesenhar a árvore a cada pixel de um arrasto)
function resumoDoDoc() {
  const P = pag();
  return Object.entries(P).map(([c, e]) => (c[0] === '_' ? '' :
    c + (e.apagado ? 'X' : '') + (e.oculto ? 'o' : '') + (e.kf ? 'k' : '') + (e.anim ? 'a' : '') + (temTempo(e) ? 't' : '') + (e.ent ? 'e' : '') + (e.trava ? 'T' : '') + (e.mix ? 'm' + e.mix : '') + (e.html != null ? 'h' + e.html.length : ''))).join('|')
    + '#' + (P._novos || []).map((n) => n.id + (n.html || '').length).join(',');
}
function desenhar() {
  if (!S.lib) { caixa.innerHTML = '<div class="vazio">Esta arte ainda não está ligada ao editor.</div>'; return; }
  if (S.selCaminho) {                                       // deixa o selecionado à vista
    const p = S.selCaminho.split('/');
    for (let i = 1; i < p.length; i++) abertas.add(p.slice(0, i).join('/'));
  }
  const P = pag(), linhas = [];
  (function andar(el, base, nivel) {
    const filhos = [...el.children];
    // de cima (frente) para baixo (trás). A imagem de fundo (★ fundo) fica atrás de tudo: vai para o fim da lista.
    const ordem = filhos.map((x, i) => i).reverse();
    ordem.sort((a, b) => !!(filhos[a].dataset && filhos[a].dataset.edFundo) - !!(filhos[b].dataset && filhos[b].dataset.edFundo));
    for (const i of ordem) {
      let ch = filhos[i];
      if (!visual(ch)) continue;
      let c = base ? base + '/' + i : ch.dataset && ch.dataset.edId ? '#' + ch.dataset.edId : String(i);
      // embrulho de um texto só aparece como UMA camada: a de dentro (é a que o clique na arte seleciona).
      // O de fora só aparece se tiver edições ou estiver selecionado (chega-se a ele pelo "⬆ Bloco de fora").
      for (let d = unicoTexto(ch); d && !P[c] && !S.selPaths.includes(c); d = unicoTexto(ch)) {
        c += '/' + [...ch.children].indexOf(d);
        ch = d;
      }
      if ((P[c] || {}).apagado) continue;                   // apagada: some da lista (volta em "Restaurar apagados")
      const e = P[c] || {}, temDentro = nivel < 7 && [...ch.children].some(visual), aberto = abertas.has(c);
      const cls = (c === S.selCaminho ? 'sel' : S.selPaths.includes(c) ? 'extra' : '')
        + (ch.tagName === 'CANVAS' ? ' fundo' : '') + (e.oculto ? ' oculto' : '') + (e.trava ? ' travada' : '');
      linhas.push(`<div class="cam ${cls}" data-c="${esc(c)}" style="padding-left:${8 + nivel * 14}px">
        <span class="seta" data-acao="abrir">${temDentro ? (aberto ? '▾' : '▸') : ''}</span>
        <span class="olho" data-acao="olho" title="Mostrar / esconder">${e.oculto ? '◌' : '👁'}</span>
        <span class="nome">${esc(nomeDe(ch))}</span>${e.trava ? '<span class="cadeado" data-acao="trava" title="Travada: o clique na arte passa por ela. Clique aqui para destravar.">🔒</span>' : ''}${e.mix ? '<span class="tag" title="modo de mesclagem: ' + esc(e.mix) + '">◐</span>' : ''}${e.kf || e.anim || e.ent || temTempo(e) ? '<span class="tag" title="animado">🎬</span>' : ''}</div>`);
      if (temDentro && aberto) andar(ch, c, nivel + 1);
    }
  })(raiz(), '', 0);
  const tem = S.selPaths.length > 0;
  caixa.innerHTML = `
    <h4>Camadas <span class="botoes" style="margin:0">
      <button data-acao="frente" ${tem ? '' : 'disabled'} title="Traz para a frente">⤒ Frente</button>
      <button data-acao="tras" ${tem ? '' : 'disabled'} title="Manda para trás">⤓ Trás</button>
      <button data-acao="apagar" ${tem ? '' : 'disabled'} title="Apagar a camada selecionada (Delete). O código da arte não muda: Ctrl+Z ou 'Restaurar apagados' trazem de volta.">🗑</button></span></h4>
    <label class="mescla" title="Modo de mesclagem (blend mode) da camada selecionada, como no Photoshop. Também no botão direito.">Mesclagem
      <select data-acao="mescla" ${tem ? '' : 'disabled'}>${MESCLAS.map((m) => (m === '-' ? '<option disabled>──────────</option>'
        : `<option value="${m[0]}" ${m[0] === ((P[S.selCaminho] || {}).mix || 'normal') ? 'selected' : ''}>${m[1]}</option>`)).join('')}</select></label>
    ${apagados().length ? `<p class="dica apagados">${apagados().length} apagada(s) · <a href="#" data-acao="restaurar">restaurar</a></p>` : ''}
    <p class="dica">O de cima da lista fica na frente. ★ = acrescentado por você. ◐ = com mesclagem. Shift+clique seleciona vários.</p>
    <div class="cams">${linhas.join('')}</div>`;
  const s = caixa.querySelector('.cam.sel');
  if (s) s.scrollIntoView({ block: 'nearest' });
}
ouvir(['selecao', 'doc', 'arte', 'aba', 'modo'], (lote) => {
  if (!visivel('camadas')) return;
  const agora = S.arquivo + '§' + S.pagina + '§' + S.selPaths.join(',') + '§' + resumoDoDoc();
  if (agora === visto && !lote.has('arte') && !lote.has('aba') && !lote.has('modo')) return;
  visto = agora;
  desenhar();
});

caixa.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-acao]'), linha = ev.target.closest('.cam'), acao = b && b.dataset.acao;
  if (acao === 'frente' || acao === 'tras') {
    mudarOrdem(acao === 'frente' ? 1 : -1);
    return;
  }
  if (acao === 'apagar') { apagarCamadas(); return; }
  if (acao === 'restaurar') { ev.preventDefault(); restaurarApagados(); return; }
  if (!linha) return;
  const c = linha.dataset.c, el = achar(c);
  if (acao === 'abrir') { if (abertas.has(c)) abertas.delete(c); else abertas.add(c); visto = ''; desenhar(); return; }
  if (!el) return;
  if (acao === 'olho') { alternarOculto([c]); return; }     // (não mexe na seleção)
  if (acao === 'trava') { alternarTrava([c]); return; }
  definirEdicao(true);
  selecionar(el, ev.shiftKey);
});
caixa.addEventListener('change', (ev) => {
  if (ev.target.matches('select[data-acao="mescla"]')) { definirMescla(ev.target.value); ev.target.blur(); }
});
caixa.addEventListener('contextmenu', (ev) => {             // botão direito numa camada
  const linha = ev.target.closest('.cam');
  if (!linha || !achar(linha.dataset.c)) return;
  ev.preventDefault();
  abrirMenu(ev.clientX, ev.clientY, itensDeCamada(linha.dataset.c));
});
caixa.addEventListener('mouseover', (ev) => {
  const linha = ev.target.closest('.cam');
  definirHover(linha ? achar(linha.dataset.c) : null);
});
caixa.addEventListener('mouseleave', () => definirHover(null));
