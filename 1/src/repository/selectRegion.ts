import { type ElementHandle, type Page } from 'puppeteer';
import {
  REGION_HEADER,
  REGION_ITEM,
  REGION_LIST,
  WEBSITE_ROOT_URL,
} from '../consts.js';

/**
 * Функция для выбора региона на сайте vprok.ru.
 */
export async function selectRegion(
  page: Page,
  regionName: string,
): Promise<void> {
  await page.goto(WEBSITE_ROOT_URL, {
    waitUntil: 'domcontentloaded',
  });

  // Функция для ожидания и нажатия на REGION_HEADER
  async function waitAndClickRegionHeader() {
    await page.waitForSelector(REGION_HEADER, {
      visible: true,
    });
    await page.click(REGION_HEADER);
  }

  // Функция для проверки появления REGION_LIST
  async function checkRegionList() {
    try {
      await page.waitForSelector(REGION_LIST, {
        visible: true,
        timeout: 5000,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  while (true) {
    await waitAndClickRegionHeader();
    const isRegionListVisible = await checkRegionList();
    if (isRegionListVisible) {
      break;
    }
  }

  const elementHandle = (
    await page.evaluateHandle(
      (text, REGION_ITEM) => {
        const items = Array.from(
          document.querySelectorAll(REGION_ITEM),
        );
        return items.find(
          (item) => item.innerHTML.trim() === text,
        );
      },
      regionName,
      REGION_ITEM,
    )
  ).asElement();

  if (elementHandle != null) {
    if (
      await elementHandle.evaluate(
        (node) => node.nodeType === Node.ELEMENT_NODE,
      )
    ) {
      const element =
        elementHandle as ElementHandle<Element>;
      await element.click();
      await element.dispose();
    } else {
      console.log(
        `Найденный узел с текстом "${regionName}" не является элементом`,
      );
    }
  } else {
    console.log(
      `Элемент с текстом "${regionName}" не найден`,
    );
  }

  // Небольшая задержка для применения выбранного региона
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
