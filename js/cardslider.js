// cardsSlider.js
"use strict";

document.addEventListener('DOMContentLoaded', () => {
  // Initialiseer flip effect voor elke kaart
  const cards = document.querySelectorAll(".swiper-slide .card");
  cards.forEach(card => {
    card.addEventListener("click", function(e) {
      // Alleen flippen als de klik niet plaatsvindt op een scrollable-content element
      if (!e.target.closest('.scrollable-content')) {
        card.classList.toggle("flipped");
      }
    });
  });

  // Initialiseer de Swiper instance voor de toolcards
  const swiper = new Swiper('.swiper-container', {
    loop: true,
    speed: 800,
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 1,
    spaceBetween: 430,
    coverflowEffect: {
      rotate: 30,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: true
    },
    autoplay: {
      delay: 10000,                // Slide elke 10 seconden
      disableOnInteraction: false  // Autoplay stopt niet automatisch bij interactie
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'fraction', // Geeft een fractionele paginering (current/total)
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },
    breakpoints: {
      320: {                    
        slidesPerView: 1,
        spaceBetween: 10
      },
      640: {                    
        slidesPerView: 2,
        spaceBetween: 20
      },
      1024: {                   
        slidesPerView: 'auto',
        spaceBetween: 30
      }
    },
    on: {
      init: function () {
        console.log("✅ CardsSlider geïnitialiseerd met Swiper.js", this);
      },
      slideChange: function () {
        console.log("Slide gewijzigd naar index:", this.activeIndex);
      }
    }
  });

  // Stop de autoplay wanneer de gebruiker in de scrollable content van een kaart zit
  const scrollableElements = document.querySelectorAll('.card .scrollable-content');
  scrollableElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      swiper.autoplay.stop();
      console.log("Autoplay gestopt wegens hover in scrollable content.");
    });
    el.addEventListener('mouseleave', () => {
      swiper.autoplay.start();
      console.log("Autoplay hervat na hover.");
    });
    el.addEventListener('scroll', () => {
      swiper.autoplay.stop();
      console.log("Autoplay gestopt wegens scroll in content.");
    });
  });

  console.log("✅ CardsSlider succesvol geïnitialiseerd!");
});
