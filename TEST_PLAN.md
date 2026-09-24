# Test Plan — Exclusive Resorts membership inquiry form

**SUT:** https://public-site.stage.exclusiveresorts.com/inquire/
**Date:** 2026-09-20
**Author:** Nataliia

Playwright runs the live UI and stubs `POST /submit-form/` and `POST /validate-email/`, so it never creates a CRM lead. Postman calls `POST /submit-form/` on staging. UI and API use the same identity: `QA Candidate` / `Nataliia` / `qa.candidate+test@gmail.com` / ZIP `80302` / phone `3035550100` (posted `+1 303 555 0100`).

## Scope and out of scope

In scope is the first-step form on `/inquire/` and the submit API that form posts to. A bug here drops a lead, writes a lead sales cannot use, or skips a legal consent check. Playwright proves what the browser does. Postman proves what the server does if the browser is skipped. The stub cannot stand in for that.

**UI — this submission (Playwright).** Assignment fields only: Name, Email, Postal Code, Phone, Preferred Contact Method (Phone / Text / Email), optional Time of Day and Days, required email consent, optional SMS, Submit. Automated in `inquiry-form.spec.ts`: TC-01, TC-02, TC-03, TC-06, TC-07, TC-11, TC-12, and TC-13.

- Smoke: TC-01 (form loads, labels included), TC-02 (one valid submit, SMS off). If this fails, there is no inquiry.
- Required fields: TC-03 (empty submit).
- Consent: TC-06. Client-only is not enough, which is why API-04 exists.
- Security: TC-07, one XSS payload in Name, shown as text, no dialog, no lead.
- Accessibility: labels in TC-01. Imp-04: the first name's accessible name is `Name*`, and last name has no label (placeholder `Last`). Keyboard: TC-11. An unreachable required control blocks the lead.
- Viewport: TC-12 at 375px. In because the brief asks. P2 because it does not stop the main desktop path.
- Edges: TC-13 double-click creates one request.

**UI — later Playwright.** Outside this submission because of the 4–6 hour limit.

- Format: TC-04 rejects `foo@` and `foo.com`. TC-05 is paste, not typing: `abcd` is rejected, and `(303) 555-0100` is accepted as digits. People paste from contacts; keystroke filtering can pass while paste still fails.
- Required fields: TC-09 is separate because Phone stays required even when Preferred Contact Method is Email. That lead is still unusable, and the rule is easy to treat as optional.
- Contact method: TC-10. Radios are exclusive. Time/Days show for Phone, with the spec options, and may stay empty.
- Edges: TC-14 is a very long Name. TC-08 is required, not optional: `+` on an international phone, US ZIP `80302`, and non-US postal `SW1A 1AA`.

**API — in.** `POST /submit-form/` only, body `values` + `form=SHORT_FORM`. Each row is a server fact the stub cannot prove.

- API-01 — valid fields. 2xx and a success payload. One real body proves the server accepts what the stub only pretends to accept.
- API-02 — Email omitted. 4xx and JSON. TC-03 never leaves the browser. The script checks status and JSON, not a specific field-error string.
- API-03 — email `invalid-email`. 4xx and JSON. TC-04 is client-only. Sales cannot reply to a bad address that the server still stores.
- API-04 — `termsAgreement=false`. 4xx. Same legal control as TC-06, one layer down. A 200 here means the checkbox is decorative.
- API-05 — Name `' OR '1'='1`. 2xx, and the body does not leak `sql`, `syntax error`, `database`, or `mysql`. This is not the XSS check. The assertion is “no database error leaked,” not a claim the value was sanitized in storage.
- API-06 — GET on the submit URL. 405. This route is a write. GET is the call a browser or monitor actually makes by mistake.
- API-07 — 10 sequential valid calls. Each call and p95 under 2000ms. A hang looks like a failed submit and invites the double-click in TC-13. This is not a load test.
- API-08 — success body has `data` as an object and `data.id` as a positive integer. The Playwright stub invented that shape. Only a live 2xx shows it is real.

**Out of scope**

- Site nav, Member Login, cookie center, promo overlay. They do not submit this form.
- Hidden `#pardot-membership-form`. A different flow, and it stays hidden on `/inquire/`.
- Marketing and hidden CRM fields. The user cannot change them, and they are not in the assignment field list.
- Salesforce and the lead record after a 2xx. No CRM access. API-01 and API-08 stop at the HTTP body.
- `POST /validate-email/` as its own suite. Playwright stubs it so the form can proceed. Email rejection on the write that creates the lead is API-03.
- PUT, PATCH, DELETE, OPTIONS. GET (API-06) is the mistaken call that happens. The others do not change lead creation.
- A matrix of every omitted field, bad email, country, and contact method. API-02 asks the server question once (missing Email). TC-03 and TC-09 cover the UI rules that are easy to get wrong.
- Time/Days, SMS, and postal format repeated as extra valid API posts. Those rules are on the form (TC-02, TC-08, TC-10). More valid posts create more real leads and do not catch a new class of bug.
- XSS or SQL catalogs, auth bypass, rate-limit evasion. One XSS case (TC-07) and one SQL-shaped name (API-05).
- Load beyond 10 sequential calls. No traffic profile was given.
- A full WCAG or Lighthouse audit. The brief asks for keyboard (TC-11), 375px (TC-12), and labels (TC-01).

## Risk and priority

P0 stops the inquiry, skips consent, or runs script. P1 lets a lead through that sales cannot use, or fails a path real users take. P2 is format, locale, or layout that does not block the main US path. One case per risk, not every permutation.

- No lead at all. TC-01 and TC-02 are P0. SMS-on is not a second happy path; SMS stays off inside TC-02.
- Incomplete lead. TC-03 is P0. TC-09 is P1: Email looks like it should make Phone optional, and it must not.
- Phone paste. TC-05 is P1. Typing the same strings would hide a widget that filters keys and still accepts letters on paste, or strips a valid formatted number.
- Bad email. TC-04 is P1. Not every invalid address.
- Consent. TC-06 is P0. Marketing forms cannot store a lead the person did not agree to.
- XSS. TC-07 is P0 for one Name payload. It does not claim the app is fully XSS-proof.
- Double submit. TC-13 is P1. One gesture, two leads.
- Callback window. TC-10 is P1. One case for exclusive radios and Time/Days, not one case per option.
- International formats. TC-08 is P2. The spec requires them; the primary path is still US.
- Access. TC-11 is P1. TC-12 and TC-14 are P2.

The server is a separate risk, because the UI stops at the stub.

- API-01 and API-08 are the contract. Without them, “valid submit” is a mocked 200.
- API-02, API-03, and API-04 are the highest API priority. A 200 means the client checks do not protect the CRM. API-04 is the legal one.
- API-05 looks for a leaked database error. XSS stays on TC-07.
- API-06 checks the URL is POST-only.
- API-07 sits lower. A slow 2xx still creates the lead. The suite stops at 10 calls.

## Test cases

| ID | Title | Type | Priority | Layer |
| --- | --- | --- | --- | --- |
| TC-01 | Documented fields load with associated labels | Smoke / Accessibility | P0 | Playwright |
| TC-02 | Valid required-only submission with SMS off | Smoke | P0 | Playwright |
| TC-03 | Empty submission is blocked | Field validation | P0 | Playwright |
| TC-04 | Malformed email (`foo@`, `foo.com`) is rejected on an otherwise valid form | Field validation | P1 | Playwright (later) |
| TC-05 | Phone rejects alphabetic paste (`abcd`); formatted paste `(303) 555-0100` is accepted | Field validation | P1 | Playwright (later) |
| TC-06 | Consent is required | Compliance | P0 | Playwright |
| TC-07 | XSS input in Name is treated as text | Security | P0 | Playwright |
| TC-08 | International phone with `+` is accepted; postal accepts US ZIP `80302` and non-US `SW1A 1AA` | Field validation / Edge | P2 | Playwright (later) |
| TC-09 | Phone remains required when Preferred Contact Method is Email | Field validation | P1 | Playwright (later) |
| TC-10 | Contact-method radios are exclusive; Time/Days options match the spec when shown | Functional | P1 | Playwright (later) |
| TC-11 | Form is completable by keyboard (tab, radios, checkboxes, Enter to submit) | UX / Accessibility | P1 | Playwright |
| TC-12 | Form is completable at a 375px viewport | UX / Accessibility | P2 | Playwright |
| TC-13 | Double-clicking Submit does not create two submissions | Edge | P1 | Playwright |
| TC-14 | Very long Name does not crash the page or fail silently | Edge | P2 | Playwright (later) |
| API-01 | POST with all valid fields returns 2xx and a success payload | Smoke | P0 | Postman |
| API-02 | POST with Email omitted returns 4xx and JSON | Field validation | P0 | Postman |
| API-03 | POST with email `invalid-email` returns 4xx and JSON | Field validation | P1 | Postman |
| API-04 | POST with `termsAgreement=false` returns 4xx | Compliance | P0 | Postman |
| API-05 | POST with SQL-shaped Name `' OR '1'='1` does not leak a database error | Security | P0 | Postman |
| API-06 | GET on the submit endpoint returns 405 | Edge | P1 | Postman |
| API-07 | p95 over 10 sequential calls is under 2000ms | Edge | P2 | Postman |
| API-08 | Success body has object `data` and positive integer `data.id` | Smoke | P0 | Postman |

“Playwright (later)” means planned Playwright, not in this submission.

Sheet IDs are defects, not test IDs. TC-01 records Imp-04. The API failures map as API-02 → BUG-API-01, API-03 → BUG-API-02, API-04 → BUG-API-03, API-05 → BUG-API-04, API-06 → BUG-API-05. Bug-05 is whitespace-only phone. Bug-06 is inconsistent required-label highlighting.
