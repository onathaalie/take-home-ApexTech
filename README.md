# Exclusive Resorts QA Take-Home — Playwright UI Automation

Playwright TypeScript coverage for the Exclusive Resorts membership inquiry form:

https://public-site.stage.exclusiveresorts.com/inquire/

The suite exercises the **live UI** and **never creates CRM leads**. Submission `POST /submit-form/` and `POST /validate-email/` are intercepted with `page.route()`, captured, and stubbed.

## Prerequisites

- Node.js 18+ (verified with Node 24)
- npm

## Installation

```bash
npm install
npx playwright install chromium webkit
```

## How to run

All tests (Chromium + WebKit):

```bash
npx playwright test
```

By tag:

```bash
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep @negative
```

On PowerShell, quote the tag: `--grep "@smoke"`.

One test:

```bash
npx playwright test --grep "TC-02"
```

HTML report:

```bash
npx playwright show-report
```

npm scripts: `npm test`, `npm run test:smoke`, `npm run test:regression`, `npm run test:negative`, `npm run test:report`.

## Architecture

| Path | Role |
| --- | --- |
| `playwright/pages/InquiryPage.ts` | Page Object — locators and form actions |
| `playwright/fixtures/inquiry.fixtures.ts` | Shared fake data + network stubs |
| `playwright/tests/inquiry-form.spec.ts` | TC-01, TC-02, TC-03, TC-06, TC-07, TC-13 |
| `playwright.config.ts` | Chromium, WebKit, HTML reporter, CI retries |

Locators prefer user-facing APIs (`getByRole`, `getByPlaceholder`, `getByText`). Last name has no label (BUG-05), so it uses the `Last` placeholder. Phone uses the accessible name `Enter a phone number` (BUG-06).

## Network interception / production safety

Before navigation, the fixture stubs:

- `POST **/submit-form/` → HTTP 200 `{ data: { id: "qa-stubbed-lead" } }`
- `POST **/validate-email/` → `{ valid: true }`

Those requests **never** `continue()` to the backend.

Happy-path payload assertions (TC-02 / TC-13) use the captured body:

`{"values":"<urlencoded fields>","form":"SHORT_FORM"}`

Expected identity fields:

- FirstName: `QA Candidate`
- LastName: `Nataliia`
- Email: `qa.candidate+test@gmail.com`

SMS stays off (`smsOptIn` empty). Consent is `termsAgreement=true` on valid submit.

| Case | Submit POSTs |
| --- | --- |
| TC-02 | exactly 1 |
| TC-03 | 0 |
| TC-06 | 0 |
| TC-07 | 0 (client rejects XSS as `Name* is not an allowed value.`) |
| TC-13 | exactly 1 (double-click) |

TC-07 does **not** claim the app is fully XSS-proof. It checks that this payload is shown as text, does not open a dialog, and is not posted to CRM.

## CI

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs `npx playwright test` on push and pull request to `main` (Node 20, Chromium, WebKit). Lead safety stays in the test fixture: the same `page.route()` stubs block `POST /submit-form/` and `POST /validate-email/` before navigation, including in CI.

## Known limitations

- Chromium needs a realistic Chrome user-agent; CloudFront otherwise returns 403.
- After a stubbed 200, the client may still stay on `/inquire/` if Braze tracking throws. Payload count is the pass/fail for lead creation.
- Cookie banner is dismissed when present (`Accept All`).
