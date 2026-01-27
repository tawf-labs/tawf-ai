import type { FatwaSource } from '../types/paper.js';

/**
 * List of Islamic fatwa sources to scrape
 * Add more sources as needed
 */
export const fatwaSources: FatwaSource[] = [
  {
    name: 'islamqa',
    baseUrl: 'https://islamqa.info',
    enabled: true,
    paperSelector: '.fatwa-item',
    titleSelector: '.fatwa-title',
    contentSelector: '.fatwa-content',
    urlPattern: /islamqa\.info\/en\/answers\/\d+/,
  },
  {
    name: 'darulifta',
    baseUrl: 'https://darulifta-deoband.com',
    enabled: true,
    paperSelector: '.answer-item',
    titleSelector: '.answer-title',
    contentSelector: '.answer-content',
    urlPattern: /darulifta-deoband\.com\/fatwa\/\d+/,
  },
  {
    name: 'fatwaonline',
    baseUrl: 'https://fatwaonline.net',
    enabled: false, // Disabled by default
    paperSelector: '.fatwa',
    titleSelector: 'h1, h2',
    contentSelector: '.content',
  },
  {
    name: 'askimam',
    baseUrl: 'https://askimam.org',
    enabled: false,
    paperSelector: '.fatwa-post',
    titleSelector: '.entry-title',
    contentSelector: '.entry-content',
  },
];
