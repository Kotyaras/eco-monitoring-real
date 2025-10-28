const EMISSION_FACTORS = {
    car: 0.21,
    electricity: 0.5,
    flight: 90
};

function calculateFootprint() {
    const carKm = parseFloat(document.getElementById('carKm').value) || 0;
    const electricity = parseFloat(document.getElementById('electricity').value) || 0;
    const flights = parseFloat(document.getElementById('flights').value) || 0;
    
    const carEmissions = carKm * EMISSION_FACTORS.car * 12;
    const electricityEmissions = electricity * EMISSION_FACTORS.electricity * 12;
    const flightEmissions = flights * EMISSION_FACTORS.flight;
    
    const totalEmissions = carEmissions + electricityEmissions + flightEmissions;
    
    showResult(totalEmissions, carEmissions, electricityEmissions, flightEmissions);
}

function showResult(total, car, electricity, flight) {
    const resultDiv = document.getElementById('result');
    const averageRussian = 12000;
    
    let message = `
        <h3>Ваш углеродный след: ${total.toFixed(0)} кг CO₂/год</h3>
        <p><strong>Детализация:</strong></p>
        <ul>
            <li>🚗 Транспорт: ${car.toFixed(0)} кг CO₂</li>
            <li>💡 Энергия: ${electricity.toFixed(0)} кг CO₂</li>
            <li>✈️ Перелеты: ${flight.toFixed(0)} кг CO₂</li>
        </ul>
    `;
    
    if (total < averageRussian) {
        message += `<p style="color: green;">✅ Вы ниже среднего по России</p>`;
    } else {
        message += `<p style="color: orange;">📊 Вы около среднего по России</p>`;
    }
    
    message += `
        <p><strong>💡 Советы:</strong></p>
        <ul>
            <li>Используйте общественный транспорт</li>
            <li>Выключайте свет и электроприборы</li>
            <li>Сортируйте мусор</li>
        </ul>
    `;
    
    resultDiv.innerHTML = message;
    resultDiv.style.display = 'block';
}
