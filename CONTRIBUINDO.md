# Como contribuir

**Português (BR)** · [English](CONTRIBUTING.md)

Obrigado por querer melhorar o AFE! Relatos de uso, ideias e correções ajudam igual.

## Antes de começar

1. Leia o [LEIA.md](LEIA.md) (como abrir) e a [ARQUITETURA](docs/ARQUITETURA.md) (como o código se
   organiza). As [DESCOBERTAS](docs/DESCOBERTAS.md) explicam as decisões que parecem estranhas — vale ler
   antes de "consertar" algo.
2. Ideias em aberto estão no [ROTEIRO](docs/ROTEIRO.md), em *Ideias e pendências*.

## Ao mudar o código

- **Rode o teste automático** antes de propor a mudança:

  ```bash
  python testes/teste_rapido.py          # ~1 minuto
  python testes/teste_rapido.py --video  # também gera um vídeo (precisa do ffmpeg)
  ```

  Ele usa o editor de verdade num navegador escondido, numa pasta temporária (não mexe em nada seu).
  Função nova pede uma conferência nova no teste.
- **Registre no [CHANGELOG](docs/CHANGELOG.md)** o que mudou, em linguagem simples; se aprendeu algo que não
  é óbvio, anote nas DESCOBERTAS.
- **A documentação tem duas línguas:** ao mudar um documento, atualize as duas versões (`docs/` em português,
  `docs/en/` em inglês). Se só conseguir escrever uma, avise no pull request que alguém traduz.
- **Mudou a biblioteca das artes** (`arte/edicoes-lib.js`)? Suba a revisão em três lugares: o comentário do
  topo, `const VERSAO` e `LIB_ATUAL` em `app/js/arte.js`. Copie o arquivo também para `exemplo/`.

## Convenções

- Sem dependências: o servidor usa só a biblioteca padrão do Python, e a tela é JavaScript puro (módulos ES),
  sem build.
- Nomes e comentários em português; um comentário no topo de cada arquivo dizendo o que ele faz.
- Funções curtas; aparência só em `app/editor.css`; textos da tela em linguagem simples.
- O editor é independente de projeto: nada de caminhos, nomes ou marcas de um projeto específico dentro desta
  pasta — o que é de cada projeto entra pelos parâmetros do servidor (`--raiz`, `--biblioteca`).

## Licença das contribuições

O projeto é AGPL-3.0 (arquivo [LICENSE](LICENSE)). Ao mandar uma contribuição, você concorda que ela entra sob
a mesma licença.

## Relatar um problema

Diga o sistema (Windows, macOS, Linux), a versão do Python e do navegador, o que fez, o que esperava e o que
aconteceu. Se puder, mande uma arte mínima que mostre o problema e a mensagem do console do navegador (F12).
