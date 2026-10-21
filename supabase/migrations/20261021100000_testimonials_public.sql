-- Atsauksmju forma mājaslapā (/atsauksmes): ikviens var iesniegt atsauksmi, bet tā netiek publicēta automātiski —
-- administrators to pārskata panelī (Atsauksmes) un publicē. Vērtējums 1–5 zvaigznes (0 — nav norādīts).
alter table public.testimonials add column if not exists rating smallint not null default 0;

drop policy if exists "testimonials_insert_public" on public.testimonials;
create policy "testimonials_insert_public" on public.testimonials
  for insert to anon, authenticated
  with check (published = false and char_length(text) between 5 and 3000 and char_length(author) between 1 and 120 and rating between 0 and 5);
