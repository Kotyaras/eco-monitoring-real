let map;
let airQualityLayer;
let fireLayer;
let currentTab = 'air';

function initMap() {
    console.log('Initializing map...');
    
    // Проверяем существование элемента карты
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container #map not found');
        return;
    }
    
    try {
        // Создаем карту центром на России
        map = L.map('map').setView([55.7558, 37.6173], 3);
        
        // Добавляем базовый слой
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        
        // Создаем слои
        airQualityLayer = L.layerGroup().addTo(map);
        fireLayer = L.layerGroup().addTo(map);
        
        console.log('Map initialized successfully');
        
        // Загружаем начальные данные
        loadAirQualityData();
        loadFireData();
        
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

function showTab(tabName, event) {
    console.log('Switching to tab:', tabName);
    
    if (!map) {
        console.error('Map not initialized');
        return;
    }
    
    currentTab = tabName;
    
    // Обновляем активные кнопки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
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
        
        // Добавляем timeout для fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch('/api/air-quality', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Air quality data received:', data);
        
        // Проверяем, что слой инициализирован
        if (!airQualityLayer) {
            console.error('airQualityLayer not initialized');
            return;
        }
        
        // Очищаем слой
        airQualityLayer.clearLayers();
        
        const stations = data.data || [];
        let validStationsCount = 0;
        
        // Добавляем маркеры на карту
        stations.forEach(station => {
            try {
                if (station.coordinates && 
                    typeof station.coordinates.latitude === 'number' && 
                    typeof station.coordinates.longitude === 'number' &&
                    station.measurements) {
                    
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
                        
                        marker.addTo(airQualityLayer);
                        validStationsCount++;
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
            if (error.name === 'AbortError') {
                airQualityElement.textContent = 'Таймаут';
            } else {
                airQualityElement.textContent = 'Ошибка';
            }
        }
        // Показываем демо-данные при ошибке
        showDemoAirQuality();
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
        
        // Добавляем timeout для fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch('/api/forest-fires', {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fire data received:', data);
        
        // Проверяем, что слой инициализирован
        if (!fireLayer) {
            console.error('fireLayer not initialized');
            return;
        }
        
        // Очищаем слой
        fireLayer.clearLayers();
        
        const fires = data.fires || [];
        let validFiresCount = 0;
        
        // Добавляем маркеры пожаров на карту
        fires.forEach(fire => {
            try {
                if (fire.latitude && fire.longitude && fire.brightness) {
                    // Увеличиваем размер маркера для лучшей видимости
                    const intensity = Math.min(Math.max(fire.brightness / 30, 4), 12);
                    
                    const marker = L.circleMarker(
                        [fire.latitude, fire.longitude],
                        {
                            radius: intensity,
                            fillColor: '#ff4444',
                            color: '#cc0000',
                            weight: 1,
                            opacity: 0.9,
                            fillOpacity: 0.7
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
                            <p><strong>Дата обнаружения:</strong> ${date}</p>
                            ${data.source ? `<p><strong>Источник:</strong> ${data.source}</p>` : ''}
                            ${data.demo ? `<p style="color: #ff6b00; font-weight: bold;">⚠ Демо-данные</p>` : ''}
                        </div>
                    `);
                    
                    marker.addTo(fireLayer);
                    validFiresCount++;
                }
            } catch (fireError) {
                console.warn('Error processing fire data:', fire, fireError);
            }
        });
        
        if (fireCounterElement) {
            fireCounterElement.textContent = validFiresCount.toLocaleString();
        }
        console.log('Fire data loaded:', validFiresCount);
        
        // Если данные демо, показываем уведомление
        if (data.demo) {
            showDemoNotification('Используются демо-данные о пожарах');
        }
        
    } catch (error) {
        console.error('Error loading fire data:', error);
        const fireCounterElement = document.getElementById('fireCounter');
        if (fireCounterElement) {
            if (error.name === 'AbortError') {
                fireCounterElement.textContent = 'Таймаут';
            } else {
                fireCounterElement.textContent = 'Ошибка';
            }
        }
        // Показываем демо-данные при ошибке
        showDemoFireData();
    }
}

// Показать демо-данные о качестве воздуха
function showDemoAirQuality() {
    console.log('Showing demo air quality data');
    const airQualityElement = document.getElementById('airQuality');
    if (airQualityElement) {
        airQualityElement.textContent = '85';
    }
    
    // Создаем несколько демо-станций в ключевых городах России
    const demoStations = [
        { name: "Москва", lat: 55.7558, lng: 37.6173, pm25: 15 },
        { name: "Санкт-Петербург", lat: 59.9343, lng: 30.3351, pm25: 12 },
        { name: "Новосибирск", lat: 55.0084, lng: 82.9357, pm25: 18 },
        { name: "Екатеринбург", lat: 56.8389, lng: 60.6057, pm25: 22 },
        { name: "Казань", lat: 55.7961, lng: 49.1064, pm25: 16 },
        { name: "Краснодар", lat: 45.0355, lng: 38.9753, pm25: 14 },
        { name: "Владивосток", lat: 43.1155, lng: 131.8855, pm25: 20 }
    ];
    
    if (airQualityLayer) {
        airQualityLayer.clearLayers();
        
        demoStations.forEach(station => {
            const color = getAQIColor(station.pm25);
            const marker = L.circleMarker(
                [station.lat, station.lng],
                {
                    radius: getStationSize(station.pm25),
                    fillColor: color,
                    color: '#000',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.7
                }
            );
            
            marker.bindPopup(`
                <div style="min-width: 220px">
                    <h3>${station.name}</h3>
                    <p><strong>PM2.5:</strong> ${station.pm25} μg/m³</p>
                    <p><strong>Качество:</strong> ${getAQILevel(station.pm25)}</p>
                    <p style="color: #ff6b00; font-weight: bold;">⚠ Демо-данные</p>
                </div>
            `);
            
            marker.addTo(airQualityLayer);
        });
    }
    
    showDemoNotification('Используются демо-данные о качестве воздуха');
}

// Показать демо-данные о пожарах
function showDemoFireData() {
    console.log('Showing demo fire data');
    const fireCounterElement = document.getElementById('fireCounter');
    if (fireCounterElement) {
        fireCounterElement.textContent = '1,100';
    }
    
    // Создаем демо-пожары по всей России
    if (fireLayer) {
        fireLayer.clearLayers();
        
        // Генерируем случайные точки пожаров по территории России
        const fireClusters = [
            // Сибирь
            { latMin: 55, latMax: 65, lngMin: 80, lngMax: 100, count: 300 },
            // Дальний Восток
            { latMin: 50, latMax: 60, lngMin: 120, lngMax: 140, count: 250 },
            // Урал
            { latMin: 55, latMax: 60, lngMin: 55, lngMax: 65, count: 200 },
            // Центральная Россия
            { latMin: 52, latMax: 58, lngMin: 35, lngMax: 50, count: 150 },
            // Юг России
            { latMin: 44, latMax: 50, lngMin: 40, lngMax: 48, count: 100 },
            // Северо-Запад
            { latMin: 58, latMax: 65, lngMin: 30, lngMax: 45, count: 100 }
        ];
        
        fireClusters.forEach(cluster => {
            for (let i = 0; i < cluster.count; i++) {
                const lat = cluster.latMin + Math.random() * (cluster.latMax - cluster.latMin);
                const lng = cluster.lngMin + Math.random() * (cluster.lngMax - cluster.lngMin);
                const brightness = 100 + Math.random() * 300;
                const intensity = Math.min(Math.max(brightness / 30, 4), 12);
                
                const marker = L.circleMarker(
                    [lat, lng],
                    {
                        radius: intensity,
                        fillColor: '#ff4444',
                        color: '#cc0000',
                        weight: 1,
                        opacity: 0.9,
                        fillOpacity: 0.7
                    }
                );
                
                const regions = ["Сибирь", "Дальний Восток", "Урал", "Центральная Россия", "Юг России", "Северо-Запад"];
                const region = regions[Math.floor(Math.random() * regions.length)];
                
                marker.bindPopup(`
                    <div style="min-width: 220px">
                        <h3>🔥 Лесной пожар</h3>
                        <p><strong>Регион:</strong> ${region}</p>
                        <p><strong>Интенсивность:</strong> ${Math.round(brightness)}</p>
                        <p><strong>Статус:</strong> Активный</p>
                        <p style="color: #ff6b00; font-weight: bold;">⚠ Демо-данные</p>
                    </div>
                `);
                
                marker.addTo(fireLayer);
            }
        });
    }
    
    showDemoNotification('Используются демо-данные о пожарах');
}

// Показать уведомление о демо-данных
function showDemoNotification(message) {
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b00;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
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

// Функция для обновления данных
function refreshData() {
    console.log('Refreshing data...');
    loadAirQualityData();
    loadFireData();
}

// Обновляем данные при возвращении на вкладку
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Страница стала видимой - обновляем данные
        refreshData();
    }
});

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
    
    // Авто-обновление каждые 10 минут
    setInterval(refreshData, 10 * 60 * 1000);
});

// Обработка ошибок глобально
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
