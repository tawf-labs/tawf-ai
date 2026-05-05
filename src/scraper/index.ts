import { Browser, chromium as playwrightChromium } from 'playwright';
import { paperService } from '../services/paper.service.js';
import { embedPaper } from '../embeddings/service.js';
import { fatwaSources } from './fatwa.sources.js';
import { paperScraper } from './paperScraper.js';
import { logger } from '../utils/logger.js';
import { supabase } from '../db/client.js';
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

    const { data: job, error } = await supabase
      .from('ScrapeJob')
      .insert({ source: source.name, status: 'RUNNING' })
      .select('id')
      .single();
    if (error) throw error;

    try {
      const papers = await paperScraper.scrape(this.browser!, source);

      let storedCount = 0;
      for (const paper of papers) {
        const saved = await paperService.upsertPaper(paper);
        try {
          await embedPaper(saved.id);
        } catch (err) {
          logger.warn(`Embedding failed for paper ${saved.id}: ${err}`);
        }
        storedCount++;
      }

      await supabase.from('ScrapeJob').update({
        status: 'COMPLETED',
        papersFound: papers.length,
        papersStored: storedCount,
        completedAt: new Date().toISOString(),
      }).eq('id', job.id);

      logger.info(`Source ${source.name}: ${papers.length} papers found, ${storedCount} stored`);
    } catch (error) {
      await supabase.from('ScrapeJob').update({
        status: 'FAILED',
        error: String(error),
        completedAt: new Date().toISOString(),
      }).eq('id', job.id);
      throw error;
    }
  }

  /**
   * Get active scraping jobs
   */
  async getActiveJobs() {
    const { data } = await supabase.from('ScrapeJob').select('*').eq('status', 'RUNNING');
    return data ?? [];
  }

  async getCompletedCount() {
    const { count } = await supabase.from('ScrapeJob').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
    return count ?? 0;
  }

  async getFailedCount() {
    const { count } = await supabase.from('ScrapeJob').select('*', { count: 'exact', head: true }).eq('status', 'FAILED');
    return count ?? 0;
  }

  async getTotalPapers() {
    const { count } = await supabase.from('Paper').select('*', { count: 'exact', head: true });
    return count ?? 0;
  }
}

export const scraper = new Scraper();
