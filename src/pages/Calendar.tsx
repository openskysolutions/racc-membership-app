
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, Plus, Edit, X, Clock, MapPin } from 'lucide-react';
import { getCurrentYearEvents, CalendarEvent, getEventCustomFields } from '@/services/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EventFormDialog from '@/components/EventFormDialog';
import { useAuthStore } from '@/stores/authStore';
import { formatEventDate, formatEventTime, formatLocation } from '@/lib/eventUtils';
import { EventCountdown } from '@/components/EventCountdown';

import { isSmallScreen, isNativeApp } from '@/lib/platform';
import { openExternalUrl } from '@/lib/externalBrowser';
import EventBg from '@/assets/explosive-event-cover.jpg'

// GoHighLevel Calendar ID - RACC Events
const GHL_CALENDAR_ID = '9XpDcFHv3SmCUuHeuOOg';
const GHL_LOCATION_ID = '5FAB1z0AhuVlEdqOzjVX';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventPageUrl, setEventPageUrl] = useState<string>('');
  const [eventCoverImageUrl, setEventCoverImageUrl] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [showCalendar, setShowCalendar] = useState(false); // Default to hidden on mobile
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger to force refresh
  const [visibleEventsCount, setVisibleEventsCount] = useState(5); // How many events to show in the list

  // Check for URL parameters to trigger create event dialog
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateEventDialogOpen(true);
      // Clean up URL parameter
      navigate('/calendar', { replace: true });
    }
  }, [searchParams, navigate]);

  // Fetch events function - extracted so it can be reused
  const fetchEvents = useCallback(async () => {
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
  }, []);

  // Fetch events on mount and when currentDate or refreshTrigger changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, currentDate, refreshTrigger]); // Re-fetch when month changes or refresh triggered

  // Refetch events when user returns to this page (e.g., from EventDetail)
  // This ensures the calendar shows updated data after events are edited elsewhere
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEvents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchEvents]);

  // Fetch custom fields only for upcoming events (lazy loading)
  // Custom fields are now batch-loaded on the backend and included in the events
  // No need for separate lazy loading anymore

  // Load more events on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check if user scrolled near bottom of page
      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= pageHeight - 500) { // 500px before bottom
        const now = new Date();
        const upcomingEventsCount = events.filter(event => new Date(event.startTime) >= now).length;
        
        // Load 5 more if we haven't loaded all yet
        if (visibleEventsCount < upcomingEventsCount) {
          setVisibleEventsCount(prev => Math.min(prev + 5, upcomingEventsCount));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [events, visibleEventsCount]);

  // Event handlers
  const handleCreateEvent = (date?: Date) => {
    setSelectedDate(date || null);
    setCreateEventDialogOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setCreateEventDialogOpen(true);
  };

  const handleEventCreated = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
    // Optionally refresh events from server
    // fetchEvents();
  };

  const handleEventUpdated = async (updatedEvent: CalendarEvent) => {
    // Refresh all events to show any recurring series updates
    // Use cache busting to work around GoHighLevel's API caching
    try {
      const ghlEventsData = await getCurrentYearEvents(GHL_CALENDAR_ID, true); // bustCache = true
      setEvents(ghlEventsData);
      // Trigger a refresh of custom fields for visible events
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing events:', error);
      // Fallback to just updating the single event
      setEvents(prev => prev.map(event =>
        event.id === updatedEvent.id ? updatedEvent : event
      ));
    }
    setSelectedEvent(null);
  };

  const handleRegister = async () => {
    // Open the pageUrl in external browser if it exists
    if (eventPageUrl) {
      if (isNativeApp()) {
        // On mobile app, open in external browser
        const handled = await openExternalUrl(eventPageUrl);
        if (!handled) {
          // Fallback to opening in new tab
          window.open(eventPageUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        // On web, open in current tab
        window.location.href = eventPageUrl;
      }
    }
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
  const handleEventClick = async (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);

    // Fetch custom fields for this event (not batch-loaded to improve initial load performance)
    try {
      const customFields = await getEventCustomFields(event.id);
      setEventPageUrl(customFields?.pageUrl || '');
      setEventCoverImageUrl(customFields?.coverImageUrl || '');
    } catch (error) {
      console.error('Failed to fetch custom fields for event:', error);
      setEventPageUrl('');
      setEventCoverImageUrl('');
    }
  };

  const handleDayClick = (date: Date) => {
    // Check if we're on a small screen for responsive behavior
    if (isSmallScreen()) {
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

  // Get sorted upcoming events (must be before any early returns)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const allUpcoming = events
      .filter(event => new Date(event.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    // Only return the visible slice
    return allUpcoming.slice(0, visibleEventsCount);
  }, [events, visibleEventsCount]);

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
    <>
      {/* Two Column Layout - wraps on mobile */}
      <div className={`grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 max-w-8xl mx-auto p-4 h-full`}>
        {/* Left Column - Calendar */}
        <div className={`flex flex-col h-full col-span-2 lg:col-span-1`}>
          {/* Header */}
          <div className="flex justify-between items-start mb-3 flex-shrink-0">
            <h2 className="text-2xl font-bold">Event Calendar</h2>
            <div className='flex flex-row justify-between gap-2'>
              {/* Toggle Calendar Button - Mobile/Small screens only */}
              <Button 
                size='sm' 
                variant="outline"
                onClick={() => setShowCalendar(!showCalendar)} 
                className="lg:hidden w-fit h-7"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
              </Button>
              
              {isAuthenticated && showCalendar && (
                <Button size='sm' onClick={() => handleCreateEvent()} className="w-fit h-7">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              )}
            </div>
          </div>
          {/* Calendar Controls */}
          <Card className={`flex flex-col sm:mx-0 ${showCalendar ? 'flex' : 'hidden lg:flex'}`}>
            <CardHeader className="py-2 pt-4 px-2 flex-shrink min-w-0">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <Button variant="outline" size="xs" className='h-7 px-1.5' onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous month</span>
                </Button>
                <h2 className="text-lg sm:text-xl font-semibold flex-grow text-center min-w-0">
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
            <CardContent className="pt-0 px-1 pb-1 overflow-hidden">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-0.5 sm:gap-1 bg-muted/30 rounded-lg overflow-hidden p-0.5 sm:p-1 w-[min(calc(100vw-2rem),calc(100vh-17rem))] aspect-square">
                  {/* Day Headers */}
                  {daysOfWeek.map((day) => (
                  <div key={day} className="bg-background p-1 sm:p-1 text-center font-medium text-xs sm:text-sm text-muted-foreground rounded">
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
                      className={`bg-background h-full p-1 sm:p-1 rounded transition-colors duration-200 relative group flex flex-col ${!day.isCurrentMonth
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-muted/30'
                        } ${day.isToday
                          ? 'bg-primary/5 border-2 border-primary/30'
                          : 'border border-muted/50'
                        }`}
                    >
                      {/* Day Number */}
                      <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 transition-all duration-200 flex-shrink-0 ${day.isToday
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
                            className="text-xs p-0.5 py-0 bg-highlight-foreground text-primary-foreground hover:bg-highlight rounded cursor-pointer transition-colors duration-200 truncate shadow-sm"
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
        </div>

        {/* Right Column - Upcoming Events List */}
        <div className={`flex flex-col col-span-2 lg:col-span-1 h-full ${!showCalendar ? 'w-[min(calc(100vw-2rem),calc(100vh-16rem))] lg:w-auto' : ''} overflow-auto lg:overflow-hidden`}>
          {/* Mobile header for upcoming events */}
          <div className="flex justify-between mb-3 flex-shrink-0">
            <h2 className="text-2xl font-bold">Upcoming Events</h2>
            <Badge variant="secondary" className='bg-highlight-foreground justify-center text-card font-semibold h-7 w-7 mr-3'>{upcomingEvents.length}</Badge>
          </div>
          
          <div className="space-y-4 overflow-y-auto lg:h-[calc(100vh-214px)]">
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming events</p>
                </CardContent>
              </Card>
            ) : (
              upcomingEvents.map((event) => (
                <Card
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
                >
                  {/* Event Cover Image and Title */}
                  <div
                    className="relative min-h-40 bg-cover bg-center"
                    style={{
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${event.coverImageUrl || EventBg})`
                    }}
                  >
                    <div className="relative p-4 flex flex-col justify-center gap-2 min-h-40">
                      {event.isAllDay && (
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30 w-fit">
                          All Day
                        </Badge>
                      )}
                      {/* Date and Time */}
                      <p className="text-white text-sm font-medium drop-shadow-lg">
                        {formatEventDate(event.startTime)}
                        <br />
                        {formatEventTime(event.startTime)} - {event.endTime && formatEventTime(event.endTime)}
                      </p>

                      {/* Title */}
                      <h3 className="text-white font-bold text-2xl leading-tight drop-shadow-lg">
                        {event.title}
                      </h3>

                      {/* Location */}
                      {event.location && (
                        <p className="text-white text-sm font-medium flex items-center gap-1 drop-shadow-lg">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="line-clamp-1">{formatLocation(event.location)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Details Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEventCoverImageUrl(''); }
        }}
      >
        <DialogContent className={`border-0 outline-0 max-w-2xl overflow-hidden ${eventCoverImageUrl ? '[&>button]:bg-white/90 [&>button]:text-black [&>button]:hover:bg-white [&>button]:z-20' : ''}  p-0`}>
          <DialogHeader
            className="relative min-h-80 bg-cover bg-center rounded-t-lg p-12 pb-5 gap-4 flex flex-col items-center justify-end"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${eventCoverImageUrl})`
            }}
          >
            {selectedEvent?.isAllDay && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                All Day
              </Badge>
            )}
            <p className={`mb-2 text-center text-lg font-medium ${eventCoverImageUrl ? 'text-white' : ''}`}>
              {selectedEvent && formatEventDate(selectedEvent.startTime)}
              <br className='sm:hidden' />
              <span className='hidden sm:inline px-4'>|</span>
              {selectedEvent && formatEventTime(selectedEvent.startTime)} -
              {selectedEvent?.endTime && formatEventTime(selectedEvent.endTime)}
            </p>
            <DialogTitle className={`flex items-center justify-center text-center text-3xl sm:text-4xl gap-2 ${eventCoverImageUrl ? 'text-white drop-shadow-lg' : ''}`}>
              {selectedEvent?.title}
            </DialogTitle>
            <p className={`text-lg font-medium text-center ${eventCoverImageUrl ? 'text-white' : ''}`}>
              {selectedEvent?.location && formatLocation(selectedEvent.location)}
            </p>
            <DialogDescription className={`text-center max-w-2xl ${eventCoverImageUrl ? 'text-gray-100' : ''}`}>
              {selectedEvent?.description && (
                <p className="text-sm sm:text-md leading-snug">
                  {selectedEvent.description}
                </p>
              )}
            </DialogDescription>

            {/* Register Button */}
            {eventPageUrl && (
              <Button
                size="lg"
                className="mt-4 !mb-4 bg-highlight hover:bg-primary text-card font-medium px-8 py-3"
                onClick={handleRegister}
              >
                Register Now
              </Button>
            )}

            {selectedEvent && selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
              <div className="dialog-body space-y-4 px-6 pb-0">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.attendees.length} attendees</span>
                </div>
              </div>
            )}

            {/* Countdown Timer */}
            {selectedEvent && (
              <EventCountdown
                startTime={selectedEvent.startTime}
                scale="xs"
                className="mx-4"
              />
            )}
          </DialogHeader>


          <DialogFooter className='flex flex-row w-full p-3 pt-3 items-center sm:justify-end'>
            {selectedEvent && (
              <Button
                variant="default"
                size='sm'
                onClick={() => navigate(`/events/${selectedEvent.id}`)}
              >
                View Full Details
              </Button>
            )}
            {eventPageUrl &&
              <Button
                asChild
                className=""
                size='sm'
                variant="outline"
              >
                <a
                  href={eventPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Event Website
                </a>
              </Button>
            }
            {isAuthenticated && (
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  handleEditEvent(selectedEvent as CalendarEvent);
                }}
                size='sm'
                className='w-9'
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline" size='sm' className='w-9'>
                <X className="h-3 w-3" />
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Events Dialog (Mobile) */}
      <Dialog open={dayEventsDialogOpen} onOpenChange={setDayEventsDialogOpen}>
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
                    className="p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setDayEventsDialogOpen(false);
                          navigate(`/events/${event.id}`);
                        }}
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
                      {isAuthenticated && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDayEventsDialogOpen(false);
                            handleEditEvent(event);
                          }}
                          className="ml-2 h-auto p-1"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
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
    </>
  );
};

export default CalendarPage;