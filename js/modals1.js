// modals.js

// Functie om een modal te openen
function openModal(modal1Id) {
  const modal = document.getElementById(modal1Id);
  if (modal) {
    modal.style.display = "block";
  }
}

// Functie om een modal te sluiten
function closeModal(modal1Id) {
  const modal = document.getElementById(modal1Id);
  if (modal) {
    modal.style.display = "none";
  }
}

// Sluit de modal als er buiten geklikt wordt
window.addEventListener("click", (event) => {
  // Als het geklikte element de modal zelf is (dus buiten de modal-content)
  if (event.target.classList.contains("modal1")) {
    event.target.style.display = "none";
  }
});

// Indien je extra functionaliteit wilt koppelen (bijv. ESC-toets om te sluiten)
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const modals = document.querySelectorAll(".modal1");
    modals.forEach((modal1) => {
      modal1.style.display = "none";
    });
  }
});

// Koppel de open-knop aan de openModal functie
document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openModal1");
  if (openBtn) {
    openBtn.addEventListener("click", function() {
      openModal("rapportModal1");
    });
  }
  
  // Optioneel: koppelen van een close-knop als deze aanwezig is
  const closeBtn = document.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", function() {
      closeModal("rapportModal1");
    });
  }
});
