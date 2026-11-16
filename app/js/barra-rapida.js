// barra-rapida.js — a faixa logo abaixo da barra de cima (só com ✎ Editar ligado), com o que se usa toda hora:
// alinhar na arte, opacidade, frente/trás, esconder, travar e voltar ao original. Vale para os selecionados.
// São atalhos: as mesmas ações existem nas abas (Transformar, Camadas). As ações em si ficam em alinhar.js e
// camada-acoes.js; aqui é só a ligação com os botões.
import { S, $, limitar, ouvir } from './base.js';
import { entrada, atual, mudar, removerEdicoes } from './doc.js';
import { alinhar } from './alinhar.js';
import { mudarOrdem, alternarOculto, alternarTrava } from './camada-acoes.js';

const barra = $('rapida');

// desenho de cada botão de alinhar: uma linha (a borda ou o meio da arte) e um bloco encostado nela
const DESENHO = {
  esq:  ['M2 1v14', [4, 5, 8, 6]],  ch:  ['M8 1v14', [3, 5, 10, 6]],  dir:  ['M14 1v14', [4, 5, 8, 6]],
  topo: ['M1 2h14', [5, 4, 6, 8]],  cv:  ['M1 8h14', [5, 3, 6, 10]],  base: ['M1 14h14', [5, 4, 6, 8]],
};
for (const b of barra.querySelectorAll('[data-al]')) {
  const [linha, [x, y, w, h]] = DESENHO[b.dataset.al];
  b.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="${linha}" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="currentColor" opacity=".75"/></svg>`;
}

function atualizar() {
  const tem = !!S.sel && S.editando, e = tem ? entrada() : {};
  for (const el of barra.querySelectorAll('button, input')) el.disabled = !tem;
  const o = tem ? Math.round(atual('o') * 100) : 100;
  if (document.activeElement !== $('rpO')) $('rpO').value = o;
  if (document.activeElement !== $('rpOn')) $('rpOn').value = tem ? o : '';
  $('rpOlho').textContent = e.oculto ? '◌ Mostrar' : '👁 Esconder';
  $('rpTrava').textContent = e.trava ? '🔓 Destravar' : '🔒 Travar';
  $('rpTrava').classList.toggle('ativo', !!e.trava);
}
ouvir(['selecao', 'doc', 'tempo', 'arte', 'modo'], () => { if (!S.tocando) atualizar(); });

barra.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-al]');
  if (b) alinhar(b.dataset.al);
});
const opacidade = (ev) => mudar((e) => { e.o = limitar(+ev.target.value || 0, 0, 100) / 100; }, { lote: 'rapida-opacidade' });
$('rpO').addEventListener('input', opacidade);
$('rpOn').addEventListener('change', opacidade);
$('rpFrente').onclick = () => mudarOrdem(1);
$('rpTras').onclick = () => mudarOrdem(-1);
$('rpOlho').onclick = () => alternarOculto();
$('rpTrava').onclick = () => alternarTrava();
$('rpOrig').onclick = () => removerEdicoes();
