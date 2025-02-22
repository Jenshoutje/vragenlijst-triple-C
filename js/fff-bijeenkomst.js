document.addEventListener('DOMContentLoaded', function() {
    // Array met alle vragen en antwoorden opslag
    const questions = document.querySelectorAll('.question-card');
    let currentQuestion = 0;
    let answers = [];

    // Verberg alle vragen behalve de eerste
    questions.forEach((question, index) => {
        if (index !== 0) {
            question.style.display = 'none';
        }
    });

    // Functie om naar de volgende vraag te gaan
    function nextQuestion(selectedOption, selectedCard) {
        // Sla de selectie op
        const selection = {
            question: currentQuestion + 1,
            selected: selectedOption
        };
        answers.push(selection);
        console.log('Selectie:', selection);

        // Voeg visuele feedback toe
        selectedCard.classList.add('selected');

        // Wacht even voor de transitie
        setTimeout(() => {
            // Verberg huidige vraag
            questions[currentQuestion].style.display = 'none';
            
            // Ga naar volgende vraag
            currentQuestion++;
            
            // Als er nog een vraag is, toon deze
            if (currentQuestion < questions.length) {
                questions[currentQuestion].style.display = 'block';
                questions[currentQuestion].scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            } else {
                // Alle vragen zijn beantwoord
                const submitButton = document.querySelector('.submit-button');
                submitButton.style.display = 'block';
                submitButton.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
                console.log('Alle antwoorden:', answers);
            }
        }, 500);
    }

    // Event listeners voor de optiekaarten
    document.querySelectorAll('.option-card').forEach(card => {
        card.addEventListener('click', function() {
            // Voorkom dubbele selecties
            if (this.classList.contains('selected')) return;

            // Verwijder selected class van alle kaarten in huidige vraag
            const currentCards = questions[currentQuestion].querySelectorAll('.option-card');
            currentCards.forEach(c => c.classList.remove('selected'));
            
            // Ga naar volgende vraag met de geselecteerde optie
            nextQuestion(this.dataset.option, this);
        });
    });

    // Event listener voor submit button
    document.querySelector('.submit-button').addEventListener('click', function(e) {
        e.preventDefault();
        // Hier kun je de logica toevoegen voor het verwerken van de antwoorden
        console.log('Verstuur antwoorden:', answers);
        // Bijvoorbeeld: verstuur naar een server, toon resultaten, etc.
    });
});
