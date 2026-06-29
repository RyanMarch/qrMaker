# QR Maker API Documentation

The QR Maker API generates customizable QR codes dynamically via HTTP `GET` requests.

## Endpoint

```http
GET /api/qr
```

---

## Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `content` | String | **Yes** | — | The text or URL to encode in the QR code (must be URL-encoded). |
| `format` | String | No | `png` | The response format: `png` (raw binary), `svg` (XML markup), or `base64` (JSON object). |
| `size` | Number | No | `1024` | Dimension in pixels (applies to `png` and `base64`). Range: `64` to `4096`. |
| `fgColor` | String | No | `000000` | Hex color for the foreground modules (e.g. `ff0000`). Do not include the `#` symbol. |
| `bgColor` | String | No | `ffffff` | Hex color for the background (e.g. `ffffff`, ignored if `transparent=true`). Do not include the `#` symbol. |
| `transparent`| Boolean | No | `false` | Set to `true` (or `1`) to make the background transparent. |
| `margin` | Number | No | `2` | Number of quiet-zone modules surrounding the QR code. Range: `0` to `10`. |
| `ecl` | String | No | `M` | Error Correction Level: `L` (Low), `M` (Medium), `Q` (Quartile), `H` (High). |
| `cornerRadius` | Number | No | `0` | Background corner radius percentage. Range: `0` to `100`. |
| `cornerStyle` | String | No | `square` | Corner marker style: `square`, `rounded`, `circle`, `leaf`, `beveled`. |
| `icon` | String | No | `none` | Predefined center overlay icon: `link`, `globe`, `text`, `wifi`, `contact`, `email`, `phone`, `map-pin`, `sms`, `event`, `github`, `linkedin`, `instagram`, `facebook`, `whatsapp`. |
| `iconSize` | Number | No | `20` | Percentage of the QR code area for the icon. Range: `10` to `30` (e.g. `20` for 20%). |
| `iconColor` | String | No | — | Hex color code for the icon (defaults to `fgColor`). Do not include the `#` symbol. |
| `iconClear` | Boolean | No | `true` | Set to `false` (or `0`) to disable clearing the QR modules behind the icon. |
| `iconBg` | String | No | `rounded` | Shape of the card drawn behind the icon: `rounded`, `circle`, `square`, or `none`. |

---

## Response Formats

### 1. PNG (default)
Returns a raw PNG image file.
* **Content-Type:** `image/png`
* **Direct embedding:**
  ```html
  <img src="https://<your-domain>/api/qr?content=Hello&size=512&fgColor=ff0000" alt="QR Code" />
  ```

### 2. SVG
Returns valid SVG XML markup.
* **Content-Type:** `image/svg+xml; charset=utf-8`

### 3. Base64
Returns a JSON object wrapping a Data URL.
* **Content-Type:** `application/json`
* **Payload:**
  ```json
  {
    "data": "data:image/png;base64,iVBORw0KGgoAAA..."
  }
  ```

---

## Caching

To optimize performance and avoid redundant generation overhead, all successful responses include a `Cache-Control` header:

```http
Cache-Control: public, max-age=31536000, immutable
```

This instructs browsers and CDNs (such as Cloudflare) to cache the generated QR code indefinitely for the exact same set of query parameters.

---

## Authentication

If authentication is enabled (`AUTH_ENABLED=true` in your server environment), you must include a bearer token in the `Authorization` header:

```http
Authorization: Bearer <your-secret-api-key>
```
