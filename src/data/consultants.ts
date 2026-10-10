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
