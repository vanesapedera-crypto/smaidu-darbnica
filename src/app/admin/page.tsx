import { supabase } from "@/lib/supabase";
import StatusSelect from "@/components/admin/StatusSelect";

export default async function AdminPage() {
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) {
    return (
      <main className="p-10">
        <h1 className="text-3xl font-bold mb-6">Admin</h1>
        <p>Kļūda: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="mb-6 text-3xl font-bold">Rezervācijas</h1>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full">
          <thead className="bg-pink-100">
            <tr>
              <th className="p-3 text-left">Datums</th>
              <th className="p-3 text-left">Laiks</th>
              <th className="p-3 text-left">Programma</th>
              <th className="p-3 text-left">Klients</th>
              <th className="p-3 text-left">Telefons</th>
              <th className="p-3 text-left">E-pasts</th>
              <th className="p-3 text-left">Vieta</th>
              <th className="p-3 text-left">Statuss</th>
            </tr>
          </thead>

          <tbody>
            {bookings?.map((booking) => (
              <tr key={booking.id} className="border-t">
                <td className="p-3">{booking.event_date}</td>
                <td className="p-3">{booking.event_time}</td>
                <td className="p-3">{booking.program}</td>
                <td className="p-3">{booking.parent_name}</td>
                <td className="p-3">{booking.phone}</td>
                <td className="p-3">{booking.email}</td>
                <td className="p-3">{booking.location}</td>
                <td className="p-3">
                  <StatusSelect
                    id={booking.id}
                    status={booking.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}