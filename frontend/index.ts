// ===== ROLES =====
export type Role = 'super_admin' | 'author' | 'visitor';

export type UserStatus = 'active' | 'invited' | 'suspended' | 'archived';
export type MuseumStatus = 'draft' | 'active' | 'archived';
export type ArtworkStatus = 'draft' | 'published' | 'archived';
export type ArtworkItemStatus = 'draft' | 'published';
export type VisitStatus = 'draft' | 'published' | 'archived';

export type LanguageRegister = 'infantile' | 'elementare' | 'medio' | 'avanzato' | 'specialistico';

/** Scala ordinata dei registri, dal più semplice al più specialistico. */
export const REGISTER_ORDER: LanguageRegister[] = ['infantile', 'elementare', 'medio', 'avanzato', 'specialistico'];
export type FruitionLength = '3s' | '15s' | '40s' | '1min' | '4min';
export type StepType = 'main_item' | 'optional_item' | 'logistics_intro' | 'transition';

// ===== OPENING HOURS =====
export interface OpeningHourEntry {
  day: string;
  openingHour: string;
  closingHour: string;
}

// ===== MUSEUM =====
export interface Museum {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  status: MuseumStatus;
  logo?: string;
  coverImage?: string;
  shortDescription: string;
  longDescription?: string;
  city: string;
  address: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours: OpeningHourEntry[];
  ticketInfo?: string;
  accessibilityNotes?: string;
  services: string[];
  internalNotes?: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  assignedCuratorIds: string[];
  // viewmodel
  itemsCount: number;
  visitsCount: number;
  publishedCount: number;
  updatedAt: string;
  createdAt: string;
}

// ===== BACKEND USER =====
export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatar?: string;
  role: Role;
  status: UserStatus;
  assignedMuseumIds: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ===== ARTWORK =====
export interface ArtworkAsset {
  type: 'image';
  source: string;
  description: string;
}

export interface ItemImage {
  id: string;
  source: string;
  caption?: string;
}

export interface Artwork {
  id: string;
  museumId: string;
  universalObjectId?: string;
  title: string;
  artist?: string;
  year?: string;
  category?: string;
  style?: string;
  materials: string[];
  dimensions?: { width?: number; height?: number; depth?: number; unit: string };
  description?: string;
  assets: ArtworkAsset[];
  tags: string[];
  status: ArtworkStatus;
  createdAt: string;
  updatedAt: string;
}

// ===== ARTWORK ITEM =====
export interface ArtworkItem {
  id: string;
  artworkId: string;
  classification: {
    fruitionLength: FruitionLength;
    targetDurationSeconds: number;
    languageCode: string;
    languageRegister: LanguageRegister;
  };
  content: {
    title?: string;
    rendering: {
      supportsScreen: boolean;
      supportsTTS: boolean;
    };
    screenText?: string;
    ttsText?: string;
  };
  images: ItemImage[];
  license?: string;
  isFree: boolean;
  price?: { value: number; currency: string };
  status: ArtworkItemStatus;
  creatorId: string;
  lastUpdaterId: string;
  createdAt: string;
  updatedAt: string;
}

// ===== VISIT =====
export interface VisitStep {
  id: string;
  type: StepType;
  /** Una tappa = un'opera: al massimo un ArtworkItem.id per registro linguistico. */
  itemsByRegister?: Partial<Record<LanguageRegister, string>>;
  title: string;
  description?: string;
  directionsFromPrevious?: string;
  order: number;
  mapCoords?: { x: number; y: number; floor?: number };
}

export interface Visit {
  id: string;
  museumId: string;
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  targetAudience?: string;
  coverImage?: string;
  estimatedDurationMinutes: number;
  estimatedDuration?: string; // viewmodel
  authorId: string;
  status: VisitStatus;
  steps: VisitStep[];
  createdAt: string;
  updatedAt: string;
}

// ===== ACTIVITY =====
export interface ActivityEntry {
  id: string;
  userId: string;
  action: string;
  entityType: 'museum' | 'artwork' | 'item' | 'visit' | 'user';
  entityId: string;
  entityName: string;
  museumId?: string;
  timestamp: string;
  details?: string;
}
