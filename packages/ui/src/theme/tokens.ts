import { Platform, type TextStyle } from 'react-native';

// Design system do TrustCab. Documentação: projects/trustcab/design.md.
// Nenhum componente usa cor, tamanho, espaço, raio, opacidade ou tempo fora deste arquivo.
// Camadas: primitivos (valores crus, sem significado) → semânticos (o papel na interface) → componentes.

// ─── 1. Cores primitivas ─────────────────────────────────────────────────────
// Revisão de 2026-09-18: tons com contraste menor que 1,15:1 entre si foram fundidos (branco, 500, 700, 800 e 950).
// Na tela eles eram indistinguíveis e só multiplicavam variáveis.
export const palette = {
  neutral: {
    50: '#F2F2EE',
    400: '#9C9C95',
    600: '#44443F',
    750: '#2A2A2A',
    850: '#1F1F1F',
    900: '#141414',
  },
  yellow: '#F4E04D',
  lilac: '#C9B8F4',
  sky: '#B8DDEA',
  peach: '#F2CBA2',
  mint: '#C6E4C9',
  orange: '#F26A2E',
  // Só para o que não tem volta (excluir conta). Texto em tinta por cima: contraste 5,6:1.
  red: '#F25C5C',
  // Tinta (#141414) com transparência, para texto e traços sobre os cartões claros.
  inkAlpha: {
    14: 'rgba(20,20,20,0.14)',
    30: 'rgba(20,20,20,0.3)',
    70: 'rgba(20,20,20,0.7)',
  },
  blackAlpha: { 55: 'rgba(0,0,0,0.55)' },
  // Branco com transparência: clareia a cor do cartão (círculo da seta no percurso).
  whiteAlpha: { 45: 'rgba(255,255,255,0.45)' },
} as const;

// ─── 2. Cores semânticas ─────────────────────────────────────────────────────
export const colors = {
  // Fundo e superfícies escuras
  ground: palette.neutral[900],
  surface: palette.neutral[850],
  surfaceRaised: palette.neutral[750],
  line: palette.neutral[750],
  lineStrong: palette.neutral[600],

  // Texto sobre o fundo escuro. Também é o preenchimento dos controles claros (botão "light", pílula escolhida).
  text: palette.neutral[50],
  textSecondary: palette.neutral[400],

  // Texto e traços sobre os cartões claros
  ink: palette.neutral[900],
  inkSecondary: palette.inkAlpha[70],
  inkFaint: palette.inkAlpha[30],
  inkLine: palette.inkAlpha[14],

  // Cartões de viagem: cada viagem do dia puxa uma cor
  cards: [palette.yellow, palette.lilac, palette.sky, palette.peach, palette.mint] as const,
  // Viagem concluída ou cancelada: cartão escuro, sem cor
  cardDone: palette.neutral[750],

  // Acento: não lido, hoje, ação destrutiva
  orange: palette.orange,
  // Ação destrutiva sem volta (excluir conta)
  danger: palette.red,

  // Camada atrás de folhas e modais
  scrim: palette.blackAlpha[55],

  // Anel de foco do teclado: claro sobre o fundo escuro, tinta sobre os cartões
  focusOnDark: palette.neutral[50],
  focusOnCard: palette.neutral[900],

  // Círculo da seta no percurso: a cor do cartão, mais clara
  tintOnCard: palette.whiteAlpha[45],
} as const;

// ─── 3. Tipografia ───────────────────────────────────────────────────────────
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  display: 'InterTight_700Bold',
} as const;

export const fontSize = { xs: 11, sm: 14, md: 16, lg: 20, xl: 30, '2xl': 40, '3xl': 56, '4xl': 88 } as const;
// Títulos grandes usam linha justa (editorial). O Android recorta as letras quando a linha é menor que a fonte
// (a Inter Tight precisa de ~1,22× o tamanho), então lá a linha dos tamanhos grandes cresce; iOS e web mantêm a justa.
const android = Platform.OS === 'android';
export const lineHeight = {
  xs: 14,
  sm: 19,
  md: 22,
  lg: 26,
  xl: android ? 37 : 34,
  '2xl': android ? 49 : 42,
  '3xl': android ? 68 : 56,
  '4xl': android ? 108 : 84,
} as const;
export const letterSpacing = {
  label: 0.9,
  none: 0,
  body: -0.1,
  heading: -0.4,
  title: -1,
  displaySm: -1.4,
  display: -2.2,
  hero: -3.6,
} as const;

// Fonte grande do sistema (acessibilidade): textos comuns crescem livremente; os títulos, que já são enormes,
// param neste limite para não quebrar o horário do cartão ou cortar palavras.
export const maxFontScale = { display: 1.25 } as const;

// Estilos de texto semânticos: números grandes, textos pequenos.
export const type = {
  // Horário no cartão ampliado
  hero: { fontFamily: fonts.display, fontSize: fontSize['4xl'], lineHeight: lineHeight['4xl'], letterSpacing: letterSpacing.hero },
  // Horário na pilha, título do dia, total do mês
  display: { fontFamily: fonts.display, fontSize: fontSize['3xl'], lineHeight: lineHeight['3xl'], letterSpacing: letterSpacing.display },
  displaySm: { fontFamily: fonts.display, fontSize: fontSize['2xl'], lineHeight: lineHeight['2xl'], letterSpacing: letterSpacing.displaySm },
  title: { fontFamily: fonts.display, fontSize: fontSize.xl, lineHeight: lineHeight.xl, letterSpacing: letterSpacing.title },
  // Nome do passageiro
  heading: { fontFamily: fonts.medium, fontSize: fontSize.lg, lineHeight: lineHeight.lg, letterSpacing: letterSpacing.heading },
  body: { fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: lineHeight.md, letterSpacing: letterSpacing.body },
  bodyMedium: { fontFamily: fonts.medium, fontSize: fontSize.md, lineHeight: lineHeight.md, letterSpacing: letterSpacing.body },
  // Endereços e apoio
  small: { fontFamily: fonts.regular, fontSize: fontSize.sm, lineHeight: lineHeight.sm, letterSpacing: letterSpacing.none },
  label: { fontFamily: fonts.medium, fontSize: fontSize.xs, lineHeight: lineHeight.xs, letterSpacing: letterSpacing.label },
} satisfies Record<string, TextStyle>;

// ─── 4. Espaço, raio, borda, opacidade ───────────────────────────────────────
export const spacing = { 2: 2, 4: 4, 6: 6, 8: 8, 12: 12, 16: 16, 20: 20, 28: 28, 40: 40, 56: 56 } as const;

// Pílulas e círculos não têm token: o raio é sempre metade da altura do elemento (ex.: size.button.md / 2).
// Um raio "infinito" (999) é ignorado pelo Android em formas que não são quadradas e deixa o canto reto.
export const radius = { xs: 2, joined: 4, sm: 8, md: 14, blockSm: 18, block: 24, card: 32 } as const;

export const borderWidth = { hairline: 1, strong: 2 } as const;

// pending: mensagem esperando internet para sair.
export const opacity = { hover: 0.94, pressed: 0.88, pending: 0.7, disabled: 0.35 } as const;

// Degradê da rua no percurso: some no começo (até "start"), fica cheia até "end" e termina quase transparente ("tail").
export const gradient = { routeFade: { start: 0.2, end: 0.8, tail: 0.2 } } as const;

// ─── 5. Tamanhos ─────────────────────────────────────────────────────────────
export const size = {
  // Alvo de toque mínimo de qualquer controle
  touchTarget: 48,
  icon: { sm: 18, md: 20, lg: 22, xl: 40, '2xl': 64 },
  button: { sm: 44, md: 56 },
  iconButton: { sm: 36, md: 48 },
  badge: 10,
  // Contador de não lidas (pílula com número)
  badgeCount: 20,
  dot: { xs: 5, sm: 6, md: 8, lg: 10, xl: 14 },
  handle: { width: 40, height: 4 },
  tabSlot: { width: 64, height: 44 },
  tabItem: 56,
  pillMinWidth: 64,
  dayPillMinWidth: 72,
  calendarCell: 56,
  agendaDayMinHeight: 132,
  agendaDayNumber: 72,
  personCardMinHeight: 88,
  // Pilha de passageiros: cartão inteiro (com respiro entre o nome e "Ver detalhes") e quanto fica à mostra de cada um
  passengerStack: { card: 208, peek: 92 },
  // Cartões de total (viagens e custos) no topo da página do passageiro
  statCardMinHeight: 196,
  // Campo de texto
  field: 56,
  // Altura máxima do campo de mensagem antes de rolar
  composerMaxHeight: 120,
  // Caixa de seleção
  checkbox: 24,
  // Interruptor: trilho e bolinha (altura - bordas - respiro)
  toggle: { width: 48, height: 28, thumb: 20 },
  timeColumn: 44,
  routeNode: 24,
  routeRail: 2,
  routeMapWidth: 104,
  // Círculo da seta no percurso
  routeBubble: 44,
  // Espessura da rua no desenho do percurso
  routeStroke: 14,
  routeMinHeight: 150,
  // QR Code Pix: grande o bastante para a câmera do passageiro ler de longe
  qr: 240,
  stack: { card: 236, peek: 116 },
} as const;

export const layout = {
  screenPadding: 16,
  gap: 8,
  touchTarget: size.touchTarget,
  hairline: borderWidth.hairline,
  // Folhas que sobem do rodapé nunca cobrem a tela inteira
  sheetMaxHeight: '88%',
  // Largura máxima de uma bolha de mensagem
  bubbleMaxWidth: '82%',
  // Proporção do cartão de total largo (valor em reais) ao lado do estreito (contagem)
  statWideFlex: 1.6,
  // Espaço no fim das telas roláveis, para o último item não ficar colado no menu
  scrollEnd: 96,
} as const;

// ─── 6. Movimento e gestos ───────────────────────────────────────────────────
// Durações entre 150 e 300 ms; tudo desliga com "Remover animações".
// pulse: meio ciclo do brilho do esqueleto (carregando). É ambiente, não resposta a toque, então fica fora dos 150–300 ms.
export const motion = { fast: 150, base: 220, slow: 300, pulse: 900 } as const;
export const spring = { damping: 18, stiffness: 220 } as const;

export const gesture = {
  // Quanto o dedo anda antes do gesto começar
  activation: 10,
  // Quanto tempo segurar o cartão antes de puxar (ms). Antes disso, arrastar rola a tela.
  hold: 200,
  // O cartão cresce um pouco ao ser "pego"
  holdScale: 1.02,
  // Puxar um cartão da pilha para cima: até "reveal" ele acompanha o dedo e mostra o que estava escondido;
  // depois sobe com resistência e, passando de "expand", cresce até a página da viagem.
  reveal: 96,
  resistance: 0.4,
  expand: 150,
  // Arrastar o cartão ampliado para baixo fecha a partir daqui
  closeThreshold: 120,
  // Intervalo entre leituras de rolagem (ms)
  scrollThrottle: 32,
} as const;
