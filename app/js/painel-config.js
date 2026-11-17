// painel-config.js — a tela ⚙ Config: escolher a tecla de cada comando e o papel de Shift / Alt / Ctrl ao usar
// o mouse. Só a tela: as escolhas ficam em config.js e a lista de comandos em atalhos.js.
//   Trocar uma tecla: clique no botão da tecla, aperte a combinação nova (Esc desiste). Se outro comando já
//   usava aquela tecla, ele fica sem atalho (a tela avisa qual). ✕ deixa o comando sem atalho; ↺ volta ao padrão.
// Enquanto a tela está aberta, os atalhos do editor não funcionam (classe "config-aberta" no <body>).
import { $, esc, ouvir } from './base.js';
import { COMANDOS, teclaDoComando } from './atalhos.js';
import { PAPEIS, NOME_MOD, teclaMudada, definirTecla, modDe, definirMod, temMudancas, voltarAoPadrao, comboDe, mostrarTecla } from './config.js';

const janela = $('config');
let capturando = null, recado = '';                         // id do comando esperando a tecla nova · aviso da última troca

function desenhar() {
  const grupos = [...new Set(COMANDOS.map((c) => c.grupo))];
  $('cfgTeclas').innerHTML = grupos.map((g) => `<h5>${esc(g)}</h5>` + COMANDOS.filter((c) => c.grupo === g).map((c) => {
    const tecla = teclaDoComando(c), esperando = capturando === c.id;
    return `<div class="cfg-linha" data-id="${c.id}"><span class="nome">${esc(c.nome)}</span>
      <button class="tecla ${esperando ? 'ativo' : ''} ${tecla ? '' : 'vazia'}" data-acao="capturar" title="Clique e aperte a tecla nova">${esperando ? 'aperte a tecla…' : esc(mostrarTecla(tecla))}</button>
      <button data-acao="limpar" title="Deixar sem atalho" ${tecla ? '' : 'disabled'}>✕</button>
      <button data-acao="padrao" title="Voltar à tecla padrão (${esc(mostrarTecla(c.padrao))})" ${teclaMudada(c.id) ? '' : 'disabled'}>↺</button></div>`;
  }).join('')).join('');
  $('cfgMods').innerHTML = PAPEIS.map((g) => `<h5>${esc(g.grupo)}</h5>` + g.papeis.map(([id, nome]) =>
    `<div class="cfg-linha"><span class="nome">${esc(nome)}</span><select data-papel="${id}">${Object.entries(NOME_MOD).map(([k, n]) =>
      `<option value="${k}" ${modDe(id) === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`).join('')).join('');
  $('cfgRecado').textContent = recado;
  $('cfgPadrao').disabled = !temMudancas();
}

export function abrirConfig(abrir = janela.hidden) {
  janela.hidden = !abrir;
  document.body.classList.toggle('config-aberta', abrir);
  capturando = null; recado = '';
  if (abrir) desenhar();
}
$('btnConfig').onclick = () => abrirConfig();
$('cfgFechar').onclick = () => abrirConfig(false);
janela.addEventListener('mousedown', (ev) => { if (ev.target === janela) abrirConfig(false); });   // clique fora da caixa fecha

$('cfgTeclas').addEventListener('click', (ev) => {
  const b = ev.target.closest('button[data-acao]'), linha = ev.target.closest('.cfg-linha');
  if (!b || !linha) return;
  const cmd = COMANDOS.find((c) => c.id === linha.dataset.id);
  recado = '';
  if (b.dataset.acao === 'capturar') capturando = capturando === cmd.id ? null : cmd.id;
  else { capturando = null; definirTecla(cmd.id, b.dataset.acao === 'limpar' ? '' : cmd.padrao, cmd.padrao); }
  desenhar();
});
$('cfgMods').addEventListener('change', (ev) => {
  const papel = ev.target.dataset.papel;
  if (papel) { definirMod(papel, ev.target.value); desenhar(); }
});
$('cfgPadrao').onclick = () => {
  // (não tem desfazer: as teclas trocadas se perdem)
  if (!confirm('Voltar TODAS as teclas e as teclas do mouse ao padrão?\n\nAs que você trocou se perdem (isto não tem desfazer).')) return;
  voltarAoPadrao(); capturando = null; recado = 'tudo voltou ao padrão'; desenhar(); };

// a tecla nova: a primeira combinação apertada depois de clicar no botão (Esc desiste)
addEventListener('keydown', (ev) => {
  if (janela.hidden) return;
  if (!capturando) {                                        // Esc fecha a tela (e não chega aos atalhos do editor)
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); abrirConfig(false); }
    return;
  }
  ev.preventDefault(); ev.stopPropagation();
  if (ev.key === 'Escape') { capturando = null; desenhar(); return; }
  const combo = comboDe(ev);
  if (!combo) return;                                       // só Shift/Ctrl/Alt por enquanto: espera a tecla
  const cmd = COMANDOS.find((c) => c.id === capturando);
  const perdeu = COMANDOS.filter((c) => c.id !== cmd.id && teclaDoComando(c) === combo);   // quem usava essa tecla fica sem
  for (const c of perdeu) definirTecla(c.id, '', c.padrao);
  definirTecla(cmd.id, combo, cmd.padrao);
  recado = perdeu.length ? `"${perdeu.map((c) => c.nome).join('", "')}" ficou sem atalho (usava ${mostrarTecla(combo)})` : '';
  capturando = null;
  desenhar();
}, true);
ouvir('config', () => { if (!janela.hidden && !capturando) desenhar(); });
