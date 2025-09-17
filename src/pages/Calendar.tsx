import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Clock } from 'lucide-react';
import { getEventsList, Event } from '@/services/events';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await getEventsList({ status: 'published' });
        setEvents(eventsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'members':
        return 'bg-blue-100 text-blue-800';
      case 'restricted':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <section className="container py-20">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <CalendarIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading events...</p>
          </div>
        </div>
      </section>
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
    <section className="container py-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Events Calendar</h1>
        <p className="text-muted-foreground">
          Discover upcoming events and activities from the Richfield Area Chamber of Commerce
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
          <p className="text-muted-foreground">Check back later for new events and activities.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                    <CardDescription className="text-base">
                      {event.description}
                    </CardDescription>
                  </div>
                  <Badge className={getVisibilityColor(event.visibility)}>
                    {event.visibility}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatEventDate(event.startsAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatEventTime(event.startsAt)} - {formatEventTime(event.endsAt)}
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {event.isVirtual ? 'Virtual' : event.location}
                      </span>
                    </div>
                  )}
                  
                  {event.maxAttendees && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Max {event.maxAttendees} attendees
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button variant="default" size="sm">
                    RSVP
                  </Button>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default CalendarPage;