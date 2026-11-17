// camada-acoes.js — as ações do dia a dia sobre camadas, num lugar só. Quem chama: a barra rápida, a lista de
// camadas e os menus do botão direito (na arte e na lista).
//   ordem (frente/trás) · esconder/mostrar · travar/destravar · mesclagem (blend mode) · itens de menu de uma camada
//   sobOPonto(x, y)  os elementos da arte embaixo de um ponto (para o clique, o Alt+roda e o botão direito)
// Camada TRAVADA: o clique na arte passa por ela (seleciona o que está atrás). Serve para fundos e blocos
// grandes que atrapalham. Ctrl+clique seleciona mesmo assim; pela lista de camadas ela continua selecionável.
// A trava fica nas edições da camada ("trava": true) — a arte em si ignora esse campo.
import { S, aviso } from './base.js';
import { achar, caminho, visual, nomeDe } from './arte.js';
import { pag, entrada, mudar, editar, removerEdicoes } from './doc.js';
import { selecionar } from './selecao.js';
import { iniciarTexto, podeTexto } from './texto.js';
import { abrirMenu, posicaoDoMenu } from './menu.js';
import { MESCLAS, nomeMescla } from './presets.js';

const principalDe = (em) => (em === 'selecao' ? S.selCaminho : em[0]);

// a camada está travada? (ela mesma ou algum bloco em volta dela)
export function travada(c) {
  const P = pag(), partes = String(c || '').split('/');
  return partes.some((_, i) => (P[partes.slice(0, i + 1).join('/')] || {}).trava);
}
// elementos da arte embaixo do ponto (px da arte), do da frente para o de trás — só os que dá para selecionar
// (o fundo desenhado em <canvas> fica de fora: seleciona-se pela lista). comTravadas = true inclui os travados.
export function sobOPonto(x, y, comTravadas = false) {
  if (!S.d || !S.lib) return [];
  return S.d.elementsFromPoint(x, y).filter((el) => {
    if (el.tagName === 'CANVAS' || !visual(el)) return false;
    const c = caminho(el);
    return !!c && (comTravadas || !travada(c));
  });
}

// em: 'selecao' (padrão) ou uma lista de caminhos
export function mudarOrdem(passo, em = 'selecao') {
  return mudar((e, c, el) => { e.z = (e.z ?? (parseInt(S.w.getComputedStyle(el).zIndex) || 0)) + passo; }, { em });
}
export function alternarOculto(em = 'selecao') {
  const novo = !entrada(principalDe(em)).oculto;            // o principal decide; os outros acompanham
  return mudar((e) => { e.oculto = novo; }, { em });
}
export function alternarTrava(em = 'selecao') {
  const novo = !entrada(principalDe(em)).trava;
  const feito = mudar((e) => { e.trava = novo; }, { em });
  if (feito) aviso(novo ? 'travada: o clique na arte passa por ela (Ctrl+clique seleciona mesmo assim)' : 'destravada');
  return feito;
}

// ── apagar ──
// Itens ★ (acrescentados) saem das edições. Elementos da ARTE ganham "apagado": somem da arte e da lista de camadas,
// mas o código da arte não muda — voltam com Ctrl+Z ou com "Restaurar apagados". Tudo num passo só do desfazer.
const eNovoCaminho = (c) => /^#[^/]+$/.test(c);
export const apagados = () => Object.entries(pag()).filter(([c, e]) => c[0] !== '_' && e && e.apagado).map(([c]) => c);
export function apagarCamadas(caminhos = S.selPaths, { confirmar = true } = {}) {
  const alvos = caminhos.filter((c) => achar(c));
  if (!alvos.length) return false;
  const nomes = alvos.slice(0, 4).map((c) => nomeDe(achar(c))).join(', ') + (alvos.length > 4 ? '…' : '');
  if (confirmar && !confirm(`Apagar ${alvos.length > 1 ? alvos.length + ' camadas' : 'a camada'} "${nomes}"?\n\n`
    + 'O código da arte não muda: dá para voltar com Ctrl+Z ou com "Restaurar apagados" (botão direito).')) return false;
  const ids = alvos.filter(eNovoCaminho).map((c) => c.slice(1)), daArte = alvos.filter((c) => !eNovoCaminho(c) && c[0] !== '#');
  selecionar(null);
  editar((P) => {
    if (ids.length) {
      for (const n of (P._novos || []).filter((x) => ids.includes(x.id))) for (const c of n.escondeu || []) if (P[c]) delete P[c].oculto;
      P._novos = (P._novos || []).filter((n) => !ids.includes(n.id));
      for (const c of Object.keys(P)) if (c[0] === '#' && ids.includes(c.slice(1).split('/')[0])) delete P[c];
    }
    for (const c of daArte) entrada(c, true).apagado = true;
  }, { reaplicar: true });
  aviso(daArte.length ? 'apagada — Ctrl+Z desfaz, ou botão direito → Restaurar apagados' : 'apagado — Ctrl+Z desfaz', '', 5000);
  return true;
}
export function restaurarApagados() {
  const lista = apagados();
  if (!lista.length) return false;
  editar((P) => { for (const c of lista) delete P[c].apagado; }, { reaplicar: true });
  aviso(lista.length > 1 ? `${lista.length} camadas restauradas` : 'camada restaurada');
  return true;
}

// modo de mesclagem (blend mode) das camadas: v = valor do CSS ('normal' tira o campo "mix")
export function definirMescla(v, em = 'selecao') {
  return mudar((e) => { if (!v || v === 'normal') delete e.mix; else e.mix = v; }, { em, lote: 'mescla' });
}
// menu com os modos (o atual marcado). x, y = onde abrir
export function menuMescla(x, y, em = 'selecao') {
  const atual = entrada(principalDe(em)).mix || 'normal';
  abrirMenu(x, y, [{ titulo: 'Mesclagem' }, ...MESCLAS.map((m) => (m === '-' ? '-'
    : { rotulo: m[1], marcado: m[0] === atual, acao: () => definirMescla(m[0], em) }))]);
}

// "Voltar ao original" tira TODAS as edições das camadas: pergunta antes
export function confirmarOriginal(caminhos = S.selPaths) {
  const alvos = caminhos.filter((c) => pag()[c]);
  if (!alvos.length) return false;
  if (!confirm(`Voltar ${alvos.length > 1 ? 'as ' + alvos.length + ' camadas' : 'a camada'} ao original?\n\nTira todas as edições `
    + '(posição, tamanho, efeitos, animação…). Dá para desfazer com Ctrl+Z.')) return false;
  return removerEdicoes(alvos);
}

// itens de menu (botão direito) para a camada de caminho "c"
export function itensDeCamada(c) {
  const el = achar(c), e = entrada(c);
  if (!el) return [];
  return [
    { titulo: nomeDe(el) },
    { rotulo: 'Trazer para a frente', acao: () => mudarOrdem(1, [c]) },
    { rotulo: 'Mandar para trás', acao: () => mudarOrdem(-1, [c]) },
    '-',
    { rotulo: e.oculto ? 'Mostrar' : 'Esconder', acao: () => alternarOculto([c]) },
    { rotulo: e.trava ? 'Destravar' : 'Travar', dica: e.trava ? '' : 'o clique na arte passa por ela', acao: () => alternarTrava([c]) },
    { rotulo: 'Editar o texto', desligado: !podeTexto(el), acao: () => { selecionar(el); iniciarTexto(el); } },
    { rotulo: 'Mesclagem: ' + nomeMescla(e.mix) + '  ▸', dica: 'blend mode', acao: () => menuMescla(...posicaoDoMenu(), [c]) },
    '-',
    { rotulo: 'Voltar ao original', dica: 'tira todas as edições', desligado: !pag()[c], acao: () => confirmarOriginal([c]) },
    { rotulo: 'Apagar', atalho: 'Delete', acao: () => apagarCamadas(S.selPaths.includes(c) ? S.selPaths : [c]) },
    ...(apagados().length ? [{ rotulo: `Restaurar apagados (${apagados().length})`, acao: restaurarApagados }] : []),
  ];
}
