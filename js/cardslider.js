// cardsSlider.js

// Wacht tot de DOM volledig geladen is
document.addEventListener('DOMContentLoaded', () => {
  // Initialiseer de Swiper instance voor de toolcards
  const swiper = new Swiper('.swiper-container', {
    loop: true,                   // Herhaal de slides oneindig
    speed: 800,                   // Snelheid van de overgang (in ms)
    effect: 'coverflow',          // Gebruik coverflow-effect
    grabCursor: true,             // Cursor verandert in een 'grab' icoon
    centeredSlides: true,         // Zorg dat de actieve slide in het midden staat
    slidesPerView: 'auto',        // Automatische breedte van de slides
    coverflowEffect: {
      rotate: 30,                 // Rotatiehoek voor de slides
      stretch: 0,                 // Extra ruimte tussen slides (pas dit aan naar wens)
      depth: 100,                 // Diepte van de 3D-effecten
      modifier: 1,                // Multiplier voor de effectwaarden
      slideShadows: true          // Schaduwen bij de slides
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,            // Klikbare paginatiepunten
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });

  console.log("✅ CardsSlider geïnitialiseerd met Swiper!");
});
