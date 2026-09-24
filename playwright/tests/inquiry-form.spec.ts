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

    // Imp-04: First name's accessible name is "Name*". Last name has no label, only the "Last" placeholder.
    await expect(inquiryPage.firstName).toHaveAccessibleName('Name*');
    await expect(page.getByLabel('Last', { exact: true })).toHaveCount(0);
    await expect(inquiryPage.lastName).toHaveAttribute('placeholder', 'Last');

    // Phone's accessible name is the placeholder.
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

    await expect(page.getByRole('heading', { name: 'We appreciate your interest.' })).toBeVisible();
    await expect(
      page.getByText('A Membership Director will connect with you shortly.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/inquire\/?$/);

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

  test('TC-11 — form is completable by keyboard @regression', async ({
    inquiryPage,
    interceptedSubmissions,
    page,
  }) => {
    await inquiryPage.fillRequiredFieldsWithKeyboard(validInquiryData);
    await inquiryPage.submitWithEnter();

    await expect.poll(() => interceptedSubmissions.length).toBe(1);
    expect(interceptedSubmissions[0].url).toContain('/submit-form/');
    expect(interceptedSubmissions[0].method).toBe('POST');
    expect(interceptedSubmissions[0].values.FirstName).toBe(validInquiryData.firstName);
    expect(interceptedSubmissions[0].values.LastName).toBe(validInquiryData.lastName);
    expect(interceptedSubmissions[0].values.Email).toBe(validInquiryData.email);
    expect(interceptedSubmissions[0].values.preferredContactType).toBe('Email');
    expect(interceptedSubmissions[0].values.termsAgreement).toBe('true');
    expect(interceptedSubmissions[0].values.smsOptIn).not.toBe('true');

    await expect(page.getByRole('heading', { name: 'We appreciate your interest.' })).toBeVisible();
    await expect(page).toHaveURL(/\/inquire\/?$/);
    expect(interceptedSubmissions).toHaveLength(1);
  });

  test.describe('375px viewport', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('TC-12 — form is completable at 375px @regression', async ({
      inquiryPage,
      interceptedSubmissions,
      page,
    }) => {
      expect(page.viewportSize()).toEqual({ width: 375, height: 812 });
      await inquiryPage.assertFitsViewport();

      await inquiryPage.fillRequiredFields(validInquiryData);
      await inquiryPage.setConsent(true);
      await expect(inquiryPage.smsCheckbox).not.toBeChecked();
      await inquiryPage.submit();

      await expect.poll(() => interceptedSubmissions.length).toBe(1);
      expect(interceptedSubmissions[0].url).toContain('/submit-form/');
      expect(interceptedSubmissions[0].method).toBe('POST');
      expect(interceptedSubmissions[0].values.Email).toBe(validInquiryData.email);
      expect(interceptedSubmissions[0].values.termsAgreement).toBe('true');
      expect(interceptedSubmissions[0].values.smsOptIn).not.toBe('true');

      await expect(page.getByRole('heading', { name: 'We appreciate your interest.' })).toBeVisible();
      await expect(page).toHaveURL(/\/inquire\/?$/);
      expect(interceptedSubmissions).toHaveLength(1);
    });
  });

  test.describe('submit response still in flight', () => {
    // An instant stub closes before the second click of dblclick() can race it.
    // Hold the response so a duplicate POST has a real pending window.
    test.use({ submitResponseDelayMs: 800 });

    test('TC-13 — double-click does not create duplicate submissions @regression', async ({
      inquiryPage,
      interceptedSubmissions,
      page,
    }) => {
      await inquiryPage.fillRequiredFields(validInquiryData);
      await inquiryPage.setConsent(true);

      await inquiryPage.doubleClickSubmit();

      await expect(page.getByRole('heading', { name: 'We appreciate your interest.' })).toBeVisible();

      expect(interceptedSubmissions).toHaveLength(1);
      expect(interceptedSubmissions[0].values.Email).toBe(validInquiryData.email);
      expect(interceptedSubmissions[0].values.termsAgreement).toBe('true');
    });
  });
});
