// cardsSlider.js
// Geavanceerde en professionele cards slider met Swiper.js

document.addEventListener('DOMContentLoaded', () => {
  const swiper = new Swiper('.swiper-container', {
    // Algemene instellingen
    loop: true,                   // Herhaal de slides oneindig
    speed: 800,                   // Overgangssnelheid (in ms)
    effect: 'coverflow',          // Gebruik het coverflow-effect
    grabCursor: true,             // Verander de cursor in een 'grab'-icoon
    centeredSlides: true,         // Actieve slide in het midden
      slidesPerView: 1.7,  // 1,2 slides zichtbaar (de rest "piept" er net uit)
    spaceBetween: 30,         // Automatische breedte voor de slides

    // Coverflow-effect instellingen
    coverflowEffect: {
      rotate: 30,                 // Rotatiehoek van de slides
      stretch: 0,                 // Pas dit aan voor extra ruimte tussen slides
      depth: 100,                 // Diepte-effect voor 3D-look
      modifier: 1,                // Multiplier voor effectwaarden
      slideShadows: true          // Toon schaduwen bij de slides
    },

    // Autoplay (optioneel, kan je desgewenst inschakelen)
    autoplay: {
      delay: 5000,                // 5 seconden vertraging tussen slides
      disableOnInteraction: false // Autoplay stopt niet bij interactie
    },

    // Paginatie instellingen
    pagination: {
      el: '.swiper-pagination',
      clickable: true,            // Klikbare paginatiepunten
      dynamicBullets: true        // Dynamische bullets voor een moderner effect
    },

    // Navigatie instellingen
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },

    // Responsieve breakpoints
    breakpoints: {
      320: {                    // Mobiele apparaten
        slidesPerView: 1,
        spaceBetween: 10
      },
      640: {                    // Kleine tablets
        slidesPerView: 2,
        spaceBetween: 20
      },
      1024: {                   // Desktops
        slidesPerView: 'auto',
        spaceBetween: 30
      }
    },

    // Event callbacks voor extra functionaliteit en debugging
    on: {
      init: function () {
        console.log("✅ CardsSlider geïnitialiseerd met Swiper.js", this);
      },
      slideChange: function () {
        console.log("Slide gewijzigd naar index:", this.activeIndex);
      }
    }
  });

  console.log("✅ CardsSlider succesvol geïnitialiseerd!");
});
