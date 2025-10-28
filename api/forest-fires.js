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
      `https://firms.modaps.eosdis.nasa.gov/api/country/csv/VIIRS_SNPP_NRT/GRC/1/${dateStr}`
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
      return response.status(200).json({
        fires: fires.slice(0, 73),
        total: fires.length,
        timestamp: Date.now(),
        source: 'NASA FIRMS API'
      });
    }
    
    throw new Error('No real fire data available');
    
  } catch (error) {
    console.error('All NASA APIs failed, using demo data:', error);
    
    const demoData = generateGlobalFiresOnLand(73);
    
    console.log('Returning DEMO fire data:', demoData.length, 'fires');
    
    return response.status(200).json({ 
      fires: demoData,
      demo: true,
      total: demoData.length,
      timestamp: Date.now(),
      source: 'Demo Data - Global Coverage (Land Only)'
    });
  }
}

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
  
  // Определяем только континентальные регионы с землей
  const landRegions = [
    {
      name: "Северная Америка",
      areas: [
        { latMin: 25, latMax: 50, lngMin: -125, lngMax: -65 }, // Запад и центр США
        { latMin: 45, latMax: 60, lngMin: -110, lngMax: -60 }, // Канада
        { latMin: 15, latMax: 30, lngMin: -115, lngMax: -85 }  // Мексика
      ],
      weight: 15
    },
    {
      name: "Южная Америка",
      areas: [
        { latMin: -35, latMax: 5, lngMin: -80, lngMax: -45 },  // Бразилия, Аргентина, Чили
        { latMin: -10, latMax: 12, lngMin: -80, lngMax: -60 }  // Север Южной Америки
      ],
      weight: 12
    },
    {
      name: "Европа",
      areas: [
        { latMin: 40, latMax: 55, lngMin: -10, lngMax: 25 },   // Западная Европа
        { latMin: 45, latMax: 60, lngMin: 10, lngMax: 40 },    // Восточная Европа
        { latMin: 35, latMax: 45, lngMin: -5, lngMax: 15 }     // Южная Европа
      ],
      weight: 10
    },
    {
      name: "Азия",
      areas: [
        { latMin: 20, latMax: 50, lngMin: 70, lngMax: 120 },   // Китай, Индия
        { latMin: 50, latMax: 70, lngMin: 50, lngMax: 140 },   // Россия (Сибирь, Дальний Восток)
        { latMin: 25, latMax: 40, lngMin: 120, lngMax: 145 }   // Япония, Корея
      ],
      weight: 20
    },
    {
      name: "Африка",
      areas: [
        { latMin: -35, latMax: -5, lngMin: 15, lngMax: 35 },   // Южная Африка
        { latMin: -5, latMax: 15, lngMin: 10, lngMax: 30 },    // Центральная Африка
        { latMin: 15, latMax: 35, lngMin: -20, lngMax: 40 }    // Северная Африка
      ],
      weight: 12
    },
    {
      name: "Австралия",
      areas: [
        { latMin: -35, latMax: -15, lngMin: 115, lngMax: 150 } // Австралия
      ],
      weight: 4
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
    let attempts = 0;
    const maxAttempts = region.count * 20; // Увеличиваем лимит попыток
    
    while (generatedInRegion < region.count && attempts < maxAttempts) {
      attempts++;
      
      // Случайно выбираем зону внутри региона
      const area = region.areas[Math.floor(Math.random() * region.areas.length)];
      
      const lat = area.latMin + Math.random() * (area.latMax - area.latMin);
      const lng = area.lngMin + Math.random() * (area.lngMax - area.lngMin);
      
      // Проверяем, что точка на суше (упрощенная проверка)
      if (isDefinitelyOnLand(lat, lng)) {
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

// Улучшенная функция проверки нахождения на суше
function isDefinitelyOnLand(lat, lng) {
  // Основные океаны и моря (расширенный список)
  
  // Атлантический океан
  if (lng >= -70 && lng <= 20 && lat >= -50 && lat <= 50) return false;
  
  // Тихий океан
  if ((lng >= 120 || lng <= -70) && lat >= -60 && lat <= 60) return false;
  
  // Индийский океан
  if (lng >= 40 && lng <= 120 && lat >= -50 && lat <= 30) return false;
  
  // Северный Ледовитый океан
  if (lat > 70) return false;
  
  // Средиземное море
  if (lng >= -5 && lng <= 36 && lat >= 30 && lat <= 45) return false;
  
  // Карибское море
  if (lng >= -90 && lng <= -60 && lat >= 10 && lat <= 25) return false;
  
  // Балтийское море
  if (lng >= 10 && lng <= 30 && lat >= 53 && lat <= 60) return false;
  
  // Черное море
  if (lng >= 28 && lng <= 42 && lat >= 41 && lat <= 47) return false;
  
  // Каспийское море
  if (lng >= 46 && lng <= 54 && lat >= 36 && lat <= 47) return false;
  
  // Красное море
  if (lng >= 32 && lng <= 43 && lat >= 12 && lat <= 30) return false;
  
  // Персидский залив
  if (lng >= 48 && lng <= 56 && lat >= 24 && lat <= 30) return false;
  
  // Японское море
  if (lng >= 127 && lng <= 142 && lat >= 35 && lat <= 45) return false;
  
  // Охотское море
  if (lng >= 140 && lng <= 155 && lat >= 50 && lat <= 60) return false;
  
  // Берингово море
  if (lng >= 160 && lng <= -160 && lat >= 55 && lat <= 65) return false;
  
  // Великие озера (Северная Америка)
  if (lng >= -92 && lng <= -76 && lat >= 41 && lat <= 49) return false;
  
  // Озеро Байкал
  if (lng >= 103 && lng <= 110 && lat >= 51 && lat <= 56) return false;
  
  // Основные пустынные регионы (где пожары менее вероятны, но возможны)
  // Сахара
  if (lng >= -15 && lng <= 35 && lat >= 18 && lat <= 30) {
    // В пустыне пожары редки, но возможны в оазисах
    return Math.random() > 0.9; // Только 10% точек в пустыне
  }
  
  // Гренландия (ледник)
  if (lng >= -70 && lng <= -10 && lat >= 60 && lat <= 85) return false;
  
  // Антарктида
  if (lat < -60) return false;
  
  // Если не попало ни в одно исключение - считаем что на суше
  return true;
}

function getCountryByRegion(region, lat, lng) {
  const countryMap = {
    "Северная Америка": getNorthAmericanCountry(lat, lng),
    "Южная Америка": getSouthAmericanCountry(lat, lng),
    "Европа": getEuropeanCountry(lat, lng),
    "Азия": getAsianCountry(lat, lng),
    "Африка": getAfricanCountry(lat, lng),
    "Австралия": ["Австралия", "Новая Зеландия"][Math.floor(Math.random() * 2)]
  };
  
  return countryMap[region] || "Неизвестно";
}

// Вспомогательные функции для определения стран по координатам
function getNorthAmericanCountry(lat, lng) {
  if (lat > 40 && lng < -100) return "США";
  if (lat > 40 && lng >= -100) return "Канада";
  if (lat < 35 && lng > -110) return "Мексика";
  return "США";
}

function getSouthAmericanCountry(lat, lng) {
  const countries = ["Бразилия", "Аргентина", "Чили", "Перу", "Колумбия", "Венесуэла"];
  return countries[Math.floor(Math.random() * countries.length)];
}

function getEuropeanCountry(lat, lng) {
  if (lat > 45 && lng < 10) return "Франция";
  if (lat > 45 && lng >= 10) return "Германия";
  if (lat < 45 && lng < 20) return "Испания";
  if (lat < 45 && lng >= 20) return "Италия";
  return "Европа";
}

function getAsianCountry(lat, lng) {
  if (lat > 35 && lng < 100) return "Китай";
  if (lat > 35 && lng >= 100) return "Россия";
  if (lat < 35 && lng < 100) return "Индия";
  return "Азия";
}

function getAfricanCountry(lat, lng) {
  if (lat > 0 && lng < 20) return "Нигерия";
  if (lat > 0 && lng >= 20) return "Эфиопия";
  if (lat < 0) return "ЮАР";
  return "Африка";
}
