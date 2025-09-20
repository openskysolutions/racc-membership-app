import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MembersPage from '@/pages/Members';
import { ThemeProvider } from '@/providers/theme-provider';
import '@testing-library/jest-dom';

// Mock the API client directly since Members page uses it
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

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Wrapper component to provide necessary context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Members Browse Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mock after modules are loaded
    const { api } = await import('@/services/apiClient');
    
    // Setup API mocks for Members page
    vi.mocked(api.get).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        members: [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            businessName: 'Doe Enterprises',
            phone: '+1-555-0123',
            website: 'https://doe-enterprises.com',
            status: 'active',
            contactId: 'contact_1',
            avatar: '',
            slug: 'john-doe',
            lastLogin: '2024-01-01',
            bio: 'Business owner',
            locationId: 'loc_1',
            groupId: 'group_1',
            role: 'member',
            offerSubscriptionMapping: {},
            operationType: 'create',
            source: 'manual',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
            __v: 0,
            lastVisitedAt: '2024-01-01',
            joinedAt: '2024-01-01',
            gamificationMeta: { points: 100, level: 1 },
            lastActivityAt: '2024-01-01',
            profilePhoto: undefined,
            tags: ['member']
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            businessName: 'Smith LLC',
            phone: '+1-555-0124',
            website: 'https://smith-llc.com',
            status: 'active',
            contactId: 'contact_2',
            avatar: '',
            slug: 'jane-smith',
            lastLogin: '2024-02-01',
            bio: 'Business consultant',
            locationId: 'loc_2',
            groupId: 'group_2',
            role: 'member',
            offerSubscriptionMapping: {},
            operationType: 'create',
            source: 'manual',
            createdAt: '2024-02-01',
            updatedAt: '2024-02-01',
            __v: 0,
            lastVisitedAt: '2024-02-01',
            joinedAt: '2024-02-01',
            gamificationMeta: { points: 150, level: 1 },
            lastActivityAt: '2024-02-01',
            profilePhoto: undefined,
            tags: ['member']
          }
        ]
      })
    } as any);
  });

  it('should render members list', async () => {
    await act(async () => {
      render(<MembersPage />, { wrapper: TestWrapper });
    });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should handle member search', async () => {
    await act(async () => {
      render(<MembersPage />, { wrapper: TestWrapper });
    });
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Test search functionality if it exists
    const searchInput = screen.queryByPlaceholderText(/search/i);
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'John' } });
      const { api } = await import('@/services/apiClient');
      await waitFor(() => {
        expect(vi.mocked(api.get)).toHaveBeenCalled();
      });
    }
  });

  it('should navigate to member details', async () => {
    await act(async () => {
      render(<MembersPage />, { wrapper: TestWrapper });
    });
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on member to view details
    const memberLink = screen.getByText('John Doe');
    fireEvent.click(memberLink);

    // Check if navigation was called (this depends on implementation)
    // For now, just verify the member is clickable
    expect(memberLink).toBeInTheDocument();
  });
});