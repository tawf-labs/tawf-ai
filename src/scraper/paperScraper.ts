import type { Browser } from 'playwright';
import * as cheerio from 'cheerio';
import type { FatwaSource, Paper } from '../types/paper.js';
import { config } from '../config.js';

export class PaperScraper {
  /**
   * Scrape papers from a source
   */
  async scrape(browser: Browser, source: FatwaSource): Promise<Paper[]> {
    const page = await browser.newPage();
    const papers: Paper[] = [];

    try {
      // Set user agent
      await page.setExtraHTTPHeaders({
        'User-Agent': config.scraper.userAgent,
      });

      // Navigate to base URL
      await page.goto(source.baseUrl, {
        waitUntil: 'networkidle',
        timeout: config.scraper.timeoutMs,
      });

      // Find paper links
      const links = await this.extractPaperLinks(page, source);

      // Scrape each paper
      for (let i = 0; i < Math.min(links.length, config.scraper.maxPages); i++) {
        try {
          const paper = await this.scrapePaper(browser, links[i], source);
          if (paper) {
            papers.push(paper);
          }

          // Delay between requests
          if (i < links.length - 1) {
            await this.delay(config.scraper.delayMs);
          }
        } catch (error) {
          console.error(`Failed to scrape paper at ${links[i]}:`, error);
        }
      }
    } finally {
      await page.close();
    }

    return papers;
  }

  /**
   * Extract paper links from a page
   */
  private async extractPaperLinks(page: any, source: FatwaSource): Promise<string[]> {
    // Get all links from the page
    const links: string[] = [];

    const hrefs = await page.$$eval('a[href]', (elements: any) =>
      Array.from(elements).map((el: any) => el.href)
    );

    for (const href of hrefs) {
      // Filter by URL pattern if provided
      if (source.urlPattern) {
        if (source.urlPattern.test(href)) {
          links.push(href);
        }
      } else {
        // Add links from the same domain
        if (href.startsWith(source.baseUrl)) {
          links.push(href);
        }
      }
    }

    // Remove duplicates
    return [...new Set(links)];
  }

  /**
   * Scrape a single paper
   */
  private async scrapePaper(
    browser: Browser,
    url: string,
    source: FatwaSource
  ): Promise<Paper | null> {
    const page = await browser.newPage();

    try {
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: config.scraper.timeoutMs,
      });

      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract title
      const title = $(source.titleSelector).first().text().trim();

      // Extract content
      let content = $(source.contentSelector).text().trim();

      // Clean up content
      content = this.cleanContent(content);

      if (!title || content.length < 100) {
        return null;
      }

      return {
        id: '', // Will be generated
        title,
        content,
        source: source.name,
        url,
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  /**
   * Clean and normalize content
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const paperScraper = new PaperScraper();
