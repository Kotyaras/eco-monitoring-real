<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Калькулятор углеродного следа</title>
    <style>
        .carbon-calculator {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .carbon-calculator .form-group {
            margin-bottom: 20px;
        }
        .carbon-calculator label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .carbon-calculator input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        .carbon-calculator button {
            background: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        .carbon-calculator button:hover {
            background: #45a049;
        }
        .carbon-calculator .result {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            display: none;
        }
        .carbon-calculator .progress-bar {
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            margin: 20px 0;
            overflow: hidden;
        }
        .carbon-calculator .progress {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.5s ease;
        }
    </style>
</head>
<body>
    <div class="carbon-calculator">
        <h2>🌍 Калькулятор углеродного следа</h2>
        
        <div class="form-group">
            <label>🚗 Пробег на автомобиле в месяц (км):</label>
            <input type="number" id="carKm" placeholder="Введите километры">
        </div>
        
        <div class="form-group">
            <label>💡 Потребление электроэнергии в месяц (кВт·ч):</label>
            <input type="number" id="electricity" placeholder="Введите кВт·ч">
        </div>
        
        <div class="form-group">
            <label>✈️ Количество перелетов в год:</label>
            <input type="number" id="flights" placeholder="Введите количество перелетов">
        </div>
        
        <button onclick="calculateCarbonFootprint()">Рассчитать углеродный след</button>
        
        <div id="carbonResult" class="result"></div>
    </div>

    <script>
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
    </script>
</body>
</html>
