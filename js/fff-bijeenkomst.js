document.addEventListener('DOMContentLoaded', function() {
    // Array met alle vragen
    const questions = document.querySelectorAll('.questionfff-card');
    let currentQuestion = 0;

    // Verberg alle vragen behalve de eerste
    questions.forEach((question, index) => {
        if (index !== 0) {
            question.style.display = 'none';
        }
    });

    // Functie om naar de volgende vraag te gaan
    function nextQuestion(selectedOption) {
        // Sla de selectie op
        const selection = {
            question: currentQuestion + 1,
            selected: selectedOption
        };
        console.log('Selectie:', selection); // Voor testing

        // Verberg huidige vraag
        questions[currentQuestion].style.display = 'none';
        
        // Ga naar volgende vraag
        currentQuestion++;
        
        // Als er nog een vraag is, toon deze
        if (currentQuestion < questions.length) {
            questions[currentQuestion].style.display = 'block';
            // Scroll smooth naar de nieuwe vraag
            questions[currentQuestion].scrollIntoView({ behavior: 'smooth' });
        } else {
            // Alle vragen zijn beantwoord
            document.querySelector('.submitfff-button').style.display = 'block';
        }
    }

    // Event listeners voor de optiekaarten
    document.querySelectorAll('.optionfff-card').forEach(card => {
        card.addEventListener('click', function() {
            // Verwijder selected class van alle kaarten in huidige vraag
            const currentCards = questions[currentQuestion].querySelectorAll('.optionfff-card');
            currentCards.forEach(c => c.classList.remove('selected'));
            
            // Voeg selected class toe aan geklikte kaart
            this.classList.add('selected');
            
            // Ga na korte pauze naar volgende vraag
            setTimeout(() => {
                nextQuestion(this.dataset.option);
            }, 500);
        });
    });
}); 
