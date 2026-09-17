import Image from "next/image";

type Props = {
  name: string;
  role: string;
  image: string;
  description: string;
};

export default function TeamMemberCard({
  name,
  role,
  image,
  description,
}: Props) {
  return (
    <article className="rounded-3xl bg-white shadow-lg overflow-hidden">
      <div className="relative h-80 w-full">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold">{name}</h3>
        <p className="text-pink-500">{role}</p>
        <p className="mt-4">{description}</p>
      </div>
    </article>
  );
}