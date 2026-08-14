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

export type BookingWindow = 'upcoming' | 'past' | 'all';

export interface BookingListResponse {
  mode: 'bookings';
  boundary: string;
  filter: { window: BookingWindow; status: string | null; asOf: string };
  bookings: BookingRecord[];
}

export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
  role: string;
  goals: string[];
}

export interface BookingDetailRecord extends BookingRecord {
  participant: UserSummary | null;
  provider: UserSummary | null;
  supportWorker: UserSummary | null;
}

export interface BookingDetailResponse {
  mode: 'bookingDetail';
  boundary: string;
  booking: BookingDetailRecord;
}

export interface CancelBookingResponse {
  mode: 'bookingCancelled';
  boundary: string;
  booking: BookingRecord;
}

export async function getBookings(window: BookingWindow = 'upcoming') {
  const params = new URLSearchParams({ window });
  return apiFetch(`/bookings?${params.toString()}`) as Promise<BookingListResponse>;
}

export async function getBookingDetail(id: string) {
  return apiFetch(`/bookings/${encodeURIComponent(id)}`) as Promise<BookingDetailResponse>;
}

export async function cancelBooking(id: string, reason?: string) {
  return apiFetch(`/bookings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason: reason ?? 'Cancelled by participant' }),
  }) as Promise<CancelBookingResponse>;
}
