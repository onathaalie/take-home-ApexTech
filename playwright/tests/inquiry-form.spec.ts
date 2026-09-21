import {
  expect,
  test,
  validInquiryData,
} from '../fixtures/inquiry.fixtures';

test.describe('Membership inquiry form', () => {
  test('TC-01 — required fields and controls exist @smoke', async ({ inquiryPage, page }) => {
    await expect(inquiryPage.firstName).toBeVisible();
    await expect(inquiryPage.lastName).toBeVisible();
    await expect(inquiryPage.email).toBeVisible();
    await expect(inquiryPage.postalCode).toBeVisible();
    await expect(inquiryPage.phone).toBeVisible();
    await expect(inquiryPage.countrySelector).toBeVisible();
    await expect(inquiryPage.preferredContactRadio('Phone')).toBeAttached();
    await expect(inquiryPage.preferredContactRadio('Text')).toBeAttached();
    await expect(inquiryPage.preferredContactRadio('Email')).toBeAttached();
    await expect(inquiryPage.consentCheckbox).toBeAttached();
    await expect(inquiryPage.smsCheckbox).toBeAttached();
    await expect(inquiryPage.submitButton).toBeVisible();

    await expect(inquiryPage.timeOfDayGroup).toBeHidden();
    await expect(inquiryPage.preferredDaysGroup).toBeHidden();

    await expect(inquiryPage.email).toHaveAccessibleName('Email*');
    await expect(inquiryPage.postalCode).toHaveAccessibleName('Postal Code*');
    await expect(inquiryPage.consentCheckbox).toHaveAccessibleName(/expressly consent/i);
    await expect(inquiryPage.smsCheckbox).toHaveAccessibleName(/sms updates/i);
    await expect(inquiryPage.submitButton).toHaveAccessibleName('Submit');
    await expect(inquiryPage.countrySelector).toHaveAccessibleName('Country Code Selector');

    // BUG-05: Last name is required but has no associated label.
    await expect(page.getByLabel('Last', { exact: true })).toHaveCount(0);
    await expect(inquiryPage.lastName).toHaveAttribute('placeholder', 'Last');

    // BUG-06: Phone title is not the accessible name; the placeholder is.
    await expect(inquiryPage.phone).toHaveAccessibleName('Enter a phone number');
    await expect(page.getByRole('textbox', { name: 'Phone*' })).toHaveCount(0);
  });

  test('TC-02 — valid submission @smoke @regression', async ({
    inquiryPage,
    interceptedSubmissions,
    page,
  }) => {
    await inquiryPage.fillRequiredFields(validInquiryData);
    await inquiryPage.setConsent(true);
    await expect(inquiryPage.smsCheckbox).not.toBeChecked();

    await inquiryPage.submit();

    await expect.poll(() => interceptedSubmissions.length).toBe(1);

    const submission = interceptedSubmissions[0];
    expect(submission.url).toContain('/submit-form/');
    expect(submission.method).toBe('POST');
    expect(submission.form).toBe('SHORT_FORM');
    expect(submission.values.FirstName).toBe(validInquiryData.firstName);
    expect(submission.values.LastName).toBe(validInquiryData.lastName);
    expect(submission.values.Email).toBe(validInquiryData.email);
    expect(submission.values.ZIP).toBe(validInquiryData.postalCode);
    expect(submission.values.Phone).toBe(validInquiryData.postedPhone);
    expect(submission.values.preferredContactType).toBe('Email');
    expect(submission.values.termsAgreement).toBe('true');
    expect(submission.values.smsOptIn).toBe('');
    expect(submission.values.smsOptIn).not.toBe('true');

    const reachedSuccess = await page
      .waitForURL('**/submission-success/**', { timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (reachedSuccess) {
      await expect(
        page.getByText('Thank you for inquiring about Club Membership.'),
      ).toBeVisible();
    }

    expect(interceptedSubmissions).toHaveLength(1);
  });

  test('TC-03 — empty submission is blocked @negative @regression', async ({
    inquiryPage,
    interceptedSubmissions,
    page,
  }) => {
    await inquiryPage.submit();

    await expect(inquiryPage.validationBanner).toBeVisible();
    await expect(inquiryPage.requiredFieldErrors).toHaveCount(4);
    await expect(inquiryPage.phoneRequiredError).toBeVisible();
    await expect(inquiryPage.contactMethodError).toBeVisible();
    await expect(inquiryPage.consentRequiredError).toBeAttached();
    await expect(inquiryPage.consentRequiredError).toHaveText('TermsAgreement is required.');
    await expect(page).toHaveURL(/\/inquire\/?$/);
    expect(interceptedSubmissions).toHaveLength(0);
  });

  test('TC-06 — consent is required @negative @regression', async ({
    inquiryPage,
    interceptedSubmissions,
    page,
  }) => {
    await inquiryPage.fillRequiredFields(validInquiryData);
    await expect(inquiryPage.consentCheckbox).not.toBeChecked();
    await expect(inquiryPage.smsCheckbox).not.toBeChecked();

    await inquiryPage.submit();

    await expect(inquiryPage.validationBanner).toBeVisible();
    await expect(inquiryPage.consentRequiredError).toBeAttached();
    await expect(inquiryPage.consentRequiredError).toHaveText('TermsAgreement is required.');
    await expect(page).toHaveURL(/\/inquire\/?$/);
    expect(interceptedSubmissions).toHaveLength(0);
  });

  test('TC-07 — XSS payload in Name is treated as text @regression', async ({
    inquiryPage,
    interceptedSubmissions,
    page,
  }) => {
    const xssName = 'QA <script>alert(1)</script>';
    let dialogOpened = false;
    page.on('dialog', async (dialog) => {
      dialogOpened = true;
      await dialog.dismiss();
    });

    await inquiryPage.fillRequiredFields({
      ...validInquiryData,
      firstName: xssName,
    });
    await inquiryPage.setConsent(true);
    await inquiryPage.submit();

    await expect(inquiryPage.firstName).toHaveValue(xssName);
    expect(dialogOpened).toBe(false);
    await expect(page.getByText('Name* is not an allowed value.')).toBeVisible();
    await expect(page).toHaveURL(/\/inquire\/?$/);
    expect(interceptedSubmissions).toHaveLength(0);
  });

  test('TC-13 — double-click does not create duplicate submissions @regression', async ({
    inquiryPage,
    interceptedSubmissions,
  }) => {
    await inquiryPage.fillRequiredFields(validInquiryData);
    await inquiryPage.setConsent(true);

    await inquiryPage.doubleClickSubmit();

    await expect.poll(() => interceptedSubmissions.length).toBe(1);
    expect(interceptedSubmissions[0].values.Email).toBe(validInquiryData.email);
    expect(interceptedSubmissions[0].values.termsAgreement).toBe('true');
  });
});
