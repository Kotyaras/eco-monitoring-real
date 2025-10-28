const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  console.log('Forest fires function called');
  
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const urls = [
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_NRT/world/1/${dateStr}`,
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1/${dateStr}`,
      `https://firms.modaps.eosdis.nasa.gov/api/country/csv/VIIRS_SNPP_NRT/GRC/1/${dateStr}`
    ];
    
    let fires = [];
    
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
    
    if (fires.length > 0) {
      console.log('Returning real fire data:', fires.length);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fires: fires.slice(0, 73),
          total: fires.length,
          timestamp: Date.now(),
          source: 'NASA FIRMS API'
        })
      };
    }
    
    throw new Error('No real fire data available');
    
  } catch (error) {
    console.error('All NASA APIs failed, using demo data:', error);
    
    const demoData = generateGlobalFiresOnLand(73);
    
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
        source: 'Demo Data - Global Coverage (Land Only)'
      })
    };
  }
};

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
      
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(brightness)) {
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

function generateGlobalFiresOnLand(count) {
  const fires = [];
  
  const landRegions = [
    { name: "Северная Америка", latMin: 30, latMax: 60, lngMin: -120, lngMax: -70, weight: 15 },
    { name: "Южная Америка", latMin: -35, latMax: 10, lngMin: -75, lngMax: -45, weight: 12 },
    { name: "Европа", latMin: 40, latMax: 55, lngMin: -5, lngMax: 35, weight: 10 },
    { name: "Азия", latMin: 20, latMax: 55, lngMin: 50, lngMax: 120, weight: 20 },
    { name: "Африка", latMin: -10, latMax: 30, lngMin: 10, lngMax: 40, weight: 12 },
    { name: "Австралия", latMin: -35, latMax: -15, lngMin: 120, lngMax: 145, weight: 4 }
  ];
  
  let totalWeight = landRegions.reduce((sum, region) => sum + region.weight, 0);
  let remaining = count;
  const regionFires = [];
  
  landRegions.forEach(region => {
    const regionCount = Math.round((region.weight / totalWeight) * count);
    regionFires.push({ ...region, count: Math.min(regionCount, remaining) });
    remaining -= regionCount;
  });
  
  if (remaining > 0) {
    regionFires.sort((a, b) => b.weight - a.weight);
    for (let i = 0; i < remaining && i < regionFires.length; i++) {
      regionFires[i].count++;
    }
  }
  
  regionFires.forEach(region => {
    let generatedInRegion = 0;
    let attempts = 0;
    const maxAttempts = region.count * 10;
    
    while (generatedInRegion < region.count && attempts < maxAttempts) {
      attempts++;
      
      const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
      const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);
      
      if (isOnLand(lat, lng)) {
        const brightness = 100 + Math.random() * 400;
        
        fires.push({
          latitude: parseFloat(lat.toFixed(4)),
          longitude: parseFloat(lng.toFixed(4)),
          brightness: parseFloat(brightness.toFixed(1)),
          date: new Date().toISOString(),
          region: region.name,
          country: getCountryByRegion(region.name, lat, lng)
        });
        
        generatedInRegion++;
      }
    }
    
    console.log(`Generated ${generatedInRegion} fires in ${region.name} (${attempts} attempts)`);
  });
  
  return fires;
}

function isOnLand(lat, lng) {
  // Атлантический океан
  if (lng >= -60 && lng <= 20 && lat >= -40 && lat <= 40) return false;
  
  // Тихий океан
  if ((lng >= 120 || lng <= -80) && lat >= -60 && lat <= 60) return false;
  
  // Индийский океан
  if (lng >= 40 && lng <= 120 && lat >= -40 && lat <= 20) return false;
  
  // Северный Ледовитый океан
  if (lat > 75) return false;
  
  // Карибское море
  if (lng >= -85 && lng <= -60 && lat >= 10 && lat <= 25) return false;
  
  // Средиземное море
  if (lng >= -5 && lng <= 35 && lat >= 30 && lat <= 45) return false;
  
  // Балтийское море
  if (lng >= 10 && lng <= 30 && lat >= 53 && lat <= 60) return false;
  
  // Черное и Каспийское моря
  if (lng >= 28 && lng <= 50 && lat >= 40 && lat <= 47) return false;
  
  // Великие озера
  if (lng >= -92 && lng <= -76 && lat >= 41 && lat <= 49) return false;
  
  return true;
}

function getCountryByRegion(region, lat, lng) {
  const countryMap = {
    "Северная Америка": ["США", "Канада", "Мексика"],
    "Южная Америка": ["Бразилия", "Аргентина", "Чили", "Перу", "Колумбия"],
    "Европа": ["Испания", "Португалия", "Италия", "Греция", "Франция", "Германия"],
    "Азия": ["Россия", "Китай", "Индия", "Казахстан", "Индонезия", "Таиланд"],
    "Африка": ["Конго", "Ангола", "Замбия", "ЮАР", "Кения", "Эфиопия"],
    "Австралия": ["Австралия", "Новая Зеландия"]
  };
  
  const countries = countryMap[region];
  if (countries && countries.length > 0) {
    return countries[Math.floor(Math.random() * countries.length)];
  }
  
  return "Неизвестно";
}
