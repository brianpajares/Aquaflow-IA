/**
 * AquaFlow AI Types
 * Hydrogeological & Geophysical Intelligence Platform
 */

export enum IntendedUse {
  Riego = "riego",
  Domestico = "domestico",
  Ganaderia = "ganaderia",
  Industrial = "industrial",
  Inmobiliario = "inmobiliario"
}

export interface Parcel {
  id: string;
  name: string;
  coordinates: [number, number][]; // Polygon outer boundary [lat, lng]
  areaHa: number;
  intendedUse: IntendedUse;
  targetYieldLps: number;
  maxBudgetUsd: number;
  countryCode: string; // 'PE', 'US', etc.
  createdAt: string;
}

export interface FactorSubscore {
  factor: "geologia" | "lineamientos" | "twi" | "precip" | "ndvisecco" | "suelos" | "drenaje" | "pozos";
  label: string;
  subscore: number; // 0..1
  weight: number; // 0..1
  valueDescription: string; // e.g., "Aluvial permeable", "320m a drenaje"
  source: string; // e.g. "INGEMMET GEOCATMIN", "Copernicus GLO-30"
}

export interface CandidatePoint {
  id: string;
  rank: number;
  lat: number;
  lng: number;
  elevationM: number;
  gwpi: number; // 0..100
  confidence: number; // 0..1
  rationale: Record<string, number>; // contributor subscores
  subscores: FactorSubscore[];
  distances: {
    viasM: number;
    energiaM: number;
    viviendasM: number;
    riosM: number;
    anpM: number;
  };
}

export interface GeophysicalPlanItem {
  method: "ERT" | "VES" | "TEM" | "GPR";
  name: string;
  priority: "Alta" | "Media" | "Baja";
  recommendation: string;
  estimatedLines: number;
  estimatedCostUsd: number;
  description: string;
}

export interface WellDesign {
  aquiferType: "Libre" | "Confinado" | "Semi-confinado";
  staticLevelRange: { min: number; max: number; unit: string };
  depthPreRange: { min: number; max: number; unit: string };
  wellType: "Excavado" | "Tubular / Perforado" | "Mixto";
  yieldRangeLps: { min: number; max: number };
  casingDiameterInches: number;
  gravelPackRequired: boolean;
  testPlan: string[];
  permitsChecklist: string[];
}

export interface WellOutcome {
  id: string;
  parcelId: string;
  pointId: string;
  drilledLat: number;
  drilledLng: number;
  drilledDepthM: number;
  staticLevelM: number;
  dynamicLevelM: number;
  measuredYieldLps: number;
  waterQuality: {
    ph: number;
    conductivityUsCm: number;
    turbidityNtu: number;
    isPotable: boolean;
  };
  success: boolean;
  reportedBy: string;
  createdAt: string;
}

export interface AnalysisResult {
  id: string;
  parcelId: string;
  status: "queued" | "running" | "done" | "error";
  scoringProfileName: string;
  gwpiMean: number;
  gwpiMax: number;
  confidence: number; // 0..1
  points: CandidatePoint[];
  geophysicalPlan: GeophysicalPlanItem[];
  wellDesign: WellDesign;
  provenance: { layer: string; source: string; retrievedAt: string; resolution: string }[];
  createdAt: string;
  finishedAt?: string;
  pdfUrl?: string;
}

export interface Provider {
  id: string;
  name: string;
  services: string[];
  regions: string[];
  rating: number;
  contactEmail: string;
  contactPhone: string;
  priceEstimateUsd: number;
  logoUrl?: string;
}

export interface Lead {
  id: string;
  analysisId: string;
  pointId: string;
  providerId: string;
  status: "new" | "contacted" | "quoted" | "won" | "lost";
  createdAt: string;
}
