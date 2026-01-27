import { scraper } from '../src/scraper/index.js';
import { logger } from '../src/utils/logger.js';

/**
 * Manual scraping script
 * Run with: npm run scrape
 */
async function main() {
  logger.info('Starting manual scraping...');

  const args = process.argv.slice(2);
  const sources = args.length > 0 ? args : undefined;

  await scraper.scrapeAll(sources);

  logger.info('Scraping completed!');
  process.exit(0);
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
