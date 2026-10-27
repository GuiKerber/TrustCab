# TrustCab

App Android para quem usa o próprio carro como renda extra e leva sempre as mesmas pessoas (família, amigos, conhecidos). Não é marketplace.

**Versão 2.** Só o motorista tem app. O passageiro não instala nada: ele abre um link que o motorista manda no WhatsApp, escolhe dia e horário entre os que estão livres, deixa nome e telefone, e o pedido cai no app. Tudo o que o produto precisa dizer a ele sai do WhatsApp do próprio motorista, com a mensagem pronta e o dedo dele no enviar.

- PRD da versão 1: `docs/prd.html` (artifact: https://claude.ai/artifact/LpA3obonJwdAxMr5SxZqAe). Os códigos de requisito (AC-01, CV-05, AG-03…) vêm de lá.
- Plano da reformulação: `docs/reformulacao.html` (artifact: https://claude.ai/artifact/HcHcCEqRbvsXAnz7Ukp89J).
- A versão 1 inteira (app do passageiro, convite por token, conversa dentro do app) está na tag `v1-app-passageiro` e no ramo de mesmo nome. O app do passageiro continua em `legacy/passenger/`, fora dos workspaces.
- Expo mudou muito na versão 57. Antes de escrever código, consulte a documentação daquela versão: https://docs.expo.dev/versions/v57.0.0/

## Estrutura (monorepo, npm workspaces)
Instale e rode tudo a partir da raiz: `npm install`, `npm run driver`, `npm run storybook`.
- `packages/ui/` — design system: tokens (`src/theme/tokens.ts`), componentes (`src/components/`) e o Storybook (`.storybook/`). Importe com `@trustcab/ui`.
- `packages/core/` — regras, tipos, formatos e dados de exemplo (`@trustcab/core`); login em `@trustcab/core/auth`; Firestore em `@trustcab/core/db`; permissão de notificação em `@trustcab/core/notifications`. Os horários e a ocupação ficam em `src/slots.ts`, o plano em `src/plan.ts` e os textos do WhatsApp em `src/whatsapp.ts`.
- `apps/driver/` — TrustCab Driver, o único app. Telas (`src/app`), dados (`src/data`) e componentes próprios.
- `legacy/passenger/` — app do passageiro da versão 1. Fora dos workspaces, não entra em build. Guardado para consulta.
- `mobile/` — versão antiga (app único). Expo SDK 57, expo-router (`src/app`), TypeScript. Não roda no Expo Go: exige dev build (EAS).
- `firebase/` — regras do Firestore, Cloud Functions (TypeScript) e Hosting. A página de agendamento é a Function `bookingPage`: o desenho em `functions/src/page.ts` (sem Firestore, dá para renderizar fora da nuvem) e os dados em `functions/src/booking.ts`.

## Decisões de produto já tomadas
- Entrar com Google, sem senha. Toda conta é de motorista — o passageiro não tem conta.
- O passageiro é um contato do motorista (`passengers`), identificado por nome e telefone. Mesmo telefone é a mesma pessoa.
- Um link por motorista, permanente: `https://trustcab-9bab6.web.app/a/<slug>` (constantes em `packages/core/src/links.ts`). O slug nasce na Function `rotateLink`, nunca no app. Gerar outro desativa o anterior.
- A página de agendamento mostra livre ou cheio a partir das agendas do motorista, sem o nome de ninguém. Um pedido sem resposta também segura a vaga.
- O motorista define dias, janela e quantas pessoas leva no mesmo horário (`users.slots`). Vagas começa em 1 de propósito: errar para baixo ele vê; errar para cima vira dois passageiros no mesmo lugar.
- Pedido vindo do link nasce `requested`; o motorista confirma ou recusa. Não existe mais negociação de preço em estado próprio: isso acontece no WhatsApp e ele registra o que ficou.
- Nenhuma mensagem sai sozinha. O app abre o WhatsApp com o texto escrito e quem envia é o motorista. Nunca usar biblioteca não oficial de automação do WhatsApp: viola os termos e derruba o número pessoal dele.
- Toda mensagem que o produto escreve termina com o link da resposta mais provável. É o que faz a exceção voltar como dado em vez de texto solto.
- Plano: 30 dias com tudo liberado, depois R$ 19,90 por mês. Quem escreve `users.plan` é só o servidor. Vencido fecha a porta de entrada — o link para de aceitar pedido novo — e não tranca o que já existe.
- Valor: o motorista registra o combinado; o pagamento é por fora (Pix), com a conta do mês saindo pelo WhatsApp.
- MVP: cada passageiro tem um motorista só. As cores dos cartões identificam viagens, não pessoas.
- Play Store: TrustCab Driver em Negócios, como o Uber Driver. Contato público e das páginas web: contact@guikerber.com. Política de privacidade em trustcab-9bab6.web.app/privacidade.html e exclusão de conta em /excluir-conta.html.
- Endereços em texto livre. Fuso America/Sao_Paulo.

## Design system
Fonte única: @design.md. Tokens em código: `packages/ui/src/theme/tokens.ts`.

- Storybook é a referência visual: `npm run storybook` (navegador, porta 6006) e `npm run storybook:android -w @trustcab/driver` (no celular). Ele mostra as stories de `packages/ui` e as dos componentes que só existem no app do motorista.
- Componente que pode servir a outra tela vai para `packages/ui`. Componente novo só entra junto com a story, com todos os estados; token novo aparece em `tokens.stories.tsx`.
- Stories também só usam tokens. Depois de mexer em componente, rode `npm run test:stories`: ele renderiza todas as stories e aponta as que quebraram.

- Nunca usar cor, tamanho, espaço, raio, borda, opacidade, duração ou limite de gesto fora dos tokens. Valor novo entra primeiro nos tokens e no design.md.
- Botões: sempre `Button` / `IconButton` de `@trustcab/ui`. Médio é o padrão; pequeno só para ações secundárias. Todos os estados, incluindo carregando.
- Cartões que são o mesmo componente em cores diferentes mantêm a mesma tipografia; só a cor muda.
- A direção antiga (tema claro, referência Hyer, `mobile/`) não vale mais para `apps/`.
