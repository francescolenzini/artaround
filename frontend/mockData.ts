import type { Museum, BackendUser, Artwork, ArtworkItem, Visit, ActivityEntry } from '@/types';

export const museums: Museum[] = [
  {
    id: 'mus-1',
    name: 'Museo Civico Archeologico',
    shortName: 'MCA',
    slug: 'museo-civico-archeologico',
    status: 'active',
    shortDescription: 'One of the most important archaeological collections in Italy, featuring Egyptian, Etruscan, and Roman artifacts.',
    longDescription: 'The Museo Civico Archeologico houses an extraordinary collection spanning ancient civilizations.',
    city: 'Bologna',
    address: "Via dell'Archiginnasio 2",
    postalCode: '40124',
    country: 'Italy',
    phone: '+39 051 275 7211',
    email: 'info@museocivico.bo.it',
    website: 'https://www.museibologna.it/archeologico',
    openingHours: [
      { day: 'Monday', openingHour: '-', closingHour: '-' },
      { day: 'Tuesday', openingHour: '10:00', closingHour: '18:30' },
      { day: 'Wednesday', openingHour: '10:00', closingHour: '18:30' },
      { day: 'Thursday', openingHour: '10:00', closingHour: '18:30' },
      { day: 'Friday', openingHour: '10:00', closingHour: '18:30' },
      { day: 'Saturday', openingHour: '10:00', closingHour: '18:30' },
      { day: 'Sunday', openingHour: '10:00', closingHour: '18:30' },
    ],
    ticketInfo: '€6 full, €3 reduced',
    accessibilityNotes: 'Wheelchair accessible ground floor, elevator to upper floors',
    services: ['toilets', 'shop', 'elevator', 'cloakroom'],
    defaultLanguage: 'it',
    supportedLanguages: ['it', 'en', 'fr', 'de'],
    assignedCuratorIds: ['usr-2', 'usr-3'],
    itemsCount: 142,
    visitsCount: 8,
    publishedCount: 98,
    updatedAt: '2026-04-02T14:30:00Z',
    createdAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'mus-2',
    name: 'Pinacoteca Nazionale',
    shortName: 'PN',
    slug: 'pinacoteca-nazionale',
    status: 'active',
    shortDescription: 'The National Gallery houses masterpieces of Italian painting from the 13th to 18th century.',
    city: 'Bologna',
    address: 'Via delle Belle Arti 56',
    postalCode: '40126',
    country: 'Italy',
    phone: '+39 051 420 9411',
    email: 'info@pinacoteca.bo.it',
    website: 'https://www.pinacotecabologna.beniculturali.it',
    openingHours: [
      { day: 'Monday', openingHour: '-', closingHour: '-' },
      { day: 'Tuesday', openingHour: '08:30', closingHour: '19:30' },
      { day: 'Wednesday', openingHour: '08:30', closingHour: '19:30' },
      { day: 'Thursday', openingHour: '08:30', closingHour: '19:30' },
      { day: 'Friday', openingHour: '08:30', closingHour: '19:30' },
      { day: 'Saturday', openingHour: '08:30', closingHour: '19:30' },
      { day: 'Sunday', openingHour: '08:30', closingHour: '19:30' },
    ],
    ticketInfo: '€8 full, €4 reduced',
    services: ['toilets', 'bar', 'shop', 'elevator', 'cloakroom'],
    defaultLanguage: 'it',
    supportedLanguages: ['it', 'en'],
    assignedCuratorIds: ['usr-3'],
    itemsCount: 87,
    visitsCount: 5,
    publishedCount: 61,
    updatedAt: '2026-03-28T09:15:00Z',
    createdAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'mus-3',
    name: "Museo d'Arte Moderna",
    shortName: 'MAMbo',
    slug: 'mambo',
    status: 'draft',
    shortDescription: "Bologna's museum of modern and contemporary art, housed in the former city bakery.",
    city: 'Bologna',
    address: 'Via Don Minzoni 14',
    postalCode: '40121',
    country: 'Italy',
    openingHours: [
      { day: 'Monday', openingHour: '-', closingHour: '-' },
      { day: 'Tuesday', openingHour: '10:00', closingHour: '18:00' },
      { day: 'Wednesday', openingHour: '10:00', closingHour: '18:00' },
      { day: 'Thursday', openingHour: '10:00', closingHour: '18:00' },
      { day: 'Friday', openingHour: '10:00', closingHour: '18:00' },
      { day: 'Saturday', openingHour: '10:00', closingHour: '18:00' },
      { day: 'Sunday', openingHour: '10:00', closingHour: '18:00' },
    ],
    services: ['toilets', 'bar', 'shop'],
    defaultLanguage: 'it',
    supportedLanguages: ['it', 'en'],
    assignedCuratorIds: ['usr-4'],
    itemsCount: 23,
    visitsCount: 1,
    publishedCount: 5,
    updatedAt: '2026-03-15T16:45:00Z',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'mus-4',
    name: 'Galleria degli Uffizi',
    shortName: 'Uffizi',
    slug: 'galleria-uffizi',
    status: 'active',
    shortDescription: "One of the world's most famous art museums, home to priceless Renaissance masterpieces.",
    city: 'Firenze',
    address: 'Piazzale degli Uffizi 6',
    postalCode: '50122',
    country: 'Italy',
    phone: '+39 055 294 883',
    email: 'info@uffizi.it',
    website: 'https://www.uffizi.it',
    openingHours: [
      { day: 'Monday', openingHour: '-', closingHour: '-' },
      { day: 'Tuesday', openingHour: '08:15', closingHour: '18:50' },
      { day: 'Wednesday', openingHour: '08:15', closingHour: '18:50' },
      { day: 'Thursday', openingHour: '08:15', closingHour: '18:50' },
      { day: 'Friday', openingHour: '08:15', closingHour: '18:50' },
      { day: 'Saturday', openingHour: '08:15', closingHour: '18:50' },
      { day: 'Sunday', openingHour: '08:15', closingHour: '18:50' },
    ],
    ticketInfo: '€20 full, €2 reduced',
    services: ['toilets', 'bar', 'shop', 'elevator', 'cloakroom', 'accessibility'],
    defaultLanguage: 'it',
    supportedLanguages: ['it', 'en', 'fr', 'de', 'es', 'ja', 'zh'],
    assignedCuratorIds: [],
    itemsCount: 312,
    visitsCount: 15,
    publishedCount: 245,
    updatedAt: '2026-04-01T11:00:00Z',
    createdAt: '2025-03-01T10:00:00Z',
  },
];

export const users: BackendUser[] = [
  {
    id: 'usr-1', fullName: 'Alessandro Rossi', email: 'a.rossi@artaround.com', username: 'arossi',
    role: 'super_admin', status: 'active', assignedMuseumIds: [],
    lastLogin: '2026-04-04T08:30:00Z', createdAt: '2025-01-01T10:00:00Z', updatedAt: '2026-04-04T08:30:00Z',
  },
  {
    id: 'usr-2', fullName: 'Maria Bianchi', email: 'm.bianchi@museocivico.it', username: 'mbianchi',
    role: 'author', status: 'active', assignedMuseumIds: ['mus-1'],
    lastLogin: '2026-04-03T15:20:00Z', createdAt: '2025-06-20T10:00:00Z', updatedAt: '2026-04-03T15:20:00Z',
  },
  {
    id: 'usr-3', fullName: 'Luca Verdi', email: 'l.verdi@artaround.com', username: 'lverdi',
    role: 'author', status: 'active', assignedMuseumIds: ['mus-1', 'mus-2'],
    lastLogin: '2026-04-02T11:45:00Z', createdAt: '2025-07-15T10:00:00Z', updatedAt: '2026-04-02T11:45:00Z',
    notes: 'Senior curator, manages both archaeological and fine arts collections.',
  },
  {
    id: 'usr-4', fullName: 'Francesca Neri', email: 'f.neri@mambo.bo.it', username: 'fneri',
    role: 'author', status: 'active', assignedMuseumIds: ['mus-3'],
    lastLogin: '2026-03-28T09:00:00Z', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-28T09:00:00Z',
  },
  {
    id: 'usr-5', fullName: 'Giorgio Colombo', email: 'g.colombo@artaround.com', username: 'gcolombo',
    role: 'author', status: 'suspended', assignedMuseumIds: ['mus-1'],
    lastLogin: '2026-02-10T14:00:00Z', createdAt: '2025-09-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z',
    notes: 'Suspended due to contract review.',
  },
];

// ===== ARTWORKS =====
export const artworks: Artwork[] = [
  {
    id: 'art-1', museumId: 'mus-1', universalObjectId: 'UO-MCA-001',
    title: 'Situla della Certosa', artist: undefined, year: '6th century BC',
    category: 'Metalwork', style: 'Etruscan',
    materials: ['bronze'], dimensions: { height: 32, unit: 'cm' },
    description: 'Masterpiece of Etruscan metalwork discovered in the Certosa necropolis of Bologna.',
    assets: [{ type: 'image', source: '', description: 'Main view' }],
    tags: ['etruscan', 'bronze', 'situla', 'necropolis'],
    status: 'published',
    createdAt: '2025-08-10T10:00:00Z', updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'art-2', museumId: 'mus-1', universalObjectId: 'UO-MCA-002',
    title: 'Mummia di Usai', artist: undefined, year: '7th century BC',
    category: 'Archaeology', style: 'Egyptian',
    materials: ['linen', 'wood', 'pigments'],
    description: 'Egyptian mummy and sarcophagus of Usai, an official from the 26th Dynasty.',
    assets: [], tags: ['egyptian', 'mummy', 'sarcophagus'],
    status: 'published',
    createdAt: '2025-09-05T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'art-3', museumId: 'mus-1', universalObjectId: 'UO-MCA-003',
    title: 'Mosaico pavimentale romano', artist: undefined, year: '2nd century AD',
    category: 'Archaeology', style: 'Roman',
    materials: ['stone', 'marble'],
    description: 'Floor mosaic from a Roman house in ancient Bononia with geometric patterns.',
    assets: [], tags: ['roman', 'mosaic', 'floor'],
    status: 'draft',
    createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'art-4', museumId: 'mus-2', universalObjectId: 'UO-PN-001',
    title: 'Madonna di San Luca', artist: 'Unknown (Byzantine school)', year: '12th century',
    category: 'Painting', style: 'Byzantine',
    materials: ['tempera', 'wood panel'],
    description: "One of Bologna's most revered paintings, attributed to the Byzantine tradition.",
    assets: [], tags: ['painting', 'madonna', 'medieval', 'byzantine'],
    status: 'published',
    createdAt: '2025-10-01T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'art-5', museumId: 'mus-2', universalObjectId: 'UO-PN-002',
    title: 'Estasi di Santa Cecilia', artist: 'Raphael', year: '1516',
    category: 'Painting', style: 'Renaissance',
    materials: ['oil', 'canvas'],
    description: "Raphael's masterpiece depicting Saint Cecilia in divine rapture.",
    assets: [], tags: ['raphael', 'renaissance', 'painting'],
    status: 'published',
    createdAt: '2025-10-15T10:00:00Z', updatedAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'art-6', museumId: 'mus-3', universalObjectId: 'UO-MAM-001',
    title: 'Natura Morta 1956', artist: 'Giorgio Morandi', year: '1956',
    category: 'Painting', style: 'Modern',
    materials: ['oil', 'canvas'],
    description: "Morandi's characteristic still life with muted palette and geometric simplification.",
    assets: [], tags: ['morandi', 'still life', 'modern'],
    status: 'draft',
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-15T10:00:00Z',
  },
  {
    id: 'art-7', museumId: 'mus-4', universalObjectId: 'UO-UFF-001',
    title: 'La nascita di Venere', artist: 'Sandro Botticelli', year: '1485',
    category: 'Painting', style: 'Renaissance',
    materials: ['tempera', 'canvas'],
    description: 'Iconic Renaissance painting depicting the goddess Venus emerging from the sea.',
    assets: [], tags: ['botticelli', 'renaissance', 'painting', 'mythology'],
    status: 'published',
    createdAt: '2025-05-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z',
  },
];

// ===== ARTWORK ITEMS =====
export const artworkItems: ArtworkItem[] = [
  // art-1: Situla della Certosa
  {
    id: 'i-1', artworkId: 'art-1',
    classification: { fruitionLength: '15s', targetDurationSeconds: 15, languageCode: 'it', languageRegister: 'elementare' },
    content: { title: 'La Situla - versione semplice', rendering: { supportsScreen: true, supportsTTS: true }, screenText: 'This bronze bucket was made by the Etruscans over 2500 years ago. It shows scenes of daily life and celebrations.', ttsText: 'This bronze bucket was made by the Etruscans over 2500 years ago.' },
    images: [{ id: 'img-i1-1', source: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=400', caption: 'Dettaglio fregio superiore' }],
    license: 'CC BY-NC 4.0', isFree: true, status: 'published',
    creatorId: 'usr-2', lastUpdaterId: 'usr-2',
    createdAt: '2025-08-10T10:00:00Z', updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'i-2', artworkId: 'art-1',
    classification: { fruitionLength: '1min', targetDurationSeconds: 60, languageCode: 'it', languageRegister: 'medio' },
    content: { title: 'Situla della Certosa', rendering: { supportsScreen: true, supportsTTS: true }, screenText: 'The Situla della Certosa is a masterpiece of Etruscan metalwork dating to the 6th century BC. Discovered in the Certosa necropolis of Bologna, it features intricate narrative friezes depicting processions, banquets, and athletic competitions.' },
    images: [
      { id: 'img-i2-1', source: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=400', caption: 'Vista frontale della situla' },
      { id: 'img-i2-2', source: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=400', caption: 'Scena di banchetto dal secondo registro' },
    ],
    license: 'CC BY-NC 4.0', isFree: true, status: 'published',
    creatorId: 'usr-2', lastUpdaterId: 'usr-2',
    createdAt: '2025-08-12T10:00:00Z', updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'i-3', artworkId: 'art-1',
    classification: { fruitionLength: '4min', targetDurationSeconds: 240, languageCode: 'it', languageRegister: 'avanzato' },
    content: { title: 'Situla della Certosa - analisi approfondita', rendering: { supportsScreen: true, supportsTTS: true }, screenText: "This remarkable bronze situla represents the pinnacle of the Situla Art tradition that flourished in the Po Valley region. The vessel's three registers of figured decoration employ a sophisticated visual language that bridges Etruscan and Venetic artistic traditions." },
    images: [
      { id: 'img-i3-1', source: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=400', caption: 'Analisi dei tre registri figurativi' },
      { id: 'img-i3-2', source: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=400', caption: 'Confronto stilistico con arte venetica' },
      { id: 'img-i3-3', source: 'https://images.unsplash.com/photo-1569587112025-0d460e81a126?w=400', caption: 'Dettaglio tecnica di lavorazione a sbalzo' },
    ],
    license: 'CC BY-NC 4.0', isFree: false, price: { value: 2.50, currency: 'eur' }, status: 'published',
    creatorId: 'usr-2', lastUpdaterId: 'usr-2',
    createdAt: '2025-08-15T10:00:00Z', updatedAt: '2026-03-20T14:00:00Z',
  },
  // art-2: Mummia di Usai
  {
    id: 'i-4', artworkId: 'art-2',
    classification: { fruitionLength: '15s', targetDurationSeconds: 15, languageCode: 'it', languageRegister: 'infantile' },
    content: { title: 'La Mummia!', rendering: { supportsScreen: true, supportsTTS: true }, screenText: 'This is a real mummy from Egypt! The person was called Usai and lived thousands of years ago.' },
    images: [{ id: 'img-i4-1', source: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400', caption: 'Il sarcofago decorato' }],
    license: 'CC BY-NC 4.0', isFree: true, status: 'published',
    creatorId: 'usr-3', lastUpdaterId: 'usr-3',
    createdAt: '2025-09-05T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'i-5', artworkId: 'art-2',
    classification: { fruitionLength: '40s', targetDurationSeconds: 40, languageCode: 'it', languageRegister: 'elementare' },
    content: { title: 'Mummia di Usai', rendering: { supportsScreen: true, supportsTTS: true }, screenText: 'Usai was an Egyptian official who lived around 650 BC. After he died, his body was preserved through mummification. His decorated coffin tells us about his life and beliefs.' },
    images: [],
    license: 'CC BY-NC 4.0', isFree: true, status: 'published',
    creatorId: 'usr-3', lastUpdaterId: 'usr-3',
    createdAt: '2025-09-06T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
  },
  // art-3: Mosaico romano (draft artwork, 1 item)
  {
    id: 'i-6', artworkId: 'art-3',
    classification: { fruitionLength: '15s', targetDurationSeconds: 15, languageCode: 'it', languageRegister: 'elementare' },
    content: { title: 'Mosaico romano', rendering: { supportsScreen: true, supportsTTS: false }, screenText: 'This beautiful floor mosaic comes from a Roman house in ancient Bononia. Its geometric patterns show the skill of Roman craftsmen.' },
    images: [],
    isFree: true, status: 'draft',
    creatorId: 'usr-2', lastUpdaterId: 'usr-2',
    createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z',
  },
  // art-4: Madonna di San Luca
  {
    id: 'i-7', artworkId: 'art-4',
    classification: { fruitionLength: '1min', targetDurationSeconds: 60, languageCode: 'it', languageRegister: 'medio' },
    content: { title: 'Madonna di San Luca', rendering: { supportsScreen: true, supportsTTS: true }, screenText: "This iconic image of the Virgin Mary is one of Bologna's most revered paintings. Attributed to the Byzantine tradition, it has been venerated for centuries." },
    images: [{ id: 'img-i7-1', source: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400', caption: 'Dettaglio del volto della Vergine' }],
    license: 'Commercial', isFree: false, price: { value: 2.50, currency: 'eur' }, status: 'published',
    creatorId: 'usr-3', lastUpdaterId: 'usr-3',
    createdAt: '2025-10-01T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'i-8', artworkId: 'art-4',
    classification: { fruitionLength: '4min', targetDurationSeconds: 240, languageCode: 'it', languageRegister: 'avanzato' },
    content: { title: 'Madonna di San Luca - Studio approfondito', rendering: { supportsScreen: true, supportsTTS: true }, screenText: "The Madonna di San Luca represents a crucial intersection of Byzantine iconographic tradition and Western devotional practice. The panel's provenance and attribution history reflect centuries of religious and artistic discourse." },
    images: [],
    license: 'Commercial', isFree: false, price: { value: 3.50, currency: 'eur' }, status: 'published',
    creatorId: 'usr-3', lastUpdaterId: 'usr-3',
    createdAt: '2025-10-02T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z',
  },
  // art-5: Estasi di Santa Cecilia
  {
    id: 'i-9', artworkId: 'art-5',
    classification: { fruitionLength: '15s', targetDurationSeconds: 15, languageCode: 'it', languageRegister: 'elementare' },
    content: { title: 'Santa Cecilia di Raffaello', rendering: { supportsScreen: true, supportsTTS: true }, screenText: 'This painting by Raphael shows Saint Cecilia listening to heavenly music while earthly instruments lie broken at her feet.' },
    images: [],
    license: 'CC BY-NC 4.0', isFree: true, status: 'published',
    creatorId: 'usr-3', lastUpdaterId: 'usr-3',
    createdAt: '2025-10-15T10:00:00Z', updatedAt: '2026-03-05T10:00:00Z',
  },
  {
    id: 'i-10', artworkId: 'art-5',
    classification: { fruitionLength: '1min', targetDurationSeconds: 60, languageCode: 'it', languageRegister: 'medio' },
    content: { title: 'Estasi di Santa Cecilia', rendering: { supportsScreen: true, supportsTTS: true }, screenText: "Raphael's Ecstasy of Saint Cecilia, painted around 1516, depicts the patron saint of music in a moment of divine rapture. The masterful composition juxtaposes heavenly and earthly realms through music as metaphor." },
    images: [],
    license: 'CC BY-NC 4.0', isFree: true, status: 'published',
    creatorId: 'usr-3', lastUpdaterId: 'usr-3',
    createdAt: '2025-10-16T10:00:00Z', updatedAt: '2026-03-05T10:00:00Z',
  },
  // art-6: Morandi (draft artwork)
  {
    id: 'i-11', artworkId: 'art-6',
    classification: { fruitionLength: '40s', targetDurationSeconds: 40, languageCode: 'it', languageRegister: 'medio' },
    content: { title: 'Natura Morta di Morandi', rendering: { supportsScreen: true, supportsTTS: true }, screenText: "Giorgio Morandi's still life paintings are meditations on form, light, and the passage of time. This 1956 work shows his characteristic muted palette and geometric simplification of everyday objects." },
    images: [],
    isFree: true, status: 'draft',
    creatorId: 'usr-4', lastUpdaterId: 'usr-4',
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-15T10:00:00Z',
  },
  // art-7: Nascita di Venere
  {
    id: 'i-12', artworkId: 'art-7',
    classification: { fruitionLength: '1min', targetDurationSeconds: 60, languageCode: 'it', languageRegister: 'medio' },
    content: { title: 'La Nascita di Venere', rendering: { supportsScreen: true, supportsTTS: true }, screenText: "Botticelli's Birth of Venus is one of the most iconic paintings of the Renaissance. Commissioned by the Medici family, it depicts the goddess Venus emerging from the sea as a fully grown woman." },
    images: [{ id: 'img-i12-1', source: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400', caption: 'Dettaglio della figura di Venere' }],
    license: 'Commercial', isFree: false, price: { value: 3.99, currency: 'eur' }, status: 'published',
    creatorId: 'usr-1', lastUpdaterId: 'usr-1',
    createdAt: '2025-05-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z',
  },
];

export const visits: Visit[] = [
  {
    id: 'vis-1', museumId: 'mus-1', title: 'Highlights of Ancient Bologna',
    subtitle: 'A journey through Etruscan and Roman civilization',
    targetAudience: 'General public', estimatedDurationMinutes: 45, estimatedDuration: '45 min',
    authorId: 'usr-2', status: 'published',
    steps: [
      { id: 'vs-1', type: 'logistics_intro', title: 'Welcome & Orientation', description: 'Meet at the entrance hall. Collect audio guide.', order: 0 },
      { id: 'vs-2', type: 'main_item', itemsByRegister: { elementare: 'i-1', medio: 'i-2', avanzato: 'i-3' }, title: 'The Etruscan Situla', order: 1 },
      { id: 'vs-3', type: 'transition', title: 'Move to Egyptian Gallery', description: 'Take the stairs to the first floor, turn right.', order: 2 },
      { id: 'vs-4', type: 'main_item', itemsByRegister: { infantile: 'i-4', elementare: 'i-5' }, title: 'Egyptian Mummy of Usai', order: 3 },
      { id: 'vs-5', type: 'optional_item', itemsByRegister: { elementare: 'i-6' }, title: 'Roman Mosaic Floor', order: 4 },
    ],
    createdAt: '2025-09-15T10:00:00Z', updatedAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'vis-2', museumId: 'mus-1', title: "Kids' Adventure in the Museum",
    targetAudience: 'Children 6-12', estimatedDurationMinutes: 30, estimatedDuration: '30 min',
    authorId: 'usr-3', status: 'published',
    steps: [
      { id: 'vs-6', type: 'logistics_intro', title: 'Welcome little explorers!', description: 'Grab your explorer map at the desk.', order: 0 },
      { id: 'vs-7', type: 'main_item', itemsByRegister: { infantile: 'i-4', elementare: 'i-5' }, title: 'Meet the Mummy!', order: 1 },
      { id: 'vs-8', type: 'main_item', itemsByRegister: { elementare: 'i-1', medio: 'i-2', avanzato: 'i-3' }, title: 'A Very Old Bucket', order: 2 },
    ],
    createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'vis-3', museumId: 'mus-1', title: 'Deep Dive: Etruscan Civilization',
    targetAudience: 'Specialists', estimatedDurationMinutes: 90, estimatedDuration: '90 min',
    authorId: 'usr-2', status: 'draft',
    steps: [
      { id: 'vs-9', type: 'logistics_intro', title: 'Introduction', order: 0 },
      { id: 'vs-10', type: 'main_item', itemsByRegister: { elementare: 'i-1', medio: 'i-2', avanzato: 'i-3' }, title: 'The Etruscan Situla (Extended)', order: 1 },
    ],
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'vis-4', museumId: 'mus-2', title: 'Masterpieces of the Pinacoteca',
    targetAudience: 'Art enthusiasts', estimatedDurationMinutes: 60, estimatedDuration: '60 min',
    authorId: 'usr-3', status: 'published',
    steps: [
      { id: 'vs-11', type: 'logistics_intro', title: 'Welcome', order: 0 },
      { id: 'vs-12', type: 'main_item', itemsByRegister: { medio: 'i-7', avanzato: 'i-8' }, title: 'San Luca Madonna', order: 1 },
      { id: 'vs-13', type: 'transition', title: 'Walk to Room 15', order: 2 },
      { id: 'vs-14', type: 'main_item', itemsByRegister: { elementare: 'i-9', medio: 'i-10' }, title: "Raphael's Ecstasy", order: 3 },
    ],
    createdAt: '2025-12-01T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'vis-5', museumId: 'mus-3', title: 'Morandi and Beyond',
    targetAudience: 'General public', estimatedDurationMinutes: 40, estimatedDuration: '40 min',
    authorId: 'usr-4', status: 'draft',
    steps: [
      { id: 'vs-15', type: 'logistics_intro', title: 'Welcome to MAMbo', order: 0 },
      { id: 'vs-16', type: 'main_item', itemsByRegister: { medio: 'i-11' }, title: "Morandi's Still Life", order: 1 },
    ],
    createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-03-15T10:00:00Z',
  },
];

export const activities: ActivityEntry[] = [
  { id: 'act-1', userId: 'usr-2', action: 'Published artwork', entityType: 'artwork', entityId: 'art-1', entityName: 'Situla della Certosa', museumId: 'mus-1', timestamp: '2026-04-03T16:00:00Z' },
  { id: 'act-2', userId: 'usr-3', action: 'Created visit', entityType: 'visit', entityId: 'vis-4', entityName: 'Masterpieces of the Pinacoteca', museumId: 'mus-2', timestamp: '2026-04-03T14:30:00Z' },
  { id: 'act-3', userId: 'usr-1', action: 'Suspended user', entityType: 'user', entityId: 'usr-5', entityName: 'Giorgio Colombo', timestamp: '2026-04-02T11:00:00Z' },
  { id: 'act-4', userId: 'usr-4', action: 'Updated museum profile', entityType: 'museum', entityId: 'mus-3', entityName: 'MAMbo', museumId: 'mus-3', timestamp: '2026-04-01T15:30:00Z' },
  { id: 'act-5', userId: 'usr-3', action: 'Added item to artwork', entityType: 'item', entityId: 'i-10', entityName: 'Estasi di Santa Cecilia', museumId: 'mus-2', timestamp: '2026-03-30T10:00:00Z' },
  { id: 'act-6', userId: 'usr-1', action: 'Added museum', entityType: 'museum', entityId: 'mus-4', entityName: 'Galleria degli Uffizi', timestamp: '2026-03-28T09:00:00Z' },
  { id: 'act-7', userId: 'usr-2', action: 'Updated visit steps', entityType: 'visit', entityId: 'vis-1', entityName: 'Highlights of Ancient Bologna', museumId: 'mus-1', timestamp: '2026-03-27T14:00:00Z' },
  { id: 'act-8', userId: 'usr-1', action: 'Assigned curator', entityType: 'user', entityId: 'usr-4', entityName: 'Francesca Neri → MAMbo', timestamp: '2026-03-25T11:00:00Z' },
];

// ===== Lookup helpers =====
export function getMuseumById(id: string) { return museums.find(m => m.id === id); }
export function getUserById(id: string) { return users.find(u => u.id === id); }
export function getArtworkById(id: string) { return artworks.find(a => a.id === id); }
export function getArtworksByMuseum(museumId: string) { return artworks.filter(a => a.museumId === museumId); }
export function getItemsByArtwork(artworkId: string) { return artworkItems.filter(i => i.artworkId === artworkId); }
export function getItemById(id: string) { return artworkItems.find(i => i.id === id); }
export function getVisitsByMuseum(museumId: string) { return visits.filter(v => v.museumId === museumId); }
export function getMuseumsForUser(user: BackendUser) {
  if (user.role === 'super_admin') return museums;
  return museums.filter(m => user.assignedMuseumIds.includes(m.id));
}

// ===== Museum CRUD =====
let museumIdCounter = museums.length + 1;
export function addMuseum(data: Omit<Museum, 'id' | 'itemsCount' | 'visitsCount' | 'publishedCount' | 'createdAt' | 'updatedAt'>): Museum {
  const now = new Date().toISOString();
  const museum: Museum = { ...data, id: `mus-${museumIdCounter++}`, itemsCount: 0, visitsCount: 0, publishedCount: 0, createdAt: now, updatedAt: now };
  museums.push(museum);
  return museum;
}
export function updateMuseum(id: string, data: Partial<Museum>): Museum | null {
  const idx = museums.findIndex(m => m.id === id);
  if (idx === -1) return null;
  museums[idx] = { ...museums[idx], ...data, updatedAt: new Date().toISOString() };
  return museums[idx];
}
export function deleteMuseum(id: string): boolean {
  const idx = museums.findIndex(m => m.id === id);
  if (idx === -1) return false;
  museums.splice(idx, 1);
  return true;
}

// ===== User CRUD =====
let userIdCounter = users.length + 1;
export function addUser(data: Omit<BackendUser, 'id' | 'createdAt' | 'updatedAt'>): BackendUser {
  const now = new Date().toISOString();
  const user: BackendUser = { ...data, id: `usr-${userIdCounter++}`, createdAt: now, updatedAt: now };
  users.push(user);
  return user;
}
export function updateUser(id: string, data: Partial<BackendUser>): BackendUser | null {
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
  return users[idx];
}

// ===== Artwork CRUD =====
let artworkIdCounter = artworks.length + 1;
export function addArtwork(data: Omit<Artwork, 'id' | 'createdAt' | 'updatedAt'>): Artwork {
  const now = new Date().toISOString();
  const artwork: Artwork = { ...data, id: `art-${artworkIdCounter++}`, createdAt: now, updatedAt: now };
  artworks.push(artwork);
  return artwork;
}
export function updateArtwork(id: string, data: Partial<Artwork>): Artwork | null {
  const idx = artworks.findIndex(a => a.id === id);
  if (idx === -1) return null;
  artworks[idx] = { ...artworks[idx], ...data, updatedAt: new Date().toISOString() };
  return artworks[idx];
}
export function deleteArtwork(id: string): boolean {
  const idx = artworks.findIndex(a => a.id === id);
  if (idx === -1) return false;
  artworks.splice(idx, 1);
  // cascade delete items
  for (let i = artworkItems.length - 1; i >= 0; i--) {
    if (artworkItems[i].artworkId === id) artworkItems.splice(i, 1);
  }
  return true;
}
export function publishArtwork(id: string): boolean {
  const artwork = artworks.find(a => a.id === id);
  if (!artwork) return false;
  const items = getItemsByArtwork(id);
  if (items.length === 0) return false;
  artwork.status = 'published';
  artwork.updatedAt = new Date().toISOString();
  return true;
}

// ===== ArtworkItem CRUD =====
let itemIdCounter = artworkItems.length + 1;
export function addArtworkItem(data: Omit<ArtworkItem, 'id' | 'createdAt' | 'updatedAt'>): ArtworkItem {
  const now = new Date().toISOString();
  const item: ArtworkItem = { ...data, id: `i-${itemIdCounter++}`, createdAt: now, updatedAt: now };
  artworkItems.push(item);
  return item;
}
export function updateArtworkItem(id: string, data: Partial<ArtworkItem>): ArtworkItem | null {
  const idx = artworkItems.findIndex(i => i.id === id);
  if (idx === -1) return null;
  artworkItems[idx] = { ...artworkItems[idx], ...data, updatedAt: new Date().toISOString() };
  return artworkItems[idx];
}
export function deleteArtworkItem(id: string): boolean {
  const idx = artworkItems.findIndex(i => i.id === id);
  if (idx === -1) return false;
  artworkItems.splice(idx, 1);
  return true;
}
