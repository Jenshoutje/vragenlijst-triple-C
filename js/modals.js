// modals.js

// Functie om een modal te openen
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
  }
}

// Functie om een modal te sluiten
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

// Sluit de modal als er buiten geklikt wordt
window.addEventListener("click", (event) => {
  // Als het geklikte element de modal zelf is (dus buiten de modal-content)
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
});

// Indien je extra functionaliteit wilt koppelen (bijv. ESC-toets om te sluiten)
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => (modal.style.display = "none"));
  }
});
