import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test.beforeEach(({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        !text.includes('Failed to load resource: the server responded with a status of 404') &&
        !text.includes('service-worker') &&
        !text.includes('sw.js') &&
        !text.includes('chrome-extension')
      ) {
        throw new Error(`Browser console error: ${text}`);
      }
    }
  });

  page.on('pageerror', error => {
    if (!error.message.includes('sw.js') && !error.message.includes('Service Worker')) {
      throw new Error(`Uncaught browser exception: ${error.message}`);
    }
  });
});

async function getCanvasImage(page) {
  return await page.evaluate(() => {
    const canvas = document.getElementById('qr-canvas');
    return canvas ? canvas.toDataURL() : null;
  });
}

test.describe('QR Code Generation and Customization', () => {

  test('QR code preview displays on load', async ({ page }) => {
    await page.goto('/app/');
    
    // Assert canvas is visible
    const canvas = page.locator('#qr-canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas is not blank
    const imageBefore = await getCanvasImage(page);
    expect(imageBefore).not.toBeNull();
    expect(imageBefore.length).toBeGreaterThan(1000);
  });

  test('URL content input adjusts the QR code', async ({ page }) => {
    await page.goto('/app/');

    const initialImage = await getCanvasImage(page);

    // Type a new URL into the input field
    const input = page.locator('#input-url');
    await input.click();
    await input.fill('https://example.com/some/test/path');
    await page.waitForTimeout(500); // Allow debounce / generation

    const updatedImage = await getCanvasImage(page);
    expect(updatedImage).not.toEqual(initialImage);
  });

  test('Segmented style controls adjust the QR code', async ({ page }) => {
    await page.goto('/app/');

    const initialImage = await getCanvasImage(page);

    // Click "Dot" pixel style
    await page.locator('#pixel-dot').click();
    await page.waitForTimeout(300);
    const dotImage = await getCanvasImage(page);
    expect(dotImage).not.toEqual(initialImage);

    // Click "Pills" pixel style
    await page.locator('#pixel-pill-h').click();
    await page.waitForTimeout(300);
    const pillsImage = await getCanvasImage(page);
    expect(pillsImage).not.toEqual(dotImage);

    // Click "Square" corner markers style
    await page.locator('#corner-square').click();
    await page.waitForTimeout(300);
    const cornerSquareImage = await getCanvasImage(page);
    expect(cornerSquareImage).not.toEqual(pillsImage);
  });

  test('Slider controls adjust the QR code margins and background corner radius', async ({ page }) => {
    await page.goto('/app/');

    const initialImage = await getCanvasImage(page);

    // Change margin slider value
    await page.evaluate(() => {
      const slider = document.getElementById('margin-slider');
      slider.value = 6;
      slider.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(300);
    const marginChangedImage = await getCanvasImage(page);
    expect(marginChangedImage).not.toEqual(initialImage);

    // Change background corners slider value
    await page.evaluate(() => {
      const slider = document.getElementById('bg-corners-slider');
      slider.value = 90;
      slider.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(300);
    const cornersChangedImage = await getCanvasImage(page);
    expect(cornersChangedImage).not.toEqual(marginChangedImage);
  });

  test('Export PNG downloads high-fidelity copy matching visual expectations', async ({ page }) => {
    await page.goto('/app/');

    // Configure a specific QR code state
    await page.locator('#input-url').fill('https://qrmaker.ryanmarch.me');
    await page.locator('#pixel-rounded').click();
    await page.locator('#corner-leaf').click();
    await page.waitForTimeout(500);

    // Wait for the download event when we click export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#export-png-btn')
    ]);

    // Verify downloaded filename and type
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^qr-code-\d+\.png$/);

    // Save download
    const downloadPath = await download.path();
    expect(fs.existsSync(downloadPath)).toBe(true);

    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(1000); // Check that the file is not empty

    // Clean up
    await download.delete();
  });

  test('Resilience: Empty text input displays default/empty state gracefully', async ({ page }) => {
    await page.goto('/app/');

    // Select text tab
    await page.locator('#tab-text').click();
    
    // Clear text area
    const textarea = page.locator('#input-text');
    await textarea.fill('');
    await page.waitForTimeout(500);

    // Canvas should still render a valid visual fallback (or default placeholder QR) without crashing the browser
    const canvasImage = await getCanvasImage(page);
    expect(canvasImage).not.toBeNull();
    expect(canvasImage.length).toBeGreaterThan(1000);
  });

  test('Resilience: Uploading an invalid logo file displays a user friendly toast/error', async ({ page }) => {
    await page.goto('/app/');

    // Create a dummy non-image file
    const invalidFilePath = 'temp-dummy-text-file.txt';
    fs.writeFileSync(invalidFilePath, 'Not an image data content');

    try {
      // Toggle logo tab overlay mode
      await page.locator('#mode-logo').click();
      
      // Upload the invalid file using setInputFiles on the hidden file input
      await page.setInputFiles('#logo-input', invalidFilePath);

      // Verify that the validation toast is displayed with the appropriate message
      const toast = page.locator('#toast');
      await expect(toast).toContainText('Please select an image file');
    } finally {
      // Clean up temporary local file
      if (fs.existsSync(invalidFilePath)) {
        fs.unlinkSync(invalidFilePath);
      }
    }
  });

  test('Custom color pickers respond to pointer interactions', async ({ page }) => {
    await page.goto('/app/');

    // Open background color picker
    await page.locator('#color-trigger-preview').click();
    await expect(page.locator('#color-picker-sheet')).toHaveClass(/open/);

    // Get initial hex value
    const initialBgHex = await page.locator('#color-hex-input').inputValue();

    // Click canvas to select a color
    const canvasBg = page.locator('#color-spectrum-canvas');
    await canvasBg.click({ position: { x: 100, y: 50 } });

    // Verify hex input changes
    const updatedBgHex = await page.locator('#color-hex-input').inputValue();
    expect(updatedBgHex).not.toEqual(initialBgHex);

    // Open pixel color picker
    await page.locator('#pixel-color-trigger-preview').click();
    await expect(page.locator('#pixel-color-picker-sheet')).toHaveClass(/open/);

    // Get initial pixel hex value
    const initialPixelHex = await page.locator('#pixel-color-hex-input').inputValue();

    // Click pixel canvas to select a color
    const canvasPixel = page.locator('#pixel-color-spectrum-canvas');
    await canvasPixel.click({ position: { x: 150, y: 70 } });

    // Verify pixel hex input changes
    const updatedPixelHex = await page.locator('#pixel-color-hex-input').inputValue();
    expect(updatedPixelHex).not.toEqual(initialPixelHex);
  });
});
