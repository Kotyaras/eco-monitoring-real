const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const response = await fetch('https://api.openaq.org/v2/latest?limit=50&country=RU');
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: data.results,
        timestamp: Date.now()
      })
    };
  } catch (error) {
    const demoData = [
      {
        location: "Москва",
        coordinates: { latitude: 55.7558, longitude: 37.6173 },
        measurements: [
          { parameter: "pm25", value: 15, unit: "µg/m³" }
        ]
      },
      {
        location: "Санкт-Петербург",
        coordinates: { latitude: 59.9343, longitude: 30.3351 },
        measurements: [
          { parameter: "pm25", value: 8, unit: "µg/m³" }
        ]
      }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        data: demoData,
        demo: true
      })
    };
  }
};
