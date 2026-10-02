import type { Client, GalleryImage, PageSeo, Service, TeamMember, Testimonial } from "./types";

/** Tukšas veidnes — izmanto kā noklusējumu rindu pārveidošanā un jaunu ierakstu formās. */

export const emptyService: Service = {
  slug: "",
  audience: "business",
  title: "",
  excerpt: "",
  intro: "",
  body: "",
  highlights: [],
  suitableFor: [],
  activities: [],
  pricing: [],
  pricingNote: "",
  faq: [],
  age: "",
  duration: "",
  participants: "",
  icon: "Sparkles",
  heroImage: "",
  albums: [],
  seasons: ["visu-gadu"],
  sort: 100,
  published: true,
  seoTitle: "",
  seoDescription: "",
};

export const emptyGalleryImage: GalleryImage = {
  src: "",
  alt: "",
  album: "",
  category: "uznemumu-pasakumi",
  width: null,
  height: null,
  blur: null,
  sort: 100,
  published: true,
};

export const emptyTestimonial: Testimonial = {
  author: "",
  role: "",
  company: "",
  text: "",
  logo: "",
  sort: 100,
  published: true,
};

export const emptyClient: Client = { name: "", logo: "", url: "", sort: 100, published: true };

export const emptyTeamMember: TeamMember = {
  name: "",
  role: "",
  bio: "",
  photo: "",
  sort: 100,
  published: true,
};

export const emptyPageSeo: PageSeo = { path: "", title: "", description: "", ogImage: "", noindex: false };
