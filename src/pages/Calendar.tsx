
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from 'lucide-react';
import { getEventsList, Event } from '@/services/events';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await getEventsList({ status: 'published' });
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Calendar computation
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of the month and how many days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Get previous month's last days to fill the grid
  const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];

    // Previous month's trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: lastDayOfPrevMonth - i,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(currentYear, currentMonth - 1, lastDayOfPrevMonth - i)
      });
    }

    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: dayDate.toDateString() === today.toDateString(),
        fullDate: dayDate
      });
    }

    // Next month's leading days to complete the grid (6 rows × 7 days = 42 days)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(currentYear, currentMonth + 1, day)
      });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek, lastDayOfPrevMonth]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startsAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Event handlers
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setCreateEventDialogOpen(true);
  };

  const handleCreateEvent = () => {
    navigate('/news-events');
  };

  const formatEventTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event Calendar</h1>
            <p className="text-muted-foreground">
              View and manage upcoming RACC events and activities.
            </p>
          </div>
          <Button onClick={handleCreateEvent} className="w-fit">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 bg-muted/30 rounded-lg overflow-hidden p-1">
            {/* Day Headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="bg-background p-3 text-center font-medium text-sm text-muted-foreground rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day.fullDate);
              
              return (
                <div
                  key={index}
                  onClick={() => day.isCurrentMonth && handleDayClick(day.fullDate)}
                  className={`bg-background min-h-[120px] p-2 rounded transition-colors duration-200 relative group ${
                    !day.isCurrentMonth 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-muted/30'
                  } ${day.isToday 
                      ? 'bg-primary/5 border-2 border-primary/30' 
                      : 'border border-muted/50'
                  }`}
                >
                  {/* Day Number */}
                  <div className={`text-sm font-medium mb-2 transition-all duration-200 ${
                    day.isToday 
                      ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs' 
                      : 'group-hover:text-primary group-hover:font-semibold'
                  }`}>
                    {day.date}
                  </div>
                  
                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className="text-xs p-1.5 bg-highlight-foreground text-primary-foreground hover:bg-highlight rounded cursor-pointer transition-colors duration-200 truncate shadow-sm"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors duration-200">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                  
                  {/* Add Event Hint (only show on hover for current month days) */}
                  {day.isCurrentMonth && dayEvents.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary/5 group-hover:border-2 group-hover:border-primary/30 transition-all duration-200 rounded">
                      <div className="flex flex-col items-center gap-1 text-primary">
                        <Plus className="h-5 w-5" />
                        <span className="text-xs font-medium">Add Event</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Event Details
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              {/* Event Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatEventDate(selectedEvent.startsAt)}</span>
                  <span>•</span>
                  <span>{formatEventTime(selectedEvent.startsAt)}</span>
                  {selectedEvent.endsAt && (
                    <>
                      <span>-</span>
                      <span>{formatEventTime(selectedEvent.endsAt)}</span>
                    </>
                  )}
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.maxAttendees && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Max {selectedEvent.maxAttendees} attendees</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Badge variant={selectedEvent.visibility === 'public' ? 'default' : 'secondary'}>
                    {selectedEvent.visibility}
                  </Badge>
                  {selectedEvent.isVirtual && (
                    <Badge variant="outline">Virtual</Badge>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setDialogOpen(false);
                    navigate('/news-events');
                  }}
                  className="flex-1"
                >
                  View Full Details & RSVP
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Create a new event for {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="event-title" className="text-sm font-medium">
                Event Title
              </label>
              <input
                id="event-title"
                type="text"
                placeholder="Enter event title..."
                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <label htmlFor="event-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="event-description"
                placeholder="Enter event description..."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            
            <div>
              <label htmlFor="event-location" className="text-sm font-medium">
                Location
              </label>
              <input
                id="event-location"
                type="text"
                placeholder="Enter event location..."
                className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setCreateEventDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              // Navigate to news-events page with the selected date
              const dateParam = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
              navigate(`/news-events?date=${dateParam}&tab=create`);
              setCreateEventDialogOpen(false);
            }}>
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;