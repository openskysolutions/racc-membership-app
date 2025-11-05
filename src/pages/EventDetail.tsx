import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Share2, 
  Download,
  ExternalLink,
  User,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Edit
} from 'lucide-react';
import EventCoverImage from '@/assets/explosive-event-cover.jpg';
import { CalendarEvent, getEventById, getEventCustomFields } from '@/services/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatEventDate, formatEventTime, formatLocation } from '@/lib/eventUtils';
import { EventCountdown } from '@/components/EventCountdown';
import { EventRegistrationDialog, RegistrationFormData } from '@/components/EventRegistrationDialog';
import EventFormDialog from '@/components/EventFormDialog';
import { useAuthStore } from '@/stores/authStore';

// GoHighLevel Calendar ID - RACC Events
const GHL_CALENDAR_ID = '9XpDcFHv3SmCUuHeuOOg';
const GHL_LOCATION_ID = '5FAB1z0AhuVlEdqOzjVX';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<{
    pageUrl?: string;
    coverImageUrl?: string;
    downloadFileUrl?: string;
  }>({});
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) {
        setError('Event ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch event details
        const eventData = await getEventById(id);
        setEvent(eventData);

        // Fetch custom fields
        try {
          const fields = await getEventCustomFields(id);
          setCustomFields(fields || {});
        } catch (err) {
          console.error('Failed to fetch custom fields:', err);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
        console.error('Error loading event:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  // const getEventDuration = () => {
  //   if (!event) return '';
  //   const start = new Date(event.startTime);
  //   const end = new Date(event.endTime);
  //   const duration = Math.abs(end.getTime() - start.getTime());
  //   const hours = Math.floor(duration / (1000 * 60 * 60));
  //   const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
  //   if (hours === 0) return `${minutes} minutes`;
  //   if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  //   return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
  // };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleRegister = (formData: RegistrationFormData) => {
    // TODO: Implement actual registration logic
    console.log('Registration submitted:', formData);
    setIsRegistered(true);
    setShowRegisterDialog(false);
  };

  const handleEventUpdated = async (updatedEvent: CalendarEvent) => {
    console.log('handleEventUpdated called with event:', updatedEvent.id);
    console.log('Current event ID from URL:', id);
    
    // For recurring events, GoHighLevel may return the base ID instead of the composite instance ID
    // Extract base ID to compare properly
    const extractBaseId = (eventId: string) => eventId.split('_')[0];
    const currentBaseId = extractBaseId(id || '');
    const updatedBaseId = extractBaseId(updatedEvent.id);
    
    if (currentBaseId !== updatedBaseId) {
      console.error('WARNING: Base event ID changed from', currentBaseId, 'to', updatedBaseId);
      console.error('This indicates a problem with the update API call');
    }
    
    // Re-fetch the complete event data from the server to ensure we have all fields
    // Use the original URL ID (with timestamp) to fetch the correct instance
    try {
      const freshEventData = await getEventById(id!);
      setEvent(freshEventData);
      
      // Refresh custom fields
      const fields = await getEventCustomFields(id!);
      setCustomFields(fields || {});
    } catch (err) {
      console.error('Failed to refresh event data:', err);
      // Fallback to using the updated event data we received
      setEvent(updatedEvent);
    }
    
    // Don't close the dialog here - let the dialog handle its own closing
    // after this callback completes
  };

  const handleAddToCalendar = () => {
    if (!event) return;
    
    // Create .ics file content
    const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = 
     `BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//RACC//Event//EN
      BEGIN:VEVENT
      UID:${event.id}@racc
      DTSTART:${startDate}
      DTEND:${endDate}
      SUMMARY:${event.title}
      DESCRIPTION:${event.description || ''}
      LOCATION:${event.location || ''}
      STATUS:CONFIRMED
      END:VEVENT
      END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || "The event you're looking for doesn't exist or has been removed."}
              </p>
              <Button onClick={() => navigate('/calendar')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section with Cover Image */}
      <div 
        className="relative flex flex-col items-center py-20 bg-cover bg-center p-6 pb-20"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${customFields.coverImageUrl || EventCoverImage})`
        }}
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/calendar')}
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditDialog(true)}
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              title="Edit Event"
            >
              <Edit className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            {isBookmarked ? (
              <Bookmark className="h-5 w-5 fill-current" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="bg-highlight/80 backdrop-blur-sm hover:bg-primary/90 text-card font-bold"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Event Title - Positioned at bottom of hero */}
        <div className="md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              {event.isAllDay && (
                <Badge variant="outline">All Day</Badge>
              )}
            </div>
            <p className='mb-4 text-xl text-card dark:text-neutral-50 font-medium text-center'>
              {formatEventDate(event.startTime)} 
              <br className='sm:hidden'/>
              <span className='hidden sm:inline px-6'>|</span> 
              {formatEventTime(event.startTime)}{' - '}
              {formatEventTime(event.endTime)}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-card dark:text-neutral-50 mb-4">
              {event.title}
            </h1>
            <p className='text-xl text-card dark:text-neutral-50 font-medium'>{formatLocation(event.location || '')}</p>
            <p className='text-md text-card dark:text-neutral-50 font-normal leading-6 mt-6 max-w-3xl'>{event.description}</p>
            
            {/* Register Button */}
            {!isRegistered && (
              <Button 
                size="lg" 
                className="mt-6 bg-highlight hover:bg-primary text-card font-medium px-8 py-6 text-md"
                onClick={() => setShowRegisterDialog(true)}
              >
                Register Now
              </Button>
            )}
          </div>
        </div>
        
        {/* Countdown Timer */}
        <EventCountdown startTime={event.startTime} className="absolute -bottom-4" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - Event Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Event Info Card */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Event Details</h2>
                
                <div className="space-y-4">
                  {/* Date */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Date</p>
                      <p className="text-muted-foreground">{formatEventDate(event.startTime)}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Time</p>
                      <p className="text-muted-foreground">
                        {formatEventTime(event.startTime)} - {formatEventTime(event.endTime)}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-muted-foreground">{event.location}</p>
                        <Button variant="link" className="p-0 h-auto text-primary" asChild>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Map <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Attendees */}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Attendees</p>
                        <p className="text-muted-foreground">{event.attendees.length} registered</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Description */}
                {event.description && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">About This Event</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      {event.description.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-2">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar Notes */}
                {event.calendarNotes && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Additional Information</h3>
                      <p className="text-muted-foreground">{event.calendarNotes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Organizer Info (if available) */}
            {event.contactId && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Event Organizer</h3>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">RACC Events Team</p>
                      <p className="text-sm text-muted-foreground">Event Coordinator</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Registration & Actions */}
          <div className="md:col-span-1 space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                {isRegistered ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">You're Registered!</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We've sent a confirmation to your email.
                    </p>
                    <Button variant="outline" className="w-full" onClick={handleAddToCalendar}>
                      <Download className="mr-2 h-4 w-4" />
                      Add to Calendar
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold">Register for Event</h3>
                    <p className="text-sm text-muted-foreground">
                      Secure your spot for this amazing event
                    </p>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setShowRegisterDialog(true)}
                    >
                      Register Now
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleAddToCalendar}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Add to Calendar
                    </Button>
                  </>
                )}

                <Separator />

                {/* Share Options */}
                <div>
                  <p className="text-sm font-medium mb-2">Share this event</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyToClipboard(window.location.href)}
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* External Link */}
                {customFields.pageUrl && (
                  <>
                    <Separator />
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={customFields.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Event Website <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </>
                )}

                {/* Download File */}
                {customFields.downloadFileUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={customFields.downloadFileUrl}
                      download
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Materials
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related Events or Tags */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Event Category</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Community</Badge>
                  <Badge variant="secondary">Networking</Badge>
                  <Badge variant="secondary">Business</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
            <DialogDescription>
              Share this event with your network
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Event Link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={window.location.href}
                  className="flex-1 px-3 py-2 border rounded-md bg-background"
                />
                <Button
                  onClick={() => copyToClipboard(window.location.href)}
                  variant="outline"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      {event && (
        <EventRegistrationDialog
          open={showRegisterDialog}
          onOpenChange={setShowRegisterDialog}
          eventTitle={event.title}
          onRegister={handleRegister}
        />
      )}

      {/* Edit Event Dialog */}
      {event && (
        <EventFormDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          calendarId={GHL_CALENDAR_ID}
          locationId={GHL_LOCATION_ID}
          event={event}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
