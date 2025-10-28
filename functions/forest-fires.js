const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Forest fires function called');
  
  try {
    // Упрощенный запрос к NASA API
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Пробуем разные источники NASA
    const urls = [
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_NRT/world/1/${dateStr}`,
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1/${dateStr}`,
      `https://firms.modaps.eosdis.nasa.gov/api/country/csv/VIIRS_SNPP_NRT/GRC/1/${dateStr}`
    ];
    
    let fires = [];
    
    // Пробуем каждый URL пока не получим данные
    for (const url of urls) {
      try {
        console.log('Trying URL:', url);
        const response = await fetch(url);
        
        if (response.ok) {
          const csvData = await response.text();
          console.log('Got CSV data, length:', csvData.length);
          
          if (csvData && csvData.length > 100) {
            fires = parseSimpleCSV(csvData);
            console.log('Parsed fires:', fires.length);
            break;
          }
        }
      } catch (err) {
        console.log('URL failed:', url, err.message);
        continue;
      }
    }
    
    // Если получили реальные данные
    if (fires.length > 0) {
      console.log('Returning real fire data:', fires.length);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fires: fires.slice(0, 30),
          total: fires.length,
          timestamp: Date.now(),
          source: 'NASA FIRMS API'
        })
      };
    }
    
    // Если не получили реальные данные - бросаем ошибку чтобы перейти к демо-данным
    throw new Error('No real fire data available');
    
  } catch (error) {
    console.error('All NASA APIs failed, using demo data:', error);
    
    // ВСЕГДА возвращаем демо-данные
    const demoData = [
      { latitude: 56.5, longitude: 84.0, brightness: 320, date: new Date().toISOString(), region: "Сибирь" },
      { latitude: 55.2, longitude: 89.8, brightness: 280, date: new Date().toISOString(), region: "Сибирь" },
      { latitude: 54.8, longitude: 73.4, brightness: 180, date: new Date().toISOString(), region: "Сибирь" },
      { latitude: 57.3, longitude: 94.5, brightness: 220, date: new Date().toISOString(), region: "Сибирь" },
      { latitude: 52.3, longitude: 104.3, brightness: 250, date: new Date().toISOString(), region: "Дальний Восток" },
      { latitude: 53.0, longitude: 158.6, brightness: 190, date: new Date().toISOString(), region: "Дальний Восток" },
      { latitude: 58.0, longitude: 56.3, brightness: 150, date: new Date().toISOString(), region: "Урал" },
      { latitude: 59.2, longitude: 54.8, brightness: 130, date: new Date().toISOString(), region: "Урал" },
      { latitude: 55.8, longitude: 37.6, brightness: 90, date: new Date().toISOString(), region: "Центральная Россия" },
      { latitude: 61.7, longitude: 30.7, brightness: 95, date: new Date().toISOString(), region: "Северо-Запад" },
      { latitude: 45.0, longitude: 41.9, brightness: 140, date: new Date().toISOString(), region: "Юг России" },
      { latitude: 53.2, longitude: 50.1, brightness: 125, date: new Date().toISOString(), region: "Поволжье" }
    ];
    
    console.log('Returning DEMO fire data:', demoData.length, 'fires');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        fires: demoData,
        demo: true,
        total: demoData.length,
        timestamp: Date.now(),
        source: 'Demo Data'
      })
    };
  }
};

// Очень простой парсинг CSV
function parseSimpleCSV(csv) {
  const fires = [];
  const lines = csv.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('latitude')) continue;
    
    const cells = line.split(',');
    if (cells.length >= 3) {
      const lat = parseFloat(cells[0]);
      const lng = parseFloat(cells[1]);
      const brightness = parseFloat(cells[2]);
      
      // Проверяем что это валидные координаты
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(brightness)) {
        // Фильтруем по территории России и соседних регионов
        if (lat >= 30 && lat <= 80 && lng >= 10 && lng <= 180) {
          fires.push({
            latitude: lat,
            longitude: lng,
            brightness: brightness,
            date: cells[5] || new Date().toISOString(),
            region: getRegion(lat, lng)
          });
        }
      }
    }
  }
  
  return fires;
}

function getRegion(lat, lng) {
  if (lat >= 55 && lng >= 37 && lng <= 60) return "Центральная Россия";
  if (lat >= 50 && lng >= 40 && lng <= 140) return "Сибирь";
  if (lat >= 43 && lng >= 130) return "Дальний Восток";
  if (lat >= 56 && lng >= 46 && lng <= 68) return "Урал";
  if (lat >= 59 && lng >= 28 && lng <= 45) return "Северо-Запад";
  if (lat >= 44 && lng >= 37 && lng <= 50) return "Юг России";
  return "Россия";
}
