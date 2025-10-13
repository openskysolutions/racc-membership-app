
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from 'lucide-react';
import { getCurrentYearEvents, CalendarEvent } from '@/services/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EventFormDialog from '@/components/EventFormDialog';
import { useAuthStore } from '@/stores/authStore';
import cn from 'classnames';

// GoHighLevel Calendar ID - RACC Events
const GHL_CALENDAR_ID = '9XpDcFHv3SmCUuHeuOOg';
const GHL_LOCATION_ID = '5FAB1z0AhuVlEdqOzjVX';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Check for URL parameters to trigger create event dialog
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateEventDialogOpen(true);
      // Clean up URL parameter
      navigate('/calendar', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const ghlEventsData = await getCurrentYearEvents(GHL_CALENDAR_ID);
        setEvents(ghlEventsData);
      } catch (error) {
        console.error('Error loading events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate]); // Re-fetch when month changes

  // Event handlers
  const handleCreateEvent = (date?: Date) => {
    setSelectedDate(date || null);
    setCreateEventDialogOpen(true);
  };

  // const handleEditEvent = (event: CalendarEvent) => {
  //   setSelectedEvent(event);
  //   setCreateEventDialogOpen(true);
  // };

  const handleEventCreated = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
    // Optionally refresh events from server
    // fetchEvents();
  };

  const handleEventUpdated = (updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    setSelectedEvent(null);
  };

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
      const eventDate = new Date(event.startTime);
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
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    // Check if we're on mobile (screen width < 640px)
    const isMobile = window.innerWidth < 640;
    
    if (isMobile) {
      // On mobile, show day events dialog for everyone
      const dayEvents = getEventsForDay(date);
      setSelectedDayEvents(dayEvents);
      setSelectedDate(date);
      setDayEventsDialogOpen(true);
    } else if (isAuthenticated) {
      // On desktop, show create event dialog only for authenticated users
      setSelectedDate(date);
      setCreateEventDialogOpen(true);
    }
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
      <div className="container flex flex-grow py-8 px-3 md:px-6 w-full h-full">
        <div className="flex w-full items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event Calendar</h1>
            <p className="text-muted-foreground">
              View and manage upcoming RACC events and activities.
            </p>
          </div>
          {isAuthenticated && (
            <div className='flex flex-row justify-end'>
              <Button size='sm' onClick={() => handleCreateEvent()} className="w-fit">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Controls */}
      <Card className="mb-6 -mx-5 sm:mx-0">
        <CardHeader className="pb-4 px-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Button variant="outline" size="xs" className='h-7 px-1.5' onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <h2 className="text-lg sm:text-xl font-semibold flex-grow text-center">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <Button variant="outline" size="xs" className='h-7 px-1.5' onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next month</span>
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="self-center sm:self-auto px-1.5 h-7">
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-1 pb-1">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 bg-muted/30 rounded-lg overflow-hidden p-0.5 sm:p-1">
            {/* Day Headers */}
            {daysOfWeek.map((day) => (
              <div key={day} className="bg-background p-1.5 sm:p-3 text-center font-medium text-xs sm:text-sm text-muted-foreground rounded">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDay(day.fullDate);
              
              return (
                <div
                  key={index}
                  onClick={() => day.isCurrentMonth && handleDayClick(day.fullDate)}
                  className={`bg-background min-h-[60px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 rounded transition-colors duration-200 relative group flex flex-col ${
                    !day.isCurrentMonth 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-muted/30'
                  } ${day.isToday 
                      ? 'bg-primary/5 border-2 border-primary/30' 
                      : 'border border-muted/50'
                  }`}
                >
                  {/* Day Number */}
                  <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 transition-all duration-200 flex-shrink-0 ${
                    day.isToday 
                      ? 'bg-primary text-primary-foreground rounded-full w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center text-xs' 
                      : 'group-hover:text-primary group-hover:font-semibold'
                  }`}>
                    {day.date}
                  </div>
                  
                  {/* Event indicator for mobile - fill remaining space */}
                  {dayEvents.length > 0 && (
                    <div className="sm:hidden flex-1 flex items-center justify-center">
                      <div className="w-full h-full text-xs bg-primary/10 border border-primary/20 text-primary rounded flex flex-col items-center justify-center gap-1">
                        <div className="font-semibold text-sm">{dayEvents.length}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Events for desktop/tablet */}
                  <div className="hidden sm:block space-y-0.5 sm:space-y-1 flex-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className="text-xs p-1 sm:p-1.5 bg-highlight-foreground text-primary-foreground hover:bg-highlight rounded cursor-pointer transition-colors duration-200 truncate shadow-sm"
                        title={event.title}
                      >
                        <span className="sm:hidden">{event.title.slice(0, 10)}...</span>
                        <span className="hidden sm:inline">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors duration-200">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                  
                  {/* Add Event Hint (only show on hover for current month days) */}
                  {day.isCurrentMonth && dayEvents.length === 0 && isAuthenticated && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-primary/5 group-hover:border-2 group-hover:border-primary/30 transition-all duration-200 rounded">
                      <div className="flex flex-col items-center gap-1 text-primary">
                        <Plus className="h-5 w-5" />
                        <span className="text-xs font-medium hidden sm:inline">Add Event</span>
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
        <DialogPortal>
          <DialogOverlay className={cn(
            "fixed inset-0 z-50",
            "bg-muted-foreground/80 dark:bg-neutral-800/80 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
          )}/>
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
                  <span>{formatEventDate(selectedEvent.startTime)}</span>
                  <span>•</span>
                  <span>{formatEventTime(selectedEvent.startTime)}</span>
                  {selectedEvent.endTime && (
                    <>
                      <span>-</span>
                      <span>{formatEventTime(selectedEvent.endTime)}</span>
                    </>
                  )}
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.attendees.length} attendees</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Badge variant={selectedEvent.status === 'confirmed' ? 'default' : 'secondary'}>
                    {selectedEvent.status}
                  </Badge>
                  {selectedEvent.isAllDay && (
                    <Badge variant="outline">All Day</Badge>
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
        </DialogPortal>
      </Dialog>

      {/* Day Events Dialog (Mobile) */}
      <Dialog open={dayEventsDialogOpen} onOpenChange={setDayEventsDialogOpen}>
        <DialogPortal>
          <DialogOverlay className={cn(
            "fixed inset-0 z-50",
            "bg-muted-foreground/10 dark:bg-neutral-800/10 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
          )}/>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {selectedDate && selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </DialogTitle>
              <DialogDescription>
                {selectedDayEvents.length === 0 
                  ? 'No events scheduled for this day'
                  : `${selectedDayEvents.length} event${selectedDayEvents.length > 1 ? 's' : ''} scheduled`
                }
              </DialogDescription>
            </DialogHeader>
          
            <div className="space-y-4">
              {/* Events List */}
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        setDayEventsDialogOpen(false);
                        handleEventClick(event);
                      }}
                      className="p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border"
                    >
                      <div className="font-medium text-sm mb-1">{event.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatEventTime(event.startTime)}</span>
                        {event.endTime && (
                          <>
                            <span>-</span>
                            <span>{formatEventTime(event.endTime)}</span>
                          </>
                        )}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No events scheduled for this day2</p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {isAuthenticated && (
                  <Button 
                    onClick={() => {
                      setDayEventsDialogOpen(false);
                      setCreateEventDialogOpen(true);
                    }}
                    className="flex-1"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setDayEventsDialogOpen(false)}
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* Event Form Dialog */}
      <EventFormDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        calendarId={GHL_CALENDAR_ID}
        locationId={GHL_LOCATION_ID}
        event={selectedEvent}
        selectedDate={selectedDate}
        onEventCreated={handleEventCreated}
        onEventUpdated={handleEventUpdated}
      />
    </div>
  );
};

export default CalendarPage;