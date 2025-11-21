import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Save, X, AlertCircle, Link, Image, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { useEventDraftStore } from '@/stores/eventDraftStore';
import { createCalendarEvent, updateCalendarEvent, getEventCustomFields, deleteCalendarEvent, CalendarEvent, CreateEventPayload, UpdateEventPayload } from '@/services/calendar';
import { uploadAvatar, validateAvatarFile, createImagePreview, revokeImagePreview, uploadEventCoverImage } from '@/services/avatarUpload';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarId: string;
  locationId: string;
  event?: CalendarEvent | null; // If provided, we're editing
  selectedDate?: Date | null; // Pre-fill date when creating
  setSelectedEvent: (event: CalendarEvent | null) => void;
  onEventCreated?: (event: CalendarEvent) => void;
  onEventUpdated?: (event: CalendarEvent) => void;
  onEventDeleted?: () => void;
  source?: 'calendar' | 'event-details'; // Track where dialog was opened from
}

interface CustomFields {
  pageUrl?: string;
  coverImageUrl?: string;
  downloadFileUrl?: string;
  basicEmbedCode?: string;
  enhancedEmbedCode?: string;
  eliteEmbedCode?: string;
}

interface FormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  appointmentStatus: 'new' | 'scheduled' | 'confirmed' | 'cancelled';
  toNotify: boolean;
  internalNote: string;
  // Custom fields
  pageUrl: string;
  coverImageUrl: string;
  downloadFileUrl: string;
  basicEmbedCode: string;
  enhancedEmbedCode: string;
  eliteEmbedCode: string;
}

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  onOpenChange,
  calendarId,
  event,
  selectedDate,
  setSelectedEvent,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
  source = 'calendar' // Default to 'calendar' for backward compatibility
}) => {
  const { user } = useAuthStore();
  const { saveDraft, getDraft, clearDraft } = useEventDraftStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [shouldUpdateRecurringSeries, setShouldUpdateRecurringSeries] = useState(true); // Default to updating all
  const [showRecurringConfirmDialog, setShowRecurringConfirmDialog] = useState(false);
  const [pendingFormSubmit, setPendingFormSubmit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // File upload states
  const [coverUploading, setCoverUploading] = useState(false);
  const [downloadUploading, setDownloadUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Track previous open state to detect close transition
  const prevOpenRef = React.useRef(open);
  
  // Track if dialog was closed after successful save (don't clear selectedEvent in this case)
  const savedSuccessfullyRef = React.useRef(false);
  
  const isEditing = !!event;
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    appointmentStatus: 'new',
    toNotify: false,
    internalNote: '',
    pageUrl: '',
    coverImageUrl: '',
    downloadFileUrl: '',
    basicEmbedCode: '',
    enhancedEmbedCode: '',
    eliteEmbedCode: ''
  });

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      // Reset the saved successfully flag when dialog opens
      savedSuccessfullyRef.current = false;
      
      if (isEditing && event) {
        console.log('EventFormDialog: Editing event', {
          id: event.id,
          title: event.title,
          isRecurring: event.isRecurring,
          rrule: event.rrule,
          originalRecurringEventId: event.originalRecurringEventId,
          masterEventId: event.masterEventId
        });
        console.log('EventFormDialog: isEditing =', isEditing, 'event?.isRecurring =', event?.isRecurring, 'Checkbox should show:', isEditing && event?.isRecurring);
        
        // Pre-fill form with event data
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        
        // Format dates in local timezone to avoid UTC conversion issues
        const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        // Detect if event is multi-day
        setIsMultiDay(startDateStr !== endDateStr);
        
        // Set basic form data immediately
        setFormData({
          title: event.title,
          description: event.description || '',
          startDate: startDateStr,
          startTime: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
          endDate: endDateStr,
          endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
          location: event.location || '',
          appointmentStatus: event.status as any || 'new',
          toNotify: false,
          internalNote: '',
          pageUrl: '',
          coverImageUrl: '',
          downloadFileUrl: '',
          basicEmbedCode: '',
          enhancedEmbedCode: '',
          eliteEmbedCode: ''
        });
        
        // Load custom fields in the background
        getEventCustomFields(event.id).then(customFields => {
          console.log('Loaded custom fields for event:', customFields);
          setFormData(prev => ({
            ...prev,
            internalNote: customFields.internalNote || '',
            pageUrl: customFields.pageUrl || '',
            coverImageUrl: customFields.coverImageUrl || '',
            downloadFileUrl: customFields.downloadFileUrl || '',
            basicEmbedCode: customFields.basicEmbedCode || '',
            enhancedEmbedCode: customFields.enhancedEmbedCode || '',
            eliteEmbedCode: customFields.eliteEmbedCode || ''
          }));
        }).catch(error => {
          console.error('Failed to load custom fields:', error);
        });
      } else {
        // Creating new event - check for draft first
        const savedDraft = getDraft();
        
        if (savedDraft) {
          // Restore from draft
          setFormData({
            title: savedDraft.title,
            description: savedDraft.description,
            startDate: savedDraft.startDate,
            startTime: savedDraft.startTime,
            endDate: savedDraft.endDate,
            endTime: savedDraft.endTime,
            location: savedDraft.location,
            appointmentStatus: savedDraft.appointmentStatus,
            toNotify: savedDraft.toNotify,
            internalNote: savedDraft.internalNote,
            pageUrl: savedDraft.pageUrl,
            coverImageUrl: savedDraft.coverImageUrl,
            downloadFileUrl: savedDraft.downloadFileUrl,
            basicEmbedCode: savedDraft.basicEmbedCode || '',
            enhancedEmbedCode: savedDraft.enhancedEmbedCode || '',
            eliteEmbedCode: savedDraft.eliteEmbedCode || ''
          });
          setIsMultiDay(savedDraft.isMultiDay);
        } else {
          // No draft - use defaults
          const now = new Date();
          const baseDate = selectedDate || now;
          
          // Default to next available hour
          const startTime = new Date(baseDate);
          startTime.setHours(Math.max(9, now.getHours() + 1), 0, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 1);
          
          setIsMultiDay(false);
          
          setFormData({
            title: '',
            description: '',
            startDate: startTime.toISOString().split('T')[0],
            startTime: startTime.toTimeString().slice(0, 5),
            endDate: endTime.toISOString().split('T')[0],
            endTime: endTime.toTimeString().slice(0, 5),
            location: '',
            appointmentStatus: 'new',
            toNotify: false,
            internalNote: '',
            pageUrl: '',
            coverImageUrl: '',
            downloadFileUrl: '',
            basicEmbedCode: '',
            enhancedEmbedCode: '',
            eliteEmbedCode: ''
          });
        }
      }
      setError(null);
      // Reset dialog states
      setPendingFormSubmit(false);
      setShouldUpdateRecurringSeries(true); // Reset to default
    } else {
      // When dialog closes, reset states and clear draft
      setPendingFormSubmit(false);
      setShouldUpdateRecurringSeries(true);
      // Don't clear selectedEvent here - handled by separate useEffect
      clearDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditing, event, selectedDate]);

  // Auto-save draft as user types (only for new events)
  useEffect(() => {
    if (open && !isEditing && formData.title) {
      // Only save if there's meaningful content and we're creating a new event
      const draft = {
        ...formData,
        isMultiDay,
        lastUpdated: Date.now()
      };
      saveDraft(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, isMultiDay, open, isEditing]);

  // Smart date/time change handlers
  const handleStartDateChange = (newStartDate: string) => {
    setFormData(prev => {
      const updates: Partial<FormData> = { startDate: newStartDate };
      
      // If not multi-day, update end date to match start date
      if (!isMultiDay) {
        updates.endDate = newStartDate;
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setFormData(prev => {
      const updates: Partial<FormData> = { startTime: newStartTime };
      
      // Check if end time would be before start time (crossing midnight)
      if (!isMultiDay && prev.endTime < newStartTime) {
        // Event crosses midnight, update end date to next day
        const startDate = new Date(prev.startDate + 'T00:00:00');
        startDate.setDate(startDate.getDate() + 1);
        updates.endDate = startDate.toISOString().split('T')[0];
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setFormData(prev => {
      const updates: Partial<FormData> = { endTime: newEndTime };
      
      // Check if end time is before start time (crossing midnight)
      if (!isMultiDay && newEndTime < prev.startTime) {
        // Event crosses midnight, update end date to next day
        const startDate = new Date(prev.startDate + 'T00:00:00');
        startDate.setDate(startDate.getDate() + 1);
        updates.endDate = startDate.toISOString().split('T')[0];
      } else if (!isMultiDay && newEndTime >= prev.startTime) {
        // End time is after start time on same day
        updates.endDate = prev.startDate;
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleMultiDayToggle = (checked: boolean) => {
    setIsMultiDay(checked);
    
    if (!checked) {
      // Single day event - sync end date to start date
      setFormData(prev => ({
        ...prev,
        endDate: prev.startDate
      }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // File upload handlers
  const handleCoverImageUpload = async (file: File) => {
    setCoverUploading(true);
    setError(null);

    try {
      // Validate file
      const validation = validateAvatarFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      // Create preview
      const preview = createImagePreview(file);
      setCoverPreview(preview);

      // Upload to GoHighLevel media storage using event cover endpoint
      const uploadResult = await uploadEventCoverImage(file);
      
      // Update form data
      handleInputChange('coverImageUrl', uploadResult.mediaUrl);
      
      // Clean up preview
      if (preview) {
        revokeImagePreview(preview);
        setCoverPreview(null);
      }
    } catch (err: any) {
      console.error('Cover image upload failed:', err);
      setError(err.message || 'Failed to upload cover image');
      
      // Clean up preview on error
      if (coverPreview) {
        revokeImagePreview(coverPreview);
        setCoverPreview(null);
      }
    } finally {
      setCoverUploading(false);
    }
  };

  const handleDownloadFileUpload = async (file: File) => {
    setDownloadUploading(true);
    setError(null);

    try {
      // Upload to GoHighLevel media storage
      const uploadResult = await uploadAvatar(file, user?.ghlContactId || '');
      
      // Update form data
      handleInputChange('downloadFileUrl', uploadResult.mediaUrl);
    } catch (err: any) {
      console.error('Download file upload failed:', err);
      setError(err.message || 'Failed to upload download file');
    } finally {
      setDownloadUploading(false);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Event title is required';
    }
    
    if (!formData.startDate || !formData.startTime) {
      return 'Start date and time are required';
    }
    
    if (!formData.endDate || !formData.endTime) {
      return 'End date and time are required';
    }
    
    // Parse dates in local timezone to avoid UTC conversion issues
    const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMinute);
    
    const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);
    const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMinute);
    
    if (endDateTime <= startDateTime) {
      return 'End time must be after start time';
    }
    
    if (!user?.ghlContactId) {
      return 'User contact ID not found. Please log in again.';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // If editing a recurring event and dialog hasn't been shown yet, show confirmation dialog
    if (isEditing && event?.isRecurring && !pendingFormSubmit) {
      setShowRecurringConfirmDialog(true);
      return;
    }
    
    // If we get here, either it's not recurring or user already made their choice
    await performUpdate();
  };

  const performUpdate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Combine date and time for ISO strings
      // Parse dates in local timezone to avoid UTC conversion issues
      const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
      const [startHour, startMinute] = formData.startTime.split(':').map(Number);
      const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMinute);
      
      const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
      const [endHour, endMinute] = formData.endTime.split(':').map(Number);
      const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMinute);
      
      // Prepare custom fields
      const customFields: CustomFields = {
        pageUrl: formData.pageUrl || undefined,
        coverImageUrl: formData.coverImageUrl || undefined,
        downloadFileUrl: formData.downloadFileUrl || undefined,
        basicEmbedCode: formData.basicEmbedCode || undefined,
        enhancedEmbedCode: formData.enhancedEmbedCode || undefined,
        eliteEmbedCode: formData.eliteEmbedCode || undefined
      };
      
      if (isEditing && event) {
        // Update existing event
        console.log('DEBUG: Editing event with ID:', event.id);
        console.log('DEBUG: Full event object:', event);
        console.log('DEBUG: Should update recurring series:', shouldUpdateRecurringSeries);
        
        // For recurring series updates, we need to handle appointment fields and custom fields separately
        if (shouldUpdateRecurringSeries && event.isRecurring) {
          console.log('🔄 Updating recurring series - checking which fields changed');
          
          // Detect which fields changed
          const appointmentFieldsChanged = 
            formData.title !== event.title ||
            formData.description !== (event.description || event.calendarNotes || '') ||
            formData.location !== (event.location || '') ||
            startDateTime.getTime() !== new Date(event.startTime).getTime() ||
            endDateTime.getTime() !== new Date(event.endTime).getTime() ||
            formData.appointmentStatus !== event.appointmentStatus;
          
          const customFieldsChanged = 
            formData.pageUrl !== (event.pageUrl || '') ||
            formData.coverImageUrl !== (event.coverImageUrl || '') ||
            formData.downloadFileUrl !== (event.downloadFileUrl || '') ||
            formData.basicEmbedCode !== (event.basicEmbedCode || '') ||
            formData.enhancedEmbedCode !== (event.enhancedEmbedCode || '') ||
            formData.eliteEmbedCode !== (event.eliteEmbedCode || '') ||
            formData.internalNote !== (event.internalNote || '');
          
          try {
            // For recurring series: Update everything in a single call
            // Note: When GoHighLevel updates "this_and_following_events", it recreates the series with new IDs
            // So we MUST include all fields (appointment + custom) in the initial update
            // Custom fields are automatically saved via upsertAppointmentCustomObject in the backend
            if (appointmentFieldsChanged || customFieldsChanged) {
              console.log('📝 Updating recurring series (appointment + custom fields in single call)');
              const appointmentUpdatePayload: UpdateEventPayload = {
                calendarId,
                title: formData.title,
                description: formData.description,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                location: formData.location,
                appointmentStatus: formData.appointmentStatus,
                address: formData.location,
                calendarNotes: formData.description,
                selectedTimezone: event.timezone || 'America/Denver',
                recurringEventUpdateType: 'this_and_following_events', // Update all future occurrences
                isCustomRecurring: true,
                rrule: event.rrule,
                ignoreDateRange: true,
                ignoreFreeSlotValidation: true,
                // Include custom fields in the appointment update
                // The backend will save these via upsertAppointmentCustomObject
                pageUrl: customFields.pageUrl,
                coverImageUrl: customFields.coverImageUrl,
                downloadFileUrl: customFields.downloadFileUrl,
                basicEmbedCode: customFields.basicEmbedCode,
                enhancedEmbedCode: customFields.enhancedEmbedCode,
                eliteEmbedCode: customFields.eliteEmbedCode,
                internalNote: formData.internalNote,
              };
              
              await updateCalendarEvent(event.id, appointmentUpdatePayload);
              console.log('✅ Recurring series updated (appointment + custom fields)');
            } else {
              console.log('ℹ️ No changes detected - nothing to update');
            }
            
            // Return updated event for the callback
            const updatedEvent = {
              ...event,
              title: formData.title,
              description: formData.description,
              startTime: startDateTime.toISOString(),
              endTime: endDateTime.toISOString(),
              location: formData.location,
              appointmentStatus: formData.appointmentStatus,
              pageUrl: customFields.pageUrl,
              coverImageUrl: customFields.coverImageUrl,
              downloadFileUrl: customFields.downloadFileUrl,
            };
            
            if (onEventUpdated) {
              await onEventUpdated(updatedEvent);
              console.log('onEventUpdated callback completed');
            }
          } catch (seriesError) {
            console.error('Failed to update recurring series:', seriesError);
            throw seriesError;
          }
        } else {
          // Single event update (or single instance of recurring event)
          const updatePayload: UpdateEventPayload = {
            calendarId,
            title: formData.title,
            description: formData.description,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            location: formData.location,
            appointmentStatus: formData.appointmentStatus,
            address: formData.location,
            calendarNotes: formData.description,
            internalNote: formData.internalNote,
            selectedTimezone: event.timezone || 'America/Denver',
            // Send custom fields directly
            pageUrl: customFields.pageUrl,
            coverImageUrl: customFields.coverImageUrl,
            downloadFileUrl: customFields.downloadFileUrl,
            basicEmbedCode: customFields.basicEmbedCode,
            enhancedEmbedCode: customFields.enhancedEmbedCode,
            eliteEmbedCode: customFields.eliteEmbedCode,
            // For recurring events updating single instance, preserve the recurrence pattern
            ...(event.isRecurring && {
              isCustomRecurring: true,
              rrule: event.rrule,
              ignoreDateRange: true,
              ignoreFreeSlotValidation: true,
            }),
            toNotify: formData.toNotify,
          };
          
          console.log('DEBUG: Update payload:', updatePayload);
          
          const updatedEvent = await updateCalendarEvent(event.id, updatePayload);
          
          console.log('Event updated successfully:', updatedEvent.id);
          
          // Wait for the callback to complete before closing
          console.log('Calling onEventUpdated callback...');
          if (onEventUpdated) {
            await onEventUpdated(updatedEvent);
            console.log('onEventUpdated callback completed');
          }
        }
      } else {
        // Create new event
        const createPayload: CreateEventPayload = {
          calendarId,
          title: formData.title,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          location: formData.location,
          contactId: user!.ghlContactId,
          appointmentStatus: formData.appointmentStatus,
          toNotify: formData.toNotify,
          ignoreDateRange: true,
          ignoreFreeSlotValidation: true,
          selectedTimezone: 'America/Denver',
          address: formData.location,
          calendarNotes: formData.description,
          internalNote: formData.internalNote ? 
            `${formData.internalNote}\n\nCreated by ${user?.firstName} ${user?.lastName} via web app` :
            `Created by ${user?.firstName} ${user?.lastName} via web app`,
          // Send custom fields directly
          pageUrl: customFields.pageUrl,
          coverImageUrl: customFields.coverImageUrl,
          downloadFileUrl: customFields.downloadFileUrl,
          basicEmbedCode: customFields.basicEmbedCode,
          enhancedEmbedCode: customFields.enhancedEmbedCode,
          eliteEmbedCode: customFields.eliteEmbedCode,
          source: 'calendar_page',
          channel: 'web_app',
          meetingLocationType: 'custom'
        };
        
        const newEvent = await createCalendarEvent(createPayload);
        
        // Wait for the callback to complete before closing
        if (onEventCreated) {
          await onEventCreated(newEvent);
        }
      }
      
      // Clear draft after successful submission
      clearDraft();
      
      // Mark as saved successfully so we don't clear selectedEvent
      savedSuccessfullyRef.current = true;
      
      // Close dialog after callbacks complete
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    
    setDeleting(true);
    try {
      await deleteCalendarEvent(event.id);
      console.log('Event deleted successfully');
      
      // Clear draft
      clearDraft();
      
      // Call callback if provided
      if (onEventDeleted) {
        onEventDeleted();
      }
      
      // Close dialogs
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      setError(err.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  // Handle dialog close to reset selected event
  useEffect(() => {
    // Only clear when transitioning from open to closed (not on initial mount)
    if (prevOpenRef.current && !open) {
      // On event-details page: never clear selectedEvent (user is viewing that specific event)
      // On calendar page: clear selectedEvent unless it was a successful save
      // if (source === 'calendar' && !savedSuccessfullyRef.current) {
      if (source === 'calendar') {
        setSelectedEvent(null);
      }
      // Reset the flag for next time
      savedSuccessfullyRef.current = false;
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="event-edit-dialog" className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-2 shadow-sm border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the details for this calendar event.'
                : 'Fill in the details to create a new calendar event.'
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Event Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title..."
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add event description..."
              rows={3}
            />
          </div>
          
          {/* Page URL */}
          <div className="space-y-2">
            <Label htmlFor="pageUrl" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Event Page URL
            </Label>
            <Input
              id="pageUrl"
              value={formData.pageUrl}
              onChange={(e) => handleInputChange('pageUrl', e.target.value)}
              placeholder="https://example.com/event-details"
              type="url"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <div className="flex justify-between gap-2">
              <Label className="flex items-end pb-1 gap-2">
                <Image className="h-4 w-4" />
                Cover Image
              </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  disabled={coverUploading}
                >
                  {coverUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
                {formData.coverImageUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.coverImageUrl, '_blank')}
                  >
                    Preview
                  </Button>
                )}
              </div>
            <div className="flex flex-col gap-2">
              <Input
                value={formData.coverImageUrl}
                onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                placeholder="Or paste image URL..."
                type="url"
              />
              <div className="flex justify-between gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverImageUpload(file);
                  }}
                  className="hidden"
                  id="cover-upload"
                />
                <span className="text-[11px] text-muted-foreground">
                  JPEG or PNG format. Maximum file size: 3.5MB
                </span>
              </div>
            </div>
          </div>

          {/* Download File */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download File (PDF, Images, etc.)
            </Label>
            <div className="flex flex-col gap-2">
              <Input
                value={formData.downloadFileUrl}
                onChange={(e) => handleInputChange('downloadFileUrl', e.target.value)}
                placeholder="Or paste file URL..."
                type="url"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDownloadFileUpload(file);
                  }}
                  className="hidden"
                  id="download-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('download-upload')?.click()}
                  disabled={downloadUploading}
                >
                  {downloadUploading ? 'Uploading...' : 'Upload File'}
                </Button>
                {formData.downloadFileUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.downloadFileUrl, '_blank')}
                  >
                    Preview
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Embed Codes */}
          <div className="space-y-2">
            <Label htmlFor="basicEmbedCode">Basic Embed Code</Label>
            <Textarea
              id="basicEmbedCode"
              value={formData.basicEmbedCode}
              onChange={(e) => handleInputChange('basicEmbedCode', e.target.value)}
              placeholder="Paste basic membership embed code here..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enhancedEmbedCode">Enhanced Embed Code</Label>
            <Textarea
              id="enhancedEmbedCode"
              value={formData.enhancedEmbedCode}
              onChange={(e) => handleInputChange('enhancedEmbedCode', e.target.value)}
              placeholder="Paste enhanced membership embed code here..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eliteEmbedCode">Elite Embed Code</Label>
            <Textarea
              id="eliteEmbedCode"
              value={formData.eliteEmbedCode}
              onChange={(e) => handleInputChange('eliteEmbedCode', e.target.value)}
              placeholder="Paste elite membership embed code here..."
              rows={4}
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            {/* Multi-day checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isMultiDay"
                checked={isMultiDay}
                onChange={(e) => handleMultiDayToggle(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isMultiDay" className="text-sm font-normal cursor-pointer">
                Multi-day event
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Start Time *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">
                  End Date * {!isMultiDay && <span className="text-xs text-muted-foreground">(auto-synced)</span>}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  disabled={!isMultiDay}
                  required
                  className={!isMultiDay ? 'opacity-60 cursor-not-allowed' : ''}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter event location..."
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Event Status</Label>
            <Select 
              value={formData.appointmentStatus} 
              onValueChange={(value) => handleInputChange('appointmentStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications */}
          {!isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="toNotify"
                checked={formData.toNotify}
                onChange={(e) => handleInputChange('toNotify', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="toNotify" className="text-sm">
                Send notification emails
              </Label>
            </div>
          )}

          {/* Note: Recurring event update choice is now handled via confirmation dialog */}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex gap-3">
            <Button 
              type="submit" 
              disabled={loading || deleting}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-0" />
              {loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading || deleting}
            >
              <X className="h-4 w-4 mr-0" />
              Cancel
            </Button>
            {isEditing && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || deleting}
                className='border-destructive text-destructive hover:text-destructive hover:bg-destructive/10'
              >
                <Trash2 className="h-4 w-4 mr-0" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>

      {/* Recurring Event Update Confirmation Dialog */}
      <Dialog open={showRecurringConfirmDialog} onOpenChange={setShowRecurringConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Recurring Event</DialogTitle>
            <DialogDescription>
              This is a recurring event. How would you like to apply your changes?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShouldUpdateRecurringSeries(true);
                  setPendingFormSubmit(true);
                  setShowRecurringConfirmDialog(false);
                  // Trigger the actual update
                  setTimeout(() => performUpdate(), 0);
                }}
                className="w-full p-4 text-left border-2 border-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <div className="font-semibold text-primary">Update all future events (Recommended)</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Apply changes to this event and all future occurrences in the series
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShouldUpdateRecurringSeries(false);
                  setPendingFormSubmit(true);
                  setShowRecurringConfirmDialog(false);
                  // Trigger the actual update
                  setTimeout(() => performUpdate(), 0);
                }}
                className="w-full p-4 text-left border-2 border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="font-semibold">Update only this event</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Apply changes to only this single occurrence
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowRecurringConfirmDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default EventFormDialog;