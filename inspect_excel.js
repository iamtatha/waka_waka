const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, "FIFA Men's World Cup 2026 Sortable Schedule.xlsx");
const workbook = XLSX.readFile(filePath, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Let's print one full object to see the correct key names
console.log(JSON.stringify(data[0], null, 2));
