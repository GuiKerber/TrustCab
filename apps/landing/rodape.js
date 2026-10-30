/* ==========================================================================
   TrustCab · o vale no fim da página

   A última das quatro maquetes que a página mostrava no caminho antigo: um
   vale com o rio serpenteando, a ponte de pedra, o vilarejo na margem e as
   turbinas nas cristas. O caminho saiu, mas o fim dele ficou — é ele que
   fecha a página com a mesma matéria com que ela abre.

   Quem monta é o motor das zonas, que já sabe construir qualquer composição
   do kit: aqui só se diz qual delas e em que cor de fundo. Sem WebGL o bloco
   some e o rodapé continua dizendo tudo o que precisa dizer.
   ========================================================================== */

import { STYLE } from './zonas/estilo.js';
import { mountZone } from './zonas/motor.js';

const palco = document.getElementById('palco-rodape');

if (palco) {
  try {
    mountZone(palco, 'vale', {
      background: STYLE.background,
      interactive: true,
      animate: true,
      maxPixelRatio: 1.5,
      onReady: () => {
        palco.dataset.pronto = 'sim';
      },
    });
  } catch (erro) {
    palco.hidden = true;
  }
}
