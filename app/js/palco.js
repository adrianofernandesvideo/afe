// palco.js — o mouse em cima da arte: selecionar, arrastar (com ímã no centro), roda = tamanho, duplo clique = texto.
// (As teclas abaixo são as padrão; cada papel pode ser trocado em ⚙ Config — por isso o código pergunta
//  temMod(ev, 'papel') em vez de olhar ev.shiftKey / ev.altKey / ev.ctrlKey.)
// Enquanto arrasta:  Shift = trava no eixo (só para os lados ou só para cima/baixo) · Alt = anda 4x mais devagar
//                    Ctrl = solta o ímã.  (Shift apertado ANTES do clique soma à seleção; para travar o eixo,
//                    aperte depois de começar a arrastar.)
// Camada travada: o clique passa por ela (Ctrl+clique seleciona mesmo assim).
// Alt + roda: alterna entre os elementos que estão embaixo do mouse · botão direito: menu da camada.
// Os eventos são ouvidos dentro do documento da arte (iframe); por isso as coordenadas já vêm em pixels da arte.
import { S, $, ouvir, avisar } from './base.js';
import { caminho, raiz, nomeDe } from './arte.js';
import { mudar, atual } from './doc.js';
import { selecionar, selecionados, paraMover, definirHover } from './selecao.js';
import { iniciarTexto, terminarTexto } from './texto.js';
import { sobOPonto, itensDeCamada } from './camada-acoes.js';
import { abrirMenu, fecharMenu } from './menu.js';
import { temMod } from './config.js';

let arrasto = null;                                         // { ux, uy (último ponto do mouse), ax, ay (quanto já andou), inicios: {caminho: {x, y}}, movido }

// elemento que o mouse pega neste ponto: o da frente que dá para selecionar e não está travado
// (Ctrl: pega também os travados). O fundo desenhado em <canvas> só pela lista de camadas.
const alvoDe = (ev) => sobOPonto(ev.clientX, ev.clientY, temMod(ev, 'ignorarTrava'))[0] || null;
function guias(v, h) {
  $('guiaV').style.display = v ? 'block' : 'none';
  $('guiaH').style.display = h ? 'block' : 'none';
}
function soltar() { arrasto = null; guias(false, false); }

// ímã: perto do centro da arte, o elemento gruda nele (linha rosa). Ctrl desliga; com Shift (eixo travado) ou
// Alt (devagar) ele também não puxa.
function ima(ev) {
  guias(false, false);
  if (temMod(ev, 'semIma') || temMod(ev, 'devagar') || temMod(ev, 'eixo') || !S.sel) return;
  const r = S.sel.getBoundingClientRect(), p = raiz().getBoundingClientRect(), tol = 6 / S.escala;
  const dx = (p.left + p.width / 2) - (r.left + r.width / 2), dy = (p.top + p.height / 2) - (r.top + r.height / 2);
  const gx = Math.abs(dx) < tol, gy = Math.abs(dy) < tol;
  if (gx || gy) {
    mudar((e, c) => { if (gx) e.x = atual('x', c) + dx; if (gy) e.y = atual('y', c) + dy; }, { em: 'principal', historia: false });
  }
  guias(gx, gy);
}

ouvir('arte', () => {
  const d = S.d;
  if (!d || !S.lib) return;                                 // documento novo a cada carga: liga tudo de novo
  d.addEventListener('mouseover', (ev) => { if (S.editando && !arrasto) definirHover(alvoDe(ev)); });
  d.addEventListener('mousedown', fecharMenu, true);        // (o clique dentro da arte não chega à tela do editor)
  d.addEventListener('contextmenu', (ev) => {               // botão direito: menu da camada embaixo do mouse
    if (!S.editando || S.editTexto) return;
    ev.preventDefault();
    const todos = sobOPonto(ev.clientX, ev.clientY, true);
    const alvo = selecionados().find((el) => todos.includes(el)) || alvoDe(ev) || todos[0];
    if (!alvo) return;
    if (!S.selPaths.includes(caminho(alvo))) selecionar(alvo);
    const m = $('moldura').getBoundingClientRect(), outros = todos.filter((el) => el !== alvo).slice(0, 6);
    abrirMenu(m.left + ev.clientX * S.escala, m.top + ev.clientY * S.escala, [
      ...itensDeCamada(caminho(alvo)),
      ...(outros.length ? ['-', { titulo: 'Selecionar o que está embaixo' }, ...outros.map((el) => ({ rotulo: nomeDe(el), acao: () => selecionar(el) }))] : []),
    ]);
  });
  d.addEventListener('mouseleave', () => definirHover(null));
  d.addEventListener('mousedown', (ev) => {
    if (!S.editando || ev.button !== 0) return;
    if (S.editTexto && S.editTexto.contains(ev.target)) return;       // clicando dentro do texto em edição
    terminarTexto();
    ev.preventDefault();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    avisar('clique-arte');
    const alvo = alvoDe(ev);
    const somar = temMod(ev, 'somar');
    if (!alvo) { if (!somar) selecionar(null); return; }
    if (somar) selecionar(alvo, true);                      // Shift: soma ou tira da seleção
    else if (!selecionados().some((el) => el.contains(alvo))) selecionar(alvo);
    const inicios = {};
    for (const c of paraMover()) inicios[c] = { x: atual('x', c), y: atual('y', c) };
    if (Object.keys(inicios).length) arrasto = { ux: ev.clientX, uy: ev.clientY, ax: 0, ay: 0, inicios, movido: false };
  });
  d.addEventListener('mousemove', (ev) => {
    if (!arrasto) return;
    if (!(ev.buttons & 1)) { soltar(); return; }            // o botão foi solto fora da arte
    const fator = temMod(ev, 'devagar') ? 0.25 : 1;         // Alt: devagar (soma aos poucos, sem pulo ao apertar/soltar)
    arrasto.ax += (ev.clientX - arrasto.ux) * fator; arrasto.ay += (ev.clientY - arrasto.uy) * fator;
    arrasto.ux = ev.clientX; arrasto.uy = ev.clientY;
    let dx = arrasto.ax, dy = arrasto.ay;
    if (!arrasto.movido && Math.hypot(dx, dy) < 3) return;  // ainda é um clique, não um arrasto
    if (temMod(ev, 'eixo')) { if (Math.abs(dx) >= Math.abs(dy)) dy = 0; else dx = 0; }   // Shift: só no eixo em que andou mais
    const primeiro = !arrasto.movido;
    arrasto.movido = true;
    const ini = arrasto.inicios;
    mudar((e, c) => { e.x = ini[c].x + dx; e.y = ini[c].y + dy; }, { em: Object.keys(ini), historia: primeiro });
    if (Object.keys(ini).length === 1) ima(ev);
  });
  d.addEventListener('mouseup', soltar);
  d.addEventListener('dblclick', (ev) => {
    if (!S.editando || !S.sel) return;
    ev.preventDefault();
    iniciarTexto(S.sel, ev.clientX, ev.clientY);
  });
  d.addEventListener('wheel', (ev) => {
    if (!S.editando || S.editTexto) return;
    const sentido = (ev.deltaY || ev.deltaX) < 0 ? -1 : 1;  // (com Shift, alguns navegadores trocam a roda para os lados)
    if (temMod(ev, 'ciclar')) {                             // Alt + roda: alterna entre os elementos embaixo do mouse
      ev.preventDefault();
      const lista = sobOPonto(ev.clientX, ev.clientY), i = lista.indexOf(S.sel);
      if (lista.length) selecionar(lista[i < 0 ? 0 : (i + sentido + lista.length) % lista.length]);
      return;
    }
    if (!S.sel) return;
    ev.preventDefault();
    const fator = ev.shiftKey ? 1.10 : 1.02;
    mudar((e, c) => { e.s = atual('s', c) * (sentido < 0 ? fator : 1 / fator); }, { lote: 'roda' });
  }, { passive: false });
  d.addEventListener('scroll', () => avisar('layout'), true);
});
addEventListener('mouseup', soltar);
