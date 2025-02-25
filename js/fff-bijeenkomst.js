document.addEventListener('DOMContentLoaded', () => {
    const questions = document.querySelectorAll('.question');
    const nextButton = document.getElementById('nextQuestion');
    const questionCounter = document.querySelector('.question-counter');
    const backButton = document.getElementById('backButton');
    let currentQuestion = 0;

    function updateQuestion() {
        questions.forEach((question, index) => {
            question.classList.toggle('active', index === currentQuestion);
        });
        questionCounter.textContent = `Vraag ${currentQuestion + 1}/10`;
        nextButton.disabled = currentQuestion === questions.length - 1;
    }

    nextButton.addEventListener('click', () => {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            updateQuestion();
        }
    });

    // Voeg functionaliteit toe aan de afbeeldingen
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', () => {
            if (currentQuestion < questions.length - 1) {
                currentQuestion++;
                updateQuestion();
            }
        });
    });

    // Terug knop functionaliteit
    backButton.addEventListener('click', () => {
        if (currentQuestion > 0) {
            currentQuestion--;
            updateQuestion();
        }
    });

    updateQuestion(); // Initialiseer de eerste vraag
});
