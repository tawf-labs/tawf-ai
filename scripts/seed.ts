import { prisma } from '../src/db/client.js';

/**
 * Seed database with sample data
 * Run with: npm run db:seed
 */
async function main() {
  console.log('Starting seed...');

  // Create sample papers
  const samplePapers = [
    {
      title: 'The Ruling on Cryptocurrency and Digital Currencies',
      content:
        'Based on the principles of Islamic finance, cryptocurrency must be evaluated against the criteria of being a legitimate medium of exchange...',
      source: 'islamqa',
      url: 'https://islamqa.info/en/answers/123456',
      author: 'Muhammad Salih Al-Munajjid',
      fatwaNumber: '123456',
      publishedAt: new Date('2023-01-01'),
      language: 'en',
    },
    {
      title: 'Smart Contracts in Islamic Finance: A Shariah Perspective',
      content:
        'Smart contracts that operate on blockchain technology can be permissible in Islam if they meet the requirements of a valid contract...',
      source: 'darulifta',
      url: 'https://darulifta-deoband.com/fatwa/789',
      author: 'Darul Ifta Deoband',
      fatwaNumber: '789',
      publishedAt: new Date('2023-06-15'),
      language: 'en',
    },
  ];

  for (const paper of samplePapers) {
    await prisma.paper.upsert({
      where: { url: paper.url },
      update: {},
      create: paper,
    });
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
