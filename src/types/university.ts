export type University = {
  id: string;
  name: string;
  city: string;
  country: string;
  continent?: string;
  latitude: number;
  longitude: number;
  locationUrl: string;
  website: string;
  description: string;
  programs: string[];
  tuition: string;
  tuitionValue?: number;
  languages: string[];
  scholarships: string[];
};
