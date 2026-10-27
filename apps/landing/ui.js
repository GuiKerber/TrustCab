/* ==========================================================================
   TrustCab · o formulário de feedback

   A página é estática: não há servidor para despachar e-mail. O formulário
   junta o que foi escrito e entrega para o programa de e-mail da pessoa, já
   endereçado e preenchido — ela só confere e manda.

   Sem JavaScript o botão continua valendo: no HTML ele já é um link mailto,
   e é só isso que este arquivo substitui.
   ========================================================================== */

const PARA = 'contact@guikerber.com';

const modal = document.getElementById('feedback');
const gatilhos = document.querySelectorAll('[data-abre="feedback"]');
if (modal && gatilhos.length && typeof modal.showModal === 'function') {
  const form = modal.querySelector('form');
  const texto = form.elements.texto;
  const erro = modal.querySelector('.campo__erro');
  const campoTexto = texto.closest('.campo');

  for (const g of gatilhos) {
    g.addEventListener('click', (evento) => {
      evento.preventDefault();
      modal.showModal();
      texto.focus();
    });
  }

  // O aviso de erro é escrito por nós para dizer o que fazer, no lugar da
  // bolha do navegador, que varia de um para o outro e some sozinha.
  texto.addEventListener('invalid', (evento) => {
    evento.preventDefault();
    campoTexto.classList.add('tem-erro');
    erro.hidden = false;
    texto.focus();
  });
  texto.addEventListener('input', () => {
    if (!texto.value.trim()) return;
    campoTexto.classList.remove('tem-erro');
    erro.hidden = true;
  });

  // Clique no escuro em volta fecha, como todo mundo espera.
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) modal.close('fechar');
  });

  modal.addEventListener('close', () => {
    if (modal.returnValue !== 'enviar') return;
    const nome = form.elements.nome.value.trim();
    const email = form.elements.email.value.trim();
    const assinatura = [
      nome && `— ${nome}`,
      email && `Respondo em: ${email}`,
    ].filter(Boolean);
    const corpo = assinatura.length
      ? `${texto.value.trim()}\n\n${assinatura.join('\n')}`
      : texto.value.trim();

    const url = `mailto:${PARA}`
      + `?subject=${encodeURIComponent('Feedback do site TrustCab')}`
      + `&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
    form.reset();
    campoTexto.classList.remove('tem-erro');
    erro.hidden = true;
  });
}
