import { apiFetch, ApiError } from './client';

export interface AvailabilitySlot {
  id: string;
  start: string;
  end: string;
  service: string;
  status: 'available';
}

export interface AvailabilityDay {
  date: string;
  day: string;
  openSlots: AvailabilitySlot[];
}

export interface ProviderAvailabilitySlotsResponse {
  mode: 'providerAvailabilitySlots';
  boundary: string;
  provider: {
    id: string;
    displayName: string;
  };
  startDate: string | null;
  endDate: string | null;
  days: AvailabilityDay[];
}

export async function getProviderAvailability(providerId: string, startDate: string, endDate: string) {
  const params = new URLSearchParams({ startDate, endDate });
  return apiFetch(`/providers/${encodeURIComponent(providerId)}/availability?${params.toString()}`) as Promise<ProviderAvailabilitySlotsResponse>;
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export interface CreateBookingInput {
  providerId: string;
  service: string;
  scheduledStart: string;
  scheduledEnd: string;
  supportCategory?: string;
  location?: string;
  notes?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled' | 'declined';

export interface BookingRecord {
  id: string;
  providerId: string;
  participantId: string;
  service: string;
  supportCategory: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: BookingStatus;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingResponse {
  mode: 'bookingCreated';
  boundary: string;
  booking: BookingRecord;
}

export async function createBooking(input: CreateBookingInput) {
  try {
    return (await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    })) as CreateBookingResponse;
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new ConflictError(err.message);
    }
    throw err;
  }
}
