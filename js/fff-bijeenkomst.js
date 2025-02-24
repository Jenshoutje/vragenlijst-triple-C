document.addEventListener('DOMContentLoaded', () => {
    const questions = document.querySelectorAll('.question');
    const nextButton = document.getElementById('nextQuestion');
    const questionCounter = document.querySelector('.question-counter');
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

    document.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', () => {
            // Verwijder de 'selected' klasse van alle knoppen
            document.querySelectorAll('.option-button').forEach(btn => btn.classList.remove('selected'));
            // Voeg de 'selected' klasse toe aan de geklikte knop
            button.classList.add('selected');
            // Maak de volgende knop actief
            nextButton.disabled = false;
        });
    });

    updateQuestion(); // Initialiseer de eerste vraag
});
