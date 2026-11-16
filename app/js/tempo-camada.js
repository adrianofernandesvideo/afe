// tempo-camada.js — o tempo de cada camada, no estilo do After Effects: quando ela aparece ("ini") e quando
// some ("fim"), mover a camada inteira no tempo (as chaves vão junto) e escalonar várias em sequência.
//   ini / fim ficam nas edições da camada, em segundos (sempre em frame inteiro).
//   Sem ini = desde o começo · sem fim = até o final. Fora de ini..fim a camada não aparece.
//   As chaves (kf) continuam em tempo absoluto: por isso MOVER a camada desloca as chaves junto, e CORTAR
//   (mudar só o começo ou só o fim) não mexe nelas.
// Aqui tudo é contado em frames; a conversão para segundos acontece só na hora de gravar.
import { S, FPS, noFrame, frameDe, limitar, aviso } from './base.js';
import { achar } from './arte.js';
import { entrada, editar } from './doc.js';
import { totalFrames } from './tempo.js';
import { ordemDeLeitura } from './alinhar.js';

const seg = (f) => noFrame(f / FPS);
export const inicioDe = (c) => frameDe(entrada(c).ini || 0);
export const fimDe = (c) => { const e = entrada(c); return e.fim != null ? frameDe(e.fim) : null; };   // null = até o final
export const temTempo = (e) => !!e && (e.ini > 0 || e.fim != null);

// "foto" do tempo de uma camada. Num arrasto, as contas partem sempre da foto do começo (não acumulam erro).
// (as chaves são guardadas por referência: use a foto e descarte — não guarde entre uma ação e outra)
export function fotoDe(c) {
  return { c, ini: inicioDe(c), fim: fimDe(c), chaves: (entrada(c).kf || []).map((k) => ({ k, f: frameDe(k.t) })) };
}
// quanto um grupo de camadas pode andar sem nada sair pela esquerda (frame 0) nem pela direita (fim da animação)
export function limitesDe(fotos) {
  const tot = totalFrames();
  let min = -Infinity, max = Infinity;
  for (const ft of fotos) {
    const fs = ft.chaves.map((x) => x.f);
    min = Math.max(min, -Math.min(ft.ini, ...fs));
    max = Math.min(max, tot - Math.max(ft.ini + 1, ...fs));
  }
  return [Math.min(0, min), Math.max(0, max)];
}
// Os dois abaixo mudam o documento: chame de dentro de editar().
// move a camada inteira df frames a partir da foto: começo, fim e chaves
export function deslocar(ft, df) {
  const e = entrada(ft.c, true);
  e.ini = seg(Math.max(0, ft.ini + df));
  if (ft.fim != null) e.fim = seg(ft.fim + df);
  for (const { k, f } of ft.chaves) k.t = seg(Math.max(0, f + df));
}
// corta o começo ('ini') ou o fim ('fim') no frame f, sem mexer nas chaves
export function cortar(ft, parte, f) {
  const e = entrada(ft.c, true), tot = totalFrames();
  if (parte === 'ini') e.ini = seg(limitar(f, 0, (ft.fim ?? tot) - 1));
  else e.fim = seg(limitar(f, ft.ini + 1, tot));           // (fim no final da animação = sem corte: some sozinho)
}

const alvos = (caminhos) => caminhos.filter((c) => achar(c));
// avisa se alguma camada ficou com parte da animação depois do fim (ela não aparece inteira no vídeo)
function avisarSePassa(caminhos, feito) {
  const tot = totalFrames();
  const passam = caminhos.filter((c) => inicioDe(c) >= tot || (entrada(c).kf || []).some((k) => frameDe(k.t) > tot)).length;
  if (passam) aviso(`${feito} · ⚠ ${passam} ${passam > 1 ? 'camadas passam' : 'camada passa'} do fim: aumente a Duração`, 'sujo', 5000);
  else aviso(feito);
}

// "Começa no frame": move a camada inteira (com as chaves) para começar em f. Vale para todos os selecionados.
export function definirInicio(f, caminhos = S.selPaths) {
  const lista = alvos(caminhos);
  if (!lista.length) return false;
  f = Math.max(0, Math.round(+f || 0));
  const fotos = lista.map(fotoDe);
  editar(() => { for (const ft of fotos) deslocar(ft, f - ft.ini); }, { reaplicar: true });
  avisarSePassa(lista, `começa no frame ${f}`);
  return true;
}
// "Some no frame": corta o fim. f = null (campo vazio) tira o corte: a camada fica até o final.
export function definirFim(f, caminhos = S.selPaths) {
  const lista = alvos(caminhos);
  if (!lista.length) return false;
  const fotos = lista.map(fotoDe);
  return editar(() => {
    for (const ft of fotos) { if (f == null) delete entrada(ft.c, true).fim; else cortar(ft, 'fim', Math.round(+f || 0)); }
  }, { reaplicar: true });
}
// corta o começo da camada no frame f (as chaves não mudam)
export function cortarInicio(f, caminhos = S.selPaths) {
  const lista = alvos(caminhos);
  if (!lista.length) return false;
  const fotos = lista.map(fotoDe);
  return editar(() => { for (const ft of fotos) cortar(ft, 'ini', Math.round(+f || 0)); }, { reaplicar: true });
}
// tira os cortes: a camada volta a aparecer do começo ao fim (as chaves não mudam)
export function tirarCortes(caminhos = S.selPaths) {
  const lista = alvos(caminhos).filter((c) => temTempo(entrada(c)));
  if (!lista.length) return false;
  return editar(() => { for (const c of lista) { const e = entrada(c, true); delete e.ini; delete e.fim; } }, { reaplicar: true });
}

// Escalonar: cada camada começa "passo" frames depois da anterior. A primeira fica onde está (a que começa
// mais cedo dá o ponto de partida); as outras são movidas inteiras, com as chaves. passo = 0 alinha todas.
//   ordem: 'leitura' (de cima para baixo, da esquerda para a direita, como estão na tela agora)
//          'clique'  (a ordem em que foram selecionadas)
export function escalonar(passo, ordem = 'leitura', caminhos = S.selPaths) {
  let lista = alvos(caminhos);
  if (lista.length < 2) { aviso('selecione dois ou mais elementos (Shift+clique) para escalonar', 'sujo'); return false; }
  passo = Math.max(0, Math.round(+passo || 0));
  if (ordem === 'leitura') lista = ordemDeLeitura(lista);
  const fotos = lista.map(fotoDe), base = Math.min(...fotos.map((ft) => ft.ini));
  editar(() => fotos.forEach((ft, i) => deslocar(ft, base + i * passo - ft.ini)), { reaplicar: true });
  avisarSePassa(lista, passo ? `${lista.length} camadas escalonadas de ${passo} em ${passo} frames` : `${lista.length} camadas alinhadas no frame ${base}`);
  return true;
}
