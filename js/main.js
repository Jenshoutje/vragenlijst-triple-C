let slideIndex = 0;

// Functie om de slides te tonen
function showSlides() {
    const slides = document.getElementsByClassName("slide");
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none"; // Verberg alle slides
    }
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1; // Ga terug naar de eerste slide
    }
    slides[slideIndex - 1].style.display = "block"; // Toon de huidige slide
    setTimeout(showSlides, 5000); // Wissel elke 5 seconden
}

// Start de slideshow
showSlides();
