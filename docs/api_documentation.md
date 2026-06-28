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
| `fgColor` | String | No | `#000000` | Hex color for the foreground modules (e.g. `ff0000` or `#ff0000`). |
| `bgColor` | String | No | `#ffffff` | Hex color for the background (ignored if `transparent=true`). |
| `transparent`| Boolean | No | `false` | Set to `true` (or `1`) to make the background transparent. |
| `margin` | Number | No | `2` | Number of quiet-zone modules surrounding the QR code. Range: `0` to `10`. |
| `ecl` | String | No | `M` | Error Correction Level: `L` (Low), `M` (Medium), `Q` (Quartile), `H` (High). |
| `bgCorners` / `bgc` | Number | No | `0` | Background corner radius percentage. Range: `0` to `100`. |

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

## Authentication

If authentication is enabled (`AUTH_ENABLED=true` in your server environment), you must include a bearer token in the `Authorization` header:

```http
Authorization: Bearer <your-secret-api-key>
```
