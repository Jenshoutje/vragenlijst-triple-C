document.addEventListener('DOMContentLoaded', function() {
    const optionButtons = document.querySelectorAll('.option-button');
    const nextButton = document.getElementById('nextQuestion');
    let currentAnswer = null;

    // Handle option selection
    optionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selection from other buttons
            optionButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selection to clicked button
            this.classList.add('selected');
            // Enable next button
            nextButton.disabled = false;
            // Store answer
            currentAnswer = this.dataset.value;
        });
    });
});
