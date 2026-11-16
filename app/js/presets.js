// presets.js — catálogos da animação. Só dados (nomes e valores padrão): as contas ficam em arte/edicoes-lib.js.
//   CONTINUOS  efeitos que repetem em loop  (conta: função "continuos" da lib)
//   CURVAS     easing dos keyframes         (conta: objeto "CURVAS" da lib)
//   ENTRADAS   efeitos de entrada           (conta: função "entrada" da lib)
// Para criar um efeito ou uma curva: a conta lá + uma linha aqui. Os menus e a folha de keyframes leem daqui.

// Efeitos contínuos: repetem em loop durante toda a animação.
//   forca = valor inicial de "força"   ·   un = unidade mostrada ao lado   ·   vel = "vel" inicial (sem = 1)
export const CONTINUOS = {
  wiggle:        { nome: 'Wiggle suave',        grupo: 'Movimento', forca: 4,  un: 'px' },
  flutuar:       { nome: 'Flutuar',             grupo: 'Movimento', forca: 10, un: 'px' },
  balancar:      { nome: 'Balançar (giro)',     grupo: 'Movimento', forca: 6,  un: '°' },
  orbita:        { nome: 'Órbita',              grupo: 'Movimento', forca: 12, un: 'px' },
  quique:        { nome: 'Quique',              grupo: 'Movimento', forca: 24, un: 'px', vel: 4 },
  pulsar:        { nome: 'Pulsar',              grupo: 'Tamanho',   forca: 3,  un: '%' },
  coracao:       { nome: 'Batida de coração',   grupo: 'Tamanho',   forca: 8,  un: '%',  vel: 4 },
  piscar:        { nome: 'Piscar o glow',       grupo: 'Brilho',    forca: 35, un: '%' },
  respirar:      { nome: 'Respirar o glow',     grupo: 'Brilho',    forca: 40, un: '%' },
  'glitch-rgb':  { nome: 'Glitch RGB leve',     grupo: 'Brilho',    forca: 6,  un: 'px', vel: 2 },
  'piscar-opac': { nome: 'Piscar a opacidade',  grupo: 'Opacidade', forca: 25, un: '%' },
  estrobo:       { nome: 'Estrobo suave',       grupo: 'Opacidade', forca: 60, un: '%',  vel: 5 },
};
export const GRUPOS = ['Movimento', 'Tamanho', 'Brilho', 'Opacidade'];   // ordem dos grupos no menu
export const nomeContinuo = (tipo) => (CONTINUOS[tipo] ? CONTINUOS[tipo].nome : tipo);

// Curvas (easing): como o valor anda de uma chave até a próxima. Fica gravada na chave de onde o trecho sai
// (campo "ease"); a curva padrão não é gravada.
export const CURVAS = {
  suave:   { nome: 'Suave',    dica: 'sai e chega devagar (ease in-out)' },
  linear:  { nome: 'Linear',   dica: 'velocidade constante' },
  entrada: { nome: 'Acelerar', dica: 'sai devagar e acelera (ease in)' },
  saida:   { nome: 'Frear',    dica: 'sai rápido e chega devagar (ease out)' },
  recuo:   { nome: 'Recuo',    dica: 'passa um pouco do ponto e volta' },
  quique:  { nome: 'Quique',   dica: 'chega e quica' },
  degrau:  { nome: 'Degrau',   dica: 'fica parado e troca de uma vez na próxima chave' },
};
export const CURVA_PADRAO = 'suave';
export const nomeCurva = (id) => (CURVAS[id] ? CURVAS[id].nome : id);

// Entradas: o elemento chega ao lugar dele no começo da camada. Uma por camada.
//   forca = valor inicial de "força" (0 = este efeito não tem força)   ·   un = unidade mostrada ao lado
export const ENTRADAS = {
  aparecer: { nome: 'Aparecer',           grupo: 'Simples',        forca: 0,   un: '' },
  desfocar: { nome: 'Desfocado → nítido', grupo: 'Simples',        forca: 24,  un: 'px' },
  subir:    { nome: 'Subir',              grupo: 'Deslizar',       forca: 80,  un: 'px' },
  descer:   { nome: 'Descer',             grupo: 'Deslizar',       forca: 80,  un: 'px' },
  esquerda: { nome: 'Vir da esquerda',    grupo: 'Deslizar',       forca: 120, un: 'px' },
  direita:  { nome: 'Vir da direita',     grupo: 'Deslizar',       forca: 120, un: 'px' },
  zoom:     { nome: 'Zoom (pop)',         grupo: 'Tamanho e giro', forca: 40,  un: '%' },
  girar:    { nome: 'Girar e entrar',     grupo: 'Tamanho e giro', forca: 90,  un: '°' },
  cair:     { nome: 'Cair e quicar',      grupo: 'Com impacto',    forca: 160, un: 'px' },
  glitch:   { nome: 'Glitch',             grupo: 'Com impacto',    forca: 30,  un: 'px' },
};
export const GRUPOS_ENTRADA = ['Simples', 'Deslizar', 'Tamanho e giro', 'Com impacto'];
export const ENTRADA_FRAMES = 30;                            // duração padrão de uma entrada (1 s)
export const nomeEntrada = (tipo) => (ENTRADAS[tipo] ? ENTRADAS[tipo].nome : tipo);
