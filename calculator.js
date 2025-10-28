const EMISSION_FACTORS = {
    car: 0.21,
    electricity: 0.5,
    flight: 90
};

const WORLD_AVERAGE = 4700;
const EUROPE_AVERAGE = 6500;
const USA_AVERAGE = 16000;
const RUSSIA_AVERAGE = 12000;

const RECOMMENDATIONS = [
    "🚗 Пересядьте на общественный транспорт или велосипед",
    "💡 Замените лампы накаливания на светодиодные",
    "🌳 Сажайте деревья вокруг дома",
    "♻️ Сортируйте и перерабатывайте мусор",
    "🏠 Утеплите окна и двери для экономии отопления",
    "☀️ Установите солнечные батареи",
    "💧 Экономьте воду - принимайте душ вместо ванны",
    "🛒 Покупайте местные продукты питания",
    "📱 Отключайте зарядные устройства от сети",
    "🍃 Используйте многоразовые сумки вместо пластиковых",
    "🚲 Ходите пешком на короткие расстояния",
    "🌡️ Установите программируемый термостат",
    "🔄 Ремонтируйте вещи вместо покупки новых",
    "🍽️ Сократите потребление мяса",
    "💻 Работайте удаленно когда это возможно"
];

function calculateCarbonFootprint() {
    const carKm = parseFloat(document.getElementById('carKm').value) || 0;
    const electricity = parseFloat(document.getElementById('electricity').value) || 0;
    const flights = parseFloat(document.getElementById('flights').value) || 0;
    
    const carEmissions = carKm * EMISSION_FACTORS.car * 12;
    const electricityEmissions = electricity * EMISSION_FACTORS.electricity * 12;
    const flightEmissions = flights * EMISSION_FACTORS.flight;
    
    const totalEmissions = carEmissions + electricityEmissions + flightEmissions;
    
    showCarbonResult(totalEmissions, carEmissions, electricityEmissions, flightEmissions);
}

function showCarbonResult(total, car, electricity, flight) {
    const resultDiv = document.getElementById('carbonResult');
    
    const worldPercentage = (total / WORLD_AVERAGE * 100).toFixed(0);
    const russiaPercentage = (total / RUSSIA_AVERAGE * 100).toFixed(0);
    const europePercentage = (total / EUROPE_AVERAGE * 100).toFixed(0);
    const usaPercentage = (total / USA_AVERAGE * 100).toFixed(0);
    
    const randomRecommendations = getRandomRecommendations(3);
    
    let comparisonMessage = '';
    if (total < WORLD_AVERAGE) {
        const savingsPercent = (100 - worldPercentage);
        comparisonMessage = `
            <p style="color: green;">✅ Вы расходуете на <strong>${savingsPercent}% меньше</strong> чем средний житель Земли!</p>
            <p>Вы экономите примерно <strong>${(WORLD_AVERAGE - total).toFixed(0)} кг CO₂</strong> в год по сравнению с мировым средним</p>
        `;
    } else {
        const excessPercent = (worldPercentage - 100);
        comparisonMessage = `
            <p style="color: orange;">📊 Вы расходуете на <strong>${excessPercent}% больше</strong> чем средний житель Земли</p>
            <p>Ваш углеродный след превышает мировой средний на <strong>${(total - WORLD_AVERAGE).toFixed(0)} кг CO₂</strong> в год</p>
        `;
    }
    
    let message = `
        <h3>Ваш углеродный след: ${total.toFixed(0)} кг CO₂/год</h3>
        
        <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(worldPercentage, 100)}%"></div>
        </div>
        <p><small>${worldPercentage}% от среднего мирового показателя (${WORLD_AVERAGE} кг)</small></p>
        
        ${comparisonMessage}
        
        <p><strong>Сравнение с другими регионами:</strong></p>
        <ul>
            <li>🇷🇺 Россия: ${russiaPercentage}% от среднего</li>
            <li>🇪🇺 Европа: ${europePercentage}% от среднего</li>
            <li>🇺🇸 США: ${usaPercentage}% от среднего</li>
        </ul>
        
        <p><strong>📊 Детализация вашего следа:</strong></p>
        <ul>
            <li>🚗 Транспорт: ${car.toFixed(0)} кг CO₂ (${(car/total*100).toFixed(0)}%)</li>
            <li>💡 Энергия: ${electricity.toFixed(0)} кг CO₂ (${(electricity/total*100).toFixed(0)}%)</li>
            <li>✈️ Перелеты: ${flight.toFixed(0)} кг CO₂ (${(flight/total*100).toFixed(0)}%)</li>
        </ul>
        
        <p><strong>💡 Рекомендации для вас:</strong></p>
        <ul>
            ${randomRecommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        
        <p><em>Обновляйте страницу для получения новых рекомендаций!</em></p>
    `;
    
    resultDiv.innerHTML = message;
    resultDiv.style.display = 'block';
}

function getRandomRecommendations(count) {
    const shuffled = [...RECOMMENDATIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}
// Функции для калькулятора сохранения ресурсов
function showRecyclingTab(tabName) {
    // Скрыть все формы
    document.querySelectorAll('.recycling-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Убрать активный класс у всех кнопок
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показать выбранную форму и активировать кнопку
    document.getElementById(tabName + 'Recycling').classList.add('active');
    event.target.classList.add('active');
}

function calculateResourceSavings() {
    const paper = parseFloat(document.getElementById('paperWaste').value) || 0;
    const plastic = parseFloat(document.getElementById('plasticWaste').value) || 0;
    const glass = parseFloat(document.getElementById('glassWaste').value) || 0;
    const metal = parseFloat(document.getElementById('metalWaste').value) || 0;

    // Коэффициенты сохранения ресурсов
    const savings = {
        trees: paper * 17, // 1 кг бумаги = 17 деревьев
        energy: (paper * 30) + (plastic * 15) + (glass * 0.5) + (metal * 4), // кВт·ч
        water: paper * 200, // литры
        oil: plastic * 1.8, // литры нефти
        co2: (paper * 1.1) + (plastic * 2.3) + (glass * 0.3) + (metal * 4.5) // кг CO2
    };

    displaySavingsResults(savings, 'ресурсов');
}

function calculateBatteriesSavings() {
    const batteries = parseInt(document.getElementById('batteriesCount').value) || 0;

    const savings = {
        land: batteries * 20, // м² земли
        water: batteries * 400, // литров воды
        energy: batteries * 0.5, // кВт·ч
        toxins: batteries * 150 // грамм токсинов
    };

    displaySavingsResults(savings, 'батареек');
}

function calculateBottlesSavings() {
    const plasticBottles = parseInt(document.getElementById('plasticBottles').value) || 0;
    const glassBottles = parseInt(document.getElementById('glassBottles').value) || 0;
    const aluminumCans = parseInt(document.getElementById('aluminumCans').value) || 0;

    const savings = {
        energy: (plasticBottles * 0.3) + (glassBottles * 0.4) + (aluminumCans * 0.5),
        oil: plasticBottles * 0.2,
        sand: glassBottles * 1.2,
        bauxite: aluminumCans * 4,
        co2: (plasticBottles * 0.1) + (glassBottles * 0.2) + (aluminumCans * 0.3)
    };

    displaySavingsResults(savings, 'тары');
}

function displaySavingsResults(savings, type) {
    let resultHTML = `<h3>🌿 Результаты переработки ${type}:</h3><div class="savings-grid">`;

    if (savings.trees) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🌳</span>
            <span class="saving-value">${savings.trees.toFixed(0)}</span>
            <span class="saving-label">деревьев сохранено</span>
        </div>`;
    }

    if (savings.energy) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">⚡</span>
            <span class="saving-value">${savings.energy.toFixed(1)}</span>
            <span class="saving-label">кВт·ч энергии</span>
        </div>`;
    }

    if (savings.water) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">💧</span>
            <span class="saving-value">${savings.water.toFixed(0)}</span>
            <span class="saving-label">литров воды</span>
        </div>`;
    }

    if (savings.oil) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🛢️</span>
            <span class="saving-value">${savings.oil.toFixed(1)}</span>
            <span class="saving-label">литров нефти</span>
        </div>`;
    }

    if (savings.land) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🌍</span>
            <span class="saving-value">${savings.land.toFixed(0)}</span>
            <span class="saving-label">м² земли спасено</span>
        </div>`;
    }

    if (savings.co2) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">☁️</span>
            <span class="saving-value">${savings.co2.toFixed(1)}</span>
            <span class="saving-label">кг CO2 не выброшено</span>
        </div>`;
    }

    if (savings.toxins) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">☣️</span>
            <span class="saving-value">${savings.toxins.toFixed(0)}</span>
            <span class="saving-label">г токсинов нейтрализовано</span>
        </div>`;
    }

    if (savings.sand) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🏖️</span>
            <span class="saving-value">${savings.sand.toFixed(1)}</span>
            <span class="saving-label">кг песка сохранено</span>
        </div>`;
    }

    if (savings.bauxite) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">⛰️</span>
            <span class="saving-value">${savings.bauxite.toFixed(0)}</span>
            <span class="saving-label">г бокситов сохранено</span>
        </div>`;
    }

    resultHTML += `</div>`;
    document.getElementById('recyclingResult').innerHTML = resultHTML;
}

// Функция для обновления статистики смертности
function updatePollutionImpactStats() {
    // Здесь можно добавить логику для динамического обновления статистики
    console.log("Статистика последствий загрязнения обновлена");
}

// Вызов при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updatePollutionImpactStats();
});
