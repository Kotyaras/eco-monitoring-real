const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Forest fires function called');
  
  try {
    // NASA FIRMS API - упрощенная версия
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_NRT/world/1/${dateStr}`;
    
    console.log('Fetching from NASA API:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }
    
    const csvData = await response.text();
    console.log('NASA CSV data received, length:', csvData.length);
    
    // Простой парсинг CSV
    const fires = [];
    const lines = csvData.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells = line.split(',');
      if (cells.length >= 3) {
        const lat = parseFloat(cells[0]);
        const lng = parseFloat(cells[1]);
        const brightness = parseFloat(cells[2]);
        
        // Фильтруем по России
        if (lat >= 41 && lat <= 82 && lng >= 19 && lng <= 180) {
          fires.push({
            latitude: lat,
            longitude: lng,
            brightness: brightness,
            date: cells[5] || new Date().toISOString()
          });
        }
      }
    }
    
    console.log('Fires filtered for Russia:', fires.length);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fires: fires.slice(0, 50), // Ограничиваем количество
        total: fires.length,
        timestamp: Date.now(),
        source: 'NASA FIRMS API'
      })
    };
  } catch (error) {
    console.error('Error fetching fire data:', error);
    
    // Всегда возвращаем демо-данные
    const demoData = [
      { latitude: 56.5, longitude: 84.0, brightness: 320, date: new Date().toISOString() },
      { latitude: 55.2, longitude: 89.8, brightness: 280, date: new Date().toISOString() },
      { latitude: 54.8, longitude: 73.4, brightness: 180, date: new Date().toISOString() },
      { latitude: 52.3, longitude: 104.3, brightness: 250, date: new Date().toISOString() },
      { latitude: 58.0, longitude: 56.3, brightness: 150, date: new Date().toISOString() },
      { latitude: 55.8, longitude: 37.6, brightness: 90, date: new Date().toISOString() }
    ];
    
    console.log('Returning demo fire data:', demoData.length, 'fires');
    
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
