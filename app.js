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
        
        // ПРЯМОЙ ЗАПРОС К OPENAQ API
        const response = await fetch('https://api.openaq.org/v2/latest?limit=100&parameter=pm25');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Real air quality data received:', data);
        
        if (!airQualityLayer) return;
        
        airQualityLayer.clearLayers();
        
        const stations = data.results || [];
        let validStationsCount = 0;
        
        stations.forEach(station => {
            try {
                if (station.coordinates && 
                    station.measurements && 
                    station.measurements.length > 0) {
                    
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
                        
                        const cityName = station.city || station.location || 'Неизвестно';
                        const country = station.country || '';
                        
                        marker.bindPopup(`
                            <div style="min-width: 220px">
                                <h3>${cityName}</h3>
                                ${country ? `<p><strong>Страна:</strong> ${country}</p>` : ''}
                                <p><strong>PM2.5:</strong> ${pm25.value.toFixed(1)} μg/m³</p>
                                <p><strong>Качество:</strong> ${getAQILevel(pm25.value)}</p>
                                <p><strong>Источник:</strong> OpenAQ API</p>
                                <p><strong>Последнее обновление:</strong> ${new Date(station.lastUpdated).toLocaleString('ru-RU')}</p>
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
        console.log('Real air quality stations loaded:', validStationsCount);
        
        // Показываем уведомление об успешной загрузке реальных данных
        showNotification('✅ Загружены реальные данные о качестве воздуха', 'success');
        
    } catch (error) {
        console.error('Error loading real air quality data:', error);
        const airQualityElement = document.getElementById('airQuality');
        if (airQualityElement) {
            airQualityElement.textContent = 'Ошибка API';
        }
        showNotification('⚠️ Не удалось загрузить данные о качестве воздуха', 'error');
    }
}

async function loadFireData() {
    try {
        console.log('Loading fire data...');
        const fireCounterElement = document.getElementById('fireCounter');
        if (fireCounterElement) {
            fireCounterElement.textContent = 'Загрузка...';
        }
        
        // ПРЯМОЙ ЗАПРОС К NASA FIRMS API
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const nasaUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1/${dateStr}`;
        
        console.log('Fetching from NASA FIRMS:', nasaUrl);
        const response = await fetch(nasaUrl);
        
        if (!response.ok) {
            throw new Error(`NASA API error! status: ${response.status}`);
        }
        
        const csvData = await response.text();
        console.log('Raw NASA fire data received, length:', csvData.length);
        
        if (!fireLayer) return;
        
        fireLayer.clearLayers();
        
        const fires = parseNASACSV(csvData);
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
                    
                    const country = getCountryByCoords(fire.latitude, fire.longitude);
                    const region = getRegionByCoords(fire.latitude, fire.longitude);
                    
                    marker.bindPopup(`
                        <div style="min-width: 220px">
                            <h3>🔥 Активный пожар</h3>
                            <p><strong>Страна:</strong> ${country}</p>
                            <p><strong>Регион:</strong> ${region}</p>
                            <p><strong>Температура:</strong> ${Math.round(fire.brightness)}°K</p>
                            <p><strong>Дата обнаружения:</strong> ${fire.date}</p>
                            <p><strong>Уверенность:</strong> ${fire.confidence || 'Высокая'}</p>
                            <p><strong>Источник:</strong> NASA FIRMS</p>
                            <p style="color: green; font-weight: bold;">✅ Реальные спутниковые данные</p>
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
        console.log('Real fire data loaded:', validFiresCount);
        
        // Показываем уведомление об успешной загрузке реальных данных
        showNotification('✅ Загружены реальные данные о пожарах с NASA спутников', 'success');
        
    } catch (error) {
        console.error('Error loading real fire data:', error);
        const fireCounterElement = document.getElementById('fireCounter');
        if (fireCounterElement) {
            fireCounterElement.textContent = 'Ошибка NASA';
        }
        showNotification('⚠️ Не удалось загрузить данные NASA о пожарах', 'error');
    }
}

// Парсинг CSV данных от NASA
function parseNASACSV(csv) {
    const fires = [];
    const lines = csv.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('latitude')) continue;
        
        const cells = line.split(',');
        if (cells.length >= 10) {
            const lat = parseFloat(cells[0]);
            const lng = parseFloat(cells[1]);
            const brightness = parseFloat(cells[2]);
            const confidence = cells[8];
            const date = cells[5];
            
            if (!isNaN(lat) && !isNaN(lng) && !isNaN(brightness)) {
                fires.push({
                    latitude: lat,
                    longitude: lng,
                    brightness: brightness,
                    confidence: confidence,
                    date: date,
                    region: getRegionByCoords(lat, lng),
                    country: getCountryByCoords(lat, lng)
                });
            }
        }
    }
    
    return fires;
}

// Вспомогательные функции
function getCountryByCoords(lat, lng) {
    // Упрощенное определение страны по координатам
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

function getRegionByCoords(lat, lng) {
    if (lat >= 15 && lat <= 75 && lng >= -170 && lng <= -50) return "Северная Америка";
    if (lat >= -55 && lat <= 15 && lng >= -85 && lng <= -30) return "Южная Америка";
    if (lat >= 35 && lat <= 70 && lng >= -25 && lng <= 50) return "Европа";
    if (lat >= 10 && lat <= 75 && lng >= 50 && lng <= 180) return "Азия";
    if (lat >= -35 && lat <= 37 && lng >= -25 && lng <= 55) return "Африка";
    if (lat >= -50 && lat <= 0 && lng >= 110 && lng <= 180) return "Австралия и Океания";
    return "Другие регионы";
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
    
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
    console.log('Refreshing real data...');
    loadAirQualityData();
    loadFireData();
}

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        refreshData();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app with REAL data...');
    
    const refreshButtons = document.querySelectorAll('.refresh-btn');
    refreshButtons.forEach(btn => {
        btn.addEventListener('click', refreshData);
    });
    
    initMap();
    
    // Авто-обновление каждые 30 минут для реальных данных
    setInterval(refreshData, 30 * 60 * 1000);
});

window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
});
