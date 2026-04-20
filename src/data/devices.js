export const devices = [
  // ── NORTH AMERICA – United States ──
  { id: 'd001', name: 'NY-Branch-01',  type: 'SmartBranch', status: 'online',  lat: 40.7128,  lng: -74.0060,  region: 'North America', country: 'United States', city: 'New York',      bandwidth: '1Gbps',   uptime: '99.9%' },
  { id: 'd002', name: 'NY-Branch-02',  type: 'SmartBranch', status: 'online',  lat: 40.7589,  lng: -73.9851,  region: 'North America', country: 'United States', city: 'New York',      bandwidth: '500Mbps', uptime: '99.7%' },
  { id: 'd003', name: 'NY-Hub-01',     type: 'Hub',         status: 'online',  lat: 40.6501,  lng: -74.0096,  region: 'North America', country: 'United States', city: 'New York',      bandwidth: '10Gbps',  uptime: '99.99%' },
  { id: 'd004', name: 'LA-Branch-01',  type: 'SmartBranch', status: 'online',  lat: 34.0522,  lng: -118.2437, region: 'North America', country: 'United States', city: 'Los Angeles',   bandwidth: '1Gbps',   uptime: '99.5%' },
  { id: 'd005', name: 'LA-Branch-02',  type: 'SmartBranch', status: 'warning', lat: 34.0195,  lng: -118.4912, region: 'North America', country: 'United States', city: 'Los Angeles',   bandwidth: '500Mbps', uptime: '97.2%' },
  { id: 'd006', name: 'LA-Hub-01',     type: 'Hub',         status: 'online',  lat: 33.9425,  lng: -118.4081, region: 'North America', country: 'United States', city: 'Los Angeles',   bandwidth: '10Gbps',  uptime: '99.9%' },
  { id: 'd007', name: 'CHI-Branch-01', type: 'SmartBranch', status: 'online',  lat: 41.8781,  lng: -87.6298,  region: 'North America', country: 'United States', city: 'Chicago',       bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd008', name: 'CHI-Branch-02', type: 'SmartBranch', status: 'offline', lat: 41.8327,  lng: -87.6833,  region: 'North America', country: 'United States', city: 'Chicago',       bandwidth: '500Mbps', uptime: '0%' },
  { id: 'd009', name: 'DAL-Branch-01', type: 'SmartBranch', status: 'online',  lat: 32.7767,  lng: -96.7970,  region: 'North America', country: 'United States', city: 'Dallas',        bandwidth: '1Gbps',   uptime: '99.6%' },
  { id: 'd010', name: 'DAL-Branch-02', type: 'SmartBranch', status: 'online',  lat: 32.8141,  lng: -96.9489,  region: 'North America', country: 'United States', city: 'Dallas',        bandwidth: '500Mbps', uptime: '99.4%' },
  { id: 'd011', name: 'SEA-Branch-01', type: 'SmartBranch', status: 'online',  lat: 47.6062,  lng: -122.3321, region: 'North America', country: 'United States', city: 'Seattle',       bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd012', name: 'ATL-Branch-01', type: 'SmartBranch', status: 'online',  lat: 33.7490,  lng: -84.3880,  region: 'North America', country: 'United States', city: 'Atlanta',       bandwidth: '500Mbps', uptime: '99.5%' },
  { id: 'd013', name: 'MIA-Branch-01', type: 'SmartBranch', status: 'online',  lat: 25.7617,  lng: -80.1918,  region: 'North America', country: 'United States', city: 'Miami',         bandwidth: '500Mbps', uptime: '99.3%' },
  { id: 'd014', name: 'BOS-Branch-01', type: 'SmartBranch', status: 'online',  lat: 42.3601,  lng: -71.0589,  region: 'North America', country: 'United States', city: 'Boston',        bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd015', name: 'SFO-Branch-01', type: 'SmartBranch', status: 'online',  lat: 37.7749,  lng: -122.4194, region: 'North America', country: 'United States', city: 'San Francisco', bandwidth: '1Gbps',   uptime: '99.9%' },
  { id: 'd016', name: 'SFO-Branch-02', type: 'SmartBranch', status: 'warning', lat: 37.8044,  lng: -122.2712, region: 'North America', country: 'United States', city: 'San Francisco', bandwidth: '500Mbps', uptime: '96.5%' },
  { id: 'd017', name: 'DEN-Branch-01', type: 'SmartBranch', status: 'online',  lat: 39.7392,  lng: -104.9903, region: 'North America', country: 'United States', city: 'Denver',        bandwidth: '500Mbps', uptime: '99.4%' },
  { id: 'd018', name: 'PHX-Branch-01', type: 'SmartBranch', status: 'online',  lat: 33.4484,  lng: -112.0740, region: 'North America', country: 'United States', city: 'Phoenix',       bandwidth: '500Mbps', uptime: '99.6%' },

  // ── NORTH AMERICA – Canada ──
  { id: 'd019', name: 'TOR-Branch-01', type: 'SmartBranch', status: 'online',  lat: 43.6532,  lng: -79.3832,  region: 'North America', country: 'Canada', city: 'Toronto',   bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd020', name: 'TOR-Branch-02', type: 'SmartBranch', status: 'online',  lat: 43.7000,  lng: -79.4163,  region: 'North America', country: 'Canada', city: 'Toronto',   bandwidth: '500Mbps', uptime: '99.5%' },
  { id: 'd021', name: 'VAN-Branch-01', type: 'SmartBranch', status: 'online',  lat: 49.2827,  lng: -123.1207, region: 'North America', country: 'Canada', city: 'Vancouver', bandwidth: '500Mbps', uptime: '99.3%' },
  { id: 'd022', name: 'MTL-Branch-01', type: 'SmartBranch', status: 'online',  lat: 45.5017,  lng: -73.5673,  region: 'North America', country: 'Canada', city: 'Montreal',  bandwidth: '500Mbps', uptime: '99.6%' },

  // ── LATIN AMERICA ──
  { id: 'd023', name: 'MEX-Branch-01', type: 'SmartBranch', status: 'online',  lat: 19.4326,  lng: -99.1332,  region: 'Latin America', country: 'Mexico',    city: 'Mexico City',   bandwidth: '500Mbps', uptime: '99.1%' },
  { id: 'd024', name: 'MEX-Branch-02', type: 'SmartBranch', status: 'warning', lat: 19.4000,  lng: -99.1500,  region: 'Latin America', country: 'Mexico',    city: 'Mexico City',   bandwidth: '200Mbps', uptime: '95.8%' },
  { id: 'd025', name: 'SAO-Hub-01',    type: 'Hub',         status: 'online',  lat: -23.5505, lng: -46.6333,  region: 'Latin America', country: 'Brazil',    city: 'Sao Paulo',     bandwidth: '10Gbps',  uptime: '99.9%' },
  { id: 'd026', name: 'SAO-Branch-01', type: 'SmartBranch', status: 'online',  lat: -23.5800, lng: -46.6500,  region: 'Latin America', country: 'Brazil',    city: 'Sao Paulo',     bandwidth: '1Gbps',   uptime: '99.6%' },
  { id: 'd027', name: 'RIO-Branch-01', type: 'SmartBranch', status: 'online',  lat: -22.9068, lng: -43.1729,  region: 'Latin America', country: 'Brazil',    city: 'Rio de Janeiro',bandwidth: '500Mbps', uptime: '99.3%' },
  { id: 'd028', name: 'BOG-Branch-01', type: 'SmartBranch', status: 'online',  lat: 4.7110,   lng: -74.0721,  region: 'Latin America', country: 'Colombia',  city: 'Bogota',        bandwidth: '500Mbps', uptime: '99.1%' },
  { id: 'd029', name: 'LIM-Branch-01', type: 'SmartBranch', status: 'online',  lat: -12.0464, lng: -77.0428,  region: 'Latin America', country: 'Peru',      city: 'Lima',          bandwidth: '200Mbps', uptime: '98.9%' },
  { id: 'd030', name: 'BUE-Branch-01', type: 'SmartBranch', status: 'warning', lat: -34.6037, lng: -58.3816,  region: 'Latin America', country: 'Argentina', city: 'Buenos Aires',  bandwidth: '500Mbps', uptime: '95.4%' },
  { id: 'd031', name: 'SCL-Branch-01', type: 'SmartBranch', status: 'online',  lat: -33.4489, lng: -70.6693,  region: 'Latin America', country: 'Chile',     city: 'Santiago',      bandwidth: '500Mbps', uptime: '99.2%' },

  // ── EUROPE ──
  { id: 'd032', name: 'LON-Branch-01', type: 'SmartBranch', status: 'online',  lat: 51.5074,  lng: -0.1278,   region: 'Europe', country: 'United Kingdom', city: 'London',     bandwidth: '1Gbps',   uptime: '99.9%' },
  { id: 'd033', name: 'LON-Branch-02', type: 'SmartBranch', status: 'online',  lat: 51.5155,  lng: -0.0922,   region: 'Europe', country: 'United Kingdom', city: 'London',     bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd034', name: 'LON-Hub-01',    type: 'Hub',         status: 'online',  lat: 51.4700,  lng: -0.4543,   region: 'Europe', country: 'United Kingdom', city: 'London',     bandwidth: '10Gbps',  uptime: '99.99%' },
  { id: 'd035', name: 'PAR-Branch-01', type: 'SmartBranch', status: 'online',  lat: 48.8566,  lng: 2.3522,    region: 'Europe', country: 'France',         city: 'Paris',      bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd036', name: 'PAR-Branch-02', type: 'SmartBranch', status: 'online',  lat: 48.8799,  lng: 2.3550,    region: 'Europe', country: 'France',         city: 'Paris',      bandwidth: '500Mbps', uptime: '99.5%' },
  { id: 'd037', name: 'FRA-Hub-01',    type: 'Hub',         status: 'online',  lat: 50.1109,  lng: 8.6821,    region: 'Europe', country: 'Germany',        city: 'Frankfurt',  bandwidth: '10Gbps',  uptime: '99.99%' },
  { id: 'd038', name: 'FRA-Branch-01', type: 'SmartBranch', status: 'online',  lat: 50.1055,  lng: 8.6921,    region: 'Europe', country: 'Germany',        city: 'Frankfurt',  bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd039', name: 'BER-Branch-01', type: 'SmartBranch', status: 'online',  lat: 52.5200,  lng: 13.4050,   region: 'Europe', country: 'Germany',        city: 'Berlin',     bandwidth: '1Gbps',   uptime: '99.6%' },
  { id: 'd040', name: 'AMS-Branch-01', type: 'SmartBranch', status: 'online',  lat: 52.3676,  lng: 4.9041,    region: 'Europe', country: 'Netherlands',    city: 'Amsterdam',  bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd041', name: 'AMS-Branch-02', type: 'SmartBranch', status: 'online',  lat: 52.3200,  lng: 4.9267,    region: 'Europe', country: 'Netherlands',    city: 'Amsterdam',  bandwidth: '500Mbps', uptime: '99.5%' },
  { id: 'd042', name: 'MAD-Branch-01', type: 'SmartBranch', status: 'online',  lat: 40.4168,  lng: -3.7038,   region: 'Europe', country: 'Spain',          city: 'Madrid',     bandwidth: '500Mbps', uptime: '99.4%' },
  { id: 'd043', name: 'MIL-Branch-01', type: 'SmartBranch', status: 'warning', lat: 45.4642,  lng: 9.1900,    region: 'Europe', country: 'Italy',          city: 'Milan',      bandwidth: '500Mbps', uptime: '96.1%' },
  { id: 'd044', name: 'STO-Branch-01', type: 'SmartBranch', status: 'online',  lat: 59.3293,  lng: 18.0686,   region: 'Europe', country: 'Sweden',         city: 'Stockholm',  bandwidth: '500Mbps', uptime: '99.6%' },
  { id: 'd045', name: 'ZUR-Branch-01', type: 'SmartBranch', status: 'online',  lat: 47.3769,  lng: 8.5417,    region: 'Europe', country: 'Switzerland',    city: 'Zurich',     bandwidth: '1Gbps',   uptime: '99.9%' },
  { id: 'd046', name: 'WAR-Branch-01', type: 'SmartBranch', status: 'online',  lat: 52.2297,  lng: 21.0122,   region: 'Europe', country: 'Poland',         city: 'Warsaw',     bandwidth: '500Mbps', uptime: '99.3%' },

  // ── MIDDLE EAST ──
  { id: 'd047', name: 'DXB-Hub-01',    type: 'Hub',         status: 'online',  lat: 25.2048,  lng: 55.2708,   region: 'Middle East', country: 'UAE',          city: 'Dubai',       bandwidth: '10Gbps',  uptime: '99.99%' },
  { id: 'd048', name: 'DXB-Branch-01', type: 'SmartBranch', status: 'online',  lat: 25.1972,  lng: 55.2744,   region: 'Middle East', country: 'UAE',          city: 'Dubai',       bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd049', name: 'DXB-Branch-02', type: 'SmartBranch', status: 'online',  lat: 25.2500,  lng: 55.3500,   region: 'Middle East', country: 'UAE',          city: 'Dubai',       bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd050', name: 'AUH-Branch-01', type: 'SmartBranch', status: 'online',  lat: 24.4539,  lng: 54.3773,   region: 'Middle East', country: 'UAE',          city: 'Abu Dhabi',   bandwidth: '500Mbps', uptime: '99.5%' },
  { id: 'd051', name: 'RUH-Branch-01', type: 'SmartBranch', status: 'online',  lat: 24.7136,  lng: 46.6753,   region: 'Middle East', country: 'Saudi Arabia', city: 'Riyadh',      bandwidth: '1Gbps',   uptime: '99.4%' },
  { id: 'd052', name: 'RUH-Branch-02', type: 'SmartBranch', status: 'warning', lat: 24.7500,  lng: 46.7000,   region: 'Middle East', country: 'Saudi Arabia', city: 'Riyadh',      bandwidth: '500Mbps', uptime: '94.3%' },
  { id: 'd053', name: 'TLV-Branch-01', type: 'SmartBranch', status: 'online',  lat: 32.0853,  lng: 34.7818,   region: 'Middle East', country: 'Israel',       city: 'Tel Aviv',    bandwidth: '1Gbps',   uptime: '99.6%' },
  { id: 'd054', name: 'IST-Branch-01', type: 'SmartBranch', status: 'online',  lat: 41.0082,  lng: 28.9784,   region: 'Middle East', country: 'Turkey',       city: 'Istanbul',    bandwidth: '1Gbps',   uptime: '99.5%' },
  { id: 'd055', name: 'IST-Branch-02', type: 'SmartBranch', status: 'online',  lat: 41.0500,  lng: 28.9833,   region: 'Middle East', country: 'Turkey',       city: 'Istanbul',    bandwidth: '500Mbps', uptime: '99.3%' },
  { id: 'd056', name: 'KWI-Branch-01', type: 'SmartBranch', status: 'online',  lat: 29.3759,  lng: 47.9774,   region: 'Middle East', country: 'Kuwait',       city: 'Kuwait City', bandwidth: '500Mbps', uptime: '99.1%' },

  // ── ASIA-PACIFIC – India ──
  { id: 'd057', name: 'MUM-Hub-01',    type: 'Hub',         status: 'online',  lat: 19.0760,  lng: 72.8777,   region: 'Asia-Pacific', country: 'India',        city: 'Mumbai',        bandwidth: '10Gbps',  uptime: '99.95%' },
  { id: 'd058', name: 'MUM-Branch-01', type: 'SmartBranch', status: 'online',  lat: 19.1000,  lng: 72.9000,   region: 'Asia-Pacific', country: 'India',        city: 'Mumbai',        bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd059', name: 'MUM-Branch-02', type: 'SmartBranch', status: 'online',  lat: 19.0500,  lng: 72.8500,   region: 'Asia-Pacific', country: 'India',        city: 'Mumbai',        bandwidth: '500Mbps', uptime: '99.5%' },
  { id: 'd060', name: 'DEL-Branch-01', type: 'SmartBranch', status: 'online',  lat: 28.6139,  lng: 77.2090,   region: 'Asia-Pacific', country: 'India',        city: 'Delhi',         bandwidth: '1Gbps',   uptime: '99.4%' },
  { id: 'd061', name: 'DEL-Branch-02', type: 'SmartBranch', status: 'warning', lat: 28.6500,  lng: 77.2500,   region: 'Asia-Pacific', country: 'India',        city: 'Delhi',         bandwidth: '500Mbps', uptime: '95.2%' },
  { id: 'd062', name: 'BLR-Branch-01', type: 'SmartBranch', status: 'online',  lat: 12.9716,  lng: 77.5946,   region: 'Asia-Pacific', country: 'India',        city: 'Bangalore',     bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd063', name: 'BLR-Branch-02', type: 'SmartBranch', status: 'online',  lat: 12.9500,  lng: 77.6000,   region: 'Asia-Pacific', country: 'India',        city: 'Bangalore',     bandwidth: '500Mbps', uptime: '99.6%' },

  // ── ASIA-PACIFIC – Southeast / East Asia ──
  { id: 'd064', name: 'SIN-Hub-01',    type: 'Hub',         status: 'online',  lat: 1.3521,   lng: 103.8198,  region: 'Asia-Pacific', country: 'Singapore',    city: 'Singapore',     bandwidth: '10Gbps',  uptime: '99.99%' },
  { id: 'd065', name: 'SIN-Branch-01', type: 'SmartBranch', status: 'online',  lat: 1.3000,   lng: 103.8000,  region: 'Asia-Pacific', country: 'Singapore',    city: 'Singapore',     bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd066', name: 'SIN-Branch-02', type: 'SmartBranch', status: 'online',  lat: 1.3800,   lng: 103.8500,  region: 'Asia-Pacific', country: 'Singapore',    city: 'Singapore',     bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd067', name: 'TYO-Hub-01',    type: 'Hub',         status: 'online',  lat: 35.6762,  lng: 139.6503,  region: 'Asia-Pacific', country: 'Japan',        city: 'Tokyo',         bandwidth: '10Gbps',  uptime: '99.99%' },
  { id: 'd068', name: 'TYO-Branch-01', type: 'SmartBranch', status: 'online',  lat: 35.6895,  lng: 139.6917,  region: 'Asia-Pacific', country: 'Japan',        city: 'Tokyo',         bandwidth: '1Gbps',   uptime: '99.9%' },
  { id: 'd069', name: 'TYO-Branch-02', type: 'SmartBranch', status: 'online',  lat: 35.6600,  lng: 139.7300,  region: 'Asia-Pacific', country: 'Japan',        city: 'Tokyo',         bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd070', name: 'OSA-Branch-01', type: 'SmartBranch', status: 'online',  lat: 34.6937,  lng: 135.5023,  region: 'Asia-Pacific', country: 'Japan',        city: 'Osaka',         bandwidth: '500Mbps', uptime: '99.7%' },
  { id: 'd071', name: 'SEO-Branch-01', type: 'SmartBranch', status: 'online',  lat: 37.5665,  lng: 126.9780,  region: 'Asia-Pacific', country: 'South Korea',  city: 'Seoul',         bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd072', name: 'SEO-Branch-02', type: 'SmartBranch', status: 'online',  lat: 37.5000,  lng: 127.0000,  region: 'Asia-Pacific', country: 'South Korea',  city: 'Seoul',         bandwidth: '500Mbps', uptime: '99.6%' },
  { id: 'd073', name: 'SHA-Branch-01', type: 'SmartBranch', status: 'online',  lat: 31.2304,  lng: 121.4737,  region: 'Asia-Pacific', country: 'China',        city: 'Shanghai',      bandwidth: '1Gbps',   uptime: '99.5%' },
  { id: 'd074', name: 'HKG-Branch-01', type: 'SmartBranch', status: 'online',  lat: 22.3193,  lng: 114.1694,  region: 'Asia-Pacific', country: 'Hong Kong',    city: 'Hong Kong',     bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd075', name: 'HKG-Branch-02', type: 'SmartBranch', status: 'warning', lat: 22.3500,  lng: 114.1500,  region: 'Asia-Pacific', country: 'Hong Kong',    city: 'Hong Kong',     bandwidth: '500Mbps', uptime: '97.3%' },
  { id: 'd076', name: 'KUL-Branch-01', type: 'SmartBranch', status: 'online',  lat: 3.1390,   lng: 101.6869,  region: 'Asia-Pacific', country: 'Malaysia',     city: 'Kuala Lumpur',  bandwidth: '500Mbps', uptime: '99.4%' },
  { id: 'd077', name: 'BKK-Branch-01', type: 'SmartBranch', status: 'online',  lat: 13.7563,  lng: 100.5018,  region: 'Asia-Pacific', country: 'Thailand',     city: 'Bangkok',       bandwidth: '500Mbps', uptime: '99.3%' },

  // ── ASIA-PACIFIC – Australia ──
  { id: 'd078', name: 'SYD-Hub-01',    type: 'Hub',         status: 'online',  lat: -33.8688, lng: 151.2093,  region: 'Asia-Pacific', country: 'Australia',    city: 'Sydney',        bandwidth: '10Gbps',  uptime: '99.95%' },
  { id: 'd079', name: 'SYD-Branch-01', type: 'SmartBranch', status: 'online',  lat: -33.8500, lng: 151.2000,  region: 'Asia-Pacific', country: 'Australia',    city: 'Sydney',        bandwidth: '1Gbps',   uptime: '99.8%' },
  { id: 'd080', name: 'SYD-Branch-02', type: 'SmartBranch', status: 'online',  lat: -33.9000, lng: 151.2200,  region: 'Asia-Pacific', country: 'Australia',    city: 'Sydney',        bandwidth: '500Mbps', uptime: '99.6%' },
  { id: 'd081', name: 'MEL-Branch-01', type: 'SmartBranch', status: 'online',  lat: -37.8136, lng: 144.9631,  region: 'Asia-Pacific', country: 'Australia',    city: 'Melbourne',     bandwidth: '1Gbps',   uptime: '99.7%' },
  { id: 'd082', name: 'MEL-Branch-02', type: 'SmartBranch', status: 'online',  lat: -37.8400, lng: 144.9600,  region: 'Asia-Pacific', country: 'Australia',    city: 'Melbourne',     bandwidth: '500Mbps', uptime: '99.5%' },

  // ── AFRICA ──
  { id: 'd083', name: 'JNB-Branch-01', type: 'SmartBranch', status: 'online',  lat: -26.2041, lng: 28.0473,   region: 'Africa', country: 'South Africa', city: 'Johannesburg', bandwidth: '500Mbps', uptime: '99.2%' },
  { id: 'd084', name: 'JNB-Branch-02', type: 'SmartBranch', status: 'warning', lat: -26.2500, lng: 28.0500,   region: 'Africa', country: 'South Africa', city: 'Johannesburg', bandwidth: '200Mbps', uptime: '93.5%' },
  { id: 'd085', name: 'CAI-Branch-01', type: 'SmartBranch', status: 'online',  lat: 30.0444,  lng: 31.2357,   region: 'Africa', country: 'Egypt',        city: 'Cairo',        bandwidth: '500Mbps', uptime: '99.0%' },
  { id: 'd086', name: 'LOS-Branch-01', type: 'SmartBranch', status: 'online',  lat: 6.5244,   lng: 3.3792,    region: 'Africa', country: 'Nigeria',      city: 'Lagos',        bandwidth: '200Mbps', uptime: '98.5%' },
  { id: 'd087', name: 'NBO-Branch-01', type: 'SmartBranch', status: 'offline', lat: -1.2921,  lng: 36.8219,   region: 'Africa', country: 'Kenya',        city: 'Nairobi',      bandwidth: '200Mbps', uptime: '0%' },
]

export const regionSummary = devices.reduce((acc, d) => {
  if (!acc[d.region]) acc[d.region] = { total: 0, online: 0, offline: 0, warning: 0, countries: new Set() }
  acc[d.region].total++
  acc[d.region][d.status]++
  acc[d.region].countries.add(d.country)
  return acc
}, {})

export const statusTotals = devices.reduce(
  (acc, d) => { acc[d.status]++; return acc },
  { online: 0, offline: 0, warning: 0 }
)
