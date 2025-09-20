import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Calendar from '@/pages/Calendar';
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
    user: { role: 'member', id: 'test-user' },
    isAuthenticated: true
  }))
}));

// Mock events service
vi.mock('@/services/events', () => ({
  getEventsList: vi.fn(),
  getEventById: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
  createOrUpdateRSVP: vi.fn(),
  getMyRSVP: vi.fn()
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Calendar CRUD Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { apiFetch } = await import('@/services/apiClient');
    const { getEventsList } = await import('@/services/events');
    
    vi.mocked(getEventsList).mockResolvedValue([]);
    
    vi.mocked(apiFetch).mockImplementation((url: string) => {
      if (url.includes('/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            events: [],
            total: 0
          })
        } as any);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      } as any);
    });
  });

  it('should render calendar without crashing', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText(/calendar/i)).toBeInTheDocument();
    });
  });
});
