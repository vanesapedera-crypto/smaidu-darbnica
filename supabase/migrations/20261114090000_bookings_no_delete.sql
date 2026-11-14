-- =====================================================================
-- Pieteikumus nedzēš nekad (2026-11-14): tikai statuss "Atcelta" (atceltie) vai arhīvs (notikušie).
-- Noņem dzēšanas tiesības — bez DELETE politikas datubāze dzēšanu neatļauj nevienam (arī administratorei).
-- Palaist var atkārtoti.
-- =====================================================================
drop policy if exists "bookings_admin_delete" on public.bookings;
