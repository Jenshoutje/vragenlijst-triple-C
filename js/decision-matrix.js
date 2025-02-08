// Selecteer het formulier en de verzendknop
const form = document.getElementById('decision-matrix-form');
const submitButton = document.getElementById('submit-matrix');

// Verzamel de data van het formulier
submitButton.addEventListener('click', () => {
    const formData = new FormData(form);
    const matrixData = {};

    // Loop door alle invoervelden
    for (let [key, value] of formData.entries()) {
        matrixData[key] = value;
    }

    // Valideer of alle velden zijn ingevuld
    if (Object.values(matrixData).some(value => value === '')) {
        alert('Vul alle velden in voordat je het formulier indient.');
        return;
    }

    // Stuur de data naar de console (of database/Firebase)
    console.log('Verzamelde data:', matrixData);

    // Later: Stuur naar Firebase
    alert('Bedankt voor het invullen! De data is verzonden.');
});
