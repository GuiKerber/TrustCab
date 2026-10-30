/* ==========================================================================
   TrustCab · o que aparece quando entra na tela

   Títulos, peças e degraus nascem escondidos e sobem quando a rolagem chega
   neles. A classe na raiz é o interruptor: é ela que liga o estado escondido
   no CSS, então uma página sem script nenhum mostra tudo no lugar em vez de
   esconder.
   ========================================================================== */

document.documentElement.classList.add('js');

const revelador = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    if (!entrada.isIntersecting) continue;
    entrada.target.classList.add('is-on');
    revelador.unobserve(entrada.target);
  }
}, { threshold: 0.35 });

document
  .querySelectorAll('.vitrine__title, .peca, .como__title, .degrau, .faq__title')
  .forEach((elemento) => revelador.observe(elemento));
