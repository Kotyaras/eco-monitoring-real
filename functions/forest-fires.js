const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_NRT/world/1/${dateStr}`;
    
    const response = await fetch(url);
    const csvData = await response.text();
    
    const fires = parseFireCSV(csvData);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fires: fires.slice(0, 100),
        total: fires.length,
        timestamp: Date.now()
      })
    };
  } catch (error) {
    const demoData = [
      { latitude: 56.5, longitude: 84.0, brightness: 320, date: new Date().toISOString() },
      { latitude: 54.8, longitude: 73.4, brightness: 180, date: new Date().toISOString() }
    ];
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        fires: demoData,
        demo: true
      })
    };
  }
};

function parseFireCSV(csv) {
  const lines = csv.split('\n');
  const fires = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    if (cells.length >= 6) {
      fires.push({
        latitude: parseFloat(cells[0]),
        longitude: parseFloat(cells[1]),
        brightness: parseFloat(cells[2]),
        date: cells[5] || new Date().toISOString()
      });
    }
  }
  
  return fires;
}
