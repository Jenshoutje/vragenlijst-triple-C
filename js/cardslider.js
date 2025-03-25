"use strict";

document.addEventListener('DOMContentLoaded', () => {
  // Initialiseer flip effect: iedere klik op de kaart togglet de flipped-klasse.
  const cards = document.querySelectorAll(".swiper-slide .card");
  cards.forEach(card => {
    card.addEventListener("click", function(e) {
      // Voorkom conflicten met pointer-drag events als dat nodig is (optioneel)
      card.classList.toggle("flipped");
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
      disableOnInteraction: false  // Autoplay stopt niet bij interactie
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'fraction', // Geeft "current/total"
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
        // Reset alle kaarten naar de voorkant wanneer de slide verandert
        document.querySelectorAll('.swiper-slide .card').forEach(card => {
          card.classList.remove("flipped");
        });
      }
    }
  });

  // Stop de autoplay wanneer de gebruiker in scrollable content zit
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
