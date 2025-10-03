import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Clock, Plus, } from 'lucide-react';
import { getEventsList, Event } from '@/services/events';
import { getUpcomingEvents, CalendarEvent } from '@/services/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useNavigate } from 'react-router-dom';

// GoHighLevel Calendar ID - RACC Events
const GHL_CALENDAR_ID = '9XpDcFHv3SmCUuHeuOOg';

const NewsEventsPages: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [ghlEvents, setGhlEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Fetch both local events and GoHighLevel events in parallel
        const [eventsData, ghlEventsData] = await Promise.allSettled([
          getEventsList({ status: 'published' }),
          getUpcomingEvents(GHL_CALENDAR_ID)
        ]);
        
        // Handle local events
        if (eventsData.status === 'fulfilled') {
          setEvents(eventsData.value);
        } else {
          console.error('Failed to fetch local events:', eventsData.reason);
        }
        
        // Handle GoHighLevel events
        if (ghlEventsData.status === 'fulfilled') {
          setGhlEvents(ghlEventsData.value);
        } else {
          console.error('Failed to fetch GoHighLevel events:', ghlEventsData.reason);
          // Don't fail the whole page if GHL events fail
          setGhlEvents([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const addEventToCalendar = () => {
    navigate('/calendar');
  };

  // const handleRSVPClick = async (event: Event) => {
  //   setSelectedEvent(event);
  //   setRsvpLoading(true);
    
  //   try {
  //     // Load current RSVP status
  //     const rsvp = await getMyRSVP(event.id);
  //     setCurrentRSVP(rsvp);
      
  //     if (rsvp) {
  //       setRsvpFormData({
  //         status: rsvp.status,
  //         notes: rsvp.notes || '',
  //         guestCount: 0
  //       });
  //     } else {
  //       setRsvpFormData({
  //         status: 'attending',
  //         notes: '',
  //         guestCount: 0
  //       });
  //     }
  //   } catch (err) {
  //     console.error('Error loading RSVP:', err);
  //     // Continue anyway - user can still submit new RSVP
  //     setCurrentRSVP(null);
  //     setRsvpFormData({
  //       status: 'attending',
  //       notes: '',
  //       guestCount: 0
  //     });
  //   } finally {
  //     setRsvpLoading(false);
  //   }
    
  //   setRsvpDialogOpen(true);
  // };

  // const handleRSVPSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!selectedEvent) return;
    
  //   try {
  //     setRsvpLoading(true);
      
  //     const rsvp = await createOrUpdateRSVP(selectedEvent.id, rsvpFormData);
  //     setCurrentRSVP(rsvp);
      
  //     // Close dialog and show success
  //     setRsvpDialogOpen(false);
  //     alert('RSVP submitted successfully!');
      
  //   } catch (err) {
  //     console.error('Error submitting RSVP:', err);
  //     alert('Failed to submit RSVP. Please try again.');
  //   } finally {
  //     setRsvpLoading(false);
  //   }
  // };

  // const handleApproveEvent = async (eventId: string, reason?: string) => {
  //   try {
  //     setModerationLoading(true);
  //     await approveEvent(eventId, reason);
      
  //     // Refresh moderation queue and published events
  //     const { events: pending } = await getModerationQueue();
  //     setPendingEvents(pending);
      
  //     const eventsData = await getEventsList({ status: 'published' });
  //     setEvents(eventsData);
      
  //     alert('Event approved successfully!');
  //   } catch (err) {
  //     console.error('Error approving event:', err);
  //     alert('Failed to approve event. Please try again.');
  //   } finally {
  //     setModerationLoading(false);
  //   }
  // };

  // const handleRejectEvent = async (eventId: string, reason?: string) => {
  //   try {
  //     setModerationLoading(true);
  //     await rejectEvent(eventId, reason);
      
  //     // Refresh moderation queue
  //     const { events: pending } = await getModerationQueue();
  //     setPendingEvents(pending);
      
  //     alert('Event rejected successfully!');
  //   } catch (err) {
  //     console.error('Error rejecting event:', err);
  //     alert('Failed to reject event. Please try again.');
  //   } finally {
  //     setModerationLoading(false);
  //   }
  // };

  if (loading) {
    return (
      <div className="container flex flex-grow py-8 px-3 md:px-6 w-full h-full">
        <div className="flex w-full items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <section className="container py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Calendar</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">Error loading events: {error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-8">
      <div className="mb-8">
        <h1 className="flex flex-row justify-between text-3xl font-bold mb-2">
          <span className='nowrap'>News and Events</span>
        </h1>
        <div className="flex flex-row justify-end sm:-mt-11">
          <Button onClick={addEventToCalendar} variant={'ghost'}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Calendar Event
          </Button>
        </div>
      </div>

      <div className="w-full">
        <div className="space-y-6">
          {/* GoHighLevel Events Section */}
          {ghlEvents.length > 0 && (
            <div className="space-y-6">
              <div className="grid gap-6">
                {ghlEvents.map((event) => (
                  <Card key={`ghl-${event.id}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                          {event.description && (
                            <CardDescription className="text-base">
                              {event.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Calendar Event
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(event.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(event.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                            {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}`}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{event.location}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Local Events Section */}
          {events.length === 0 && ghlEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground mb-4">Check back later for new events and activities.</p>
                  <Button onClick={addEventToCalendar}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) 
          : <div className="flex flex-row justify-end">
              <Button onClick={addEventToCalendar} variant={'ghost'}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Calendar Event
              </Button>
            </div>
          }
        </div>
      </div>
    </section>
  );
};

export default NewsEventsPages;