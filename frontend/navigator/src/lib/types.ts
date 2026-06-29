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
  estimatedDuration?: string;
  estimatedDurationMinutes?: number;
  targetAudience?: string;
}

export interface VisitStep {
  id: string;
  type: "logistics_intro" | "main_item" | "optional_item" | "transition";
  title?: string;
  itemId?: string;
  description?: string;
  directionsFromPrevious?: string;
  mapCoords?: { x: number; y: number; floor?: number };
  order?: number;
}

export interface Visit {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  estimatedDuration?: string;
  estimatedDurationMinutes?: number;
  targetAudience?: string;
  steps: VisitStep[];
}

export interface ArtworkItem {
  id: string;
  artworkId: string;
  classification?: {
    languageRegister?: string;
    fruitionLength?: string;
  };
  content: {
    title?: string;
    screenText?: string;
    ttsText?: string;
  };
}

export interface ListResponse<T> {
  data: T[];
  pagination?: unknown;
}
