import prisma from './lib/prisma.js';

async function main() {
  const count = await prisma.lead.count();
  console.log('--- DATABASE CHECK ---');
  console.log('TOTAL_LEADS_IN_DB:', count);
  if (count > 0) {
    const leads = await prisma.lead.findMany({
      take: 3,
      orderBy: { id: 'desc' },
      select: { id: true, fullName: true, phone: true, email: true, courseInterest: true, source: true }
    });
    console.log('LATEST_LEADS:', JSON.stringify(leads, null, 2));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
