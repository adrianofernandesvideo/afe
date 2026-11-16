// paineis.js — os modos (Editar, Animar) e a moldura da tela: painéis laterais, abas, minimizar a linha do tempo.
// Cada aba tem o seu arquivo (painel-*.js); este aqui só cuida de abrir, fechar e trocar.
import { S, $, ouvir, avisar, aviso } from './base.js';
import { encaixar } from './arte.js';
import { terminarTexto } from './texto.js';

const corpo = document.body;
let jaEditou = false;

export function definirEdicao(ligar = !S.editando) {
  if (ligar && !S.lib) { aviso('esta arte ainda não está ligada ao editor', 'sujo'); return; }
  if (ligar === S.editando) return;
  S.editando = ligar;
  corpo.classList.toggle('editando', ligar);
  if (!ligar) { terminarTexto(); S.hover = null; }
  if (ligar && !jaEditou) {                                 // primeira vez: abre os dois painéis
    jaEditou = true;
    corpo.classList.add('esq-aberto', 'dir-aberto');
  }
  encaixar(); avisar('modo');
}
export function definirAnimacao(ligar = !S.animando) {
  if (ligar === S.animando) return;
  S.animando = ligar;
  corpo.classList.toggle('animando', ligar);
  encaixar(); avisar('modo');
}
// abre/fecha um painel lateral: qual = 'esq' | 'dir'
export function abrirLado(qual, abrir = !corpo.classList.contains(qual + '-aberto')) {
  corpo.classList.toggle(qual + '-aberto', abrir);
  encaixar(); avisar('aba');
}
export function trocarAba(lado, nome) {
  if (lado === 'esq') S.abaEsq = nome; else S.abaDir = nome;
  const grupo = document.querySelector(`.abas[data-lado="${lado}"]`);
  grupo.querySelectorAll('button').forEach((b) => b.classList.toggle('ativo', b.dataset.aba === nome));
  grupo.parentElement.querySelectorAll(':scope > .painel').forEach((pn) => pn.classList.toggle('ativo', pn.id === 'pn-' + nome));
  avisar('aba');
}
// a aba está na tela agora? (cada painel só se desenha quando está visível)
export const visivel = (nome) => S.editando && (
  (S.abaEsq === nome && corpo.classList.contains('esq-aberto')) ||
  (S.abaDir === nome && corpo.classList.contains('dir-aberto')));
export const ladoAberto = (qual) => corpo.classList.contains(qual + '-aberto');
// minimiza a linha do tempo: some a folha de keyframes, fica só a barra de controles
export function minimizarTempo(mini = !corpo.classList.contains('tempo-mini')) {
  corpo.classList.toggle('tempo-mini', mini);
  encaixar(); avisar('modo');
}
export const tempoMinimizado = () => corpo.classList.contains('tempo-mini');

document.querySelectorAll('.abas').forEach((grupo) => grupo.addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-aba]');
  if (b) trocarAba(grupo.dataset.lado, b.dataset.aba);
}));
// arte sem o editor ligado: sai do modo de edição
ouvir('arte', () => { if (S.editando && !S.lib) definirEdicao(false); });
