import puppeteer, {
  type Browser,
  type Page,
} from 'puppeteer';

export class BrowserService {
  private browser: Browser | null = null;

  public async launchBrowser(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: false,
      // devtools: true,
    });
  }

  public async newPage(): Promise<Page> {
    if (this.browser == null) {
      throw new Error('Браузер не запущен');
    }
    return await this.browser.newPage();
  }

  public async closeBrowser(): Promise<void> {
    if (this.browser != null) {
      await this.browser.close();
    }
  }
}
