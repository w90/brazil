export interface Listing {
  id: string;
  url: string;
  status: "active" | "removed";
  title: string;
  price?: number | null;
  previousPrice?: number | null;
  condoFee?: number | null;
  neighborhood?: string;
  city?: string;
  region?: string;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: string | null;
  parking?: number | null;
  suites?: number | null;
  summary?: string;
  features?: string[];
  description?: string;
  image?: string | null;
  imageCount?: number;
  seller?: string;
  isProfessional?: boolean;
  profile?: string;
  phone?: string;
  publishedAt?: number | null;
}

export interface ScoredListing extends Listing {
  qualityScore: number;
  valueScore: number;
  rating: number;
  pricePerSquareMeter: number | null;
  discountPercent: number | null;
  traits: string[];
  isSeasonalMention: boolean;
  isStale: boolean;
  isPriceWellAboveMedian: boolean;
}

export type ListingSortKey = "price" | "rating" | "quality";

export type ListingSortDirection = "asc" | "desc";

export interface ListingFilters {
  query: string;
  neighborhood: string;
  trait: string;
  sortKey: ListingSortKey;
  sortDirection: ListingSortDirection;
}
