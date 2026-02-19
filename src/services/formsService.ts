/**
 * Forms Service - Frontend
 * Simple utility for handling form page URLs
 * No API calls needed - embed codes are passed directly via URL
 */

class FormsService {
  /**
   * Generate a form page URL with embedded code
   */
  getFormPageUrl(formId: string, formName: string, embedCode: string): string {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      embed: embedCode,
      name: formName,
    });
    return `${baseUrl}/forms/${formId}?${params.toString()}`;
  }
}

export const formsService = new FormsService();
