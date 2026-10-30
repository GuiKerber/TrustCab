# TrustCab — Design System

Fonte única de decisões visuais do TrustCab Driver e, no futuro, do app do passageiro.
Os valores vivem em código em `packages/ui/src/theme/tokens.ts`. Este documento explica o que cada token é e quando usar. O Storybook (`npm run storybook`) mostra cada token e cada componente em todos os estados.

**Regra geral:** nenhum componente usa cor, tamanho, espaço, raio, borda, opacidade, duração ou limite de gesto fora dos tokens. Se faltar um valor, ele entra primeiro em `tokens.ts` (e aqui), depois no componente.

Exceção única: coordenadas internas de ilustrações SVG (ex.: o desenho do percurso), que são arte, não medida de interface.

---

## 1. Direção visual

- App escuro. Topo e menu fundidos ao fundo, sem barras separadas.
- As viagens são cartões de cor clara; cada viagem do dia puxa uma cor da sequência de cartões.
- Tipografia editorial: **números grandes** (horário, valor), **nome médio**, **endereço pequeno**.
- Blocos conectados com cantos grandes e muito espaço vazio.
- Traços de percurso são sempre contínuos. Nunca pontilhado.

## 2. Camadas de token

1. **Primitivos** (`palette`, `fontSize`, `lineHeight`, `letterSpacing`): valores crus, sem significado. Componentes não usam primitivos direto.
2. **Semânticos** (`colors`, `type`, `spacing`, `radius`, `borderWidth`, `opacity`, `gradient`, `size`, `layout`, `motion`, `spring`, `gesture`): o papel do valor na interface. É o que os componentes usam.
3. **Componentes** (`Button`, `IconButton`, `Pills`…): combinam semânticos e cobrem todos os estados.

## 3. Cores

### 3.1 Primitivas (`palette`)

Revisão de 18/09/2026: tons com contraste menor que 1,15:1 entre si eram indistinguíveis e foram fundidos (branco → 50, 500 → 400, 700 e 800 → 750, 950 → 900). A escala neutra caiu de 11 para 6 valores.

| Token | Valor | Observação |
|---|---|---|
| `neutral.50` | #F2F2EE | Texto principal no escuro e preenchimento dos controles claros |
| `neutral.400` | #9C9C95 | Texto de apoio |
| `neutral.600` | #44443F | Linha forte |
| `neutral.750` | #2A2A2A | Superfície elevada, linha e cartão encerrado |
| `neutral.850` | #1F1F1F | Superfície |
| `neutral.900` | #141414 | Fundo e tinta |
| `yellow` | #F4E04D | Cartão 1 |
| `lilac` | #C9B8F4 | Cartão 2 |
| `sky` | #B8DDEA | Cartão 3 |
| `peach` | #F2CBA2 | Cartão 4 |
| `mint` | #C6E4C9 | Cartão 5 |
| `orange` | #F26A2E | Acento |
| `red` | #F25C5C | Só o que não tem volta (excluir conta) |
| `inkAlpha.14 / 30 / 70` | #141414 a 14%, 30%, 70% | Traços e texto sobre cartões |
| `whiteAlpha.45` | branco a 45% | Clareia a cor do cartão (círculo da seta no percurso) |
| `blackAlpha.55` | preto a 55% | Camada atrás de folhas |

### 3.2 Semânticas (`colors`)

| Token | Primitivo | Uso |
|---|---|---|
| `ground` | neutral.900 | Fundo de todas as telas, topo e menu |
| `surface` | neutral.850 | Blocos, células do calendário, botões "surface" |
| `surfaceRaised` | neutral.750 | Bloco dentro de bloco, pedido já respondido, prévia da cobrança, Toast |
| `line` | neutral.750 | Bordas e divisores sobre `ground` e `surface` |
| `lineStrong` | neutral.600 | Bordas e divisores sobre `cardDone` e `surfaceRaised`, bolinha de viagem cancelada |
| `text` | neutral.50 | Texto principal no escuro; fundo do botão "light" e da pílula escolhida |
| `textSecondary` | neutral.400 | Texto de apoio (tom `secondary`) |
| `ink` | neutral.900 | Texto e traços sobre cartões claros; botão "ink" |
| `inkSecondary` | inkAlpha.70 | Texto de apoio sobre cartões |
| `inkFaint` | inkAlpha.30 | Trecho do percurso que falta, QR reservado |
| `inkLine` | inkAlpha.14 | Divisores e halos sobre cartões |
| `tintOnCard` | whiteAlpha.45 | Círculo da seta no percurso |
| `cards[0..4]` | yellow, lilac, sky, peach, mint | Cor de cada viagem do dia, em ordem |
| `cardDone` | neutral.750 | Cartão de viagem concluída ou cancelada |
| `orange` | orange | Não lido, hoje, ação destrutiva |
| `danger` | red | Botão "danger": ação sem volta (excluir conta). Texto `ink` por cima, 5,6:1 |
| `scrim` | blackAlpha.55 | Camada atrás de folhas e modais |
| `focusOnDark` / `focusOnCard` | neutral.50 / neutral.900 | Anel de foco no escuro / sobre cartão |

### 3.3 Contraste verificado (texto)

| Par | Razão |
|---|---|
| text sobre ground | 16,4:1 |
| textSecondary sobre ground / surface / cardDone | 6,7 / 6,0 / 5,2:1 |
| ink sobre qualquer cartão | ≥ 10,2:1 |
| inkSecondary sobre qualquer cartão | ≥ 5,2:1 |
| orange sobre ground / surface | 6,0 / 5,4:1 |

Cor nunca é o único sinal de estado: toda situação tem também texto, ícone ou forma (borda, preenchimento do nó).

## 4. Tipografia

Famílias (`fonts`): Inter 400/500/600 para texto e Inter Tight 700 para números e títulos.

### 4.1 Primitivos

| Degrau | `fontSize` | `lineHeight` |
|---|---|---|
| xs | 12 | 16 |
| sm | 14 | 20 |
| md | 16 | 24 |
| lg | 20 | 28 |
| xl | 28 | 32 |
| 2xl | 40 | 44 |
| 3xl | 56 | 56 |
| 4xl | 88 | 84 |

Régua de 4: todo tamanho e toda linha são múltiplos de 4. A exceção documentada é `sm` (14), o tamanho de apoio: 12 fica ilegível num endereço longo e 16 apaga a hierarquia contra o corpo.

No Android, a linha de xl, 2xl, 3xl e 4xl cresce para o menor múltiplo de 4 acima de ~1,22× o tamanho (36, 52, 72, 108): com a linha justa ele recorta as letras. iOS e web mantêm a linha justa.

`letterSpacing`: label 0,9 · none 0 · body −0,1 · heading −0,4 · title −1 · displaySm −1,4 · display −2,2 · hero −3,6.

### 4.2 Estilos semânticos (`type`)

| Estilo | Família | Tamanho | Uso |
|---|---|---|---|
| `hero` | Inter Tight 700 | 4xl | Horário no cartão ampliado |
| `display` | Inter Tight 700 | 3xl | Horário na pilha, título do dia, total do mês, número do dia na agenda |
| `displaySm` | Inter Tight 700 | 2xl | Valor e tempo no cartão; título com data ("Domingo, 20/09") |
| `title` | Inter Tight 700 | xl | Mês na agenda, total por passageiro |
| `heading` | Inter 500 | lg | Nome do passageiro |
| `body` / `bodyMedium` | Inter 400 / 500 | md | Texto corrido / rótulos de botão médio |
| `small` | Inter 400 | sm | Endereços, apoio, rótulo de botão pequeno |
| `label` | Inter 500, caixa alta | xs | Rótulos ("PARTIDA", "HOJE · AGENDADA") |

Regra: um título nunca passa de duas linhas. Se a data não cabe em `display`, desce para `displaySm`.

## 5. Espaço, raio, borda, opacidade

- **`spacing`**: 4 · 8 · 12 · 16 · 20 · 28 · 40 · 56. Régua de 4, nada fora dessa escala.
- **`layout`**: margem da tela `screenPadding` 16 · recuo do texto solto `textInset` 4 (títulos de página, dicas e cabeçalhos de folha entram 4 além da margem) · intervalo entre blocos `gap` 8 · alvo de toque `touchTarget` 48 · linha `hairline` 1 · altura máxima de folha `sheetMaxHeight` 88% · proporção do cartão de total largo `statWideFlex` 1,6 · espaço no fim de telas roláveis `scrollEnd` 96.
- **`radius`**: joined 4 (bloco colado a outro, alça das folhas) · sm 8 (linhas dentro de bloco, etiqueta) · md 16 (célula do calendário) · blockSm 20 (campo de texto, opções) · block 24 (blocos e folhas) · card 32 (cartões de viagem). Pílulas e círculos não têm token: o raio é metade da altura do elemento (um raio "infinito" é ignorado pelo Android em formas não quadradas).
- **`borderWidth`**: hairline 1 · strong 2 (seleção, hoje, anel de foco).
- **`opacity`**: hover 0,94 · pressed 0,88 · pending 0,7 (mensagem esperando internet, pulso do esqueleto) · disabled 0,35.
- **`gradient.routeFade`**: degradê da rua no percurso — cheia entre 0,2 e 0,8 do comprimento, termina com opacidade 0,2.

## 6. Tamanhos (`size`)

| Token | Valor | Uso |
|---|---|---|
| `touchTarget` | 48 | Área mínima de toque de qualquer controle |
| `icon.sm / md / lg / xl / 2xl` | 16 / 20 / 24 / 40 / 64 | Botão pequeno e avisos em linha / botão médio / ícones soltos e menu / tela de erro / viagem paga |
| `button.sm / md` | 44 / 56 | Altura dos botões com texto |
| `iconButton.sm / md` | 36 / 48 | Botões redondos (o pequeno ganha área de toque até 48) |
| `row.md / lg` | 56 / 72 | Linha de lista com uma linha de texto (opções, meses) / com título e valor (Perfil) |
| `avatar` | 48 | Inicial do passageiro |
| `brandMark` | 36 | Círculo da marca no login |
| `badge` | 12 | Ponto laranja de pendência (pedidos esperando) |
| `dot.xs / md / lg / xl` | 4 / 8 / 12 / 16 | Bolinhas de viagem, nós e marcadores |
| `handle` | 40 × 4 | Alça das folhas |
| `tabSlot` / `tabItem` | 64 × 44 / 56 | Menu inferior |
| `pillMinWidth` / `dayPillMinWidth` | 64 / 72 | Pílulas de mês/passageiro e de dia |
| `calendarCell` | 56 | Célula do calendário |
| `agendaDayMinHeight` / `agendaDayNumber` | 132 / 72 | Lista dia a dia da agenda |
| `personCardMinHeight` | 88 | Cartão de passageiro em Ganhos |
| `statCardMinHeight` | 196 | Cartões de total na página do passageiro |
| `field` | 56 | Campo de texto |
| `checkbox` | 24 | Caixa de seleção |
| `toggle` | 48 × 28, bolinha 20 | Interruptor (liga/desliga) |
| `routeBubble` | 44 | Círculo da seta no percurso |
| `routeStroke` | 16 | Espessura da rua no percurso |
| `layout.statWideFlex` | 1,6 | Proporção do cartão de total largo ao lado do estreito |
| `passengerStack.*` | card 208 · peek 92 | Pilha de passageiros |
| `timeColumn` | 44 | Coluna de horário em listas |
| `routeNode` / `routeRail` / `routeLeg` | 24 / 2 / 12 | Linha do tempo do percurso (nó, trilho, altura mínima do trecho) |
| `routeMapWidth` / `routeMinHeight` | 104 / 152 | Ilustração do percurso |
| `qr` | 240 | QR Code Pix, grande para a câmera do passageiro ler |
| `stack.*` | card 236 · peek 116 | Pilha de viagens da home |

## 7. Movimento e gestos

- **`motion`**: fast 150 · base 220 · slow 300 ms. Nada de resposta a toque fora de 150–300 ms. `pulse` 900 ms é só o brilho ambiente do esqueleto (carregando); com "Remover animações", fica parado. `toast` 4500 ms é tempo de leitura, não de animação: quanto o aviso de confirmação fica na tela.
- **`maxFontScale.display`** 1,25: com fonte grande no celular, textos comuns crescem livremente; `hero`, `display`, `displaySm` e `title` param nesse limite para não quebrar horários e títulos.
- **`spring`**: damping 18 · stiffness 220 (cartão voltando para a pilha).
- **`gesture`**: activation 10 · hold 200 ms (segurar antes de puxar; antes disso, arrastar rola a tela) · holdScale 1,02 (o cartão cresce ao ser pego) · reveal 96 (o cartão puxado mostra o que estava escondido) · resistance 0,4 · expand 150 (a partir daqui o cartão cresce até a folha da viagem) · closeThreshold 120 · scrollThrottle 32 ms.
- Toda animação é desligada quando o sistema pede "Remover animações" (`useReducedMotion`).

## 8. Componentes

### 8.1 Button (`components/Button.tsx`)

Dois tamanhos: **médio (padrão)** e **pequeno (só para ações secundárias)**.

| | Médio `md` | Pequeno `sm` |
|---|---|---|
| Altura | 56 | 44 (área de toque continua 48) |
| Padding horizontal | 20 | 16 |
| Ícone | 20 | 16 |
| Texto | `bodyMedium` | `small` |

Variantes:

| Variante | Fundo | Texto | Onde |
|---|---|---|---|
| `ink` | ink | text | Ação principal sobre cartão claro |
| `light` | text (neutral.50) | ink | Ação principal sobre o escuro |
| `surface` | surface | text | Ação secundária direto sobre o fundo |
| `ghost` | transparente | text (ou ink sobre cartão) | Ação terciária ("Voltar sem enviar") e secundária dentro de um bloco `surface` |
| `danger` | danger | ink | Só o que não tem volta (excluir conta) |

`destructive` troca o texto para `orange` (ex.: "Não aconteceu", "Marcar como não enviada").

Dentro de um bloco `surface`, um botão `surface` some no fundo: lá a ação secundária é `ghost`.

Estados (todos obrigatórios):

| Estado | Como aparece |
|---|---|
| Padrão | Cores da variante |
| Hover (web) | Opacidade `hover` |
| Foco (teclado) | Anel `borderWidth.strong` por fora, `focusOnDark` ou `focusOnCard` (`onCard`) |
| Pressionado | Opacidade `pressed` |
| Desabilitado | Opacidade `disabled`, não recebe toque |
| Carregando | Indicador de atividade no lugar do ícone, texto mantido, toque bloqueado, leitor de tela anuncia "ocupado". Nunca trocar o rótulo por "Salvando…" com o botão desabilitado: use `loading`. Com duas ações lado a lado, só a tocada carrega; a outra fica desabilitada. |

Erro e vazio não são estados do botão: o erro aparece em texto perto da ação (o que houve e o que fazer), e um botão nunca fica sem rótulo.

### 8.2 IconButton

Botão redondo só com ícone. Mesmos estados do Button, incluindo carregando. Variantes `surface`, `light`, `ink`. Tamanhos `md` 48 (padrão) e `sm` 36, este com a área de toque ampliada até 48. Aceita `badge` (ponto laranja; o leitor de tela ouve "Pedidos, 2 esperando você"). Sempre com `label` descritivo e curto: a contagem é o badge que junta.

### 8.3 Pills e DaySlider

Faixas horizontais fundidas ao fundo. Selecionado: pílula `text` com texto `ink`. Hover e pressionado: fundo `surface`. Foco: anel. Sem barra de rolagem; o corte na borda da tela mostra que há mais.

`Pills` troca o que a tela mostra (abas: Ativos/Arquivados, mês, passageiro) ou responde um formulário (`role="radio"`: intervalo, vagas, tipo de chave Pix). O desenho é o mesmo; muda o que o leitor de tela anuncia.

### 8.4 TopBar

Topo de toda aba: nome da página à esquerda e, no canto direito, a ação da página ou, quando ela não tem, a **caixa de pedidos** com o ponto laranja de quem está esperando resposta. Sem internet, a faixa `OfflineNotice` aparece logo abaixo.

### 8.5 TripStack (home)

Pilha de cartões das viagens do dia, em ordem de embarque; concluídas e canceladas vão para o fim, escuras e com borda. Tocar, ou segurar e puxar para cima além de `gesture.expand`, abre o cartão ampliado (ver CardStack). O foco fica por dentro do cartão.

### 8.6 TripSheet (cartão ampliado)

Sobe do rodapé com a cor do cartão. Mostra horário (`hero`), nome (`heading`), a linha do tempo do percurso ao lado da ilustração, o valor combinado (`displaySm`) e a próxima ação.

Fluxo da viagem, sempre nesta ordem:

| Estado | Posição da seta | Ação principal | Mapa abre |
|---|---|---|---|
| Agendada | Sua localização | Estou a caminho | Partida |
| A caminho | Entre você e a partida | Cheguei | Partida |
| Na partida | Partida | Começar viagem | Destino |
| Em viagem | Entre a partida e o destino | Concluir viagem | Destino |
| Concluída | — | Ver gastos | — |
| Cancelada | — | Reativar viagem | — |

**Viagem concluída:** o fundo passa da cor da viagem para `cardDone` (transição de `motion.slow`, sem animação com "Remover animações"). Percurso, tempo e mapa somem; ficam só o valor combinado (`display`, centralizado) e o QR Code Pix (`size.qr`, sem moldura, centralizado), para o passageiro pagar na hora, e "Marcar como pago".

O botão de mapa (IconButton `map`) fica ao lado da ação principal. Endereços não têm botões próprios. Toda ação pode ser desfeita pelos três pontos ("Desfazer…", "Voltar para não concluída", "Reativar viagem").

### 8.7 Percurso (`components/Route.tsx`)

- **Linha do tempo:** três pontos (Você / Partida / Destino). Nó com halo; cheio quando alcançado, vazado quando não. O trecho feito é forte e o que falta é apagado. Quando a seta está entre dois pontos, aparece um ponto no meio com "A caminho" ou "Em viagem".
- **Ilustração:** ruas sugeridas, rota em curvas e a seta de navegação. Não é um mapa real. Estica só na altura, para a seta nunca distorcer.
- Traço sempre contínuo.

### 8.8 MonthGrid e Agenda

O mês é navegável (setas, ±6 meses). O número de viagens fica junto do mês. Cada célula mostra uma bolinha por viagem na cor do cartão (até 3; acima disso, o número sozinho, que sempre cabe na célula); sem bolinha = dia livre. Hoje: número e borda laranja. Selecionado: borda clara. Abaixo, o mês dia a dia; tocar um dia na grade rola até ele.

### 8.9 Passageiros

- **Lista:** título editorial ("Sua rede de confiança") com o atalho para o link no topo, e abas **Ativos** e **Arquivados**, nunca misturadas. Ninguém espera aprovação para ser passageiro: quem marca pelo link entra sozinho; o que o motorista confirma são os pedidos (tela Pedidos).
- **PassengerCard:** topo com o nome e uma linha de apoio, respiro, e na base "Ver detalhes" com a seta. Ativo: cor da sequência de cartões, com o mês e o total (`displaySm`), só concluídas. Arquivado: `cardDone` com borda.
- **Página do passageiro:** `Tag` (Ativo/Arquivado), nome (`display`), telefone e desde quando. Pedido esperando vira `Banner` com "Abrir os pedidos". Dois `StatCard` (viagens concluídas e custo total), abas "Combinado" e "Gastos por mês" (`TotalRow` em `ListGroup`, abre Ganhos) e "Gerar cobrança". Arquivar e encerrar confirmam com `Toast`; erro fica fixo, com ícone, até a próxima tentativa. Arquivado sempre pode voltar ("Tirar do arquivo").

### 8.10 TextField

Rótulo acima, campo `surface` com `radius.blockSm` e altura `size.field`. Estados: padrão (borda `line`), hover (`lineStrong`), foco (borda `text` 2), erro (borda `orange` 2 + ícone + texto do que houve e o que fazer), desabilitado (`opacity.disabled`). Dica abaixo some quando há erro.

### 8.11 CardStack

Pilha de cartões usada na home (viagens) e em Passageiros. Cada cartão mostra o topo; o último aparece inteiro. A pilha tem a altura do conteúdo e a tela rola, então qualquer quantidade cabe. Arrastar direto rola a tela; segurar o cartão (`gesture.hold`) e puxar para cima revela o conteúdo escondido atrás do cartão de baixo (até `gesture.reveal`); puxar além de `gesture.expand` abre. Na home, a folha da viagem nasce do tamanho e da posição do cartão e cresce até a tela cheia (`motion.slow`); fechar pela seta devolve a folha ao cartão.

### 8.12 TextButton, Checkbox, ListRow, Avatar

- **TextButton:** texto grande (`title`) com seta; ação única de telas editoriais (login). Estados do Button, incluindo carregando.
- **Checkbox:** linha inteira tocável, caixa `size.checkbox`; marcada mostra ✓ (não só cor).
- **ListRow:** linha em blocos conectados (Perfil) com ícone, título, valor e chevron; `pending` marca o que falta configurar com ícone + texto laranja. Fica dentro de um `ListGroup`, que diz quem é a primeira e a última.
- **Avatar:** inicial do passageiro na cor dele; decorativo, o nome sempre aparece ao lado.

### 8.13 WhatsApp no lugar de conversa

Na versão 2 não existe conversa dentro do app. O ícone de chat (página do passageiro, folha da viagem) abre o WhatsApp com a pessoa, e toda mensagem que o produto escreve (a caminho, cheguei, cancelei, cobrança do mês, resposta a um pedido) abre o WhatsApp com o texto pronto. Quem envia é sempre o motorista.

### 8.14 Cancelamento

Cancelar fica no ⋯ da folha da viagem e sempre pede confirmação (ConfirmDialog). Cancela só aquela viagem: cada viagem é um pedido aprovado sozinho, então as outras do mesmo horário continuam. Reativar fica no ⋯ e no botão da viagem cancelada.

### 8.15 FormScreen (teclado)

Toda tela com campo usa o FormScreen: o conteúdo rola por cima do teclado (iOS e Android de ponta a ponta), arrastar ou tocar fora fecha o teclado e a ação principal fica fixa logo acima dele. "Próximo" do teclado leva ao campo seguinte; o último campo salva.

### 8.16 TripOptions, Handle, Block, FadeScroll

- **TripOptions:** folha com as opções dos três pontos. Dentro do cartão ampliado, abre por cima dele (sem segundo modal). Ação destrutiva em `orange` com ícone.
- **Handle:** alça no topo de toda folha que sobe do rodapé.
- **Block:** superfície escura com `radius.block`.
- **FadeScroll:** área rolável sem barra, com degradê no fim enquanto houver mais conteúdo.

### 8.17 Regras de horário e cadastro na viagem

- **"Estou a caminho"** só libera 1 hora antes (`START_WINDOW_MINUTES` em `packages/core/src/rules.ts`). Antes disso, o botão fica desabilitado e embaixo aparece quando libera ("Libera às 06:30, 1 hora antes da viagem").
- **Carro e Pix obrigatórios:** sem eles, no lugar do botão aparece um Banner sobre o cartão com "Cadastrar carro" / "Cadastrar Pix". A Home mostra o mesmo aviso no topo.
- **Avisos ao passageiro:** a caminho, cheguei (com modelo, cor e placa) e cancelei abrem o WhatsApp do motorista com a mensagem escrita. Concluir e marcar como pago são contas do motorista e fecham na cobrança do mês.
- **Marcar como pago:** na viagem concluída. Paga, sai da cobrança do mês e o QR Code dá lugar ao ✓.
- **Viagens esquecidas:** ao abrir o app, as viagens que passaram do fim previsto (`FORGOTTEN_AFTER_MINUTES`, 30 min) ainda abertas aparecem numa folha: "Concluída" ou "Não aconteceu". "Responder depois" pergunta de novo na próxima abertura.

### 8.18 Banner, ConfirmDialog, Toggle

- **Banner:** aviso dentro da tela: ícone, título, texto e até duas ações (a primeira `light`, a segunda `surface`; sobre cartão, `ink` e `ghost`). `warning` pinta ícone e título de `orange`.
- **ConfirmDialog:** folha de confirmação (`Sheet`): pergunta, consequência, botão de confirmar e "Voltar". Tem carregando (tocar fora não fecha enquanto processa) e erro (`InlineNotice`). Excluir conta usa o botão `danger`.
- **Toggle:** linha inteira tocável; ligado = trilho `text` com bolinha `ink` à direita, e "Ligado"/"Desligado" escrito embaixo.

### 8.19 Estados de tela: carregando, erro, sem internet

- **Skeleton:** cada tela tem um esqueleto com a mesma estrutura (home, agenda, lista, conversas), em `surface`, pulsando devagar.
- **ErrorState:** o que houve, o que fazer, "Tentar de novo" e "Voltar para o início". Texto próprio sem internet. Também é o ErrorBoundary do app inteiro.
- **OfflineNotice:** faixa no topo quando o celular fica sem internet. Vem dentro do `TopBar` (abas) e do `BackBar` (FormScreen, Configurações, página do passageiro); a tela de app fechado também mostra. O que foi feito offline sai sozinho quando a conexão volta.

### 8.20 Avisos depois de uma ação

Um jeito só de dizer como a ação foi:

- **Deu certo e a tela não muda:** `Toast` ("Link novo criado", "Chave Pix salva", "Ana foi para o arquivo"). Some sozinho depois de `motion.toast` e o leitor de tela anuncia sem roubar o foco. Não leva botão: um "Desfazer" que some com o tempo é uma armadilha para quem lê devagar. O desfazer de cada ação mora na própria tela ("Tirar do arquivo", "Marcar como não enviada", os três pontos da viagem).
- **Deu errado:** `InlineNotice` em laranja, com ícone, perto do controle que falhou. Fica até a próxima tentativa.
- **Dica ou motivo de um bloqueio:** `InlineNotice` neutro ("Libera às 06:30, 1 hora antes da viagem").

### 8.21 Estrutura e blocos (packages/ui)

Peças que toda tela usa. Se uma tela precisa de algo parecido, ela usa a peça; se a peça não serve, a peça muda (com story), em vez de a tela refazer à mão.

- **ScrollScreen:** tela que rola, sem campos: área segura, margem, topo, intervalo de 20 entre blocos e o fim da rolagem (`layout.scrollEnd` nas abas). Folhas e avisos vão em `overlay`. Telas com campo usam o FormScreen.
- **PageHeader:** título editorial: assunto (`display`), complemento apagado na linha de baixo, `meta` colado ao título (e-mail, telefone) e `lead` com respiro (a frase que explica a tela). `size="displaySm"` para palavra que quebraria no meio ("Configurações").
- **BackBar:** voltar + ações da tela + `OfflineNotice`. Já vem dentro do FormScreen.
- **Sheet:** a folha do rodapé (camada escura, alça, cantos, altura máxima de 88%, área segura, modal para o leitor de tela). Base do ConfirmDialog, do TripOptions e das folhas do app. `inline` desenha por cima de outra camada modal (a folha da viagem).
- **InfoBlock:** bloco sem ação: rótulo e o que ele explica (`text`), o dado em destaque (`value`) ou conteúdo próprio.
- **InlineNotice:** ícone + texto curto perto do que explica: erro (`warning`, laranja) ou dica (`neutral`). `onCard` sobre os cartões claros.
- **ListGroup:** linhas em blocos conectados com rótulo opcional; calcula primeira e última. Serve a ListRow, TotalRow e PersonTotalCard.
- **Tag:** etiqueta de estado com ícone (Ativo, Arquivado).
- **StatCard, TotalRow, PersonTotalCard:** cartão de total, linha de total por período e total por pessoa.
- **TripSheetFrame:** a estrutura da folha da viagem: cor e animação a partir do cartão, horário, pessoa, percurso, valor, menu ⋯ e cancelar. O app passa as ações (`footer`) e o que aparece na concluída (`completedBody`: QR Code Pix).
- **AgendaDay:** um dia da lista da Agenda. Mostra o estado escrito quando a viagem está encerrada ou esperando aprovação.
- **ChipGroup:** várias opções ao mesmo tempo (dias da semana). Marcada: clara e com ✓. Quebra linha em vez de rolar.
- **LoginScreen, SettingsScreen:** login e configurações; o app passa a frase do login e os grupos de avisos.

O app do passageiro da versão 1 (`legacy/passenger/`) ainda importa deste pacote, mas fica fora dos workspaces e não entra em build.

## 9. Regras de interface

- Cartões que são o mesmo componente em cores diferentes usam exatamente a mesma tipografia (estilos, pesos e tamanhos). Só a cor do cartão e o tom do texto (claro/tinta) mudam.
- Cartões têm respiro entre o topo (identificação) e a base (números e ação).

- Nunca usar a barra de rolagem padrão do navegador. Esconder e sinalizar com conteúdo cortado ou degradê.
- Pedidos esperando sempre à vista: canto direito do topo das abas e ponto na aba Passageiros, com a contagem para o leitor de tela.
- Totais de ganhos e cobranças contam só viagens concluídas.
- Datas: "Hoje", "Amanhã", "Ontem"; fora disso, "Domingo, 20/09".
- Toda ação que muda o estado de uma viagem ou cobrança é reversível.
- O passageiro chega pelo link do motorista e já entra na rede dele. O que o motorista confirma são os pedidos, um por um.
- Depois de uma ação: `Toast` para o que deu certo, `InlineNotice` laranja e fixo para o erro (8.20).
- Texto: voz ativa, segunda pessoa, sem jargão. Erro diz o que houve e o que fazer.
- Acessibilidade: contraste de texto ≥ 4,5:1, alvo de toque ≥ 48, foco visível, rótulo em todo controle, estado nunca só por cor.
