import fs from 'fs';
import path from 'path';
import prisma from './lib/prisma.js';

// Basic CSV row parser that handles commas inside quotes
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

async function importCSV() {
  const csvPath = path.resolve('leads.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(' File "leads.csv" not found in D:\\CRM\\backend!');
    console.log('👉 Please download your Google Sheet as CSV and save it as "leads.csv" inside D:\\CRM\\backend');
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);

  if (rows.length < 2) {
    console.log('CSV is empty or only contains headers.');
    return;
  }

  const headers = rows[0];
  console.log('CSV Headers found:', headers);
  console.log(`Found ${rows.length - 1} student rows. Starting database import...`);

  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const fullName = row[1] || 'Unknown Student';
    const email = row[2] && row[2].includes('@') ? row[2] : null;
    const phone = row[3] || 'No phone provided';
    const city = row[4] || null;
    const company = row[6] || null;
    const courseInterest = row[8] || 'CIPS Qualifications';

    // Duplicate check
    let existing = null;
    if (phone && phone !== 'No phone provided') {
      existing = await prisma.lead.findFirst({ where: { phone } });
    }
    if (!existing && email) {
      existing = await prisma.lead.findFirst({ where: { email } });
    }

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.lead.create({
      data: {
        fullName,
        email,
        phone,
        city,
        company,
        courseInterest,
        source: 'Google Form (CIPS)',
        status: 'NEW',
      },
    });

    imported++;
  }

  console.log(`\n IMPORT COMPLETE!`);
  console.log(` Successfully imported: ${imported} students`);
  console.log(` Skipped duplicates: ${skipped}`);

  const total = await prisma.lead.count();
  console.log(` Total leads now in PostgreSQL: ${total}`);
}

importCSV()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
