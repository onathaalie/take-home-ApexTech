import { test as base } from '@playwright/test';
import { InquiryPage } from '../pages/InquiryPage';

export const validInquiryData = {
  firstName: 'QA Candidate',
  lastName: 'Nataliia',
  email: 'qa.candidate+test@gmail.com',
  postalCode: '80302',
  phone: '3035550100',
  postedPhone: '+1 303 555 0100',
} as const;

export type CapturedSubmit = {
  url: string;
  method: string;
  postData: string;
  form: string;
  values: Record<string, string>;
};

function parseSubmitPayload(postData: string): { form: string; values: Record<string, string> } {
  const body = JSON.parse(postData) as { values?: string; form?: string };
  return {
    form: body.form ?? '',
    values: Object.fromEntries(new URLSearchParams(body.values ?? '')),
  };
}

export const test = base.extend<{
  interceptedSubmissions: CapturedSubmit[];
  inquiryPage: InquiryPage;
  submitResponseDelayMs: number;
}>({
  submitResponseDelayMs: [0, { option: true }],

  interceptedSubmissions: async ({ page, submitResponseDelayMs }, use) => {
    const captured: CapturedSubmit[] = [];

    await page.route(/\/submit-form\/?(\?.*)?$/, async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postData() ?? '';
        const parsed = parseSubmitPayload(postData);
        captured.push({
          url: request.url(),
          method: request.method(),
          postData,
          form: parsed.form,
          values: parsed.values,
        });
      }

      if (submitResponseDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, submitResponseDelayMs));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { id: 'qa-stubbed-lead' } }),
      });
    });

    await page.route(/\/validate-email\/?(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true }),
      });
    });

    await use(captured);
  },

  inquiryPage: async ({ page, interceptedSubmissions }, use) => {
    void interceptedSubmissions;
    const inquiryPage = new InquiryPage(page);
    await inquiryPage.goto();
    await use(inquiryPage);
  },
});

export { expect } from '@playwright/test';
