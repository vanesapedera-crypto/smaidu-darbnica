"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { programs } from "@/data/programs";

export default function BookingForm() {
  const searchParams = useSearchParams();
  const selectedProgram = searchParams.get("program") ?? "";

  const [loading, setLoading] = useState(false);
const [form, setForm] = useState({
  parentName: "",
  phone: "",
  email: "",
  program: selectedProgram,
  childrenCount: "",
  childAge: "",
  eventDate: "",
  eventTime: "",
  location: "Smaidu Darbnīcā",
  address: "",
  acceptTravelFee: false,
  message: "",
});
const getVenuePrice = () => {
  if (!form.eventDate || form.location !== "Smaidu Darbnīcā") return 0;

  const day = new Date(form.eventDate).getDay();

  return day === 5 || day === 6 || day === 0 ? 110 : 90;
};
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    setLoading(false);

    if (data.success) {
      alert("Pieteikums veiksmīgi nosūtīts!");

      setForm({
        parentName: "",
        phone: "",
        email: "",
        program: "",
        childrenCount: "",
        childAge: "",
        eventDate: "",
        eventTime: "",
        location: "Smaidu Darbnīcā",
        address: "",
        acceptTravelFee: false,
        message: "",
      });
    } else {
      alert("Radās kļūda. Mēģiniet vēlreiz.");
    }
  };
const programPrice = () => {
  const count = Number(form.childrenCount);

  if (!count || !form.program) return null;

  let price = 0;

switch (form.program) {
  case "fejas-ballite":
  case "petnieku-ballite":
  case "gabbys-dollhouse":
  case "frozen-ballite":
  case "wednesday-ballite":
  case "piratu-ballite":
  case "eksperimentu-sovs":
  case "nerf-ballite":
  case "slaima-meistarklase":
    price = 135;
    if (count > 15) {
      price += (count - 15) * 5;
    }
    break;

  case "glitteru-ballite":
    if (count <= 6) price = 185;
    else if (count <= 15) price = 285;
    else price = 285 + (count - 15) * 8;
    break;

  case "spa-ballite":
    if (form.location === "Smaidu Darbnīcā") {
      if (count <= 6) price = 195;
      else if (count <= 10) price = 255;
      else if (count <= 15) price = 295;
      else price = 295 + (count - 15) * 10;
    } else {
      if (count <= 9) price = 265;
      else if (count <= 15) price = 305;
      else price = 305 + (count - 15) * 10;
    }
    break;

  case "make-up-ballite":
    if (form.location === "Smaidu Darbnīcā") {
      if (count <= 6) price = 185;
      else if (count <= 10) price = 245;
      else if (count <= 15) price = 285;
      else price = 285 + (count - 15) * 8;
    } else {
      if (count <= 10) price = 245;
      else if (count <= 15) price = 285;
      else price = 285 + (count - 15) * 8;
    }
    break;

case "sejas-apgleznosana":
  if (count <= 10) {
    price = 50;
  } else {
    price = 50 + (count - 10) * 3.5;
  }
  break;

case "putu-ballite":
  price = 180;
  break;

case "parsteiguma-tels":
  // Cena pēc individuāla piedāvājuma
  price = 45;
  break;
  }

  return price;
};
const calculatedProgramPrice = programPrice();

const totalPrice =
  (calculatedProgramPrice || 0) + getVenuePrice();
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl bg-white p-8 shadow-lg"
    >
          <div>
       <div>
  <Label htmlFor="location">Norises vieta</Label>

  <select
   id="location"
      value={form.location}
      onChange={handleChange}
      className="w-full rounded-xl border border-gray-300 p-3"
    >
      <option>Smaidu Darbnīcā</option>
      <option>Izbraukums</option>
    </select>
  {form.location === "Smaidu Darbnīcā" && (
    <div className="mt-4 rounded-xl bg-yellow-50 p-4 text-sm">
      <p className="font-semibold mb-2">
        Telpu noma
      </p>

      <p>Pieejamie laiki:</p>

      <ul className="ml-5 list-disc">
        <li>10:00</li>
        <li>14:00</li>
        <li>18:00</li>
      </ul>

      <p className="mt-3">
        <strong>Pirmdiena–Ceturtdiena:</strong> 90 €
      </p>

      <p>
        <strong>Piektdiena–Svētdiena:</strong> 110 €
      </p>
    </div>
  )}
</div>
{form.location === "Izbraukums" && (
  <>
    <div>
      <Label htmlFor="address">Ballītes adrese</Label>

      <Input
        id="address"
        value={form.address}
        onChange={handleChange}
        placeholder="Iela, pilsēta"
      />
    </div>

    <label className="mt-4 flex items-start gap-3 rounded-xl bg-yellow-50 p-4">
      <input
        type="checkbox"
        checked={form.acceptTravelFee}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            acceptTravelFee: e.target.checked,
          }))
        }
      />

      <span className="text-sm">
        Esmu informēts(-a), ka izbraukuma ballītēm tiek piemērota papildu maksa par izbraukumu.
      </span>
    </label>
  </>
)}
  </div>

      <div>
        <Label htmlFor="parentName">Vārds *</Label>
        <Input
          id="parentName"
          placeholder="Jūsu vārds"
          value={form.parentName}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefons *</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+371 2XXXXXXX"
          value={form.phone}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="email">E-pasts</Label>
        <Input
          id="email"
          type="email"
          placeholder="epasts@example.com"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="program">Programma</Label>
      <div>
  <Label htmlFor="program">Programma</Label>

  <select
    id="program"
    name="program"
    value={form.program}
    onChange={handleChange}
    className="w-full rounded-xl border border-gray-300 p-3"
  >
    <option value="">Izvēlies programmu</option>

    {programs.map((program) => (
      <option key={program.slug} value={program.slug}>
        {program.title}
      </option>
    ))}
  </select>
</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label htmlFor="childrenCount">Bērnu skaits</Label>
          <Input
            id="childrenCount"
            type="number"
            value={form.childrenCount}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="childAge">Bērna vecums</Label>
          <Input
            id="childAge"
            type="text"
            value={form.childAge}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="eventDate">Vēlamais datums</Label>
        <Input
          id="eventDate"
          type="date"
          value={form.eventDate}
          onChange={handleChange}
        />
      </div>
      {calculatedProgramPrice  && (
  <div className="rounded-xl bg-pink-50 border border-pink-200 p-5">
    <h3 className="font-semibold">
      Aptuvenā cena
    </h3>

    <p className="text-2xl font-bold">
      {calculatedProgramPrice} €
    </p>

    {form.location === "Izbraukums" && (
      <p className="text-sm mt-2">
        Cenā iekļauta 15 € izbraukuma piemaksa.
      </p>
    )}
  </div>
)}
<div>
  {form.location === "Smaidu Darbnīcā" && (
<div>
  <Label htmlFor="eventTime">Vēlamais laiks</Label>

  <select
    id="eventTime"
    value={form.eventTime}
    onChange={handleChange}
    className="w-full rounded-xl border border-gray-300 p-3"
  >
    <option value="">Izvēlies laiku</option>
    <option value="10:00">10:00</option>
    <option value="14:00">14:00</option>
    <option value="18:00">18:00</option>
  </select>
  </div>
)}
</div>

      <div>
        <Label htmlFor="message">Papildu informācija</Label>
        <Textarea
          id="message"
          rows={5}
          placeholder="Pastāstiet par ballīti..."
          value={form.message}
          onChange={handleChange}
        />
      </div>
<div className="rounded-2xl border bg-pink-50 p-5 space-y-3">
  <h3 className="text-lg font-bold">
    Rezervācijas kopsavilkums
  </h3>

  {form.program && (
    <div className="flex justify-between">
      <span>Programmas cena</span>
      <span>{calculatedProgramPrice} €</span>
    </div>
  )}

  {form.location === "Smaidu Darbnīcā" && form.eventDate && (
    <div className="flex justify-between">
      <span>Telpu noma</span>
      <span>{getVenuePrice()} €</span>
    </div>
  )}

  {form.location === "Izbraukums" && (
    <p className="text-sm text-gray-600">
    </p>
  )}

  <hr />

  <div className="flex justify-between text-xl font-bold">
    <span>Kopā</span>

    <span>
      {form.location === "Smaidu Darbnīcā"
        ? totalPrice
        : calculatedProgramPrice} €
    </span>
</div>
{form.location === "Izbraukums" && (
  <p className="mt-4 text-sm text-gray-600 border-t pt-4">
    <strong>NB!</strong> Papildu ceļa izdevumi ārpus Tukuma pilsētas
    tiks aprēķināti individuāli un precizēti, sazinoties ar Jums pēc
    rezervācijas saņemšanas.
  </p>
)}
</div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={
        loading ||
        (form.location === "Izbraukums" &&
        !form.acceptTravelFee)
        }
      >
        {loading ? "Nosūta..." : "Pieteikt ballīti"}
      </Button>
    </form>
  );
}