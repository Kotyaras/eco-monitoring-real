let map;
let airQualityLayer;
let fireLayer;
let currentTab = 'air';

function initMap() {
    console.log('Initializing map...');
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container #map not found');
        return;
    }
    
    try {
        // Глобальная карта с видом на весь мир
        map = L.map('map').setView([30, 0], 2);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        
        airQualityLayer = L.layerGroup().addTo(map);
        fireLayer = L.layerGroup().addTo(map);
        
        console.log('Map initialized successfully');
        
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
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
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

async function loadAirQualityData() {
    try {
        console.log('Loading air quality data...');
        const airQualityElement = document.getElementById('airQuality');
        if (airQualityElement) {
            airQualityElement.textContent = 'Загрузка...';
        }
        
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
        
        if (!airQualityLayer) return;
        
        airQualityLayer.clearLayers();
        
        const stations = data.data || [];
        let validStationsCount = 0;
        
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
            airQualityElement.textContent = error.name === 'AbortError' ? 'Таймаут' : 'Ошибка';
        }
        showDemoAirQuality();
    }
}

async function loadFireData() {
    try {
        console.log('Loading fire data...');
        const fireCounterElement = document.getElementById('fireCounter');
        if (fireCounterElement) {
            fireCounterElement.textContent = 'Загрузка...';
        }
        
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
        
        if (!fireLayer) return;
        
        fireLayer.clearLayers();
        
        const fires = data.fires || [];
        let validFiresCount = 0;
        
        fires.forEach(fire => {
            try {
                if (fire.latitude && fire.longitude && fire.brightness) {
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
        
        if (data.demo) {
            showDemoNotification('Используются демо-данные о пожарах');
        }
        
    } catch (error) {
        console.error('Error loading fire data:', error);
        const fireCounterElement = document.getElementById('fireCounter');
        if (fireCounterElement) {
            fireCounterElement.textContent = error.name === 'AbortError' ? 'Таймаут' : 'Ошибка';
        }
        showDemoFireData();
    }
}

function showDemoAirQuality() {
    console.log('Showing demo air quality data');
    const airQualityElement = document.getElementById('airQuality');
    if (airQualityElement) {
        airQualityElement.textContent = '85';
    }
    
    const demoStations = [
        // Европа
        { name: "Москва", lat: 55.7558, lng: 37.6173, pm25: 15 },
        { name: "Лондон", lat: 51.5074, lng: -0.1278, pm25: 12 },
        { name: "Париж", lat: 48.8566, lng: 2.3522, pm25: 18 },
        { name: "Берлин", lat: 52.5200, lng: 13.4050, pm25: 14 },
        { name: "Мадрид", lat: 40.4168, lng: -3.7038, pm25: 16 },
        
        // Азия
        { name: "Пекин", lat: 39.9042, lng: 116.4074, pm25: 45 },
        { name: "Токио", lat: 35.6762, lng: 139.6503, pm25: 22 },
        { name: "Дели", lat: 28.6139, lng: 77.2090, pm25: 38 },
        { name: "Сеул", lat: 37.5665, lng: 126.9780, pm25: 25 },
        { name: "Бангкок", lat: 13.7563, lng: 100.5018, pm25: 32 },
        
        // Северная Америка
        { name: "Нью-Йорк", lat: 40.7128, lng: -74.0060, pm25: 13 },
        { name: "Лос-Анджелес", lat: 34.0522, lng: -118.2437, pm25: 28 },
        { name: "Торонто", lat: 43.6532, lng: -79.3832, pm25: 11 },
        { name: "Мехико", lat: 19.4326, lng: -99.1332, pm25: 35 },
        { name: "Чикаго", lat: 41.8781, lng: -87.6298, pm25: 16 },
        
        // Южная Америка
        { name: "Сан-Паулу", lat: -23.5505, lng: -46.6333, pm25: 24 },
        { name: "Буэнос-Айрес", lat: -34.6037, lng: -58.3816, pm25: 18 },
        { name: "Лима", lat: -12.0464, lng: -77.0428, pm25: 29 },
        { name: "Богота", lat: 4.7110, lng: -74.0721, pm25: 26 },
        { name: "Сантьяго", lat: -33.4489, lng: -70.6693, pm25: 31 },
        
        // Африка
        { name: "Каир", lat: 30.0444, lng: 31.2357, pm25: 42 },
        { name: "Лагос", lat: 6.5244, lng: 3.3792, pm25: 37 },
        { name: "Йоханнесбург", lat: -26.2041, lng: 28.0473, pm25: 33 },
        { name: "Найроби", lat: -1.2864, lng: 36.8172, pm25: 28 },
        { name: "Кейптаун", lat: -33.9249, lng: 18.4241, pm25: 19 },
        
        // Австралия
        { name: "Сидней", lat: -33.8688, lng: 151.2093, pm25: 14 },
        { name: "Мельбурн", lat: -37.8136, lng: 144.9631, pm25: 12 },
        { name: "Перт", lat: -31.9505, lng: 115.8605, pm25: 16 },
        { name: "Брисбен", lat: -27.4698, lng: 153.0251, pm25: 15 },
        { name: "Окленд", lat: -36.8485, lng: 174.7633, pm25: 11 }
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

function showDemoFireData() {
    console.log('Showing demo fire data');
    const fireCounterElement = document.getElementById('fireCounter');
    if (fireCounterElement) {
        fireCounterElement.textContent = '1,100';
    }
    
    if (fireLayer) {
        fireLayer.clearLayers();
        
        // Глобальное распределение пожаров по всем континентам
        const globalFireRegions = [
            // Северная Америка - 200 пожаров
            { latMin: 25, latMax: 50, lngMin: -125, lngMax: -65, count: 200 },
            // Южная Америка - 180 пожаров
            { latMin: -35, latMax: 5, lngMin: -80, lngMax: -45, count: 180 },
            // Европа - 150 пожаров
            { latMin: 40, latMax: 60, lngMin: -10, lngMax: 40, count: 150 },
            // Азия - 300 пожаров
            { latMin: 20, latMax: 60, lngMin: 60, lngMax: 140, count: 300 },
            // Африка - 200 пожаров
            { latMin: -35, latMax: 35, lngMin: -20, lngMax: 50, count: 200 },
            // Австралия - 70 пожаров
            { latMin: -35, latMax: -15, lngMin: 115, lngMax: 150, count: 70 }
        ];
        
        globalFireRegions.forEach(region => {
            for (let i = 0; i < region.count; i++) {
                const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
                const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);
                
                // Проверяем, что точка на суше (упрощенная проверка)
                if (!isOcean(lat, lng)) {
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
                    
                    const country = getCountryByCoords(lat, lng);
                    const regionName = getRegionByCoords(lat, lng);
                    
                    marker.bindPopup(`
                        <div style="min-width: 220px">
                            <h3>🔥 Лесной пожар</h3>
                            <p><strong>Страна:</strong> ${country}</p>
                            <p><strong>Регион:</strong> ${regionName}</p>
                            <p><strong>Интенсивность:</strong> ${Math.round(brightness)}</p>
                            <p><strong>Статус:</strong> Активный</p>
                            <p style="color: #ff6b00; font-weight: bold;">⚠ Демо-данные</p>
                        </div>
                    `);
                    
                    marker.addTo(fireLayer);
                }
            }
        });
    }
    
    showDemoNotification('Используются демо-данные о пожарах');
}

// Упрощенная проверка на океан
function isOcean(lat, lng) {
    // Основные океаны
    if (lng >= -70 && lng <= 20 && lat >= -50 && lat <= 50) return true; // Атлантический
    if ((lng >= 120 || lng <= -70) && lat >= -60 && lat <= 60) return true; // Тихий
    if (lng >= 40 && lng <= 120 && lat >= -50 && lat <= 30) return true; // Индийский
    if (lat > 75) return true; // Северный Ледовитый
    
    // Основные моря
    if (lng >= -5 && lng <= 36 && lat >= 30 && lat <= 45) return true; // Средиземное
    if (lng >= -90 && lng <= -60 && lat >= 10 && lat <= 25) return true; // Карибское
    
    return false;
}

function getCountryByCoords(lat, lng) {
    if (lat >= 50 && lng >= 30 && lng <= 180) return "Россия";
    if (lat >= 25 && lat <= 50 && lng >= -125 && lng <= -65) return "США";
    if (lat >= -35 && lat <= 5 && lng >= -80 && lng <= -45) return "Бразилия";
    if (lat >= 35 && lat <= 60 && lng >= -10 && lng <= 40) return "Европа";
    if (lat >= 20 && lat <= 40 && lng >= 70 && lng <= 100) return "Китай/Индия";
    if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 50) return "Африка";
    if (lat >= -35 && lat <= -15 && lng >= 115 && lng <= 150) return "Австралия";
    return "Неизвестно";
}

function getRegionByCoords(lat, lng) {
    if (lat >= 15 && lat <= 75 && lng >= -170 && lng <= -50) return "Северная Америка";
    if (lat >= -55 && lat <= 15 && lng >= -85 && lng <= -30) return "Южная Америка";
    if (lat >= 35 && lat <= 70 && lng >= -25 && lng <= 50) return "Европа";
    if (lat >= 10 && lat <= 75 && lng >= 50 && lng <= 180) return "Азия";
    if (lat >= -35 && lat <= 37 && lng >= -25 && lng <= 55) return "Африка";
    if (lat >= -50 && lat <= 0 && lng >= 110 && lng <= 180) return "Австралия и Океания";
    return "Другие регионы";
}

function showDemoNotification(message) {
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
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function getStationSize(pm25) {
    return Math.max(6, Math.min(20, pm25 / 3));
}

function getAQIColor(pm25) {
    if (pm25 <= 12) return '#00e400';
    if (pm25 <= 35) return '#ffff00';
    if (pm25 <= 55) return '#ff7e00';
    if (pm25 <= 150) return '#ff0000';
    return '#8f3f97';
}

function getAQILevel(pm25) {
    if (pm25 <= 12) return 'Хорошо';
    if (pm25 <= 35) return 'Умеренно';
    if (pm25 <= 55) return 'Нездорово';
    if (pm25 <= 150) return 'Очень нездорово';
    return 'Опасно';
}

function refreshData() {
    console.log('Refreshing data...');
    loadAirQualityData();
    loadFireData();
}

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        refreshData();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', refreshData);
    });
    
    initMap();
    
    setInterval(refreshData, 10 * 60 * 1000);
});

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
