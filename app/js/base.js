// base.js — o que todos os módulos do editor compartilham:
//   S                estado (arte aberta, modos, seleção, documento de edições, tempo)
//   ouvir / avisar   recados entre os módulos
//   utilitários pequenos ($, esc, r1, frames, status)
// Regras: nenhum módulo guarda cópia do que está em S; quem muda S, avisa. Este arquivo não importa nenhum outro.

export const FPS = 30;                                   // a animação conta em frames (igual ao vídeo)
export const ANIM_PROPS = ['x', 'y', 's', 'sx', 'sy', 'r', 'o', 'filtro', 'tsombra', 'csombra'];   // o que um keyframe guarda
export const PADRAO = { x: 0, y: 0, s: 1, sx: 1, sy: 1, r: 0, o: 1 };   // valor de cada propriedade quando não há edição

export const S = {
  arquivo: '', pagina: 1, total: null,                   // arte aberta (caminho dentro da pasta das artes)
  larg: 1080, alt: 1350, escala: 1,                      // tamanho da arte e zoom usado para caber na tela
  w: null, d: null, lib: null,                           // janela, documento e EDLIB da arte (dentro do iframe)
  editando: false, animando: false, tocando: false,      // modos
  edicoes: {}, sujo: false,                              // documento de edições (todas as páginas) e "não salvo"
  sel: null, selCaminho: null, selPaths: [],             // seleção: elemento e caminho do principal + todos os caminhos
  hover: null, editTexto: null,                          // elemento sob o mouse / com texto em edição
  tempo: 0,                                              // instante da animação (segundos)
  abaEsq: 'camadas', abaDir: 'transformar',              // abas abertas nos painéis laterais
};

// ── utilitários ──
export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const r1 = (v) => +(+v).toFixed(1);
export const limitar = (v, min, max) => Math.max(min, Math.min(max, v));
export const noFrame = (t) => +(Math.round(t * FPS) / FPS).toFixed(4);   // instante arredondado para o frame mais perto
export const frameDe = (t) => Math.round(t * FPS);
export const pastaDe = (arquivo) => arquivo.replace(/[^/]*$/, '');
export const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ── recados entre os módulos ──
// Tipos:
//   arte         a arte terminou de carregar (documento novo dentro do iframe)
//   doc          as edições mudaram (mudança, desfazer, carregar)      — origem = quem mudou
//   selecao      a seleção mudou (ou um texto entrou/saiu de edição)
//   tempo        o instante da animação mudou (ou começou/parou de tocar)
//   modo         ligou/desligou Editar ou Animar
//   aba          trocou de aba ou abriu/fechou um painel lateral
//   layout       o espaço da arte na tela mudou (janela, painéis, imagens que terminaram de carregar)
//   hover        o mouse passou para outro elemento
//   salvo        as edições foram gravadas no disco
//   clique-arte  o usuário clicou na arte
//   chave        mudaram as chaves marcadas na folha de keyframes (ou o que está copiado)
//   config       mudaram as preferências (teclas dos comandos, teclas do mouse)
// Os recados de uma mesma ação são entregues juntos, uma vez só, logo que a ação termina (microtarefa):
// arrastar 5 camadas avisa 'doc' 5 vezes, mas cada ouvinte roda 1 vez. Não depende de a janela estar visível.
const ouvintes = new Map();
let pendentes = new Map(), agendado = false;

export function ouvir(tipos, fn) {
  for (const t of [].concat(tipos)) {
    if (!ouvintes.has(t)) ouvintes.set(t, []);
    ouvintes.get(t).push(fn);
  }
}
export function avisar(tipo, origem = '') {
  if (!pendentes.has(tipo)) pendentes.set(tipo, new Set());
  pendentes.get(tipo).add(origem);
  if (!agendado) { agendado = true; queueMicrotask(entregar); }
}
function entregar() {
  agendado = false;
  const lote = pendentes; pendentes = new Map();
  const feitos = new Set();
  for (const tipo of lote.keys()) {
    for (const fn of ouvintes.get(tipo) || []) {
      if (feitos.has(fn)) continue;                      // ouvinte de vários tipos roda uma vez por entrega
      feitos.add(fn);
      try { fn(lote); } catch (e) { console.error('[editor] erro num ouvinte de "' + tipo + '":', e); }
    }
  }
}
// "lote" (o que o ouvinte recebe) é um Map tipo -> origens. Dos tipos que o ouvinte acompanha ("meus"),
// esta entrega trouxe só "tipo", e só vindo de "origem"? O painel que causou a mudança usa isto para
// não se redesenhar (e perder o foco do campo) no meio da digitação.
export const soDe = (lote, meus, tipo, origem) =>
  meus.every((t) => !lote.has(t) || (t === tipo && [...lote.get(t)].every((o) => o === origem)));

// ── linha de status (canto da barra de cima) ──
let relogio = null;
export function status(txt, cls) {
  clearTimeout(relogio); relogio = null;
  if (!txt) { txt = S.sujo ? '● não salvo' : S.editando ? '● editando' : '● ao vivo'; cls = S.sujo ? 'sujo' : 'vivo'; }
  const el = $('status');
  el.textContent = txt; el.className = cls || '';
}
// mensagem passageira: some sozinha e volta ao status normal
export function aviso(txt, cls = 'vivo', ms = 2500) {
  status(txt, cls);
  relogio = setTimeout(() => { relogio = null; status(); }, ms);
}
// volta ao status normal, a não ser que uma mensagem passageira ainda esteja na tela
export function statusPadrao() { if (!relogio) status(); }
