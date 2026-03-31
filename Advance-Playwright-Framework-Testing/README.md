# Advance Playwright Framework Testing

This project materializes the `Advance-Playwright-Framework.md` blueprint into a runnable Playwright + TypeScript framework adapted to the live Gadget Seva Hub portal.

## What is included

- Pages -> Modules -> Tests architecture
- typed env config
- JSON test data
- UI and API layers
- reusable fixtures
- QA execution dashboard
- Playwright HTML + Allure reporting
- rule engine for framework conventions
- Docker and Jenkins starter files

## Target application

- Web portal: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8081/api`

## Baseline flows

- admin login
- open claims queue
- runner inbox login
- API login and service-request fetch support

## Reporting

- `npm test` now runs the suite and generates reports only after the execution completes
- All report output is stored under `Report/`
- HTML dashboard: `Report/dashboard/index.html`
- Playwright HTML report: `Report/playwright/index.html`
- Allure report: `Report/allure/index.html` generated in single-file mode so it can be opened directly from the folder
- Each UI flow stores a final screenshot and recorded video as test attachments

## Runtime note

- If Vite starts on a different port locally, update `BASE_URL` in `.env` before running the suite
