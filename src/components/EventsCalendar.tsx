import { useState, useEffect, FC } from 'react';
import { Calendar, Clock, MapPin, Users, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'meeting' | 'networking' | 'workshop' | 'social';
  attendees: number;
  maxAttendees?: number;
  organizer: string;
  isRegistered: boolean;
}

const EventsCalendar: FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo events data - in production this would come from API
    const demoEvents: Event[] = [
      {
        id: 'event_001',
        title: 'Monthly RACC Meeting',
        description: 'Our regular monthly meeting discussing community initiatives and upcoming projects.',
        date: '2025-09-25',
        time: '18:00',
        location: 'Richfield Community Center',
        type: 'meeting',
        attendees: 45,
        maxAttendees: 100,
        organizer: 'RACC Board',
        isRegistered: true
      },
      {
        id: 'event_002',
        title: 'Business Networking Breakfast',
        description: 'Connect with fellow RACC members over breakfast and discuss business opportunities.',
        date: '2025-09-28',
        time: '08:00',
        location: 'Main Street Café',
        type: 'networking',
        attendees: 23,
        maxAttendees: 40,
        organizer: 'Jennifer Smith',
        isRegistered: false
      },
      {
        id: 'event_003',
        title: 'Digital Marketing Workshop',
        description: 'Learn effective digital marketing strategies for local businesses.',
        date: '2025-10-05',
        time: '14:00',
        location: 'Richfield Library Conference Room',
        type: 'workshop',
        attendees: 18,
        maxAttendees: 25,
        organizer: 'Lisa Anderson',
        isRegistered: true
      },
      {
        id: 'event_004',
        title: 'Fall Community BBQ',
        description: 'Join us for a fun community BBQ with families and local businesses.',
        date: '2025-10-12',
        time: '17:00',
        location: 'Richfield City Park',
        type: 'social',
        attendees: 67,
        maxAttendees: 150,
        organizer: 'RACC Events Committee',
        isRegistered: false
      }
    ];

    setEvents(demoEvents);
    setLoading(false);
  }, [isAuthenticated, navigate]);

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'networking': return 'bg-green-100 text-green-800 border-green-200';
      case 'workshop': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'social': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const handleRegister = (eventId: string) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, isRegistered: !event.isRegistered, attendees: event.isRegistered ? event.attendees - 1 : event.attendees + 1 }
          : event
      )
    );
  };

  if (loading) {
    return (
      <div className="container flex flex-grow py-8 px-3 md:px-6 w-full h-full">
        <div className="flex w-full items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-20 px-3 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Events Calendar</h1>
            <p className="text-muted-foreground">
              Upcoming RACC events and community activities
            </p>
          </div>
          {user?.role === 'admin' && (
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-6">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                    {event.isRegistered && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Registered
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={event.isRegistered ? "outline" : "default"}
                    onClick={() => handleRegister(event.id)}
                    disabled={!event.isRegistered && event.maxAttendees ? event.attendees >= event.maxAttendees : false}
                  >
                    {event.isRegistered ? 'Unregister' : 'Register'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(event.date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(event.time)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {event.attendees} attendees
                    {event.maxAttendees && ` / ${event.maxAttendees} max`}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Organized by {event.organizer}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
              <p className="text-muted-foreground">
                Check back soon for new RACC events and activities.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EventsCalendar;
