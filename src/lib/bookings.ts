/** Pieteikumu statusi — tie paši, kas tika izmantoti iepriekšējā paneļa versijā. */
export const BOOKING_STATUSES = ["Jauns", "Apstiprināta", "Atcelta"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  created_at: string | null;
  inquiry_type: "business" | "private" | null;
  status: BookingStatus | null;
  parent_name: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  contact_role: string | null;
  program: string | null;
  service_slug: string | null;
  event_type: string | null;
  event_city: string | null;
  participants: number | null;
  budget_range: string | null;
  children_count: number | null;
  child_age: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  address: string | null;
  accept_travel_fee: boolean | null;
  /** Attālums turp un atpakaļ (km) un ceļa izdevumi (€) izbraukuma ballītēm */
  travel_km: number | null;
  travel_cost: number | null;
  message: string | null;
  admin_notes: string | null;
};
