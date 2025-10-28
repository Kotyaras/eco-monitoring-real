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
          fires: fires.slice(0, 73), // Ограничиваем 73 пожарами
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
    
    // Генерируем 73 пожара по всему миру
    const demoData = generateGlobalFires(73);
    
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
        source: 'Demo Data - Global Coverage'
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

// Генерация демо-данных для 73 пожаров по всему миру
function generateGlobalFires(count) {
  const fires = [];
  const regions = [
    // Северная Америка
    { name: "Северная Америка", latMin: 25, latMax: 70, lngMin: -130, lngMax: -60, weight: 15 },
    // Южная Америка
    { name: "Южная Америка", latMin: -55, latMax: 15, lngMin: -80, lngMax: -35, weight: 12 },
    // Европа
    { name: "Европа", latMin: 35, latMax: 60, lngMin: -10, lngMax: 40, weight: 10 },
    // Азия (включая Россию)
    { name: "Азия", latMin: 10, latMax: 70, lngMin: 40, lngMax: 150, weight: 20 },
    // Африка
    { name: "Африка", latMin: -35, latMax: 35, lngMin: -20, lngMax: 50, weight: 12 },
    // Австралия и Океания
    { name: "Австралия", latMin: -45, latMax: -10, lngMin: 110, lngMax: 155, weight: 4 }
  ];
  
  // Распределяем пожары по регионам согласно весам
  let remaining = count;
  const regionFires = [];
  
  regions.forEach(region => {
    const regionCount = Math.round((region.weight / 73) * count);
    regionFires.push({ ...region, count: Math.min(regionCount, remaining) });
    remaining -= regionCount;
  });
  
  // Если остались нераспределенные пожары, добавляем их в регионы с наибольшим весом
  if (remaining > 0) {
    regionFires.sort((a, b) => b.weight - a.weight);
    for (let i = 0; i < remaining && i < regionFires.length; i++) {
      regionFires[i].count++;
    }
  }
  
  // Генерируем пожары для каждого региона
  regionFires.forEach(region => {
    for (let i = 0; i < region.count; i++) {
      const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
      const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);
      const brightness = 100 + Math.random() * 400; // от 100 до 500
      
      fires.push({
        latitude: parseFloat(lat.toFixed(4)),
        longitude: parseFloat(lng.toFixed(4)),
        brightness: parseFloat(brightness.toFixed(1)),
        date: new Date().toISOString(),
        region: region.name,
        country: getCountryByRegion(region.name, lat, lng)
      });
    }
  });
  
  return fires;
}

// Функция для определения страны по региону и координатам
function getCountryByRegion(region, lat, lng) {
  const countries = {
    "Северная Америка": ["США", "Канада", "Мексика"],
    "Южная Америка": ["Бразилия", "Аргентина", "Чили", "Перу", "Колумбия"],
    "Европа": ["Испания", "Португалия", "Италия", "Греция", "Франция", "Германия"],
    "Азия": ["Россия", "Китай", "Индия", "Казахстан", "Индонезия", "Таиланд"],
    "Африка": ["Конго", "Ангола", "Замбия", "ЮАР", "Кения", "Эфиопия"],
    "Австралия": ["Австралия", "Новая Зеландия", "Папуа-Новая Гвинея"]
  };
  
  const regionCountries = countries[region];
  if (regionCountries) {
    return regionCountries[Math.floor(Math.random() * regionCountries.length)];
  }
  
  return "Неизвестно";
}
