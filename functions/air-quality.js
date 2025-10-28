// functions/historical-air.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const { year = 2024 } = event.queryStringParameters;
  
  console.log(`Generating historical air data for year: ${year}`);
  
  const historicalData = generateHistoricalAirData(parseInt(year));
  
  return {
    statusCode: 200,
    headers: { 
      'Access-Control-Allow-Origin': '*', 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(historicalData)
  };
};

function generateHistoricalAirData(year) {
  // Базовые исторические уровни загрязнения по годам
  const getHistoricalMultiplier = (year) => {
    if (year < 1850) return 0.3;  // До индустриализации
    if (year < 1900) return 0.5;  // Начало индустриализации
    if (year < 1950) return 0.7;  // Развитие промышленности
    if (year < 1980) return 0.9;  // Пик промышленного загрязнения
    if (year < 2000) return 0.8;  // Начало экологических мер
    if (year < 2020) return 0.75; // Современные стандарты
    return 0.8; // Пост-ковидное восстановление
  };

  const historicalMultiplier = getHistoricalMultiplier(year);
  
  // Полностью заполненные исторические данные
  const historicalStations = [
    // Россия (25 станций)
    { location: "Москва, центр", city: "Moscow", country: "RU", coordinates: { latitude: 55.7558, longitude: 37.6173 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (25 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Санкт-Петербург", city: "Saint Petersburg", country: "RU", coordinates: { latitude: 59.9343, longitude: 30.3351 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (20 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Новосибирск", city: "Novosibirsk", country: "RU", coordinates: { latitude: 55.0084, longitude: 82.9357 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (30 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Екатеринбург", city: "Yekaterinburg", country: "RU", coordinates: { latitude: 56.8389, longitude: 60.6057 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (25 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Казань", city: "Kazan", country: "RU", coordinates: { latitude: 55.8304, longitude: 49.0661 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (22 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Ростов-на-Дону", city: "Rostov-on-Don", country: "RU", coordinates: { latitude: 47.2224, longitude: 39.7189 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (24 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Владивосток", city: "Vladivostok", country: "RU", coordinates: { latitude: 43.1155, longitude: 131.8855 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (28 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Сочи", city: "Sochi", country: "RU", coordinates: { latitude: 43.5855, longitude: 39.7231 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (15 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Краснодар", city: "Krasnodar", country: "RU", coordinates: { latitude: 45.0355, longitude: 38.9753 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (20 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Волгоград", city: "Volgograd", country: "RU", coordinates: { latitude: 48.7080, longitude: 44.5133 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (25 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Пермь", city: "Perm", country: "RU", coordinates: { latitude: 58.0105, longitude: 56.2502 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (23 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Уфа", city: "Ufa", country: "RU", coordinates: { latitude: 54.7355, longitude: 55.9587 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (21 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Омск", city: "Omsk", country: "RU", coordinates: { latitude: 54.9885, longitude: 73.3242 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (26 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Красноярск", city: "Krasnoyarsk", country: "RU", coordinates: { latitude: 56.0153, longitude: 92.8932 }, measurements: [{ parameter: "pm25", value: Math.round(7 + (32 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Иркутск", city: "Irkutsk", country: "RU", coordinates: { latitude: 52.2864, longitude: 104.2806 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (29 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Хабаровск", city: "Khabarovsk", country: "RU", coordinates: { latitude: 48.4802, longitude: 135.0719 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (27 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Якутск", city: "Yakutsk", country: "RU", coordinates: { latitude: 62.0274, longitude: 129.7315 }, measurements: [{ parameter: "pm25", value: Math.round(8 + (35 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Мурманск", city: "Murmansk", country: "RU", coordinates: { latitude: 68.9585, longitude: 33.0827 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (12 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Калининград", city: "Kaliningrad", country: "RU", coordinates: { latitude: 54.7104, longitude: 20.4522 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (16 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Севастополь", city: "Sevastopol", country: "RU", coordinates: { latitude: 44.6167, longitude: 33.5254 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (14 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Самара", city: "Samara", country: "RU", coordinates: { latitude: 53.1959, longitude: 50.1002 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (24 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Тюмень", city: "Tyumen", country: "RU", coordinates: { latitude: 57.1522, longitude: 65.5272 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (22 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Томск", city: "Tomsk", country: "RU", coordinates: { latitude: 56.4846, longitude: 84.9482 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (23 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Барнаул", city: "Barnaul", country: "RU", coordinates: { latitude: 53.3552, longitude: 83.7699 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (28 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Челябинск", city: "Chelyabinsk", country: "RU", coordinates: { latitude: 55.1644, longitude: 61.4368 }, measurements: [{ parameter: "pm25", value: Math.round(7 + (30 * historicalMultiplier)), unit: "µg/m³" }] },

    // Европа (25 станций)
    { location: "Berlin Central", city: "Berlin", country: "DE", coordinates: { latitude: 52.5200, longitude: 13.4050 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (20 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Paris Downtown", city: "Paris", country: "FR", coordinates: { latitude: 48.8566, longitude: 2.3522 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (22 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "London City", city: "London", country: "GB", coordinates: { latitude: 51.5074, longitude: -0.1278 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (25 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Rome Center", city: "Rome", country: "IT", coordinates: { latitude: 41.9028, longitude: 12.4964 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (24 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Madrid Urban", city: "Madrid", country: "ES", coordinates: { latitude: 40.4168, longitude: -3.7038 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (22 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Amsterdam Central", city: "Amsterdam", country: "NL", coordinates: { latitude: 52.3676, longitude: 4.9041 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (15 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Warsaw Downtown", city: "Warsaw", country: "PL", coordinates: { latitude: 52.2297, longitude: 21.0122 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (26 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Prague City", city: "Prague", country: "CZ", coordinates: { latitude: 50.0755, longitude: 14.4378 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (20 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Vienna Center", city: "Vienna", country: "AT", coordinates: { latitude: 48.2082, longitude: 16.3738 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (18 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Budapest Urban", city: "Budapest", country: "HU", coordinates: { latitude: 47.4979, longitude: 19.0402 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (23 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Brussels Central", city: "Brussels", country: "BE", coordinates: { latitude: 50.8503, longitude: 4.3517 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (19 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Lisbon Downtown", city: "Lisbon", country: "PT", coordinates: { latitude: 38.7223, longitude: -9.1393 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (16 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Athens City", city: "Athens", country: "GR", coordinates: { latitude: 37.9838, longitude: 23.7275 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (28 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Dublin Urban", city: "Dublin", country: "IE", coordinates: { latitude: 53.3498, longitude: -6.2603 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (14 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Stockholm Center", city: "Stockholm", country: "SE", coordinates: { latitude: 59.3293, longitude: 18.0686 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (12 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Oslo Downtown", city: "Oslo", country: "NO", coordinates: { latitude: 59.9139, longitude: 10.7522 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (13 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Helsinki City", city: "Helsinki", country: "FI", coordinates: { latitude: 60.1699, longitude: 24.9384 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (11 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Copenhagen Urban", city: "Copenhagen", country: "DK", coordinates: { latitude: 55.6761, longitude: 12.5683 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (16 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Zurich Center", city: "Zurich", country: "CH", coordinates: { latitude: 47.3769, longitude: 8.5417 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (14 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Luxembourg City", city: "Luxembourg", country: "LU", coordinates: { latitude: 49.6116, longitude: 6.1319 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (15 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Bratislava Downtown", city: "Bratislava", country: "SK", coordinates: { latitude: 48.1486, longitude: 17.1077 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (21 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Ljubljana Urban", city: "Ljubljana", country: "SI", coordinates: { latitude: 46.0569, longitude: 14.5058 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (18 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Tallinn Center", city: "Tallinn", country: "EE", coordinates: { latitude: 59.4370, longitude: 24.7536 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (17 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Riga Downtown", city: "Riga", country: "LV", coordinates: { latitude: 56.9496, longitude: 24.1052 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (20 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Vilnius City", city: "Vilnius", country: "LT", coordinates: { latitude: 54.6872, longitude: 25.2797 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (19 * historicalMultiplier)), unit: "µg/m³" }] },

    // Азия (25 станций)
    { location: "Tokyo Central", city: "Tokyo", country: "JP", coordinates: { latitude: 35.6762, longitude: 139.6503 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (20 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Seoul Downtown", city: "Seoul", country: "KR", coordinates: { latitude: 37.5665, longitude: 126.9780 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (30 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Beijing Urban", city: "Beijing", country: "CN", coordinates: { latitude: 39.9042, longitude: 116.4074 }, measurements: [{ parameter: "pm25", value: Math.round(10 + (60 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Shanghai Center", city: "Shanghai", country: "CN", coordinates: { latitude: 31.2304, longitude: 121.4737 }, measurements: [{ parameter: "pm25", value: Math.round(8 + (50 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Hong Kong Central", city: "Hong Kong", country: "HK", coordinates: { latitude: 22.3193, longitude: 114.1694 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (35 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Singapore City", city: "Singapore", country: "SG", coordinates: { latitude: 1.3521, longitude: 103.8198 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (18 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Bangkok Downtown", city: "Bangkok", country: "TH", coordinates: { latitude: 13.7563, longitude: 100.5018 }, measurements: [{ parameter: "pm25", value: Math.round(7 + (38 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Kuala Lumpur", city: "Kuala Lumpur", country: "MY", coordinates: { latitude: 3.1390, longitude: 101.6869 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (34 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Manila Urban", city: "Manila", country: "PH", coordinates: { latitude: 14.5995, longitude: 120.9842 }, measurements: [{ parameter: "pm25", value: Math.round(8 + (42 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Jakarta Center", city: "Jakarta", country: "ID", coordinates: { latitude: -6.2088, longitude: 106.8456 }, measurements: [{ parameter: "pm25", value: Math.round(9 + (48 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Delhi Downtown", city: "Delhi", country: "IN", coordinates: { latitude: 28.6139, longitude: 77.2090 }, measurements: [{ parameter: "pm25", value: Math.round(12 + (75 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Mumbai Urban", city: "Mumbai", country: "IN", coordinates: { latitude: 19.0760, longitude: 72.8777 }, measurements: [{ parameter: "pm25", value: Math.round(10 + (65 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Bangalore City", city: "Bangalore", country: "IN", coordinates: { latitude: 12.9716, longitude: 77.5946 }, measurements: [{ parameter: "pm25", value: Math.round(8 + (45 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Karachi Center", city: "Karachi", country: "PK", coordinates: { latitude: 24.8607, longitude: 67.0011 }, measurements: [{ parameter: "pm25", value: Math.round(11 + (68 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Dhaka Urban", city: "Dhaka", country: "BD", coordinates: { latitude: 23.8103, longitude: 90.4125 }, measurements: [{ parameter: "pm25", value: Math.round(13 + (80 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Colombo Downtown", city: "Colombo", country: "LK", coordinates: { latitude: 6.9271, longitude: 79.8612 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (36 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Kathmandu City", city: "Kathmandu", country: "NP", coordinates: { latitude: 27.7172, longitude: 85.3240 }, measurements: [{ parameter: "pm25", value: Math.round(9 + (52 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Ulaanbaatar", city: "Ulaanbaatar", country: "MN", coordinates: { latitude: 47.8864, longitude: 106.9057 }, measurements: [{ parameter: "pm25", value: Math.round(14 + (85 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Almaty Urban", city: "Almaty", country: "KZ", coordinates: { latitude: 43.2220, longitude: 76.8512 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (32 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Tashkent Center", city: "Tashkent", country: "UZ", coordinates: { latitude: 41.2995, longitude: 69.2401 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (35 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Baku Downtown", city: "Baku", country: "AZ", coordinates: { latitude: 40.4093, longitude: 49.8671 }, measurements: [{ parameter: "pm25", value: Math.round(7 + (40 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Yerevan City", city: "Yerevan", country: "AM", coordinates: { latitude: 40.1792, longitude: 44.4991 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (33 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Tbilisi Urban", city: "Tbilisi", country: "GE", coordinates: { latitude: 41.7151, longitude: 44.8271 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (30 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Tehran Center", city: "Tehran", country: "IR", coordinates: { latitude: 35.6892, longitude: 51.3890 }, measurements: [{ parameter: "pm25", value: Math.round(10 + (65 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Dubai Downtown", city: "Dubai", country: "AE", coordinates: { latitude: 25.2048, longitude: 55.2708 }, measurements: [{ parameter: "pm25", value: Math.round(7 + (42 * historicalMultiplier)), unit: "µg/m³" }] },

    // Северная Америка (15 станций)
    { location: "New York Downtown", city: "New York", country: "US", coordinates: { latitude: 40.7128, longitude: -74.0060 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (15 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Los Angeles Urban", city: "Los Angeles", country: "US", coordinates: { latitude: 34.0522, longitude: -118.2437 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (20 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Chicago Center", city: "Chicago", country: "US", coordinates: { latitude: 41.8781, longitude: -87.6298 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (16 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Toronto Downtown", city: "Toronto", country: "CA", coordinates: { latitude: 43.6532, longitude: -79.3832 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (12 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Vancouver City", city: "Vancouver", country: "CA", coordinates: { latitude: 49.2827, longitude: -123.1207 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (10 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Mexico City Urban", city: "Mexico City", country: "MX", coordinates: { latitude: 19.4326, longitude: -99.1332 }, measurements: [{ parameter: "pm25", value: Math.round(8 + (45 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Miami Beach", city: "Miami", country: "US", coordinates: { latitude: 25.7617, longitude: -80.1918 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (11 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Seattle Downtown", city: "Seattle", country: "US", coordinates: { latitude: 47.6062, longitude: -122.3321 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (13 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Boston Center", city: "Boston", country: "US", coordinates: { latitude: 42.3601, longitude: -71.0589 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (14 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "San Francisco", city: "San Francisco", country: "US", coordinates: { latitude: 37.7749, longitude: -122.4194 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (12 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Washington DC", city: "Washington", country: "US", coordinates: { latitude: 38.9072, longitude: -77.0369 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (14 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Atlanta Urban", city: "Atlanta", country: "US", coordinates: { latitude: 33.7490, longitude: -84.3880 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (17 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Denver Downtown", city: "Denver", country: "US", coordinates: { latitude: 39.7392, longitude: -104.9903 }, measurements: [{ parameter: "pm25", value: Math.round(3 + (16 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Montreal City", city: "Montreal", country: "CA", coordinates: { latitude: 45.5017, longitude: -73.5673 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (13 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Calgary Urban", city: "Calgary", country: "CA", coordinates: { latitude: 51.0447, longitude: -114.0719 }, measurements: [{ parameter: "pm25", value: Math.round(2 + (11 * historicalMultiplier)), unit: "µg/m³" }] },

    // Южная Америка (5 станций)
    { location: "Sao Paulo Urban", city: "Sao Paulo", country: "BR", coordinates: { latitude: -23.5505, longitude: -46.6333 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (30 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Rio de Janeiro", city: "Rio de Janeiro", country: "BR", coordinates: { latitude: -22.9068, longitude: -43.1729 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (28 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Buenos Aires", city: "Buenos Aires", country: "AR", coordinates: { latitude: -34.6037, longitude: -58.3816 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (22 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Lima Downtown", city: "Lima", country: "PE", coordinates: { latitude: -12.0464, longitude: -77.0428 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (35 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Bogota Urban", city: "Bogota", country: "CO", coordinates: { latitude: 4.7110, longitude: -74.0721 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (32 * historicalMultiplier)), unit: "µg/m³" }] },

    // Африка (5 станций)
    { location: "Cairo Center", city: "Cairo", country: "EG", coordinates: { latitude: 30.0444, longitude: 31.2357 }, measurements: [{ parameter: "pm25", value: Math.round(8 + (60 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Lagos Urban", city: "Lagos", country: "NG", coordinates: { latitude: 6.5244, longitude: 3.3792 }, measurements: [{ parameter: "pm25", value: Math.round(7 + (55 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Johannesburg", city: "Johannesburg", country: "ZA", coordinates: { latitude: -26.2041, longitude: 28.0473 }, measurements: [{ parameter: "pm25", value: Math.round(6 + (40 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Nairobi Downtown", city: "Nairobi", country: "KE", coordinates: { latitude: -1.2921, longitude: 36.8219 }, measurements: [{ parameter: "pm25", value: Math.round(5 + (45 * historicalMultiplier)), unit: "µg/m³" }] },
    { location: "Casablanca Urban", city: "Casablanca", country: "MA", coordinates: { latitude: 33.5731, longitude: -7.5898 }, measurements: [{ parameter: "pm25", value: Math.round(4 + (35 * historicalMultiplier)), unit: "µg/m³" }] }
  ];

  // Глобальные параметры качества воздуха для года
  const globalParams = {
    co2: Math.round(280 + (140 * historicalMultiplier)),
    so2: Math.round(10 + (60 * historicalMultiplier)),
    no2: Math.round(5 + (45 * historicalMultiplier)),
    quality: getAirQualityByYear(year)
  };

  return {
    data: historicalStations,
    year: year,
    timestamp: Date.now(),
    source: 'Historical Data',
    historicalMultiplier: historicalMultiplier,
    globalParameters: globalParams,
    description: `Исторические данные качества воздуха за ${year} год`,
    totalStations: historicalStations.length
  };
}

function getAirQualityByYear(year) {
  if (year < 1850) return "excellent";
  if (year < 1900) return "good";
  if (year < 1950) return "moderate";
  if (year < 1980) return "poor";
  if (year < 2000) return "very-poor";
  return "poor"; // Современный период
}
