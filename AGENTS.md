# Project Rules

- Always use vanilla JS (no frameworks or build tools)
- All files use IndexedDB for persistence
- Follow existing code style: global functions, no modules, template literals for HTML
- Always escape user input with `escapeHTML()` before inserting into innerHTML
- When adding CSS, use existing CSS custom properties (--bg, --surface, --accent, etc.)
- Support dark mode via `[data-theme="dark"]` when adding new styles
- Keep the app working without a build step — no npm, no bundlers
- Use `formatCurrency(amount, currency)` from utils.js for all money formatting
- Test changes in the browser after making them
- After each prompt that modifies files, create a git commit with a concise message describing the changes
- After each feature implementation or bug fix, restart the Docker server with `docker compose up --build -d` to apply changes before testing