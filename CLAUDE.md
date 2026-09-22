# TrustCab

App Android que conecta quem usa o próprio carro como renda extra à própria rede de confiança (família, amigos, conhecidos). Não é marketplace: o passageiro só vê um motorista que o convidou por link e aprovou a conexão.

- PRD: `docs/prd.html` (artifact: https://claude.ai/artifact/LpA3obonJwdAxMr5SxZqAe). Os códigos de requisito (AC-01, CV-05, AG-03…) vêm de lá.
- Plano do MVP: `C:\Users\bighk\.claude\plans\sprightly-hugging-tome.md`.

## Estrutura (monorepo, npm workspaces)
Instale e rode tudo a partir da raiz: `npm install`, `npm run driver`, `npm run passenger`, `npm run storybook`.
- `packages/ui/` — design system dos dois apps: tokens (`src/theme/tokens.ts`), componentes (`src/components/`) e o Storybook (`.storybook/`). Importe com `@trustcab/ui`.
- `packages/core/` — regras, tipos, formatos e dados de exemplo comuns (`@trustcab/core`); login em `@trustcab/core/auth`; permissão de notificação em `@trustcab/core/notifications`.
- `apps/driver/` — TrustCab Driver. Só telas (`src/app`), dados do motorista (`src/data`) e componentes que só existem nele.
- `apps/passenger/` — TrustCab (passageiro). Mesma organização do motorista.
- `mobile/` — versão antiga (app único). Expo SDK 57, expo-router (`src/app`), TypeScript. Não roda no Expo Go: exige dev build (EAS).
- `firebase/` — regras do Firestore, Cloud Functions (TypeScript) e Hosting (páginas de convite e exclusão de conta).

## Decisões de produto já tomadas
- Entrar com Google, sem senha. Uma conta = um perfil (motorista ou passageiro).
- Convite: um link por motorista, cada pedido precisa de aprovação. Link revogável.
- Endereço do convite: `https://trustcab-9bab6.web.app/i/<token>` (constantes em `packages/core/src/links.ts`). Com o app instalado, o link abre o app (App Links: `intentFilters` no app.json do passageiro + `firebase/hosting/.well-known/assetlinks.json`, que precisa da impressão SHA-256 do build). Sem o app, a página leva à Play Store com `referrer=invite=<token>` e o app abre o convite sozinho no primeiro acesso (`react-native-play-install-referrer`, só em build). O código digitado é o plano B.
- Valor: o passageiro propõe ao pedir; o motorista aprova ou recusa cada viagem (sem "a combinar").
- Passageiro monta os pedidos em passo a passo, uma tela por dia da semana (Continuar = próximo dia, Finalizar = revisão; voltar = dia anterior). Na revisão, cada viagem tem "Recorrente": marcada repete toda semana e renova todo mês até parar; desmarcada vale só para a próxima data. Cada data vira um pedido aprovado sozinho.
- MVP: cada passageiro tem um motorista só. As cores dos cartões identificam viagens, não pessoas. O chat do passageiro abre direto na conversa.
- Pagamento fora do app (Pix). O passageiro avisa "Já paguei"; o motorista confirma.
- O dinheiro não passa pelo app (a cobrança vai pelo chat). Endereços em texto livre. Fuso America/Sao_Paulo.

## Design system
Fonte única: @design.md. Tokens em código: `packages/ui/src/theme/tokens.ts`.

- Storybook é a referência visual, um só para os dois apps: `npm run storybook` (navegador, porta 6006) e `npm run storybook:android -w @trustcab/driver` (no celular). Ele mostra as stories de `packages/ui` e as dos componentes que só existem em cada app (pastas "Motorista" e "Passageiro").
- Componente que serve aos dois apps vai para `packages/ui`. Componente novo só entra junto com a story, com todos os estados; token novo aparece em `tokens.stories.tsx`.
- Stories também só usam tokens. Depois de mexer em componente, rode `npm run test:stories`: ele renderiza todas as stories e aponta as que quebraram.

- Nunca usar cor, tamanho, espaço, raio, borda, opacidade, duração ou limite de gesto fora dos tokens. Valor novo entra primeiro nos tokens e no design.md.
- Botões: sempre `Button` / `IconButton` de `@trustcab/ui`. Médio é o padrão; pequeno só para ações secundárias. Todos os estados, incluindo carregando.
- Cartões que são o mesmo componente em cores diferentes mantêm a mesma tipografia; só a cor muda.
- A direção antiga (tema claro, referência Hyer, `mobile/`) não vale mais para `apps/`.
