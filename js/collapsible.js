document.addEventListener("DOMContentLoaded", () => {
  // Selecteer alle collapsible cards op de pagina
  const cards = document.querySelectorAll(".collapsible-card");

  cards.forEach(card => {
    const header = card.querySelector(".collapsible-header");
    // Voeg een klik-event toe aan de header om de 'open' class te togglen
    header.addEventListener("click", () => {
      card.classList.toggle("open");
    });
  });
});
