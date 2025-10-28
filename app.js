let map;
let airQualityLayer;
let fireLayer;

function initMap() {
    map = L.map('map').setView([55.7558, 37.6173], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    airQualityLayer = L.layerGroup().addTo(map);
    fireLayer = L.layerGroup().addTo(map);
    
    loadAirQualityData();
    loadFireData();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (tabName === 'air') {
        map.removeLayer(fireLayer);
        map.addLayer(airQualityLayer);
    } else {
        map.removeLayer(airQualityLayer);
        map.addLayer(fireLayer);
    }
}

async function loadAirQualityData() {
    try {
        document.getElementById('airQuality').textContent = 'Загрузка...';
        
        const response = await fetch('/.netlify/functions/air-quality');
        const data = await response.json();
        
        airQualityLayer.clearLayers();
        
        const stations = data.data || data.demoData;
        
        stations.forEach(station => {
            if (station.coordinates && station.measurements) {
                const pm25 = station.measurements.find(m => m.parameter === 'pm25');
                if (pm25) {
                    const color = getAQIColor(pm25.value);
                    
                    const marker = L.circleMarker(
                        [station.coordinates.latitude, station.coordinates.longitude],
                        {
                            radius: 8,
                            fillColor: color,
                            color: '#000',
                            fillOpacity: 0.8
                        }
                    );
                    
                    marker.bindPopup(`
                        <h3>${station.location || station.city}</h3>
                        <p>PM2.5: ${pm25.value} μg/m³</p>
                        <p>Качество: ${getAQILevel(pm25.value)}</p>
                    `);
                    
                    marker.addTo(airQualityLayer);
                }
            }
        });
        
        document.getElementById('airQuality').textContent = stations.length;
        
    } catch (error) {
        document.getElementById('airQuality').textContent = 'Ошибка';
    }
}

async function loadFireData() {
    try {
        document.getElementById('fireCounter').textContent = 'Загрузка...';
        
        const response = await fetch('/.netlify/functions/forest-fires');
        const data = await response.json();
        
        fireLayer.clearLayers();
        
        const fires = data.fires || data.demoData;
        
        fires.forEach(fire => {
            const intensity = Math.min(fire.brightness / 50, 10);
            
            const marker = L.circleMarker(
                [fire.latitude, fire.longitude],
                {
                    radius: intensity,
                    fillColor: '#ff4444',
                    color: '#cc0000',
                    fillOpacity: 0.6
                }
            );
            
            marker.bindPopup(`
                <h3>Лесной пожар</h3>
                <p>Интенсивность: ${fire.brightness}</p>
            `);
            
            marker.addTo(fireLayer);
        });
        
        document.getElementById('fireCounter').textContent = fires.length;
        
    } catch (error) {
        document.getElementById('fireCounter').textContent = 'Ошибка';
    }
}

function getAQIColor(pm25) {
    if (pm25 <= 12) return '#00e400';
    if (pm25 <= 35) return '#ffff00';
    if (pm25 <= 55) return '#ff7e00';
    return '#ff0000';
}

function getAQILevel(pm25) {
    if (pm25 <= 12) return 'Хорошо';
    if (pm25 <= 35) return 'Умеренно';
    if (pm25 <= 55) return 'Нездорово';
    return 'Опасно';
}

document.addEventListener('DOMContentLoaded', initMap);
