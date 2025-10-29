import fetch from 'node-fetch';

export default async function handler(request, response) {
  // Разрешаем CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  console.log('Forest fires function called');
  
  try {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const urls = [
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_NRT/world/1/${dateStr}`,
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT/world/1/${dateStr}`,
    ];
    
    let fires = [];
    
    for (const url of urls) {
      try {
        console.log('Trying URL:', url);
        const apiResponse = await fetch(url);
        
        if (apiResponse.ok) {
          const csvData = await apiResponse.text();
          console.log('Got CSV data, length:', csvData.length);
          
          if (csvData && csvData.length > 100) {
            const parsedFires = parseSimpleCSV(csvData);
            fires = fires.concat(parsedFires);
            console.log('Parsed fires:', parsedFires.length);
          }
        }
      } catch (err) {
        console.log('URL failed:', url, err.message);
        continue;
      }
    }
    
    // Всегда генерируем 1100 пожаров
    const targetCount = 1100;
    let finalFires = [];
    
    if (fires.length > 0) {
      finalFires = fires.slice(0, Math.min(fires.length, targetCount));
    }
    
    // Если реальных данных меньше 1100, дополняем демо-данными
    if (finalFires.length < targetCount) {
      const needed = targetCount - finalFires.length;
      const demoFires = generateGlobalFiresOnLand(needed);
      finalFires = finalFires.concat(demoFires);
      console.log(`Added ${demoFires.length} demo fires to reach ${targetCount}`);
    }
    
    console.log('Returning fire data:', finalFires.length);
    return response.status(200).json({
      fires: finalFires,
      total: finalFires.length,
      timestamp: Date.now(),
      source: fires.length > 0 ? 'NASA FIRMS API + Demo Data' : 'Demo Data'
    });
    
  } catch (error) {
    console.error('Error, using demo data:', error);
    
    const demoData = generateGlobalFiresOnLand(1100);
    
    console.log('Returning DEMO fire data:', demoData.length, 'fires');
    
    return response.status(200).json({ 
      fires: demoData,
      demo: true,
      total: demoData.length,
      timestamp: Date.now(),
      source: 'Demo Data - Global Coverage'
    });
  }
}

function parseSimpleCSV(csv) {
  const fires = [];
  const lines = csv.split('\n');
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('latitude') || line.startsWith('"latitude"')) continue;
    
    const cells = line.split(',').map(cell => cell.replace(/"/g, '').trim());
    if (cells.length >= 6) {
      const lat = parseFloat(cells[0]);
      const lng = parseFloat(cells[1]);
      const brightness = parseFloat(cells[2]);
      
      if (!isNaN(lat) && !isNaN(lng) && !isNaN(brightness)) {
        fires.push({
          latitude: lat,
          longitude: lng,
          brightness: brightness,
          date: cells[5] || new Date().toISOString(),
          region: getRegion(lat, lng),
          country: getCountryByCoords(lat, lng)
        });
      }
    }
  }
  
  return fires;
}

function getRegion(lat, lng) {
  if (lat >= 15 && lat <= 75 && lng >= -170 && lng <= -50) return "Северная Америка";
  if (lat >= -55 && lat <= 15 && lng >= -85 && lng <= -30) return "Южная Америка";
  if (lat >= 35 && lat <= 70 && lng >= -25 && lng <= 50) return "Европа";
  if (lat >= 10 && lat <= 75 && lng >= 50 && lng <= 180) return "Азия";
  if (lat >= -35 && lat <= 37 && lng >= -25 && lng <= 55) return "Африка";
  if ((lat >= -50 && lat <= 0 && lng >= 110 && lng <= 180) || 
      (lat >= -50 && lat <= -10 && lng >= 165 && lng <= 180)) return "Австралия и Океания";
  return "Другие регионы";
}

function getCountryByCoords(lat, lng) {
  if (lat >= 55 && lng >= 37 && lng <= 180) return "Россия";
  if (lat >= 25 && lat <= 50 && lng >= -125 && lng <= -65) return "США";
  if (lat >= 45 && lat <= 70 && lng >= -110 && lng <= -60) return "Канада";
  if (lat >= -35 && lat <= 5 && lng >= -80 && lng <= -45) return "Бразилия";
  if (lat >= 35 && lat <= 45 && lng >= -10 && lng <= 25) return "Испания/Франция";
  if (lat >= 45 && lat <= 55 && lng >= 10 && lng <= 25) return "Германия/Польша";
  if (lat >= 20 && lat <= 40 && lng >= 70 && lng <= 100) return "Китай/Индия";
  return "Неизвестно";
}

function generateGlobalFiresOnLand(count) {
  const fires = [];
  
  const landRegions = [
    {
      name: "Северная Америка",
      areas: [
        { latMin: 25, latMax: 50, lngMin: -125, lngMax: -65 },
        { latMin: 45, latMax: 60, lngMin: -110, lngMax: -60 },
        { latMin: 15, latMax: 30, lngMin: -115, lngMax: -85 }
      ],
      weight: 250
    },
    {
      name: "Южная Америка",
      areas: [
        { latMin: -35, latMax: 5, lngMin: -80, lngMax: -45 },
        { latMin: -10, latMax: 12, lngMin: -80, lngMax: -60 }
      ],
      weight: 200
    },
    {
      name: "Европа",
      areas: [
        { latMin: 40, latMax: 55, lngMin: -10, lngMax: 25 },
        { latMin: 45, latMax: 60, lngMin: 10, lngMax: 40 },
        { latMin: 35, latMax: 45, lngMin: -5, lngMax: 15 }
      ],
      weight: 180
    },
    {
      name: "Азия",
      areas: [
        { latMin: 20, latMax: 50, lngMin: 70, lngMax: 120 },
        { latMin: 50, latMax: 70, lngMin: 50, lngMax: 140 },
        { latMin: 25, latMax: 40, lngMin: 120, lngMax: 145 }
      ],
      weight: 300
    },
    {
      name: "Африка",
      areas: [
        { latMin: -35, latMax: -5, lngMin: 15, lngMax: 35 },
        { latMin: -5, latMax: 15, lngMin: 10, lngMax: 30 },
        { latMin: 15, latMax: 35, lngMin: -20, lngMax: 40 }
      ],
      weight: 220
    },
    {
      name: "Австралия и Океания",
      areas: [
        { latMin: -35, latMax: -15, lngMin: 115, lngMax: 150 },
        { latMin: -45, latMax: -35, lngMin: 165, lngMax: 180 }
      ],
      weight: 80
    }
  ];
  
  let totalWeight = landRegions.reduce((sum, region) => sum + region.weight, 0);
  let remaining = count;
  const regionFires = [];
  
  // Распределяем пожары по регионам
  landRegions.forEach(region => {
    const regionCount = Math.round((region.weight / totalWeight) * count);
    regionFires.push({ ...region, count: Math.min(regionCount, remaining) });
    remaining -= regionCount;
  });
  
  // Распределяем оставшиеся пожары
  if (remaining > 0) {
    regionFires.sort((a, b) => b.weight - a.weight);
    for (let i = 0; i < remaining && i < regionFires.length; i++) {
      regionFires[i].count++;
    }
  }
  
  // Генерируем пожары для каждого региона
  regionFires.forEach(region => {
    let generatedInRegion = 0;
    
    while (generatedInRegion < region.count) {
      // Случайно выбираем зону внутри региона
      const area = region.areas[Math.floor(Math.random() * region.areas.length)];
      
      const lat = area.latMin + Math.random() * (area.latMax - area.latMin);
      const lng = area.lngMin + Math.random() * (area.lngMax - area.lngMin);
      
      // Проверяем, что точка на суше
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
    
    console.log(`Generated ${generatedInRegion} fires in ${region.name}`);
  });
  
  return fires;
}

function isOnLand(lat, lng) {
  // Основные океаны
  if (lng >= -70 && lng <= 20 && lat >= -50 && lat <= 50) return false; // Атлантический
  if ((lng >= 120 || lng <= -70) && lat >= -60 && lat <= 60) return false; // Тихий
  if (lng >= 40 && lng <= 120 && lat >= -50 && lat <= 30) return false; // Индийский
  if (lat > 75) return false; // Северный Ледовитый
  
  // Основные моря
  if (lng >= -5 && lng <= 36 && lat >= 30 && lat <= 45) return false; // Средиземное
  if (lng >= -90 && lng <= -60 && lat >= 10 && lat <= 25) return false; // Карибское
  if (lng >= 10 && lng <= 30 && lat >= 53 && lat <= 60) return false; // Балтийское
  
  return true;
}

function getCountryByRegion(region, lat, lng) {
  const countryMap = {
    "Северная Америка": getNorthAmericanCountry(lat, lng),
    "Южная Америка": getSouthAmericanCountry(lat, lng),
    "Европа": getEuropeanCountry(lat, lng),
    "Азия": getAsianCountry(lat, lng),
    "Африка": getAfricanCountry(lat, lng),
    "Австралия и Океания": getOceanianCountry(lat, lng)
  };
  
  return countryMap[region] || "Неизвестно";
}

function getNorthAmericanCountry(lat, lng) {
  if (lat > 49) return "Канада";
  if (lat > 25) return "США";
  return "Мексика";
}

function getSouthAmericanCountry(lat, lng) {
  const countries = ["Бразилия", "Аргентина", "Чили", "Перу", "Колумбия", "Венесуэла"];
  return countries[Math.floor(Math.random() * countries.length)];
}

function getEuropeanCountry(lat, lng) {
  if (lat > 55) return ["Швеция", "Финляндия", "Норвегия"][Math.floor(Math.random() * 3)];
  if (lat > 45) return ["Германия", "Франция", "Польша"][Math.floor(Math.random() * 3)];
  return ["Испания", "Италия", "Греция"][Math.floor(Math.random() * 3)];
}

function getAsianCountry(lat, lng) {
  if (lat > 50) return "Россия";
  if (lng > 100) return ["Китай", "Монголия"][Math.floor(Math.random() * 2)];
  return ["Индия", "Казахстан", "Иран"][Math.floor(Math.random() * 3)];
}

function getAfricanCountry(lat, lng) {
  if (lat > 15) return ["Нигерия", "Египет", "Судан"][Math.floor(Math.random() * 3)];
  if (lat > 0) return ["ДР Конго", "Кения", "Танзания"][Math.floor(Math.random() * 3)];
  return ["ЮАР", "Ангола", "Намибия"][Math.floor(Math.random() * 3)];
}

function getOceanianCountry(lat, lng) {
  if (lat < -30) return "Новая Зеландия";
  return "Австралия";
}
