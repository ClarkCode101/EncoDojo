/**
 * Building blocks for FAKE Philippine-style records.
 *
 * These are common names and place names, combined at random, so no output
 * refers to a real person or real record. ASCII only (no "n" with tilde) so
 * everything can be typed on a normal keyboard.
 */

export const femaleFirstNames = [
  'Maria Luisa', 'Kristine', 'Angelica', 'Rowena', 'Jocelyn', 'Liza', 'Hazel Anne', 'Rosario',
  'Mary Grace', 'Josefina', 'Maricel', 'Lorna', 'Jennylyn', 'Remedios', 'Ana Patricia',
  'Cristina', 'Aileen', 'Marites', 'Divina', 'Rhea Mae', 'Shiela', 'Kimberly', 'Princess',
];

export const maleFirstNames = [
  'Juan Paolo', 'Jose Emmanuel', 'Mark Anthony', 'Christian John', 'Ramon', 'Danilo', 'Rodel',
  'Jericho', 'Kevin', 'Ronaldo', 'John Carlo', 'Bernardo', 'Arnel', 'Rogelio', 'Jomar',
  'Reynaldo', 'Michael Angelo', 'Jayson', 'Efren', 'Noel', 'Carlo Miguel', 'Dennis',
];

export const surnames = [
  'Dela Cruz', 'De la Cruz', 'Santos', 'Reyes', 'Bautista', 'Garcia', 'Mendoza', 'Villanueva',
  'Soriano', 'Tolentino', 'Magbanua', 'Ocampo', 'Manalastas', 'Dimaculangan', 'Buenaventura',
  'Gatchalian', 'Pacheco', 'Castillo', 'Aquino', 'Dela Rosa', 'De Guzman', 'Pangilinan',
  'Macaraeg', 'Sarmiento', 'Evangelista', 'Del Rosario', 'Cabrera', 'Lacson', 'Salvador',
];

export const suffixes = ['Jr.', 'Sr.', 'II', 'III'];

export const titles = ['Mr.', 'Ms.', 'Engr.', 'Atty.', 'Dr.'];

export const barangays = [
  'San Roque', 'Poblacion', 'Bagong Silang', 'San Isidro', 'Santo Nino', 'Mabini',
  'San Antonio', 'Malinta', 'Bagumbayan', 'San Jose', 'Kamputhaw', 'Lahug', 'Maligaya',
  'Poblacion Norte', 'Sta. Cruz', 'Bucal', 'Pinagsama', 'Tabing Ilog',
];

export const sitios = ['Malinis', 'Kawayanan', 'Ilaya', 'Centro', 'Riverside', 'Mangga', 'Bukid'];

export const subdivisions = [
  'Mabuhay Homes', 'Villa Esperanza', 'Greenfields Subd.', 'Camella Homes', 'Sunrise Village',
  'Bria Homes', 'Lessandra Heights', 'St. Joseph Village',
];

export const streets = [
  'Rizal', 'Mabini', 'Bonifacio', 'Luna', 'Del Pilar', 'Burgos', 'Aguinaldo', 'Quezon',
  'Magsaysay', 'Osmena', 'Roxas', 'Jacinto', 'Gomez', 'Recto',
];

/** [city, province] pairs */
export const cities: [string, string][] = [
  ['Tanauan City', 'Batangas'],
  ['Lipa City', 'Batangas'],
  ['Malaybalay City', 'Bukidnon'],
  ['Paniqui', 'Tarlac'],
  ['Cebu City', 'Cebu'],
  ['Mandaue City', 'Cebu'],
  ['Iloilo City', 'Iloilo'],
  ['Calamba City', 'Laguna'],
  ['San Pablo City', 'Laguna'],
  ['Malolos City', 'Bulacan'],
  ['San Fernando City', 'Pampanga'],
  ['Dagupan City', 'Pangasinan'],
  ['Tagum City', 'Davao del Norte'],
  ['Naga City', 'Camarines Sur'],
  ['Tacloban City', 'Leyte'],
  ['Cabanatuan City', 'Nueva Ecija'],
];

export const companies = [
  'Northstar Trading', 'Bayanihan Logistics', 'Pinoy Office Supply', 'Golden Harvest Foods',
  'Silangan Hardware', 'Luzviminda Printing', 'Tala Freight Services', 'Kalinga Pharma Distributors',
];

/** [name, unit, min price, max price] in pesos */
export const officeItems: [string, string, number, number][] = [
  ['bond paper', 'reams', 180, 320],
  ['ballpen', 'boxes', 60, 150],
  ['stapler', 'units', 120, 450],
  ['folder', 'packs', 45, 120],
  ['printer ink', 'bottles', 250, 680],
  ['correction tape', 'pcs', 35, 90],
  ['envelope', 'packs', 55, 140],
  ['logbook', 'pcs', 70, 190],
  ['sticky notes', 'pads', 25, 80],
  ['USB flash drive', 'units', 280, 750],
];

// ---------- Level 1 vocabulary (plain office sentences) ----------

export const documents = [
  'application form', 'delivery receipt', 'payroll sheet', 'inventory report', 'billing statement',
  'request form', 'time card', 'purchase order', 'service report', 'incident report',
  'membership form', 'leave form',
];

export const teams = ['records', 'billing', 'payroll', 'encoding', 'quality check', 'processing', 'admin'];

export const periods = ['shift', 'day', 'week', 'month'];
