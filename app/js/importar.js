// importar.js — imagens trazidas do computador (arrastar e soltar um arquivo no editor).
//   soltar em cima da ARTE (ou na área em volta, ou na lista de camadas) → a imagem é gravada na pasta desta arte
//     (<pasta da arte>/assets/importadas/) e vira uma camada ★, onde foi solta;
//   soltar na aba ASSETS → vai para "Assets gerais" (<pasta das artes>/assets-gerais/) e aparece na aba Assets de
//     todas as artes; ao usar numa arte, é copiada para a pasta dela (como as imagens das bibliotecas).
// Só PNG, JPG, WebP, GIF e AVIF (o servidor confere o conteúdo). Quem grava é o servidor.py (/api/importar).
import { S, $, aviso, ouvir } from './base.js';
import { api } from './api.js';
import { adicionarNovo, recarregarAssets } from './painel-assets.js';
import { definirEdicao } from './paineis.js';

const ACEITAS = /\.(png|jpe?g|webp|gif|avif)$/i;
const LIMITE = 15 * 1024 * 1024;                            // o servidor aceita pedidos de até ~20 MB (com a codificação)

const temArquivos = (ev) => [...(ev.dataTransfer && ev.dataTransfer.types || [])].includes('Files');
function lerBase64(arq) {
  return new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] || '');
    r.onerror = () => falha(r.error);
    r.readAsDataURL(arq);
  });
}
// devolve só as imagens aceitas (avisa das outras)
function imagens(ev) {
  const todas = [...(ev.dataTransfer.files || [])];
  const boas = todas.filter((f) => ACEITAS.test(f.name) && f.size <= LIMITE);
  const ruins = todas.length - boas.length;
  if (ruins) aviso(`${ruins} arquivo(s) ignorado(s): só imagens PNG, JPG, WebP, GIF ou AVIF de até 15 MB`, 'sujo', 5000);
  return boas;
}
async function enviar(arq, destino) {
  return api.importar(S.arquivo, destino, arq.name, await lerBase64(arq));
}

// para a ARTE: cada imagem vira uma camada (x, y = ponto da arte; sem = centro). Várias: uma ao lado da outra.
export async function importarParaArte(arquivos, x, y) {
  if (!S.lib || !arquivos.length) return;
  if (!S.editando) definirEdicao(true);
  let i = 0;
  for (const arq of arquivos) {
    try {
      const { src } = await enviar(arq, 'arte');
      await adicionarNovo({ tipo: 'img', src }, x != null ? x + i * 40 : undefined, y != null ? y + i * 40 : undefined);
      i++;
    } catch (e) { aviso('não consegui trazer ' + arq.name + ': ' + e.message, 'erro', 6000); }
  }
  if (i) aviso(i === 1 ? 'imagem trazida para a pasta desta arte ✓' : `${i} imagens trazidas para a pasta desta arte ✓`);
}
// para "Assets gerais" (todas as artes)
export async function importarParaAssets(arquivos) {
  if (!S.lib || !arquivos.length) return;
  let i = 0;
  for (const arq of arquivos) {
    try { await enviar(arq, 'geral'); i++; } catch (e) { aviso('não consegui trazer ' + arq.name + ': ' + e.message, 'erro', 6000); }
  }
  if (i) { await recarregarAssets(); aviso(`${i} imagem(ns) em ★ Assets gerais (valem para todas as artes) ✓`); }
}

// ── onde dá para soltar ──
function alvo(el, quando) {
  el.addEventListener('dragover', (ev) => {
    if (!temArquivos(ev)) return;
    ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy';
    el.classList.add('soltar-aqui');
  });
  el.addEventListener('dragleave', (ev) => { if (!el.contains(ev.relatedTarget)) el.classList.remove('soltar-aqui'); });
  el.addEventListener('drop', (ev) => {
    el.classList.remove('soltar-aqui');
    if (!temArquivos(ev)) return;
    ev.preventDefault(); ev.stopPropagation();
    quando(imagens(ev), ev);
  });
}
alvo($('pn-assets'), (arqs) => importarParaAssets(arqs));
alvo($('pn-camadas'), (arqs) => importarParaArte(arqs));
alvo(document.querySelector('main'), (arqs) => importarParaArte(arqs));
// dentro da arte (o documento é novo a cada carga): solta onde o mouse está
ouvir('arte', () => {
  const d = S.d;
  if (!d || !S.lib) return;
  d.addEventListener('dragover', (ev) => { if (temArquivos(ev)) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; } });
  d.addEventListener('drop', (ev) => {
    if (!temArquivos(ev)) return;
    ev.preventDefault(); ev.stopPropagation();
    importarParaArte(imagens(ev), ev.clientX, ev.clientY);
  }, true);
});
// arquivo solto fora desses lugares: o navegador abriria a imagem no lugar do editor — impede
addEventListener('dragover', (ev) => { if (temArquivos(ev)) ev.preventDefault(); });
addEventListener('drop', (ev) => { if (temArquivos(ev)) { ev.preventDefault(); aviso('solte a imagem em cima da arte (vira camada) ou na aba Assets (vale para todas as artes)', '', 5000); } });
