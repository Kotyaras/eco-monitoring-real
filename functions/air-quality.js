const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Air quality function called');
  
  try {
    // Пробуем получить реальные данные
    console.log('Fetching from OpenAQ API...');
    const response = await fetch('https://api.openaq.org/v2/latest?limit=50&country=RU');
    
    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('OpenAQ data received:', data.results ? data.results.length : 0, 'stations');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: data.results || [],
        timestamp: Date.now(),
        source: 'OpenAQ API'
      })
    };
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    
    // Всегда возвращаем демо-данные
    const demoData = [
      {
        location: "Москва, центр",
        city: "Moscow",
        coordinates: { latitude: 55.7558, longitude: 37.6173 },
        measurements: [
          { parameter: "pm25", value: 18, unit: "µg/m³" }
        ]
      },
      {
        location: "Санкт-Петербург",
        city: "Saint Petersburg", 
        coordinates: { latitude: 59.9343, longitude: 30.3351 },
        measurements: [
          { parameter: "pm25", value: 12, unit: "µg/m³" }
        ]
      },
      {
        location: "Новосибирск",
        city: "Novosibirsk",
        coordinates: { latitude: 55.0084, longitude: 82.9357 },
        measurements: [
          { parameter: "pm25", value: 24, unit: "µg/m³" }
        ]
      },
      {
        location: "Екатеринбург",
        city: "Yekaterinburg",
        coordinates: { latitude: 56.8389, longitude: 60.6057 },
        measurements: [
          { parameter: "pm25", value: 15, unit: "µg/m³" }
        ]
      }
    ];
    
    console.log('Returning demo data:', demoData.length, 'stations');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        data: demoData,
        demo: true,
        timestamp: Date.now(),
        source: 'Demo Data'
      })
    };
  }
};
