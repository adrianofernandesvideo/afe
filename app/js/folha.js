// folha.js — folha de keyframes (estilo "dope sheet" do Blender), contada em frames.
// Linhas: Resumo (todas as chaves da página) > cada camada animada > canais (X, Y, tamanho...) e efeitos contínuos.
//   régua     clique/arraste move a cabeça (linha azul com o número do frame)
//   losango   clique = marca, vai para o frame e seleciona a camada · Shift+clique = marca mais um (ou desmarca)
//             arraste = move as chaves marcadas · Delete = apaga as marcadas
//             botão direito = curva (easing), copiar, colar, apagar
//             (num canal, Delete e copiar valem só para aquele canal; arrastar e curva valem para a chave inteira)
//   O formato do losango mostra a curva do trecho que sai daquela chave (ver .losango.c-* no editor.css).
//   ▼ na régua = frame da capa (o que sai no PNG) · faixa listrada no começo da barra = efeito de entrada
//   barra da camada (faixa atrás dos losangos) = quando a camada aparece. Arrastar o meio move a camada
//             inteira (as chaves vão junto; com várias selecionadas, todas andam) · as pontas cortam o
//             começo e o fim · clique = leva a cabeça · botão direito = começar/cortar aqui
import { S, $, FPS, esc, noFrame, frameDe, limitar, ouvir, avisar, soDe } from './base.js';
import { achar, nomeDe } from './arte.js';
import { pag, editar } from './doc.js';
import { selecionar } from './selecao.js';
import { definirEdicao, tempoMinimizado } from './paineis.js';
import { totalFrames, frameAtual, irPara, pausar, chavesNoFrame, curvaDe, definirCurva, copiarChaves, colarChaves, temCopia,
  capa, definirCapa } from './tempo.js';
import { nomeContinuo, CURVA_PADRAO, nomeCurva, nomeEntrada } from './presets.js';
import { itensDeCurva, animarBolinhas } from './curvas.js';
import { abrirMenu } from './menu.js';
import { fotoDe, limitesDe, deslocar, cortar, temTempo, definirInicio, cortarInicio, definirFim, tirarCortes } from './tempo-camada.js';

const caixa = $('folha');
const MEUS = ['doc', 'selecao', 'arte', 'layout', 'modo'];
const CANAIS = [['x', 'Posição X'], ['y', 'Posição Y'], ['s', 'Tamanho'], ['sx', 'Largura'], ['sy', 'Altura'], ['r', 'Giro'], ['o', 'Opacidade'],
  ['filtro', 'Brilho / glow'], ['tsombra', 'Sombra do texto'], ['csombra', 'Sombra da caixa']];
const abertas = new Set();                                  // camadas com os canais à mostra
const marcados = new Set();                                 // ids dos losangos marcados (Delete, curva e copiar agem neles)
let losangos = [];                                          // { refs: [{c, k}], canal, f, id } de cada losango desenhado
let arrasto = null;                                         // { tipo: 'regua' } | { tipo: 'chave', info, x0, df, chaves, origens, ids, movido }
                                                            // | { tipo: 'camada', parte: 'mover'|'ini'|'fim', x0, f0, df, fotos, movido }
let resumoAberto = true, refazendo = false;

const pct = (f) => (f / Math.max(1, totalFrames())) * 100;
const pistaDaRegua = () => caixa.querySelector('.regua .pista');
const visivelAgora = () => S.animando && !tempoMinimizado() && !!S.lib;
const animadas = () => Object.entries(pag()).filter(([c, e]) => c[0] !== '_' && ((e.kf && e.kf.length) || (e.anim && e.anim.length) || temTempo(e) || e.ent));
// faixa do efeito de entrada: do começo da camada até o fim da entrada
const faixaDaEntrada = (e, classe = '') => (e.ent ? `<div class="barra-entrada ${classe}"
  style="left:${pct(frameDe(e.ini || 0))}%;width:${pct(Math.max(1, frameDe(e.ent.dur || 1)))}%"></div>` : '');
// barra do tempo da camada: de quando ela aparece até quando some (sem corte nenhum = a linha toda, bem clara)
function barraDaCamada(e, tot) {
  const ini = frameDe(e.ini || 0), fim = e.fim != null ? Math.min(frameDe(e.fim), tot) : tot;
  return `<div class="barra-camada ${temTempo(e) ? '' : 'inteira'}" style="left:${pct(ini)}%;width:${pct(Math.max(1, fim - ini))}%"
    title="aparece do frame ${ini} ao ${fim} · arraste para mover a camada (as chaves vão junto) · as pontas cortam o começo e o fim">
    <i class="alca ini"></i><i class="alca fim"></i></div>`;
}
// de quantos em quantos frames escrever o número na régua (pelo menos ~46 px entre eles)
function passoDaRegua() {
  const p = pistaDaRegua(), larg = p ? p.getBoundingClientRect().width : 600;
  const porFrame = larg / Math.max(1, totalFrames());
  return [1, 2, 5, 6, 10, 15, 30, 60, 90, 150, 300].find((n) => n * porFrame >= 46) || 300;
}
const linha = (cls, nome, pista, extra = '') =>
  `<div class="fl ${cls}" ${extra}><div class="nm">${nome}</div><div class="tr"><div class="pista">${pista}</div></div></div>`;
function losango(refs, canal, f, id) {
  losangos.push({ refs, canal, f, id });
  const curva = curvaDe(refs);                              // '' = chaves com curvas diferentes (losango comum)
  return `<div class="losango ${curva && curva !== CURVA_PADRAO ? 'c-' + curva : ''} ${marcados.has(id) ? 'marcado' : ''}" data-l="${losangos.length - 1}"
    style="left:${pct(f)}%" title="frame ${f}${curva ? ' · curva: ' + esc(nomeCurva(curva)) : ''}"></div>`;
}

function desenhar() {
  if (!visivelAgora()) return;
  const rolagem = caixa.scrollTop, tot = totalFrames(), lista = animadas(), passo = passoDaRegua();
  // as selecionadas também ganham uma linha (mesmo sem animação): é por ali que se dá um tempo a elas
  for (const c of S.selPaths) if (achar(c) && !lista.some(([x]) => x === c)) lista.push([c, pag()[c] || {}]);
  losangos = [];
  let nums = '';
  for (let f = 0; f <= tot; f += passo) nums += `<span class="num" style="left:${pct(f)}%">${f}</span>`;
  const fc = frameDe(capa());
  nums += `<span class="capa" style="left:${pct(fc)}%" title="capa: frame ${fc} (o que aparece no PNG)">▼</span>`;
  let h = linha('regua', `<span>${tot} frames · ${FPS} fps</span>`, nums);
  if (!lista.length) {
    h += '<div class="folha-vazia">Nenhuma camada animada nesta página. Selecione algo na arte (com ✎ Editar ligado): a linha dela aparece aqui. Depois, ◆ Chave grava um keyframe e a barra azul muda quando ela aparece.</div>';
  } else {
    const porFrame = new Map();                             // resumo: todas as chaves da página, por frame
    for (const [c, e] of lista) for (const k of e.kf || []) {
      const f = frameDe(k.t);
      if (!porFrame.has(f)) porFrame.set(f, []);
      porFrame.get(f).push({ c, k });
    }
    h += linha('resumo', `<span class="seta" data-acao="resumo">${resumoAberto ? '▾' : '▸'}</span><span class="txt">Resumo</span>`,
      [...porFrame].map(([f, refs]) => losango(refs, null, f, 'R' + f)).join(''));
    if (resumoAberto) for (const [c, e] of lista) {
      const el = achar(c), aberto = abertas.has(c), kf = e.kf || [];
      const fundo = e.anim && e.anim.length && !kf.length ? '<div class="barra-preset" style="opacity:.5"></div>' : '';
      h += linha(`el ${el && el === S.sel ? 'sel' : ''}`,
        `<span class="seta" data-acao="abrir">${aberto ? '▾' : '▸'}</span><span class="txt">${esc(el ? nomeDe(el) : c)}</span>`,
        barraDaCamada(e, tot) + faixaDaEntrada(e) + fundo + kf.map((k) => losango([{ c, k }], null, frameDe(k.t), `E${c}|${frameDe(k.t)}`)).join(''), `data-c="${esc(c)}"`);
      if (!aberto) continue;
      for (const [canal, rotulo] of CANAIS) {
        const com = kf.filter((k) => k[canal] !== undefined);
        if (com.length) h += linha('prop', `<span class="txt">${rotulo}</span>`,
          com.map((k) => losango([{ c, k }], canal, frameDe(k.t), `P${c}|${canal}|${frameDe(k.t)}`)).join(''), `data-c="${esc(c)}"`);
      }
      if (e.ent) h += linha('preset', `<span class="txt">▶ Entrada: ${esc(nomeEntrada(e.ent.tipo))} · ${frameDe(e.ent.dur || 1)} frames</span>`,
        faixaDaEntrada(e, 'cheia'), `data-c="${esc(c)}"`);
      for (const a of e.anim || []) {
        h += linha('preset', `<span class="txt">〰 ${esc(nomeContinuo(a.tipo))} · força ${a.int}</span>`, '<div class="barra-preset"></div>', `data-c="${esc(c)}"`);
      }
    }
  }
  caixa.innerHTML = h + '<div id="cabeca"><span id="cabecaNum">0</span></div>';
  caixa.style.setProperty('--passo', pct(passo) * 2 + '%');  // faixas alternadas a cada "passo" frames
  caixa.scrollTop = rolagem;
  if (!refazendo && passoDaRegua() !== passo) {             // a largura real só existe depois de desenhar: ajusta a régua
    refazendo = true; desenhar(); refazendo = false;
    return;
  }
  // marcação de chave que não existe mais (apagada, desfeita): esquece
  const vivos = new Set(losangos.map((l) => l.id));
  let sumiu = false;
  for (const id of [...marcados]) if (!vivos.has(id)) { marcados.delete(id); sumiu = true; }
  if (sumiu) avisar('chave');
  posicionarCabeca();
}
// cabeça (linha azul): só ela se move quando o tempo anda
function posicionarCabeca() {
  const cab = $('cabeca'), pista = pistaDaRegua();
  if (!cab || !pista) return;
  const rc = caixa.getBoundingClientRect(), rp = pista.getBoundingClientRect(), f = frameAtual();
  cab.style.left = (rp.left - rc.left + caixa.scrollLeft + (f / Math.max(1, totalFrames())) * rp.width) + 'px';
  cab.style.height = caixa.scrollHeight + 'px';
  $('cabecaNum').textContent = f;
}
function frameNoMouse(ev) {
  const rp = pistaDaRegua().getBoundingClientRect();
  return limitar(Math.round(((ev.clientX - rp.left) / rp.width) * totalFrames()), 0, totalFrames());
}

ouvir(MEUS, (lote) => { if (!arrasto && !soDe(lote, MEUS, 'doc', 'folha')) desenhar(); });
ouvir('tempo', () => { if (visivelAgora()) posicionarCabeca(); });
ouvir('clique-arte', desmarcarChave);
caixa.addEventListener('scroll', posicionarCabeca);

// ── chaves marcadas ──
function marcar(ids) {
  marcados.clear();
  for (const id of ids) marcados.add(id);
  caixa.querySelectorAll('.losango').forEach((d) => d.classList.toggle('marcado', marcados.has(losangos[+d.dataset.l].id)));
  avisar('chave');
}
export function desmarcarChave() { if (marcados.size) marcar([]); }
// as chaves marcadas, sem repetir: [{ c, k, canais }] — canais = null (a chave inteira) ou Set (só aqueles canais)
export function chavesMarcadas() {
  if (!S.animando || !marcados.size) return [];
  const porChave = new Map();
  for (const l of losangos) {
    if (!marcados.has(l.id)) continue;
    for (const { c, k } of l.refs) {
      const r = porChave.get(k) || { c, k, canais: new Set() };
      if (!l.canal || !r.canais) r.canais = null; else r.canais.add(l.canal);
      porChave.set(k, r);
    }
  }
  return [...porChave.values()];
}
// as chaves em que "curva" e "copiar" agem: as marcadas; sem nenhuma marcada, as dos selecionados no frame da cabeça
export function chavesAlvo() {
  const m = chavesMarcadas();
  return m.length ? m : chavesNoFrame();
}
// Delete: apaga as chaves marcadas. Num canal, tira só aquele canal da chave.
export function apagarMarcadas() {
  const refs = chavesMarcadas();
  if (!refs.length) return false;
  marcados.clear();
  avisar('chave');
  return editar((P) => {
    for (const { c, k, canais } of refs) {
      const e = P[c];
      if (!e || !e.kf) continue;
      if (canais) for (const canal of canais) delete k[canal]; else e.kf = e.kf.filter((x) => x !== k);
    }
  }, { reaplicar: true });                                  // (chave que ficou sem canal nenhum some sozinha)
}

// ── mouse ──
function comecar(a) { arrasto = a; document.body.classList.add('arrastando'); }   // a arte para de "engolir" o mouse
function terminar() {
  const a = arrasto;
  arrasto = null;
  document.body.classList.remove('arrastando');
  if (!a) return;
  if (a.tipo === 'camada') {
    if (!a.movido) { irPara(a.f0 / FPS); return; }          // foi só um clique na barra: leva a cabeça para lá
    editar(() => {}, { historia: false, reaplicar: true, origem: 'folha' });   // refaz a arte com o tempo novo
    desenhar();
    return;
  }
  if (a.tipo !== 'chave') return;
  if (!a.movido) {                                          // foi só um clique: marca este, vai para o frame e seleciona a camada
    marcar([a.info.id]);
    const c = a.info.refs[0] && a.info.refs[0].c, el = a.info.id[0] !== 'R' && c ? achar(c) : null;
    if (el && el !== S.sel) { definirEdicao(true); selecionar(el); }
    irPara(a.info.f / FPS);
    desenhar();
    return;
  }
  // duas chaves da mesma camada no mesmo frame viram uma só (a que foi arrastada vale por cima)
  const arrastadas = new Set(a.chaves);
  editar(() => {
    for (const [, e] of animadas()) {
      if (!e.kf) continue;
      const porFrame = new Map();
      const ordem = [...e.kf].sort((x, y) => (x.t - y.t) || (arrastadas.has(x) - arrastadas.has(y)));
      for (const k of ordem) {
        const q = frameDe(k.t);
        porFrame.set(q, Object.assign(porFrame.get(q) || {}, k, { t: noFrame(q / FPS) }));
      }
      e.kf = [...porFrame.values()];
    }
  }, { historia: false, reaplicar: true, origem: 'folha' });
  avisar('chave');
  desenhar();
}
caixa.addEventListener('mousedown', (ev) => {
  if (ev.button !== 0) return;
  const l = ev.target.closest('.losango');
  if (l) {
    ev.preventDefault(); pausar();
    const info = losangos[+l.dataset.l];
    if (ev.shiftKey) {                                      // Shift: soma ou tira da marcação (não arrasta)
      const ids = new Set(marcados);
      if (ids.has(info.id)) ids.delete(info.id); else ids.add(info.id);
      marcar(ids);
      return;
    }
    if (!marcados.has(info.id)) marcar([info.id]);          // já marcado junto com outros: o grupo anda junto
    const grupo = losangos.filter((x) => marcados.has(x.id));
    const chaves = [...new Set(grupo.flatMap((x) => x.refs.map((r) => r.k)))];
    comecar({ tipo: 'chave', info, x0: ev.clientX, df: 0, chaves, origens: chaves.map((k) => frameDe(k.t)),
      ids: grupo.map((x) => ({ id: x.id, f: x.f })), movido: false });
    return;
  }
  const fl = ev.target.closest('.fl'), acao = ev.target.closest('[data-acao]');
  if (!fl) return;
  const c = fl.dataset.c;
  if (acao && acao.dataset.acao === 'resumo') { resumoAberto = !resumoAberto; desenhar(); return; }
  if (acao && acao.dataset.acao === 'abrir' && c) { if (abertas.has(c)) abertas.delete(c); else abertas.add(c); desenhar(); return; }
  if (c && ev.target.closest('.nm')) {                      // clicar no nome seleciona a camada
    const el = achar(c);
    if (el) { definirEdicao(true); selecionar(el); }
    return;
  }
  if (c && ev.target.closest('.barra-camada')) {            // barra da camada: mover (meio) ou cortar (pontas)
    ev.preventDefault(); pausar(); desmarcarChave();
    const alca = ev.target.closest('.alca');
    const parte = !alca ? 'mover' : alca.classList.contains('ini') ? 'ini' : 'fim';
    const juntas = parte === 'mover' && S.selPaths.includes(c) ? S.selPaths.filter((x) => achar(x)) : [c];
    comecar({ tipo: 'camada', parte, x0: ev.clientX, f0: frameNoMouse(ev), df: 0, fotos: juntas.map(fotoDe), movido: false });
    return;
  }
  if (ev.target.closest('.tr')) {                           // régua ou qualquer pista: move a cabeça
    ev.preventDefault(); pausar(); desmarcarChave();
    comecar({ tipo: 'regua' });
    irPara(frameNoMouse(ev) / FPS);
  }
});
addEventListener('mousemove', (ev) => {
  if (!arrasto) return;
  if (!(ev.buttons & 1)) { terminar(); return; }            // o botão foi solto fora da janela
  if (arrasto.tipo === 'regua') { irPara(frameNoMouse(ev) / FPS); return; }
  if (arrasto.tipo === 'camada') { arrastarCamada(ev); return; }
  const a = arrasto, rp = pistaDaRegua().getBoundingClientRect(), tot = totalFrames();
  // o grupo anda inteiro: para quando a primeira chave chega no 0 ou a última chega no fim (o espaçamento não muda)
  const df = limitar(Math.round(((ev.clientX - a.x0) / rp.width) * tot), -Math.min(...a.origens), tot - Math.max(...a.origens));
  if (df === a.df) return;
  const primeiro = !a.movido;
  a.movido = true; a.df = df;
  editar(() => { a.chaves.forEach((k, i) => { k.t = noFrame((a.origens[i] + df) / FPS); }); },
    { historia: primeiro, origem: 'folha' });
  marcados.clear();
  for (const { id, f } of a.ids) marcados.add(id.replace(/\d+$/, String(f + df)));
  desenhar();
});
addEventListener('mouseup', terminar);
// arrasto da barra da camada: o meio move a camada inteira (para na borda); as pontas cortam o começo ou o fim
function arrastarCamada(ev) {
  const a = arrasto, dx = ev.clientX - a.x0, tot = totalFrames();
  if (!a.movido && Math.abs(dx) < 3) return;                // ainda é um clique
  let df = Math.round((dx / pistaDaRegua().getBoundingClientRect().width) * tot);
  if (a.parte === 'mover') { const [min, max] = limitesDe(a.fotos); df = limitar(df, min, max); }
  if (df === a.df) return;
  const primeiro = !a.movido;
  a.movido = true; a.df = df;
  editar(() => {
    for (const ft of a.fotos) {
      if (a.parte === 'mover') deslocar(ft, df);
      else cortar(ft, a.parte, (a.parte === 'ini' ? ft.ini : ft.fim ?? tot) + df);
    }
  }, { historia: primeiro, origem: 'folha' });
  S.lib.quadro(S.pagina, S.tempo, S.edicoes);               // (no meio do arrasto a página pode deixar de ser "animada")
  desenhar();
}

// ── botão direito ──
caixa.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  if (!S.lib || arrasto) return;
  pausar();
  const l = ev.target.closest('.losango');
  if (l) {                                                  // num losango: age nas chaves marcadas
    const info = losangos[+l.dataset.l], daLinha = l.closest('.fl').dataset.c;
    if (!marcados.has(info.id)) marcar([info.id]);
    const refs = chavesMarcadas(), curva = curvaDe(refs);
    animarBolinhas(abrirMenu(ev.clientX, ev.clientY, [
      { titulo: 'Curva até a próxima chave' },
      ...itensDeCurva(curva, (id) => definirCurva(refs, id)),
      '-',
      { rotulo: refs.length > 1 ? `Copiar ${refs.length} chaves` : 'Copiar', atalho: 'Ctrl+C', acao: () => copiarChaves(refs) },
      { rotulo: `Colar aqui (frame ${info.f})`, desligado: !temCopia(), acao: () => colarChaves(info.f, daLinha ? [daLinha] : null) },
      { rotulo: refs.length > 1 ? `Apagar ${refs.length} chaves` : 'Apagar', atalho: 'Delete', acao: apagarMarcadas },
    ], { classe: 'curvas' }));
    return;
  }
  const fl = ev.target.closest('.fl'), c = fl && fl.dataset.c;
  const kf = c ? (pag()[c] || {}).kf || [] : [];
  const naPista = !!ev.target.closest('.tr') && !!pistaDaRegua();
  const f = naPista ? frameNoMouse(ev) : frameAtual();
  const itens = [];
  if (kf.length) itens.push({ rotulo: `Copiar todas as chaves desta camada (${kf.length})`, acao: () => copiarChaves(kf.map((k) => ({ c, k, canais: null }))) });
  itens.push({ rotulo: `Colar ${c ? 'nesta camada' : naPista ? 'aqui' : 'na cabeça'} (frame ${f})`, atalho: c || naPista ? '' : 'Ctrl+V',
    desligado: !temCopia(), acao: () => colarChaves(f, c ? [c] : null) });
  if (fl && fl.classList.contains('regua')) {
    itens.push('-', { rotulo: `Usar o frame ${f} como capa`, dica: 'o que aparece no PNG', acao: () => definirCapa(f / FPS) },
      { rotulo: 'Capa no fim da animação', dica: 'o padrão', desligado: frameDe(capa()) >= totalFrames(), acao: () => definirCapa(totalFrames() / FPS) });
  }
  if (c) {
    itens.push('-', { titulo: 'Tempo da camada' },
      { rotulo: `Começar aqui (frame ${f})`, dica: 'move a camada, com as chaves', acao: () => definirInicio(f, [c]) },
      { rotulo: 'Cortar o começo aqui', dica: 'as chaves não mudam', acao: () => cortarInicio(f, [c]) },
      { rotulo: 'Cortar o fim aqui', acao: () => definirFim(f, [c]) },
      { rotulo: 'Tirar os cortes', desligado: !temTempo(pag()[c]), acao: () => tirarCortes([c]) });
  }
  abrirMenu(ev.clientX, ev.clientY, itens);
});
