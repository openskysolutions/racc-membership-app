import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Nominations from '@/pages/Nominations';
import '@testing-library/jest-dom';

// Mock the API client
vi.mock('@/services/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  },
  apiFetch: vi.fn()
}));

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: 'member' },
    isAuthenticated: true
  }))
}));

vi.mock('@/services/nominations', () => ({
  getNominations: vi.fn(),
  getMyNominations: vi.fn(),
  hasNominationModerationAccess: vi.fn(),
  submitNomination: vi.fn(),
  formatNominationCategory: vi.fn()
}));

vi.mock('@/services/members', () => ({
  getMembersList: vi.fn()
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Nominations Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocks after modules are loaded
    const { apiFetch } = await import('@/services/apiClient');
    const { getNominations, getMyNominations, hasNominationModerationAccess } = await import('@/services/nominations');
    const { getMembersList } = await import('@/services/members');
    
    // Mock service functions directly
    vi.mocked(getMyNominations).mockResolvedValue([]);
    vi.mocked(getNominations).mockResolvedValue([]);
    vi.mocked(hasNominationModerationAccess).mockResolvedValue(false);
    vi.mocked(getMembersList).mockResolvedValue([]);
    
    // Mock API responses for nominations page
    vi.mocked(apiFetch).mockImplementation((url: string) => {
      if (url.includes('/nominations/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            totalPending: 5,
            totalApproved: 10,
            totalRejected: 2
          })
        } as any);
      }
      if (url.includes('/nominations/my')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            nominations: []
          })
        } as any);
      }
      if (url.includes('/nominations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            nominations: []
          })
        } as any);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      } as any);
    });
  });

  it('should render without crashing', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Nominations />
        </TestWrapper>
      );
    });
    expect(true).toBe(true);
  });
});
