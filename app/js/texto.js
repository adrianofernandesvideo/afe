// texto.js — editar o texto de um elemento direto na arte (duplo clique ou botão "✎ Texto").
// O texto novo vira a edição "html" da camada; em item acrescentado (★) ele fica guardado no próprio item.
import { S, avisar } from './base.js';
import { caminho } from './arte.js';
import { pag, entrada, foto, guardarFoto, editar, reaplicar, ganchos } from './doc.js';

let antes = null;                                           // foto do documento antes de digitar (para o desfazer)
const SEM_TEXTO = new Set(['IMG', 'CANVAS', 'VIDEO', 'SVG', 'IFRAME', 'INPUT', 'BR', 'HR', 'PICTURE']);
export const podeTexto = (el) => !!el && !SEM_TEXTO.has(el.tagName.toUpperCase());

// começa a edição. px/py (opcionais): ponto do clique, para o cursor cair ali; senão vai para o fim do texto
export function iniciarTexto(el, px, py) {
  if (!S.lib || !podeTexto(el)) return;
  terminarTexto();
  S.lib.abrirTexto(el);                                     // a lib guarda o texto original e sabe que ele vai mudar
  antes = foto();
  S.editTexto = el;
  el.contentEditable = 'true';
  el.focus();
  const d = S.d;
  let r = px != null && d.caretRangeFromPoint ? d.caretRangeFromPoint(px, py) : null;
  if (!r || !el.contains(r.startContainer)) { r = d.createRange(); r.selectNodeContents(el); r.collapse(false); }
  const s = S.w.getSelection();
  s.removeAllRanges(); s.addRange(r);
  avisar('selecao');
}

export function terminarTexto() {
  const el = S.editTexto;
  if (!el) return;
  S.editTexto = null;
  el.removeAttribute('contenteditable');
  S.w.getSelection().removeAllRanges();
  const c = caminho(el);
  const novo = S.lib.htmlSem(el, { textos: false });        // o que foi digitado, sem os estilos postos pelo editor
  const idNovo = c && /^#[^/]+$/.test(c) ? c.slice(1) : null;
  const item = idNovo ? (pag()._novos || []).find((n) => n.id === idNovo) : null;
  let mudou = false, gravar = null;
  if (item) {
    if (item.html !== novo) { mudou = true; gravar = () => { item.html = novo; }; }
  } else if (c) {
    const orig = S.lib.htmlOriginal(el), era = entrada(c).html ?? orig;
    if (novo !== era) {
      mudou = true;
      gravar = () => { const e = entrada(c, true); if (novo === orig) delete e.html; else e.html = novo; };
    }
  }
  if (mudou) { guardarFoto(antes); editar(gravar, { historia: false, reaplicar: true }); }
  else { reaplicar(); avisar('selecao'); }                  // nada mudou: só devolve a arte ao estado normal
}

ganchos.antesDeHistorico.push(terminarTexto);
