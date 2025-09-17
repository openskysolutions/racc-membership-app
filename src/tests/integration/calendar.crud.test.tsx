import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Calendar from '@/pages/Calendar';

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

// Mock auth store for permission checks
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { role: 'admin', permissions: ['events:create', 'events:edit', 'events:delete'] },
    isAuthenticated: true
  }))
}));

describe('Calendar CRUD Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render calendar with events', async () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Board Meeting',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T11:00:00Z',
        description: 'Monthly board meeting'
      },
      {
        id: '2',
        title: 'Networking Event',
        startDate: '2024-01-20T18:00:00Z',
        endDate: '2024-01-20T20:00:00Z',
        description: 'Chamber networking'
      }
    ];
    
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ events: mockEvents })
    } as unknown as Response;
    
    const { api } = await import('@/services/apiClient');
    vi.mocked(api.get).mockResolvedValue(mockResponse);

    render(
      <BrowserRouter>
        <Calendar />
      </BrowserRouter>
    );

    // Test should fail until calendar implementation exists
    await waitFor(() => {
      expect(screen.getByText('Board Meeting')).toBeInTheDocument();
      expect(screen.getByText('Networking Event')).toBeInTheDocument();
    });

    expect(api.get).toHaveBeenCalledWith('/events');
  });

  it('should create new event with proper permissions', async () => {
    const mockEmptyResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ events: [] })
    } as unknown as Response;
    
    const mockCreateResponse = {
      ok: true,
      status: 201,
      statusText: 'Created',
      json: vi.fn().mockResolvedValue({ id: '3', title: 'New Event' })
    } as unknown as Response;
    
    const { api } = await import('@/services/apiClient');
    vi.mocked(api.get).mockResolvedValue(mockEmptyResponse);
    vi.mocked(api.post).mockResolvedValue(mockCreateResponse);

    render(
      <BrowserRouter>
        <Calendar />
      </BrowserRouter>
    );

    // Test should fail until create functionality exists
    const createButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(createButton);

    // Should show create form
    expect(screen.getByText(/create new event/i)).toBeInTheDocument();
    
    const titleInput = screen.getByLabelText(/event title/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const submitButton = screen.getByRole('button', { name: /save event/i });

    fireEvent.change(titleInput, { target: { value: 'New Event' } });
    fireEvent.change(startDateInput, { target: { value: '2024-02-01T10:00' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/events', {
        title: 'New Event',
        startDate: '2024-02-01T10:00'
      });
    });
  });

  it('should update existing event', async () => {
    const mockEvent = {
      id: '1',
      title: 'Board Meeting',
      startDate: '2024-01-15T10:00:00Z',
      description: 'Monthly board meeting'
    };
    
    const mockEventsResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ events: [mockEvent] })
    } as unknown as Response;
    
    const mockUpdateResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue(mockEvent)
    } as unknown as Response;
    
    const { api } = await import('@/services/apiClient');
    vi.mocked(api.get).mockResolvedValue(mockEventsResponse);
    vi.mocked(api.patch).mockResolvedValue(mockUpdateResponse);

    render(
      <BrowserRouter>
        <Calendar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Board Meeting')).toBeInTheDocument();
    });

    // Click edit button on event
    const editButton = screen.getByTestId('edit-event-1');
    fireEvent.click(editButton);

    const titleInput = screen.getByDisplayValue('Board Meeting');
    fireEvent.change(titleInput, { target: { value: 'Updated Board Meeting' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/events/1', {
        title: 'Updated Board Meeting'
      });
    });
  });

  it('should delete event with confirmation', async () => {
    const mockEvent = {
      id: '1',
      title: 'Board Meeting',
      startDate: '2024-01-15T10:00:00Z'
    };
    
    const mockEventsResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ events: [mockEvent] })
    } as unknown as Response;
    
    const mockDeleteResponse = {
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: vi.fn().mockResolvedValue({})
    } as unknown as Response;
    
    const { api } = await import('@/services/apiClient');
    vi.mocked(api.get).mockResolvedValue(mockEventsResponse);
    vi.mocked(api.delete).mockResolvedValue(mockDeleteResponse);

    render(
      <BrowserRouter>
        <Calendar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Board Meeting')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-event-1');
    fireEvent.click(deleteButton);

    // Should show confirmation dialog
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/events/1');
    });
  });

  it('should handle RSVP submission', async () => {
    const mockEvent = {
      id: '1',
      title: 'Networking Event',
      startDate: '2024-01-20T18:00:00Z',
      allowRsvp: true
    };
    
    const mockEventsResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ events: [mockEvent] })
    } as unknown as Response;
    
    const mockRsvpResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: vi.fn().mockResolvedValue({ rsvpStatus: 'attending' })
    } as unknown as Response;
    
    const { api } = await import('@/services/apiClient');
    vi.mocked(api.get).mockResolvedValue(mockEventsResponse);
    vi.mocked(api.post).mockResolvedValue(mockRsvpResponse);

    render(
      <BrowserRouter>
        <Calendar />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Networking Event')).toBeInTheDocument();
    });

    const rsvpButton = screen.getByTestId('rsvp-event-1');
    fireEvent.click(rsvpButton);

    const attendingOption = screen.getByLabelText(/attending/i);
    fireEvent.click(attendingOption);
    
    const submitRsvp = screen.getByRole('button', { name: /submit rsvp/i });
    fireEvent.click(submitRsvp);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/events/1/rsvp', {
        status: 'attending'
      });
    });
  });
});
