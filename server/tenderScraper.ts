import { storage } from "./storage.ts";
import { InsertTender } from "@shared/schema";
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer';
import { load } from 'cheerio';
import cron from 'node-cron';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  // @ts-ignore
  global.fetch = (...args: any[]) => import('node-fetch').then(mod => mod.default(...args));
}

interface ScrapedTender {
  title: string;
  description: string;
  organization: string;
  category: string;
  location: string;
  budget: number;
  deadline: Date;
  referenceNumber: string;
  requirements: string[];
  contactInfo: string;
  sourceUrl: string;
  source: string;
}

export class TenderScraper {
  private googleAuth: JWT;
  private spreadsheetId: string;
  private browser: Browser | null = null;
  private isInitialized = false;
  private lastScrapeTime: { [key: string]: number } = {};
  private minScrapingInterval = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Initialize Google Sheets authentication
    this.googleAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';
  }
  private async initializePuppeteer() {
    if (!this.browser) {
      console.log('Initializing Puppeteer...');
      this.browser = await puppeteer.launch({
        headless: "new",
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
      this.isInitialized = true;
      console.log('Puppeteer initialized successfully');
    }
  }

  // Rate limiting check
  private canScrape(source: string): boolean {
    const now = Date.now();
    if (!this.lastScrapeTime[source] || (now - this.lastScrapeTime[source]) >= this.minScrapingInterval) {
      this.lastScrapeTime[source] = now;
      return true;
    }
    return false;
  }

  // Scrape from Google Sheets
  async scrapeFromGoogleSheets(): Promise<ScrapedTender[]> {
    const tenders: ScrapedTender[] = [];
    
    if (!this.spreadsheetId) {
      console.log('No Google Sheets ID configured, skipping...');
      return [];
    }

    if (!this.canScrape('sheets')) {
      console.log('Rate limit reached for Google Sheets, skipping...');
      return [];
    }
    
    try {
      console.log('Fetching tenders from Google Sheets...');
      
      const doc = new GoogleSpreadsheet(this.spreadsheetId, this.googleAuth);
      await doc.loadInfo();
      
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();

      for (const row of rows) {
        try {
          const tender: ScrapedTender = {
            title: row.get('Title') || '',
            description: row.get('Description') || '',
            organization: row.get('Organization') || '',
            category: row.get('Category') || '',
            location: row.get('Location') || '',
            budget: parseFloat(row.get('Budget')) || 0,
            deadline: new Date(row.get('Deadline')),
            referenceNumber: row.get('ReferenceNumber') || '',
            requirements: (row.get('Requirements') || '').split(',').map((r: string) => r.trim()),
            contactInfo: row.get('ContactInfo') || '',
            sourceUrl: row.get('SourceUrl') || '',
            source: 'Google Sheets'
          };

          if (tender.title && tender.referenceNumber && !isNaN(tender.deadline.getTime())) {
            tenders.push(tender);
          }
        } catch (error) {
          console.error('Error parsing row:', error);
        }
      }

      console.log(`Successfully fetched ${tenders.length} tenders from Google Sheets`);
      return tenders;
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      return [];
    }
  }

  // Improved web scraping with Puppeteer
  async scrapeMyGovTenders(): Promise<ScrapedTender[]> {
    if (!this.canScrape('mygov')) {
      console.log('Rate limit reached for MyGov, skipping...');
      return [];
    }

    const tenders: ScrapedTender[] = [];
    
    try {
      await this.initializePuppeteer();
      
      if (!this.browser || !this.isInitialized) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the tenders page      console.log('Navigating to MyGov tenders page...');
      await page.goto('https://tenders.mygov.go.ke/tenders/', {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      console.log('Page loaded, getting content...');
      // On MyGov, tenders are in a table structure
      await page.waitForSelector('table.opportunities', { timeout: 20000 });

      const content = await page.content();
      const $ = load(content);      $('table.opportunities tbody tr').each((_, element) => {
        try {
          console.log('Processing tender row...');
          const cells = $(element).find('td');
          const title = $(cells[1]).text().trim();
          const referenceNumber = $(cells[0]).text().trim();
          const deadlineText = $(cells[4]).text().trim();
          const description = $(cells[2]).text().trim();
          
          if (title && referenceNumber) {
            const tender: ScrapedTender = {
              title,
              description,
              organization: $(element).find('.tender-org').text().trim(),
              category: $(element).find('.tender-category').text().trim(),
              location: $(element).find('.tender-location').text().trim(),
              budget: parseFloat($(element).find('.tender-budget').text().replace(/[^0-9.]/g, '')) || 0,
              deadline: new Date(deadlineText),
              referenceNumber,
              requirements: $(element).find('.tender-requirements li').map((_, li) => $(li).text().trim()).get(),
              contactInfo: $(element).find('.tender-contact').text().trim(),
              sourceUrl: $(element).find('.tender-link').attr('href') || '',
              source: 'MyGov'
            };
            
            if (!isNaN(tender.deadline.getTime())) {
              tenders.push(tender);
            }
          }
        } catch (error) {
          console.error('Error parsing tender element:', error);
        }
      });

      await page.close();
      console.log(`Successfully scraped ${tenders.length} tenders from MyGov`);
      
      return tenders;
    } catch (error) {
      console.error('Error scraping MyGov tenders:', error);
      return [];
    }
  }

  // Scrape from Public Procurement Portal
  async scrapePPPTenders(): Promise<ScrapedTender[]> {
    if (!this.canScrape('ppp')) {
      console.log('Rate limit reached for PPP, skipping...');
      return [];
    }

    const tenders: ScrapedTender[] = [];

    try {
      await this.initializePuppeteer();
      
      if (!this.browser || !this.isInitialized) {
        throw new Error('Browser not initialized');
      }

      const page = await this.browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to the PPP tenders page      console.log('Navigating to PPP tenders page...');
      await page.goto('https://ppp.go.ke/tenders/', {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      console.log('PPP page loaded, getting content...');
      // Wait for the tender listings
      await page.waitForSelector('.tenders-list, .tender-opportunities', { timeout: 20000 });

      const content = await page.content();
      const $ = load(content);

      $('table.tenders tr').each((_, row) => {
        try {
          const title = $(row).find('td.title').text().trim();
          const referenceNumber = $(row).find('td.reference').text().trim();
          
          if (title && referenceNumber) {
            const tender: ScrapedTender = {
              title,
              description: $(row).find('td.description').text().trim(),
              organization: $(row).find('td.organization').text().trim(),
              category: $(row).find('td.category').text().trim(),
              location: $(row).find('td.location').text().trim(),
              budget: parseFloat($(row).find('td.budget').text().replace(/[^0-9.]/g, '')) || 0,
              deadline: new Date($(row).find('td.deadline').text().trim()),
              referenceNumber,
              requirements: $(row).find('td.requirements').text().split(',').map(r => r.trim()),
              contactInfo: $(row).find('td.contact').text().trim(),
              sourceUrl: $(row).find('td.link a').attr('href') || '',
              source: 'PPP'
            };
            
            if (!isNaN(tender.deadline.getTime())) {
              tenders.push(tender);
            }
          }
        } catch (error) {
          console.error('Error parsing PPP tender row:', error);
        }
      });

      await page.close();
      console.log(`Successfully scraped ${tenders.length} tenders from PPP`);
      
      return tenders;
    } catch (error) {
      console.error('Error scraping PPP tenders:', error);
      return [];
    }
  }

  // Scrape directly from tenders.go.ke API (correct endpoint)
  async scrapeTendersGoKeApi(): Promise<ScrapedTender[]> {
    const tenders: ScrapedTender[] = [];
    try {
      const apiUrl = 'https://tenders.go.ke/api/ocds/tenders?fy=2024-2025';
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (!response.ok) {
        console.error('Failed to fetch tenders.go.ke API:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      if (!data || !Array.isArray(data.data)) {
        console.error('Unexpected API response structure:', data);
        return [];
      }
      for (const item of data.data) {
        try {
          const tender: ScrapedTender = {
            title: item.tender_name || item.title || '',
            description: item.tender_description || item.description || '',
            organization: item.procuring_entity || item.organization || '',
            category: item.tender_category || item.category || '',
            location: item.county || item.location || '',
            budget: parseFloat(item.tender_value) || 0,
            deadline: new Date(item.closing_date || item.deadline || ''),
            referenceNumber: item.tender_no || item.reference_number || '',
            requirements: [],
            contactInfo: item.contact_person || '',
            sourceUrl: 'https://tenders.go.ke/',
            source: 'tenders.go.ke'
          };
          if (tender.title && tender.referenceNumber && !isNaN(tender.deadline.getTime())) {
            tenders.push(tender);
          }
        } catch (err) {
          console.error('Error parsing API tender:', err);
        }
      }
      console.log(`Successfully fetched ${tenders.length} tenders from tenders.go.ke API`);
      return tenders;
    } catch (error) {
      console.error('Error fetching from tenders.go.ke API:', error);
      return [];
    }
  }

  // Scrape all sources and save to database
  async scrapeAndSaveAll(): Promise<void> {
    console.log('Starting tender scraping process...');
    try {
      // Scrape from tenders.go.ke API first
      console.log('Attempting to scrape tenders.go.ke API...');
      const goKeTenders = await this.scrapeTendersGoKeApi();
      console.log(`tenders.go.ke API result: ${goKeTenders.length} tenders found`);

      // Then try MyGov
      console.log('Attempting to scrape MyGov tenders...');
      const myGovTenders = await this.scrapeMyGovTenders();
      console.log(`MyGov scraping result: ${myGovTenders.length} tenders found`);

      // Then try PPP
      console.log('Attempting to scrape PPP tenders...');
      const pppTenders = await this.scrapePPPTenders();
      console.log(`PPP scraping result: ${pppTenders.length} tenders found`);

      // Combine results
      const results = [goKeTenders, myGovTenders, pppTenders];
      const allTenders = results.flat();
      if (allTenders.length === 0) {
        console.log('No tenders found from any source. Please check the scraping configuration.');
        return;
      }

      // Save to database
      let savedCount = 0;
      for (const tender of allTenders) {
        try {
          // Check if tender already exists by reference number
          const existingTender = await storage.getTenderByReference(tender.referenceNumber);
          
          if (!existingTender) {
            const insertData: InsertTender = {
              title: tender.title,
              description: tender.description,
              organization: tender.organization,
              category: tender.category,
              location: tender.location,
              budgetEstimate: tender.budget,
              deadline: tender.deadline.toISOString().split('T')[0],
              tenderNumber: tender.referenceNumber,
              requirements: tender.requirements,
              contactEmail: tender.contactInfo,
              sourceUrl: tender.sourceUrl,
              scrapedFrom: tender.source,
              status: 'active'
            };
            
            await storage.createTender(insertData);
            savedCount++;
            console.log(`Saved tender: ${tender.title}`);
          }
        } catch (error) {
          console.error(`Error saving tender ${tender.title}:`, error);
        }
      }
      
      console.log(`Scraping completed. Processed ${allTenders.length} tenders, saved ${savedCount} new tenders.`);
    } catch (error) {
      console.error('Error in scraping process:', error);
    } finally {
      // Close browser if it was opened
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.isInitialized = false;
      }
    }
  }

  // Schedule regular scraping using node-cron
  startPeriodicScraping(): void {
    // Run every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running scheduled tender scraping...');
      await this.scrapeAndSaveAll();
    });
  }
}

export const tenderScraper = new TenderScraper();