export type Consultant = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  badge: "Bronze Mentor" | "Silver Mentor" | "Gold Mentor" | "Verified Expert" | "Top Consultant";
  languages: string[];
  specialties: string[];
  countryExpertise: string[];
  price: string;
  bio: string;
};

export const consultants: Consultant[] = [
  {
    id: "maya-kovacs",
    name: "Maya Kovacs",
    avatar: "MK",
    rating: 4.9,
    badge: "Top Consultant",
    languages: ["English", "Hungarian", "German"],
    specialties: ["Scholarship guidance", "SOP review", "EU applications"],
    countryExpertise: ["Germany", "Austria", "Hungary"],
    price: "EUR 45 / session",
    bio: "Former admissions coordinator helping students build realistic Europe-focused university shortlists.",
  },
  {
    id: "samir-khan",
    name: "Samir Khan",
    avatar: "SK",
    rating: 4.8,
    badge: "Verified Expert",
    languages: ["English", "Urdu", "Hindi"],
    specialties: ["Visa guidance", "Country-specific advice", "Application support"],
    countryExpertise: ["Canada", "United Kingdom", "Australia"],
    price: "USD 55 / session",
    bio: "International education advisor specializing in English-taught programs and visa-ready documentation.",
  },
  {
    id: "elena-rossi",
    name: "Elena Rossi",
    avatar: "ER",
    rating: 4.7,
    badge: "Gold Mentor",
    languages: ["English", "Italian", "French"],
    specialties: ["Design schools", "Portfolio review", "Scholarship guidance"],
    countryExpertise: ["Italy", "France", "Spain"],
    price: "EUR 40 / session",
    bio: "Creative-program mentor for architecture, design, and arts applicants across Southern Europe.",
  },
];
