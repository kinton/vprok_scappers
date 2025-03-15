import { BrowserService } from './services/BrowserService.js';
import { selectRegion } from './repository/selectRegion.js';
import { scrapeProduct } from './repository/scrapeProduct.js';
import { writeProductInfo } from './utils/fileWriter.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      'Использование: node dist/index.js <URL_товара> "<Регион>"',
    );
    process.exit(1);
  }
  const [productUrl, regionName] = args;

  const browserService = new BrowserService();

  try {
    await browserService.launchBrowser();
    const page = await browserService.newPage();

    // Установить похожий на человеческий User Agent
    // TODO: из набора готовых
    const firefoxMacUserAgent =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Gecko/20100101 Firefox/92.0';
    await page.setUserAgent(firefoxMacUserAgent);

    // Установка viewport для корректного скриншота
    await page.setViewport({ width: 1280, height: 10000 });

    // Выбор региона
    await selectRegion(page, regionName);

    // Переход на страницу товара
    await page.goto(productUrl, {
      waitUntil: 'domcontentloaded',
    });

    // Скрапинг данных товара
    const productData = await scrapeProduct(page);

    // Формирование строки с характеристиками товара
    const productInfo = [
      `price=${productData.price ?? 'N/A'}`,
      `priceOld=${productData.oldPrice ?? 'N/A'}`,
      `rating=${productData.rating ?? 'N/A'}`,
      `reviewCount=${productData.reviewsCount ?? 'N/A'}`,
    ].join('\n');

    // Сохранение информации о товаре в файл
    writeProductInfo('product.txt', productInfo);
    console.log(
      'Информация о товаре сохранена в product.txt',
    );

    // Создание полноразмерного скриншота страницы товара
    await page.screenshot({
      path: 'screenshot.jpg',
      fullPage: true,
    });
    console.log('Скриншот сохранён как screenshot.jpg');
  } catch (error) {
    console.error('Ошибка выполнения:', error);
  } finally {
    await browserService.closeBrowser();
  }
}

await main();
