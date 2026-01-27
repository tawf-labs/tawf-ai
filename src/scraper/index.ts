import { Browser, chromium as playwrightChromium } from 'playwright';
import { paperService } from '../services/paper.service.js';
import { fatwaSources } from './fatwa.sources.js';
import { paperScraper } from './paperScraper.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../db/client.js';
import type { FatwaSource } from '../types/paper.js';

export class Scraper {
  private browser: Browser | null = null;
  public sources: FatwaSource[] = [];

  constructor() {
    this.sources = fatwaSources.filter((s) => s.enabled);
  }

  /**
   * Initialize browser
   */
  async init() {
    if (!this.browser) {
      this.browser = await playwrightChromium.launch({
        headless: true,
      });
    }
  }

  /**
   * Close browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape all enabled sources
   */
  async scrapeAll(sources?: string[]) {
    await this.init();

    const sourcesToScrape = sources
      ? this.sources.filter((s) => sources.includes(s.name))
      : this.sources;

    logger.info(`Scraping ${sourcesToScrape.length} sources`);

    const results = await Promise.allSettled(
      sourcesToScrape.map((source) => this.scrapeSource(source))
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    logger.info(`Scraping completed: ${succeeded} succeeded, ${failed} failed`);

    await this.close();
  }

  /**
   * Scrape a single source
   */
  async scrapeSource(source: FatwaSource) {
    logger.info(`Scraping source: ${source.name}`);

    const job = await prisma.scrapeJob.create({
      data: {
        source: source.name,
        status: 'RUNNING',
      },
    });

    try {
      const papers = await paperScraper.scrape(this.browser!, source);

      let storedCount = 0;
      for (const paper of papers) {
        await paperService.upsertPaper(paper);
        storedCount++;
      }

      await prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          papersFound: papers.length,
          papersStored: storedCount,
          completedAt: new Date(),
        },
      });

      logger.info(`Source ${source.name}: ${papers.length} papers found, ${storedCount} stored`);
    } catch (error) {
      await prisma.scrapeJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: String(error),
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * Get active scraping jobs
   */
  async getActiveJobs() {
    return prisma.scrapeJob.findMany({
      where: { status: 'RUNNING' },
    });
  }

  /**
   * Get completed jobs count
   */
  async getCompletedCount() {
    return prisma.scrapeJob.count({
      where: { status: 'COMPLETED' },
    });
  }

  /**
   * Get failed jobs count
   */
  async getFailedCount() {
    return prisma.scrapeJob.count({
      where: { status: 'FAILED' },
    });
  }

  /**
   * Get total papers count
   */
  async getTotalPapers() {
    return prisma.paper.count();
  }
}

export const scraper = new Scraper();
