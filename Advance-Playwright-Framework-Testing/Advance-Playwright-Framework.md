# Advanced Playwright Framework Blueprint

This document reverse-engineers the current `Advance-Playwright-Framework` project into a reusable blueprint that can be used by an AI skill or by a human to recreate the same style of automation framework in another project.

It is based on the actual code and structure in this repository, not only on the README.

## 1. What This Framework Is

This project is an advanced Playwright + TypeScript automation framework built around a layered architecture:

1. `Pages`
2. `Modules`
3. `Tests`

Around those core layers, the framework adds:

- environment-driven config
- JSON-based test data
- custom Playwright fixtures
- an API testing layer
- a reusable utility layer
- a custom HTML reporter
- a repo rule engine for code structure enforcement
- Husky + lint-staged + commitlint quality gates
- Docker and Docker Compose execution
- Jenkins pipeline support
- AI guidance files and a reusable skill pack

This makes it more than a starter repo. It is meant to be a scalable template for test automation and AI-assisted test generation.

The README presents this framework as a combination of:

- layered UI automation architecture
- multi-browser execution
- reusable fixtures and utilities
- API and UI hybrid testing support
- custom reporting
- Docker and CI execution
- code quality automation
- AI-safe guardrails

That same structure is preserved in this blueprint, but rewritten in reusable form.

## 2. Core Architecture

### Layer 1: Pages

Purpose:
- hold locators
- expose small UI actions
- expose page-level expectations

Rules used in this repo:
- page files live in `src/pages`
- filenames end with `Page.ts`
- locators are defined as arrow functions
- no business logic should live here
- avoid `if` and `switch` in page classes

Example pattern from this repo:

```ts
export class LoginPage {
    constructor(private page: Page) {}

    usernameInput = () => this.page.locator('#username');
    passwordInput = () => this.page.locator('#password');
    loginButton = () => this.page.locator('button[type="submit"]');

    async navigate(): Promise<void> {
        await this.page.goto('/login');
    }

    async enterUsername(username: string): Promise<void> {
        await this.usernameInput().fill(username);
    }

    async enterPassword(password: string): Promise<void> {
        await this.passwordInput().fill(password);
    }

    async clickLogin(): Promise<void> {
        await this.loginButton().click();
    }
}
```

### Layer 2: Modules

Purpose:
- orchestrate one or more pages
- hold business workflows
- centralize reusable flows like login, checkout, or search
- keep tests readable

Rules used in this repo:
- module files live in `src/modules`
- filenames end with `Module.ts`
- modules should call page methods, not `page.locator()` directly
- logging belongs naturally here
- cross-page navigation and branching logic belong here

Example pattern from this repo:

```ts
export class LoginModule {
    private loginPage: LoginPage;
    private homePage: HomePage;
    private logger: Logger;

    constructor(private page: Page) {
        this.loginPage = new LoginPage(page);
        this.homePage = new HomePage(page);
        this.logger = Logger.create('LoginModule');
    }

    async doLogin(username: string, password: string): Promise<boolean> {
        this.logger.step(1, 'Navigate to login page');
        await this.loginPage.navigate();

        this.logger.step(2, 'Enter username');
        await this.loginPage.enterUsername(username);

        this.logger.step(3, 'Enter password');
        await this.loginPage.enterPassword(password);

        this.logger.step(4, 'Click login button');
        await this.loginPage.clickLogin();

        this.logger.step(5, 'Wait for redirect to home page');
        await this.page.waitForURL('**/home');

        return true;
    }
}
```

### Layer 3: Tests

Purpose:
- define scenarios
- call modules or fixtures
- make assertions
- organize coverage by feature, risk, and tags

Rules used in this repo:
- spec files live in `src/tests`
- filenames use lower-case kebab style and end with `.spec.ts`
- tests use `test.describe()`
- tests use tags like `@P0`, `@Smoke`, `@Regression`
- tests use `test.step()` for reporting visibility
- tests should not directly import page classes

Example pattern from this repo:

```ts
test.describe('@P1 @Regression @Login Login Feature', () => {
    let loginModule: LoginModule;

    test.beforeEach(async ({ page }) => {
        loginModule = new LoginModule(page);
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await test.step('Login and validate home redirection', async () => {
            await loginModule.doLogin(validUser.username, validUser.password);
            await loginModule.verifyLoggedIn();
            expect(page.url()).toContain('/home');
        });
    });
});
```

## 3. Required Project Structure

Use this as the default reusable structure:

```text
project-root/
+-- src/
|   +-- api/
|   |   +-- AuthApi.ts
|   |   +-- ProductApi.ts
|   |   +-- OrderApi.ts
|   |   `-- index.ts
|   +-- config/
|   |   `-- index.ts
|   +-- fixtures/
|   |   +-- auth.fixture.ts
|   |   `-- index.ts
|   +-- modules/
|   |   +-- LoginModule.ts
|   |   +-- ProductModule.ts
|   |   +-- CheckoutModule.ts
|   |   `-- index.ts
|   +-- pages/
|   |   +-- LoginPage.ts
|   |   +-- HomePage.ts
|   |   +-- ProductPage.ts
|   |   +-- CheckoutPage.ts
|   |   `-- index.ts
|   +-- testdata/
|   |   +-- users.json
|   |   +-- products.json
|   |   `-- types.ts
|   +-- tests/
|   |   +-- login.spec.ts
|   |   +-- product.spec.ts
|   |   `-- checkout.spec.ts
|   `-- utils/
|       +-- ApiHelper.ts
|       +-- CustomTTAReporter.ts
|       +-- DataGenerator.ts
|       +-- Logger.ts
|       +-- WaitHelper.ts
|       `-- index.ts
+-- docs/
+-- rules/
|   `-- framework-rule-engine.json
+-- scripts/
|   `-- rule-engine.js
+-- skills/
+-- .env
+-- .gitignore
+-- Dockerfile
+-- Jenkinsfile
+-- docker-compose.yml
+-- package.json
+-- playwright.config.ts
`-- tsconfig.json
```

## 4. Mandatory Conventions To Preserve

If you want the recreated framework to behave like this repo, preserve these conventions.

### Page object conventions

- one page class per feature/page
- keep `private page: Page`
- locators as arrow functions
- actions stay simple and atomic
- expectations may live on the page for readability
- no business workflows inside pages

### Module conventions

- modules compose one or more pages
- modules own user flows
- modules handle branching and orchestration
- modules use `Logger`
- modules wait for major navigations and state changes

### Test conventions

- import from `../fixtures`
- keep tests scenario-focused
- use `test.step()` generously
- use tags in `describe()` names
- keep direct low-level selectors out of tests whenever possible

### Fixture conventions

- create reusable page fixtures
- create reusable module fixtures
- create an authenticated fixture when login reuse matters
- keep fixture setup deterministic

### Data conventions

- keep static test data in JSON files under `src/testdata`
- define TS interfaces in `src/testdata/types.ts`
- cast imported JSON into typed objects in specs
- keep secrets and environment-specific values in `.env`

### Config conventions

- centralize config in `src/config/index.ts`
- map env vars into a typed `config` object
- keep commonly reused test data constants there when helpful

### 4.1 Repository support directories from the current README

The README describes more than `src/`. A faithful clone of this framework should also consider these support areas:

- `.github/workflows/` for CI pipelines
- `.github/instructions/` for AI planner/generator/healer instructions
- `.github/copilot-instructions.md` for editor-specific AI guidance
- `.augment/rules/`, `.cursorrules`, and `.windsurfrules` for tool-specific rules
- `.husky/` for local commit hooks
- `docs/ARCHITECTURE.html` for visual architecture documentation
- `docs/QUICK_REFERENCE.md` for commands and usage reminders
- `docs/images/` for architecture and report screenshots
- `docs/ai-agents/` for AI and MCP teaching material
- `skills/` for reusable skill packs

### 4.2 Generated artifact directories

The current repo generates or expects these runtime/build directories:

- `Report/`
- `Report/playwright/`
- `Report/test-results/`
- `Report/dashboard/`
- `Report/allure/`
- `dist/`
- `.auth/` when storage state is persisted

These are part of the operating structure of the framework even if they are not hand-authored source folders.

## 5. Support Layers In This Repo

These layers are part of why this framework is "advanced".

### 5.1 Fixtures

Current repo provides:

- object fixtures for page classes
- object fixtures for modules
- `authenticatedPage`
- `authTest`
- `authenticatedTest`

Use this pattern when:
- many tests need the same objects
- login is repeated often
- you want cleaner test signatures

### 5.2 Utility layer

Current repo utilities:

- `Logger.ts`
- `WaitHelper.ts`
- `DataGenerator.ts`
- `ApiHelper.ts`
- `CustomTTAReporter.ts`

Recommended reuse:
- always keep `Logger`
- keep `WaitHelper` when explicit polling is needed
- keep `DataGenerator` for flexible test input creation
- keep `ApiHelper` if UI/API hybrid testing is planned

### 5.3 API layer

The repo includes:

- `AuthApi.ts`
- `ProductApi.ts`
- `OrderApi.ts`

Use an API layer when:
- authentication can be done faster by API
- you need backend state setup or cleanup
- UI and API assertions must be combined

### 5.4 Custom reporter

The framework config wires in:

```ts
reporter: [
    ['./src/utils/CustomTTAReporter.ts', { outputFolder: 'Report/dashboard' }],
    ['html', { open: 'never', outputFolder: 'Report/playwright' }],
    ['json', { outputFile: 'Report/test-results/results.json' }],
    ['list'],
],
```

The custom reporter in this repo supports:
- timestamped report generation under `Report/dashboard/`
- real-time HTML updates
- step-level status capture
- screenshot, video, and trace linking
- tag/status filtering

If you want a faithful clone of this framework, keep the custom reporter. If you want a lighter version, keep Playwright HTML + JSON reporters first and add the custom one later.

### 5.5 Rule engine

This repo contains a homegrown architecture validator:

- config: `rules/framework-rule-engine.json`
- runner: `scripts/rule-engine.js`

It checks:
- file placement
- naming conventions
- page locator style
- module locator misuse
- test structure requirements
- tag and `test.step()` presence
- direct page imports in specs

This is a strong feature to reuse when AI or multiple contributors will generate tests.

### 5.6 AI guardrails

This repo also carries:

- `.github/instructions/`
- `.cursorrules`
- `.windsurfrules`
- a skill pack under `skills/playwright-ai-mcp-tutor/`
- AI docs under `docs/ai-agents/`

These are optional for a normal test framework, but valuable when the framework is meant to be generated or maintained by AI agents.

### 5.7 Reports and generated outputs

The README treats reporting as a first-class part of the framework. Preserve these output concepts:

- `Report/dashboard/` for the custom HTML dashboard
- `Report/playwright/` for Playwright's standard HTML report
- `Report/allure/` for the single-file Allure report
- `Report/test-results/` for JSON results, traces, screenshots, videos, and raw execution artifacts

Recommended commands:

- `npm run test:report`
- `npx playwright show-report`
- `npx playwright show-trace <trace.zip>`

### 5.8 Documentation and training assets

The README includes architecture and learning material, not just code. In a reusable clone, consider keeping:

- a visual architecture doc like `docs/ARCHITECTURE.html`
- a quick command/reference doc like `docs/QUICK_REFERENCE.md`
- screenshots or diagrams under `docs/images/`
- AI/MCP teaching notes when the framework is also used for training or onboarding

### 5.9 Execution flow represented in the README

The README includes flow diagrams. The reusable form of those diagrams is:

1. tests call modules
2. modules orchestrate pages
3. pages perform UI actions
4. fixtures, config, utils, and API helpers support all layers
5. reporters, Docker, and CI consume the execution artifacts

That execution model should stay stable even when the application under test changes.

## 6. Recommended Setup For A New Project

Use this sequence to recreate the framework in another app.

### Step 1: Initialize the project

```bash
npm init -y
npm install -D @playwright/test typescript @types/node dotenv
npx playwright install
```

### Step 2: Create the core folders

Create:

- `src/pages`
- `src/modules`
- `src/tests`
- `src/fixtures`
- `src/utils`
- `src/api`
- `src/config`
- `src/testdata`
- `rules`
- `scripts`
- `docs`

### Step 3: Add TypeScript config with path aliases

Use path aliases similar to the current repo:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["src/pages/*"],
      "@modules/*": ["src/modules/*"],
      "@utils/*": ["src/utils/*"],
      "@fixtures/*": ["src/fixtures/*"],
      "@api/*": ["src/api/*"],
      "@config/*": ["src/config/*"],
      "@testdata/*": ["src/testdata/*"]
    }
  }
}
```

### Step 4: Add Playwright config

Mirror the current framework shape:

```ts
export default defineConfig({
    testDir: './src/tests',
    timeout: 60000,
    expect: { timeout: 10000 },
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : 3,
    use: {
        baseURL: process.env.BASE_URL,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    ],
});
```

### Step 5: Build one vertical slice first

Before scaling, create:

1. one page
2. one module
3. one fixture
4. one test file
5. one JSON data file

Good first slice:
- `LoginPage.ts`
- `LoginModule.ts`
- `fixtures/index.ts`
- `login.spec.ts`
- `testdata/users.json`

### Step 6: Add common utilities

Add in this order:

1. `Logger.ts`
2. `WaitHelper.ts`
3. `DataGenerator.ts`
4. `ApiHelper.ts`
5. `CustomTTAReporter.ts`

### Step 7: Add quality gates

Copy the same ideas used here:

- ESLint
- Prettier
- Husky
- lint-staged
- commitlint
- architecture rule engine

Recommended config files based on this repo:

- `.eslintrc.json`
- `.prettierrc`
- `.prettierignore`
- `.eslintignore`
- `.editorconfig`
- `.lintstagedrc`
- `commitlint.config.js`
- `.husky/pre-commit`
- `.husky/commit-msg`

Recommended behavior based on the current repo:

- lint staged `src/**/*.ts`
- format staged code and docs
- run `tsc --noEmit` before commit
- run the rule engine on staged files
- enforce conventional commits such as `feat(login): add remember me`

### Step 8: Add execution infrastructure

Add:

- `Dockerfile`
- `docker-compose.yml`
- CI workflow or `Jenkinsfile`

Recommended CI shape based on the README and current repository:

- GitHub Actions main workflow for push/PR runs
- shard-based execution, currently `1/4` through `4/4`
- artifact upload for reports, screenshots, and results
- merged report publishing after shards complete
- a separate smoke workflow for `@P0|@Smoke` on Chromium
- a Jenkins pipeline for teams that use Jenkins instead of GitHub Actions

Recommended Docker shape based on the current repo:

- one base Playwright image
- shard services like `shard-1` to `shard-4`
- a `smoke` service
- a `regression` service
- an optional `merge-reports` service

## 7. Recommended package.json Script Set

The current repo uses this style of commands and it is a good template:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:chromium": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "test:webkit": "playwright test --project=webkit",
    "test:mobile": "playwright test --project=mobile-chrome",
    "test:smoke": "playwright test --grep @Smoke",
    "test:regression": "playwright test --grep @Regression",
    "test:p0": "playwright test --grep @P0",
    "test:report": "playwright show-report",
    "test:ci": "playwright test --reporter=list,json",
    "build": "tsc",
    "rules:check": "node scripts/rule-engine.js",
    "rules:changed": "node scripts/rule-engine.js --changed",
    "rules:staged": "node scripts/rule-engine.js --staged"
  }
}
```

## 8. Reusable File Blueprints

### 8.1 Config blueprint

Your config should provide:

- `baseUrl`
- `apiBaseUrl`
- `apiTimeout`
- `defaultTimeout`
- `testUser`
- `logLevel`
- `retryCount`

This repo's `src/config/index.ts` is a good template for that.

### 8.2 Fixture blueprint

Your fixture file should:

- extend Playwright `test`
- expose page objects
- expose modules
- optionally expose `authenticatedPage`
- re-export `expect`

### 8.3 Test data blueprint

Use:

- `users.json` for credentials and invalid cases
- `products.json` for product, promo, and inventory test data
- `types.ts` for all JSON shapes

### 8.4 API blueprint

Each API class should:

- accept a Playwright `Page` or `APIRequestContext`
- use `ApiHelper`
- accept base URL by constructor
- return typed responses
- throw meaningful errors on bad status codes

### 8.5 Usage patterns to preserve

The README includes usage examples. Keep these usage modes in mind when recreating the framework:

- direct page-object usage for low-level interaction tests
- module usage for business workflow tests
- fixture usage for cleaner spec signatures
- API usage for setup, teardown, or hybrid validation

## 9. Current Repo Strengths Worth Reusing

These are the strongest patterns in this repository.

### Strong patterns

- clean Pages -> Modules -> Tests layering
- custom fixtures for reuse
- typed config and typed JSON data
- API helper abstraction
- custom HTML reporter with artifact handling
- rule engine for structural enforcement
- multi-browser project setup
- Docker and CI readiness
- AI instruction overlays for deterministic generation

### Good evidence of portability

The `katalon` sample area shows the framework can be adapted to a second app domain by adding:

- separate page objects
- separate modules
- separate fixtures
- separate test data
- a new test suite

That is a strong sign that the framework pattern is reusable.

## 10. Current Repo Gaps Or Project-Specific Details

When creating a reusable skill from this framework, do not blindly copy every detail. Some parts are repo-specific or inconsistent.

### Important notes

- The repo mixes relative imports in source code with path aliases in `tsconfig.json`. Decide on one style for the new project and enforce it.
- The sample `katalon` specs sometimes use raw `page.locator()` calls in tests. That is useful as sample automation, but it does not fully follow the stricter layered rules used elsewhere.
- The custom reporter is powerful but large. In a fresh project, start with default reporters first if speed matters.
- The `clean` script uses `rm -rf`, which is Unix-oriented. For a cross-platform framework, use a portable alternative.
- Docker and Playwright package versions should be aligned when cloning this framework into a long-lived project.
- README examples and scripts should be revalidated against actual `package.json` commands when copied to another repo.
- The README's test-count section is informational for this repo only; coverage numbers should be regenerated per project, not treated as a framework rule.

## 11. Rules To Encode In A Skill

If this markdown is later converted into a skill, these are the most important generation rules to preserve.

### Non-negotiable rules

- Always create tests under `src/tests`.
- Always create page objects under `src/pages`.
- Always create business workflow classes under `src/modules`.
- Keep locators as arrow functions inside page objects.
- Do not put business logic in page classes.
- Do not call `page.locator()` from modules.
- Use `test.describe()` and `test.step()` in specs.
- Add tags such as `@P0`, `@P1`, `@Smoke`, `@Regression`.
- Prefer fixtures and modules in tests rather than direct page imports.
- Keep test data outside specs when it can be shared.
- Use typed config and env-driven URLs/credentials.

### Recommended rules

- add a custom logger
- expose authenticated fixtures
- keep API helpers for setup or hybrid checks
- add a rule engine when AI will generate files
- include Docker and CI support from the start
- include quick-reference docs when onboarding matters
- include code-quality hooks when multiple contributors will work in the repo

## 12. Minimal Golden Template For New Features

For each new feature under this framework, add:

1. one page object or page update
2. one module or module update
3. one spec file or spec update
4. any fixture update only if reuse is needed
5. test data update if the scenario is data-driven

Example for a new `Profile` feature:

- `src/pages/ProfilePage.ts`
- `src/modules/ProfileModule.ts`
- `src/tests/profile.spec.ts`
- `src/testdata/profile.json`

## 13. Recommended Adoption Modes

### Mode A: Full advanced clone

Use when:
- the project is large
- multiple testers will contribute
- AI code generation is expected
- CI, reporting, and guardrails matter from day one

Keep:
- pages
- modules
- tests
- fixtures
- utils
- API layer
- reporter
- rule engine
- Docker
- CI
- AI instructions

### Mode B: Lean start, then scale

Use when:
- the project is early
- only a few flows exist
- you want fast setup

Start with:
- pages
- modules
- tests
- fixtures
- config
- testdata
- logger

Add later:
- reporter
- API layer
- rule engine
- Docker
- AI instruction layer

## 14. Suggested Prompt For Reusing This Blueprint

If an AI agent needs to create the same framework in a different repository, this prompt shape is effective:

```text
Use Advanced_Playwright.md as the source blueprint.
Create an advanced Playwright + TypeScript test automation framework in this repository.
Preserve the Pages -> Modules -> Tests architecture, fixtures, typed config, JSON testdata, utility layer, and package scripts.
If the project is greenfield, create the folder structure and baseline files.
If the project already contains Playwright tests, adapt the framework to the existing app without breaking current tests.
Prefer reusable modules and page objects over direct selectors in specs.
```

## 15. Final Recommendation

For reuse in any new testing project, treat this repository as:

- a strong architecture template
- a good AI-safe automation template
- a scalable Playwright framework blueprint

But when recreating it elsewhere:

- preserve the architecture
- preserve the conventions
- preserve the guardrails
- adapt selectors, test data, and app flows to the new product
- keep only the advanced pieces the project actually needs

If you later want this converted into a proper Codex skill, the best next step is:

1. create a skill folder
2. move this document into `references/`
3. write a short `SKILL.md` that tells Codex when to load this blueprint
4. optionally bundle starter templates under `assets/`

## 16. README Coverage Check

This section maps the main README structure to this blueprint so it is easy to verify coverage.

### Covered directly

- `Architecture Documentation` -> covered by sections `4.1`, `5.8`
- `Key Features` -> covered by sections `1`, `5`, `9`
- `Project Structure` -> covered by sections `3`, `4.1`, `4.2`
- `Architecture` -> covered by section `2`
- `Getting Started` -> covered by section `6`
- `Available Scripts` -> covered by section `7`
- `Usage Examples` -> covered by sections `2`, `8.5`, `12`
- `Utilities` -> covered by sections `5.2`, `8`
- `Writing New Tests` -> covered by sections `6`, `11`, `12`
- `Custom TTA Reporter` -> covered by section `5.4`
- `Reports` -> covered by section `5.7`
- `Docker Support` -> covered by section `6`, especially `Step 8`
- `CI/CD Integration` -> covered by section `6`, especially `Step 8`
- `Code Quality Tools` -> covered by section `6`, especially `Step 7`
- `AI Assistant Support` -> covered by sections `4.1`, `5.6`
- `Contributing` -> covered by sections `4`, `6`, `11`, `12`
- `Project Files Structure` -> covered by sections `3`, `4.1`, `4.2`
- `Why We Added Rule Engine and AI/MCP Controls` -> covered by sections `5.5`, `5.6`, `5.8`

### Covered as reusable interpretation rather than copied literally

- `Test Coverage` -> represented as a repo-specific metric, noted in section `10`
- `Flow Diagrams` -> represented as an execution model in section `5.9`
- `License` and `Author` -> intentionally not treated as reusable framework structure
