// painel-transformar.js — aba "Transformar": nome do selecionado, posição, tamanho, giro, opacidade,
// esconder, texto, voltar ao original e alinhar. Vale para todos os selecionados.
// Com o 🎬 Animar ligado, cada campo ganha ‹ ◇ › : ◇ põe/tira a chave daquela propriedade neste frame (◆ = tem
// chave aqui) e ‹ › pulam para a chave anterior/próxima dela. Pares (Posição X/Y, Esticar L/A) ficam numa linha só e
// têm um ◇ para os dois. ↺ volta a linha ao padrão (como o duplo clique num slider). 🔗 (Esticar) liga largura e
// altura: mudar uma muda a outra na mesma proporção (fica guardado no navegador).
import { S, $, r1, limitar, ouvir } from './base.js';
import { caminho, nomeDe } from './arte.js';
import { entrada, atual, mudar, removerEdicoes } from './doc.js';
import { selecionar, paraMover } from './selecao.js';
import { iniciarTexto, podeTexto } from './texto.js';
import { centralizar } from './alinhar.js';
import { temChaveDe, temChavesDe, alternarChaveDe, pularChaveDe } from './tempo.js';
import { confirmarOriginal } from './camada-acoes.js';

const CONTROLES = ['btnPai', 'inX', 'inY', 'inS', 'inSX', 'inSY', 'inR', 'inO', 'inOculto', 'btnTexto', 'btnOrig', 'btnCH', 'btnCV', 'alvoAlinhar', 'btnElo'];
let elo = true;                                             // largura e altura ligadas?
try { elo = localStorage.getItem('afe:elo') !== '0'; } catch (e) { /* sem armazenamento */ }

function atualizar() {
  const tem = !!S.sel && S.editando, n = S.selPaths.length;
  for (const id of CONTROLES) $(id).disabled = !tem;
  for (const b of document.querySelectorAll('#pn-transformar .tf-reset')) b.disabled = !tem;
  $('btnElo').classList.toggle('ativo', elo);
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
// Esticar: com a corrente ligada, a outra medida acompanha na mesma proporção (de cada selecionado)
const esticar = (p, outra) => (ev) => {
  const v = Math.max(5, +ev.target.value || 100) / 100, base = atual(p) || 1;
  mudar((e, c) => {
    if (elo) e[outra] = Math.max(0.05, atual(outra, c) * v / base);
    e[p] = v;
  });
};
$('inSX').onchange = esticar('sx', 'sy');
$('inSY').onchange = esticar('sy', 'sx');
// enquanto arrasta o número de um, o outro já mostra para onde vai (grava ao soltar)
for (const [id, p, outra, campo] of [['inSX', 'sx', 'sy', 'inSY'], ['inSY', 'sy', 'sx', 'inSX']]) {
  $(id).addEventListener('input', (ev) => {
    if (elo && S.sel) $(campo).value = Math.round(atual(outra) * 100 * ((+ev.target.value || 100) / 100) / (atual(p) || 1));
  });
}
$('btnElo').onclick = () => {
  elo = !elo;
  try { localStorage.setItem('afe:elo', elo ? '1' : '0'); } catch (e) { /* ok */ }
  $('btnElo').classList.toggle('ativo', elo);
  $('btnElo').title = elo ? 'Largura e altura ligadas: mudar uma muda a outra na mesma proporção. Clique para soltar.'
    : 'Largura e altura soltas. Clique para ligar.';
};
// ↺ volta a linha ao padrão. Sem chaves: tira a edição (fica o que a arte tinha). Com chaves: grava o padrão
// neste frame (como mexer no campo).
const PADRAO = { x: 0, y: 0, s: 1, sx: 1, sy: 1, r: 0, o: 1 };
$('pn-transformar').addEventListener('click', (ev) => {
  const b = ev.target.closest('.tf-reset');
  if (!b || b.disabled) return;
  const ps = b.dataset.reset.split(',');
  mudar((e) => { for (const q of ps) { if (e.kf && e.kf.length) e[q] = PADRAO[q]; else delete e[q]; } });
});
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
$('btnOrig').onclick = () => confirmarOriginal();
$('btnCH').onclick = () => centralizar('h', $('alvoAlinhar').value);
$('btnCV').onclick = () => centralizar('v', $('alvoAlinhar').value);
