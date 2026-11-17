// tempo.js — o relógio da animação (tocar, pausar, ir para um frame) e as operações de keyframe:
// gravar, apagar, pular, curva (easing) e copiar/colar.
// A animação conta em frames (FPS = 30): todo keyframe cai num frame inteiro, igual ao vídeo final.
// "refs" = lista de { c, k, canais }: camada (caminho), a chave e, se for só parte dela, os canais (Set).
import { S, FPS, ANIM_PROPS, noFrame, frameDe, limitar, ouvir, avisar, aviso } from './base.js';
import { achar } from './arte.js';
import { pag, entrada, atual, chaveEm, semContinuos, editar, ganchos } from './doc.js';
import { CURVA_PADRAO } from './presets.js';

let ultimoQuadro = 0, fimDoTrecho = null;                   // fimDoTrecho: onde uma prévia para sozinha
// loop: botão ⟲ da barra (aceso = o play repete; apagado = toca uma vez e para no fim). Guardado no navegador.
let loop = true, loopDesta = true;                          // loopDesta: vale para o play em andamento
try { loop = localStorage.getItem('afe:loop') !== '0'; } catch (e) { /* sem armazenamento */ }
export const emLoop = () => loop;
export function definirLoop(v = !loop) {
  loop = v; loopDesta = v;
  try { localStorage.setItem('afe:loop', v ? '1' : '0'); } catch (e) { /* ok */ }
  avisar('tempo');
}
export const duracao = () => pag()._dur || 5;               // segundos (por página)
export const totalFrames = () => Math.round(duracao() * FPS);
export const frameAtual = () => Math.floor(S.tempo * FPS + 0.01);
// instante da CAPA: o que a arte mostra parada (PNG, navegador) e o que o editor mostra fora do modo Animar.
// Sem capa escolhida, é o fim da animação (quando tudo já entrou).
export const capa = () => { const c = pag()._capa; return c != null && c < duracao() ? c : duracao(); };

// ── relógio ──
export function desenharInstante() {
  if (S.lib && S.lib.animado(S.pagina, S.edicoes)) S.lib.quadro(S.pagina, S.tempo, S.edicoes);
  avisar('tempo');
}
export function irPara(t) {
  S.tempo = noFrame(limitar(t, 0, duracao()));
  desenharInstante();
}
// inverter = Shift + play: o contrário do botão de loop, só desta vez
export function tocar(inverter = false) {
  if (S.tocando || !S.lib) return;
  loopDesta = inverter ? !loop : loop;
  if (!loopDesta && S.tempo >= duracao() - 0.5 / FPS) S.tempo = 0;   // parado no fim e sem loop: recomeça
  S.tocando = true;
  ultimoQuadro = performance.now();
  requestAnimationFrame(passo);
  avisar('tempo');
}
export function pausar() {
  if (!S.tocando) return;
  S.tocando = false; fimDoTrecho = null;
  irPara(S.animando ? S.tempo : capa());                    // para num frame inteiro (fora do Animar, volta à capa)
}
// toca só um trecho e para sozinho no fim dele (prévia de uma entrada)
export function tocarTrecho(t0, t1) {
  pausar();
  S.tempo = limitar(t0, 0, duracao());
  tocar();
  fimDoTrecho = Math.min(t1, duracao());
}
export function alternarPlay(inverter = false) { if (S.tocando) pausar(); else tocar(inverter); }
function passo(agora) {
  if (!S.tocando) return;
  S.tempo += (agora - ultimoQuadro) / 1000;
  ultimoQuadro = agora;
  if (fimDoTrecho != null && S.tempo >= fimDoTrecho) { S.tempo = fimDoTrecho; pausar(); return; }
  if (S.tempo >= duracao()) {
    if (loopDesta) S.tempo %= duracao();                    // loop
    else { S.tempo = duracao(); desenharInstante(); pausar(); return; }   // uma vez só: para no fim
  }
  desenharInstante();
  requestAnimationFrame(passo);
}
export function passoFrame(n) { pausar(); irPara((frameAtual() + n) / FPS); }
export function definirDuracao(seg) {
  const v = limitar(+seg || 5, 1, 60);
  editar((P) => { P._dur = v; }, { lote: 'duracao' });
  irPara(Math.min(S.tempo, v));
}
// usa o frame da cabeça como capa (no último frame = volta ao padrão)
export function definirCapa(t = S.tempo) {
  pausar();
  const f = frameDe(t), noFim = f >= totalFrames();
  editar((P) => { if (noFim) delete P._capa; else P._capa = noFrame(f / FPS); });
  aviso(noFim ? 'capa no fim da animação (o padrão)' : `capa no frame ${f}: é o que aparece no PNG`);
}

// ── keyframes ──
// ◆ Chave: grava posição, tamanho, giro, opacidade e brilho de cada selecionado neste frame.
export function gravarChave() {
  if (!S.selPaths.length) { aviso('selecione algo para gravar a chave', 'sujo'); return false; }
  pausar();
  return editar(() => {
    for (const c of S.selPaths) {
      const el = achar(c), e = entrada(c, true);
      const vals = { x: atual('x', c), y: atual('y', c), s: atual('s', c), r: atual('r', c), o: atual('o', c) };
      // brilho e sombras "parados" neste frame (sem os efeitos contínuos, que são somados depois)
      S.lib.estilo(el, S.lib.valores(S.pagina, c, S.tempo, semContinuos(c)));
      const cs = S.w.getComputedStyle(el);
      for (const [k, css] of [['filtro', 'filter'], ['tsombra', 'textShadow'], ['csombra', 'boxShadow']]) {
        if (cs[css] && cs[css] !== 'none') vals[k] = S.lib.normCor(cs[css]);
      }
      Object.assign(chaveEm(e, S.tempo), vals);
    }
  });
}
// ✕ Chave: apaga o keyframe deste frame nos selecionados
export function apagarChave() {
  const f = frameAtual();
  const tem = S.selPaths.some((c) => (entrada(c).kf || []).some((k) => frameDe(k.t) === f));
  if (!tem) { aviso('não há chave neste frame', 'sujo'); return false; }
  pausar();
  return editar(() => {
    for (const c of S.selPaths) { const e = entrada(c); if (e.kf) e.kf = e.kf.filter((k) => frameDe(k.t) !== f); }
  }, { reaplicar: true });
}
// ‹ › : pula para o keyframe anterior/próximo da camada principal
export function pularChave(dir) {
  const fs = (entrada().kf || []).map((k) => frameDe(k.t)).sort((a, b) => a - b), f = frameAtual();
  const alvo = dir > 0 ? fs.find((x) => x > f) : fs.reverse().find((x) => x < f);
  if (alvo != null) { pausar(); irPara(alvo / FPS); }
}

// ── chave de UMA propriedade (botões ‹ ◇ › ao lado dos campos da aba Transformar) ──
// o elemento principal tem chave dessa propriedade neste frame? / em algum frame?
// p = uma propriedade ('x') ou um grupo delas ('x,y': a linha da Posição, 'sx,sy': a do Esticar)
const props = (p) => String(p).split(',');
const temAlguma = (k, p) => props(p).some((q) => k[q] !== undefined);
export const temChaveDe = (p, c = S.selCaminho, f = frameAtual()) => (entrada(c).kf || []).some((k) => frameDe(k.t) === f && temAlguma(k, p));
export const temChavesDe = (p, c = S.selCaminho) => (entrada(c).kf || []).some((k) => temAlguma(k, p));
// ◇ : põe a chave dessa propriedade neste frame (com o valor que está na tela) — ou tira, se já existe.
// Vale para todos os selecionados; o principal decide se é pôr ou tirar.
export function alternarChaveDe(p) {
  if (!S.selPaths.length) return false;
  pausar();
  const f = frameAtual(), tirar = temChaveDe(p);
  return editar(() => {
    for (const c of S.selPaths) {
      if (!achar(c)) continue;
      if (tirar) { const k = (entrada(c).kf || []).find((x) => frameDe(x.t) === f); if (k) for (const q of props(p)) delete k[q]; continue; }
      const vs = props(p).map((q) => atual(q, c));          // (lidos antes de criar a chave)
      const k = chaveEm(entrada(c, true), S.tempo);
      props(p).forEach((q, i) => { k[q] = vs[i]; });
    }
  }, { reaplicar: tirar });
}
// ‹ › : pula para a chave anterior/próxima que tem essa propriedade (no elemento principal)
export function pularChaveDe(p, dir) {
  const fs = (entrada().kf || []).filter((k) => temAlguma(k, p)).map((k) => frameDe(k.t)).sort((a, b) => a - b), f = frameAtual();
  const alvo = dir > 0 ? fs.find((x) => x > f) : fs.reverse().find((x) => x < f);
  if (alvo != null) { pausar(); irPara(alvo / FPS); }
}

// ── curva (easing): como o valor anda desta chave até a próxima ──
// chaves dos selecionados no frame da cabeça
export function chavesNoFrame(caminhos = S.selPaths, f = frameAtual()) {
  const refs = [];
  for (const c of caminhos) {
    const k = (entrada(c).kf || []).find((x) => frameDe(x.t) === f);
    if (k) refs.push({ c, k, canais: null });
  }
  return refs;
}
// curva das chaves: o nome dela · '' se forem diferentes entre si · null se não há chave
export function curvaDe(refs) {
  if (!refs.length) return null;
  const nomes = new Set(refs.map((r) => r.k.ease || CURVA_PADRAO));
  return nomes.size === 1 ? [...nomes][0] : '';
}
export function definirCurva(refs, curva) {
  if (!refs.length) { aviso('marque uma chave na folha (ou pare a cabeça em cima de uma)', 'sujo'); return false; }
  return editar(() => { for (const { k } of refs) { if (curva === CURVA_PADRAO) delete k.ease; else k.ease = curva; } });
}

// ── copiar e colar chaves ──
let copia = null;                                           // { arquivo, pagina, itens: [{ c, df, dados, inteira, ease }] }
export const temCopia = () => !!copia;
export function copiarChaves(refs) {
  if (!refs.length) { aviso('marque uma chave na folha (ou pare a cabeça em cima de uma)', 'sujo'); return false; }
  const f0 = Math.min(...refs.map((r) => frameDe(r.k.t)));  // a primeira chave copiada cai onde colar; as outras, depois
  const itens = refs.map(({ c, k, canais }) => {
    const dados = {};
    for (const p of ANIM_PROPS) if (k[p] !== undefined && (!canais || canais.has(p))) dados[p] = k[p];
    return { c, df: frameDe(k.t) - f0, dados, inteira: !canais, ease: k.ease || null };
  });
  copia = { arquivo: S.arquivo, pagina: S.pagina, itens };
  avisar('chave');
  aviso(`${itens.length} ${itens.length > 1 ? 'chaves copiadas' : 'chave copiada'} — Ctrl+V cola onde a cabeça estiver`);
  return true;
}
// Cola no frame f (padrão: a cabeça). Chaves copiadas de UMA camada vão para "em" (caminhos) — ou, sem "em",
// para os selecionados (ou para ela mesma, se nada estiver selecionado).
// Chaves de VÁRIAS camadas voltam cada uma para a sua, no frame novo.
// Chave que já existir no frame recebe os valores por cima. O que passar do fim da animação fica de fora.
export function colarChaves(f = null, em = null) {
  pausar();
  if (f == null) f = frameAtual();
  if (!copia) { aviso('nada copiado ainda — marque uma chave e use Ctrl+C', 'sujo'); return false; }
  const umaOrigem = new Set(copia.itens.map((i) => i.c)).size === 1;
  let destinos = null;                                      // null = cada chave volta para a camada de onde veio
  if (umaOrigem && em && em.length) destinos = em;
  else if (umaOrigem && S.selPaths.length) destinos = S.selPaths;
  else if (copia.arquivo !== S.arquivo || copia.pagina !== S.pagina) {
    aviso(umaOrigem ? 'selecione o elemento que vai receber as chaves' : 'chaves de várias camadas só colam na página de onde vieram', 'sujo', 4000);
    return false;
  }
  const tot = totalFrames(), plano = [];
  let fora = 0;
  for (const item of copia.itens) for (const c of destinos || [item.c]) {
    if (!achar(c)) continue;
    if (f + item.df > tot) { fora++; continue; }
    plano.push([c, f + item.df, item]);
  }
  if (!plano.length) { aviso(fora ? 'não coube: as chaves passariam do fim da animação' : 'não achei onde colar', 'sujo'); return false; }
  editar(() => {
    for (const [c, q, item] of plano) {
      const k = chaveEm(entrada(c, true), q / FPS);
      Object.assign(k, item.dados);
      if (item.inteira) { if (item.ease) k.ease = item.ease; else delete k.ease; }
    }
  });
  aviso(`${plano.length} ${plano.length > 1 ? 'chaves coladas' : 'chave colada'}` + (fora ? ` · ${fora} não coube${fora > 1 ? 'ram' : ''} (passa do fim)` : ''));
  return true;
}

ganchos.antesDeMudar.push(pausar);                          // qualquer edição pausa a animação
// Fora do modo Animar o editor fica parado na capa (igual ao PNG); ao ligar o Animar, vai para o frame 0.
let animava = false;
ouvir('arte', () => {
  if (!S.animando) S.tempo = capa(); else if (S.tempo > duracao()) S.tempo = 0;
  desenharInstante();
});
ouvir('modo', () => {
  if (S.animando === animava) return;                       // (o recado 'modo' também vem do Editar e do minimizar)
  animava = S.animando;
  pausar();
  irPara(S.animando ? 0 : capa());
});
ouvir('doc', () => { if (!S.animando && !S.tocando && S.tempo !== capa()) irPara(capa()); });   // a capa ou a duração mudou
