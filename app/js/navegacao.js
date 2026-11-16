// navegacao.js — trocar de página e abrir outra arte.
import { S, avisar } from './base.js';
import { recarregar } from './arte.js';
import { novoDocumento } from './doc.js';
import { terminarTexto } from './texto.js';

function soltarSelecao() { S.selPaths = []; S.selCaminho = null; S.sel = null; S.hover = null; }

export function irPagina(n) {
  if (n < 1 || (S.total && n > S.total) || n === S.pagina) return;
  terminarTexto();
  S.pagina = n;
  soltarSelecao();
  recarregar();                                             // as edições não salvas continuam na memória
  avisar('selecao');
}
// abre outra arte (caminho dentro da pasta das artes). Devolve false se o usuário desistiu.
export function abrirArte(arquivo, pagina = 1) {
  arquivo = (arquivo || '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!arquivo) return false;
  if (S.sujo && !confirm('Há edições não salvas. Trocar de arte e perder?')) return false;
  terminarTexto();
  novoDocumento();
  S.arquivo = arquivo; S.pagina = pagina; S.total = null; S.tempo = 0;
  soltarSelecao();
  recarregar();
  avisar('selecao');
  return true;
}
