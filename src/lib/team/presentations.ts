export type PresentationRow = {
  id: string;
  client_name: string;
  title: string | null;
  event_date: string | null;
  place: string | null;
  children: number | null;
  hours: number | null;
  workshop_ids: string[];
  activity_ids: string[];
  intro: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
