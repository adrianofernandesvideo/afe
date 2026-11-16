// atalhos.js — TODOS os atalhos de teclado do editor num lugar só.
// Valem com o foco na tela do editor ou dentro da arte.
//
// COMANDOS é a lista do que tem atalho: cada um com a tecla padrão, quando vale e o que faz. A tecla de cada
// comando pode ser trocada em ⚙ Config (a escolha fica em config.js); aqui só se pergunta "qual é a tecla agora?".
//   id       nome interno (é o que fica gravado nas preferências: não mude depois de publicado)
//   padrao   tecla padrão: 'ctrl+s', 'space', 'h'...  ('' = sem atalho até a pessoa escolher um)
//   outros   teclas a mais, fixas, que fazem o mesmo (valem enquanto nenhum outro comando usar aquela tecla)
//   quando   () => vale agora?  (se não vale, a tecla segue para o navegador — ex.: Ctrl+C copia texto)
//   emCampo  vale também com o cursor num campo da tela      emTexto  vale também editando um texto da arte
// Teclas fixas (não configuráveis): setas movem 1 px (Shift: 10) — sem seleção, ← → trocam de página;
// Esc solta a seleção / termina o texto.
import { S, ouvir } from './base.js';
import { atual, mudar, desfazer, refazer, salvar, removerEdicoes } from './doc.js';
import { selecionar, paraMover } from './selecao.js';
import { iniciarTexto, terminarTexto, podeTexto } from './texto.js';
import { definirEdicao, definirAnimacao, abrirLado, trocarAba, minimizarTempo } from './paineis.js';
import { centralizar } from './alinhar.js';
import { alternarPlay, passoFrame, gravarChave, definirCapa, copiarChaves, colarChaves, temCopia } from './tempo.js';
import { chavesMarcadas, chavesAlvo, apagarMarcadas, desmarcarChave } from './folha.js';
import { removerNovos, novosSelecionados } from './painel-assets.js';
import { mudarOrdem, alternarOculto, alternarTrava } from './camada-acoes.js';
import { irPagina } from './navegacao.js';
import { teclaDe, comboDe } from './config.js';

const comSelecao = () => S.editando && S.selPaths.length > 0;
const aba = (lado, nome) => () => { abrirLado(lado, true); trocarAba(lado, nome); };

export const COMANDOS = [
  // ── Arquivo ──
  { id: 'salvar', grupo: 'Arquivo', nome: 'Salvar', padrao: 'ctrl+s', emCampo: true, emTexto: true, sempreEngole: true, fazer: () => { if (S.editando) salvar(); } },
  { id: 'desfazer', grupo: 'Arquivo', nome: 'Desfazer', padrao: 'ctrl+z', emCampo: true, fazer: desfazer },
  { id: 'refazer', grupo: 'Arquivo', nome: 'Refazer', padrao: 'ctrl+shift+z', outros: ['ctrl+y'], emCampo: true, fazer: refazer },
  // ── Modos e painéis ──
  { id: 'editar', grupo: 'Modos e painéis', nome: 'Ligar / desligar o ✎ Editar', padrao: 'e', fazer: () => definirEdicao() },
  { id: 'animar', grupo: 'Modos e painéis', nome: 'Ligar / desligar o 🎬 Animar', padrao: 'a', fazer: () => definirAnimacao() },
  { id: 'abaTransformar', grupo: 'Modos e painéis', nome: 'Abrir a aba Transformar', padrao: '1', quando: () => S.editando, fazer: aba('dir', 'transformar') },
  { id: 'abaEfeitos', grupo: 'Modos e painéis', nome: 'Abrir a aba Efeitos', padrao: '2', quando: () => S.editando, fazer: aba('dir', 'efeitos') },
  { id: 'abaForma', grupo: 'Modos e painéis', nome: 'Abrir a aba Forma', padrao: '3', quando: () => S.editando, fazer: aba('dir', 'forma') },
  { id: 'abaAnimacao', grupo: 'Modos e painéis', nome: 'Abrir a aba Animação', padrao: '4', quando: () => S.editando, fazer: aba('dir', 'animacao') },
  { id: 'abaCamadas', grupo: 'Modos e painéis', nome: 'Abrir a aba Camadas', padrao: '5', quando: () => S.editando, fazer: aba('esq', 'camadas') },
  { id: 'abaAssets', grupo: 'Modos e painéis', nome: 'Abrir a aba Assets', padrao: '6', quando: () => S.editando, fazer: aba('esq', 'assets') },
  { id: 'painelEsq', grupo: 'Modos e painéis', nome: 'Mostrar / esconder o painel da esquerda', padrao: '', quando: () => S.editando, fazer: () => abrirLado('esq') },
  { id: 'painelDir', grupo: 'Modos e painéis', nome: 'Mostrar / esconder o painel da direita', padrao: '', quando: () => S.editando, fazer: () => abrirLado('dir') },
  { id: 'miniTempo', grupo: 'Modos e painéis', nome: 'Minimizar / expandir a linha do tempo', padrao: '', quando: () => S.animando, fazer: () => minimizarTempo() },
  { id: 'config', grupo: 'Modos e painéis', nome: 'Abrir estas configurações', padrao: '', fazer: () => document.getElementById('btnConfig').click() },
  // ── Elemento selecionado ──
  { id: 'apagar', grupo: 'Elemento selecionado', nome: 'Apagar (chave marcada na folha, ou item ★)', padrao: 'delete', outros: ['backspace'],
    quando: () => chavesMarcadas().length > 0 || (S.editando && novosSelecionados()),
    fazer: () => { if (chavesMarcadas().length) apagarMarcadas(); else removerNovos(); } },
  { id: 'texto', grupo: 'Elemento selecionado', nome: 'Editar o texto', padrao: 't', quando: () => comSelecao() && podeTexto(S.sel), fazer: () => iniciarTexto(S.sel) },
  { id: 'esconder', grupo: 'Elemento selecionado', nome: 'Esconder / mostrar', padrao: 'h', quando: comSelecao, fazer: () => alternarOculto() },
  { id: 'travar', grupo: 'Elemento selecionado', nome: 'Travar / destravar', padrao: 'l', quando: comSelecao, fazer: () => alternarTrava() },
  { id: 'frente', grupo: 'Elemento selecionado', nome: 'Trazer para a frente', padrao: ']', quando: comSelecao, fazer: () => mudarOrdem(1) },
  { id: 'tras', grupo: 'Elemento selecionado', nome: 'Mandar para trás', padrao: '[', quando: comSelecao, fazer: () => mudarOrdem(-1) },
  { id: 'centroH', grupo: 'Elemento selecionado', nome: 'Centralizar na horizontal', padrao: '', quando: comSelecao, fazer: () => centralizar('h') },
  { id: 'centroV', grupo: 'Elemento selecionado', nome: 'Centralizar na vertical', padrao: '', quando: comSelecao, fazer: () => centralizar('v') },
  { id: 'original', grupo: 'Elemento selecionado', nome: 'Voltar ao original', padrao: '', quando: comSelecao, fazer: () => removerEdicoes() },
  // ── Animação (com o 🎬 Animar ligado) ──
  { id: 'tocar', grupo: 'Animação', nome: 'Tocar / pausar', padrao: 'space', quando: () => S.animando, fazer: alternarPlay },
  { id: 'frameAnt', grupo: 'Animação', nome: 'Frame anterior', padrao: ',', quando: () => S.animando, fazer: () => passoFrame(-1) },
  { id: 'frameProx', grupo: 'Animação', nome: 'Próximo frame', padrao: '.', quando: () => S.animando, fazer: () => passoFrame(1) },
  { id: 'chave', grupo: 'Animação', nome: 'Gravar ◆ Chave', padrao: 'k', quando: () => S.animando && S.selPaths.length > 0, fazer: gravarChave },
  { id: 'copiarChaves', grupo: 'Animação', nome: 'Copiar chaves', padrao: 'ctrl+c', quando: () => S.animando && chavesAlvo().length > 0, fazer: () => copiarChaves(chavesAlvo()) },
  { id: 'colarChaves', grupo: 'Animação', nome: 'Colar chaves', padrao: 'ctrl+v', quando: () => S.animando && temCopia(), fazer: () => colarChaves() },
  { id: 'capa', grupo: 'Animação', nome: 'Usar o frame atual como capa', padrao: '', quando: () => S.animando, fazer: () => definirCapa() },
];
export const teclaDoComando = (cmd) => teclaDe(cmd.id, cmd.padrao);
// os comandos ligados a esta tecla (a escolhida primeiro; depois as teclas "a mais", se ninguém escolheu aquela tecla)
function comandosDa(combo) {
  const diretos = COMANDOS.filter((c) => teclaDoComando(c) === combo);
  return diretos.length ? diretos : COMANDOS.filter((c) => (c.outros || []).includes(combo));
}

function tecla(ev) {
  if (document.body.classList.contains('config-aberta')) return;   // a tela de Config cuida das teclas dela
  const combo = comboDe(ev), tag = ev.target && ev.target.tagName;
  const emCampo = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA', emTexto = !!S.editTexto;
  for (const cmd of combo ? comandosDa(combo) : []) {
    if ((emTexto && !cmd.emTexto) || (emCampo && !cmd.emCampo)) continue;
    if (cmd.quando && !cmd.quando()) { if (cmd.sempreEngole) ev.preventDefault(); continue; }
    ev.preventDefault();
    cmd.fazer();
    return;
  }
  if (emTexto) {                                            // digitando um texto da arte: só o Esc é do editor
    if (ev.key === 'Escape') { ev.preventDefault(); terminarTexto(); }
    return;
  }
  if (ev.ctrlKey || ev.metaKey || emCampo) return;
  if (S.editando && S.selPaths.length && ev.key.startsWith('Arrow')) {
    ev.preventDefault();
    const p = ev.shiftKey ? 10 : 1;
    const dx = ev.key === 'ArrowLeft' ? -p : ev.key === 'ArrowRight' ? p : 0;
    const dy = ev.key === 'ArrowUp' ? -p : ev.key === 'ArrowDown' ? p : 0;
    mudar((e, c) => { e.x = atual('x', c) + dx; e.y = atual('y', c) + dy; }, { em: paraMover(), lote: 'setas' });
    return;
  }
  if (ev.key === 'Escape') { selecionar(null); desmarcarChave(); return; }
  if (ev.key === 'ArrowLeft') irPagina(S.pagina - 1);
  if (ev.key === 'ArrowRight') irPagina(S.pagina + 1);
}
addEventListener('keydown', tecla);
ouvir('arte', () => { if (S.d) S.d.addEventListener('keydown', tecla); });   // documento novo a cada carga
