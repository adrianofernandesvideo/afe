// camada-acoes.js — as ações do dia a dia sobre camadas, num lugar só. Quem chama: a barra rápida, a lista de
// camadas e os menus do botão direito (na arte e na lista).
//   ordem (frente/trás) · esconder/mostrar · travar/destravar · itens de menu de uma camada
//   sobOPonto(x, y)  os elementos da arte embaixo de um ponto (para o clique, o Alt+roda e o botão direito)
// Camada TRAVADA: o clique na arte passa por ela (seleciona o que está atrás). Serve para fundos e blocos
// grandes que atrapalham. Ctrl+clique seleciona mesmo assim; pela lista de camadas ela continua selecionável.
// A trava fica nas edições da camada ("trava": true) — a arte em si ignora esse campo.
import { S, aviso } from './base.js';
import { achar, caminho, visual, nomeDe } from './arte.js';
import { pag, entrada, mudar, removerEdicoes } from './doc.js';
import { selecionar } from './selecao.js';
import { iniciarTexto, podeTexto } from './texto.js';

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
    '-',
    { rotulo: 'Voltar ao original', dica: 'tira todas as edições', desligado: !pag()[c], acao: () => removerEdicoes([c]) },
  ];
}
