/*!
 * edicoes-lib.js — a parte do AFE que roda DENTRO da arte.        (versao 2.8)
 * ==============================================================================================
 * O editor nao altera o codigo da arte: ele grava as mudancas num arquivo de dados ao lado dela
 * (window.EDICOES, em "<arte>.edicoes.js") e esta biblioteca aplica essas mudancas quando a arte abre
 * — no editor, no navegador ou no render de PNG/video.
 *
 * COMO LIGAR UMA ARTE  (o ligar.py do editor faz isto sozinho)
 *   <script src="edicoes-lib.js"></script>          (ou outro caminho: o ligar.py respeita o que a arte ja usa)
 *   <script src="minha-arte.edicoes.js"></script>
 *   Depois, um dos dois modos:
 *   a) AUTOMATICO — arte que nao avisa quando termina de montar:
 *        <script src="edicoes-lib.js" data-auto></script>
 *      A lib espera a pagina e as fontes carregarem, aplica tudo e marca <body data-pronto="1">.
 *   b) MANUAL — arte que monta a tela por codigo e marca data-pronto ela mesma:
 *        await EDLIB.preparar(N);      // itens novos + textos editados   (ANTES de medir textos)
 *        ...ajustes da arte que medem o texto...
 *        EDLIB.finalizar(N);           // posicao, tamanho, efeitos, forma, instante da capa da animacao
 *        document.body.dataset.pronto = '1';
 *      (sem etapa de medir:  await EDLIB.aplicarTudo(N);)
 *   N = numero da pagina; se faltar, usa ?pagina= do endereco (ou 1).
 *
 * O QUE A ARTE PODE INFORMAR  (tudo opcional)
 *   window.CONFIG = { largura, altura, paginas }    tamanho da arte e quantas paginas ela tem
 *   <div id="post">  ou  <div data-ed-raiz>         elemento que contem a arte (senao, o <body>)
 *   data-nome="Titulo"                               nome que aparece na lista de camadas
 *
 * FORMATO DOS DADOS  (detalhes em docs/ARQUITETURA.md do editor)
 *   window.EDICOES = { "_formato": 2, "<pagina>": {
 *       "_dur": 5,                                   duracao da animacao em segundos (padrao 5)
 *       "_capa": 2,                                  instante mostrado fora do video: PNG, navegador (padrao: o final)
 *       "_novos": [ {id, tipo:"img"|"texto"|"retangulo"|"circulo", left, top, w, h, src, html, fs, fundo} ],
 *                    (img com fundo:true = imagem de FUNDO: cobre a arte toda e fica atras de tudo)
 *                    (tipo:"html" = PECA em codigo: {html, css:[arquivos .css da arte], estilo, contexto, nome, w})
 *       "<caminho>": { sig, x, y, s, sx, sy, r, o, oculto, z, html, filtro, tsombra, csombra, cor, ini, fim,
 *                      raio, bg, bd, forma, kf:[{t, ease, ...}], anim:[{tipo, int, vel}],
 *                      ent:{tipo, dur, int} } } }
 *   kf[i].ease = curva do trecho que vai desta chave ate a proxima (ver CURVAS; sem "ease" = suave).
 *   ini / fim  = tempo da camada, em segundos: ela so aparece de "ini" ate "fim" (sem ini = desde o
 *                comeco; sem fim = ate o final). As chaves (kf) continuam em tempo absoluto.
 *   ent        = efeito de entrada: comeca em "ini" e dura "dur" segundos (ver a funcao "entrada").
 *   caminho = posicao do elemento dentro da raiz ("4/1" = 2o filho do 5o filho); itens novos usam
 *   "#id". "sig" (tag.classe) confere se o elemento ainda e o mesmo: se a estrutura da arte mudar,
 *   a edicao e ignorada em vez de cair no elemento errado.
 *
 * VIDEO:  EDLIB.quadro(N, t) desenha o instante t (segundos); o render_anim.py chama quadro a quadro.
 * PNG / NAVEGADOR:  a arte parada mostra o instante da CAPA (_capa; se faltar, o fim da animacao, quando
 *                   tudo ja entrou).
 */
(function () {
  'use strict';
  const VERSAO = 2.8;                        // 2 = formato · .1 curvas · .2 tempo da camada · .3 entrada e capa · .4 imagem de fundo
                                             //   .5 mover/aumentar/girar tambem em texto "em linha" (<span>, <em>...)
                                             //   .6 esticar so na largura (sx) ou so na altura (sy)
                                             //   .7 pecas em codigo (item novo de tipo "html", com o CSS da marca)
                                             //   .8 mais efeitos continuos (balancar, orbita, quique, coracao, glitch RGB, estrobo)
  const EU = document.currentScript;
  const AUTO = !!(EU && EU.hasAttribute('data-auto'));
  const tocados = new Set();                 // elementos em que o editor mexeu (para poder voltar atras)
  let raizEl = null;

  // ───────────────────────── a arte ─────────────────────────
  function raiz() {
    if (!raizEl || !raizEl.isConnected) {
      raizEl = document.querySelector(window.EDLIB_RAIZ || '[data-ed-raiz], #post') || document.body;
    }
    return raizEl;
  }
  function pagina() {
    const n = +new URLSearchParams(location.search).get('pagina');
    return n >= 1 ? Math.floor(n) : 1;
  }
  function info() {
    const cfg = window.CONFIG || {}, r = raiz().getBoundingClientRect();
    let paginas = cfg.paginas ?? window.TOTAL_PAGINAS ?? null;
    if (paginas == null && typeof TOTAL === 'number') paginas = TOTAL;   // convencao antiga: const TOTAL na arte
    return {
      versao: VERSAO, pagina: pagina(), paginas: paginas || null,
      largura: Math.round(cfg.largura || r.left + r.width) || 1080,
      altura: Math.round(cfg.altura || r.top + r.height) || 1350,
    };
  }
  const pag = (n, ed) => (ed || window.EDICOES || {})[n] || {};

  // ───────────────────────── caminhos ─────────────────────────
  function caminho(el) {
    const r = raiz(), p = [];
    while (el && el !== r) {
      const pai = el.parentElement;
      if (!pai) return null;
      p.unshift(pai === r && el.dataset && el.dataset.edId ? '#' + el.dataset.edId : [...pai.children].indexOf(el));
      el = pai;
    }
    return el === r && p.length ? p.join('/') : null;
  }
  function achar(c) {
    if (c == null || c === '') return null;
    let el = raiz();
    for (const seg of String(c).split('/')) {
      if (!el) return null;
      el = seg[0] === '#'
        ? [...el.children].find((x) => x.dataset && x.dataset.edId === seg.slice(1))
        : el.children[+seg];
    }
    return el || null;
  }
  const assinatura = (el) => el.tagName.toLowerCase() + (el.classList[0] ? '.' + el.classList[0] : '');
  // percorre as edicoes da pagina: fn(elemento, edicao, caminho). Pula o que nao bate mais com a arte.
  function cada(n, fn, ed) {
    for (const [c, e] of Object.entries(pag(n, ed))) {
      if (c[0] === '_') continue;
      const el = achar(c);
      if (el && (!e.sig || e.sig === assinatura(el))) fn(el, e, c);
    }
  }

  // ───────────────────────── estilos: por e tirar sem estragar o que a arte tinha ─────────────────────────
  const SIMPLES = ['translate', 'scale', 'rotate', 'opacity', 'visibility', 'zIndex', 'filter', 'textShadow', 'boxShadow', 'color', 'display'];
  // "Atalhos" do CSS mexem em varias declaracoes de uma vez: para devolver o original e preciso guardar todas.
  const FAMILIAS = {
    background:   { css: 'background',    de: (n) => n.startsWith('background-') },
    border:       { css: 'border',        de: (n) => n.startsWith('border-') && !n.includes('radius') },
    borderRadius: { css: 'border-radius', de: (n) => n.startsWith('border-') && n.includes('radius') },
  };
  function declaracoes(el, de) {
    const r = [];
    for (let i = 0; i < el.style.length; i++) {
      const n = el.style.item(i);
      if (de(n)) r.push([n, el.style.getPropertyValue(n), el.style.getPropertyPriority(n)]);
    }
    return r;
  }
  // primeira vez que o editor encosta num elemento: anota como a arte o deixou
  function guardarOriginal(el) {
    if (el.__ed) return el.__ed;
    const o = { tinhaStyle: el.hasAttribute('style'), simples: {}, familias: {}, postos: new Map(),
      html: undefined, htmlPosto: false, base: null,
      emLinha: getComputedStyle(el).display === 'inline' };   // trecho de texto "em linha" (<span>, <em>...)
    for (const p of SIMPLES) o.simples[p] = el.style[p];
    for (const f in FAMILIAS) o.familias[f] = declaracoes(el, FAMILIAS[f].de);
    el.__ed = o;
    tocados.add(el);
    return o;
  }
  function restaurar(alvo, prop, o) {       // devolve uma propriedade ao que a arte tinha
    const fam = FAMILIAS[prop];
    if (!fam) { alvo.style[prop] = o.simples[prop]; return; }
    alvo.style.removeProperty(fam.css);
    for (const [n, v, pr] of o.familias[prop]) alvo.style.setProperty(n, v, pr);
  }
  function limparAtributo(alvo, o) {
    if (!o.tinhaStyle && !alvo.getAttribute('style')) alvo.removeAttribute('style');
  }
  function por(el, prop, valor) {
    const o = el.__ed;
    if (valor != null) {
      if (o.postos.get(prop) === valor) return;          // ja esta assim (poupa trabalho a cada quadro)
      el.style[prop] = valor; o.postos.set(prop, valor);
    } else if (o.postos.has(prop)) {
      restaurar(el, prop, o); o.postos.delete(prop); limparAtributo(el, o);
    }
  }
  // aplica no elemento tudo o que a edicao "e" pede (e tira o que ela nao pede mais)
  function estilo(el, e) {
    const o = guardarOriginal(el);
    // O navegador ignora mover/aumentar/girar em texto "em linha". Quando a edicao pede isso (ou a camada e
    // animada), o trecho vira "bloco em linha": continua no mesmo lugar do texto, mas aceita o movimento.
    // escala final de cada eixo: tamanho (s) vezes o esticado da largura (sx) / da altura (sy)
    const ex = (e.s ?? 1) * (e.sx ?? 1), ey = (e.s ?? 1) * (e.sy ?? 1);
    const mexe = e.x || e.y || ex !== 1 || ey !== 1 || e.r || e.ent || (e.kf && e.kf.length) || (e.anim && e.anim.length);
    por(el, 'display', o.emLinha && mexe ? 'inline-block' : null);
    por(el, 'translate', (e.x || e.y) ? `${e.x || 0}px ${e.y || 0}px` : null);
    por(el, 'scale', ex === 1 && ey === 1 ? null : ex === ey ? String(ex) : `${ex} ${ey}`);
    por(el, 'rotate', e.r ? `${e.r}deg` : null);
    por(el, 'opacity', e.o != null ? String(e.o) : null);
    por(el, 'visibility', e.oculto ? 'hidden' : null);
    por(el, 'zIndex', e.z != null ? String(e.z) : null);
    por(el, 'filter', e.filtro);
    por(el, 'textShadow', e.tsombra);
    por(el, 'boxShadow', e.csombra);
    por(el, 'color', e.cor);
    por(el, 'borderRadius', e.raio == null ? null : typeof e.raio === 'number' ? e.raio + 'px' : String(e.raio));
    por(el, 'background', e.bg);
    por(el, 'border', e.bd);
  }

  // ───────────────────────── textos ─────────────────────────
  // html de "el" como estaria SEM as edicoes dos elementos de dentro dele (trabalha num clone: nao mexe na arte).
  //   textos:true  tambem desfaz os textos trocados la dentro (para achar o texto original)
  //   textos:false so tira os estilos postos pelo editor (para guardar o texto que o usuario digitou)
  function htmlSem(el, opcoes) {
    const textos = !opcoes || opcoes.textos !== false;
    const dentro = [...tocados].filter((x) => x !== el && x.isConnected && el.contains(x));
    if (!dentro.length) return el.innerHTML;
    const clone = el.cloneNode(true);
    const rel = (x) => { const p = []; for (let n = x; n !== el; n = n.parentElement) p.unshift([...n.parentElement.children].indexOf(n)); return p; };
    const itens = dentro.map((x) => ({ x, p: rel(x) })).sort((a, b) => a.p.length - b.p.length);
    const refeitos = [];                    // quem ja voltou ao texto original (o de dentro dele volta junto)
    for (const { x, p } of itens) {
      if (refeitos.some((r) => r.length < p.length && r.every((v, i) => v === p[i]))) continue;
      let c = clone;
      for (const i of p) c = c && c.children[i];
      if (!c) continue;
      for (const prop of x.__ed.postos.keys()) restaurar(c, prop, x.__ed);
      limparAtributo(c, x.__ed);
      if (textos && x.__ed.htmlPosto) { c.innerHTML = x.__ed.html; refeitos.push(p); }
    }
    return clone.innerHTML;
  }
  function htmlOriginal(el) {
    const o = guardarOriginal(el);
    if (o.html === undefined) o.html = htmlSem(el);
    return o.html;
  }
  // o editor vai deixar o usuario digitar neste elemento: guarda o original e marca que o texto mudou
  function abrirTexto(el) { htmlOriginal(el); el.__ed.htmlPosto = true; }
  // troca o texto (html) do elemento; null = volta ao original
  function texto(el, html) {
    const o = guardarOriginal(el);
    if (html != null) {
      htmlOriginal(el); o.htmlPosto = true;
      if (el.innerHTML !== html) el.innerHTML = html;
    } else if (o.htmlPosto) { el.innerHTML = o.html; o.htmlPosto = false; }
  }
  // volta a arte ao estado sem edicoes (o editor chama antes de reaplicar tudo: desfazer, apagar, etc.)
  function limpar() {
    // 1) textos, do mais de fora para o mais de dentro (o original de fora ja traz os de dentro limpos)
    const comTexto = [...tocados].filter((el) => el.isConnected && el.__ed.htmlPosto)
      .map((el) => ({ el, n: (caminho(el) || '').split('/').length })).sort((a, b) => a.n - b.n);
    for (const { el } of comTexto) {
      if (!el.isConnected) continue;        // ja foi trocado junto com um de fora
      el.innerHTML = el.__ed.html; el.__ed.htmlPosto = false;
    }
    // 2) estilos
    for (const el of [...tocados]) {
      if (!el.isConnected) { tocados.delete(el); continue; }
      const o = el.__ed;
      for (const prop of o.postos.keys()) restaurar(el, prop, o);
      o.postos.clear(); o.base = null;
      limparAtributo(el, o);
    }
  }

  // ───────────────────────── itens acrescentados (assets, formas, textos) ─────────────────────────
  // garante que a arte carrega um arquivo .css (o da marca, de que as pecas precisam). Entra no COMECO do <head>:
  // assim os estilos que a arte ja tem vem depois e continuam valendo por cima.
  function garantirCss(href) {
    const ja = [...document.querySelectorAll('link[data-ed-css]')].find((l) => l.dataset.edCss === href);
    if (ja) return ja.__pronto;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.dataset.edCss = href;
    link.__pronto = new Promise((ok) => { link.onload = link.onerror = ok; });
    link.href = encodeURI(href);
    const ultimo = [...document.querySelectorAll('link[data-ed-css]')].pop();   // mantem a ordem pedida (tokens antes do resto)
    if (ultimo) ultimo.after(link); else document.head.prepend(link);
    return link.__pronto;
  }
  function criarNovos(n, ed) {
    const r = raiz(), espera = [];
    [...r.children].forEach((x) => { if (x.dataset && x.dataset.edId) x.remove(); });
    document.querySelectorAll('style[data-ed-estilo]').forEach((x) => x.remove());
    (pag(n, ed)._novos || []).forEach((nv, i) => {
      let el;
      if (nv.tipo === 'img') {
        el = document.createElement('img');
        el.src = encodeURI(nv.src); el.draggable = false;
        if (nv.fundo) Object.assign(el.style, { width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' });
        else el.style.width = (nv.w || 300) + 'px';
        espera.push(el.decode().catch(() => {}));
      } else if (nv.tipo === 'html') {
        // PECA em codigo: um trecho de HTML que usa as classes do CSS da marca.
        //   css       arquivos .css (na pasta da arte) de que ela precisa
        //   contexto  o que ela herdava de quem estava em volta na previa (fonte, cor, tamanho da letra...)
        //   estilo    regras auxiliares da previa, valendo so dentro desta peca
        el = document.createElement('div');
        el.innerHTML = nv.html || '';
        if (nv.w) el.style.width = nv.w + 'px';
        Object.assign(el.style, nv.contexto || {});
        if (nv.nome) el.dataset.edPeca = nv.nome;
        for (const href of nv.css || []) espera.push(garantirCss(href));
        for (const im of el.querySelectorAll('img')) { im.draggable = false; espera.push(im.decode().catch(() => {})); }
        if (nv.estilo) {
          const st = document.createElement('style');
          st.dataset.edEstilo = nv.id || 'n' + (i + 1);
          st.textContent = `[data-ed-id="${nv.id || 'n' + (i + 1)}"]{${nv.estilo}}`;
          document.head.append(st);
        }
      } else if (nv.tipo === 'texto') {
        el = document.createElement('div');
        el.innerHTML = nv.html || 'Texto';
        Object.assign(el.style, { fontSize: (nv.fs || 56) + 'px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', lineHeight: 1.1 });
      } else {
        el = document.createElement('div');
        Object.assign(el.style, { width: (nv.w || 300) + 'px', height: (nv.h || 200) + 'px', boxSizing: 'border-box',
          background: 'rgba(61,245,255,.12)', border: '3px solid #3df5ff', borderRadius: nv.tipo === 'circulo' ? '50%' : '24px' });
      }
      el.className = 'ed-novo';
      el.dataset.edId = nv.id || 'n' + (i + 1);
      if (nv.fundo) el.dataset.edFundo = '1';
      Object.assign(el.style, { position: 'absolute', left: (nv.left || 0) + 'px', top: (nv.top || 0) + 'px', zIndex: nv.fundo ? -1 : 5 });
      r.append(el);
    });
    // Imagem de fundo: fica atras de tudo (z-index -1). Para ela nao ir parar atras do fundo da propria raiz,
    // a raiz vira um "mundo a parte" de camadas (isolation). Sem imagem de fundo, a raiz volta ao que era.
    const temFundo = (pag(n, ed)._novos || []).some((nv) => nv.fundo);
    if (temFundo) {
      if (r.__edIsolamento === undefined) r.__edIsolamento = r.style.isolation;
      r.style.isolation = 'isolate';
    } else if (r.__edIsolamento !== undefined) {
      r.style.isolation = r.__edIsolamento;
      delete r.__edIsolamento;
      if (!r.getAttribute('style')) r.removeAttribute('style');
    }
    return Promise.all(espera);
  }

  // ───────────────────────── aplicar as edicoes da pagina ─────────────────────────
  function aplicarTexto(n, ed) {
    const lista = [];
    cada(n, (el, e, c) => { if (e.html != null) lista.push([c, e.html]); }, ed);
    lista.sort((a, b) => a[0].split('/').length - b[0].split('/').length);   // de fora para dentro
    for (const [c, html] of lista) { const el = achar(c); if (el) texto(el, html); }
  }
  function aplicarEstilos(n, ed) { cada(n, estilo, ed); }

  // ───────────────────────── animacao ─────────────────────────
  // Curvas (easing): como o valor anda entre uma chave e a proxima. u = 0..1 (quanto do trecho ja passou).
  // Para criar uma curva nova: a conta aqui + o nome dela em app/js/presets.js (CURVAS).
  const CURVAS = {
    suave:   (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),   // sai e chega devagar (padrao)
    linear:  (u) => u,                                                             // velocidade constante
    entrada: (u) => u * u * u,                                                     // sai devagar e acelera
    saida:   (u) => 1 - Math.pow(1 - u, 3),                                        // sai rapido e freia
    recuo:   (u) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2),   // passa um pouco e volta
    quique:  (u) => {                                                              // chega e quica
      const n = 7.5625, d = 2.75;
      if (u < 1 / d) return n * u * u;
      if (u < 2 / d) return n * (u -= 1.5 / d) * u + 0.75;
      if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + 0.9375;
      return n * (u -= 2.625 / d) * u + 0.984375;
    },
    degrau:  () => 0,                                                              // fica parado ate a proxima chave
  };
  const NAO_E_VALOR = new Set(['t', 'ease']);                // campos da chave que nao sao propriedade animada
  // cores sempre como rgba(r, g, b, a): assim da para misturar duas cores e mexer no alfa
  function normCor(s) {
    if (typeof s !== 'string') return s;
    return s.replace(/color\(srgb\s+([^)]+)\)/g, (m, a) => {
      const p = a.split(/[\s/]+/).filter(Boolean).map(parseFloat);
      return `rgba(${Math.round(p[0] * 255)}, ${Math.round(p[1] * 255)}, ${Math.round(p[2] * 255)}, ${p[3] != null ? p[3] : 1})`;
    }).replace(/rgb\(([^)]+)\)/g, (m, a) => {
      const p = a.split(/[\s,/]+/).filter(Boolean);
      return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${p[3] != null ? p[3] : 1})`;
    });
  }
  function lerp(a, b, u) {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
    if (typeof a === 'string' && typeof b === 'string') {      // textos CSS: mistura numero a numero
      u = Math.max(0, Math.min(1, u));                         // (curvas que passam do ponto nao valem aqui:
                                                               //  desfoque negativo ou cor > 255 quebram o CSS)
      const A = normCor(a).split(/(-?\d*\.?\d+)/), B = normCor(b).split(/(-?\d*\.?\d+)/);
      if (A.length === B.length && A.every((s, i) => i % 2 || s === B[i])) {
        return A.map((s, i) => (i % 2 ? String(+(+s + (+B[i] - +s) * u).toFixed(3)) : s)).join('');
      }
    }
    return u < 0.5 ? a : b;                 // nao da para misturar: troca no meio do caminho
  }
  function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function aleatorio(semente) {             // sempre a mesma sequencia para a mesma semente (video = previa)
    let a = semente >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  // ruido suave que fecha o loop: so ciclos inteiros dentro da duracao
  function ruido(t, dur, vel, semente) {
    const rnd = aleatorio(semente); let v = 0;
    for (let j = 1; j <= 3; j++) v += Math.sin(2 * Math.PI * (Math.max(1, vel) * j + j - 1) * t / dur + rnd() * 6.283) / j;
    return v / 1.83;
  }
  function piscada(t, dur, vel, semente) {
    const rnd = aleatorio(semente); let m = 0;
    const n = Math.max(1, Math.round(vel * 3));
    for (let i = 0; i < n; i++) {
      const tb = rnd() * dur, larg = 0.03 + rnd() * 0.05;
      let dt = Math.abs(t - tb); dt = Math.min(dt, dur - dt);
      m = Math.max(m, Math.exp(-((dt / larg) ** 2)));
    }
    return Math.max(m, 0.12 * (0.5 + 0.5 * ruido(t, dur, vel * 4, semente + 7)));
  }
  const alfa = (s, f) => (typeof s === 'string' ? normCor(s).replace(/rgba\(([^)]+)\)/g, (m, a) => {
    const p = a.split(/[\s,/]+/).filter(Boolean);
    return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${+(parseFloat(p[3] ?? 1) * f).toFixed(3)})`;
  }) : s);
  const MEXE_NO_BRILHO = new Set(['piscar', 'respirar']);
  // efeitos continuos: somam por cima dos valores do instante. Para criar um novo, acrescente um "else if" aqui
  // e o nome dele em app/js/presets.js.
  function continuos(v, lista, t, dur, c, base) {
    for (const a of lista) {
      const sem = hash(c + a.tipo), vel = a.vel || 1, A = a.int ?? 0;
      const fase = aleatorio(sem)() * 6.283, onda = Math.sin(2 * Math.PI * vel * t / dur + fase);
      if (a.tipo === 'wiggle') {
        v.x = (v.x || 0) + A * ruido(t, dur, vel, sem);
        v.y = (v.y || 0) + A * ruido(t, dur, vel, sem + 1);
        v.r = (v.r || 0) + A * 0.2 * ruido(t, dur, vel, sem + 2);
      } else if (a.tipo === 'flutuar') v.y = (v.y || 0) - A * onda;
      else if (a.tipo === 'balancar') v.r = (v.r || 0) + A * onda;                       // giro de um lado para o outro (graus)
      else if (a.tipo === 'orbita') {                                                    // anda num circulo de raio A
        const ang = 2 * Math.PI * vel * t / dur + fase;
        v.x = (v.x || 0) + A * Math.cos(ang); v.y = (v.y || 0) + A * Math.sin(ang);
      } else if (a.tipo === 'quique') v.y = (v.y || 0) - A * Math.abs(Math.sin(Math.PI * vel * t / dur + fase));   // sobe e bate no chao
      else if (a.tipo === 'pulsar') v.s = (v.s ?? 1) * (1 + A / 100 * onda);
      else if (a.tipo === 'coracao') {                                                   // duas batidas seguidas e uma pausa
        const u = (((vel * t / dur + fase / 6.283) % 1) + 1) % 1;
        const bate = (centro, larg) => { let d = Math.abs(u - centro); d = Math.min(d, 1 - d); return Math.exp(-((d / larg) ** 2)); };
        v.s = (v.s ?? 1) * (1 + A / 100 * (bate(0.12, 0.05) + 0.6 * bate(0.34, 0.06)));
      } else if (a.tipo === 'estrobo') v.o = (v.o ?? base.o ?? 1) * (1 - A / 100 * (0.5 - 0.5 * Math.tanh(3 * onda)));   // acende e apaga
      else if (a.tipo === 'glitch-rgb') {                                                // de vez em quando as cores "descolam"
        const m = piscada(t, dur, vel, sem), dx = m > 0.2 ? +(A * m).toFixed(2) : 0;
        if (dx) {
          const f = v.filtro ?? base.filtro;
          v.filtro = (f && f !== 'none' ? f + ' ' : '') + `drop-shadow(${dx}px 0 0 rgba(255, 0, 90, 0.75)) drop-shadow(${-dx}px 0 0 rgba(0, 255, 255, 0.75))`;
        }
      }
      else if (a.tipo === 'piscar-opac') v.o = (v.o ?? base.o ?? 1) * (1 - A / 100 * piscada(t, dur, vel, sem));
      else if (MEXE_NO_BRILHO.has(a.tipo)) {
        const f = a.tipo === 'piscar' ? 1 - A / 100 * piscada(t, dur, vel, sem) : 1 - A / 100 * (0.5 - 0.5 * onda);
        for (const k of ['filtro', 'tsombra', 'csombra']) {
          const s = v[k] ?? base[k];
          if (s && s !== 'none') v[k] = alfa(s, f);
        }
      }
    }
  }
  // Efeito de entrada: do comeco da camada ("ini") ate "ini + dur", o elemento chega ao lugar dele. Depois disso
  // nao faz mais nada. Soma por cima dos valores do instante (como os continuos), entao convive com keyframes.
  //   ent = { tipo, dur (segundos), int (forca: px, % ou graus, conforme o tipo) }
  // Para criar uma entrada nova: um "case" aqui + o nome dela em app/js/presets.js (ENTRADAS).
  function entrada(v, ent, t, e, c, base) {
    const u = (t - (e.ini || 0)) / Math.max(0.03, ent.dur || 1);
    if (u >= 1) return;                                     // ja entrou
    const uu = Math.max(0, u), A = ent.int ?? 0;
    const p = CURVAS.saida(uu), falta = 1 - p;              // p vai de 0 a 1 freando; "falta" = quanto ainda nao chegou
    const opac = (f) => { v.o = (v.o ?? base.o ?? 1) * f; };
    const surgir = (pressa) => opac(Math.min(1, uu * pressa));   // aparece logo no comeco do movimento
    switch (ent.tipo) {
      case 'aparecer': opac(p); break;
      case 'subir':    v.y = (v.y || 0) + A * falta; surgir(2.5); break;
      case 'descer':   v.y = (v.y || 0) - A * falta; surgir(2.5); break;
      case 'esquerda': v.x = (v.x || 0) - A * falta; surgir(2.5); break;
      case 'direita':  v.x = (v.x || 0) + A * falta; surgir(2.5); break;
      case 'zoom':     v.s = (v.s ?? 1) * (1 - A / 100 * (1 - CURVAS.recuo(uu))); surgir(4); break;
      case 'cair':     v.y = (v.y || 0) - A * (1 - CURVAS.quique(uu)); surgir(6); break;
      case 'girar':    v.r = (v.r || 0) - A * falta; v.s = (v.s ?? 1) * (0.6 + 0.4 * p); surgir(2.5); break;
      case 'desfocar': {
        const f = v.filtro ?? base.filtro;
        v.filtro = `blur(${+(A * falta).toFixed(2)}px)` + (f && f !== 'none' ? ' ' + f : '');
        surgir(2.5); break;
      }
      case 'glitch': {                                      // pula de lugar e pisca em 8 "trancos", cada vez menor
        const n = Math.floor(uu * 8), rnd = aleatorio(hash(c + 'glitch' + n));
        v.x = (v.x || 0) + A * (rnd() * 2 - 1) * (1 - uu);
        opac(n % 2 ? 1 : 0.2 + 0.5 * rnd());
        break;
      }
    }
  }
  // Os tempos gravados tem 4 casas (frame 5 = 5/30 s vira 0.1667): um tiquinho DEPOIS do instante real do
  // frame. Sem esta folga, uma chave ou o comeco de uma camada so valeria um frame mais tarde.
  const FOLGA = 0.001;
  const temJanela = (e) => e.ini > 0 || e.fim != null;
  // valores da edicao de caminho "c" no instante t: base + keyframes (com a curva de cada chave) + efeitos
  // continuos + tempo da camada (fora de ini..fim ela fica escondida)
  function valores(n, c, t, ed, base) {
    const P = pag(n, ed), e = P[c];
    if (!e) return {};
    const v = { ...e }, dur = P._dur || 5;
    if (e.kf && e.kf.length) {
      const ks = [...e.kf].sort((a, b) => a.t - b.t), props = new Set();
      for (const k of ks) for (const p in k) if (!NAO_E_VALOR.has(p)) props.add(p);
      for (const p of props) {
        let a = null, b = null;
        for (const k of ks) { if (k[p] === undefined) continue; if (k.t <= t + FOLGA) a = k; else { b = k; break; } }
        v[p] = !a ? b[p] : !b ? a[p]
          : lerp(a[p], b[p], (CURVAS[a.ease] || CURVAS.suave)(Math.max(0, (t - a.t) / (b.t - a.t))));
      }
      delete v.ease;
    }
    if (e.ent) entrada(v, e.ent, t, e, c, base || {});
    if (e.anim && e.anim.length) continuos(v, e.anim, t, dur, c, base || {});
    // tempo da camada: antes de "ini" e a partir de "fim" ela nao aparece (fim no final da animacao = sem corte)
    if ((e.ini > 0 && t < e.ini - FOLGA) || (e.fim != null && e.fim < dur - FOLGA && t >= e.fim - FOLGA)) v.oculto = true;
    return v;
  }
  const animadoE = (e) => !!e && ((e.kf && e.kf.length > 0) || (e.anim && e.anim.length > 0) || temJanela(e) || !!e.ent);
  const animado = (n, ed) => Object.entries(pag(n, ed)).some(([c, e]) => c[0] !== '_' && animadoE(e));
  // desenha o instante t da pagina n
  function quadro(n, t, ed) {
    const vistos = new Set();
    cada(n, (el, e, c) => {
      vistos.add(el);
      if (!animadoE(e)) { if (el.__ed) estilo(el, e); return; }   // deixou de ser animado: volta ao valor parado
      const o = guardarOriginal(el);
      if (!o.base && ((e.anim && e.anim.length) || e.ent)) {
        estilo(el, e);                      // brilho e opacidade "parados" (so com as edicoes fixas), lidos uma vez
        const cs = getComputedStyle(el);
        o.base = { filtro: normCor(cs.filter), tsombra: normCor(cs.textShadow), csombra: normCor(cs.boxShadow), o: +cs.opacity };
      }
      estilo(el, valores(n, c, t, ed, o.base));
    }, ed);
    // elemento em que o editor tinha mexido e que nao tem mais edicao nenhuma: devolve ao que a arte tinha
    for (const el of tocados) {
      const o = el.__ed;
      if (vistos.has(el) || !el.isConnected || !o.postos.size) continue;
      for (const prop of [...o.postos.keys()]) restaurar(el, prop, o);
      o.postos.clear(); o.base = null;
      limparAtributo(el, o);
    }
  }

  // ───────────────────────── para a arte chamar ─────────────────────────
  async function preparar(n) { n = n || pagina(); await criarNovos(n); aplicarTexto(n); }
  // instante da capa: o que a arte mostra parada (PNG, navegador). Sem "_capa", e o fim da animacao.
  const capa = (n, ed) => { const P = pag(n || pagina(), ed); return P._capa ?? (P._dur || 5); };
  function finalizar(n) { n = n || pagina(); aplicarEstilos(n); if (animado(n)) quadro(n, capa(n)); }
  async function aplicarTudo(n) { await preparar(n); finalizar(n); }

  window.EDLIB = {
    versao: VERSAO,
    // integracao (a arte chama)
    preparar, finalizar, aplicarTudo, quadro, info, pagina,
    duracao: (n, ed) => pag(n || pagina(), ed)._dur || 5,
    capa,
    // usado pelo editor
    raiz, caminho, achar, assinatura, estilo, limpar, criarNovos, aplicarTexto, aplicarEstilos,
    texto, abrirTexto, htmlOriginal, htmlSem, guardarOriginal, valores, animado, normCor, lerp,
    curvas: Object.keys(CURVAS),
    curva: (nome, u) => (CURVAS[nome] || CURVAS.suave)(u),   // a conta de uma curva (o editor desenha o grafico com ela)
  };

  if (AUTO) {
    const ir = async () => {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) { /* segue */ }
      await aplicarTudo();
      document.body.dataset.pronto = '1';
    };
    if (document.readyState === 'complete') ir(); else addEventListener('load', ir);
  }
})();
