# Design Audit — TrustCab Driver

## Summary
O app acerta na direção: tipografia editorial, uma viagem por cartão, ações sempre reversíveis e um fluxo de viagem claro (a caminho → cheguei → começar → concluir). O maior risco hoje é físico, não visual: a home não rola e a pilha só cabe até ~4 viagens; com 6 ou mais, os últimos cartões ficam fora da tela e não há como alcançá-los. O gesto de puxar cartão também "rouba" o scroll em Passageiros. O segundo risco é o teclado no Android: campos e botões ficam escondidos atrás dele. Direção recomendada: separar "rolar" de "puxar" (puxar só depois de segurar), deixar a pilha crescer com a tela rolando e tratar o teclado em todas as telas com campo.

## Key Highlights
- **Home sem scroll + pilha que não cabe:** a partir de ~5 viagens (tela de 812 pt), os cartões de baixo, incluindo o único que mostra endereço e "Ver detalhes", saem da área visível e ficam inalcançáveis.
- **Gesto de puxar compete com o scroll:** qualquer arrasto para cima que começa num cartão vira "puxar cartão". Em Passageiros, onde os cartões ocupam quase toda a tela, rolar a página fica quase impossível.
- **Teclado cobre campos e botões no Android:** o app roda de ponta a ponta (edge-to-edge, padrão do Android recente) e só a conversa trata o teclado, e só no iOS. Convite, Pix, Veículo e o campo de mensagem no Android ficam atrás do teclado.
- **"Próximo" do teclado não avança:** no convite, o botão "próximo" do Nome não leva ao Celular; é preciso tocar no campo.
- **Folha da viagem não rola:** em celulares menores (altura < ~700 pt), o conteúdo (percurso, valores, ação) é espremido ou cortado, e a ação principal pode sumir.
- **Tema do sistema declarado como claro:** `userInterfaceStyle: "light"` e splash branca num app escuro geram um clarão branco na abertura e podem deixar diálogos e teclado do sistema no tema claro.

## Contexto
- **Produto:** app do motorista para organizar corridas recorrentes com a própria rede de confiança (convite, agenda, avisos de trajeto, cobrança mensal via Pix).
- **Público:** motoristas que usam o carro como renda extra; uso em movimento, com uma mão, muitas vezes com pressa.
- **Estágio:** MVP de interface, com dados de exemplo e backend ainda não ligado.
- **Objetivo aparente:** tirar a operação do WhatsApp e da planilha: saber a próxima viagem, avisar o passageiro e cobrar o mês sem esforço.

## Main Findings

### 1. Arquitetura e fluxo — home com muitas viagens
- **Problema:** a home é uma tela fixa. A pilha ocupa o espaço que sobra e calcula quanto mostrar de cada cartão, com um mínimo de 80 pt por cartão e 212 pt para o último. Com 6 viagens, a pilha precisa de ~612 pt, e a área disponível num celular de 812 pt é de ~420–470 pt. O excedente vai para baixo do menu, sem scroll para alcançá-lo.
- **Impacto:** o motorista não vê as viagens da noite num dia cheio, justamente o dia em que mais precisa do app. Perde confiança na home como "fonte da verdade" e volta para a Agenda ou o WhatsApp.
- **Oportunidade:** deixar a pilha crescer com a tela rolando e, nos dias cheios, reduzir o que disputa espaço (viagens concluídas ocupam o mesmo lugar que as próximas).

### 2. UX e usabilidade — gesto versus scroll
- **Problema:** o gesto de puxar começa com 10 pt de movimento para cima, igual ao início de uma rolagem. O sistema não tem como saber a intenção.
- **Impacto:** em Passageiros o scroll trava ou puxa cartões sem querer. Na home, se passar a rolar, o mesmo conflito aparece. Toques acidentais também podem abrir a viagem errada.
- **Oportunidade:** o próprio pedido original já descrevia o gesto como "segurar o cartão e puxar". Exigir um toque longo curto (≈200 ms) antes de puxar separa as intenções: arrastar direto rola a tela, segurar e arrastar puxa o cartão.

### 3. UX e usabilidade — teclado
- **Problema:** convite, Pix e Veículo usam `ScrollView` sem compensar o teclado. A conversa só compensa no iOS. No Android de ponta a ponta, a janela não encolhe sozinha quando o teclado abre. O "próximo" do teclado não encadeia os campos. Tocar fora não fecha o teclado, e arrastar a lista também não.
- **Impacto:** o motorista digita sem ver o campo, não alcança "Enviar convite", "Salvar chave" ou o campo de mensagem, e desiste da tarefa ou fecha e reabre a tela.
- **Oportunidade:** tratar o teclado de forma igual em todas as telas com campo, com a ação principal sempre visível acima dele.

### 4. UX e usabilidade — folha da viagem em telas pequenas
- **Problema:** a folha tem altura fixa e não rola: cabeçalho de 88 pt, percurso (mínimo de 150 pt), valores e ação. Em telas baixas, o espaço acaba antes da ação principal.
- **Impacto:** "Estou a caminho" ou "Cheguei" pode ficar escondido na hora exata de usar.
- **Oportunidade:** a ação principal fica sempre fixa na base; o meio (percurso) encolhe primeiro e rola se precisar.

### 5. Consistência de plataforma
- **Problema:** o app se declara com tema claro para o sistema, e a splash é branca.
- **Impacto:** clarão branco ao abrir, à noite, dentro do carro. Diálogos e teclado do sistema podem destoar.
- **Oportunidade:** declarar o tema escuro e usar a splash no `ground`. É ajuste de configuração, de baixo risco.

## Recommendations

### Home com muitas viagens: opções

| Opção | Como fica | Prós | Contras |
|---|---|---|---|
| **A. Pilha que rola + segurar para puxar** | A home vira rolável. Cada cartão mostra ~92 pt, o último aparece inteiro e a pilha cresce o quanto precisar. Arrastar rola; segurar ~200 ms e arrastar puxa o cartão. | Todas as viagens alcançáveis; resolve também Passageiros; mantém o visual. | Puxar fica um pouco menos imediato; o gesto precisa de uma dica ("Segure e puxe") e de vibração ao ativar. |
| **B. Concluídas recolhidas** | Concluídas e canceladas saem da pilha e viram um bloco fino no fim ("3 concluídas · ver"), que abre a lista. | A pilha mostra só o que ainda vai acontecer; num dia típico cai para 2–4 cartões. | Uma camada a mais para rever concluídas (e o Pix delas). |
| **C. Pilha limitada + "ver todas"** | No máximo 4 cartões; o resto vira "+3 viagens" no fim, que abre a lista do dia. | A home nunca estoura, sem scroll. | Esconde viagens futuras atrás de um toque; quebra a ideia de "o dia inteiro num olhar". |
| **D. Cartão compacto em dias cheios** | Com muitas viagens, cada cartão encolhe para uma linha (nome + horário menor). | Cabe mais sem rolar. | Perde os números grandes (a identidade editorial) e exige uma variante do componente. |

**Recomendação:** A + B juntos. A resolve o problema para qualquer quantidade e também o scroll de Passageiros; B diminui a pilha nos dias reais, porque as concluídas deixam de competir com as próximas.

### Teclado: opções

| Opção | Prós | Contras |
|---|---|---|
| **1. Nativo: `KeyboardAvoidingView` nas quatro telas, também no Android, com o botão principal fixo acima do teclado** | Sem biblioteca nova; funciona no Expo Go. | Comportamento um pouco diferente entre iOS e Android; ajuste fino por tela. |
| **2. Biblioteca `react-native-keyboard-controller`** | Rolagem até o campo focado e barra fixa acima do teclado idênticas nas duas plataformas; é o padrão atual do ecossistema. | Não roda no Expo Go: exige a versão do app instalada no celular (dev build). |

**Recomendação:** 1 agora, enquanto você testa no Expo Go. A 2 entra junto com o dev build do login.

Em qualquer opção, também:
- encadear os campos ("próximo" leva ao campo seguinte, "concluir" salva);
- fechar o teclado ao tocar fora e ao arrastar a tela;
- fixar a ação principal acima do teclado.

### Quick Wins
- Encadear foco nos formulários (convite, veículo) — elimina toques extras.
- Fechar o teclado ao arrastar e ao tocar fora (`keyboardDismissMode`) — padrão esperado em qualquer app.
- Declarar o tema escuro e a splash em `ground` — acaba com o clarão branco.
- Na folha da viagem, fixar a ação principal na base — a ação nunca some.

### Melhorias Estruturais
- Home rolável com "segurar para puxar" (opção A), aplicada ao `CardStack` para valer também em Passageiros.
- Concluídas recolhidas num bloco no fim do dia (opção B).
- Folha da viagem com o meio rolável em telas baixas.

### Oportunidades de Médio Prazo
- Primeiro acesso guiado: depois do login, pedir carro e chave Pix (hoje só aparecem como "pendentes" no Perfil). Sem carro, o aviso "Cheguei" sai incompleto; sem Pix, a cobrança sai sem chave.
- Vibração ao ativar o puxar e ao concluir a viagem — confirmação sem precisar olhar a tela, útil dentro do carro.
- Estados de carregamento, erro e sem internet quando o backend for ligado (hoje os dados são locais).

## Next Steps
1. Escolher as opções da home (recomendado: A + B) e do teclado (recomendado: 1 agora, 2 com o dev build).
2. Aplicar os quick wins e a correção da home, e testar no celular pelo Expo Go com um dia de 6+ viagens.
3. Ajustar a folha da viagem para telas baixas e planejar o primeiro acesso guiado.
