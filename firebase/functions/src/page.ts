import {
  freeAt,
  freeWeekly,
  isPast,
  isValidDate,
  isValidTime,
  longDate,
  shortDate,
  type Occupancy,
  type Slots,
  WEEKDAY_SHORT,
  weekdayList,
} from './slots';

// A página de agendamento. É o lado do passageiro inteiro: ele abre pelo link que o motorista
// mandou no WhatsApp, escolhe dia e horário entre os que estão livres, deixa nome e telefone e
// pronto. Sem conta, sem instalar nada.
//
// Ela é desenhada aqui no servidor, e não num app web, por um motivo só: quem abre está no
// WhatsApp, num celular barato, no 4G. Esta página inteira — HTML, estilo e script — tem o peso
// de uma foto pequena. Um pacote de app web teria vinte vezes isso antes de desenhar a primeira
// linha, e quem desiste de esperar não vira passageiro.
//
// O formulário é um <form method="post"> de verdade: sem JavaScript ele continua funcionando, e o
// servidor valida tudo de novo de qualquer forma. O script só evita que a pessoa escolha um
// horário cheio antes de enviar.
//
// Nada aqui toca o Firestore: quem busca os dados é booking.ts. É o que deixa esta página ser
// desenhada fora da nuvem, com dados de mentira, para conferir tela e acessibilidade.

export type DriverCard = { name: string; photoURL: string | null; vehicle: { model: string; color: string; plate: string } | null };

export type Context = {
  slug: string;
  driverId: string;
  driver: DriverCard;
  driverPhone: string | null;
  slots: Slots;
  occupancy: Occupancy;
  today: string;
  now: string;
  dates: string[];
  times: string[];
};

export type Form = {
  kind: 'recurring' | 'single';
  weekdays: number[];
  date: string;
  time: string;
  origin: string;
  destination: string;
  name: string;
  phone: string;
  note: string;
};

export const emptyForm = (): Form => ({
  kind: 'recurring',
  weekdays: [],
  date: '',
  time: '',
  origin: '',
  destination: '',
  name: '',
  phone: '',
  note: '',
});

// ─── Texto ───────────────────────────────────────────────────────────────────

export function escapeHtml(value: string) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function onlyDigits(value: string) {
  return String(value).replace(/\D/g, '');
}

export function parsePhone(input: string) {
  let digits = onlyDigits(input);
  if (digits.startsWith('0055')) digits = digits.slice(4);
  else if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length === 11 && digits[2] !== '9') return null;
  if (digits.length !== 10 && digits.length !== 11) return null;
  if (Number(digits.slice(0, 2)) < 11) return null;
  return digits;
}

export function formatPhone(digits: string) {
  const d = onlyDigits(digits);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'seu motorista';
}

function vehicleLabel(driver: DriverCard) {
  const v = driver.vehicle;
  if (!v) return '';
  const plate = v.plate.length === 7 ? `${v.plate.slice(0, 3)}-${v.plate.slice(3)}` : v.plate;
  return `${v.model} ${v.color} · ${plate}`;
}

export function whenLabel(form: Form) {
  if (form.kind === 'recurring') return `toda ${weekdayList(form.weekdays)} às ${form.time}`;
  return `${longDate(form.date)} às ${form.time}`;
}
// ─── Casca da página ─────────────────────────────────────────────────────────
// Os valores de cor, tamanho e raio são os mesmos de packages/ui/src/theme/tokens.ts.

const STYLE = `
:root{
  --ground:#141414; --surface:#1F1F1F; --raised:#2A2A2A; --line:#2A2A2A; --line-strong:#44443F;
  --text:#F2F2EE; --muted:#9C9C95; --orange:#F26A2E; --ink:#141414;
  --r-sm:8px; --r-md:16px; --r-block:24px; --r-card:32px; --r-pill:999px;
  --gap:8px; --pad:16px; --touch:48px;
  --fast:150ms; --base:220ms;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--ground); color:var(--text);
  font:400 16px/1.5 Inter,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  letter-spacing:-.1px; overflow-wrap:break-word;
}
/* A barra de rolagem do navegador não entra como está: fica fina e na cor do fundo. */
html{scrollbar-width:thin; scrollbar-color:var(--line-strong) var(--ground)}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-track{background:var(--ground)}
::-webkit-scrollbar-thumb{background:var(--line-strong);border-radius:var(--r-pill);border:3px solid var(--ground)}
main{max-width:520px;margin:0 auto;padding:28px var(--pad) 56px;display:grid;gap:28px}
:focus-visible{outline:2px solid var(--text);outline-offset:3px;border-radius:var(--r-sm)}
h1,h2,h3,p,ul,ol,fieldset,legend{margin:0;padding:0}
ul{list-style:none}
fieldset{border:0;min-width:0}
a{color:var(--text)}

.brand{font:500 12px/16px Inter,sans-serif;letter-spacing:.9px;text-transform:uppercase;color:var(--muted)}
h1{font:700 40px/44px "Inter Tight",Inter,sans-serif;letter-spacing:-1.4px}
.lead{color:var(--muted)}
.card-driver{display:flex;gap:var(--pad);align-items:center}
.card-driver img{width:64px;height:64px;border-radius:var(--r-pill);object-fit:cover;background:var(--raised);flex:none}
.card-driver .who{display:grid;gap:2px;min-width:0}
.card-driver strong{font:500 20px/28px Inter,sans-serif;letter-spacing:-.4px}
.card-driver span{font-size:14px;color:var(--muted);letter-spacing:0}

form{display:grid;gap:28px}
.step{display:grid;gap:12px}
.step > legend, .step > h2{font:500 12px/16px Inter,sans-serif;letter-spacing:.9px;text-transform:uppercase;color:var(--muted);padding:0}
.hint{font-size:14px;color:var(--muted);letter-spacing:0}

/* Escolhas em pílula: o rádio continua sendo o rádio (teclado, leitor de tela) e o rótulo é a pílula. */
.opts{display:flex;flex-wrap:wrap;gap:var(--gap)}
/* Manhã, tarde e noite: sem isso a janela do dia inteiro vira uma parede de trinta pílulas iguais. */
.periods{display:grid;gap:20px}
.period{display:grid;gap:10px}
.period-name{font:500 14px/20px Inter,sans-serif;color:var(--muted);letter-spacing:0}
.opt{position:relative;display:flex}
.opt input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.opt span{
  display:flex;align-items:center;justify-content:center;gap:6px;
  min-height:var(--touch);min-width:72px;padding:0 20px;
  border:1px solid var(--line-strong);border-radius:var(--r-pill);
  background:var(--ground);color:var(--text);
  transition:background var(--fast) ease,color var(--fast) ease,border-color var(--fast) ease;
}
.opt input:checked + span{background:var(--text);color:var(--ink);border-color:var(--text)}
.opt input:focus-visible + span{outline:2px solid var(--text);outline-offset:3px}
.opt input:disabled + span{
  color:var(--muted);border-color:var(--line);
  /* Cheio não é só uma cor mais fraca: o horário sai riscado e o motivo vai escrito. */
  text-decoration:line-through;text-decoration-thickness:1px;cursor:not-allowed;
}
/* "Cheio" vai escrito para quem usa leitor de tela; na tela quem diz é o risco, que não
   depende de cor nenhuma e não alarga a pílula. */
.opt .why{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.opt.wide span{flex:1;justify-content:flex-start}
.opt.wide{flex:1 1 180px}

/* Segmentado: toda semana / um dia só */
.switch{display:flex;gap:var(--gap);padding:4px;background:var(--surface);border-radius:var(--r-pill)}
.switch .opt{flex:1}
.switch .opt span{min-width:0;border:0;background:transparent;padding:0 var(--pad)}
.switch .opt input:checked + span{background:var(--text);color:var(--ink)}

.field{display:grid;gap:var(--gap)}
.field label{font:500 14px/20px Inter,sans-serif;letter-spacing:0}
.field input,.field textarea,.field select{
  width:100%;min-height:56px;padding:0 var(--pad);
  background:var(--surface);color:var(--text);
  border:1px solid var(--line);border-radius:var(--r-md);
  font:400 16px/24px Inter,sans-serif;letter-spacing:-.1px;
}
.field textarea{min-height:88px;padding:16px;resize:vertical}
.field select{
  appearance:none;
  background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),linear-gradient(135deg,var(--muted) 50%,transparent 50%);
  background-position:calc(100% - 22px) 25px,calc(100% - 16px) 25px;
  background-size:6px 6px,6px 6px;background-repeat:no-repeat;
}
.field input::placeholder,.field textarea::placeholder{color:var(--muted)}
.field input:focus-visible,.field textarea:focus-visible,.field select:focus-visible{outline:2px solid var(--text);outline-offset:0;border-color:var(--text)}
.two{display:grid;gap:12px}
@media(min-width:420px){.two{grid-template-columns:1fr 1fr}}

.btn{
  display:flex;align-items:center;justify-content:center;gap:var(--gap);
  width:100%;min-height:56px;padding:0 24px;border:0;border-radius:var(--r-pill);
  background:var(--orange);color:var(--ink);
  font:500 16px/24px Inter,sans-serif;letter-spacing:-.1px;text-decoration:none;cursor:pointer;
  transition:opacity var(--fast) ease;
}
.btn:hover{opacity:.94}
.btn:active{opacity:.88}
.btn.light{background:var(--text);color:var(--ink)}
.btn.ghost{background:transparent;color:var(--text);border:1px solid var(--line-strong)}

.alert{
  display:grid;gap:4px;padding:16px;border-radius:var(--r-md);
  background:var(--surface);border-left:4px solid var(--orange);
}
.alert strong{font-weight:500}
.alert p{color:var(--muted);font-size:14px;letter-spacing:0}

.panel{display:grid;gap:12px;padding:20px;background:var(--surface);border-radius:var(--r-block)}
.panel dt{font:500 12px/16px Inter,sans-serif;letter-spacing:.9px;text-transform:uppercase;color:var(--muted)}
.panel dd{margin:0}
.panel dl{display:grid;gap:12px;margin:0}

.foot{color:var(--muted);font-size:14px;letter-spacing:0;display:grid;gap:8px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
[hidden]{display:none !important}

@media (prefers-reduced-motion:reduce){*{transition:none !important;animation:none !important}}
`;

function shell({
  title,
  description,
  image,
  body,
}: {
  title: string;
  description: string;
  image?: string | null;
  body: string;
}) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#141414">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="TrustCab">
<meta property="og:type" content="website">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Inter+Tight:wght@700&display=swap">
<style>${STYLE}</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function driverHeader(ctx: Context) {
  const photo = ctx.driver.photoURL
    ? `<img src="${escapeHtml(ctx.driver.photoURL)}" alt="" width="64" height="64" loading="eager" decoding="async">`
    : '';
  const car = vehicleLabel(ctx.driver);
  return `<p class="brand">TrustCab</p>
<div class="card-driver">
  ${photo}
  <div class="who">
    <strong>${escapeHtml(ctx.driver.name)}</strong>
    ${car ? `<span>${escapeHtml(car)}</span>` : ''}
  </div>
</div>`;
}

// ─── A página do formulário ──────────────────────────────────────────────────

export function renderForm(ctx: Context, form: Form, error?: { title: string; detail: string }) {
  const nome = firstName(ctx.driver.name);

  // A ocupação viaja junto com a página: o script liga e desliga os horários sem ir ao servidor.
  const freeByDate: Record<string, string[]> = {};
  for (const date of ctx.dates) {
    freeByDate[date] = ctx.times.filter(
      (time) => freeAt(ctx.occupancy, ctx.slots, date, time) > 0 && !isPast(date, time, ctx.today, ctx.now),
    );
  }
  const freeByWeekday: Record<string, string[]> = {};
  for (const weekday of ctx.slots.weekdays) {
    freeByWeekday[String(weekday)] = ctx.times.filter((time) => freeWeekly(ctx.occupancy, ctx.slots, weekday, time) > 0);
  }

  const dateOptions = ctx.dates
    .map((date) => {
      const free = freeByDate[date].length;
      const label = free > 0 ? shortDate(date) : `${shortDate(date)} — cheio`;
      return `<option value="${date}"${form.date === date ? ' selected' : ''}${free === 0 ? ' disabled' : ''}>${escapeHtml(label)}</option>`;
    })
    .join('');

  const weekdayOptions = ctx.slots.weekdays
    .map((weekday) => {
      const free = freeByWeekday[String(weekday)].length > 0;
      const checked = form.weekdays.includes(weekday) ? ' checked' : '';
      return `<label class="opt">
  <input type="checkbox" name="weekdays" value="${weekday}"${checked}${free ? '' : ' disabled'}>
  <span>${WEEKDAY_SHORT[weekday]}${free ? '' : '<em class="why">cheio</em>'}</span>
</label>`;
    })
    .join('');

  // Todos os horários da janela entram no HTML. Qual deles está livre depende do dia escolhido,
  // e é isso que o script resolve — ou, sem script, o servidor na hora de enviar.
  //
  // Uma janela larga dá trinta pílulas, e trinta pílulas iguais viram uma parede. Separar por
  // manhã, tarde e noite devolve o ponto de referência: a pessoa pula direto para a parte do dia
  // em que ela sai de casa.
  const period = (time: string) => (time < '12:00' ? 'Manhã' : time < '18:00' ? 'Tarde' : 'Noite');
  const chip = (time: string) => `<label class="opt" data-time="${time}">
  <input type="radio" name="time" value="${time}"${form.time === time ? ' checked' : ''} required>
  <span>${time}</span>
</label>`;

  const timeOptions = ['Manhã', 'Tarde', 'Noite']
    .map((label) => {
      const chips = ctx.times.filter((time) => period(time) === label);
      if (chips.length === 0) return '';
      return `<div class="period">
  <p class="period-name">${label}</p>
  <div class="opts">${chips.map(chip).join('')}</div>
</div>`;
    })
    .join('');

  const alert = error
    ? `<div class="alert" role="alert"><strong>${escapeHtml(error.title)}</strong><p>${escapeHtml(error.detail)}</p></div>`
    : '';

  const body = `${driverHeader(ctx)}
<div>
  <h1>Marque sua carona com ${escapeHtml(nome)}.</h1>
  <p class="lead">Escolha o dia e o horário. ${escapeHtml(nome)} confirma e você recebe o aviso no WhatsApp.</p>
</div>
${alert}
<form method="post" action="" novalidate>
  <fieldset class="step">
    <legend>Como você quer</legend>
    <div class="switch" role="radiogroup">
      <label class="opt">
        <input type="radio" name="kind" value="recurring"${form.kind === 'recurring' ? ' checked' : ''} data-kind>
        <span>Toda semana</span>
      </label>
      <label class="opt">
        <input type="radio" name="kind" value="single"${form.kind === 'single' ? ' checked' : ''} data-kind>
        <span>Um dia só</span>
      </label>
    </div>
  </fieldset>

  <fieldset class="step" data-block="recurring"${form.kind === 'single' ? ' hidden' : ''}>
    <legend>Em quais dias</legend>
    <div class="opts">${weekdayOptions}</div>
    <p class="hint">${escapeHtml(nome)} roda ${escapeHtml(weekdayList(ctx.slots.weekdays))}.</p>
  </fieldset>

  <div class="step field" data-block="single"${form.kind === 'recurring' ? ' hidden' : ''}>
    <label for="date">Em que dia</label>
    <select id="date" name="date">
      <option value="">Escolha um dia</option>
      ${dateOptions}
    </select>
  </div>

  <fieldset class="step">
    <legend>A que horas</legend>
    <div class="periods" data-times>${timeOptions}</div>
    <p class="hint" data-times-hint>Horário riscado é horário cheio: ${escapeHtml(nome)} já tem alguém nele.</p>
  </fieldset>

  <fieldset class="step">
    <legend>O trajeto</legend>
    <div class="field">
      <label for="origin">De onde você sai</label>
      <input id="origin" name="origin" value="${escapeHtml(form.origin)}" maxlength="200" placeholder="Rua das Acácias, 120" autocomplete="street-address" required>
    </div>
    <div class="field">
      <label for="destination">Para onde você vai</label>
      <input id="destination" name="destination" value="${escapeHtml(form.destination)}" maxlength="200" placeholder="Colégio Santo André" required>
    </div>
  </fieldset>

  <fieldset class="step">
    <legend>Quem é você</legend>
    <div class="two">
      <div class="field">
        <label for="name">Seu nome</label>
        <input id="name" name="name" value="${escapeHtml(form.name)}" maxlength="80" autocomplete="name" required>
      </div>
      <div class="field">
        <label for="phone">Seu WhatsApp</label>
        <input id="phone" name="phone" value="${escapeHtml(form.phone)}" inputmode="tel" maxlength="20" placeholder="(41) 99876-5432" autocomplete="tel-national" required>
      </div>
    </div>
    <div class="field">
      <label for="note">Algo que ele precisa saber <span class="hint">(opcional)</span></label>
      <textarea id="note" name="note" maxlength="280" placeholder="Levo minha filha de 8 anos.">${escapeHtml(form.note)}</textarea>
    </div>
  </fieldset>

  <button class="btn" type="submit">Pedir carona</button>
  <p class="foot">Seu nome e telefone ficam só com ${escapeHtml(nome)}, para ele falar com você no WhatsApp.</p>
</form>
<script>
(() => {
  const livrePorDia = ${JSON.stringify(freeByDate)};
  const livrePorSemana = ${JSON.stringify(freeByWeekday)};
  const form = document.querySelector('form');
  if (!form) return;
  const blocos = { recurring: form.querySelector('[data-block="recurring"]'), single: form.querySelector('[data-block="single"]') };
  const horarios = [...form.querySelectorAll('[data-times] .opt')];
  const dica = form.querySelector('[data-times-hint]');

  // Quais horários sobram para a escolha atual: num dia só, os daquele dia; toda semana, os que
  // estão livres em todos os dias marcados.
  function livres() {
    const tipo = form.querySelector('input[name="kind"]:checked')?.value;
    if (tipo === 'single') {
      const dia = form.querySelector('select[name="date"]')?.value;
      return dia ? livrePorDia[dia] ?? [] : null;
    }
    const dias = [...form.querySelectorAll('input[name="weekdays"]:checked')].map((i) => i.value);
    if (dias.length === 0) return null;
    return dias.map((d) => livrePorSemana[d] ?? []).reduce((a, b) => a.filter((t) => b.includes(t)));
  }

  function desenha() {
    const tipo = form.querySelector('input[name="kind"]:checked')?.value ?? 'recurring';
    blocos.recurring.hidden = tipo !== 'recurring';
    blocos.single.hidden = tipo !== 'single';

    const lista = livres();
    let algumLivre = false;
    for (const opcao of horarios) {
      const campo = opcao.querySelector('input');
      const marca = opcao.querySelector('.why');
      const cheio = lista !== null && !lista.includes(opcao.dataset.time);
      campo.disabled = cheio;
      if (cheio && campo.checked) campo.checked = false;
      if (cheio && !marca) opcao.querySelector('span').insertAdjacentHTML('beforeend', '<em class="why">cheio</em>');
      if (!cheio && marca) marca.remove();
      if (!cheio) algumLivre = true;
    }
    if (lista === null) {
      dica.textContent = tipo === 'single' ? 'Escolha o dia primeiro.' : 'Marque os dias primeiro.';
    } else if (!algumLivre) {
      dica.textContent = 'Nesses dias não sobrou horário. Tente outro dia.';
    } else {
      dica.textContent = 'Horário riscado é horário cheio.';
    }
  }

  form.addEventListener('change', (evento) => {
    const alvo = evento.target;
    if (alvo.name === 'kind' || alvo.name === 'weekdays' || alvo.name === 'date') desenha();
  });
  desenha();
})();
</script>`;

  return shell({
    title: `Marque sua carona com ${nome} · TrustCab`,
    description: `${ctx.driver.name} atende ${weekdayList(ctx.slots.weekdays)}. Escolha o dia e o horário.`,
    image: ctx.driver.photoURL,
    body,
  });
}

// ─── A página de confirmação ─────────────────────────────────────────────────

export function renderDone(ctx: Context, form: Form) {
  const nome = firstName(ctx.driver.name);
  const texto = `Oi, ${nome}! Aqui é o ${form.name}. Acabei de pedir carona pelo seu link:\n\n${whenLabel(form)}\n${form.origin} → ${form.destination}\n\nDá pra você?`;
  // wa.me abre a conversa com o texto escrito no campo de mensagem. Quem toca em enviar é ela.
  const whats = ctx.driverPhone ? `https://wa.me/55${ctx.driverPhone}?text=${encodeURIComponent(texto)}` : null;

  const body = `${driverHeader(ctx)}
<div>
  <h1>Pedido enviado.</h1>
  <p class="lead">${escapeHtml(nome)} recebeu seu pedido e vai confirmar pelo WhatsApp.</p>
</div>
<div class="panel">
  <dl>
    <div><dt>Quando</dt><dd>${escapeHtml(whenLabel(form))}</dd></div>
    <div><dt>Trajeto</dt><dd>${escapeHtml(form.origin)} → ${escapeHtml(form.destination)}</dd></div>
    <div><dt>Você</dt><dd>${escapeHtml(form.name)} · ${escapeHtml(formatPhone(form.phone))}</dd></div>
  </dl>
</div>
${
  whats
    ? `<a class="btn" href="${escapeHtml(whats)}">Avisar ${escapeHtml(nome)} no WhatsApp</a>
<p class="foot">O WhatsApp abre com a mensagem pronta. Você confere e toca em enviar.</p>`
    : `<p class="foot">${escapeHtml(nome)} ainda não cadastrou o WhatsApp dele aqui. Ele vê seu pedido no aplicativo e fala com você.</p>`
}
<p class="foot">Mudou de ideia? Fale com ${escapeHtml(nome)} no WhatsApp — quem mexe na agenda é ele.</p>`;

  return shell({
    title: 'Pedido enviado · TrustCab',
    description: `Pedido de carona enviado para ${ctx.driver.name}.`,
    body,
  });
}

export function renderMessage(title: string, heading: string, text: string, status = 200) {
  return {
    status,
    html: shell({
      title: `${title} · TrustCab`,
      description: text,
      body: `<p class="brand">TrustCab</p>
<div>
  <h1>${escapeHtml(heading)}</h1>
  <p class="lead">${escapeHtml(text)}</p>
</div>`,
    }),
  };
}

// ─── Validação do pedido ─────────────────────────────────────────────────────

export function readForm(body: Record<string, unknown>): Form {
  const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
  const raw = body.weekdays;
  const list = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  return {
    kind: body.kind === 'single' ? 'single' : 'recurring',
    weekdays: [...new Set(list.map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(),
    date: text(body.date, 10),
    time: text(body.time, 5),
    origin: text(body.origin, 200),
    destination: text(body.destination, 200),
    name: text(body.name, 80),
    phone: text(body.phone, 20),
    note: text(body.note, 280),
  };
}

export function validate(ctx: Context, form: Form): { title: string; detail: string } | null {
  if (!isValidTime(form.time) || !ctx.times.includes(form.time)) {
    return { title: 'Escolha um horário.', detail: `${firstName(ctx.driver.name)} atende das ${ctx.slots.from} às ${ctx.slots.to}.` };
  }

  if (form.kind === 'recurring') {
    if (form.weekdays.length === 0) {
      return { title: 'Marque os dias da semana.', detail: 'Toque nos dias em que você vai usar a carona.' };
    }
    const fora = form.weekdays.filter((d) => !ctx.slots.weekdays.includes(d));
    if (fora.length > 0) {
      return {
        title: 'Esse dia ele não roda.',
        detail: `${firstName(ctx.driver.name)} atende ${weekdayList(ctx.slots.weekdays)}.`,
      };
    }
    const cheios = form.weekdays.filter((d) => freeWeekly(ctx.occupancy, ctx.slots, d, form.time) <= 0);
    if (cheios.length > 0) {
      return {
        title: `As ${form.time} de ${weekdayList(cheios)} já estão cheias.`,
        detail: 'Escolha outro horário ou desmarque esse dia.',
      };
    }
  } else {
    if (!isValidDate(form.date) || !ctx.dates.includes(form.date)) {
      return { title: 'Escolha um dia.', detail: 'A lista mostra os próximos dias em que ele roda.' };
    }
    if (isPast(form.date, form.time, ctx.today, ctx.now)) {
      return { title: 'Esse horário já passou.', detail: 'Escolha um horário mais para frente.' };
    }
    if (freeAt(ctx.occupancy, ctx.slots, form.date, form.time) <= 0) {
      return { title: `As ${form.time} desse dia já estão cheias.`, detail: 'Escolha outro horário ou outro dia.' };
    }
  }

  if (!form.origin) return { title: 'Diga de onde você sai.', detail: 'Rua e número já bastam.' };
  if (!form.destination) return { title: 'Diga para onde você vai.', detail: 'O nome do lugar já basta.' };
  if (form.name.length < 2) return { title: 'Escreva seu nome.', detail: 'É assim que ele vai te chamar.' };
  if (!parsePhone(form.phone)) {
    return { title: 'Confira seu WhatsApp.', detail: 'Escreva com DDD, como (41) 99876-5432.' };
  }
  return null;
}

// Trava simples contra abuso: o link é público, então um mesmo número só pede algumas vezes por
// dia, e a caixa de pedidos do motorista tem teto. Não é blindagem — é o bastante para o teste,
// e quem passar disso ele resolve trocando o link.
