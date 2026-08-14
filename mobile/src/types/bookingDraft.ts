export interface ServiceSelection {
  service: { id: string; title: string; category: string; rate: string };
  assignmentMethod: 'auto' | 'manual';
  sessionType: 'inPerson' | 'remote';
}

export interface ScheduleSelection {
  provider: { id: string; name: string };
  date: string;
  slot: { id: string; start: string; end: string; service: string };
}

export type BookingDraft = ServiceSelection & ScheduleSelection;
