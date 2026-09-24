# Bug reports (ApexTech)

## Issues found during Exploratory testing

### Bug-01

**Title:** Failed submit still fires marketing conversion events

**Type:** Analytics / Tracking

**Severity:** High

**Steps:**

```text
1. Open /inquire/ with DevTools Network open
2. Leave required fields empty
3. Click Submit
4. Check Facebook / Google Ads / conversion requests.
```

**Expected:**

```text
Conversion events fire only after a successful lead create.
```

**Actual:**

```text
Client validation blocks the lead POST, but the page still attempts Facebook CompleteRegistration (capig.exclusiveresorts.com/events/...) and Google Ads form_submit. Failed submits pollute funnel reporting.
```

### Bug-02

**Title:** Phone number field accepts letters, then silently clears them on blur

**Type:** Functional / Validation

**Severity:** Medium

**Steps:**

```text
1. Paste abcd into Phone
2. Tab out
3. Optionally submit.
```

**Expected:**

```text
Non-numeric input is rejected with a field error (PDF: numeric only; + allowed).
```

**Actual:**

```text
Letters accepted while focused. Later submit fails as “This field is required,” so the user never learns letters are invalid.
```

### Bug-03

**Title:** Phone number field accepts invalid format and does not enforce proper length validation

**Type:** Functional / Validation

**Severity:** Medium

**Steps:**

```text
1. Open the Membership Inquiry form.
2. Enter a phone number starting with a hyphen before the digits (e.g., -1234567890).
3. Verify that the value is accepted by the field.
4. Enter a phone number containing up to 25 digits.
5. Complete the remaining required fields with valid data.
6. Submit the form
```

**Expected:**

```text
The Phone Number field should:

Validate the phone number against the expected format and length.
Reject invalid formats, such as a hyphen appearing before the phone number digits.
Display an appropriate validation message for an invalid phone number.
```

**Actual:**

```text
The Phone Number field accepts a hyphen (-) before the digits as valid input.
The field allows up to 25 digits (a phone number containing 25 digits is treated as valid, indicating that proper phone number length validation is nsufficient).
```

### Bug-04

**Title:** First and Last Name fields accept digits as valid input

**Type:** Functional / Validation

**Severity:** Medium

**Steps:**

```text
1. Open the Membership Inquiry form.
2. Enter digits (e.g., 12345) into the First Name field.
3. Enter digits (e.g., 67890) into the Last Name field.
4. Complete the remaining required fields with valid data.
5. Submit the form
```

**Expected:**

```text
The First Name and Last Name fields should reject numeric-only values and allow only valid name characters according to the requirements. An appropriate validation message should be displayed when an invalid value is entered.
```

**Actual:**

```text
The First Name and Last Name fields accept numeric values and treat them as valid input. The user is able to proceed with digits entered as their name.
```

### Bug-05

**Title:** Required Phone Number field accepts whitespace-only input

**Type:** Functional / Validation

**Severity:** Medium

**Steps:**

```text
1. Open the Membership Inquiry form.
2 .Leave all other required fields completed with valid data.
3. In the Phone number field, enter only spaces (e.g., "     ").
4. Submit the form
```

**Expected:**

```text
The system should trim/ignore leading and trailing whitespace and validate that the Phone number field contains an actual phone number. If the field contains only spaces, the form should prevent submission and display an appropriate validation message.
```

**Actual:**

```text
The form accepts the whitespace-only value as valid input and allows the user to proceed, even though the Phone number field is required.
```

### Bug-06

**Title:** Inconsistent visual highlighting of required field labels after submitting the form with empty mandatory fields

**Type:** Usability / UI

**Severity:** Minor

**Steps:**

```text
1. Navigate to the form page. 
2 .Leave all required fields empty. 
3. Click Submit. 
4. Observe the labels of the required fields.
```

**Expected:**

```text
All required field labels should have consistent styling when validation is triggered. They should either all be highlighted in red or all retain the same default styling, according to the intended design.
```

**Actual:**

```text
After clicking Submit with all required fields empty, the required field labels are styled inconsistently:

PHONE* and PREFERRED CONTACT METHOD* are highlighted in red.
NAME*, EMAIL*, and POSTAL CODE* remain gray.
```

### Bug-07

**Title:** Preferred Time/Days only appear for Phone, not Text

**Type:** Functional / mismatch

**Severity:** Medium

**Steps:**

```text
1. Select Phone - Time/Days appear
2. Select Text.
3. Select Email.
```

**Expected:**

```text
PDF lists Time/Days as optional with no method exception; Text follow-up can still set a window.
```

**Actual:**

```text
Dropdowns show for Phone only. Text and Email hide them. Text users cannot set a callback window.
```

### Bug-08

**Title:** Browser Back button returns to the second step of the completed Membership Inquiry form

**Type:** Functional / Navigation

**Severity:** Medium

**Steps:**

```text
1. Open the Membership Inquiry form.
2. Complete Step 1 with valid information.
3. Proceed to Step 2.
4. Complete Step 2 with valid information.
5. Submit the form successfully.
6. A6fter successful submission, click the browser Back button.
7. Observe the page and form data.
```

**Expected:**

```text
After successful submission, clicking the browser Back button should not return the user to the previously completed form with their submitted data.

The user should be redirected to the beginning of a new form session, with all previously entered data cleared, or to an appropriate page/state defined by the product requirements.
```

**Actual:**

```text
After successfully submitting the Membership Inquiry form, clicking the browser Back button redirects the user to Step 2 of the form with the previously entered data still populated.
```

## Issues found during API testing

### BUG-API-01

**Title:** API returns 502 Bad Gateway when required Email field is missing instead of a 4xx validation error

**Type:** Functional / API Validation

**Severity:** Medium

**Steps:**

```text
1. Send a POST request to {{baseUrl}}{{submitPath}}.
2. Use a valid request payload but remove the required Email field.
3. Send the request.
4. Check the HTTP status code and response body.
```

**Expected:**

```text
API should reject the request with a 4xx client error and return a structured JSON response with field-level error
```

**Actual:**

```text
API returns 502 Bad Gateway. The response body is not valid JSON; Postman reports: Unexpected token 'I' at 1:1. 
```

### BUG-API-02

**Title:** API returns 502 Bad Gateway for malformed email instead of a 4xx validation error

**Type:** Functional / API Validation

**Severity:** Medium

**Steps:**

```text
1. Send a POST request to {{baseUrl}}{{submitPath}}.
2. Provide an invalid email value such as invalid-email.
3. Keep the remaining required fields valid.
4. Send the request.
5. Check the HTTP status code and response body.
```

**Expected:**

```text
API should reject the malformed email with a 4xx validation error and return a structured JSON response indicating that the email format is invalid
```

**Actual:**

```text
API returns 502 Bad Gateway. The response body is not valid JSON; Postman reports: Unexpected token 'I' at 1:1. 
```

### BUG-API-03

**Title:** API accepts membership inquiry when consent is set to false instead of enforcing consent server-side

**Type:** Functional / API Validation

**Severity:** High

**Steps:**

```text
1. Send a POST request to {{baseUrl}}{{submitPath}}.
2. Provide otherwise valid membership inquiry data.
3. Set termsAgreement=false (or omit the consent flag).
4. Send the request.
5. Check the HTTP status code and response body.
```

**Expected:**

```text
API should reject the request with a 4xx client error because the required consent has not been provided. No membership inquiry should be created.
```

**Actual:**

```text
API returns 200 OK with a valid JSON success response, indicating that the submission was accepted despite termsAgreement=false.
```

### BUG-API-04

**Title:** API response time exceeds 2 seconds when processing SQL-injection-style input

**Type:** Performance / API Validation

**Severity:** Medium

**Steps:**

```text
1. Send a POST request to {{baseUrl}}{{submitPath}}.
2. Use the SQL-injection-style value ' OR '1'='1 in the FirstName field.
3. Keep the remaining fields valid.
4. Send the request.
5. Measure the response time.
```

**Expected:**

```text
API should safely process or reject the malicious input without exposing database errors, and the response should complete within the defined 2000 ms response-time threshold.
```

**Actual:**

```text
API returns 200 OK with a valid response and submission ID. No database errors are exposed. However, the response time is 2469.65 ms, exceeding the 2000 ms threshold by approximately 470 ms.
```

### BUG-API-05

**Title:** Submit endpoint returns 502 Bad Gateway for unsupported GET method instead of 405 Method Not Allowed

**Type:** Functional / API Error Handling

**Severity:** Medium

**Steps:**

```text
1. Send a GET request to {{baseUrl}}{{submitPath}}.
2. Do not provide a request body.
3. Send the request.
4. Check the HTTP response status.
```

**Expected:**

```text
API should reject the unsupported HTTP method with 405 Method Not Allowed.
```

**Actual:**

```text
API returns 502 Bad Gateway instead of 405 Method Not Allowed. Response time was under 2000 ms.
```

## Other findings

### Imp-01

**Title:** User can provide Privacy Policy consent without opening the Privacy Policy

**Type:** Functional

**Severity:** Minor

**Steps:**

```text
1. Open the form. 
2. Do not click the Privacy Policy link. 
3. Check the “I expressly consent...” checkbox. 
4. Observe the checkbox state.
```

**Expected:**

```text
The system should require the user to open/review the Privacy Policy before allowing them to provide consent.
```

**Actual:**

```text
The system allows the user to check the consent checkbox without opening or viewing the Privacy Policy.
```

### Imp-02

**Title:** Disable the “Submit” button until all required fields are populated

**Type:** Usability / UI

**Severity:** Minor

**Steps:**

```text
1. Open the Membership Inquiry form.
2. Leave one or more required fields empty.
3. Observe the Submit button.
4. Optionally, click the Submit button while required fields are still empty.
```

**Expected:**

```text
The Submit button should remain disabled until all required fields have been populated with valid values.
Once all required fields contain valid data, the Submit button should become enabled, allowing the user to submit the form.
```

**Actual:**

```text
The Submit button remains enabled even when one or more required fields are empty, allowing the user to attempt to submit an incomplete form
```

### Imp-03

**Title:** Add a success toast message after successful Membership Inquiry form submission

**Type:** Usability / UI

**Severity:** Minor

**Steps:**

```text
1. Open the Membership Inquiry form.
2. Populate all required fields with valid information.
3. Submit the form.
4. Observe the UI after successful submission.
```

**Expected:**

```text
After a successful form submission, a toast notification should be displayed to confirm that the inquiry was received successfully.
For example:
“Your membership inquiry has been submitted successfully.”
```

**Actual:**

```text
The form is submitted successfully, but there is no clear confirmation message indicating that the Membership Inquiry has been successfully submitted.
```

### Imp-04

**Title:** Improve First and Last Name field labels and required-field indication

**Type:** Usability / UI

**Severity:** Minor

**Steps:**

```text
1. Open the Membership Inquiry form.
2. Locate the First Name and Last Name fields.
3. Review the field labels and required-field indicators.
```

**Expected:**

```text
The First Name field has a visible “First name*” label associated with the input
The Last Name field has a visible “Last name*” label associated with the input
The Last Name field is marked as required with an asterisk (*)

```

**Actual:**

```text
The First Name field is labeled “Name*”, which does not clearly indicate that it refers specifically to the first name.
The Last Name field has no visible label and is identified only by the “Last” placeholder.
Although Last Name is required by validation, the field is not visually marked as required with an asterisk.
```

### Bug-to-be-clarified

**Title:** US phone + non-US postal is rejected in submit logic

**Type:** Functional / Validation

**Severity:** Medium

**Steps:**

```text
1. Use US +1 phone (e.g.+1 984 663 3630) and international postal (e.g. SW1A 1AA).
2. Attempt submit.
```

**Expected:**

```text
PDF: postal required for US and international.
```

**Actual:**

```text
UK-style postal with US phone fails with “Format US ZIP Code as '12345' or '12345-6789'.”
```

