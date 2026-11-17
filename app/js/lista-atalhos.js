// lista-atalhos.js — a lista "Atalhos" da aba Transformar: um atalho por linha (tecla · o que faz), em grupos.
// As teclas vêm das preferências (config.js / atalhos.js): se alguém trocar uma tecla no ⚙, a lista acompanha.
import { $, esc, ouvir } from './base.js';
import { COMANDOS, teclaDoComando } from './atalhos.js';
import { modDe, NOME_MOD, mostrarTecla } from './config.js';

const mod = (papel) => NOME_MOD[modDe(papel)];
const cmd = (id) => { const c = COMANDOS.find((x) => x.id === id); return c ? mostrarTecla(teclaDoComando(c)) : '—'; };

// [grupo, [[tecla, o que faz], ...]] — montado na hora (as teclas podem ter mudado)
const grupos = () => [
  ['Selecionar', [
    ['Clique', 'seleciona'],
    [`${mod('somar')} + clique`, 'soma à seleção'],
    [`${mod('ignorarTrava')} + clique`, 'seleciona uma camada travada'],
    [`${mod('ciclar')} + roda`, 'alterna entre os elementos embaixo do mouse'],
    ['Botão direito', 'menu da camada'],
    ['Esc', 'solta a seleção'],
  ]],
  ['Mover', [
    ['Arrastar', 'move (gruda no centro)'],
    [`… + ${mod('eixo')}`, 'trava no eixo'],
    [`… + ${mod('devagar')}`, 'anda devagar'],
    [`… + ${mod('semIma')}`, 'solta o ímã'],
    ['Setas', 'movem 1 px (Shift: 10 px)'],
  ]],
  ['Alças da caixa', [
    ['Cantos', `tamanho (${mod('alcaLivre')}: livre)`],
    ['Lados', 'largura / altura'],
    ['Bolinha', `gira (${mod('alcaLivre')}: de 15 em 15°)`],
    [`… + ${mod('alcaCentro')}`, 'a partir do centro'],
    ['Roda do mouse', 'muda o tamanho'],
  ]],
  ['Campos de número', [
    ['Arrastar para os lados', 'muda o valor'],
    [`… + ${mod('rapido')} / ${mod('fino')}`, 'rápido / fino'],
  ]],
  ['Texto e itens', [
    [`Duplo clique · ${cmd('texto')}`, 'edita o texto (Esc termina)'],
    [cmd('apagar'), 'apaga um item ★ (ou a chave marcada)'],
  ]],
  ['Geral', [
    [cmd('desfazer'), 'desfaz'],
    [cmd('refazer'), 'refaz'],
    [cmd('salvar'), 'salva'],
    [cmd('tocar'), 'toca / pausa (no Animar)'],
  ]],
];

function desenhar() {
  const caixa = $('listaAtalhos');
  if (!caixa) return;
  caixa.innerHTML = grupos().map(([g, linhas]) => `<div class="at-grupo">${esc(g)}</div>`
    + linhas.map(([t, o]) => `<div class="at-linha"><kbd>${esc(t)}</kbd><span>${esc(o)}</span></div>`).join('')).join('');
}
ouvir('config', desenhar);
desenhar();

// ▾ / ▸ ao lado do título: recolhe ou abre a lista (fica guardado no navegador)
function recolher(fechar) {
  $('listaAtalhos').classList.toggle('recolhido', fechar);
  $('btnAtalhos').textContent = fechar ? '▸' : '▾';
  $('btnAtalhos').setAttribute('aria-expanded', String(!fechar));
  try { localStorage.setItem('afe:atalhos', fechar ? '0' : '1'); } catch (e) { /* ok */ }
}
let fechado = false;
try { fechado = localStorage.getItem('afe:atalhos') === '0'; } catch (e) { /* ok */ }
recolher(fechado);
// (clicar no título inteiro também recolhe)
$('btnAtalhos').closest('h4').onclick = () => recolher(!$('listaAtalhos').classList.contains('recolhido'));
