import { z } from 'zod';
import { prisma } from '../db';

export interface CalcomAvailabilitySlot {
  time: string;
  userIds?: number[];
}

export interface CalcomBookingRequest {
  eventTypeId: number;
  start: string;
  end?: string;
  timeZone: string;
  language: string;
  metadata?: Record<string, any>;
  responses: {
    name: string;
    email: string;
    location?: {
      optionValue: string;
      value: string;
    };
    phone?: string;
  };
}

export interface CalcomBookingResponse {
  id: number;
  uid: string;
  userId: number;
  eventTypeId: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  status: string;
  attendees: Array<{
    email: string;
    name: string;
    timeZone: string;
  }>;
  location: string;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface CalcomEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  userId: number;
}

/**
 * Get available slots from Cal.com
 */
export async function getCalcomAvailability(
  apiKey: string,
  username: string,
  eventTypeId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<CalcomAvailabilitySlot[]> {
  const url = new URL(`https://api.cal.com/v1/availability`);
  url.searchParams.append('apiKey', apiKey);
  url.searchParams.append('username', username);
  if (eventTypeId) url.searchParams.append('eventTypeId', eventTypeId);
  if (dateFrom) url.searchParams.append('dateFrom', dateFrom);
  if (dateTo) url.searchParams.append('dateTo', dateTo);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Cal.com API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.availability || [];
}

/**
 * Create a booking on Cal.com
 */
export async function createCalcomBooking(
  apiKey: string,
  bookingData: CalcomBookingRequest
): Promise<CalcomBookingResponse> {
  const response = await fetch('https://api.cal.com/v1/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(bookingData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cal.com booking failed: ${error}`);
  }

  return response.json();
}

/**
 * Get event types for a user
 */
export async function getCalcomEventTypes(
  apiKey: string,
  username: string
): Promise<CalcomEventType[]> {
  const response = await fetch(`https://api.cal.com/v1/event-types?username=${username}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Cal.com API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.event_types || [];
}

/**
 * Get available slots for an organization
 */
export async function getAvailableSlotsForOrganization(
  organizationId: string,
  daysAhead: number = 7
): Promise<Array<{ time: string; formattedTime: string }>> {
  const credential = await prisma.credential.findFirst({
    where: {
      organizationId,
      type: 'calcom',
      isActive: true,
    },
  });

  if (!credential) {
    throw new Error('No Cal.com credentials found for this organization');
  }

  const config = credential.config as { apiKey: string; username: string; eventTypeId?: string };
  
  const dateFrom = new Date().toISOString().split('T')[0];
  const dateTo = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const slots = await getCalcomAvailability(
    config.apiKey,
    config.username,
    config.eventTypeId,
    dateFrom,
    dateTo
  );

  return slots.map(slot => ({
    time: slot.time,
    formattedTime: new Date(slot.time).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }),
  }));
}

/**
 * Schedule a meeting via Cal.com
 */
export async function scheduleMeeting(
  organizationId: string,
  data: {
    preferredDate: string;
    duration?: number;
    purpose: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone?: string;
    callId?: string;
  }
): Promise<{
  success: boolean;
  meetingId?: string;
  bookingId?: string;
  meetingUrl?: string;
  startTime?: string;
  error?: string;
}> {
  try {
    const credential = await prisma.credential.findFirst({
      where: {
        organizationId,
        type: 'calcom',
        isActive: true,
      },
    });

    if (!credential) {
      return { success: false, error: 'No Cal.com credentials found' };
    }

    const config = credential.config as { apiKey: string; username: string; eventTypeId?: string; timeZone?: string };
    const eventTypeId = config.eventTypeId ? parseInt(config.eventTypeId) : undefined;

    if (!eventTypeId) {
      // Get first available event type
      const eventTypes = await getCalcomEventTypes(config.apiKey, config.username);
      if (eventTypes.length === 0) {
        return { success: false, error: 'No event types found' };
      }
      // Use the first event type
      const firstEventType = eventTypes[0];
      config.eventTypeId = firstEventType.id.toString();
    }

    const bookingData: CalcomBookingRequest = {
      eventTypeId: parseInt(config.eventTypeId!),
      start: data.preferredDate,
      timeZone: config.timeZone || 'UTC',
      language: 'en',
      metadata: {
        purpose: data.purpose,
        callId: data.callId,
        source: 'voxreach',
      },
      responses: {
        name: data.attendeeName,
        email: data.attendeeEmail,
        ...(data.attendeePhone && { phone: data.attendeePhone }),
      },
    };

    const booking = await createCalcomBooking(config.apiKey, bookingData);

    // Store the meeting in our database
    await prisma.meeting.create({
      data: {
        organizationId,
        calcomBookingId: booking.id.toString(),
        calcomUid: booking.uid,
        title: booking.title,
        description: data.purpose,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime),
        timeZone: booking.timeZone,
        status: booking.status,
        attendeeName: data.attendeeName,
        attendeeEmail: data.attendeeEmail,
        attendeePhone: data.attendeePhone,
        metadata: {
          ...booking.metadata,
          callId: data.callId,
        },
      },
    });

    return {
      success: true,
      meetingId: booking.uid,
      bookingId: booking.id.toString(),
      meetingUrl: `https://cal.com/${config.username}/${booking.uid}`,
      startTime: booking.startTime,
    };
  } catch (error: any) {
    console.error('Schedule meeting error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a meeting
 */
export async function cancelMeeting(
  organizationId: string,
  meetingId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: {
        organizationId,
        OR: [
          { calcomUid: meetingId },
          { calcomBookingId: meetingId },
        ],
      },
    });

    if (!meeting) {
      return { success: false, error: 'Meeting not found' };
    }

    const credential = await prisma.credential.findFirst({
      where: {
        organizationId,
        type: 'calcom',
        isActive: true,
      },
    });

    if (!credential) {
      return { success: false, error: 'No Cal.com credentials found' };
    }

    const config = credential.config as { apiKey: string };

    // Cancel via Cal.com API
    const response = await fetch(`https://api.cal.com/v1/bookings/${meeting.calcomBookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel booking: ${response.statusText}`);
    }

    // Update meeting status in our database
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: 'cancelled' },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Cancel meeting error:', error);
    return { success: false, error: error.message };
  }
}

export const scheduleMeetingSchema = z.object({
  preferredDate: z.string().describe('Preferred date and time for the meeting in ISO format'),
  duration: z.number().optional().describe('Duration in minutes (defaults to event type duration)'),
  purpose: z.string().describe('Purpose of the meeting'),
  attendeeName: z.string().describe('Name of the attendee'),
  attendeeEmail: z.string().email().describe('Email of the attendee'),
  attendeePhone: z.string().optional().describe('Phone number of the attendee'),
  callId: z.string().optional().describe('Optional call ID for tracking'),
});

export type ScheduleMeetingInput = z.infer<typeof scheduleMeetingSchema>;

/**
 * AI Agent tool for scheduling meetings
 */
export async function scheduleMeetingTool(
  input: ScheduleMeetingInput & { organizationId: string }
): Promise<{
  success: boolean;
  message: string;
  meetingId?: string;
  bookingId?: string;
  meetingUrl?: string;
  startTime?: string;
}> {
  const result = await scheduleMeeting(input.organizationId, input);
  
  if (result.success) {
    return {
      success: true,
      message: `Meeting scheduled successfully for ${new Date(result.startTime!).toLocaleString()}. Meeting URL: ${result.meetingUrl}`,
      meetingId: result.meetingId,
      bookingId: result.bookingId,
      meetingUrl: result.meetingUrl,
      startTime: result.startTime,
    };
  } else {
    return {
      success: false,
      message: `Failed to schedule meeting: ${result.error}`,
    };
  }
}

/**
 * Get tool definition for Vapi
 */
export function getScheduleMeetingToolDefinition(organizationId: string) {
  return {
    type: "function" as const,
    name: "schedule_meeting",
    description: "Schedule a meeting with a prospect using Cal.com integration",
    parameters: {
      type: "object",
      properties: {
        preferredDate: {
          type: "string",
          description: "Preferred date and time for the meeting in ISO format (e.g., 2024-01-15T14:30:00Z)",
        },
        duration: {
          type: "number",
          description: "Duration in minutes (defaults to event type duration)",
        },
        purpose: {
          type: "string",
          description: "Purpose of the meeting",
        },
        attendeeName: {
          type: "string",
          description: "Name of the attendee",
        },
        attendeeEmail: {
          type: "string",
          description: "Email of the attendee",
        },
        attendeePhone: {
          type: "string",
          description: "Phone number of the attendee",
        },
      },
      required: ["preferredDate", "purpose", "attendeeName", "attendeeEmail"],
    },
    async: true,
    server: {
      url: `https://backend-production-fc92.up.railway.app/api/calendar/schedule`,
      method: "POST",
      headers: {
        'x-organization-id': organizationId,
      },
    },
  };
}