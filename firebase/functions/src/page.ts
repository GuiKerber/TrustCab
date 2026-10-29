import {
  addDays,
  freeAt,
  isPast,
  isValidDate,
  isValidTime,
  longDate,
  minutesOf,
  MONTH_LONG,
  type Occupancy,
  type Slots,
  takenAt,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  weekdayList,
  weekdayOf,
} from './slots';

// A página de agendamento. É o lado do passageiro inteiro: ele abre pelo link que o motorista
// mandou no WhatsApp, monta o que precisa e pronto. Sem conta, sem instalar nada.
//
// Ela é desenhada aqui no servidor, e não num app web, por um motivo só: quem abre está no
// WhatsApp, num celular barato, no 4G. Esta página inteira — HTML, estilo e script — tem o peso
// de uma foto pequena. Um pacote de app web teria vinte vezes isso antes de desenhar a primeira
// linha, e quem desiste de esperar não vira passageiro.
//
// São três telas, e cada uma é um endereço:
//   /a/<slug>              a porta: quem é o motorista e as duas formas de marcar
//   /a/<slug>?m=unica      uma viagem só: calendário, horário e trajeto
//   /a/<slug>?m=semanal    a semana: dia por dia, com mais de uma viagem no mesmo dia
//
// "Uma viagem só" é um <form method="post"> comum e funciona sem JavaScript nenhum. A semana
// precisa de script, porque montar sete dias com várias viagens em cada um exigiria uma ida ao
// servidor por dia — e quem não tem script recebe o caminho da viagem única, escrito.
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
};

// Uma viagem: um horário e um trajeto. Na semana ela vem presa a um dia; na viagem única, a uma data.
export type Leg = { time: string; origin: string; destination: string };
export type WeekLeg = Leg & { weekday: number };

export type SingleForm = { date: string; time: string; origin: string; destination: string; name: string; phone: string; note: string };
export type WeeklyForm = { legs: WeekLeg[]; name: string; phone: string; note: string };

export const emptySingle = (): SingleForm => ({ date: '', time: '', origin: '', destination: '', name: '', phone: '', note: '' });
export const emptyWeekly = (): WeeklyForm => ({ legs: [], name: '', phone: '', note: '' });

export type PageError = { title: string; detail: string };

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
h2.title{font:700 28px/32px "Inter Tight",Inter,sans-serif;letter-spacing:-1px}
.lead{color:var(--muted)}
.hint{font-size:14px;color:var(--muted);letter-spacing:0}

/* A porta: o motorista no centro, grande, antes de qualquer pergunta. */
.hero{display:grid;gap:var(--pad);justify-items:center;text-align:center}
.hero img{width:96px;height:96px;border-radius:var(--r-pill);object-fit:cover;background:var(--raised)}
.hero .ph{width:96px;height:96px;border-radius:var(--r-pill);background:var(--raised)}
.hero strong{font:500 20px/28px Inter,sans-serif;letter-spacing:-.4px}
.hero span{font-size:14px;color:var(--muted);letter-spacing:0}

.card-driver{display:flex;gap:var(--pad);align-items:center}
.card-driver img{width:56px;height:56px;border-radius:var(--r-pill);object-fit:cover;background:var(--raised);flex:none}
.card-driver .who{display:grid;gap:2px;min-width:0}
.card-driver strong{font:500 18px/24px Inter,sans-serif;letter-spacing:-.4px}
.card-driver span{font-size:14px;color:var(--muted);letter-spacing:0}

form{display:grid;gap:28px}
.step{display:grid;gap:12px}
.step > legend, .step > h2{font:500 12px/16px Inter,sans-serif;letter-spacing:.9px;text-transform:uppercase;color:var(--muted);padding:0}

/* Calendário: um mês por bloco, sete colunas, e o dia é um rádio de verdade. */
.cal{display:grid;gap:12px}
.cal-name{font:500 14px/20px Inter,sans-serif;color:var(--muted);letter-spacing:0;text-transform:capitalize}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.cal-head{font:500 12px/16px Inter,sans-serif;color:var(--muted);text-align:center;letter-spacing:0;padding-bottom:2px}
.day{position:relative;display:flex}
.day input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.day span{
  display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;
  border-radius:var(--r-md);background:var(--surface);color:var(--text);
  font:400 16px/24px Inter,sans-serif;
  transition:background var(--fast) ease,color var(--fast) ease;
}
.day.off span{background:transparent;color:var(--line-strong)}
.day input:checked + span{background:var(--text);color:var(--ink)}
.day input:focus-visible + span{outline:2px solid var(--text);outline-offset:2px}
.day input:disabled + span{color:var(--line-strong);background:transparent;cursor:not-allowed}

.field{display:grid;gap:var(--gap)}
.field label{font:500 14px/20px Inter,sans-serif;letter-spacing:0}
.field input,.field textarea{
  width:100%;min-height:56px;padding:0 var(--pad);
  background:var(--surface);color:var(--text);
  border:1px solid var(--line);border-radius:var(--r-md);
  font:400 16px/24px Inter,sans-serif;letter-spacing:-.1px;
}
.field textarea{min-height:88px;padding:16px;resize:vertical}
.field input::placeholder,.field textarea::placeholder{color:var(--muted)}
.field input:focus-visible,.field textarea:focus-visible{outline:2px solid var(--text);outline-offset:0;border-color:var(--text)}
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
.btns{display:grid;gap:12px}
.back{display:inline-flex;align-items:center;gap:6px;color:var(--muted);text-decoration:none;font-size:14px;min-height:var(--touch)}

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
.panel li{padding:10px 0;border-top:1px solid var(--line)}
.panel li:first-child{border-top:0;padding-top:0}
.panel li small{display:block;color:var(--muted);font-size:14px;letter-spacing:0}

/* A semana: um dia por vez. */
.dayhead{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.dayhead .of{font-size:14px;color:var(--muted);letter-spacing:0}
.legs{display:grid;gap:8px}
.leg{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:12px 16px;background:var(--surface);border-radius:var(--r-md)}
.leg div{min-width:0}
.leg strong{font:500 16px/24px Inter,sans-serif}
.leg small{display:block;color:var(--muted);font-size:14px;letter-spacing:0}
.leg button{background:none;border:0;color:var(--muted);font:400 14px/20px Inter,sans-serif;cursor:pointer;min-height:var(--touch);padding:0 4px}
.leg button:hover{color:var(--text)}
.empty-day{color:var(--muted);font-size:14px;letter-spacing:0}

.foot{color:var(--muted);font-size:14px;letter-spacing:0;display:grid;gap:8px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
[hidden]{display:none !important}

@media (prefers-reduced-motion:reduce){*{transition:none !important;animation:none !important}}
`;

function shell({ title, description, image, body, script }: { title: string; description: string; image?: string | null; body: string; script?: string }) {
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
<body><main>${body}</main>${script ? `<script>${script}</script>` : ''}</body>
</html>`;
}

function driverHeader(ctx: Context) {
  const photo = ctx.driver.photoURL
    ? `<img src="${escapeHtml(ctx.driver.photoURL)}" alt="" width="56" height="56" loading="eager" decoding="async">`
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

function errorBox(error?: PageError) {
  if (!error) return '';
  return `<div class="alert" role="alert"><strong>${escapeHtml(error.title)}</strong><p>${escapeHtml(error.detail)}</p></div>`;
}

const backLink = (slug: string) => `<a class="back" href="/a/${encodeURIComponent(slug)}">← Voltar</a>`;

const windowHint = (ctx: Context) =>
  `${firstName(ctx.driver.name)} roda ${weekdayList(ctx.slots.weekdays)}, das ${ctx.slots.from} às ${ctx.slots.to}.`;

// ─── A porta ─────────────────────────────────────────────────────────────────

export function renderLanding(ctx: Context) {
  const nome = firstName(ctx.driver.name);
  const car = vehicleLabel(ctx.driver);
  const photo = ctx.driver.photoURL
    ? `<img src="${escapeHtml(ctx.driver.photoURL)}" alt="" width="96" height="96" loading="eager" decoding="async">`
    : '<div class="ph"></div>';

  const body = `<p class="brand">TrustCab</p>
<div class="hero">
  ${photo}
  <div>
    <strong>${escapeHtml(ctx.driver.name)}</strong>
    ${car ? `<span>${escapeHtml(car)}</span>` : ''}
  </div>
  <h1>Marque sua carona.</h1>
  <p class="lead">Escolha quando precisa e deixe seu contato. ${escapeHtml(nome)} confirma pelo WhatsApp.</p>
</div>
<div class="btns">
  <a class="btn" href="/a/${encodeURIComponent(ctx.slug)}?m=semanal">Viagens toda semana</a>
  <a class="btn light" href="/a/${encodeURIComponent(ctx.slug)}?m=unica">Uma viagem só</a>
</div>
<p class="foot">${escapeHtml(windowHint(ctx))}</p>`;

  return shell({
    title: `Marque sua carona com ${ctx.driver.name} · TrustCab`,
    description: `Escolha o dia e o horário da sua carona com ${ctx.driver.name}.`,
    image: ctx.driver.photoURL,
    body,
  });
}

// ─── Uma viagem só ───────────────────────────────────────────────────────────

// O calendário: os meses que cobrem o horizonte, com os dias que ele não roda apagados e os que
// já passaram desligados. O dia é um rádio — teclado e leitor de tela continuam funcionando.
function calendar(ctx: Context, selected: string) {
  const livres = new Set(ctx.dates);
  const primeiro = ctx.today;
  const ultimo = ctx.dates[ctx.dates.length - 1] ?? ctx.today;

  const meses: string[] = [];
  let cursor = `${primeiro.slice(0, 7)}-01`;
  while (cursor <= ultimo) {
    meses.push(cursor);
    const [y, m] = cursor.split('-').map(Number);
    cursor = `${String(m === 12 ? y + 1 : y).padStart(4, '0')}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`;
  }

  const blocos = meses.map((inicio) => {
    const [y, m] = inicio.split('-').map(Number);
    const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
    // A semana começa na segunda, como no app do motorista.
    const offset = (weekdayOf(inicio) + 6) % 7;
    const celulas: string[] = [];
    for (let i = 0; i < offset; i += 1) celulas.push('<span></span>');
    for (let d = 1; d <= total; d += 1) {
      const iso = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const pode = livres.has(iso);
      const id = `d-${iso}`;
      celulas.push(
        `<label class="day${pode ? '' : ' off'}">
  <input type="radio" name="date" id="${id}" value="${iso}"${pode ? '' : ' disabled'}${selected === iso ? ' checked' : ''} required>
  <span>${d}</span>
</label>`,
      );
    }
    return `<div class="cal">
  <p class="cal-name">${MONTH_LONG[m - 1]} de ${y}</p>
  <div class="cal-grid" role="group" aria-label="${escapeHtml(`Dias de ${MONTH_LONG[m - 1]}`)}">
    ${['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map((w) => `<div class="cal-head" aria-hidden="true">${w}</div>`).join('')}
    ${celulas.join('')}
  </div>
</div>`;
  });

  return blocos.join('');
}

export function renderSingle(ctx: Context, form: SingleForm, error?: PageError) {
  const nome = firstName(ctx.driver.name);
  const body = `${driverHeader(ctx)}
${backLink(ctx.slug)}
<div>
  <h2 class="title">Uma viagem só.</h2>
  <p class="lead">Escolha o dia e o horário, diga o trajeto e deixe seu contato.</p>
</div>
${errorBox(error)}
<form method="post" action="/a/${encodeURIComponent(ctx.slug)}">
  <input type="hidden" name="kind" value="single">

  <fieldset class="step">
    <legend>1. O dia</legend>
    ${calendar(ctx, form.date)}
    <p class="hint">${escapeHtml(windowHint(ctx))}</p>
  </fieldset>

  <fieldset class="step">
    <legend>2. O horário</legend>
    <div class="field">
      <label for="time">Que horas você precisa sair</label>
      <input type="time" id="time" name="time" value="${escapeHtml(form.time)}" min="${escapeHtml(ctx.slots.from)}" max="${escapeHtml(ctx.slots.to)}" required>
      <p class="hint">Pode ser qualquer horário dentro da janela dele, como 09:10.</p>
    </div>
  </fieldset>

  <fieldset class="step">
    <legend>3. O trajeto</legend>
    <div class="field">
      <label for="origin">De onde você sai</label>
      <input id="origin" name="origin" value="${escapeHtml(form.origin)}" placeholder="Rua e número" maxlength="200" required>
    </div>
    <div class="field">
      <label for="destination">Para onde você vai</label>
      <input id="destination" name="destination" value="${escapeHtml(form.destination)}" placeholder="O nome do lugar já basta" maxlength="200" required>
    </div>
  </fieldset>

  ${contactFields(form)}

  <button class="btn" type="submit">Pedir para ${escapeHtml(nome)}</button>
  <p class="foot">${escapeHtml(nome)} recebe o pedido e confirma pelo WhatsApp.</p>
</form>`;

  return shell({
    title: `Uma viagem com ${ctx.driver.name} · TrustCab`,
    description: `Marque uma carona com ${ctx.driver.name}.`,
    body,
  });
}

function contactFields(form: { name: string; phone: string; note: string }) {
  return `<fieldset class="step">
    <legend>Você</legend>
    <div class="two">
      <div class="field">
        <label for="name">Seu nome</label>
        <input id="name" name="name" value="${escapeHtml(form.name)}" autocomplete="name" maxlength="80" required>
      </div>
      <div class="field">
        <label for="phone">Seu WhatsApp</label>
        <input id="phone" name="phone" value="${escapeHtml(form.phone)}" inputmode="tel" autocomplete="tel" placeholder="(41) 99876-5432" maxlength="20" required>
      </div>
    </div>
    <div class="field">
      <label for="note">Quer dizer mais alguma coisa? (opcional)</label>
      <textarea id="note" name="note" maxlength="280" placeholder="Ponto de referência, cadeirinha, bagagem…">${escapeHtml(form.note)}</textarea>
    </div>
  </fieldset>`;
}

// ─── A semana, dia por dia ───────────────────────────────────────────────────

const WIZARD = `
(function(){
  var dias = JSON.parse(document.getElementById('dias').textContent);
  var legs = [];
  var i = 0;
  var passo = document.getElementById('passo');
  var nomeDia = document.getElementById('nome-dia');
  var conta = document.getElementById('conta');
  var lista = document.getElementById('lista');
  var campoT = document.getElementById('l-time');
  var campoO = document.getElementById('l-origin');
  var campoD = document.getElementById('l-destination');
  var proximo = document.getElementById('proximo');
  var concluir = document.getElementById('concluir');
  var contato = document.getElementById('contato');
  var dados = document.getElementById('legs');
  var resumo = document.getElementById('resumo');

  function doDia(){ return legs.filter(function(l){ return l.weekday === dias[i].n; }); }

  function pinta(){
    nomeDia.textContent = dias[i].nome;
    conta.textContent = 'dia ' + (i + 1) + ' de ' + dias.length;
    var meus = doDia();
    lista.innerHTML = meus.length === 0
      ? '<p class="empty-day">Nenhuma viagem neste dia ainda. Se você não anda neste dia, é só seguir.</p>'
      : meus.map(function(l){
          return '<div class="leg"><div><strong>' + l.time + '</strong><small>' + esc(l.origin) + ' → ' + esc(l.destination) + '</small></div>'
            + '<button type="button" data-id="' + l.id + '">Tirar</button></div>';
        }).join('');
    proximo.textContent = i === dias.length - 1 ? 'Revisar' : 'Próximo dia';
    concluir.hidden = legs.length === 0;
  }

  function esc(s){ var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  lista.addEventListener('click', function(e){
    var b = e.target.closest('button[data-id]');
    if (!b) return;
    legs = legs.filter(function(l){ return String(l.id) !== b.dataset.id; });
    pinta();
  });

  document.getElementById('add').addEventListener('click', function(){
    var t = campoT.value, o = campoO.value.trim(), d = campoD.value.trim();
    if (!t || !o || !d) { (!t ? campoT : !o ? campoO : campoD).focus(); return; }
    legs.push({ id: Date.now() + Math.random(), weekday: dias[i].n, time: t, origin: o, destination: d });
    campoT.value = ''; campoO.value = ''; campoD.value = '';
    campoT.focus();
    pinta();
  });

  proximo.addEventListener('click', function(){
    if (i < dias.length - 1) { i += 1; pinta(); window.scrollTo(0, 0); return; }
    mostraContato();
  });
  concluir.addEventListener('click', mostraContato);

  function mostraContato(){
    if (legs.length === 0) return;
    passo.hidden = true;
    contato.hidden = false;
    resumo.innerHTML = dias.map(function(d){
      var meus = legs.filter(function(l){ return l.weekday === d.n; });
      if (meus.length === 0) return '';
      return '<li><strong>' + d.nome + '</strong>' + meus.map(function(l){
        return '<small>' + l.time + ' · ' + esc(l.origin) + ' → ' + esc(l.destination) + '</small>';
      }).join('') + '</li>';
    }).join('');
    dados.value = JSON.stringify(legs.map(function(l){ return { w: l.weekday, t: l.time, o: l.origin, d: l.destination }; }));
    window.scrollTo(0, 0);
  }

  document.getElementById('voltar-dias').addEventListener('click', function(){
    contato.hidden = true;
    passo.hidden = false;
    window.scrollTo(0, 0);
  });

  pinta();
})();
`;

export function renderWeekly(ctx: Context, form: WeeklyForm, error?: PageError) {
  const nome = firstName(ctx.driver.name);
  // Segunda a domingo, só os dias em que ele roda.
  const ordem = [1, 2, 3, 4, 5, 6, 0].filter((d) => ctx.slots.weekdays.includes(d));
  const dias = ordem.map((n) => ({ n, nome: WEEKDAY_LONG[n] }));

  const body = `${driverHeader(ctx)}
${backLink(ctx.slug)}
<div>
  <h2 class="title">Sua semana.</h2>
  <p class="lead">Monte dia por dia. Pode ter mais de uma viagem no mesmo dia — a ida e a volta, por exemplo.</p>
</div>
${errorBox(error)}
<noscript>
  <div class="alert"><strong>Seu navegador está sem JavaScript.</strong><p>Montar a semana precisa dele. Dá para marcar uma viagem de cada vez, ou falar com ${escapeHtml(nome)} pelo WhatsApp.</p></div>
  <a class="btn light" href="/a/${encodeURIComponent(ctx.slug)}?m=unica">Marcar uma viagem só</a>
</noscript>
<script type="application/json" id="dias">${escapeHtml(JSON.stringify(dias))}</script>

<form method="post" action="/a/${encodeURIComponent(ctx.slug)}">
  <input type="hidden" name="kind" value="weekly">
  <input type="hidden" name="legs" id="legs" value="">

  <div id="passo" hidden>
    <div class="step">
      <div class="dayhead">
        <h2 class="title" id="nome-dia">—</h2>
        <span class="of" id="conta"></span>
      </div>
      <div class="legs" id="lista"></div>
    </div>

    <fieldset class="step">
      <legend>Adicionar viagem neste dia</legend>
      <div class="field">
        <label for="l-time">Horário</label>
        <input type="time" id="l-time" min="${escapeHtml(ctx.slots.from)}" max="${escapeHtml(ctx.slots.to)}">
      </div>
      <div class="field">
        <label for="l-origin">De onde você sai</label>
        <input id="l-origin" placeholder="Rua e número" maxlength="200">
      </div>
      <div class="field">
        <label for="l-destination">Para onde você vai</label>
        <input id="l-destination" placeholder="O nome do lugar já basta" maxlength="200">
      </div>
      <button class="btn ghost" type="button" id="add">Adicionar neste dia</button>
    </fieldset>

    <div class="btns">
      <button class="btn light" type="button" id="proximo">Próximo dia</button>
      <button class="btn ghost" type="button" id="concluir" hidden>Concluir</button>
    </div>
    <p class="hint">${escapeHtml(windowHint(ctx))}</p>
  </div>

  <div id="contato" hidden>
    <div class="step">
      <h2 class="title">Confira sua semana.</h2>
      <div class="panel"><ul id="resumo"></ul></div>
      <button class="btn ghost" type="button" id="voltar-dias">Mudar alguma coisa</button>
    </div>
    ${contactFields(form)}
    <button class="btn" type="submit">Pedir para ${escapeHtml(nome)}</button>
    <p class="foot">${escapeHtml(nome)} recebe o pedido e confirma pelo WhatsApp.</p>
  </div>
</form>`;

  return shell({
    title: `Sua semana com ${ctx.driver.name} · TrustCab`,
    description: `Monte sua agenda semanal de caronas com ${ctx.driver.name}.`,
    body,
    script: `document.getElementById('passo').hidden=false;${WIZARD}`,
  });
}

// ─── Pedido enviado ──────────────────────────────────────────────────────────

export function renderDone(ctx: Context, done: { name: string; phone: string; lines: string[]; recurring: boolean }) {
  const nome = firstName(ctx.driver.name);
  const texto = `Oi, ${nome}! Aqui é o ${done.name}. Acabei de pedir carona pelo seu link:\n\n${done.lines.join('\n')}\n\nDá pra você?`;
  // wa.me abre a conversa com o texto escrito no campo de mensagem. Quem toca em enviar é ela.
  const whats = ctx.driverPhone ? `https://wa.me/55${ctx.driverPhone}?text=${encodeURIComponent(texto)}` : null;

  const body = `${driverHeader(ctx)}
<div>
  <h1>Pedido enviado.</h1>
  <p class="lead">${escapeHtml(nome)} recebeu seu pedido e vai confirmar pelo WhatsApp.</p>
</div>
<div class="panel">
  <ul>
    ${done.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}
  </ul>
</div>
<div class="panel">
  <dl><div><dt>Você</dt><dd>${escapeHtml(done.name)} · ${escapeHtml(formatPhone(done.phone))}</dd></div></dl>
</div>
${
  whats
    ? `<a class="btn" href="${escapeHtml(whats)}">Avisar ${escapeHtml(nome)} no WhatsApp</a>
<p class="foot">O WhatsApp abre com a mensagem pronta. Você confere e toca em enviar.</p>`
    : `<p class="foot">${escapeHtml(nome)} ainda não cadastrou o WhatsApp dele aqui. Ele vê seu pedido no aplicativo e fala com você.</p>`
}
<p class="foot">Precisa cancelar ou mudar alguma coisa? Avise ${escapeHtml(nome)} pelo WhatsApp — quem mexe na agenda é ele.</p>`;

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

// ─── Leitura e validação ─────────────────────────────────────────────────────

const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

export function readSingle(body: Record<string, unknown>): SingleForm {
  return {
    date: text(body.date, 10),
    time: text(body.time, 5),
    origin: text(body.origin, 200),
    destination: text(body.destination, 200),
    name: text(body.name, 80),
    phone: text(body.phone, 20),
    note: text(body.note, 280),
  };
}

export function readWeekly(body: Record<string, unknown>): WeeklyForm {
  let legs: WeekLeg[] = [];
  try {
    const raw = JSON.parse(text(body.legs, 20_000) || '[]');
    if (Array.isArray(raw)) {
      legs = raw
        .slice(0, 40)
        .map((l: Record<string, unknown>) => ({
          weekday: Number(l?.w),
          time: text(l?.t, 5),
          origin: text(l?.o, 200),
          destination: text(l?.d, 200),
        }))
        .filter((l) => Number.isInteger(l.weekday) && l.weekday >= 0 && l.weekday <= 6);
    }
  } catch {
    legs = [];
  }
  return { legs, name: text(body.name, 80), phone: text(body.phone, 20), note: text(body.note, 280) };
}

function contactError(form: { name: string; phone: string }): PageError | null {
  if (form.name.length < 2) return { title: 'Escreva seu nome.', detail: 'É assim que ele vai te chamar.' };
  if (!parsePhone(form.phone)) return { title: 'Confira seu WhatsApp.', detail: 'Escreva com DDD, como (41) 99876-5432.' };
  return null;
}

// O horário é livre, mas tem que caber na janela do motorista: não adianta marcar 23:40 em quem
// roda das 6 às 20.
function timeError(ctx: Context, time: string): PageError | null {
  if (!isValidTime(time)) return { title: 'Escolha um horário.', detail: 'Use horas e minutos, como 09:10.' };
  const minutos = minutesOf(time);
  if (minutos < minutesOf(ctx.slots.from) || minutos > minutesOf(ctx.slots.to)) {
    return { title: 'Esse horário está fora da janela dele.', detail: windowHint(ctx) };
  }
  return null;
}

export function validateSingle(ctx: Context, form: SingleForm): PageError | null {
  if (!isValidDate(form.date) || !ctx.dates.includes(form.date)) {
    return { title: 'Escolha um dia.', detail: `O calendário mostra os dias em que ${firstName(ctx.driver.name)} roda.` };
  }
  const hora = timeError(ctx, form.time);
  if (hora) return hora;
  if (isPast(form.date, form.time, ctx.today, ctx.now)) {
    return { title: 'Esse horário já passou.', detail: 'Escolha um horário mais para frente.' };
  }
  if (freeAt(ctx.occupancy, ctx.slots, form.date, form.time) <= 0) {
    return { title: `As ${form.time} desse dia já estão cheias.`, detail: 'Escolha outro horário ou outro dia.' };
  }
  if (!form.origin) return { title: 'Diga de onde você sai.', detail: 'Rua e número já bastam.' };
  if (!form.destination) return { title: 'Diga para onde você vai.', detail: 'O nome do lugar já basta.' };
  return contactError(form);
}

export function validateWeekly(ctx: Context, form: WeeklyForm): PageError | null {
  if (form.legs.length === 0) {
    return { title: 'Sua semana está vazia.', detail: 'Adicione pelo menos uma viagem antes de pedir.' };
  }
  for (const leg of form.legs) {
    if (!ctx.slots.weekdays.includes(leg.weekday)) {
      return { title: `${WEEKDAY_LONG[leg.weekday]} ele não roda.`, detail: windowHint(ctx) };
    }
    const hora = timeError(ctx, leg.time);
    if (hora) return hora;
    if (!leg.origin || !leg.destination) {
      return { title: 'Falta o trajeto de uma das viagens.', detail: 'Toda viagem precisa de onde sai e para onde vai.' };
    }
  }
  // Duas viagens no mesmo dia e no mesmo horário são a mesma viagem pedida duas vezes.
  const vistos = new Set<string>();
  for (const leg of form.legs) {
    const chave = `${leg.weekday}|${leg.time}`;
    if (vistos.has(chave)) {
      return { title: `Você pediu duas viagens para ${WEEKDAY_LONG[leg.weekday]} às ${leg.time}.`, detail: 'Tire uma delas ou mude o horário.' };
    }
    vistos.add(chave);
  }
  // A primeira data de cada dia da semana é o que decide se ainda cabe gente naquele horário.
  for (const leg of form.legs) {
    const primeira = ctx.dates.find((d) => weekdayOf(d) === leg.weekday && !isPast(d, leg.time, ctx.today, ctx.now));
    if (!primeira) continue;
    if (freeAt(ctx.occupancy, ctx.slots, primeira, leg.time) <= 0) {
      return {
        title: `As ${leg.time} de ${WEEKDAY_LONG[leg.weekday]} já estão cheias.`,
        detail: 'Escolha outro horário para esse dia.',
      };
    }
  }
  return contactError(form);
}

// ─── Resumo para a confirmação e para a mensagem do WhatsApp ─────────────────

export function singleLines(form: SingleForm) {
  return [`${longDate(form.date)} às ${form.time}`, `${form.origin} → ${form.destination}`];
}

export function weeklyLines(form: WeeklyForm) {
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  return [...form.legs]
    .sort((a, b) => ordem.indexOf(a.weekday) - ordem.indexOf(b.weekday) || a.time.localeCompare(b.time))
    .map((l) => `Toda ${WEEKDAY_LONG[l.weekday].replace('-feira', '')} às ${l.time} · ${l.origin} → ${l.destination}`);
}

export { addDays, takenAt, WEEKDAY_SHORT };
