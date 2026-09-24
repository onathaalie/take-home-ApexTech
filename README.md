# Exclusive Resorts QA Take-Home

This repository is the full submission: Playwright UI automation and Postman API tests for the Exclusive Resorts membership inquiry form.

https://public-site.stage.exclusiveresorts.com/inquire/

## Submission map

| Artifact | Where |
| --- | --- |
| Playwright UI suite | [`playwright/`](playwright/) |
| Postman collection and environment | [`postman/`](postman/) |
| Test plan | [`TEST_PLAN.md`](TEST_PLAN.md) |
| Bug report | [`BUG_REPORTS.md`](BUG_REPORTS.md) |

Failed API assertions are recorded in [`BUG_REPORTS.md`](BUG_REPORTS.md). This README only summarizes the run.

## UI automation

Playwright TypeScript coverage for the membership inquiry form. The suite exercises the **live UI** and **never creates CRM leads**. Submission `POST /submit-form/` and `POST /validate-email/` are intercepted with `page.route()`, captured, and stubbed.

### Prerequisites

- Node.js 18+ (verified with Node 24)
- npm

### Installation

```bash
npm install
npx playwright install chromium webkit
```

### How to run

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

npm scripts: `npm test`, `npm run test:smoke`, `npm run test:regression`, `npm run test:negative`, `npm run test:report`, `npm run typecheck`.

### Architecture

| Path | Role |
| --- | --- |
| `playwright/pages/InquiryPage.ts` | Page Object — locators and form actions |
| `playwright/fixtures/inquiry.fixtures.ts` | Shared fake data + network stubs |
| `playwright/tests/inquiry-form.spec.ts` | TC-01, TC-02, TC-03, TC-06, TC-07, TC-11, TC-12, TC-13 |
| `playwright.config.ts` | Chromium, WebKit, HTML reporter, CI retries |

Automated in `inquiry-form.spec.ts`: TC-01, TC-02, TC-03, TC-06, TC-07, TC-11, TC-12, and TC-13.

TC-04, TC-05, TC-08, TC-09, TC-10, and TC-14 are assigned to Playwright for a later stage. Those cases are not in the spec yet. The 4–6 hour limit keeps them out of this submission.

Locators prefer user-facing APIs (`getByRole`, `getByPlaceholder`, `getByText`). Last name has no label (Imp-04), so it uses the `Last` placeholder. Phone uses the accessible name `Enter a phone number`.

### Network interception / production safety

Before navigation, the fixture stubs:

- `POST **/submit-form/` → HTTP 200 `{ data: { id: "qa-stubbed-lead" } }`
- `POST **/validate-email/` → `{ valid: true }`

Those requests **never** `continue()` to the backend.

Happy-path payload assertions (TC-02, TC-11, TC-12, TC-13) use the captured body:

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
| TC-11 | exactly 1 (keyboard Enter) |
| TC-12 | exactly 1 (375px viewport) |
| TC-13 | exactly 1 (double-click) |

TC-07 does **not** claim the app is fully XSS-proof. It checks that this payload is shown as text, does not open a dialog, and is not posted to CRM.

### CI

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs `npm run typecheck` and then `npx playwright test` on push and pull request to `main` (Node 20, Chromium, WebKit). Lead safety stays in the test fixture: the same `page.route()` stubs block `POST /submit-form/` and `POST /validate-email/` before navigation, including in CI.

The API collection is not part of that workflow. Several requests POST to staging and can create real leads.

### Known limitations

- Chromium needs a realistic Chrome user-agent; CloudFront otherwise returns 403.
- A valid submit stays on `/inquire/` and shows “We appreciate your interest.” TC-02 requires that confirmation. It does not treat `/submission-success/` as optional.
- Cookie banner is dismissed when present (`Accept All`).

## API tests

Postman collection in [`postman/`](postman/) for the membership inquiry submit API. Requests use `{{baseUrl}}{{submitPath}}`. Name, email, phone, and ZIP match the Playwright identity (`QA Candidate` / `Nataliia` / `qa.candidate+test@gmail.com` / `+1 303 555 0100` / `80302`). The environment file has no passwords, API keys, or tokens.

API-01, API-05, API-07, and API-08 POST to staging and can create real leads.

### Coverage

- **API-01** — POST with all valid fields
- **API-02** — POST with a missing required field
- **API-03** — POST with a malformed email
- **API-04** — POST without valid consent
- **API-05** — POST with a SQL-injection-style payload in the name field
- **API-06** — GET request to the submit endpoint
- **API-07** — Response time and p95 over 10 requests
- **API-08** — Response schema and data type validation

Assertions use Postman test scripts for status codes, response time, JSON shape, required fields, and security-related response content. Defects for the failing cases are in [`BUG_REPORTS.md`](BUG_REPORTS.md).

### Environment variables

| Variable | Role |
| --- | --- |
| `baseUrl` | Target origin. Staging: `https://public-site.stage.exclusiveresorts.com` |
| `submitPath` | Submit path (`/submit-form/`) |
| `testEmail`, `testPhone`, `firstName`, `lastName`, `zip` | Valid synthetic identity |
| `termsAgreement`, `termsAgreementFalse` | Consent on and off |
| `fbId`, `preferredTime`, `preferredDays`, `preferredContactType` | Optional contact fields |
| `invalidEmail` | Malformed email for API-03 |
| `sqlInjectionName` | SQL-injection-style first name for API-05 |

`baseUrl` also builds `C_Page_URL` and `Referrer_URL`, so those values are not hardcoded in the body. Switch environments by changing `baseUrl`.

### How to run

From the repo root, after `npm install`:

```bash
npx newman run postman/collection.json -e postman/environment.json
```

The same command is `npm run test:api`.

Newman prints requests, status codes, response times, and pass/fail counts. A non-zero exit code is expected while API-02 through API-06 still fail.

API-07 stores each response time and calculates p95 only when that request is on iteration 10 (`pm.info.iteration === 9`). The command above is a single collection run, so it does not re-check p95. The PASS below was observed on a 10-iteration run of that request.

### Execution summary

| Test | Result | Summary |
| --- | --- | --- |
| API-01 | PASS | Valid submission returned the expected success response |
| API-02 | FAIL | BUG-API-01. Missing email returned 502 instead of 4xx; response was not valid JSON |
| API-03 | FAIL | BUG-API-02. Malformed email returned 502 instead of 4xx; response was not valid JSON |
| API-04 | FAIL | BUG-API-03. Request without valid consent returned 200 instead of 4xx |
| API-05 | FAIL | BUG-API-04. SQL-injection-style input was handled without DB errors, but response exceeded 2000 ms |
| API-06 | FAIL | BUG-API-05. GET request returned 502 instead of 405 |
| API-07 | PASS | 10-request performance test and p95 assertion passed |
| API-08 | PASS | Response schema and data types matched the tested contract |
