// barra-topo.js — a barra de cima: páginas, escolha da arte, Editar/Animar, desfazer/refazer, salvar, status
// e os botões que abrem/fecham os painéis laterais.
import { S, $, esc, ouvir, statusPadrao } from './base.js';
import { api } from './api.js';
import { podeDesfazer, podeRefazer, desfazer, refazer, salvar } from './doc.js';
import { definirEdicao, definirAnimacao, abrirLado, ladoAberto } from './paineis.js';
import { irPagina, abrirArte } from './navegacao.js';

function atualizar() {
  $('pag').textContent = S.total ? `${S.pagina}/${S.total}` : String(S.pagina);
  $('ant').disabled = S.pagina <= 1;
  $('prox').disabled = !!S.total && S.pagina >= S.total;
  $('btnEditar').disabled = !S.lib;
  $('btnEditar').title = S.lib ? 'Liga/desliga a edição manual' : 'Esta arte ainda não está ligada ao editor (rode o ligar.py nela)';
  $('btnEditar').classList.toggle('ativo', S.editando);
  $('btnAnimar').classList.toggle('ativo', S.animando);
  $('btnEsq').classList.toggle('ativo', ladoAberto('esq'));
  $('btnDir').classList.toggle('ativo', ladoAberto('dir'));
  $('btnDesf').disabled = !podeDesfazer();
  $('btnRefazer').disabled = !podeRefazer();
  $('btnSalvar').classList.toggle('sujo', S.sujo);
  if (document.activeElement !== $('arq')) $('arq').value = S.arquivo;
}
ouvir(['arte', 'doc', 'modo', 'aba', 'salvo', 'selecao'], atualizar);
ouvir(['doc', 'modo', 'salvo'], statusPadrao);

$('ant').onclick = () => irPagina(S.pagina - 1);
$('prox').onclick = () => irPagina(S.pagina + 1);
$('btnEditar').onclick = () => definirEdicao();
$('btnAnimar').onclick = () => definirAnimacao();
$('btnEsq').onclick = () => abrirLado('esq');
$('btnDir').onclick = () => abrirLado('dir');
$('btnDesf').onclick = desfazer;
$('btnRefazer').onclick = refazer;
$('btnSalvar').onclick = salvar;

// escolha da arte: o campo sugere as artes .html da pasta (✓ = já ligada ao editor)
let quando = 0;
export async function listarArtes() {
  if (Date.now() - quando < 5000) return;
  quando = Date.now();
  try {
    const { itens } = await api.artes();
    $('listaArtes').innerHTML = itens.map((a) =>
      `<option value="${esc(a.caminho)}" label="${a.ligada ? '✓ ligada ao editor' : 'ainda não ligada'}"></option>`).join('');
  } catch (e) { /* sem lista: dá para digitar o caminho */ }
}
$('arq').addEventListener('focus', () => { listarArtes(); $('arq').select(); });
$('arq').addEventListener('change', (ev) => {
  const v = ev.target.value.trim();
  if (v && v !== S.arquivo && !abrirArte(v)) ev.target.value = S.arquivo;
  ev.target.blur();
});
addEventListener('beforeunload', (ev) => { if (S.sujo) { ev.preventDefault(); ev.returnValue = ''; } });
