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
    // Return relative path to work across all environments
    const params = new URLSearchParams({
      embed: embedCode,
      name: formName,
    });
    return `/forms/${formId}?${params.toString()}`;
  }
}

export const formsService = new FormsService();
