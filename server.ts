import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Shared In-Memory Database (persisted to a local JSON file for session resilience)
const DB_FILE = path.join(process.cwd(), "data_session.json");

interface LocalDB {
  parcels: any[];
  analyses: any[];
  outcomes: any[];
  leads: any[];
  providers: any[];
}

const DEFAULT_PROVIDERS = [
  {
    id: "p1",
    name: "Geofísica del Sur S.A.C.",
    services: ["Tomografía Eléctrica (ERT)", "Sondeo Eléctrico Vertical (SEV)", "Magnetometría"],
    regions: ["Arequipa", "Moquegua", "Tacna", "Lima"],
    rating: 4.8,
    contactEmail: "contacto@geofisicadelsur.pe",
    contactPhone: "+51 987 654 321",
    priceEstimateUsd: 1200,
  },
  {
    id: "p2",
    name: "Perforaciones HidroAndinas S.A.",
    services: ["Perforación Tubular", "Perforación Rotatoria", "Mantenimiento de Pozos", "Pruebas de Bombeo"],
    regions: ["Lima", "Ica", "Ancash", "La Libertad"],
    rating: 4.9,
    contactEmail: "proyectos@hidroandinas.pe",
    contactPhone: "+51 945 876 123",
    priceEstimateUsd: 4500,
  },
  {
    id: "p3",
    name: "GeoGeo Global Tech B2B",
    services: ["Transitorio Electromagnético (TEM)", "GPR / Georadar", "Dron Multiespectral"],
    regions: ["Lambayeque", "Piura", "Cajamarca", "San Martín"],
    rating: 4.6,
    contactEmail: "info@geogeotech.com",
    contactPhone: "+51 912 345 678",
    priceEstimateUsd: 1800,
  },
];

function loadDB(): LocalDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file, using empty db", err);
  }
  return {
    parcels: [],
    analyses: [],
    outcomes: [],
    leads: [],
    providers: DEFAULT_PROVIDERS,
  };
}

function saveDB(db: LocalDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Ensure database file exists on startup
const db = loadDB();
if (db.providers.length === 0) {
  db.providers = DEFAULT_PROVIDERS;
  saveDB(db);
}

// Lazy Initialize GoogleGenAI Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        console.log("Gemini API Client initialized successfully.");
      } catch (e) {
        console.error("Failed to initialize Gemini API client:", e);
      }
    } else {
      console.warn("GEMINI_API_KEY not configured or is placeholder. Falling back to realistic simulation generators.");
    }
  }
  return aiClient;
}

// Helper to calculate centroid of standard flat array coordinates
function getPolygonCentroid(coords: [number, number][]): { lat: number; lng: number } {
  if (coords.length === 0) return { lat: -12.046374, lng: -77.042793 }; // Lima Default
  let latSum = 0;
  let lngSum = 0;
  coords.forEach(([lat, lng]) => {
    latSum += lat;
    lngSum += lng;
  });
  return { lat: latSum / coords.length, lng: lngSum / coords.length };
}

// REST API Routes

// 1. CRUD Parcels
app.post("/api/parcels", (req, res) => {
  const { name, coordinates, areaHa, intendedUse, targetYieldLps, maxBudgetUsd, countryCode } = req.body;
  if (!coordinates || coordinates.length < 3) {
    return res.status(400).json({ error: "Coordenadas inválidas. Debe dibujar o cargar un polígono con al menos 3 vértices." });
  }

  const newParcel = {
    id: "par_" + Math.random().toString(36).substr(2, 9),
    name: name || "Predio sin nombre",
    coordinates,
    areaHa: areaHa || Math.round((Math.random() * 80 + 10) * 10) / 10,
    intendedUse: intendedUse || "riego",
    targetYieldLps: Number(targetYieldLps) || 5,
    maxBudgetUsd: Number(maxBudgetUsd) || 15000,
    countryCode: countryCode || "PE",
    createdAt: new Date().toISOString(),
  };

  const db = loadDB();
  db.parcels.push(newParcel);
  saveDB(db);

  res.status(201).json(newParcel);
});

app.get("/api/parcels", (req, res) => {
  const db = loadDB();
  res.json(db.parcels);
});

app.get("/api/parcels/:id", (req, res) => {
  const db = loadDB();
  const parcel = db.parcels.find((p) => p.id === req.params.id);
  if (!parcel) return res.status(404).json({ error: "Parcela no encontrada" });
  res.json(parcel);
});

// 2. Run Geoprocessing & Analysis Pipeline
app.post("/api/analyses", (req, res) => {
  const { parcelId } = req.body;
  const db = loadDB();
  const parcel = db.parcels.find((p) => p.id === parcelId);
  if (!parcel) return res.status(404).json({ error: "Predio/Parcela no encontrado" });

  const centroid = getPolygonCentroid(parcel.coordinates);
  
  // Geologic mapping based on coordinate hashes or ranges
  const isPeru = parcel.countryCode === "PE" || (centroid.lat < 0 && centroid.lat > -20 && centroid.lng < -85 && centroid.lng > -65);
  const geoType = isPeru ? "Aluvial permeable / INGEMMET Grupo Copara" : "Basalto fisurado / WHYMAP";
  const geoValueDesc = isPeru ? "Depósitos aluviales y fluviales con alta permeabilidad de gravas y arenas" : "Roca volcánica fracturada con fisuras abiertas";
  const geoSubscore = isPeru ? 0.92 : 0.78;

  // Simulate scoring profile and factor layers
  const factors = [
    { factor: "geologia", label: "Geología y Litología", subscore: geoSubscore, weight: 0.25, valueDescription: geoValueDesc, source: isPeru ? "INGEMMET GEOCATMIN" : "GLiM (Global)" },
    { factor: "lineamientos", label: "Lineamientos estructurales / Fallas", subscore: 0.85, weight: 0.15, valueDescription: "Densidad de fallas de 1.4 km/km² en vecindad", source: isPeru ? "INGEMMET Fallas Activas" : "Topografía Derivada" },
    { factor: "twi", label: "Índice de Humedad Topográfica (TWI)", subscore: 0.76, weight: 0.15, valueDescription: "TWI promedio 8.4 (Zonas bajas y terrazas planas)", source: "Copernicus GLO-30 DEM" },
    { factor: "precip", label: "Recarga / Precipitación media", subscore: 0.65, weight: 0.15, valueDescription: "740mm anuales con estacionalidad moderada", source: "CHIRPS v3" },
    { factor: "ndvisecco", label: "Persistencia de Vegetación (NDVI seco)", subscore: 0.88, weight: 0.10, valueDescription: "NDVI seco persistente en contacto de falla", source: "Sentinel-2 L2A" },
    { factor: "suelos", label: "Infiltración de Suelo", subscore: 0.72, weight: 0.10, valueDescription: "Franco-arenoso, permeabilidad media-alta", source: "ISRIC SoilGrids" },
    { factor: "drenaje", label: "Proximidad a Red de Drenaje", subscore: 0.80, weight: 0.05, valueDescription: "A 180m de quebrada húmeda tributaria", source: "HydroRIVERS" },
    { factor: "pozos", label: "Evidencia de Pozos Locales", subscore: 0.70, weight: 0.05, valueDescription: "Pozo tubular a 1.2km (Caudal reportado 8 L/s)", source: "ANA SNIRH / OSM" }
  ];

  // Calculate Weighted score
  let weightedSum = 0;
  factors.forEach((f) => {
    weightedSum += f.subscore * f.weight;
  });
  const gwpiMean = Math.round(weightedSum * 100);
  const gwpiMax = Math.round((weightedSum + 0.1) * 100);

  // Derive top Candidate Points for Geophysical Exploration
  const points = [
    {
      id: "pt_" + Math.random().toString(36).substr(2, 5),
      rank: 1,
      lat: centroid.lat + 0.0015,
      lng: centroid.lng - 0.0012,
      elevationM: Math.round(230 + Math.random() * 40),
      gwpi: Math.min(96, Math.round(gwpiMean + 12)),
      confidence: 0.82,
      rationale: { geologia: 0.95, lineamientos: 0.90, twi: 0.85, ndvisecco: 0.90 },
      subscores: factors,
      distances: { viasM: 120, energiaM: 350, viviendasM: 400, riosM: 180, anpM: 0 }
    },
    {
      id: "pt_" + Math.random().toString(36).substr(2, 5),
      rank: 2,
      lat: centroid.lat - 0.0022,
      lng: centroid.lng + 0.0018,
      elevationM: Math.round(242 + Math.random() * 30),
      gwpi: Math.round(gwpiMean + 4),
      confidence: 0.78,
      rationale: { geologia: 0.88, lineamientos: 0.75, twi: 0.80, ndvisecco: 0.70 },
      subscores: factors,
      distances: { viasM: 450, energiaM: 200, viviendasM: 150, riosM: 310, anpM: 0 }
    },
    {
      id: "pt_" + Math.random().toString(36).substr(2, 5),
      rank: 3,
      lat: centroid.lat + 0.0005,
      lng: centroid.lng + 0.0025,
      elevationM: Math.round(225 + Math.random() * 25),
      gwpi: Math.max(35, Math.round(gwpiMean - 8)),
      confidence: 0.71,
      rationale: { geologia: 0.75, lineamientos: 0.60, twi: 0.70, ndvisecco: 0.65 },
      subscores: factors,
      distances: { viasM: 320, energiaM: 500, viviendasM: 600, riosM: 420, anpM: 0 }
    }
  ];

  // Geophysical plan recommendation
  const geoPlan = [
    {
      method: "ERT",
      name: "Tomografía de Resistividad Eléctrica (ERT) 2D",
      priority: "Alta",
      recommendation: "Recomendado sobre el Punto 1 (Filtro Aluvial / Falla). Ejecutar 2 líneas ortogonales de 240m de longitud con espaciamiento de electrodos de 5m para perfilar el contacto litológico hasta 60m de profundidad.",
      estimatedLines: 2,
      estimatedCostUsd: 1500,
      description: "Produce un perfil continuo bidimensional de resistividades que ayuda a mapear la geometría del acuífero y fracturaciones."
    },
    {
      method: "VES",
      name: "Sondeo Eléctrico Vertical (SEV)",
      priority: "Alta",
      recommendation: "Recomendado en los Puntos 1 y 2 para calibración rápida y calibrar espesores del manto cuaternario. Configuración Schlumberger con apertura AB/2 hasta 150 metros.",
      estimatedLines: 3,
      estimatedCostUsd: 800,
      description: "Ideal para detectar estratificación y profundidad exacta del nivel del agua a costo muy bajo."
    }
  ];

  // Well Design Mock based on parameters
  const wellDesign = {
    aquiferType: isPeru ? "Semi-confinado" : "Libre",
    staticLevelRange: { min: 14, max: 22, unit: "metros" },
    depthPreRange: { min: 45, max: 70, unit: "metros" },
    wellType: parcel.targetYieldLps > 15 ? "Tubular / Perforado" : "Tubular / Perforado",
    yieldRangeLps: { min: Math.max(1, Math.round(parcel.targetYieldLps * 0.7)), max: Math.round(parcel.targetYieldLps * 1.4) },
    casingDiameterInches: parcel.targetYieldLps > 10 ? 8 : 6,
    gravelPackRequired: true,
    testPlan: [
      "Prueba de bombeo escalonado de 3 fases (1.5h, 1.5h, 1.5h)",
      "Prueba de caudal constante de 24 horas continuas",
      "Prueba de recuperación de nivel hasta alcanzar 95% estático"
    ],
    permitsChecklist: isPeru
      ? [
          "Acreditación de disponibilidad hídrica ante la Autoridad Nacional del Agua (ANA)",
          "Aprobación de estudio de impacto ambiental simplificado (DIA/ITS)",
          "Licencia de ejecución de pozo exploratorio / perforación",
          "Licencia definitiva de uso de agua subterránea"
        ]
      : [
          "Standard State Water Right Permit",
          "Environmental Impact Statement Exclusion",
          "County Drilling Permit",
          "Pump Installation Permit"
        ]
  };

  const newAnalysis = {
    id: "ana_" + Math.random().toString(36).substr(2, 9),
    parcelId,
    status: "done",
    scoringProfileName: isPeru ? "Modelo de Ponderación Hidrogeológica Perú" : "WHYMAP Global Weights Profile",
    gwpiMean,
    gwpiMax,
    confidence: 0.80,
    points,
    geophysicalPlan: geoPlan,
    wellDesign,
    provenance: [
      { layer: "Geología", source: isPeru ? "INGEMMET Boletines N°12, 14, 25" : "GLiM 1:1M Scale Map", retrievedAt: "2026-07-08", resolution: isPeru ? "50 m" : "1 km" },
      { layer: "Topografía", source: "Copernicus DEM GLO-30", retrievedAt: "2026-07-09", resolution: "30 m" },
      { layer: "Suelo", source: "ISRIC SoilGrids 250m", retrievedAt: "2026-07-02", resolution: "250 m" },
      { layer: "Precipitación", source: "CHIRPS v3 Dynamic Climatology", retrievedAt: "2026-07-09", resolution: "5 km" },
      { layer: "Satelital", source: "Copernicus Sentinel-2 Mediana 2025 dry season", retrievedAt: "2026-07-09", resolution: "10 m" }
    ],
    createdAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  };

  db.analyses.push(newAnalysis);
  saveDB(db);

  res.status(201).json(newAnalysis);
});

app.get("/api/analyses", (req, res) => {
  const db = loadDB();
  res.json(db.analyses);
});

app.get("/api/analyses/parcel/:id", (req, res) => {
  const db = loadDB();
  const list = db.analyses.filter((a) => a.parcelId === req.params.id);
  res.json(list);
});

app.get("/api/analyses/:id", (req, res) => {
  const db = loadDB();
  const analysis = db.analyses.find((a) => a.id === req.params.id);
  if (!analysis) return res.status(404).json({ error: "Análisis no encontrado" });
  res.json(analysis);
});

// 3. Register Well outcomes (Moat)
app.post("/api/well-outcomes", (req, res) => {
  const { parcelId, pointId, drilledDepthM, staticLevelM, dynamicLevelM, measuredYieldLps, waterQuality, success, reportedBy } = req.body;
  
  const newOutcome = {
    id: "out_" + Math.random().toString(36).substr(2, 9),
    parcelId,
    pointId,
    drilledDepthM: Number(drilledDepthM),
    staticLevelM: Number(staticLevelM),
    dynamicLevelM: Number(dynamicLevelM),
    measuredYieldLps: Number(measuredYieldLps),
    waterQuality: waterQuality || { ph: 7.2, conductivityUsCm: 480, turbidityNtu: 1.5, isPotable: true },
    success: Boolean(success),
    reportedBy: reportedBy || "brian.d.pajares@gmail.com",
    createdAt: new Date().toISOString()
  };

  const db = loadDB();
  db.outcomes.push(newOutcome);
  saveDB(db);

  res.status(201).json(newOutcome);
});

app.get("/api/well-outcomes", (req, res) => {
  const db = loadDB();
  res.json(db.outcomes);
});

// 4. Lead Generation & Marketplace Providers
app.get("/api/marketplace/providers", (req, res) => {
  const db = loadDB();
  res.json(db.providers);
});

app.post("/api/leads", (req, res) => {
  const { analysisId, pointId, providerId } = req.body;
  const newLead = {
    id: "lead_" + Math.random().toString(36).substr(2, 9),
    analysisId,
    pointId,
    providerId,
    status: "new",
    createdAt: new Date().toISOString()
  };

  const db = loadDB();
  db.leads.push(newLead);
  saveDB(db);

  res.status(201).json(newLead);
});

app.get("/api/leads", (req, res) => {
  const db = loadDB();
  res.json(db.leads);
});

// 5. Payment simulation
app.post("/api/payments/checkout", (req, res) => {
  const { amount, productName, orgName } = req.body;
  res.json({
    id: "cs_" + Math.random().toString(36).substr(2, 12),
    url: "/payment-success?item=" + encodeURIComponent(productName) + "&amount=" + amount,
    status: "pending"
  });
});

// 6. Gemini-powered Hydrogeological Explanation
app.post("/api/gemini/explain", async (req, res) => {
  const { point, parcel } = req.body;
  if (!point) return res.status(400).json({ error: "Punto requerido" });

  const ai = getAI();
  const language = "es"; // Default Spanish as requested in PRD Pack 1

  const subscoresDesc = point.subscores
    .map((s: any) => `- **${s.label}**: Puntuación ${s.subscore} (Peso ${s.weight * 100}%) - ${s.valueDescription} [Fuente: ${s.source}]`)
    .join("\n");

  const prompt = `Actúa como un hidrogeólogo consultor senior especializado en la exploración de aguas subterráneas para AquaFlow AI.
Analiza técnicamente el punto recomendado para exploración geofísica y proporciona una explicación sumamente detallada, profesional y convincente en español.

DATOS DEL PREDIO:
- Nombre: ${parcel?.name || "Sin nombre"}
- Uso planeado: ${parcel?.intendedUse || "riego"}
- Caudal objetivo: ${parcel?.targetYieldLps || 5} L/s
- País: ${parcel?.countryCode || "PE"}

DATOS DEL PUNTO EVALUADO (Rank ${point.rank}):
- Latitud, Longitud: ${point.lat}, ${point.lng}
- Elevación: ${point.elevationM} msnm
- Índice de Potencial Hídrico (GWPI): ${point.gwpi}/100
- Nivel de Confianza: ${point.confidence * 100}%

PUNTUACIÓN POR CAPAS DEL PREDIO:
${subscoresDesc}

INSTRUCCIONES DE RESPUESTA:
1. Explica científicamente por qué el punto tiene un potencial de ${point.gwpi}/100 combinando los factores (la litología, el lineamiento, la acumulación por humedad/TWI).
2. Detalla por qué se necesita validación geofísica antes de perforar y qué tipo de método se sugiere (por ejemplo, Tomografía Eléctrica o SEV).
3. Escribe en un tono técnico, formal, preciso, y a la vez comprensible para un agro-empresario o desarrollador rural.
4. Mantén la respuesta concisa y dividida en 3 secciones claras:
   - **Análisis Litológico y Estructural**
   - **Raciocinio Hidrodinámico y Topográfico**
   - **Recomendaciones Clave para el Estudio Geofísico**

Evita rodeos innecesarios. Comienza directamente con el análisis técnico.`;

  if (!ai) {
    // Elegant realistic simulation fallback if API key is not present
    const fallbackText = `### Análisis Litológico y Estructural
El Punto ${point.rank} se encuentra posicionado de manera óptima sobre depósitos de tipo **${point.subscores[0]?.valueDescription || "aluvial permeable"}** con un altísimo grado de favorabilidad hidrogeológica. La proximidad y densidad de lineamientos estructurales (fracturaciones detectadas a través de modelación hillshade multiaximut) favorece la acumulación y conductividad hidráulica secundaria en profundidad. La conductividad en estas discontinuidades geológicas actúa como canal de circulación preferencial para el acuífero local.

### Raciocinio Hidrodinámico y Topográfico
El Índice de Humedad Topográfica (TWI) de **${point.subscores.find((s: any) => s.factor === "twi")?.valueDescription || "8.4"}** corrobora que la pendiente local converge en una terraza acumulativa donde la infiltración es significativamente más eficiente. Esto se correlaciona de manera directa con un verdor persistente observado en el NDVI de estación seca (datos históricos de Sentinel-2 L2A), indicando la presencia de humedad subterránea somera. La recarga potencial estimada de la cuenca es excelente, sustentando un balance hídrico idóneo para el caudal objetivo de ${parcel?.targetYieldLps || 5} L/s.

### Recomendaciones Clave para el Estudio Geofísico
Para mitigar la incertidumbre inherente del modelado por teledetección (nivel de confianza del ${(point.confidence * 100).toFixed(0)}%), sugerimos firmemente realizar una campaña de **Tomografía de Resistividad Eléctrica (ERT)** de 2 líneas ortogonales con una penetración objetivo de al menos 60 metros. Esto corroborará los límites del depósito cuaternario aluvial, verificará la profundidad exacta del nivel freático estático, y determinará el mejor punto de emboquille para el pozo tubular definitivo.`;

    return res.json({ text: fallbackText });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Explain API Error:", error);
    res.status(500).json({ error: "Error interactuando con Gemini AI" });
  }
});

// 7. Gemini-powered Full Detailed Hydrogeological Report
app.post("/api/gemini/report", async (req, res) => {
  const { analysis, parcel } = req.body;
  if (!analysis) return res.status(400).json({ error: "Análisis requerido" });

  const ai = getAI();

  const prompt = `Genera un **Informe de Pre-Factibilidad Hidrogeológica y Diseño de Pozo** profesional y formal para AquaFlow AI.
El predio analizado es "${parcel?.name || "Predio de Prueba"}" con un área de ${parcel?.areaHa} hectáreas, ubicado en ${parcel?.countryCode === "PE" ? "Perú" : "Coordenadas Globales"}.
Uso objetivo: ${parcel?.intendedUse}. Caudal de diseño solicitado: ${parcel?.targetYieldLps} L/s. Presupuesto disponible: $${parcel?.maxBudgetUsd}.

Métricas clave del análisis:
- Potencial Máximo (GWPI): ${analysis.gwpiMax}/100
- Potencial Promedio (GWPI): ${analysis.gwpiMean}/100
- Confianza Global: ${analysis.confidence * 100}%
- Perfil Litológico Estimado: ${analysis.wellDesign.wellType} con acuífero ${analysis.wellDesign.aquiferType}
- Rango de profundidad sugerido: ${analysis.wellDesign.depthPreRange.min} - ${analysis.wellDesign.depthPreRange.max} metros
- Caudal de extracción estimado: ${analysis.wellDesign.yieldRangeLps.min} - ${analysis.wellDesign.yieldRangeLps.max} L/s

Puntos recomendados para exploración geofísica:
${analysis.points.map((p: any) => `- Punto ${p.rank} (Score: ${p.gwpi}, Confianza: ${p.confidence * 100}%, Coordenadas: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)})`).join("\n")}

INSTRUCCIONES DE FORMATO:
- Produce el informe estructurado utilizando Markdown profesional.
- Utiliza terminología técnica precisa (acuífero libre/confinado, nivel estático/dinámico, conductividad hidráulica, resistividades, gradientes).
- El informe DEBE dividirse en:
  1. **RESUMEN EJECUTIVO** (narrativa ejecutiva con IA)
  2. **CARACTERIZACIÓN HIDROGEOLÓGICA Y LITOLOGÍA LOCAL** (explicación de la cuenca y estratigrafía simulada)
  3. **EVIDENCIA SATELITAL Y ANÁLISIS DE FACTORES** (NDVI, TWI, drenaje, recarga)
  4. **PLAN GEOFÍSICO SUGERIDO** (diseño de tomografía eléctrica / SEV)
  5. **DISEÑO PRELIMINAR DEL POZO TUBULAR** (profundidades, rejillas, pack de grava, tuberías de revestimiento)
  6. **CHECKLIST DE TRÁMITES Y MARCO LEGAL** (ANA / licencias pertinentes)
  7. **DISCLAIMER TÉCNICO Y LEGAL INNEGOCIABLE**

Utiliza un tono de informe de consultoría alemana o suiza de primer nivel. No inventes datos que contradigan los proporcionados. Redacta completamente cada sección en español.`;

  if (!ai) {
    const fallbackReport = `
# INFORME DE PRE-FACTIBILIDAD HIDROGEOLÓGICA Y DISEÑO DE POZO
**Proyecto:** Pre-estudio Hídrico Terreno "${parcel?.name || "Predio Demo"}"  
**Plataforma:** AquaFlow AI GeoIntelligence v2.0  
**Fecha de emisión:** 9 de Julio de 2026  
**Nivel de Confianza Global:** ${(analysis.confidence * 100).toFixed(0)}% (Medio-Alto)  

---

## 1. RESUMEN EJECUTIVO
A solicitud del propietario, la plataforma geoespacial **AquaFlow AI** ha ejecutado el pipeline de simulación y pre-factibilidad hidrogeológica para el predio de **${parcel?.areaHa || 45} ha** con el objetivo de identificar prospectos viables para la perforación de un pozo tubular que garantice un caudal de **${parcel?.targetYieldLps || 5} L/s** para uso de **${parcel?.intendedUse || "riego"}**.

El estudio revela un excelente potencial hídrico concentrado en la zona norte y centro del predio (GWPI Máximo de **${analysis.gwpiMax}/100**), condicionado por una potente terraza aluvial cuaternaria y cruce de fracturas estructurales. Se han mapeado y priorizado **tres (3) puntos candidatos** idóneos para exploración geofísica de campo.

---

## 2. CARACTERIZACIÓN HIDROGEOLÓGICA Y LITOLOGÍA LOCAL
La estratigrafía inferida del predio está compuesta por:
*   **0.0 - 4.5m (Horizonte A/B):** Suelo franco-arcilloso y limos coluviales de permeabilidad moderada.
*   **4.5 - 28.0m (Unidad Aluvial Superior):** Secuencia no consolidada de gravas redondeadas, arenas medias a gruesas y guijarros en matriz arenosa. Esta unidad constituye el principal reservorio poroso con excelente permeabilidad.
*   **28.0 - 45.0m (Faja Sello):** Intercalación de arcillas limosas y arenas finas que actúa como techo del acuífero semi-confinado subyacente.
*   **45.0m+ (Sótano Rocoso):** Basalto volcánico fracturado con fisuramiento secundario que alberga circulación hídrica por diaclasamiento.

---

## 3. EVIDENCIA SATELITAL Y ANÁLISIS DE FACTORES
El análisis por teledetección y modelamiento hidrológico revela:
*   **Índice TWI promedio de 8.4:** Señala un drenaje subsuperficial convergente hacia las depresiones planas, facilitando la recarga por escorrentía superficial.
*   **Persistencia de Vegetación (NDVI Seco):** Se identificó una firma espectral saludable constante de vegetación de raíces profundas a lo largo de las quebradas tributarias, sugiriendo la presencia del nivel estático a profundidades accesibles (< 22 metros).
*   **Precipitación CHIRPS (740mm):** Ofrece un balance hídrico positivo capaz de abastecer la recarga anual del acuífero sin inducir una sobre-explotación a largo plazo.

---

## 4. PLAN GEOFÍSICO SUGERIDO
Para corroborar la modelación espectral, es mandatorio ejecutar la siguiente prospección geofísica en campo:
1.  **Tomografía Eléctrica (ERT) 2D:** Dos perfiles de 240m de longitud con arreglo Wenner-Schlumberger centrados sobre el **Punto Recomendado 1** para mapear paleocauces y descartar zonas arcillosas ciegas.
2.  **Sondeo Eléctrico Vertical (SEV):** Tres mediciones de calibración para definir espesores de capas y resistividad real del agua.

---

## 5. DISEÑO PRELIMINAR DEL POZO TUBULAR
A la espera de los resultados geofísicos, se proyecta un pozo de las siguientes características técnicas:
*   **Profundidad Proyectada:** 60 metros (rango variable de 45 a 70 m).
*   **Método de Perforación:** Rotatoria con lodo bentonítico o percusión neumática según dureza de la roca basáltica profunda.
*   **Tubería de Revestimiento:** Tubería de PVC Clase 10 de 6 u 8 pulgadas de diámetro nominal.
*   **Sección de Filtros:** Rejillas de ranura continua tipo Johnson posicionadas estratégicamente entre los 32 y 54 metros.
*   **Filtro de Grava (Gravel Pack):** Grava silícea seleccionada de 1/8" a 1/4" para prevenir el ingreso de arenas finas al pozo.

---

## 6. CHECKLIST DE TRÁMITES Y MARCO LEGAL (Perú - ANA)
*   [ ] Solicitud de Licencia de Ejecución de Obras de Alumbramiento ante la ALA local.
*   [ ] Memoria descriptiva firmada por Ingeniero Geólogo o Agrícola colegiado.
*   [ ] DIA (Declaración de Impacto Ambiental) simplificada.
*   [ ] Registro del pozo en el inventario oficial tras pruebas de bombeo para obtención de Licencia de Uso definitivo.

---

## 7. DISCLAIMER TÉCNICO Y LEGAL INNEGOCIABLE
*AquaFlow AI proporciona análisis predictivos fundamentados en teledetección y bases de datos hidrogeológicas a nivel macro-regional. Este informe constituye un estudio de pre-factibilidad y bajo ninguna circunstancia reemplaza un estudio geofísico de campo ni garantiza de forma explícita el hallazgo de agua o caudales comerciales. Queda estrictamente prohibida la perforación sin validación in-situ por profesionales habilitados.*
`;
    return res.json({ text: fallbackReport });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Report API Error:", err);
    res.status(500).json({ error: "Error interactuando con Gemini AI" });
  }
});

// 8. Dynamic AI Assistant for Chat & Consults
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, parcel, analysis } = req.body;
  if (!messages) return res.status(400).json({ error: "Mensajes requeridos" });

  const ai = getAI();

  // Create highly contextual system instructions
  const systemInstruction = `Eres "AquaBot AI", el Asistente Experto en Hidrogeología y Geofísica de AquaFlow AI.
Tu rol es brindar asesoría técnica de primer nivel sobre aguas subterráneas, métodos geofísicos, perforación de pozos y normativas legales (principalmente ANA en Perú).

CONTEXTO ACTUAL DEL CLIENTE:
- Predio: ${parcel ? parcel.name : "No seleccionado"}
- Uso planeado del agua: ${parcel ? parcel.intendedUse : "Desconocido"}
- Caudal objetivo: ${parcel ? parcel.targetYieldLps + " L/s" : "No especificado"}
- País: ${parcel ? parcel.countryCode : "Global/Perú"}
- Análisis Técnico: ${
    analysis
      ? `GWPI Máximo: ${analysis.gwpiMax}, Acuífero: ${analysis.wellDesign.aquiferType}, Rango de Pozos Proyectados: ${analysis.wellDesign.depthPreRange.min}-${analysis.wellDesign.depthPreRange.max}m, Tipo de Pozo: ${analysis.wellDesign.wellType}`
      : "No ejecutado aún"
  }

REGLAS DE COMPORTAMIENTO:
1. Sé extremadamente servicial, técnico, preciso y profesional. Combina el rigor científico con explicaciones claras y aplicadas al negocio agrícola o inmobiliario.
2. Proporciona recomendaciones sobre estudios de Resistividad (ERT), SEV, TEM o perforaciones.
3. Si el usuario te pregunta sobre un tema de leyes de agua en el Perú, explícales las competencias de la ANA (Autoridad Nacional del Agua) y las licencias de uso de agua de manera estructurada.
4. Recuerda SIEMPRE advertir amablemente que AquaFlow es un screening predictivo de pre-factibilidad satelital, y que la geofísica e ingeniería local son obligatorias para el éxito rotundo del proyecto.
5. Responde bilingüe si te preguntan en inglés, por defecto en español de manera natural. No utilices jerga corporativa vacía.`;

  // Map client-side messages to the standard format for @google/genai chats
  const chatMessages = messages.map((m: any) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  // Pop the last message as the new input
  const lastMessage = chatMessages.pop();
  if (!lastMessage) return res.status(400).json({ error: "No hay mensaje nuevo" });

  if (!ai) {
    // Highly contextual simulated response fallback
    const query = lastMessage.parts[0].text.toLowerCase();
    let reply = `Hola. Soy AquaBot AI, tu consultor hidrogeológico virtual. Como no tengo conexión directa con mi cerebro de IA en este momento, he analizado tu consulta mediante mis algoritmos heurísticos locales:

`;
    if (query.includes("ana") || query.includes("permiso") || query.includes("legal") || query.includes("trámite")) {
      reply += `Respecto a los trámites en el Perú ante la **Autoridad Nacional del Agua (ANA)**:
1. **Estudios de Disponibilidad Hídrica:** Debes tramitar un permiso para realizar estudios que justifiquen que el volumen de agua solicitado no afectará a terceros ni al acuífero.
2. **Autorización de Perforación (Licencia de Obra):** Permite iniciar físicamente el pozo una vez tengas aprobado el estudio previo. Requiere planos, memoria descriptiva hidrogeológica firmada, y póliza ambiental básica.
3. **Licencia de Uso de Agua Subterránea:** Se otorga tras realizar las pruebas de bombeo correspondientes y verificar la calidad física, química y bacteriológica del agua alumbrada.`;
    } else if (query.includes("geofisica") || query.includes("ert") || query.includes("sev") || query.includes("tomografia")) {
      reply += `La prospección geofísica en tu predio es fundamental. Para este tipo de configuración, sugerimos aplicar **Tomografía de Resistividad Eléctrica (ERT)**. 
A diferencia de un Sondeo Eléctrico Vertical (SEV) que solo mide una columna unidimensional, la ERT dibuja un mapa bidimensional de resistividades. Esto te permitirá:
*   Mapear la profundidad del paleocauce (faja altamente permeable de gravas).
*   Identificar intrusiones arcillosas secas que no contienen agua disponible.
*   Ubicar con precisión milimétrica la faja donde el pozo tubular tubular obtendrá el máximo caudal continuo.`;
    } else if (query.includes("pozo") || query.includes("perfora") || query.includes("profundidad") || query.includes("bombeo")) {
      reply += `Para el caudal objetivo de **${parcel ? parcel.targetYieldLps : 5} L/s**, te sugerimos proyectar un **pozo tubular perforado** con un diámetro de encamisado de **${parcel && parcel.targetYieldLps > 10 ? 8 : 6} pulgadas**. 
Es de vital importancia colocar rejillas filtrantes de tipo Johnson en los estratos aluviales saturados de grava y un pre-filtro de grava silícea seleccionada. Además, al concluir la obra, se debe realizar una **prueba de bombeo constante de 24 horas** para determinar el caudal de explotación óptimo (Q) y el abatimiento de agua para seleccionar la bomba sumergible ideal.`;
    } else {
      reply += `Interesante consulta. Para tu proyecto en el terreno **"${parcel ? parcel.name : "Demo"}"**, con potencial de **${analysis ? analysis.gwpiMax : 75}/100**, el éxito de la captación depende directamente de cruzar la teledetección de AquaFlow con los estudios de campo. ¿Te gustaría que hablemos a detalle sobre el diseño del pozo tubular, los costos estimados de perforación o los métodos de prospección geofísica recomendados para este tipo de geología?`;
    }
    return res.json({ text: reply });
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
      },
      history: chatMessages.length > 0 ? chatMessages : undefined,
    });

    const response = await chat.sendMessage({
      message: lastMessage.parts[0].text,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({ error: "Error interactuando con el chat de Gemini AI" });
  }
});

// Vite Setup for Development and Production Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled asset serving.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AquaFlow AI Backend] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
