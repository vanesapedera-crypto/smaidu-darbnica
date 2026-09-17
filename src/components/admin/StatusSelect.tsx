"use client";

import { useRouter } from "next/navigation";

type Props = {
  id: string;
  status: string | null;
};

export default function StatusSelect({ id, status }: Props) {
  const router = useRouter();

  return (
    <select
      value={status ?? "Jauns"}
      className="rounded border p-2"
      onChange={async (e) => {
        await fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: e.target.value,
          }),
        });

        router.refresh();
      }}
    >
      <option value="Jauns">🟡 Jauns</option>
      <option value="Apstiprināta">🟢 Apstiprināta</option>
      <option value="Atcelta">🔴 Atcelta</option>
    </select>
  );
}