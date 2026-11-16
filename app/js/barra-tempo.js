// barra-tempo.js — a barra de baixo: tocar, frame atual, duração, botões de keyframe (gravar, apagar, pular,
// curva, copiar, colar), motion blur do vídeo, gerar vídeo, minimizar.
// (As operações em si ficam em tempo.js; aqui é só a ligação com os botões.)
import { S, $, esc, frameDe, ouvir } from './base.js';
import { api, urlArte } from './api.js';
import { salvar, pag, editar } from './doc.js';
import { minimizarTempo, tempoMinimizado } from './paineis.js';
import { duracao, frameAtual, alternarPlay, passoFrame, pausar, definirDuracao, gravarChave, apagarChave, pularChave,
  curvaDe, definirCurva, copiarChaves, colarChaves, temCopia, capa, definirCapa } from './tempo.js';
import { chavesAlvo } from './folha.js';
import { CURVA_PADRAO, nomeCurva } from './presets.js';
import { grafico, abrirCurvas } from './curvas.js';

function atualizar() {
  $('btnPlay').textContent = S.tocando ? '❚❚' : '▶';
  $('tempoTxt').textContent = `frame ${frameAtual()} · ${S.tempo.toFixed(2)} s`;
  if (document.activeElement !== $('inDur')) $('inDur').value = duracao();
  $('selMb').value = String(pag()._mb || 0);
  const semSelecao = !S.selPaths.length;
  for (const id of ['btnKf', 'btnKfDel', 'btnKfAnt', 'btnKfProx']) $(id).disabled = semSelecao;
  const alvo = S.tocando ? [] : chavesAlvo();               // (tocando, os botões de chave ficam parados)
  // botão da curva (easing): vale para as chaves marcadas na folha; sem nenhuma marcada, para as dos
  // selecionados no frame da cabeça. Mostra o gráfico e o nome da curva atual ('' = chaves com curvas diferentes).
  const curva = curvaDe(alvo) ?? CURVA_PADRAO, bc = $('btnCurva');
  bc.disabled = $('btnKfCopiar').disabled = !alvo.length;
  if (bc.dataset.curva !== curva || !!$('curvaGraf').firstChild !== !!(curva && S.lib)) {
    bc.dataset.curva = curva;
    $('curvaNome').textContent = curva ? nomeCurva(curva) : '(várias)';
    $('curvaGraf').innerHTML = curva && S.lib ? grafico(curva, 30, 18) : '';
  }
  $('btnKfColar').disabled = !temCopia();
  $('btnCapa').classList.toggle('ativo', frameDe(capa()) === frameAtual());   // a cabeça está na capa
  const mini = tempoMinimizado();
  $('btnMini').textContent = mini ? '▴' : '▾';
  $('btnMini').title = mini ? 'Expandir a linha do tempo' : 'Minimizar a linha do tempo';
}
ouvir(['tempo', 'doc', 'arte', 'selecao', 'modo', 'chave'], atualizar);

$('btnPlay').onclick = alternarPlay;
$('btnFrAnt').onclick = () => passoFrame(-1);
$('btnFrProx').onclick = () => passoFrame(1);
$('inDur').addEventListener('change', (ev) => definirDuracao(ev.target.value));
$('btnKf').onclick = gravarChave;
$('btnKfDel').onclick = apagarChave;
$('btnKfAnt').onclick = () => pularChave(-1);
$('btnKfProx').onclick = () => pularChave(1);
$('btnCurva').onclick = () => {
  const r = $('btnCurva').getBoundingClientRect();
  abrirCurvas(r.left, r.top - 4, $('btnCurva').dataset.curva, (id) => definirCurva(chavesAlvo(), id), { acima: true });
};
$('btnKfCopiar').onclick = () => copiarChaves(chavesAlvo());
$('btnKfColar').onclick = () => colarChaves();
$('btnCapa').onclick = () => definirCapa();
$('btnMini').onclick = () => minimizarTempo();
// motion blur: só no vídeo (render_anim.py). Gravado por página em "_mb" = abertura do obturador (0 = sem).
$('selMb').addEventListener('change', (ev) => {
  const v = +ev.target.value;
  editar((P) => { if (v) P._mb = v; else delete P._mb; }, { lote: 'mb' });
  ev.target.blur();
});

// ── gerar vídeo: salva, pede ao servidor e acompanha o andamento ──
const dizer = (html) => { $('videoStatus').innerHTML = html; };
async function acompanhar(id) {
  try {
    const j = await api.videoStatus(id);
    if (j.rodando) { dizer(esc(j.ultima || 'gerando…')); setTimeout(() => acompanhar(id), 1000); return; }
    if (!j.ok) dizer('erro: ' + esc(j.ultima || 'não deu certo'));
    else if (j.saida) dizer(`pronto ✓ <a href="${esc(urlArte(j.saida))}?v=${Date.now()}" target="_blank">${esc(j.saida.split('/').pop())}</a>`);
    else dizer('pronto ✓ ' + esc(j.caminho));               // gravou fora da pasta das artes: mostra onde
  } catch (e) { dizer('erro: ' + esc(e.message)); }
  $('btnVideo').disabled = false;
}
$('btnVideo').onclick = async () => {
  pausar();
  if (!S.lib) return;
  if (!S.lib.animado(S.pagina, S.edicoes)) { dizer('esta página não tem animação'); return; }
  if (S.sujo && !(await salvar())) return;
  $('btnVideo').disabled = true;
  dizer(pag()._mb ? 'começando (com motion blur: demora mais)…' : 'começando…');
  try { acompanhar((await api.video(S.arquivo, S.pagina)).id); }
  catch (e) { dizer('erro: ' + esc(e.message)); $('btnVideo').disabled = false; }
};
