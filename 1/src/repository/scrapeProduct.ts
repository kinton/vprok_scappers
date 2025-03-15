import { type Page } from 'puppeteer';
import { type ProductData } from '../models/ProductData.js';
import {
  PRODUCT_PAGE,
  PRODUCT_PRICE_DISCOUNT,
  PRODUCT_PRICE_OLD,
  PRODUCT_PRICE_REGULAR,
  PRODUCT_RATING,
  PRODUCT_REVIEWS_COUNT,
} from '../consts.js';

/**
 * Функция для скрапинга данных товара с страницы.
 */
export async function scrapeProduct(
  page: Page,
): Promise<ProductData> {
  await page.waitForSelector(PRODUCT_PAGE, {
    visible: true,
  });

  const productData = await page.evaluate(
    (
      PRODUCT_PAGE,
      PRODUCT_PRICE_REGULAR,
      PRODUCT_PRICE_DISCOUNT,
      PRODUCT_PRICE_OLD,
      PRODUCT_RATING,
      PRODUCT_REVIEWS_COUNT,
    ) => {
      const productPage =
        document.querySelector(PRODUCT_PAGE);

      function getPrices() {
        function processPrice(element: Element) {
          const price = element.textContent
            ?.trim()
            ?.replace(',', '.');
          return parseFloat(price!);
        }

        try {
          const priceElementRegular =
            productPage?.querySelector(
              PRODUCT_PRICE_REGULAR,
            );

          const priceElementDiscount =
            productPage?.querySelector(
              PRODUCT_PRICE_DISCOUNT,
            );
          const priceElementOld =
            productPage?.querySelector(PRODUCT_PRICE_OLD);

          const priceElement =
            priceElementDiscount ?? priceElementRegular;

          const price =
            priceElement != null
              ? processPrice(priceElement)
              : null;

          const oldPrice =
            priceElementOld != null
              ? processPrice(priceElementOld)
              : null;

          return [price, oldPrice];
        } catch {
          return [null, null];
        }
      }

      const [price, oldPrice] = getPrices();

      function getRatingInfo() {
        try {
          const rating = productPage
            ?.querySelector(PRODUCT_RATING)
            ?.textContent?.trim();
          const reviewsCount = productPage
            ?.querySelector(PRODUCT_REVIEWS_COUNT)
            ?.textContent?.trim();

          return [
            rating != null ? parseFloat(rating) : null,
            reviewsCount != null
              ? parseInt(reviewsCount)
              : null,
          ];
        } catch {
          return [null, null];
        }
      }

      const [rating, reviewsCount] = getRatingInfo();

      return {
        price,
        oldPrice,
        rating,
        reviewsCount,
      };
    },

    PRODUCT_PAGE,
    PRODUCT_PRICE_REGULAR,
    PRODUCT_PRICE_DISCOUNT,
    PRODUCT_PRICE_OLD,
    PRODUCT_RATING,
    PRODUCT_REVIEWS_COUNT,
  );

  return productData;
}
