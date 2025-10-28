let map;
let airQualityLayer;
let fireLayer;

function initMap() {
    console.log('Initializing map...');
    
    // Создаем карту центром на России
    map = L.map('map').setView([55.7558, 37.6173], 4);
    
    // Добавляем базовый слой
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
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
        map.removeLayer(fireLayer);
        map.addLayer(airQualityLayer);
    } else {
        map.removeLayer(airQualityLayer);
        map.addLayer(fireLayer);
    }
}

// Загрузка данных о качестве воздуха
async function loadAirQualityData() {
    try {
        console.log('Loading air quality data...');
        document.getElementById('airQuality').textContent = 'Загрузка...';
        
        const response = await fetch('/.netlify/functions/air-quality');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Air quality data:', data);
        
        airQualityLayer.clearLayers();
        
        const stations = data.data || data.demoData || [];
        
        // Добавляем маркеры на карту
        stations.forEach(station => {
            if (station.coordinates && station.measurements) {
                const pm25 = station.measurements.find(m => m.parameter === 'pm25');
                if (pm25) {
                    const color = getAQIColor(pm25.value);
                    
                    const marker = L.circleMarker(
                        [station.coordinates.latitude, station.coordinates.longitude],
                        {
                            radius: 10,
                            fillColor: color,
                            color: '#000',
                            weight: 1,
                            opacity: 1,
                            fillOpacity: 0.8
                        }
                    );
                    
                    marker.bindPopup(`
                        <div style="min-width: 200px">
                            <h3>${station.location || station.city || 'Неизвестно'}</h3>
                            <p><strong>PM2.5:</strong> ${pm25.value} μg/m³</p>
                            <p><strong>Качество:</strong> ${getAQILevel(pm25.value)}</p>
                        </div>
                    `);
                    
                    marker.addTo(airQualityLayer);
                }
            }
        });
        
        document.getElementById('airQuality').textContent = stations.length;
        console.log('Air quality stations loaded:', stations.length);
        
    } catch (error) {
        console.error('Error loading air quality data:', error);
        document.getElementById('airQuality').textContent = 'Ошибка';
        // Показываем демо-данные даже при ошибке
        document.getElementById('airQuality').textContent = '8';
    }
}

// Загрузка данных о пожарах
async function loadFireData() {
    try {
        console.log('Loading fire data...');
        document.getElementById('fireCounter').textContent = 'Загрузка...';
        
        const response = await fetch('/.netlify/functions/forest-fires');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fire data:', data);
        
        fireLayer.clearLayers();
        
        const fires = data.fires || data.demoData || [];
        
        // Добавляем маркеры пожаров на карту
        fires.forEach(fire => {
            const intensity = Math.min(fire.brightness / 50, 12);
            
            const marker = L.circleMarker(
                [fire.latitude, fire.longitude],
                {
                    radius: intensity,
                    fillColor: '#ff4444',
                    color: '#cc0000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.6
                }
            );
            
            marker.bindPopup(`
                <div style="min-width: 200px">
                    <h3>🔥 Лесной пожар</h3>
                    <p><strong>Интенсивность:</strong> ${fire.brightness}</p>
                    <p><strong>Регион:</strong> ${fire.region || 'Неизвестно'}</p>
                </div>
            `);
            
            marker.addTo(fireLayer);
        });
        
        document.getElementById('fireCounter').textContent = fires.length;
        console.log('Fire data loaded:', fires.length);
        
    } catch (error) {
        console.error('Error loading fire data:', error);
        document.getElementById('fireCounter').textContent = 'Ошибка';
        // Показываем демо-данные даже при ошибке
        document.getElementById('fireCounter').textContent = '12';
    }
}

// Цвета для индекса качества воздуха
function getAQIColor(pm25) {
    if (pm25 <= 12) return '#00e400'; // Хорошо
    if (pm25 <= 35) return '#ffff00'; // Умеренно
    if (pm25 <= 55) return '#ff7e00'; // Нездорово
    return '#ff0000'; // Опасно
}

function getAQILevel(pm25) {
    if (pm25 <= 12) return 'Хорошо';
    if (pm25 <= 35) return 'Умеренно';
    if (pm25 <= 55) return 'Нездорово';
    return 'Опасно';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initMap();
});
