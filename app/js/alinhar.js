// alinhar.js — ferramentas de posição na tela: alinhar nas bordas ou no centro, e descobrir a ordem de leitura.
// (Distribuir espaços entra aqui. O "escalonar" no tempo fica em tempo-camada.js e usa a ordem daqui.)
import { achar, caminho, raiz } from './arte.js';
import { mudar, atual } from './doc.js';
import { paraMover } from './selecao.js';

// Alinha cada selecionado.  onde: 'esq' | 'ch' (centro horizontal) | 'dir' | 'topo' | 'cv' (centro vertical) | 'base'
//                          alvo: 'arte' | 'bloco' (o bloco que contém o elemento)
export function alinhar(onde, alvo = 'arte') {
  const caminhos = paraMover();
  if (!caminhos.length) return false;
  const naArte = raiz().getBoundingClientRect(), falta = {};
  for (const c of caminhos) {                               // mede tudo antes de mexer em qualquer um
    const el = achar(c), r = el.getBoundingClientRect(), pai = el.parentElement;
    const ref = alvo === 'bloco' && pai && caminho(pai) ? pai.getBoundingClientRect() : naArte;
    falta[c] = onde === 'esq' ? ref.left - r.left : onde === 'dir' ? ref.right - r.right
      : onde === 'ch' ? (ref.left + ref.width / 2) - (r.left + r.width / 2)
        : onde === 'topo' ? ref.top - r.top : onde === 'base' ? ref.bottom - r.bottom
          : (ref.top + ref.height / 2) - (r.top + r.height / 2);
  }
  const p = ['esq', 'ch', 'dir'].includes(onde) ? 'x' : 'y';
  return mudar((e, c) => { e[p] = atual(p, c) + falta[c]; }, { em: caminhos });
}
// centralizar.  eixo: 'h' | 'v'
export const centralizar = (eixo, alvo = 'arte') => alinhar(eixo === 'h' ? 'ch' : 'cv', alvo);

// os caminhos na ordem de leitura: linha por linha, de cima para baixo, e da esquerda para a direita em cada
// linha. Dois elementos estão na mesma linha quando o meio de um cai perto do meio do outro.
export function ordemDeLeitura(caminhos) {
  const itens = caminhos.map((c) => {
    const r = achar(c).getBoundingClientRect();
    return { c, x: r.left, meio: r.top + r.height / 2, alt: r.height };
  }).sort((a, b) => a.meio - b.meio);
  const linhas = [];
  for (const it of itens) {
    const l = linhas[linhas.length - 1];
    if (l && it.meio - l.meio < Math.min(l.alt, it.alt) / 2) l.itens.push(it);
    else linhas.push({ meio: it.meio, alt: it.alt, itens: [it] });
  }
  return linhas.flatMap((l) => l.itens.sort((a, b) => a.x - b.x).map((it) => it.c));
}
