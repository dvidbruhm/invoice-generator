# Invoice Generator

A self-hosted, full-featured invoice generator with live preview, PDF export, and customizable templates. Built with vanilla JS, Express, and PostgreSQL. No build step required.

## Features

- **17 invoice templates** — Classic, Modern, Clean, Bold, Elegant, Compact, Sidebar, Bordered, Subtle, Stripe, Grid, Corner, Executive, Minimal, Divider, Dash, Swiss
- **Live preview** — See your invoice update in real-time as you type
- **PDF export** — Generate professional PDFs via jsPDF or pixel-perfect visual capture via html2canvas
- **6 color themes** — Light, Dark, Dracula, Catppuccin, Sepia, Kanagawa
- **15 accent colors** + custom color picker for invoice styling
- **Tax support** — Configurable TPS (GST) and TVQ (QST) rates
- **Client management** — Save clients and auto-fill their details
- **Line item presets** — Save frequently used services for quick access
- **CSV import** — Import line items from CSV/TSV files
- **Multi-currency** — CAD, USD, EUR
- **Custom labels** — Rename every field on the invoice
- **User accounts** — Register/login with JWT authentication
- **Responsive** — Works on mobile with a floating preview button

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/YOU/invoice-generator.git
cd invoice-generator
cp .env.example .env
# Edit .env — set strong JWT_SECRET and POSTGRES_PASSWORD
docker compose up -d
```

Open `http://localhost:3000`.

### Without Docker

Prerequisites: Node.js 20+, PostgreSQL 16+

```bash
git clone https://github.com/YOU/invoice-generator.git
cd invoice-generator
npm install
cp .env.example .env
# Edit .env with your database URL and JWT secret
createdb invoices
node server/index.js
```

## Configuration

Set these in your `.env` file:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/invoices` | PostgreSQL connection string |
| `JWT_SECRET` | `change-me-in-production` | Secret for signing JWT tokens |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password (Docker) |
| `PORT` | `3000` | Server port |

## Deploying

### Homelab / Runtipi

1. Push to a git repo accessible from your server
2. Place a `docker-compose.yml` in your Runtipi apps directory with `tipi_main_network` and Runtipi variables (`APP_PORT`, `APP_DATA_DIR`)
3. Add the app through the Runtipi UI

### Any Docker Host

```bash
docker compose up -d --build
```

Put it behind a reverse proxy (Nginx, Caddy, Traefik) for HTTPS.

## Tech Stack

- **Frontend**: Vanilla JavaScript, no frameworks or build tools
- **Backend**: Express.js, PostgreSQL via `pg`
- **Auth**: bcryptjs + JWT (7-day expiry)
- **PDF**: jsPDF + html2canvas
- **Fonts**: Inter (Google Fonts)

## Project Structure

```
├── app.html              # Main SPA entry point
├── landing.html          # Landing page
├── css/styles.css        # All styles (themes, templates, layout)
├── js/
│   ├── utils.js          # escapeHTML, formatCurrency, CSV parser
│   ├── api.js            # API client (fetch wrapper)
│   ├── templates.js      # Template definitions, defaults
│   ├── pdf.js            # PDF generation (17 template renderers)
│   ├── app.js            # Router, init
│   └── components/
│       ├── nav.js        # Nav, theme picker
│       ├── auth.js       # Login/register
│       ├── dashboard.js  # Dashboard stats
│       ├── form.js       # Invoice form, live preview
│       ├── history.js    # Invoice history, search, export
│       └── settings.js   # Settings, templates, clients
├── server/
│   ├── index.js          # Express entry, static serving
│   ├── db.js             # PostgreSQL connection, schema
│   ├── middleware/auth.js # JWT middleware
│   └── routes/
│       ├── auth.js       # Register, login
│       ├── invoices.js   # Invoice CRUD
│       ├── clients.js    # Client CRUD
│       ├── settings.js   # Settings CRUD, bulk
│       └── pdf.js        # Server-side PDF generation
└── docker-compose.yml
```

## License

MIT
