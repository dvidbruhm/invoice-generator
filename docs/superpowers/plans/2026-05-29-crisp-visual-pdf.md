# Crisp Visual PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the visual (image-based) PDF output significantly sharper by first applying client-side canvas sharpening, then adding server-side Puppeteer rendering as a higher-quality fallback.

**Architecture:** Two-phase approach. Phase 1 adds an unsharp mask convolution to the html2canvas output in the client. Phase 2 adds a Puppeteer-based server endpoint that renders the same HTML in a real headless Chromium, producing a crisp PDF with vector-quality text. The client tries the server endpoint first; if it fails or times out, it falls back to the existing html2canvas pipeline with sharpening.

**Tech Stack:** Vanilla JS (client), Express + Puppeteer (server), Docker (Chromium in container)

---

## Phase 1: Client-Side Canvas Sharpening

### Task 1: Add canvas sharpening to generatePDFFromHTML

**Files:**
- Modify: `js/pdf.js`

- [ ] **Step 1: Add sharpenCanvas helper function**

Add this function before `generatePDFFromHTML` in `js/pdf.js` (before line 1137):

```javascript
function sharpenCanvas(canvas, amount) {
  var w = canvas.width;
  var h = canvas.height;
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, w, h);
  var src = imageData.data;

  var output = ctx.createImageData(w, h);
  var dst = output.data;

  var a = -amount;
  var k = a * 4 + 1;

  for (var y = 1; y < h - 1; y++) {
    for (var x = 1; x < w - 1; x++) {
      var idx = (y * w + x) * 4;
      for (var c = 0; c < 3; c++) {
        var val = k * src[idx + c]
          + a * src[((y - 1) * w + x) * 4 + c]
          + a * src[((y + 1) * w + x) * 4 + c]
          + a * src[(y * w + x - 1) * 4 + c]
          + a * src[(y * w + x + 1) * 4 + c];
        dst[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
  return canvas;
}
```

- [ ] **Step 2: Apply sharpening after html2canvas renders**

In `generatePDFFromHTML`, change the html2canvas block to apply sharpening:

```javascript
    var rawCanvas = await html2canvas(clone, {
      scale: 4,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    sharpenCanvas(rawCanvas, 0.3);
    var canvas = rawCanvas;
```

- [ ] **Step 3: Add font-smoothing CSS on the clone**

In the clone setup block, add these CSS properties:

```javascript
  clone.style.webkitFontSmoothing = 'antialiased';
  clone.style.textRendering = 'optimizeLegibility';
```

- [ ] **Step 4: Test in browser**

Run: `docker compose up --build -d`
Download a visual PDF and compare sharpness.

- [ ] **Step 5: Commit**

```bash
git add js/pdf.js
git commit -m "feat: add canvas sharpening and font-smoothing to visual PDF generation"
```

---

## Phase 2: Server-Side Puppeteer Rendering

### Task 2: Add Puppeteer dependency and Dockerfile changes

**Files:**
- Modify: `package.json`, `package-lock.json`
- Modify: `Dockerfile`

- [ ] **Step 1: Install Puppeteer**

Run: `npm install puppeteer`

- [ ] **Step 2: Update Dockerfile for Chromium**

Replace the Dockerfile contents with:

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server/index.js"]
```

- [ ] **Step 3: Commit dependency changes**

```bash
git add package.json package-lock.json Dockerfile
git commit -m "feat: add Puppeteer with Alpine Chromium for server-side PDF rendering"
```

### Task 3: Create server-side PDF route

**Files:**
- Create: `server/routes/pdf.js`
- Modify: `server/index.js`

- [ ] **Step 1: Create the PDF route**

Create `server/routes/pdf.js`:

```javascript
const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
  }
  return browserPromise;
}

router.post('/generate-pdf', async (req, res) => {
  const { html } = req.body;
  if (!html) {
    return res.status(400).json({ error: 'html is required' });
  }

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 15000
    });

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await page.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    if (page) await page.close();
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Register the route in server/index.js**

Add after the other route imports:

```javascript
const pdfRoutes = require('./routes/pdf');
```

Add after the other `app.use` lines:

```javascript
app.use('/api/pdf', pdfRoutes);
```

- [ ] **Step 3: Commit the server-side route**

```bash
git add server/routes/pdf.js server/index.js
git commit -m "feat: add server-side PDF generation endpoint using Puppeteer"
```

### Task 4: Update client to use server-side PDF with fallback

**Files:**
- Modify: `js/pdf.js`

- [ ] **Step 1: Add generatePDFViaServer function**

Add this new function in `js/pdf.js` before `generatePDFFromHTML`. It collects all stylesheets, clones the preview element, and sends the full HTML to the server:

```javascript
async function generatePDFViaServer(elementId, filename) {
  var element = document.getElementById(elementId);
  if (!element) throw new Error('Preview element not found.');

  var clone = element.cloneNode(true);
  clone.id = 'visual-pdf-clone';
  clone.style.width = '794px';
  clone.style.padding = '40px';
  clone.style.background = 'white';
  clone.style.color = '#111';

  var style = document.createElement('style');
  style.textContent = Array.from(document.styleSheets)
    .flatMap(function(sheet) {
      try { return Array.from(sheet.cssRules).map(function(r) { return r.cssText; }); }
      catch (e) { return []; }
    })
    .join('\n');
  clone.insertBefore(style, clone.firstChild);

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;">' + clone.outerHTML + '</body></html>';

  var resp = await fetch('/api/pdf/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: html })
  });

  if (!resp.ok) throw new Error('Server PDF failed');

  var blob = await resp.blob();
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename + '.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Update generatePDFFromHTML to try server first**

Add a try/catch at the top of `generatePDFFromHTML` that attempts the server route, falling back to the existing html2canvas code:

```javascript
async function generatePDFFromHTML(elementId, filename) {
  try {
    await generatePDFViaServer(elementId, filename);
    return;
  } catch (serverErr) {
    console.warn('Server PDF generation failed, falling back to html2canvas:', serverErr);
  }

  // ... rest of existing html2canvas code with sharpening ...
}
```

- [ ] **Step 3: Rebuild and test**

Run: `docker compose up --build -d`
Test visual PDF download. Then test with server endpoint unavailable to verify fallback.

- [ ] **Step 4: Commit**

```bash
git add js/pdf.js
git commit -m "feat: use server-side Puppeteer for visual PDF with html2canvas+sharpening fallback"
```

---

## Notes

- Puppeteer browser instance is lazily initialized and reused across requests (singleton)
- Unsharp mask amount 0.3 is conservative -- increase to 0.5 for more aggressive sharpening
- Server-side PDF produces vector text, dramatically crisper than any canvas approach
- Fallback ensures app works if server endpoint is unavailable
