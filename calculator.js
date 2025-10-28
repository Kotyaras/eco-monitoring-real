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
    
    // Валидация ввода
    if (carKm < 0 || electricity < 0 || flights < 0) {
        alert('Пожалуйста, введите положительные числа');
        return;
    }
    
    const carEmissions = carKm * EMISSION_FACTORS.car * 12;
    const electricityEmissions = electricity * EMISSION_FACTORS.electricity * 12;
    const flightEmissions = flights * EMISSION_FACTORS.flight;
    
    const totalEmissions = carEmissions + electricityEmissions + flightEmissions;
    
    showCarbonResult(totalEmissions, carEmissions, electricityEmissions, flightEmissions);
}

function showCarbonResult(total, car, electricity, flight) {
    const resultDiv = document.getElementById('carbonResult');
    
    // Защита от деления на ноль
    const worldPercentage = total > 0 ? (total / WORLD_AVERAGE * 100).toFixed(0) : 0;
    const russiaPercentage = total > 0 ? (total / RUSSIA_AVERAGE * 100).toFixed(0) : 0;
    const europePercentage = total > 0 ? (total / EUROPE_AVERAGE * 100).toFixed(0) : 0;
    const usaPercentage = total > 0 ? (total / USA_AVERAGE * 100).toFixed(0) : 0;
    
    const randomRecommendations = getRandomRecommendations(3);
    
    let comparisonMessage = '';
    if (total === 0) {
        comparisonMessage = `
            <p style="color: green;">🎉 Отлично! У вас нулевой углеродный след!</p>
            <p>Вы - пример для подражания в экологичном образе жизни!</p>
        `;
    } else if (total < WORLD_AVERAGE) {
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
    
    // Расчет процентов для детализации (с защитой от деления на ноль)
    const carPercent = total > 0 ? (car/total*100).toFixed(0) : 0;
    const electricityPercent = total > 0 ? (electricity/total*100).toFixed(0) : 0;
    const flightPercent = total > 0 ? (flight/total*100).toFixed(0) : 0;
    
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
    `;
    
    // Добавляем детализацию только если есть данные
    if (total > 0) {
        message += `
            <p><strong>📊 Детализация вашего следа:</strong></p>
            <ul>
                ${car > 0 ? `<li>🚗 Транспорт: ${car.toFixed(0)} кг CO₂ (${carPercent}%)</li>` : ''}
                ${electricity > 0 ? `<li>💡 Энергия: ${electricity.toFixed(0)} кг CO₂ (${electricityPercent}%)</li>` : ''}
                ${flight > 0 ? `<li>✈️ Перелеты: ${flight.toFixed(0)} кг CO₂ (${flightPercent}%)</li>` : ''}
            </ul>
        `;
    }
    
    message += `
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
function showRecyclingTab(tabName, event) {
    // Скрыть все формы
    document.querySelectorAll('.recycling-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Убрать активный класс у всех кнопок
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Показать выбранную форму и активировать кнопку
    const targetForm = document.getElementById(tabName + 'Recycling');
    if (targetForm) {
        targetForm.classList.add('active');
    }
    
    // Используем event.currentTarget вместо event.target для лучшей совместимости
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

function calculateResourceSavings() {
    const paper = parseFloat(document.getElementById('paperWaste').value) || 0;
    const plastic = parseFloat(document.getElementById('plasticWaste').value) || 0;
    const glass = parseFloat(document.getElementById('glassWaste').value) || 0;
    const metal = parseFloat(document.getElementById('metalWaste').value) || 0;

    // Валидация
    if (paper < 0 || plastic < 0 || glass < 0 || metal < 0) {
        alert('Пожалуйста, введите положительные числа');
        return;
    }

    // Проверка, что хотя бы одно поле заполнено
    if (paper === 0 && plastic === 0 && glass === 0 && metal === 0) {
        alert('Пожалуйста, заполните хотя бы одно поле');
        return;
    }

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

    // Валидация
    if (batteries < 0) {
        alert('Пожалуйста, введите положительное число');
        return;
    }

    if (batteries === 0) {
        alert('Пожалуйста, введите количество батареек');
        return;
    }

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

    // Валидация
    if (plasticBottles < 0 || glassBottles < 0 || aluminumCans < 0) {
        alert('Пожалуйста, введите положительные числа');
        return;
    }

    // Проверка, что хотя бы одно поле заполнено
    if (plasticBottles === 0 && glassBottles === 0 && aluminumCans === 0) {
        alert('Пожалуйста, заполните хотя бы одно поле');
        return;
    }

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

    // Счетчик для проверки, есть ли вообще данные для отображения
    let hasData = false;

    if (savings.trees && savings.trees > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🌳</span>
            <span class="saving-value">${savings.trees.toFixed(0)}</span>
            <span class="saving-label">деревьев сохранено</span>
        </div>`;
        hasData = true;
    }

    if (savings.energy && savings.energy > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">⚡</span>
            <span class="saving-value">${savings.energy.toFixed(1)}</span>
            <span class="saving-label">кВт·ч энергии</span>
        </div>`;
        hasData = true;
    }

    if (savings.water && savings.water > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">💧</span>
            <span class="saving-value">${savings.water.toFixed(0)}</span>
            <span class="saving-label">литров воды</span>
        </div>`;
        hasData = true;
    }

    if (savings.oil && savings.oil > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🛢️</span>
            <span class="saving-value">${savings.oil.toFixed(1)}</span>
            <span class="saving-label">литров нефти</span>
        </div>`;
        hasData = true;
    }

    if (savings.land && savings.land > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🌍</span>
            <span class="saving-value">${savings.land.toFixed(0)}</span>
            <span class="saving-label">м² земли спасено</span>
        </div>`;
        hasData = true;
    }

    if (savings.co2 && savings.co2 > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">☁️</span>
            <span class="saving-value">${savings.co2.toFixed(1)}</span>
            <span class="saving-label">кг CO2 не выброшено</span>
        </div>`;
        hasData = true;
    }

    if (savings.toxins && savings.toxins > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">☣️</span>
            <span class="saving-value">${savings.toxins.toFixed(0)}</span>
            <span class="saving-label">г токсинов нейтрализовано</span>
        </div>`;
        hasData = true;
    }

    if (savings.sand && savings.sand > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">🏖️</span>
            <span class="saving-value">${savings.sand.toFixed(1)}</span>
            <span class="saving-label">кг песка сохранено</span>
        </div>`;
        hasData = true;
    }

    if (savings.bauxite && savings.bauxite > 0) {
        resultHTML += `<div class="saving-item">
            <span class="saving-icon">⛰️</span>
            <span class="saving-value">${savings.bauxite.toFixed(0)}</span>
            <span class="saving-label">г бокситов сохранено</span>
        </div>`;
        hasData = true;
    }

    resultHTML += `</div>`;
    
    if (!hasData) {
        resultHTML = `<p style="text-align: center; color: #666;">Нет данных для отображения. Заполните форму выше.</p>`;
    }
    
    document.getElementById('recyclingResult').innerHTML = resultHTML;
}

// Функция для обновления статистики смертности
function updatePollutionImpactStats() {
    // Здесь можно добавить логику для динамического обновления статистики
    // Например, на основе текущего года или других факторов
    const currentYear = new Date().getFullYear();
    const growthFactor = 1 + (currentYear - 2020) * 0.02; // Рост на 2% в год
    
    const animalDeathsElement = document.getElementById('animalDeaths');
    const humanDeathsElement = document.getElementById('humanDeaths');
    
    if (animalDeathsElement) {
        animalDeathsElement.textContent = (1.5 * growthFactor).toFixed(1) + ' млн';
    }
    
    if (humanDeathsElement) {
        humanDeathsElement.textContent = (9 * growthFactor).toFixed(1) + ' млн';
    }
    
    console.log("Статистика последствий загрязнения обновлена");
}

// Вызов при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updatePollutionImpactStats();
    
    // Добавляем обработчики Enter для удобства
    document.querySelectorAll('.recycling-form input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const form = this.closest('.recycling-form');
                const button = form.querySelector('button');
                if (button) button.click();
            }
        });
    });
});

// Экспорт функций для Vercel (если нужно использовать как serverless function)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateCarbonFootprint,
        showCarbonResult,
        getRandomRecommendations,
        showRecyclingTab,
        calculateResourceSavings,
        calculateBatteriesSavings,
        calculateBottlesSavings,
        displaySavingsResults,
        updatePollutionImpactStats
    };
}
