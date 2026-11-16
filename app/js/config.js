// config.js — as preferências de quem usa o editor: a tecla de cada comando e o papel de Shift / Alt / Ctrl
// ao usar o mouse. Ficam guardadas no navegador (localStorage): valem para este computador, não mexem nas artes.
//   teclaDe(id, padrao)      tecla de um comando ('ctrl+s', 'space', 'h', '' = sem atalho)
//   temMod(ev, papel)        a tecla que faz esse papel está apertada neste evento do mouse?
//   Só são gravadas as diferenças em relação ao padrão. Quem desenha a tela é painel-config.js; os comandos
//   (e a tecla padrão de cada um) ficam em atalhos.js.
// Este arquivo só importa base.js.
import { avisar } from './base.js';

const CHAVE = 'afe:config';

// Papéis das teclas ao usar o mouse. Dentro de um grupo, cada papel usa uma tecla diferente.
export const PAPEIS = [
  { grupo: 'Arrastar um elemento na arte', papeis: [
    ['eixo', 'Travar no eixo (só para os lados ou só para cima/baixo)', 'shift'],
    ['devagar', 'Andar devagar (ajuste fino)', 'alt'],
    ['semIma', 'Soltar o ímã do centro', 'ctrl'] ] },
  { grupo: 'Alças da caixa de seleção', papeis: [
    ['alcaLivre', 'Cantos livres (largura e altura separadas) e giro de 15 em 15°', 'shift'],
    ['alcaCentro', 'Mudar a partir do centro', 'alt'] ] },
  { grupo: 'Arrastar dentro de um campo de número', papeis: [
    ['rapido', 'Mais rápido (10×)', 'shift'],
    ['fino', 'Mais devagar (ajuste fino)', 'alt'] ] },
  { grupo: 'Selecionar na arte', papeis: [
    ['somar', 'Somar à seleção (clique)', 'shift'],
    ['ignorarTrava', 'Selecionar mesmo uma camada travada (clique)', 'ctrl'],
    ['ciclar', 'Alternar entre os elementos embaixo do mouse (com a roda)', 'alt'] ] },
];
export const NOME_MOD = { shift: 'Shift', alt: 'Alt', ctrl: 'Ctrl' };
const PADRAO_MODS = Object.fromEntries(PAPEIS.flatMap((g) => g.papeis.map(([id, , tecla]) => [id, tecla])));

let cfg = { teclas: {}, mods: {} };                         // só o que foi mudado
try { cfg = { teclas: {}, mods: {}, ...JSON.parse(localStorage.getItem(CHAVE) || '{}') }; } catch (e) { /* sem armazenamento: usa o padrão */ }
function gravar() {
  try {
    if (Object.keys(cfg.teclas).length || Object.keys(cfg.mods).length) localStorage.setItem(CHAVE, JSON.stringify(cfg));
    else localStorage.removeItem(CHAVE);
  } catch (e) { /* sem armazenamento: vale só até fechar a página */ }
  avisar('config');
}

// ── teclas dos comandos ──
export const teclaDe = (id, padrao = '') => (id in cfg.teclas ? cfg.teclas[id] : padrao);
export const teclaMudada = (id) => id in cfg.teclas;
export function definirTecla(id, tecla, padrao = '') {
  if (tecla === padrao) delete cfg.teclas[id]; else cfg.teclas[id] = tecla;
  gravar();
}

// ── teclas do mouse ──
export const modDe = (papel) => cfg.mods[papel] || PADRAO_MODS[papel];
export function temMod(ev, papel) {
  const m = modDe(papel);
  return m === 'shift' ? ev.shiftKey : m === 'alt' ? ev.altKey : ev.ctrlKey || ev.metaKey;
}
// troca a tecla de um papel. Se outro papel do mesmo grupo já usava essa tecla, os dois trocam de lugar.
export function definirMod(papel, tecla) {
  const grupo = PAPEIS.find((g) => g.papeis.some(([id]) => id === papel));
  const antiga = modDe(papel), outro = grupo.papeis.map(([id]) => id).find((id) => id !== papel && modDe(id) === tecla);
  const por = (id, t) => { if (t === PADRAO_MODS[id]) delete cfg.mods[id]; else cfg.mods[id] = t; };
  por(papel, tecla);
  if (outro) por(outro, antiga);
  gravar();
}

export const temMudancas = () => Object.keys(cfg.teclas).length > 0 || Object.keys(cfg.mods).length > 0;
export function voltarAoPadrao() { cfg = { teclas: {}, mods: {} }; gravar(); }

// ── nomes de tecla ──
// "combinação" de um evento de teclado, sempre na mesma ordem: ctrl+alt+shift+tecla (minúsculas; espaço = 'space').
// Devolve '' enquanto só há teclas modificadoras apertadas.
export function comboDe(ev) {
  const k = ev.key === ' ' ? 'space' : ev.key === '+' ? 'mais' : String(ev.key || '').toLowerCase();
  if (['control', 'shift', 'alt', 'meta', 'altgraph', 'dead', ''].includes(k)) return '';
  return (ev.ctrlKey || ev.metaKey ? 'ctrl+' : '') + (ev.altKey ? 'alt+' : '') + (ev.shiftKey ? 'shift+' : '') + k;
}
const BONITO = { space: 'Espaço', delete: 'Delete', backspace: 'Backspace', enter: 'Enter', escape: 'Esc', tab: 'Tab',
  mais: '+', arrowleft: '←', arrowright: '→', arrowup: '↑', arrowdown: '↓', ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift' };
// como mostrar uma combinação na tela: 'ctrl+shift+z' → 'Ctrl + Shift + Z'
export const mostrarTecla = (combo) => (!combo ? '—' : combo.split('+').map((p) => BONITO[p] || (p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1))).join(' + '));
