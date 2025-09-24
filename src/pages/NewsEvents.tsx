import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Clock, Plus, Edit, Eye, Shield, Check, X } from 'lucide-react';
import { getEventsList, Event, createEvent, updateEvent, createOrUpdateRSVP, getMyRSVP, RSVP } from '@/services/events';
import { getModerationQueue, approveEvent, rejectEvent, checkModerationAccess } from '@/services/eventModeration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const NewsEventsPages: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('view');
  
  // RSVP state
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentRSVP, setCurrentRSVP] = useState<RSVP | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpFormData, setRsvpFormData] = useState({
    status: 'attending' as 'attending' | 'not-attending' | 'maybe',
    notes: '',
    guestCount: 0
  });
  
  // Event form state
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    isVirtual: false,
    maxAttendees: '',
    visibility: 'public' as 'public' | 'members' | 'restricted',
    status: 'draft' as 'draft' | 'published' | 'cancelled'
  });

  // Moderation state
  const [hasModerationAccess, setHasModerationAccess] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [moderationLoading, setModerationLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsData = await getEventsList({ status: 'published' });
        setEvents(eventsData);
        
        // Check moderation access
        try {
          const { hasAccess } = await checkModerationAccess();
          setHasModerationAccess(hasAccess);
          
          // If user has moderation access, fetch pending events
          if (hasAccess) {
            const { events: pending } = await getModerationQueue();
            setPendingEvents(pending);
          }
        } catch (err) {
          console.warn('Failed to check moderation access:', err);
          setHasModerationAccess(false);
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      startsAt: '',
      endsAt: '',
      location: '',
      isVirtual: false,
      maxAttendees: '',
      visibility: 'public',
      status: 'draft'
    });
    setActiveTab('create');
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startsAt: event.startsAt.slice(0, 16), // Format for datetime-local input
      endsAt: event.endsAt.slice(0, 16),
      location: event.location || '',
      isVirtual: event.isVirtual,
      maxAttendees: event.maxAttendees?.toString() || '',
      visibility: event.visibility,
      status: event.status
    });
    setActiveTab('create');
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        location: formData.location,
        isVirtual: formData.isVirtual,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        visibility: formData.visibility,
        status: formData.status
      };

      let savedEvent: Event;
      
      if (editingEvent) {
        // Update existing event
        savedEvent = await updateEvent(editingEvent.id, eventData);
        alert('Event updated successfully!');
        
        // Update the event in our local state
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? savedEvent : e));
      } else {
        // Create new event
        savedEvent = await createEvent(eventData);
        alert('Event created successfully!');
        
        // Add new event to local state if it's published
        if (savedEvent.status === 'published') {
          setEvents(prev => [savedEvent, ...prev]);
        }
      }
      
      // Reset form and go back to view
      setFormData({
        title: '',
        description: '',
        startsAt: '',
        endsAt: '',
        location: '',
        isVirtual: false,
        maxAttendees: '',
        visibility: 'public',
        status: 'draft'
      });
      setEditingEvent(null);
      setActiveTab('view');
      
      // Refresh events list
      const eventsData = await getEventsList({ status: 'published' });
      setEvents(eventsData);
      
    } catch (err) {
      console.error('Error saving event:', err);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRSVPClick = async (event: Event) => {
    setSelectedEvent(event);
    setRsvpLoading(true);
    
    try {
      // Load current RSVP status
      const rsvp = await getMyRSVP(event.id);
      setCurrentRSVP(rsvp);
      
      if (rsvp) {
        setRsvpFormData({
          status: rsvp.status,
          notes: rsvp.notes || '',
          guestCount: 0
        });
      } else {
        setRsvpFormData({
          status: 'attending',
          notes: '',
          guestCount: 0
        });
      }
    } catch (err) {
      console.error('Error loading RSVP:', err);
      // Continue anyway - user can still submit new RSVP
      setCurrentRSVP(null);
      setRsvpFormData({
        status: 'attending',
        notes: '',
        guestCount: 0
      });
    } finally {
      setRsvpLoading(false);
    }
    
    setRsvpDialogOpen(true);
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    try {
      setRsvpLoading(true);
      
      const rsvp = await createOrUpdateRSVP(selectedEvent.id, rsvpFormData);
      setCurrentRSVP(rsvp);
      
      // Close dialog and show success
      setRsvpDialogOpen(false);
      alert('RSVP submitted successfully!');
      
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      alert('Failed to submit RSVP. Please try again.');
    } finally {
      setRsvpLoading(false);
    }
  };

  // Moderation functions
  const handleApproveEvent = async (eventId: string, reason?: string) => {
    try {
      setModerationLoading(true);
      await approveEvent(eventId, reason);
      
      // Refresh moderation queue and published events
      const { events: pending } = await getModerationQueue();
      setPendingEvents(pending);
      
      const eventsData = await getEventsList({ status: 'published' });
      setEvents(eventsData);
      
      alert('Event approved successfully!');
    } catch (err) {
      console.error('Error approving event:', err);
      alert('Failed to approve event. Please try again.');
    } finally {
      setModerationLoading(false);
    }
  };

  const handleRejectEvent = async (eventId: string, reason?: string) => {
    try {
      setModerationLoading(true);
      await rejectEvent(eventId, reason);
      
      // Refresh moderation queue
      const { events: pending } = await getModerationQueue();
      setPendingEvents(pending);
      
      alert('Event rejected successfully!');
    } catch (err) {
      console.error('Error rejecting event:', err);
      alert('Failed to reject event. Please try again.');
    } finally {
      setModerationLoading(false);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${hasModerationAccess ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="view">View Events</TabsTrigger>
          <TabsTrigger value="create">Create Event</TabsTrigger>
          <TabsTrigger value="manage">Manage Events</TabsTrigger>
          {hasModerationAccess && (
            <TabsTrigger value="moderation">
              Moderation {pendingEvents.length > 0 && `(${pendingEvents.length})`}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground mb-4">Check back later for new events and activities.</p>
                  <Button onClick={handleCreateEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Upcoming Events</h2>
                <Button onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>
              
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
                        <div className="flex items-center gap-2">
                          <Badge className={getVisibilityColor(event.visibility)}>
                            {event.visibility}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
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
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleRSVPClick(event)}
                          disabled={rsvpLoading}
                        >
                          {rsvpLoading ? 'Loading...' : 'RSVP'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </CardTitle>
              <CardDescription>
                {editingEvent ? 'Update the event details below.' : 'Fill out the form below to create a new event.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitEvent} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter event title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility *</Label>
                    <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="restricted">Restricted Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the event..."
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startsAt">Start Date & Time *</Label>
                    <Input
                      id="startsAt"
                      type="datetime-local"
                      value={formData.startsAt}
                      onChange={(e) => handleInputChange('startsAt', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endsAt">End Date & Time *</Label>
                    <Input
                      id="endsAt"
                      type="datetime-local"
                      value={formData.endsAt}
                      onChange={(e) => handleInputChange('endsAt', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter event location"
                      disabled={formData.isVirtual}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAttendees">Max Attendees</Label>
                    <Input
                      id="maxAttendees"
                      type="number"
                      value={formData.maxAttendees}
                      onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                      placeholder="Leave empty for unlimited"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft - Not visible to public</SelectItem>
                        <SelectItem value="published">Published - Visible to public</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <input
                      type="checkbox"
                      id="isVirtual"
                      checked={formData.isVirtual}
                      onChange={(e) => handleInputChange('isVirtual', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isVirtual">This is a virtual event</Label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setActiveTab('view');
                      setEditingEvent(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>
                Manage all events including drafts and published events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Event management interface will be implemented here. This will include:
              </p>
              <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                <li>View all events (including drafts)</li>
                <li>Bulk operations (publish, archive, delete)</li>
                <li>Event analytics and attendance tracking</li>
                <li>Moderation tools for user-submitted events</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {hasModerationAccess && (
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Event Moderation
                </CardTitle>
                <CardDescription>
                  Review and moderate pending events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No pending events</h3>
                    <p className="text-muted-foreground">All events have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEvents.map((event) => (
                      <Card key={event.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {event.description}
                              </p>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-3">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  {formatEventDate(event.startsAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatEventTime(event.startsAt)}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {event.location}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="secondary">{event.status}</Badge>
                                <Badge className={getVisibilityColor(event.visibility)}>
                                  {event.visibility}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveEvent(event.id)}
                                disabled={moderationLoading}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectEvent(event.id)}
                                disabled={moderationLoading}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* RSVP Dialog */}
      <Dialog open={rsvpDialogOpen} onOpenChange={setRsvpDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>RSVP for {selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent && (
                <div className="text-sm text-muted-foreground">
                  {formatEventDate(selectedEvent.startsAt)} at {formatEventTime(selectedEvent.startsAt)}
                  {selectedEvent.location && ` • ${selectedEvent.isVirtual ? 'Virtual' : selectedEvent.location}`}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRSVPSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rsvp-status">RSVP Status</Label>
              <Select
                value={rsvpFormData.status}
                onValueChange={(value) => setRsvpFormData(prev => ({ ...prev, status: value as 'attending' | 'not-attending' | 'maybe' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your response" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      Attending
                    </div>
                  </SelectItem>
                  <SelectItem value="maybe">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Maybe
                    </div>
                  </SelectItem>
                  <SelectItem value="not-attending">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Not Attending
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvp-notes">Notes (Optional)</Label>
              <Textarea
                id="rsvp-notes"
                placeholder="Any additional comments or special requirements..."
                value={rsvpFormData.notes}
                onChange={(e) => setRsvpFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvp-guests">Number of Guests</Label>
              <Input
                id="rsvp-guests"
                type="number"
                min="0"
                max="10"
                value={rsvpFormData.guestCount}
                onChange={(e) => setRsvpFormData(prev => ({ ...prev, guestCount: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {currentRSVP && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Current status: <span className="font-medium capitalize">{currentRSVP.status.replace('_', ' ')}</span>
                  {currentRSVP.updatedAt && (
                    <span className="block mt-1">
                      Last updated: {new Date(currentRSVP.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRsvpDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rsvpLoading}>
                {rsvpLoading ? 'Submitting...' : 'Submit RSVP'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default NewsEventsPages;