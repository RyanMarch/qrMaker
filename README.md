<div align="center">
  <h1>QR Maker</h1>
  <p><i>A simple, browser-based tool to create and style beautiful QR codes.</i></p>

  [![Launch App](https://img.shields.io/badge/Launch_QR_Maker-3b82f6?style=for-the-badge&logoColor=white)](https://qrmaker.ryanmarch.me)
</div>

## Overview

[QR Maker](https://qrmaker.ryanmarch.me) is a lightweight web application for designing custom QR codes. It lets you change pixel shapes, corner marker styles, colors, and add logos or icons.

It runs entirely in your web browser. There are no databases, accounts, or trackers. 

For developers, the project also includes a companion API hosted on Cloudflare Pages to generate QR codes on the fly.

## Table of Contents

1. [Features](#features)
2. [Offline Use](#offline-use)
3. [Tips for Success](#tips-for-success)
4. [Developer API Reference](#developer-api)
5. [Technical Details](#technical-details)

## Features

QR Maker offers styling and format choices for both basic and advanced designs:

### 1. Encode Almost Anything

The basics:
* **URL:** Share websites and links.
* **Text:** Encode notes, codes, or instructions.
* **WiFi:** Share Wi-Fi credentials (network name, password, and security type) so guests can scan to connect.
* **Contact:** Create vCards with your name, phone number, email, and company.

And more:
* **Email:** Pre-fill the recipient, subject line, and body text.
* **Phone:** Let users call you with a single scan.
* **Location:** Share map coordinates (with built-in location auto-detection).
* **SMS:** Pre-fill a recipient phone number and message.
* **Event:** Generate calendar events with times, locations, and descriptions.

### 2. Styling & Custom Design
* **Pixel Shapes:** Pick from Square, Rounded, Dot, Horizontal Pills, Vertical Capsules, or Connected lines.
* **Corner Markers:** Choose custom frames and inner eyes (Rounded, Square, Circle, Leaf, or Beveled).
* **Frame & Spacing:** Adjust the margins and the outer background corner radius using simple sliders.
* **Colors & Gradients:** Pick colors or use pre-made swatches. Supports solid backdrops or full transparency.

### 3. Add Logos & Icons
* **Icon Library:** Choose from pre-loaded icons (Link, Globe, Wifi, Contact, Email, Phone, GitHub, LinkedIn, Instagram, etc.).
* **Custom Logos:** Drag and drop your own PNG or JPG logo file directly into the center.
* **Card Backings:** Adjust the size of the icon and place a square, rounded, or circular backing card behind it to clear out overlapping QR modules.

### 4. High-Quality Outputs & Sharing
* **File Formats:** Download your QR code as a vector-based SVG (ideal for print layouts) or as a PNG (available in 512px, 1024px, and 2048px widths).
* **One-Click Share Links:** Create a shareable URL that saves your design settings so others can open and edit it instantly.

## Offline Use

Install QR Maker as a local application on your device:

* **macOS (Safari):** Open the website, click **File** in the top menu bar, and choose **Add to Dock...**.
* **iOS (Safari):** Tap the **Share** button and select **Add to Home Screen**.
* **Chrome/Edge:** Click the installation indicator icon in the address bar to add the app to your desktop or device drawer.

---

## Tips for Success

* **Automatic Error Correction:** Putting a logo or icon in the center blocks some of the QR data. QR Maker automatically bumps up the Error Correction Level when you add a logo. This adds extra redundancy so the scanner can read the code even with the center blocked.
* **Watch the Size:** Keep logos or icons under 20% of the overall QR code size for the most reliable scanning.
* The share link packs your text and design settings into the URL. Avoid encoding massive blocks of text or files when using share links, as browsers limit how long a URL can be.

## QR Maker API Reference

The project includes a serverless API hosted on Cloudflare Pages. This lets developers request custom QR codes programmatically using web requests.

### Endpoint
```http
GET https://qrmaker.ryanmarch.me/api/qr
```

### Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `content` | String | **Yes** | — | The text or URL to encode in the QR code (must be URL-encoded). |
| `format` | String | No | `png` | The response format: `png` (binary file), `svg` (markup text), or `base64` (JSON object). |
| `size` | Number | No | `1024` | Width and height in pixels (for `png` and `base64`). Range: `64` to `4096`. |
| `fgColor` | String | No | `000000` | Hex color code for the pixels (e.g. `ff0000`). Do not include the `#`. |
| `bgColor` | String | No | `ffffff` | Hex color code for the background (ignored if `transparent=true`). Do not include the `#`. |
| `transparent`| Boolean | No | `false` | Set to `true` (or `1`) to make the background transparent. |
| `margin` | Number | No | `2` | Number of quiet-zone border modules around the QR code. Range: `0` to `10`. |
| `ecl` | String | No | `M` | Error Correction Level: `L` (Low), `M` (Medium), `Q` (Quartile), `H` (High). |
| `cornerRadius` | Number | No | `0` | Background corner radius percentage. Range: `0` to `100`. |
| `cornerStyle` | String | No | `square` | Corner style: `square`, `rounded`, `circle`, `leaf`, `beveled`. |
| `icon` | String | No | `none` | Predefined center icon: `link`, `globe`, `text`, `wifi`, `contact`, `email`, `phone`, `map-pin`, `sms`, `event`, `github`, `linkedin`, `instagram`, `facebook`, `whatsapp`. |
| `iconSize` | Number | No | `20` | Percentage of the QR code area for the icon. Range: `10` to `30`. |
| `iconColor` | String | No | — | Hex color code for the icon (defaults to `fgColor`). Do not include the `#`. |
| `iconClear` | Boolean | No | `true` | Set to `false` (or `0`) to disable clearing the QR modules behind the icon. |
| `iconBg` | String | No | `rounded` | Shape of the backing card behind the icon: `rounded`, `circle`, `square`, or `none`. |

### Response Formats

#### 1. PNG (default)
Returns a raw PNG image file.
* **Content-Type:** `image/png`
* **Direct embedding:**
  ```html
  <img src="https://qrmaker.ryanmarch.me/api/qr?content=Hello&size=512&fgColor=ff0000" alt="QR Code" />
  ```

#### 2. SVG
Returns valid SVG XML markup.
* **Content-Type:** `image/svg+xml; charset=utf-8`

#### 3. Base64
Returns a JSON object wrapping a Data URL.
* **Content-Type:** `application/json`
* **Payload:**
  ```json
  {
    "data": "data:image/png;base64,iVBORw0KGgoAAA..."
  }
  ```


> [!NOTE]
> Successful API requests return cache-control headers (`Cache-Control: public, max-age=31536000, immutable`) so browsers and edge networks cache images indefinitely.

## Technical Details

QR Maker is built directly on standard web technologies to keep page load times under a second.

### 1. Browser-Side Rendering
* **QR Engine:** The app uses an inlined version of [Nayuki's QR Code generator library](https://github.com/nayuki/QR-Code-generator) (MIT License) in `qrcode-lib.js` to compile the raw text data into a grid.
* **HTML5 Canvas:** Custom drawing logic in `script.js` reads the grid and draws custom pixel shapes and finder patterns to render the final PNG images.
* **Vector SVG Generator:** Outputs clean, editable XML SVG strings directly.

### 2. Standalone Application
* **Zero Flicker:** A small script block inside `index.html` retrieves your theme choice from `localStorage` immediately, preventing bright white flashes when opening the app in dark mode.
* **Offline Service Worker:** Using `sw.js`, the app caches its code, styles, and web fonts to launch and operate offline.

## License

MIT License. Designed and maintained by [Ryan March](https://ryanmarch.me).
