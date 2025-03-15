import fs from 'fs';

/**
 * Сохраняет строку с информацией о товаре в указанный файл.
 */
export function writeProductInfo(
  filePath: string,
  productInfo: string,
): void {
  fs.writeFileSync(filePath, productInfo, 'utf-8');
}
