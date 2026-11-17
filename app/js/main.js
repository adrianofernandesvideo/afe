// main.js — ponto de entrada do editor: carrega os módulos e abre a arte pedida no endereço.
//
// Mapa dos módulos (quem depende de quem, de baixo para cima — ninguém importa "para cima"):
//   base        estado S, recados (ouvir/avisar), utilitários      menu   menu do botão direito
//   api         conversa com o servidor            css-valores / presets   dados puros
//   arte        iframe: carregar, achar elementos   doc      documento de edições (mudar, desfazer, salvar)
//   texto       edição de texto na arte             selecao  seleção e contornos
//   paineis     modos e painéis laterais            alinhar · palco (mouse) · navegacao · tempo (relógio/keyframes)
//   alcas       alças da caixa de seleção: tamanho, largura/altura, girar
//   camada-acoes  frente/trás, esconder, travar, o que está embaixo do mouse   ·   barra-rapida  a faixa de atalhos
//   tempo-camada  começo/fim de cada camada, mover no tempo, escalonar
//   painel-*    uma aba cada                        folha    folha de keyframes
//   painel-pecas  peças em código do design system (lista na aba Assets + janela para escolher o pedaço)
//   barra-topo · barra-tempo · campos · atalhos     ligações com a tela
//   config      preferências (teclas dos comandos, teclas do mouse)   ·   painel-config  a tela ⚙
// Detalhes e "como acrescentar uma função": docs/ARQUITETURA.md.
import { S, status, ouvir } from './base.js';
import { api } from './api.js';
import * as arte from './arte.js';
import * as doc from './doc.js';
import * as texto from './texto.js';
import * as selecao from './selecao.js';
import * as paineis from './paineis.js';
import * as alinhar from './alinhar.js';
import * as navegacao from './navegacao.js';
import * as tempo from './tempo.js';
import * as folha from './folha.js';
import * as camada from './tempo-camada.js';
import * as assets from './painel-assets.js';
import './palco.js';
import './alcas.js';
import './barra-rapida.js';
import * as acoes from './camada-acoes.js';
import './painel-transformar.js';
import './painel-efeitos.js';
import './painel-forma.js';
import './painel-camadas.js';
import './painel-animacao.js';
import * as pecas from './painel-pecas.js';
import { listarArtes } from './barra-topo.js';
import './barra-tempo.js';
import './campos.js';
import './atalhos.js';
import './lista-atalhos.js';
import './importar.js';
import * as config from './config.js';
import { abrirConfig } from './painel-config.js';

// para depurar no console do navegador e para o teste automático (testes/teste_rapido.py)
window.ED = { S, api, arte, doc, texto, selecao, paineis, alinhar, navegacao, tempo, folha, camada, acoes, assets, pecas, config, abrirConfig };

async function iniciar() {
  const q = new URLSearchParams(location.search);
  let arquivo = q.get('arquivo');
  const pagina = Math.max(1, +(q.get('pagina') || 1));
  // ?modo=editar ou ?modo=animar: abre já com o modo ligado (a demo online usa; vale também para links).
  // No animar, a animação toca uma vez e para no fim (no frame 0 a arte costuma estar quase vazia).
  const modo = q.get('modo');
  if (modo === 'editar' || modo === 'animar') {
    let feito = false;
    ouvir('arte', () => {
      if (feito || !S.lib) return;
      feito = true;
      paineis.definirEdicao(true);
      if (modo === 'animar') { paineis.definirAnimacao(true); setTimeout(() => tempo.tocarTrecho(0, Infinity), 400); }
    });
  }
  listarArtes();
  if (!arquivo) {                                           // sem arte no endereço: a última usada, ou a primeira ligada
    try {
      const { itens } = await api.artes();
      let ultima = null;
      try { ultima = localStorage.getItem('afe:ultima'); } catch (e) { /* sem armazenamento */ }
      const achada = itens.find((a) => a.caminho === ultima) || itens.find((a) => a.ligada) || itens[0];
      arquivo = achada ? achada.caminho : null;
    } catch (e) { status('sem conexão com o servidor do editor', 'erro'); return; }
  }
  if (arquivo) navegacao.abrirArte(arquivo, pagina);
  else status('nenhuma arte .html nesta pasta — veja o LEIA.md do editor', 'erro');
}
iniciar();
