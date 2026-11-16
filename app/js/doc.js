// doc.js — o documento de edições (S.edicoes): ler, mudar, desfazer/refazer, reaplicar na arte e salvar.
//
// REGRA DE OURO: ninguém altera S.edicoes por conta própria. Toda mudança passa por uma destas duas portas:
//   mudar(fn, opções)    muda uma ou mais camadas  (vira keyframe sozinho se a camada for animada)
//   editar(fn, opções)   mudança livre na página   (keyframes, itens novos, duração...)
// Assim o histórico (desfazer), o "não salvo", a arte na tela e os painéis ficam sempre em dia.
import { S, ANIM_PROPS, PADRAO, avisar, status, aviso, frameDe, noFrame, r1 } from './base.js';
import { achar, aoCarregar, resolverSelecao, recarregar } from './arte.js';
import { api } from './api.js';
import { CURVA_PADRAO } from './presets.js';

export const FORMATO = 2;                                   // versão do formato gravado no arquivo de edições
// Outros módulos penduram funções aqui (evita que este arquivo precise conhecê-los):
//   antesDeMudar      roda antes de qualquer mudança       (a animação pausa)
//   antesDeHistorico  roda antes de desfazer/refazer/salvar (o texto em edição é concluído)
export const ganchos = { antesDeMudar: [], antesDeHistorico: [] };

const passado = [], futuro = [];                            // fotos do documento: { p: página, f: JSON }
let ultimoLote = { chave: null, quando: 0 };

// ───────────────────────── ler ─────────────────────────
// edições da página atual. pag(true) cria a página se faltar (use quando for escrever)
export const pag = (criar = false) => S.edicoes[S.pagina] || (criar ? (S.edicoes[S.pagina] = {}) : {});

// edições de uma camada (pelo caminho). entrada(c, true) cria se faltar
export function entrada(c = S.selCaminho, criar = false) {
  if (!c) return {};
  const P = pag(criar);
  if (!P[c] && criar) { const el = achar(c); P[c] = { sig: el ? S.lib.assinatura(el) : '' }; }
  return P[c] || {};
}
// cópia do documento em que a camada "c" está sem os efeitos contínuos e sem a entrada (para ler o valor
// "parado" dela: os efeitos são somados depois, por cima)
export const semContinuos = (c) => ({ [S.pagina]: { ...pag(), [c]: { ...entrada(c), anim: [], ent: null } } });

// valor atual de uma propriedade da camada (x, y, s, r, o, filtro...). Se ela tem keyframes, é o valor
// NESTE instante. Dentro de mudar(fn), leia sempre por aqui — nunca direto de "e".
export function atual(p, c = S.selCaminho) {
  const e = entrada(c);
  let v = e[p];
  if (e.kf && e.kf.length) v = S.lib.valores(S.pagina, c, S.tempo, semContinuos(c))[p];
  if (v == null && p === 'o') { const el = achar(c); if (el) return +S.w.getComputedStyle(el).opacity; }
  return v ?? PADRAO[p];
}
// keyframe da camada neste frame (cria se não houver)
export function chaveEm(e, t) {
  e.kf = e.kf || [];
  let k = e.kf.find((x) => frameDe(x.t) === frameDe(t));
  if (!k) { k = { t: noFrame(t) }; e.kf.push(k); e.kf.sort((a, b) => a.t - b.t); }
  return k;
}

// ───────────────────────── histórico ─────────────────────────
export const foto = () => JSON.stringify(S.edicoes);
export function guardarFoto(f) {
  passado.push({ p: S.pagina, f });
  if (passado.length > 300) passado.shift();
  futuro.length = 0;
}
// guarda o estado atual para o desfazer. "lote": mudanças seguidas com a mesma chave (roda do mouse,
// setas, um slider) viram um passo só do desfazer.
export function guardar(lote = null) {
  if (gesto === 2) return;                                  // no meio de um gesto: o estado já foi guardado
  if (gesto === 1) gesto = 2;
  const agora = Date.now();
  if (lote && ultimoLote.chave === lote && agora - ultimoLote.quando < 600) { ultimoLote.quando = agora; return; }
  ultimoLote = { chave: lote, quando: agora };
  guardarFoto(foto());
}
// "Gesto": várias mudanças seguidas que, para quem usa, são uma ação só (arrastar dentro de um campo de número).
// Entre abrirGesto() e fecharGesto(), só a primeira mudança guarda o estado: o gesto inteiro é um Ctrl+Z.
let gesto = 0;                                              // 0 = fora · 1 = aberto, nada guardado · 2 = aberto, já guardou
export function abrirGesto() { gesto = 1; }
export function fecharGesto() { gesto = 0; ultimoLote = { chave: null, quando: 0 }; }
export const podeDesfazer = () => passado.length > 0;
export const podeRefazer = () => futuro.length > 0;
function trocar(reg) {
  S.edicoes = JSON.parse(reg.f);
  S.sujo = true;
  ultimoLote = { chave: null, quando: 0 };
  if (reg.p !== S.pagina) {                                 // a mudança era de outra página: vai até ela
    S.pagina = reg.p; S.selPaths = []; S.selCaminho = null; S.sel = null;
    recarregar();
    avisar('selecao');
  } else reaplicar();
  avisar('doc');
}
export function desfazer() {
  ganchos.antesDeHistorico.forEach((f) => f());
  if (!passado.length) return false;
  futuro.push({ p: S.pagina, f: foto() });
  trocar(passado.pop());
  return true;
}
export function refazer() {
  ganchos.antesDeHistorico.forEach((f) => f());
  if (!futuro.length) return false;
  passado.push({ p: S.pagina, f: foto() });
  trocar(futuro.pop());
  return true;
}

// ───────────────────────── mudar ─────────────────────────
function arredondar(e) {
  const um = (o) => {
    for (const p of ['x', 'y']) if (typeof o[p] === 'number') o[p] = Math.round(o[p]);
    if (typeof o.r === 'number') o.r = r1(o.r);
    for (const p of ['s', 'sx', 'sy', 'o']) if (typeof o[p] === 'number') o[p] = Math.round(o[p] * 1000) / 1000;
  };
  um(e);
  if (e.kf) e.kf.forEach(um);
}
// aplica fn na camada "c". Camada com keyframes: o que fn gravar nas propriedades animáveis vira
// keyframe neste frame (o valor "base" não muda). Devolve true se virou keyframe.
function alterar(c, fn) {
  const el = achar(c), e = entrada(c, true);
  let virouChave = false;
  if (e.kf && e.kf.length) {
    // fn recebe um "disfarce" de e: o que ela gravar nas propriedades animáveis fica separado e vira keyframe
    const gravado = {};
    fn(new Proxy(e, {
      get: (alvo, p) => (p in gravado ? gravado[p] : alvo[p]),
      set: (alvo, p, v) => { if (ANIM_PROPS.includes(p)) gravado[p] = v; else alvo[p] = v; return true; },
    }), c, el);
    const props = Object.keys(gravado).filter((p) => gravado[p] !== undefined);
    if (props.length) { const k = chaveEm(e, S.tempo); for (const p of props) k[p] = gravado[p]; virouChave = true; }
  } else fn(e, c, el);
  arredondar(e);
  S.lib.estilo(el, e);
  return virouChave;
}
function quadroAtual() {
  if (S.lib.animado(S.pagina, S.edicoes)) S.lib.quadro(S.pagina, S.tempo, S.edicoes);
}
function concluir(tudo, origem) {
  limparVazios();
  if (tudo) reaplicar(); else quadroAtual();
  S.sujo = true;
  avisar('doc', origem);
}

// Muda camadas.  fn(e, c, el): "e" = edições da camada, "c" = caminho, "el" = elemento.
//   em        'selecao' (todas as selecionadas — padrão) | 'principal' | [caminhos]
//   historia  false quando quem chamou já guardou o estado (ex.: os passos seguintes de um arrasto)
//   lote      chave para juntar mudanças seguidas num só passo do desfazer
//   origem    quem mudou (o painel de mesmo nome não se redesenha)
//   pausar    false para não parar a animação
export function mudar(fn, { em = 'selecao', historia = true, lote = null, origem = '', pausar = true } = {}) {
  if (!S.lib) return false;
  const alvos = (em === 'selecao' ? S.selPaths : em === 'principal' ? [S.selCaminho] : em).filter((c) => c && achar(c));
  if (!alvos.length) return false;
  if (pausar) ganchos.antesDeMudar.forEach((f) => f());
  if (historia) guardar(lote);
  let chaves = 0;
  for (const c of alvos) if (alterar(c, fn)) chaves++;
  concluir(false, origem);
  // fora do modo Animar a pessoa não está vendo a linha do tempo: avisa onde a mudança foi parar
  if (chaves && !S.animando) aviso(`camada com keyframes: a mudança virou chave no frame ${frameDe(S.tempo)} (ligue 🎬 Animar para escolher o frame)`, 'sujo', 5000);
  return true;
}

// Mudança livre na página.  fn(P): "P" = edições da página atual (P._novos, P._dur, P["caminho"].kf ...).
//   reaplicar: true quando a mudança tira coisas (apagar keyframe, item, efeito): a arte é refeita do zero.
export function editar(fn, { historia = true, lote = null, origem = '', reaplicar: tudo = false, pausar = true } = {}) {
  if (!S.lib) return false;
  if (pausar) ganchos.antesDeMudar.forEach((f) => f());
  if (historia) guardar(lote);
  fn(pag(true));
  concluir(tudo, origem);
  return true;
}

// tira todas as edições das camadas (volta ao original da arte)
export function removerEdicoes(caminhos = S.selPaths) {
  const P = S.edicoes[S.pagina];
  if (!P || !caminhos.some((c) => P[c])) return false;
  return editar((pg) => { for (const c of caminhos) delete pg[c]; }, { reaplicar: true });
}

// tira do documento o que não diz nada (valores padrão, listas vazias, camadas sem edição)
export function limparVazios() {
  const P = S.edicoes[S.pagina];
  if (!P) return;
  for (const [c, e] of Object.entries(P)) {
    if (c[0] === '_') continue;
    if (!e.x) delete e.x;
    if (!e.y) delete e.y;
    if (!e.r) delete e.r;
    if (e.s === 1) delete e.s;
    if (e.sx === 1) delete e.sx;
    if (e.sy === 1) delete e.sy;
    if (!e.oculto) delete e.oculto;
    if (!e.trava) delete e.trava;
    if (!(e.ini > 0)) delete e.ini;                         // tempo da camada: começar no 0 e ir até o final
    if (e.fim != null && e.fim >= (P._dur || 5)) delete e.fim;   // são o normal — não ficam gravados
    if (e.kf) {
      e.kf = e.kf.filter((k) => ANIM_PROPS.some((p) => k[p] !== undefined));   // chave sem valor nenhum some
      for (const k of e.kf) if (!k.ease || k.ease === CURVA_PADRAO) delete k.ease;
      if (!e.kf.length) delete e.kf;
    }
    if (e.anim && !e.anim.length) delete e.anim;
    if (e.ent && !e.ent.tipo) delete e.ent;
    if (Object.keys(e).every((k) => k === 'sig')) delete P[c];
  }
  if (P._novos && !P._novos.length) delete P._novos;
  if (P._dur == null || P._dur === 5) delete P._dur;
  if (!P._mb) delete P._mb;
  if (P._capa == null || P._capa >= (P._dur || 5)) delete P._capa;   // capa no fim = o normal
  if (!Object.keys(P).length) delete S.edicoes[S.pagina];
}

// refaz a arte a partir do documento: volta ao original e aplica tudo de novo
export function reaplicar() {
  const lib = S.lib;
  if (!lib) return;
  lib.limpar();
  lib.criarNovos(S.pagina, S.edicoes).then(() => avisar('layout'));   // imagens novas terminam de carregar depois
  lib.aplicarTexto(S.pagina, S.edicoes);
  lib.aplicarEstilos(S.pagina, S.edicoes);
  quadroAtual();
  resolverSelecao();
  avisar('selecao');
}

// ───────────────────────── salvar e carregar ─────────────────────────
export async function salvar() {
  if (!S.lib || !S.arquivo) return false;
  ganchos.antesDeHistorico.forEach((f) => f());
  try {
    S.edicoes._formato = FORMATO;
    await api.salvar(S.arquivo, S.edicoes);
    S.sujo = false;
    recarregar();                      // mostra o resultado final (a arte remede os textos com as edições gravadas)
    aviso('salvo ✓');
    avisar('salvo');
    return true;
  } catch (e) {
    status('erro ao salvar: ' + e.message, 'erro');
    return false;
  }
}
// documento vazio (ao abrir outra arte)
export function novoDocumento() {
  S.edicoes = {}; S.sujo = false;
  passado.length = 0; futuro.length = 0;
}

const semFormato = (txt) => { const o = JSON.parse(txt); delete o._formato; return JSON.stringify(o); };
aoCarregar.push(() => {
  if (!S.lib) return;
  if (S.sujo) reaplicar();                                  // há edições não salvas (ex.: trocou de página): mantém
  else {
    const doArquivo = JSON.stringify(S.w.EDICOES || {});
    if (semFormato(doArquivo) !== semFormato(foto())) {     // outra arte, ou o arquivo mudou por fora do editor
      S.edicoes = JSON.parse(doArquivo);
      passado.length = 0; futuro.length = 0;
    }
    quadroAtual();                                          // (a arte abre mostrando a capa; o editor, o instante dele)
  }
  avisar('doc');
});
