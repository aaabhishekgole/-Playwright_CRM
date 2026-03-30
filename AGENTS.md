# Codex Project Guide

This repository is intended to carry its own AI working context across fresh `git clone` checkouts.

## Read First

When starting work in this repo, use this order:

1. `README.md`
2. `Docs/architecture.md`
3. `Docs/api.md`
4. `Docs/db-schema.md`
5. `Docs/menu-mapping.md`
6. `Docs/test-scenarios.md`
7. `Docs/CODEX-HANDOFF.md`

## Project Summary

Gadget Seva Hub is an Indian operations platform for:

- claim registration
- pickup assignment and runner execution
- hub inward and verification
- service center diagnosis and repair
- estimate and cashless approval
- delivery and billing
- notifications and audit

The repo contains:

- `backend`: Spring Boot API
- `frontend`: React admin portal
- `mobile`: Expo hybrid runner app
- `Advance-Playwright-Framework-Testing`: advanced Playwright + TypeScript automation framework
- `Docs`: business, API, DB, menu, QA, and presentation material

## Non-Negotiable Product Rules

- Keep amounts in INR and show rupee formatting.
- Treat the platform as India-first.
- Maintain parity between runner web flow and runner hybrid mobile flow.
- Any mobile-runner flow added in app should be reflected in the web runner flow when feasible.
- Pickup runner onboarding must feed the admin assign-pickup dropdown.
- Mobile number is mandatory for runner onboarding.
- Pickup assignment notifications are rider-specific and should target only the scheduled runner.
- Popup/toast feedback matters and should remain visible after successful or failed actions.

## Local Runtime Defaults

- frontend: `http://localhost:5173`
- backend: `http://localhost:8081`
- swagger: `http://localhost:8081/swagger-ui/index.html`

Demo credentials:

- admin user: `admin`
- default password: `Admin@123`

## Key Workflow Expectations

### Claim To Pickup

`REQUEST_CREATED -> PICKUP_ASSIGNED -> PICKUP_IN_PROGRESS -> PICKUP_COMPLETED`

### Runner Flow

- rider receives pickup link by SMS and WhatsApp
- same assignment is visible in runner app inbox
- runner opens tokenized portal
- runner accepts pickup
- runner uploads 10 required device photos plus optional extra photos
- pickup is completed

### Hybrid App Requirement

The `mobile` app is a hybrid shell and should continue using the same runner web flow rather than a separate feature fork.

## Testing

Primary automation lives in:

- `Advance-Playwright-Framework-Testing`

Important commands:

```bash
cd Advance-Playwright-Framework-Testing
node_modules/.bin/tsc --noEmit
node scripts/rule-engine.js
node_modules/.bin/playwright test --project=chromium --workers=1
```

## Documentation Rule

If flows, API contracts, DB structures, menus, or test coverage change, update the matching files in `Docs/`.

## Clone Portability Note

A live Codex chat thread itself does not travel with `git clone`, but this file and `Docs/CODEX-HANDOFF.md` are meant to preserve the important project context so a new Codex session starts with the same repo guidance.
