// campos.js — comportamento comum dos controles da tela do editor (vale para todos os painéis).
import { r1 } from './base.js';
import { abrirGesto, fecharGesto } from './doc.js';
import { temMod } from './config.js';

// campos de número: clicar seleciona tudo (é só digitar por cima)
document.addEventListener('focusin', (ev) => {
  if (ev.target.type === 'number') setTimeout(() => ev.target.select(), 0);
});
// campos de número: a roda do mouse sobe/desce o valor (Shift: de 10 em 10)
document.addEventListener('wheel', (ev) => {
  const t = ev.target;
  if (t.type !== 'number' || t.disabled) return;
  ev.preventDefault();
  const passo = (ev.shiftKey ? 10 : 1) * (+t.step && +t.step < 1 ? +t.step : 1) * ((ev.deltaY || ev.deltaX) < 0 ? 1 : -1);   // (com Shift a roda pode vir "de lado")
  let v = (+t.value || 0) + passo;
  if (t.min !== '') v = Math.max(+t.min, v);
  if (t.max !== '') v = Math.min(+t.max, v);
  t.value = r1(v);
  t.dispatchEvent(new Event('input', { bubbles: true }));
  t.dispatchEvent(new Event('change', { bubbles: true }));
}, { passive: false });
// Depois de clicar num botão (ou escolher num menu / marcar uma caixa), o foco volta para a página. Sem isso,
// espaço e Enter repetiriam o último botão clicado em vez de valer como atalho do editor (tocar, apagar...).
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('button');
  if (b) b.blur();
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.tagName === 'SELECT' || t.type === 'checkbox') t.blur();
});

// Campos de número: clicar e arrastar para os lados muda o valor (como no After Effects e no Photoshop).
//   Shift = 10 vezes mais rápido · Alt = 5 vezes mais devagar (ajuste fino)
// Só vira arrasto depois de 3 px: um clique simples continua servindo para digitar. Com o campo já em foco
// (digitando), o mouse volta a selecionar o texto. O arrasto inteiro é um passo só do desfazer.
let puxa = null;                                            // { campo, ux (último x do mouse), acum, v0, movido }
function soltarCampo() {
  if (puxa && puxa.movido) {
    fecharGesto();
    document.body.classList.remove('arrastando', 'puxando');
    // Soltar o botão gera um "clique" no que estiver embaixo do mouse. Se for o rótulo do campo, o navegador
    // devolveria o foco ao campo (e as setas passariam a mexer nele): esse clique é engolido.
    const engolir = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    addEventListener('click', engolir, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', engolir, { capture: true }), 0);
  } else if (puxa) puxa.campo.focus();                      // clique simples: agora sim, o campo recebe o foco para digitar
  puxa = null;
}
document.addEventListener('mousedown', (ev) => {
  const t = ev.target;
  if (ev.button !== 0 || t.type !== 'number' || t.disabled || document.activeElement === t) return;
  if (ev.clientX > t.getBoundingClientRect().right - 18) return;   // as setinhas do campo continuam funcionando
  // O clique normal começaria a selecionar o texto — e essa seleção devolve o foco ao campo no meio do arrasto.
  // Por isso o foco fica por nossa conta: só entra ao soltar, se foi um clique simples.
  ev.preventDefault();
  if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  puxa = { campo: t, ux: ev.clientX, acum: 0, v0: +t.value || 0, movido: false };
});
addEventListener('mousemove', (ev) => {
  if (!puxa) return;
  if (!(ev.buttons & 1)) { soltarCampo(); return; }         // o botão foi solto fora da janela
  puxa.acum += (ev.clientX - puxa.ux) * (temMod(ev, 'rapido') ? 10 : temMod(ev, 'fino') ? 0.2 : 1);   // (teclas trocáveis em ⚙ Config)
  puxa.ux = ev.clientX;
  if (!puxa.movido) {
    if (Math.abs(puxa.acum) < 3) return;
    puxa.movido = true; puxa.acum = 0;                      // (o valor começa a andar daqui, sem pulo)
    abrirGesto();
    document.body.classList.add('arrastando', 'puxando');   // a arte para de "engolir" o mouse; cursor de arrasto
    return;
  }
  const t = puxa.campo, passo = +t.step > 0 ? +t.step : 1, casas = (String(passo).split('.')[1] || '').length;
  let v = puxa.v0 + Math.round(puxa.acum) * passo;
  if (t.min !== '') v = Math.max(+t.min, v);
  if (t.max !== '') v = Math.min(+t.max, v);
  const texto = v.toFixed(casas);
  if (texto === t.value) return;
  t.value = texto;
  t.dispatchEvent(new Event('input', { bubbles: true }));
  t.dispatchEvent(new Event('change', { bubbles: true }));
});
addEventListener('mouseup', soltarCampo);

// Sliders: duplo clique volta ao valor padrão. O padrão de cada slider vem escrito nele (data-padrao="100").
// (Slider sem data-padrao numérico não reage aqui — ex.: "Cantos", cujo padrão é o da arte: o painel cuida.)
const temPadrao = (t) => t && t.type === 'range' && !t.disabled && t.dataset.padrao != null && !isNaN(+t.dataset.padrao);
document.addEventListener('dblclick', (ev) => {
  const t = ev.target;
  if (!temPadrao(t)) return;
  t.value = t.dataset.padrao;                               // (os dois cliques já mexeram no slider: o padrão vai por cima)
  t.dispatchEvent(new Event('input', { bubbles: true }));
  t.dispatchEvent(new Event('change', { bubbles: true }));
});
// a dica aparece ao passar o mouse (sem precisar escrever o texto em cada slider)
document.addEventListener('mouseover', (ev) => {
  const t = ev.target;
  if (t && t.type === 'range' && t.dataset.padrao != null && !t.dataset.dica) {
    t.dataset.dica = '1';
    t.title = (t.title ? t.title + ' · ' : '') + 'duplo clique: volta ao padrão';
  }
});
