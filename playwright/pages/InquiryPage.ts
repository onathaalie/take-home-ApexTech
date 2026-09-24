import { expect, type Locator, type Page } from '@playwright/test';

export type PreferredContact = 'Phone' | 'Text' | 'Email';

export class InquiryPage {
  readonly page: Page;
  readonly form: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('#pardot-short-form');
  }

  get firstName(): Locator {
    return this.form.getByRole('textbox', { name: 'Name*' });
  }

  get lastName(): Locator {
    return this.form.getByPlaceholder('Last');
  }

  get email(): Locator {
    return this.form.getByRole('textbox', { name: 'Email*' });
  }

  get postalCode(): Locator {
    return this.form.getByRole('textbox', { name: 'Postal Code*' });
  }

  get phone(): Locator {
    return this.form.getByRole('textbox', { name: 'Enter a phone number' });
  }

  get countrySelector(): Locator {
    return this.form.getByRole('button', { name: 'Country Code Selector' });
  }

  get consentCheckbox(): Locator {
    return this.form.getByRole('checkbox', { name: /expressly consent/i });
  }

  get smsCheckbox(): Locator {
    return this.form.getByRole('checkbox', { name: /sms updates/i });
  }

  get submitButton(): Locator {
    return this.form.getByRole('button', { name: 'Submit' });
  }

  get validationBanner(): Locator {
    return this.form.getByText(
      'There was a problem with your submission. Please review the fields below.',
    );
  }

  get requiredFieldErrors(): Locator {
    return this.form.getByText('This field is required.', { exact: true });
  }

  get phoneRequiredError(): Locator {
    return this.form.getByText('This field is required', { exact: true });
  }

  get contactMethodError(): Locator {
    return this.form.getByText('Please select your preferred contact method');
  }

  get consentRequiredError(): Locator {
    return this.form.getByText('TermsAgreement is required.');
  }

  get timeOfDayGroup(): Locator {
    return this.form.locator('.field-group').filter({
      hasText: 'Preferred Time of Day',
    });
  }

  get preferredDaysGroup(): Locator {
    return this.form.locator('.field-group').filter({
      hasText: 'Preferred Days',
    });
  }

  preferredContactRadio(method: PreferredContact): Locator {
    return this.form.getByRole('radio', { name: method, exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/inquire/', { waitUntil: 'domcontentloaded' });
    await this.form.waitFor({ state: 'visible' });
    await this.dismissCookieBanner();
    await this.submitButton.waitFor({ state: 'visible' });
    await this.waitForHydratedForm();
  }

  private async waitForHydratedForm(): Promise<void> {
    await this.form.locator('input[name="FirstName"]').waitFor({ state: 'visible' });
    await expect(async () => {
      await this.firstName.fill('hydrate-check');
      await this.firstName.evaluate(
        (el) =>
          new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
      );
      await expect(this.firstName).toHaveValue('hydrate-check');
    }).toPass({ timeout: 20_000 });
    await this.firstName.fill('');
    await expect(this.firstName).toHaveValue('');
  }

  async dismissCookieBanner(): Promise<void> {
    const acceptAll = this.page.getByRole('button', { name: 'Accept All' });
    try {
      await acceptAll.waitFor({ state: 'visible', timeout: 3_000 });
    } catch (error) {
      if (this.page.isClosed()) {
        throw error;
      }
      return;
    }
    await acceptAll.click();
    await expect(acceptAll).toBeHidden();
  }

  async fillRequiredFields(data: {
    firstName: string;
    lastName: string;
    email: string;
    postalCode: string;
    phone: string;
  }): Promise<void> {
    await this.fillAndConfirm(this.firstName, data.firstName);
    await this.fillAndConfirm(this.lastName, data.lastName);
    await this.fillAndConfirm(this.email, data.email);
    await this.fillAndConfirm(this.postalCode, data.postalCode);

    await this.phone.click();
    await this.phone.fill(data.phone);
    await this.phone.press('Tab');
    await expect(this.phone).toHaveValue(/303/);

    await this.selectPreferredContact('Email');

    await expect(this.firstName).toHaveValue(data.firstName);
    await expect(this.lastName).toHaveValue(data.lastName);
    await expect(this.email).toHaveValue(data.email);
    await expect(this.postalCode).toHaveValue(data.postalCode);
  }

  private async fillAndConfirm(locator: Locator, value: string): Promise<void> {
    await expect(async () => {
      await locator.click();
      await locator.fill(value);
      await expect(locator).toHaveValue(value);
    }).toPass({ timeout: 10_000 });
  }

  async selectPreferredContact(method: PreferredContact): Promise<void> {
    const option = this.form
      .getByRole('group', { name: /Preferred Contact Method/i })
      .getByText(method, { exact: true });
    await option.click();
    await expect(this.preferredContactRadio(method)).toBeChecked();
  }

  async setConsent(checked: boolean): Promise<void> {
    const consentCopy = this.form.getByText(/I expressly consent to receive emails/i).first();
    if ((await this.consentCheckbox.isChecked()) !== checked) {
      await consentCopy.click();
    }
    if (checked) {
      await expect(this.consentCheckbox).toBeChecked();
    } else {
      await expect(this.consentCheckbox).not.toBeChecked();
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async doubleClickSubmit(): Promise<void> {
    await this.submitButton.dblclick();
  }

  async tabTo(locator: Locator, maxTabs = 20): Promise<void> {
    for (let i = 0; i < maxTabs; i++) {
      if (await locator.evaluate((el) => el === document.activeElement)) {
        return;
      }
      await this.page.keyboard.press('Tab');
    }
    await expect(locator).toBeFocused();
  }

  async fillRequiredFieldsWithKeyboard(data: {
    firstName: string;
    lastName: string;
    email: string;
    postalCode: string;
    phone: string;
  }): Promise<void> {
    await this.firstName.focus();
    await this.page.keyboard.type(data.firstName);
    await this.tabTo(this.lastName);
    await this.page.keyboard.type(data.lastName);
    await this.tabTo(this.email);
    await this.page.keyboard.type(data.email);
    await this.tabTo(this.postalCode);
    await this.page.keyboard.type(data.postalCode);
    await this.tabTo(this.phone);
    await this.page.keyboard.type(data.phone);

    await this.tabTo(this.preferredContactRadio('Phone'));
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('ArrowDown');
    await expect(this.preferredContactRadio('Email')).toBeChecked();

    await this.tabTo(this.consentCheckbox);
    await this.page.keyboard.press('Space');
    await expect(this.consentCheckbox).toBeChecked();

    await this.tabTo(this.smsCheckbox);
    await this.page.keyboard.press('Space');
    await expect(this.smsCheckbox).toBeChecked();
    await this.page.keyboard.press('Space');
    await expect(this.smsCheckbox).not.toBeChecked();

    await expect(this.firstName).toHaveValue(data.firstName);
    await expect(this.lastName).toHaveValue(data.lastName);
    await expect(this.email).toHaveValue(data.email);
    await expect(this.postalCode).toHaveValue(data.postalCode);
    await expect(this.phone).toHaveValue(/303/);
  }

  async submitWithEnter(): Promise<void> {
    await this.tabTo(this.submitButton);
    await this.page.keyboard.press('Enter');
  }

  async assertFitsViewport(): Promise<void> {
    const viewport = this.page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size is not set');
    }

    const controls = [
      this.firstName,
      this.lastName,
      this.email,
      this.postalCode,
      this.phone,
      this.submitButton,
    ];

    for (const control of controls) {
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    }

    const overflow = await this.page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
}
