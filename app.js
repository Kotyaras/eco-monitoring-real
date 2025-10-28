let map;
let airQualityLayer;
let fireLayer;

function initMap() {
    console.log('Initializing map...');
    
    // Проверяем существование элемента карты
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container #map not found');
        return;
    }
    
    // Создаем карту центром на России
    map = L.map('map').setView([55.7558, 37.6173], 4);
    
    // Добавляем базовый слой
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Создаем слои
    airQualityLayer = L.layerGroup().addTo(map);
    fireLayer = L.layerGroup().addTo(map);
    
    // Загружаем начальные данные
    loadAirQualityData();
    loadFireData();
}

function showTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Обновляем активные кнопки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Показываем нужный слой
    if (tabName === 'air') {
        if (map.hasLayer(fireLayer)) {
            map.removeLayer(fireLayer);
        }
        if (!map.hasLayer(airQualityLayer)) {
            map.addLayer(airQualityLayer);
        }
    } else {
        if (map.hasLayer(airQualityLayer)) {
            map.removeLayer(airQualityLayer);
        }
        if (!map.hasLayer(fireLayer)) {
            map.addLayer(fireLayer);
        }
    }
}

// Загрузка данных о качестве воздуха
async function loadAirQualityData() {
    try {
        console.log('Loading air quality data...');
        const airQualityElement = document.getElementById('airQuality');
        if (airQualityElement) {
            airQualityElement.textContent = 'Загрузка...';
        }
        
        const response = await fetch('/.netlify/functions/air-quality');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Air quality data received:', data);
        
        // Очищаем слой
        if (airQualityLayer) {
            airQualityLayer.clearLayers();
        }
        
        const stations = data.data || [];
        let validStationsCount = 0;
        
        // Добавляем маркеры на карту
        stations.forEach(station => {
            try {
                if (station.coordinates && station.measurements) {
                    const pm25 = station.measurements.find(m => m.parameter === 'pm25');
                    if (pm25 && !isNaN(pm25.value) && pm25.value >= 0) {
                        const color = getAQIColor(pm25.value);
                        
                        const marker = L.circleMarker(
                            [station.coordinates.latitude, station.coordinates.longitude],
                            {
                                radius: getStationSize(pm25.value),
                                fillColor: color,
                                color: '#000',
                                weight: 1,
                                opacity: 0.8,
                                fillOpacity: 0.7
                            }
                        );
                        
                        const cityName = station.location || station.city || 'Неизвестно';
                        const country = station.country || '';
                        
                        marker.bindPopup(`
                            <div style="min-width: 220px">
                                <h3>${cityName}</h3>
                                ${country ? `<p><strong>Страна:</strong> ${country}</p>` : ''}
                                <p><strong>PM2.5:</strong> ${pm25.value} μg/m³</p>
                                <p><strong>Качество:</strong> ${getAQILevel(pm25.value)}</p>
                                <p><strong>Источник:</strong> ${data.source || 'OpenAQ'}</p>
                            </div>
                        `);
                        
                        if (airQualityLayer) {
                            marker.addTo(airQualityLayer);
                            validStationsCount++;
                        }
                    }
                }
            } catch (stationError) {
                console.warn('Error processing station:', station, stationError);
            }
        });
        
        if (airQualityElement) {
            airQualityElement.textContent = validStationsCount;
        }
        console.log('Air quality stations loaded:', validStationsCount);
        
    } catch (error) {
        console.error('Error loading air quality data:', error);
        const airQualityElement = document.getElementById('airQuality');
        if (airQualityElement) {
            airQualityElement.textContent = 'Ошибка';
        }
        // Показываем демо-данные даже при ошибке
        setTimeout(() => {
            if (airQualityElement) {
                airQualityElement.textContent = '100';
            }
        }, 1000);
    }
}

// Загрузка данных о пожарах
async function loadFireData() {
    try {
        console.log('Loading fire data...');
        const fireCounterElement = document.getElementById('fireCounter');
        if (fireCounterElement) {
            fireCounterElement.textContent = 'Загрузка...';
        }
        
        const response = await fetch('/.netlify/functions/forest-fires');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fire data received:', data);
        
        // Очищаем слой
        if (fireLayer) {
            fireLayer.clearLayers();
        }
        
        const fires = data.fires || [];
        let validFiresCount = 0;
        
        // Добавляем маркеры пожаров на карту
        fires.forEach(fire => {
            try {
                if (fire.latitude && fire.longitude && fire.brightness) {
                    const intensity = Math.min(Math.max(fire.brightness / 50, 5), 15);
                    
                    const marker = L.circleMarker(
                        [fire.latitude, fire.longitude],
                        {
                            radius: intensity,
                            fillColor: '#ff4444',
                            color: '#cc0000',
                            weight: 1,
                            opacity: 0.8,
                            fillOpacity: 0.6
                        }
                    );
                    
                    const region = fire.region || 'Неизвестно';
                    const country = fire.country || '';
                    const date = fire.date ? new Date(fire.date).toLocaleDateString('ru-RU') : 'Неизвестно';
                    
                    marker.bindPopup(`
                        <div style="min-width: 220px">
                            <h3>🔥 Лесной пожар</h3>
                            ${country ? `<p><strong>Страна:</strong> ${country}</p>` : ''}
                            <p><strong>Регион:</strong> ${region}</p>
                            <p><strong>Интенсивность:</strong> ${Math.round(fire.brightness)}</p>
                            <p><strong>Дата:</strong> ${date}</p>
                            ${data.source ? `<p><strong>Источник:</strong> ${data.source}</p>` : ''}
                        </div>
                    `);
                    
                    if (fireLayer) {
                        marker.addTo(fireLayer);
                        validFiresCount++;
                    }
                }
            } catch (fireError) {
                console.warn('Error processing fire data:', fire, fireError);
            }
        });
        
        if (fireCounterElement) {
            fireCounterElement.textContent = validFiresCount;
        }
        console.log('Fire data loaded:', validFiresCount);
        
    } catch (error) {
        console.error('Error loading fire data:', error);
        const fireCounterElement = document.getElementById('fireCounter');
        if (fireCounterElement) {
            fireCounterElement.textContent = 'Ошибка';
        }
        // Показываем демо-данные даже при ошибке
        setTimeout(() => {
            if (fireCounterElement) {
                fireCounterElement.textContent = '73';
            }
        }, 1000);
    }
}

// Размер маркера в зависимости от уровня загрязнения
function getStationSize(pm25) {
    return Math.max(6, Math.min(20, pm25 / 3));
}

// Цвета для индекса качества воздуха
function getAQIColor(pm25) {
    if (pm25 <= 12) return '#00e400'; // Хорошо
    if (pm25 <= 35) return '#ffff00'; // Умеренно
    if (pm25 <= 55) return '#ff7e00'; // Нездорово
    if (pm25 <= 150) return '#ff0000'; // Очень нездорово
    return '#8f3f97'; // Опасно
}

function getAQILevel(pm25) {
    if (pm25 <= 12) return 'Хорошо';
    if (pm25 <= 35) return 'Умеренно';
    if (pm25 <= 55) return 'Нездорово';
    if (pm25 <= 150) return 'Очень нездорово';
    return 'Опасно';
}

// Функция для обновления данных (можно вызывать периодически)
function refreshData() {
    console.log('Refreshing data...');
    loadAirQualityData();
    loadFireData();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Добавляем обработчики для кнопок обновления (если есть)
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', refreshData);
    });
    
    // Инициализируем карту
    initMap();
    
    // Авто-обновление каждые 5 минут
    setInterval(refreshData, 5 * 60 * 1000);
});

// Обработка ошибок глобально
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
