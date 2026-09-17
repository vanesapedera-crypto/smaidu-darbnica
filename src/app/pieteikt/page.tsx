import { Suspense } from "react";
import BookingForm from "@/components/contact/BookingForm";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold">
            Pieteikt ballīti
          </h1>

          <p className="mt-4 text-lg text-gray-600">
            Aizpildi formu un mēs ar Tevi sazināsimies.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-3xl bg-white p-8 shadow-lg">
              Ielādē formu...
            </div>
          }
        >
          <BookingForm />
        </Suspense>
      </div>
    </main>
  );
}