import { supabase } from './client.js';

async function seed() {
  console.log('Starting seed...');

  const samplePapers = [
    {
      title: 'The Ruling on Cryptocurrency and Digital Currencies',
      content: 'Based on the principles of Islamic finance, cryptocurrency must be evaluated against the criteria of being a legitimate medium of exchange...',
      source: 'islamqa',
      url: 'https://islamqa.info/en/answers/123456',
      author: 'Muhammad Salih Al-Munajjid',
      fatwaNumber: '123456',
      publishedAt: '2023-01-01',
      language: 'en',
    },
    {
      title: 'Smart Contracts in Islamic Finance: A Shariah Perspective',
      content: 'Smart contracts that operate on blockchain technology can be permissible in Islam if they meet the requirements of a valid contract...',
      source: 'darulifta',
      url: 'https://darulifta-deoband.com/fatwa/789',
      author: 'Darul Ifta Deoband',
      fatwaNumber: '789',
      publishedAt: '2023-06-15',
      language: 'en',
    },
  ];

  const { error } = await supabase.from('Paper').upsert(samplePapers, { onConflict: 'url' });
  if (error) throw error;

  console.log('Seed completed!');
}

seed().catch((e) => { console.error(e); process.exit(1); });
