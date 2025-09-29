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

describe('Calendar Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { apiFetch } = await import('@/services/apiClient');
    const { getEventsList } = await import('@/services/events');
    
    // Mock some sample events
    const mockEvents = [
      {
        id: '1',
        title: 'Test Event',
        description: 'Test Description',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        status: 'confirmed' as const,
        calendarId: '9XpDcFHv3SmCUuHeuOOg',
        isAllDay: false,
        timezone: 'America/Denver',
        // Optional local properties for backwards compatibility
        visibility: 'public' as const,
        isVirtual: false,
        maxAttendees: 50,
        ownerId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    vi.mocked(getEventsList).mockResolvedValue(mockEvents);
    
    vi.mocked(apiFetch).mockImplementation((url: string) => {
      if (url.includes('/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            events: mockEvents,
            total: 1
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
      expect(screen.getByText(/Event Calendar/i)).toBeInTheDocument();
    });
  });

  it('should display calendar navigation', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Create Event')).toBeInTheDocument();
    });
  });

  it('should display days of the week', async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <Calendar />
        </TestWrapper>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });
  });
});
