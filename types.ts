
export interface Ticket {
  id: string;
  type: string;
  qrCodeValue: string;
  purchaseDetails?: string;
  imageBase64: string;
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO string format
  time: string;
  location: string;
  tickets: Ticket[];
  reminder?: 'none' | '1h' | '2h' | '1d' | '2d';
}

export interface ExtractedTicketData {
  eventName: string;
  date: string;
  time: string;
  location: string;
  ticketType: string;
  barcodeQRGist: string;
  ticketCount?: number;
}

export interface NewTicketPayload {
  ticket: Ticket;
  eventDetails: Omit<Event, 'id' | 'tickets' | 'reminder'>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Optional for Google users
  isGoogle?: boolean;
}
