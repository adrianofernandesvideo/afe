// painel-transformar.js — aba "Transformar": nome do selecionado, posição, tamanho, giro, opacidade,
// esconder, texto, voltar ao original e alinhar. Vale para todos os selecionados.
// Com o 🎬 Animar ligado, cada campo ganha ‹ ◇ › : ◇ põe/tira a chave daquela propriedade neste frame (◆ = tem
// chave aqui) e ‹ › pulam para a chave anterior/próxima dela.
import { S, $, r1, limitar, ouvir } from './base.js';
import { caminho, nomeDe } from './arte.js';
import { entrada, atual, mudar, removerEdicoes } from './doc.js';
import { selecionar, paraMover } from './selecao.js';
import { iniciarTexto, podeTexto } from './texto.js';
import { centralizar } from './alinhar.js';
import { temChaveDe, temChavesDe, alternarChaveDe, pularChaveDe } from './tempo.js';

const CONTROLES = ['btnPai', 'inX', 'inY', 'inS', 'inSX', 'inSY', 'inR', 'inO', 'inOculto', 'btnTexto', 'btnOrig', 'btnCH', 'btnCV', 'alvoAlinhar'];

function atualizar() {
  const tem = !!S.sel && S.editando, n = S.selPaths.length;
  for (const id of CONTROLES) $(id).disabled = !tem;
  $('btnTexto').disabled = !tem || !podeTexto(S.sel);
  $('selNome').textContent = !tem ? 'nada selecionado — clique em algo na arte'
    : n > 1 ? `${n} selecionados · principal: ${nomeDe(S.sel)}` : nomeDe(S.sel);
  if (tem) {
    $('inX').value = Math.round(atual('x')); $('inY').value = Math.round(atual('y'));
    $('inS').value = Math.round(atual('s') * 100); $('inR').value = r1(atual('r'));
    $('inSX').value = Math.round(atual('sx') * 100); $('inSY').value = Math.round(atual('sy') * 100);
    $('inO').value = Math.round(atual('o') * 100);
    $('inOculto').checked = !!entrada().oculto;
  } else for (const id of ['inX', 'inY', 'inS', 'inSX', 'inSY', 'inR', 'inO']) $(id).value = '';
  for (const grupo of document.querySelectorAll('#pn-transformar .kfs')) {
    const p = grupo.dataset.kf, aqui = tem && temChaveDe(p), alguma = tem && temChavesDe(p);
    const [ant, chave, prox] = grupo.children;
    chave.disabled = !tem; chave.textContent = aqui ? '◆' : '◇'; chave.classList.toggle('ativo', !!aqui);
    chave.title = aqui ? 'Tirar a chave desta propriedade neste frame' : 'Pôr uma chave desta propriedade neste frame';
    ant.disabled = prox.disabled = !alguma;
  }
}
// enquanto a animação toca, os campos ficam parados (atualizam quando ela pausa)
ouvir(['selecao', 'doc', 'tempo', 'arte', 'modo'], () => { if (!S.tocando) atualizar(); });

// X e Y: os selecionados andam a mesma distância (o campo mostra o valor do principal)
const mover = (p) => (ev) => {
  const d = (+ev.target.value || 0) - atual(p);
  mudar((e, c) => { e[p] = atual(p, c) + d; }, { em: paraMover() });
};
$('inX').onchange = mover('x');
$('inY').onchange = mover('y');
// os outros campos: todos os selecionados recebem o mesmo valor
$('inS').onchange = (ev) => mudar((e) => { e.s = Math.max(5, +ev.target.value || 100) / 100; });
$('inSX').onchange = (ev) => mudar((e) => { e.sx = Math.max(5, +ev.target.value || 100) / 100; });
$('inSY').onchange = (ev) => mudar((e) => { e.sy = Math.max(5, +ev.target.value || 100) / 100; });
$('inR').onchange = (ev) => mudar((e) => { e.r = +ev.target.value || 0; });
$('inO').onchange = (ev) => mudar((e) => { e.o = limitar(+ev.target.value, 0, 100) / 100; });
$('inOculto').onchange = (ev) => mudar((e) => { e.oculto = ev.target.checked; });

$('pn-transformar').addEventListener('click', (ev) => {
  const b = ev.target.closest('.kfs button');
  if (!b) return;
  const p = b.parentElement.dataset.kf, d = +b.dataset.d;
  if (d) pularChaveDe(p, d); else alternarChaveDe(p);
});
$('btnPai').onclick = () => {
  const pai = S.sel && S.sel.parentElement;
  if (pai && caminho(pai)) selecionar(pai);
};
$('btnTexto').onclick = () => S.sel && iniciarTexto(S.sel);
$('btnOrig').onclick = () => removerEdicoes();
$('btnCH').onclick = () => centralizar('h', $('alvoAlinhar').value);
$('btnCV').onclick = () => centralizar('v', $('alvoAlinhar').value);
