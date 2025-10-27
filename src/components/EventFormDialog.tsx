import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Save, X, AlertCircle, Link, Image, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { createCalendarEvent, updateCalendarEvent, CalendarEvent, CreateEventPayload, UpdateEventPayload } from '@/services/calendar';
import { uploadAvatar, validateAvatarFile, createImagePreview, revokeImagePreview, uploadEventCoverImage } from '@/services/avatarUpload';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarId: string;
  locationId: string;
  event?: CalendarEvent | null; // If provided, we're editing
  selectedDate?: Date | null; // Pre-fill date when creating
  onEventCreated?: (event: CalendarEvent) => void;
  onEventUpdated?: (event: CalendarEvent) => void;
}

interface CustomFields {
  pageUrl?: string;
  coverImageUrl?: string;
  downloadFileUrl?: string;
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
}

const EventFormDialog: React.FC<EventFormDialogProps> = ({
  open,
  onOpenChange,
  calendarId,
  event,
  selectedDate,
  onEventCreated,
  onEventUpdated
}) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File upload states
  const [coverUploading, setCoverUploading] = useState(false);
  const [downloadUploading, setDownloadUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
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
    downloadFileUrl: ''
  });

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open) {
      if (isEditing && event) {
        // Pre-fill form with event data
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        
        // Set basic form data immediately
        setFormData({
          title: event.title,
          description: event.description || '',
          startDate: startDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endDate: endDate.toISOString().split('T')[0],
          endTime: endDate.toTimeString().slice(0, 5),
          location: event.location || '',
          appointmentStatus: event.status as any || 'new',
          toNotify: false,
          internalNote: '',
          pageUrl: '',
          coverImageUrl: '',
          downloadFileUrl: ''
        });
        
        // Lazy-load custom fields in the background
        import('../services/calendar').then(({ getEventCustomFields }) => {
          getEventCustomFields(event.id).then(customFields => {
            console.log('Loaded custom fields for event:', customFields);
            setFormData(prev => ({
              ...prev,
              internalNote: customFields.internalNote || '',
              pageUrl: customFields.pageUrl || '',
              coverImageUrl: customFields.coverImageUrl || '',
              downloadFileUrl: customFields.downloadFileUrl || ''
            }));
          }).catch(error => {
            console.error('Failed to load custom fields:', error);
          });
        });
      } else {
        // Creating new event
        const now = new Date();
        const baseDate = selectedDate || now;
        
        // Default to next available hour
        const startTime = new Date(baseDate);
        startTime.setHours(Math.max(9, now.getHours() + 1), 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1);
        
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
          downloadFileUrl: ''
        });
      }
      setError(null);
    }
  }, [open, isEditing, event, selectedDate]);

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
    
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
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
    
    setLoading(true);
    setError(null);
    
    try {
      // Combine date and time for ISO strings
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      // Prepare custom fields
      const customFields: CustomFields = {
        pageUrl: formData.pageUrl || undefined,
        coverImageUrl: formData.coverImageUrl || undefined,
        downloadFileUrl: formData.downloadFileUrl || undefined
      };
      
      if (isEditing && event) {
        // Update existing event
        console.log('DEBUG: Editing event with ID:', event.id);
        console.log('DEBUG: Full event object:', event);
        
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
          // Send custom fields directly
          pageUrl: customFields.pageUrl,
          coverImageUrl: customFields.coverImageUrl,
          downloadFileUrl: customFields.downloadFileUrl,
        };
        
        const updatedEvent = await updateCalendarEvent(event.id, updatePayload);
        onEventUpdated?.(updatedEvent);
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
          source: 'calendar_page',
          channel: 'web_app',
          meetingLocationType: 'custom'
        };
        
        const newEvent = await createCalendarEvent(createPayload);
        onEventCreated?.(newEvent);
      }
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Internal Note */}
          <div className="space-y-2">
            <Label htmlFor="internalNote">Internal Note (Staff Only)</Label>
            <Textarea
              id="internalNote"
              value={formData.internalNote}
              onChange={(e) => handleInputChange('internalNote', e.target.value)}
              placeholder="Add internal notes visible only to staff..."
              rows={2}
              disabled
            />
          </div>

          {/* Custom Fields Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">Event Resources</h3>
            
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
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Cover Image
              </Label>
              <div className="flex flex-col gap-2">
                <Input
                  value={formData.coverImageUrl}
                  onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                  placeholder="Or paste image URL..."
                  type="url"
                />
                <div className="flex items-center gap-2">
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
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
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
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                required
              />
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;