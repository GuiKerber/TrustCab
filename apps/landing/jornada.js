/* ==========================================================================
   TrustCab · o que aparece quando entra na tela

   Títulos, peças e degraus nascem escondidos e sobem quando a rolagem chega
   neles. A classe na raiz é o interruptor: é ela que liga o estado escondido
   no CSS, então uma página sem script nenhum mostra tudo no lugar em vez de
   esconder.

   Além da revelação, este arquivo cuida de três coisas que precisam saber onde
   a rolagem está: a barra do topo, o zero da comissão e o nome no rodapé.
   Nenhuma delas usa listener de scroll — tudo é IntersectionObserver, que o
   navegador resolve fora da main thread e não disputa frame com as duas cenas
   em WebGL da página.
   ========================================================================== */

document.documentElement.classList.add('js');

/* O visitante pode ter pedido para a máquina inteira parar de animar. Aqui isso
   vale para o que o CSS não alcança: contagem de número e cena 3D. */
const quieto = matchMedia('(prefers-reduced-motion: reduce)');

/* ─────────────────────────── revelar ao entrar ─────────────────────────── */
/* Dois limiares, porque as peças não têm o mesmo tamanho: a foto do motorista
   tem 1448px de altura e, com 0.35, só dispararia depois de já ter passado da
   metade da tela. */
function criarRevelador(fatia) {
  const obs = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      entrada.target.classList.add('is-on');
      obs.unobserve(entrada.target);
    }
  }, { threshold: fatia });
  return obs;
}

const revelador = criarRevelador(0.35);
const reveladorAlto = criarRevelador(0.12);

document
  .querySelectorAll('.vitrine__title, .peca, .como__title, .degrau, .faq__title')
  .forEach((elemento) => {
    /* Peça mais alta que meia tela entra pelo limiar baixo, senão a entrada
       acontece tarde demais para ser vista. */
    const alta = elemento.getBoundingClientRect().height > innerHeight * 0.6;
    (alta ? reveladorAlto : revelador).observe(elemento);
  });

/* O nome gigante do rodapé sobe do próprio corte que o layout já tinha. */
const marcadagua = document.querySelector('.foot__marcadagua');
if (marcadagua) reveladorAlto.observe(marcadagua);

/* ──────────────────────────── a barra do topo ──────────────────────────── */
/* Duas sentinelas de 1px em vez de ouvir a rolagem: uma diz que a página saiu
   do topo, a outra diz que a maquete já passou. A segunda existe só para o
   blur, que não pode ligar enquanto o canvas da abertura está renderizando. */
const nav = document.querySelector('.nav');
const cena = document.getElementById('palco-abertura');

if (nav) {
  const sentinela = document.createElement('div');
  sentinela.setAttribute('aria-hidden', 'true');
  sentinela.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none';
  document.body.prepend(sentinela);

  new IntersectionObserver(([entrada]) => {
    nav.dataset.rolou = entrada.isIntersecting ? 'nao' : 'sim';
  }).observe(sentinela);

  if (cena) {
    new IntersectionObserver(([entrada]) => {
      nav.dataset.longe = entrada.isIntersecting ? 'nao' : 'sim';
    }).observe(cena);
  }
}

/* ───────────────────────── o zero da comissão ──────────────────────────── */
/* O número conta de 30 até 0 quando entra na tela. O valor final já está no
   HTML e continua lá para quem lê por leitor de tela: a contagem acontece num
   span aria-hidden por cima, então nunca se anuncia "trinta por cento" para
   alguém que não vê o movimento. */
const zero = document.querySelector('.peca__num b');

if (zero && !quieto.matches) {
  const final = zero.textContent.trim();

  /* O número conta dentro do próprio <b>, e não num span filho: a regra
     .peca__num span existe para o rótulo "comissão" e vale para qualquer span
     do bloco, então um span aqui dentro sairia com 13px em vez dos 65px do
     número. O valor para leitor de tela vai como irmão, onde cair em 13px não
     importa — ele é recortado e nunca aparece. */
  const leitura = document.createElement('span');
  leitura.className = 'sr-only';
  leitura.textContent = final;
  const visor = zero;

  new IntersectionObserver(([entrada], obs) => {
    if (!entrada.isIntersecting) return;
    obs.disconnect();

    zero.setAttribute('aria-hidden', 'true');
    zero.after(leitura);
    zero.dataset.conta = 'indo';

    const inicio = performance.now();
    const duracao = 700;

    function passo(agora) {
      const t = Math.min((agora - inicio) / duracao, 1);
      /* Mesma curva do --saida: desacelera forte no fim, então o zero pousa
         em vez de chegar de repente. */
      const suave = 1 - Math.pow(1 - t, 3);
      visor.textContent = Math.round(30 - 30 * suave) + '%';
      if (t < 1) return requestAnimationFrame(passo);
      zero.dataset.conta = 'fim';
    }

    requestAnimationFrame(passo);
  }, { threshold: 0.6 }).observe(zero);
}
