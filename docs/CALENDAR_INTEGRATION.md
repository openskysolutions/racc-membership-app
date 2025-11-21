# Calendar Integration

## Overview
The "Add to Calendar" feature now works seamlessly across all platforms:
- **Native iOS App**: Uses iOS Calendar API to add events directly to the user's device calendar
- **Native Android App**: Uses Android Calendar API to add events directly to the user's device calendar  
- **Web Browser**: Downloads an `.ics` file that can be opened with any calendar application

## Implementation

### Plugin Used
- **[@ebarooni/capacitor-calendar](https://www.npmjs.com/package/@ebarooni/capacitor-calendar)** v7.2.0
  - Provides native calendar access for both iOS and Android
  - Supports event creation, modification, deletion, and listing
  - Handles permissions automatically

### Files Modified

#### 1. **src/pages/EventDetail.tsx**
- Added `CapacitorCalendar` import from `@ebarooni/capacitor-calendar`
- Added `toast` import from `sonner` for user feedback
- Updated `handleAddToCalendar` function to:
  - Detect if running in native app using `isNativeApp()`
  - Request full calendar access permissions
  - Create event using native calendar API with proper fields
  - Show success/error messages using toast notifications
  - Fall back to `.ics` file download for web browsers

#### 2. **ios/App/App/Info.plist**
Added required iOS permissions:
```xml
<key>NSCalendarsFullAccessUsageDescription</key>
<string>This app needs access to your calendar to add events you're interested in attending.</string>
<key>NSCalendarsWriteOnlyAccessUsageDescription</key>
<string>This app needs access to write events to your calendar so you can save events you want to attend.</string>
<key>NSCalendarsUsageDescription</key>
<string>This app needs access to your calendar to add events you're interested in attending.</string>
```

#### 3. **android/app/src/main/AndroidManifest.xml**
Added required Android permissions:
```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

#### 4. **package.json**
Added new dependency:
- `@ebarooni/capacitor-calendar`: ^7.2.0

## Features

### Native Apps (iOS & Android)
1. **Permission Request**: First time users tap "Add to Calendar", they'll see a system permission dialog
2. **Default Calendar Selection**: Events are automatically added to the user's primary calendar
3. **Full Event Details**: Includes title, description, location, start/end times, and all-day flag
4. **User Feedback**: Toast notifications confirm success or explain errors
5. **Error Handling**: Graceful fallback if permissions are denied or calendar not available

### Web Browser
1. **ICS File Download**: Creates and downloads a standard `.ics` calendar file
2. **Universal Compatibility**: Works with Google Calendar, Outlook, Apple Calendar, etc.
3. **One-Click Import**: Users can open the file to import the event

## User Experience

### iOS Flow
1. User taps "Add to Calendar" button
2. iOS permission dialog appears (first time only): "Allow RACC to access your calendar?"
3. User grants permission
4. Event is added to their calendar
5. Success toast: "Event added to your calendar!"

### Android Flow
1. User taps "Add to Calendar" button
2. Android permission dialog appears (first time only): "Allow RACC to access your calendar?"
3. User grants permission
4. Event is added to their calendar
5. Success toast: "Event added to your calendar!"

### Web Browser Flow
1. User taps "Add to Calendar" button
2. `.ics` file downloads automatically
3. User opens file to import into their preferred calendar app
4. Success toast: "Calendar file downloaded!"

## Testing

### To Test on iOS:
```bash
npm run cap:run:ios
```
1. Navigate to any event detail page
2. Tap "Add to Calendar"
3. Grant calendar permission when prompted
4. Verify event appears in iOS Calendar app

### To Test on Android:
```bash
npm run cap:run:android
```
1. Navigate to any event detail page
2. Tap "Add to Calendar"
3. Grant calendar permission when prompted
4. Verify event appears in Android Calendar app

### To Test on Web:
```bash
npm run dev
```
1. Navigate to any event detail page
2. Click "Add to Calendar"
3. Verify `.ics` file downloads
4. Open file to verify event details are correct

## Technical Notes

### Platform Detection
The implementation uses `isNativeApp()` from `@/lib/platform` which leverages `Capacitor.isNativePlatform()` to detect if running in a native iOS/Android environment versus a web browser.

### Calendar Selection
Currently uses the first calendar returned by `listCalendars()`. On most devices, this is the user's primary calendar. Future enhancement could allow users to choose which calendar to use.

### Event Properties Mapped
- `title` → Event title
- `description` → Event notes/description
- `location` → Event location
- `startDate` → Start time (milliseconds since epoch)
- `endDate` → End time (milliseconds since epoch)
- `isAllDay` → All-day event flag
- `calendarId` → Target calendar

### Error Handling
- Permission denial → User-friendly error message with guidance
- No calendars found → Specific error message
- API failures → Generic error message with console logging for debugging

## Future Enhancements
1. **Calendar Selection UI**: Allow users to choose which calendar to add events to
2. **Reminder Configuration**: Let users set reminder times for events
3. **Recurring Events**: Support for adding recurring events
4. **Event Update Detection**: Check if event already exists before adding
5. **Batch Operations**: Add multiple events at once
