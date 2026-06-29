export interface MuseumConfig {
  museumId: string;
  name: string;
  coverImage: string;
  mapImage: string;
  marketplaceUrl: string;
  logistics: {
    exit: string;
    toilet: string;
    bar: string;
    shop: string;
    obstacles: string;
  };
}

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export interface VisitSummary {
  id: string;
  title: string;
  subtitle?: string;
  estimatedDuration?: string | number;
  targetAudience?: string;
}

export interface VisitStep {
  type: "logistics_intro" | "main_item" | "optional_item" | "transition";
  itemId?: string;
  artworkId?: string;
  description?: string;
  directionsFromPrevious?: string;
  mapCoords?: { x: number; y: number };
}

export interface Visit {
  id: string;
  title: string;
  description?: string;
  steps: VisitStep[];
}

export interface ArtworkItem {
  id: string;
  artworkId: string;
  title?: string;
  register?: string;
  artist?: string;
  style?: string;
  classification?: {
    languageRegister?: string;
  };
  content: {
    screenText?: string;
    ttsText?: string;
  };
}

export interface ListResponse<T> {
  data: T[];
  pagination?: unknown;
}
