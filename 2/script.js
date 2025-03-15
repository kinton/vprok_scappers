const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  // Get the URL from the command line arguments
  const url = process.argv[2];
  if (!url) {
    console.error("Пожалуйста, укажите URL в качестве аргумента.");
  }

  // Extract the category ID and category name from the URL
  const urlMatch = url.match(/\/catalog\/(\d+)\/([^\/]+)/);
  if (!urlMatch) {
    console.error(
      "Не удалось извлечь идентификатор или название категории из URL."
    );
    process.exit(1);
  }

  const categoryId = urlMatch[1];
  const categoryName = urlMatch[2];

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    // headless: false,
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForSelector('[class^="UiProductTileMain_longName__"]', {
      visible: true,
    });

    // Get cookies and XSRF-TOKEN
    const cookies = await page.cookies();
    const cookieHeader = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    // Extract XSRF-TOKEN from cookies
    const xsrfTokenCookie = cookies.find(
      (cookie) => cookie.name === "XSRF-TOKEN"
    );
    const xsrfToken = xsrfTokenCookie
      ? decodeURIComponent(xsrfTokenCookie.value)
      : null;

    // Log the API URL, request body, and headers for debugging
    const apiUrl = `https://www.vprok.ru/web/api/v1/catalog/category/${categoryId}?sort=popularity_desc&limit=30&page=1`;
    const requestBody = {
      noRedirect: true,
      url: `/catalog/${categoryId}/${categoryName}`,
    };

    // Send the API request using Puppeteer's page.evaluate
    const response = await page.evaluate(
      async (url, apiUrl, requestBody, xsrfToken, cookieHeader) => {
        try {
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-XSRF-TOKEN": xsrfToken,
              // Cookie: cookieHeader,
              Accept: "application/json, text/plain, */*",
              "Accept-Language": "en-US,en;q=0.5",
              "Accept-Encoding": "gzip, deflate, br, zstd",
              Origin: "https://www.vprok.ru",
              DNT: "1",
              Connection: "keep-alive",
              Referer: url,
              "Sec-Fetch-Dest": "empty",
              "Sec-Fetch-Mode": "cors",
              "Sec-Fetch-Site": "same-origin",
              "Sec-GPC": "1",
              Priority: "u=0",
              Pragma: "no-cache",
              "Cache-Control": "no-cache",
            },
            body: JSON.stringify(requestBody),
          });
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        } catch (error) {
          console.error("Fetch error:", error);
          throw error;
        }
      },
      url,
      apiUrl,
      requestBody,
      xsrfToken,
      cookieHeader
    );

    // Process the response and save to file
    const products = response.products;
    let output = "";

    products.forEach((product) => {
      output += `Название товара: ${product.name}\n`;
      output += `Ссылка на изображение: ${
        product.images[0]?.url || "Нет изображения"
      }\n`;
      output += `Рейтинг: ${product.rating}\n`;
      output += `Количество отзывов: ${product.reviews}\n`;
      output += `Цена: ${product.price}\n`;
      output += `Акционная цена: ${product.discountPercent ? "Да" : "Нет"}\n`;
      output += `Цена до акции: ${product.oldPrice || "Нет"}\n`;
      output += `Размер скидки: ${product.discountPercent || "Нет"}\n\n`;
    });

    // Save to file
    fs.writeFileSync("products-api.txt", output);
    console.log("Данные успешно сохранены в файл products-api.txt");
  } catch (error) {
    console.log("Ошибка при получении или обработке данных:", error);
  } finally {
    await browser.close();
  }
})();
