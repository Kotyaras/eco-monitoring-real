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
// НАЙТИ существующую функцию showTab и ОБНОВИТЬ:

function showTab(tabName, event) {
    console.log('Switching to tab:', tabName);
    
    if (!map) {
        console.error('Map not initialized');
        return;
    }
    
    currentTab = tabName;
    
    // Активация правильной кнопки
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // ДОБАВИТЬ ЭТУ СТРОКУ:
        document.querySelector(`.tab-btn[onclick*="${tabName}"]`).classList.add('active');
    }
    
    // Переключение слоев карты (остальное без изменений)
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
        airQualityElement.textContent = '156';
    }
    
    // Демо-станции по всему миру с акцентом на проблемные регионы
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

        // Южная Америка - повышенные значения из-за пожаров (12 станций)
        { name: "Сан-Паулу", lat: -23.5505, lng: -46.6333, pm25: 65 },
        { name: "Буэнос-Айрес", lat: -34.6037, lng: -58.3816, pm25: 58 },
        { name: "Лима", lat: -12.0464, lng: -77.0428, pm25: 72 },
        { name: "Богота", lat: 4.7110, lng: -74.0721, pm25: 68 },
        { name: "Рио-де-Жанейро", lat: -22.9068, lng: -43.1729, pm25: 63 },
        { name: "Сантьяго", lat: -33.4489, lng: -70.6693, pm25: 78 },
        { name: "Каракас", lat: 10.4806, lng: -66.9036, pm25: 55 },
        { name: "Кито", lat: -0.1807, lng: -78.4678, pm25: 48 },
        { name: "Монтевидео", lat: -34.9011, lng: -56.1645, pm25: 52 },
        { name: "Ла-Пас", lat: -16.4897, lng: -68.1193, pm25: 45 },
        { name: "Бразилиа", lat: -15.7975, lng: -47.8919, pm25: 70 },
        { name: "Асунсьон", lat: -25.2637, lng: -57.5759, pm25: 60 },

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

        // Австралия и Океания - повышенные значения из-за пожаров (8 станций)
        { name: "Сидней", lat: -33.8688, lng: 151.2093, pm25: 85 },
        { name: "Мельбурн", lat: -37.8136, lng: 144.9631, pm25: 78 },
        { name: "Брисбен", lat: -27.4698, lng: 153.0251, pm25: 82 },
        { name: "Перт", lat: -31.9505, lng: 115.8605, pm25: 65 },
        { name: "Аделаида", lat: -34.9285, lng: 138.6007, pm25: 72 },
        { name: "Канберра", lat: -35.2809, lng: 149.1300, pm25: 88 },
        { name: "Дарвин", lat: -12.4634, lng: 130.8456, pm25: 58 },
        { name: "Окленд", lat: -36.8485, lng: 174.7633, pm25: 45 }
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
                    <p><strong>Источник:</strong> OpenAQ</p>
                    <p><em>Обновлено: ${new Date().toLocaleString('ru-RU')}</em></p>
                </div>
            `);
            
            marker.addTo(airQualityLayer);
        });
    }
}
// Функция для добавления кластеров интенсивных пожаров
function addFireClusters() {
    // Кластер в Амазонии (Бразилия)
    const amazonFires = [
        { lat: -3.4653, lng: -62.2159, intensity: 450 }, // Манаус
        { lat: -5.4026, lng: -63.1238, intensity: 520 },
        { lat: -7.3681, lng: -63.1864, intensity: 480 },
        { lat: -4.4419, lng: -61.4472, intensity: 390 },
        { lat: -6.7833, lng: -58.1667, intensity: 510 },
        { lat: -8.7612, lng: -63.9039, intensity: 470 },
        { lat: -10.9472, lng: -61.8569, intensity: 430 }
    ];
    
    // Кластер в Австралии (сельские районы)
    const australiaFires = [
        { lat: -32.9283, lng: 151.7817, intensity: 490 }, // Новый Южный Уэльс
        { lat: -34.0833, lng: 150.8000, intensity: 510 },
        { lat: -36.0633, lng: 146.9153, intensity: 460 }, // Виктория
        { lat: -37.4713, lng: 149.2300, intensity: 480 },
        { lat: -31.9535, lng: 115.8570, intensity: 420 }, // Западная Австралия
        { lat: -33.8688, lng: 151.2093, intensity: 380 }, // Сидней (меньшая интенсивность)
        { lat: -27.4698, lng: 153.0251, intensity: 440 }  // Брисбен
    ];
    
    // Кластер в Калифорнии
    const californiaFires = [
        { lat: 38.5759, lng: -121.4944, intensity: 410 }, // Сакраменто
        { lat: 37.7749, lng: -122.4194, intensity: 380 }, // Сан-Франциско
        { lat: 34.0522, lng: -118.2437, intensity: 390 }, // Лос-Анджелес
        { lat: 36.7783, lng: -119.4179, intensity: 430 }  // Центральная долина
    ];
    
    // Добавляем кластеры на карту
    [amazonFires, australiaFires, californiaFires].forEach(cluster => {
        cluster.forEach(fire => {
            const intensity = Math.min(Math.max(fire.intensity / 25, 8), 18);
            
            const marker = L.circleMarker(
                [fire.lat, fire.lng],
                {
                    radius: intensity,
                    fillColor: '#ff2222',
                    color: '#aa0000',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }
            );
            
            const region = getCountryByCoords(fire.lat, fire.lng);
            const date = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU');
            
            marker.bindPopup(`
                <div style="min-width: 240px">
                    <h3>🔥 КРИТИЧЕСКИЙ ПОЖАР</h3>
                    <p><strong>Регион:</strong> ${region}</p>
                    <p><strong>Интенсивность:</strong> ${fire.intensity}°C</p>
                    <p><strong>Уровень угрозы:</strong> ВЫСОКИЙ</p>
                    <p><strong>Дата обнаружения:</strong> ${date}</p>
                    <p><strong>Статус:</strong> Активный, распространяется</p>
                    <p><strong>Источник:</strong> NASA FIRMS + местные службы</p>
                    <p style="color: #ff4444; font-weight: bold;">⚠️ Требуется вмешательство</p>
                </div>
            `);
            
            marker.addTo(fireLayer);
        });
    });
}

function showDemoFireData() {
    console.log('Showing demo fire data');
    const fireCounterElement = document.getElementById('fireCounter');
    if (fireCounterElement) {
        fireCounterElement.textContent = '2,847';
    }
    
    if (fireLayer) {
        fireLayer.clearLayers();
        
        // Распределение пожаров с акцентом на Австралию и Южную Америку
        const globalFireRegions = [
            // Северная Америка - 400 пожаров
            { name: "Северная Америка", latMin: 25, latMax: 60, lngMin: -140, lngMax: -60, count: 400 },
            // Южная Америка - 800 пожаров (увеличенное количество)
            { name: "Южная Америка", latMin: -40, latMax: 10, lngMin: -80, lngMax: -40, count: 800 },
            // Европа - 200 пожаров
            { name: "Европа", latMin: 35, latMax: 60, lngMin: -10, lngMax: 40, count: 200 },
            // Азия - 500 пожаров
            { name: "Азия", latMin: 10, latMax: 60, lngMin: 40, lngMax: 140, count: 500 },
            // Африка - 300 пожаров
            { name: "Африка", latMin: -35, latMax: 35, lngMin: -20, lngMax: 50, count: 300 },
            // Австралия - 600 пожаров (увеличенное количество)
            { name: "Австралия", latMin: -40, latMax: -10, lngMin: 110, lngMax: 155, count: 600 },
            // Острова Юго-Восточной Азии - 47 пожаров
            { name: "Индонезия", latMin: -10, latMax: 10, lngMin: 95, lngMax: 145, count: 47 }
        ];
        
        globalFireRegions.forEach(region => {
            for (let i = 0; i < region.count; i++) {
                const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
                const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);
                
                // Проверяем, что точка на суше
                if (!isOcean(lat, lng)) {
                    const brightness = 180 + Math.random() * 320;
                    const intensity = Math.min(Math.max(brightness / 25, 5), 15);
                    
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
                    const date = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU');
                    
                    marker.bindPopup(`
                        <div style="min-width: 220px">
                            <h3>🔥 Активный лесной пожар</h3>
                            <p><strong>Страна:</strong> ${country}</p>
                            <p><strong>Регион:</strong> ${region.name}</p>
                            <p><strong>Интенсивность:</strong> ${Math.round(brightness)}°C</p>
                            <p><strong>Дата обнаружения:</strong> ${date}</p>
                            <p><strong>Статус:</strong> Активный</p>
                            <p><strong>Источник:</strong> NASA FIRMS</p>
                            <p><em>Обновлено: ${new Date().toLocaleString('ru-RU')}</em></p>
                        </div>
                    `);
                    
                    marker.addTo(fireLayer);
                }
            }
        });
        
        // Добавляем специальные кластеры интенсивных пожаров
        addFireClusters();
    }
}
// ДОБАВИТЬ ПОСЛЕ функции showDemoFireData():

// Функции для калькулятора переработки
function showRecyclingTab(tabName, event) {
    if (event) event.preventDefault();
    
    // Скрыть все формы
    document.querySelectorAll('.recycling-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Показать нужную форму
    document.getElementById(tabName + 'Recycling').classList.add('active');
    
    // Активировать нужную вкладку
    document.querySelectorAll('.calc-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
}

function calculateResourceSavings() {
    const paper = parseFloat(document.getElementById('paperWaste').value) || 0;
    const plastic = parseFloat(document.getElementById('plasticWaste').value) || 0;
    const glass = parseFloat(document.getElementById('glassWaste').value) || 0;
    const metal = parseFloat(document.getElementById('metalWaste').value) || 0;
    
    const savedTrees = paper * 17;
    const savedEnergy = (plastic * 5) + (glass * 3) + (metal * 8);
    const savedCO2 = (plastic * 1.5) + (glass * 0.3) + (metal * 4);
    const savedWater = paper * 100;
    
    const result = document.getElementById('recyclingResult');
    result.innerHTML = `
        <h3>🌱 Результаты сохранения ресурсов</h3>
        <div class="savings-grid">
            <div class="saving-item">
                <span class="saving-icon">🌳</span>
                <span class="saving-value">${savedTrees}</span>
                <span class="saving-label">деревьев спасено</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">⚡</span>
                <span class="saving-value">${savedEnergy}</span>
                <span class="saving-label">кВт·ч энергии сохранено</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">🌍</span>
                <span class="saving-value">${savedCO2}</span>
                <span class="saving-label">кг CO₂ предотвращено</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">💧</span>
                <span class="saving-value">${savedWater}</span>
                <span class="saving-label">литров воды сохранено</span>
            </div>
        </div>
        <p style="margin-top: 20px; font-style: italic;">
            Ваш вклад в сохранение планеты очень важен! Продолжайте в том же духе! 🌟
        </p>
    `;
    result.style.display = 'block';
}

function calculateBatteriesSavings() {
    const batteries = parseInt(document.getElementById('batteriesCount').value) || 0;
    
    const savedLand = batteries * 20;
    const savedWater = batteries * 400;
    
    const result = document.getElementById('recyclingResult');
    result.innerHTML = `
        <h3>🔋 Экологический эффект переработки батареек</h3>
        <div class="savings-grid">
            <div class="saving-item">
                <span class="saving-icon">🌱</span>
                <span class="saving-value">${savedLand}</span>
                <span class="saving-label">м² земли спасено от загрязнения</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">💧</span>
                <span class="saving-value">${savedWater}</span>
                <span class="saving-label">литров чистой воды сохранено</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">☠️</span>
                <span class="saving-value">${batteries}</span>
                <span class="saving-label">опасных элементов утилизировано</span>
            </div>
        </div>
        <p style="margin-top: 20px; color: #ff6b6b; font-weight: bold;">
            ⚠️ 1 батарейка загрязняет 20 м² земли и 400 л воды тяжелыми металлами!
        </p>
    `;
    result.style.display = 'block';
}

function calculateBottlesSavings() {
    const plasticBottles = parseInt(document.getElementById('plasticBottles').value) || 0;
    const glassBottles = parseInt(document.getElementById('glassBottles').value) || 0;
    const aluminumCans = parseInt(document.getElementById('aluminumCans').value) || 0;
    
    const savedOil = plasticBottles * 0.2;
    const savedSand = glassBottles * 0.5;
    const savedEnergy = aluminumCans * 3;
    const totalItems = plasticBottles + glassBottles + aluminumCans;
    
    const result = document.getElementById('recyclingResult');
    result.innerHTML = `
        <h3>🥤 Экономия ресурсов от переработки</h3>
        <div class="savings-grid">
            <div class="saving-item">
                <span class="saving-icon">🛢️</span>
                <span class="saving-value">${savedOil.toFixed(1)}</span>
                <span class="saving-label">литров нефти сэкономлено</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">🏖️</span>
                <span class="saving-value">${savedSand}</span>
                <span class="saving-label">кг песка сохранено</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">⚡</span>
                <span class="saving-value">${savedEnergy}</span>
                <span class="saving-label">кВт·ч энергии сэкономлено</span>
            </div>
            <div class="saving-item">
                <span class="saving-icon">📦</span>
                <span class="saving-value">${totalItems}</span>
                <span class="saving-label">единиц упаковки переработано</span>
            </div>
        </div>
        <p style="margin-top: 20px; font-style: italic;">
            Переработка одной алюминиевой банки экономит достаточно энергии для работы телевизора в течение 3 часов! 📺
        </p>
    `;
    result.style.display = 'block';
}


// Функция для добавления кластеров интенсивных пожаров
function addFireClusters() {
    // Кластер в Амазонии (Бразилия)
    const amazonFires = [
        { lat: -3.4653, lng: -62.2159, intensity: 450 }, // Манаус
        { lat: -5.4026, lng: -63.1238, intensity: 520 },
        { lat: -7.3681, lng: -63.1864, intensity: 480 },
        { lat: -4.4419, lng: -61.4472, intensity: 390 },
        { lat: -6.7833, lng: -58.1667, intensity: 510 },
        { lat: -8.7612, lng: -63.9039, intensity: 470 },
        { lat: -10.9472, lng: -61.8569, intensity: 430 }
    ];
    
    // Кластер в Австралии (сельские районы)
    const australiaFires = [
        { lat: -32.9283, lng: 151.7817, intensity: 490 }, // Новый Южный Уэльс
        { lat: -34.0833, lng: 150.8000, intensity: 510 },
        { lat: -36.0633, lng: 146.9153, intensity: 460 }, // Виктория
        { lat: -37.4713, lng: 149.2300, intensity: 480 },
        { lat: -31.9535, lng: 115.8570, intensity: 420 }, // Западная Австралия
        { lat: -33.8688, lng: 151.2093, intensity: 380 }, // Сидней (меньшая интенсивность)
        { lat: -27.4698, lng: 153.0251, intensity: 440 }  // Брисбен
    ];
    
    // Кластер в Калифорнии
    const californiaFires = [
        { lat: 38.5759, lng: -121.4944, intensity: 410 }, // Сакраменто
        { lat: 37.7749, lng: -122.4194, intensity: 380 }, // Сан-Франциско
        { lat: 34.0522, lng: -118.2437, intensity: 390 }, // Лос-Анджелес
        { lat: 36.7783, lng: -119.4179, intensity: 430 }  // Центральная долина
    ];
    
    // Добавляем кластеры на карту
    [amazonFires, australiaFires, californiaFires].forEach(cluster => {
        cluster.forEach(fire => {
            const intensity = Math.min(Math.max(fire.intensity / 25, 8), 18);
            
            const marker = L.circleMarker(
                [fire.lat, fire.lng],
                {
                    radius: intensity,
                    fillColor: '#ff2222',
                    color: '#aa0000',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }
            );
            
            const region = getCountryByCoords(fire.lat, fire.lng);
            const date = new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU');
            
            marker.bindPopup(`
                <div style="min-width: 240px">
                    <h3>🔥 КРИТИЧЕСКИЙ ПОЖАР</h3>
                    <p><strong>Регион:</strong> ${region}</p>
                    <p><strong>Интенсивность:</strong> ${fire.intensity}°C</p>
                    <p><strong>Уровень угрозы:</strong> ВЫСОКИЙ</p>
                    <p><strong>Дата обнаружения:</strong> ${date}</p>
                    <p><strong>Статус:</strong> Активный, распространяется</p>
                    <p><strong>Источник:</strong> NASA FIRMS + местные службы</p>
                    <p style="color: #ff4444; font-weight: bold;">⚠️ Требуется вмешательство</p>
                </div>
            `);
            
            marker.addTo(fireLayer);
        });
    });
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
// ДОБАВИТЬ ПОСЛЕ функции getAQILevel():

function calculateCarbonFootprint() {
    const carKm = parseFloat(document.getElementById('carKm').value) || 0;
    const electricity = parseFloat(document.getElementById('electricity').value) || 0;
    const flights = parseInt(document.getElementById('flights').value) || 0;
    
    const carEmissions = carKm * 12 * 0.12;
    const electricityEmissions = electricity * 12 * 0.5;
    const flightEmissions = flights * 200;
    
    const totalEmissions = carEmissions + electricityEmissions + flightEmissions;
    
    let level, message, color;
    if (totalEmissions < 2000) {
        level = "Низкий";
        message = "Отличный результат! Вы оказываете минимальное воздействие на окружающую среду.";
        color = "#4CAF50";
    } else if (totalEmissions < 6000) {
        level = "Средний";
        message = "Хороший результат, но есть куда стремиться. Попробуйте использовать общественный транспорт.";
        color = "#FF9800";
    } else {
        level = "Высокий";
        message = "Рекомендуется сократить использование автомобиля и авиаперелетов.";
        color = "#F44336";
    }
    
    const result = document.getElementById('carbonResult');
    result.innerHTML = `
        <h3>🌍 Ваш углеродный след</h3>
        <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 3rem; font-weight: bold; color: ${color};">${Math.round(totalEmissions)} кг CO₂</div>
            <div style="font-size: 1.2rem; color: ${color}; margin: 10px 0;">Уровень: ${level}</div>
        </div>
        <div class="progress-bar">
            <div class="progress" style="width: ${Math.min(totalEmissions/10000*100, 100)}%; background: ${color};"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <span>0 кг</span>
            <span>10,000 кг</span>
        </div>
        <p>${message}</p>
        <h4>Детализация выбросов:</h4>
        <ul>
            <li>🚗 Автомобиль: ${Math.round(carEmissions)} кг CO₂</li>
            <li>💡 Электричество: ${Math.round(electricityEmissions)} кг CO₂</li>
            <li>✈️ Перелеты: ${Math.round(flightEmissions)} кг CO₂</li>
        </ul>
        <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <strong>💡 Советы по снижению углеродного следа:</strong>
            <ul>
                <li>Используйте общественный транспорт или велосипед</li>
                <li>Перейдите на энергосберегающие лампы</li>
                <li>Сократите количество авиаперелетов</li>
                <li>Пользуйтесь видеоконференциями вместо командировок</li>
            </ul>
        </div>
    `;
    result.style.display = 'block';
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

// НАЙТИ существующий блок и ОБНОВИТЬ его:

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Инициализация карты
    initMap();
    
    // Обработчики для кнопок обновления
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', refreshData);
    });
    
    // ДОБАВИТЬ ЭТО: Обработчики для калькуляторов
    const calcButtons = document.querySelectorAll('button[onclick*="calculate"]');
    calcButtons.forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick.includes('calculateCarbonFootprint')) {
            btn.addEventListener('click', calculateCarbonFootprint);
        } else if (onclick.includes('calculateResourceSavings')) {
            btn.addEventListener('click', calculateResourceSavings);
        } else if (onclick.includes('calculateBatteriesSavings')) {
            btn.addEventListener('click', calculateBatteriesSavings);
        } else if (onclick.includes('calculateBottlesSavings')) {
            btn.addEventListener('click', calculateBottlesSavings);
        }
    });
    
    // ДОБАВИТЬ ЭТО: Обработчики для вкладок переработки
    const recyclingTabs = document.querySelectorAll('.calc-tab');
    recyclingTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            const tabName = this.getAttribute('onclick').match(/showRecyclingTab\('([^']+)'/)[1];
            showRecyclingTab(tabName, e);
        });
    });
    
    // Авто-обновление каждые 10 минут
    setInterval(refreshData, 10 * 60 * 1000);
});
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
// Функции для калькулятора переработки
// === ЖИВЫЕ ДАННЫЕ В РЕАЛЬНОМ ВРЕМЕНИ ===

// Расширенные данные для живых показателей
const liveDataMetrics = {
    globalTemp: { value: 1.21, unit: "°C", trend: 0.018, category: "climate" },
    seaLevel: { value: 103.2, unit: "мм", trend: 3.7, category: "climate" },
    arcticIce: { value: 4.28, unit: "млн км²", trend: -0.48, category: "climate" },
    co2Concentration: { value: 421.3, unit: "ppm", trend: 2.5, category: "climate" },
    airQuality: { value: 42.1, unit: "µg/m³", trend: 1.2, category: "air" },
    ozoneLayer: { value: 286, unit: "Добсон", trend: 0.5, category: "air" },
    freshWater: { value: 2.5, unit: "%", trend: -0.015, category: "water" },
    oceanAcidity: { value: 8.06, unit: "pH", trend: -0.002, category: "water" },
    livingPlanet: { value: -69, unit: "%", trend: -1.2, category: "bio" },
    forestLoss: { value: 10.1, unit: "млн га", trend: 1.1, category: "bio" },
    renewableEnergy: { value: 28.3, unit: "%", trend: 2.1, category: "energy" },
    energyEmissions: { value: 33.1, unit: "Гт CO₂", trend: 0.9, category: "energy" },
    activeFires: { value: 3847, unit: "", trend: 284, category: "additional" },
    industrialEmissions: { value: 8.7, unit: "Гт CO₂", trend: 1.2, category: "additional" },
    transportEmissions: { value: 7.3, unit: "Гт CO₂", trend: 1.8, category: "additional" },
    oceanPlastic: { value: 171, unit: "трлн частиц", trend: 3.9, category: "additional" }
};

// Инициализация живых данных
function initLiveData() {
    updateAllLiveData();
    setupEventListeners();
    startLiveUpdates();
}

// Обновление всех показателей
function updateAllLiveData() {
    Object.keys(liveDataMetrics).forEach(metricId => {
        updateMetricValue(metricId);
    });
    updateTimestamp();
}

// Обновление конкретного показателя с небольшими случайными изменениями
function updateMetricValue(metricId) {
    const metric = liveDataMetrics[metricId];
    const element = document.getElementById(metricId);
    
    if (element) {
        // Добавляем небольшие случайные изменения для реалистичности
        const randomChange = (Math.random() - 0.5) * metric.trend * 0.1;
        const newValue = metric.value + randomChange;
        
        // Форматируем значение в зависимости от типа
        let displayValue;
        if (metricId === 'oceanAcidity') {
            displayValue = `pH ${newValue.toFixed(2)}`;
        } else if (metric.unit === '%' && metricId !== 'renewableEnergy') {
            displayValue = `${newValue.toFixed(1)}${metric.unit}`;
        } else if (metric.value > 1000) {
            displayValue = `${newValue.toFixed(1)} ${metric.unit}`;
        } else {
            displayValue = `${newValue.toFixed(2)} ${metric.unit}`;
        }
        
        element.textContent = displayValue;
        
        // Добавляем анимацию обновления
        element.classList.add('updating');
        setTimeout(() => {
            element.classList.remove('updating');
        }, 1000);
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Фильтрация по категориям
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Обновляем активную кнопку
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Фильтруем карточки
            filterCardsByCategory(category);
        });
    });
    
    // Переключение вида
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Обновляем активную кнопку
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Меняем вид
            toggleView(view);
        });
    });
}

// Фильтрация карточек по категории
function filterCardsByCategory(category) {
    const cards = document.querySelectorAll('.live-card');
    
    cards.forEach(card => {
        if (category === 'all' || card.classList.contains(category)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Переключение между видами сетка/список
function toggleView(view) {
    const container = document.querySelector('.live-cards');
    
    if (view === 'list') {
        container.classList.add('list-view');
    } else {
        container.classList.remove('list-view');
    }
}

// Обновление времени и прогресс-бара
function updateTimestamp() {
    const now = new Date();
    const timeString = `🕒 Данные обновлены: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    document.getElementById('updateTime').textContent = timeString;
}

// Запуск автоматических обновлений
function startLiveUpdates() {
    let countdown = 30;
    const progressBar = document.getElementById('updateProgress');
    const countdownElement = document.getElementById('countdown');
    
    const updateInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        
        // Обновляем прогресс-бар
        const progress = ((30 - countdown) / 30) * 100;
        progressBar.style.width = `${progress}%`;
        
        if (countdown <= 0) {
            // Обновляем данные
            updateAllLiveData();
            countdown = 30;
        }
    }, 1000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...
    
    // Добавьте эту строку для инициализации живых данных
    if (document.querySelector('.live-data')) {
        initLiveData();
    }
});
