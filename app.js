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
        
        // Пытаемся загрузить реальные данные
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        let realDataLoaded = false;
        
        try {
            const response = await fetch('/api/air-quality', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Real air quality data received:', data);
                
                if (airQualityLayer && data.data && data.data.length > 0) {
                    airQualityLayer.clearLayers();
                    
                    let validStationsCount = 0;
                    
                    data.data.forEach(station => {
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
                    
                    if (validStationsCount > 0) {
                        realDataLoaded = true;
                        showNotification('✅ Загружены реальные данные о качестве воздуха', 'success');
                        return;
                    }
                }
            }
        } catch (error) {
            console.log('Real air quality data failed:', error);
        }
        
        // Если реальные данные не загрузились, показываем демо-данные
        if (!realDataLoaded) {
            showDemoAirQuality();
        }
        
    } catch (error) {
        console.error('Error loading air quality data:', error);
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
        
        // Пытаемся загрузить реальные данные
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        let realDataLoaded = false;
        
        try {
            const response = await fetch('/api/forest-fires', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Real fire data received:', data);
                
                if (fireLayer && data.fires && data.fires.length > 0) {
                    fireLayer.clearLayers();
                    
                    let validFiresCount = 0;
                    
                    data.fires.forEach(fire => {
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
                                        <p><strong>Источник:</strong> ${data.source || 'NASA FIRMS'}</p>
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
                    
                    if (validFiresCount > 0) {
                        realDataLoaded = true;
                        showNotification('✅ Загружены реальные данные о пожарах', 'success');
                        return;
                    }
                }
            }
        } catch (error) {
            console.log('Real fire data failed:', error);
        }
        
        // Если реальные данные не загрузились, показываем демо-данные
        if (!realDataLoaded) {
            showDemoFireData();
        }
        
    } catch (error) {
        console.error('Error loading fire data:', error);
        showDemoFireData();
    }
}

function showDemoAirQuality() {
    console.log('Showing demo air quality data');
    const airQualityElement = document.getElementById('airQuality');
    if (airQualityElement) {
        airQualityElement.textContent = '85';
    }
    
    // Демо-станции по всему миру
    const demoStations = [
        // Европа (15 станций)
        { name: "Москва", lat: 55.7558, lng: 37.6173, pm25: 15 },
        { name: "Лондон", lat: 51.5074, lng: -0.1278, pm25: 12 },
        { name: "Париж", lat: 48.8566, lng: 2.3522, pm25: 18 },
        { name: "Берлин", lat: 52.5200, lng: 13.4050, pm25: 14 },
        { name: "Мадрид", lat: 40.4168, lng: -3.7038, pm25: 16 },
        { name: "Рим", lat: 41.9028, lng: 12.4964, pm25: 20 },
        { name: "Киев", lat: 50.4501, lng: 30.5234, pm25: 22 },
        { name: "Варшава", lat: 52.2297, lng: 21.0122, pm25: 19 },
        { name: "Прага", lat: 50.0755, lng: 14.4378, pm25: 17 },
        { name: "Вена", lat: 48.2082, lng: 16.3738, pm25: 16 },
        { name: "Амстердам", lat: 52.3676, lng: 4.9041, pm25: 15 },
        { name: "Стокгольм", lat: 59.3293, lng: 18.0686, pm25: 11 },
        { name: "Осло", lat: 59.9139, lng: 10.7522, pm25: 10 },
        { name: "Хельсинки", lat: 60.1699, lng: 24.9384, pm25: 12 },
        { name: "Афины", lat: 37.9838, lng: 23.7275, pm25: 25 },

        // Азия (15 станций)
        { name: "Пекин", lat: 39.9042, lng: 116.4074, pm25: 45 },
        { name: "Токио", lat: 35.6762, lng: 139.6503, pm25: 22 },
        { name: "Сеул", lat: 37.5665, lng: 126.9780, pm25: 25 },
        { name: "Дели", lat: 28.6139, lng: 77.2090, pm25: 38 },
        { name: "Мумбаи", lat: 19.0760, lng: 72.8777, pm25: 35 },
        { name: "Бангкок", lat: 13.7563, lng: 100.5018, pm25: 32 },
        { name: "Сингапур", lat: 1.3521, lng: 103.8198, pm25: 20 },
        { name: "Джакарта", lat: -6.2088, lng: 106.8456, pm25: 40 },
        { name: "Манила", lat: 14.5995, lng: 120.9842, pm25: 28 },
        { name: "Куала-Лумпур", lat: 3.1390, lng: 101.6869, pm25: 26 },
        { name: "Дубай", lat: 25.2048, lng: 55.2708, pm25: 30 },
        { name: "Тегеран", lat: 35.6892, lng: 51.3890, pm25: 42 },
        { name: "Багдад", lat: 33.3152, lng: 44.3661, pm25: 48 },
        { name: "Эр-Рияд", lat: 24.7136, lng: 46.6753, pm25: 35 },
        { name: "Анкара", lat: 39.9334, lng: 32.8597, pm25: 29 },

        // Северная Америка (15 станций)
        { name: "Нью-Йорк", lat: 40.7128, lng: -74.0060, pm25: 13 },
        { name: "Лос-Анджелес", lat: 34.0522, lng: -118.2437, pm25: 28 },
        { name: "Чикаго", lat: 41.8781, lng: -87.6298, pm25: 16 },
        { name: "Торонто", lat: 43.6532, lng: -79.3832, pm25: 11 },
        { name: "Мехико", lat: 19.4326, lng: -99.1332, pm25: 35 },
        { name: "Майами", lat: 25.7617, lng: -80.1918, pm25: 14 },
        { name: "Ванкувер", lat: 49.2827, lng: -123.1207, pm25: 9 },
        { name: "Вашингтон", lat: 38.9072, lng: -77.0369, pm25: 15 },
        { name: "Бостон", lat: 42.3601, lng: -71.0589, pm25: 12 },
        { name: "Сан-Франциско", lat: 37.7749, lng: -122.4194, pm25: 18 },
        { name: "Атланта", lat: 33.7490, lng: -84.3880, pm25: 17 },
        { name: "Даллас", lat: 32.7767, lng: -96.7970, pm25: 19 },
        { name: "Денвер", lat: 39.7392, lng: -104.9903, pm25: 16 },
        { name: "Финикс", lat: 33.4484, lng: -112.0740, pm25: 22 },
        { name: "Сиэтл", lat: 47.6062, lng: -122.3321, pm25: 13 },

        // Южная Америка (10 станций)
        { name: "Сан-Паулу", lat: -23.5505, lng: -46.6333, pm25: 24 },
        { name: "Буэнос-Айрес", lat: -34.6037, lng: -58.3816, pm25: 18 },
        { name: "Лима", lat: -12.0464, lng: -77.0428, pm25: 29 },
        { name: "Богота", lat: 4.7110, lng: -74.0721, pm25: 26 },
        { name: "Рио-де-Жанейро", lat: -22.9068, lng: -43.1729, pm25: 23 },
        { name: "Сантьяго", lat: -33.4489, lng: -70.6693, pm25: 31 },
        { name: "Каракас", lat: 10.4806, lng: -66.9036, pm25: 33 },
        { name: "Кито", lat: -0.1807, lng: -78.4678, pm25: 20 },
        { name: "Монтевидео", lat: -34.9011, lng: -56.1645, pm25: 17 },
        { name: "Ла-Пас", lat: -16.4897, lng: -68.1193, pm25: 25 },

        // Африка (10 станций)
        { name: "Каир", lat: 30.0444, lng: 31.2357, pm25: 42 },
        { name: "Лагос", lat: 6.5244, lng: 3.3792, pm25: 37 },
        { name: "Йоханнесбург", lat: -26.2041, lng: 28.0473, pm25: 33 },
        { name: "Найроби", lat: -1.2864, lng: 36.8172, pm25: 28 },
        { name: "Кейптаун", lat: -33.9249, lng: 18.4241, pm25: 19 },
        { name: "Аккра", lat: 5.6037, lng: -0.1870, pm25: 31 },
        { name: "Адис-Абеба", lat: 9.0300, lng: 38.7400, pm25: 35 },
        { name: "Дар-эс-Салам", lat: -6.7924, lng: 39.2083, pm25: 30 },
        { name: "Алжир", lat: 36.7538, lng: 3.0588, pm25: 29 },
        { name: "Касабланка", lat: 33.5731, lng: -7.5898, pm25: 26 },

        // Австралия и Океания (5 станций)
        { name: "Сидней", lat: -33.8688, lng: 151.2093, pm25: 14 },
        { name: "Мельбурн", lat: -37.8136, lng: 144.9631, pm25: 12 },
        { name: "Брисбен", lat: -27.4698, lng: 153.0251, pm25: 15 },
        { name: "Перт", lat: -31.9505, lng: 115.8605, pm25: 16 },
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
    
    showNotification('⚠️ Используются демо-данные о качестве воздуха', 'warning');
}

function showDemoFireData() {
    console.log('Showing demo fire data');
    const fireCounterElement = document.getElementById('fireCounter');
    if (fireCounterElement) {
        fireCounterElement.textContent = '1,100';
    }
    
    if (fireLayer) {
        fireLayer.clearLayers();
        
        // Равномерное распределение пожаров по всему миру
        const globalFireRegions = [
            // Северная Америка - 250 пожаров
            { name: "Северная Америка", latMin: 25, latMax: 60, lngMin: -140, lngMax: -60, count: 250 },
            // Южная Америка - 200 пожаров
            { name: "Южная Америка", latMin: -40, latMax: 10, lngMin: -80, lngMax: -40, count: 200 },
            // Европа - 150 пожаров
            { name: "Европа", latMin: 35, latMax: 60, lngMin: -10, lngMax: 40, count: 150 },
            // Азия - 300 пожаров
            { name: "Азия", latMin: 10, latMax: 60, lngMin: 40, lngMax: 140, count: 300 },
            // Африка - 150 пожаров
            { name: "Африка", latMin: -35, latMax: 35, lngMin: -20, lngMax: 50, count: 150 },
            // Австралия - 50 пожаров
            { name: "Австралия", latMin: -40, latMax: -10, lngMin: 110, lngMax: 155, count: 50 }
        ];
        
        globalFireRegions.forEach(region => {
            for (let i = 0; i < region.count; i++) {
                const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
                const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);
                
                // Проверяем, что точка на суше
                if (!isOcean(lat, lng)) {
                    const brightness = 150 + Math.random() * 250;
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
                    
                    marker.bindPopup(`
                        <div style="min-width: 220px">
                            <h3>🔥 Лесной пожар</h3>
                            <p><strong>Страна:</strong> ${country}</p>
                            <p><strong>Регион:</strong> ${region.name}</p>
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
    
    showNotification('⚠️ Используются демо-данные о пожарах', 'warning');
}

// Вспомогательные функции
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
    if (lat >= 55 && lat <= 70 && lng >= -140 && lng <= -60) return "Канада";
    return "Неизвестно";
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#ff9800';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 400px;
        font-size: 14px;
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
    
    // Авто-обновление каждые 10 минут
    setInterval(refreshData, 10 * 60 * 1000);
});

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
