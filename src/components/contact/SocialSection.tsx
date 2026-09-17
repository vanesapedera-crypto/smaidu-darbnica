import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";

export default function SocialSection() {
  return (
    <section className="relative flex h-full flex-col justify-center bg-[#FDF9EC] px-10 py-10">

      {/* Dekori */}

      <div className="absolute right-6 top-4 text-5xl">
        ☀️
      </div>

      <div className="absolute bottom-4 right-6 text-5xl">
        ✈️
      </div>

      <h2
        className="text-4xl font-semibold text-[#1B1B1B]"
        style={{ fontFamily: "cursive" }}
      >
        Radām smaidu kopā!
      </h2>

      <p className="mt-4 text-gray-700">
        Seko mums sociālajos tīklos
      </p>

      <div className="mt-8 flex gap-4">

        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B1B1B] text-white transition hover:scale-110"
        >
          <FaFacebookF size={22} />
        </a>

        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B1B1B] text-white transition hover:scale-110"
        >
          <FaInstagram size={22} />
        </a>

        <a
          href="https://tiktok.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B1B1B] text-white transition hover:scale-110"
        >
          <FaTiktok size={20} />
        </a>

      </div>
    </section>
  );
}