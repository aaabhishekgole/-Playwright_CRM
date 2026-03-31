# Quick Reference

## Setup

1. Copy `.env.example` to `.env`
2. Make sure Gadget Seva Hub frontend and backend are running
3. Install dependencies with `npm ci`

## Commands

- `npm test`
- `npm run test:raw`
- `npm run test:chromium`
- `npm run test:smoke`
- `npm run test:regression`
- `npm run typecheck`
- `npm run rules:check`
- `npm run test:report`
- `npm run report:allure`

## Generated reports

- Root folder: `Report/`
- Dashboard: `Report/dashboard/index.html`
- Playwright HTML: `Report/playwright/index.html`
- Allure: `Report/allure/index.html` and it can be opened directly as a local file
- Raw result artifacts: `Report/test-results/`

## Default local credentials

- Admin: `admin / Admin@123`
- Pickup runner: `pickup / Admin@123`
- Pickup runner mobile login: `9999999994 / Admin@123`
