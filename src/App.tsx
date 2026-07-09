import React, { useState, useEffect } from "react";
import {
  Droplet,
  Compass,
  Layers,
  Sparkles,
  Shield,
  Trash2,
  Plus,
  Compass as MapIcon,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Briefcase,
  Sliders,
  DollarSign,
  Activity,
  CheckCircle2,
  Calendar,
  PhoneCall,
  Loader2,
  User,
  Heart,
  HelpCircle,
  Clock
} from "lucide-react";
import Header from "./components/Header";
import InteractiveMap from "./components/InteractiveMap";
import WellProfileGraphic from "./components/WellProfileGraphic";
import AiChatAssistant from "./components/AiChatAssistant";
import OutcomeLogger from "./components/OutcomeLogger";
import { Parcel, CandidatePoint, WellDesign, WellOutcome, Provider, Lead, AnalysisResult, IntendedUse } from "./types";

// PRE-LOADED SAMPLE PROPERTIES
const SAMPLE_PARCELS: Parcel[] = [
  {
    id: "par_zapotal",
    name: "Fundo Zapotal - Ica, Perú",
    coordinates: [
      [-14.062, -75.728],
      [-14.055, -75.722],
      [-14.058, -75.714],
      [-14.067, -75.719],
      [-14.062, -75.728]
    ],
    areaHa: 75.4,
    intendedUse: IntendedUse.Riego,
    targetYieldLps: 15,
    maxBudgetUsd: 18000,
    countryCode: "PE",
    createdAt: "2026-07-01T12:00:00Z"
  },
  {
    id: "par_eldorado",
    name: "Hacienda El Dorado - Majes",
    coordinates: [
      [-16.312, -72.228],
      [-16.305, -72.219],
      [-16.309, -72.208],
      [-16.318, -72.215],
      [-16.312, -72.228]
    ],
    areaHa: 120.2,
    intendedUse: IntendedUse.Industrial,
    targetYieldLps: 8,
    maxBudgetUsd: 25000,
    countryCode: "PE",
    createdAt: "2026-07-03T10:00:00Z"
  }
];

export default function App() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [activeTab, setActiveTab] = useState<string>("explore");
  const [activeSection, setActiveSection] = useState<"general" | "geophysics" | "well-design" | "permits">("general");

  const [parcels, setParcels] = useState<Parcel[]>(SAMPLE_PARCELS);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<CandidatePoint | null>(null);
  const [activeLayer, setActiveLayer] = useState<"gwpi" | "geologia" | "lineamientos" | "twi" | "ndvisecco" | "drenaje">("gwpi");

  // Custom drawing states
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [customPolygon, setCustomPolygon] = useState<[number, number][]>([]);

  // Pipeline telemetry simulation loader
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);

  // Business records
  const [outcomes, setOutcomes] = useState<WellOutcome[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // Gemini narrative AI states
  const [explainText, setExplainText] = useState<string>("");
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // New Parcel Form States
  const [formName, setFormName] = useState<string>("");
  const [formUse, setFormUse] = useState<IntendedUse>(IntendedUse.Riego);
  const [formYield, setFormYield] = useState<number>(10);
  const [formBudget, setFormBudget] = useState<number>(15000);

  const t = {
    es: {
      sidebarTitle: "Tus Predios rústicos",
      noParcels: "Carga o dibuja tu predio",
      newParcelTitle: "Nuevo Predio",
      parcelName: "Nombre",
      use: "Uso esperado del agua",
      yield: "Caudal Objetivo (L/s)",
      budget: "Presupuesto Máximo ($)",
      runBtn: "Ejecutar Pipeline GeoAI",
      pipelineTitle: "GEOPROCESSING TELEMETRY",
      pointsRank: "Ranking de Puntos Recomendados",
      pointDetail: "Profundización: Punto Proyectado",
      aiExplain: "Explicabilidad con IA (Gemini 3.5)",
      wellProfile: "Diseño Constructivo Preliminar",
      geophysicsPlan: "Estudio Geofísico Recomendado",
      permitsCheck: "Checklist de Trámites y Permisos",
      marketplaceTitle: "Marketplace de Contratistas",
      logOutcome: "Log drilling feedback",
      generateReport: "Descargar Informe Técnico Completo (PDF)",
      explainLoading: "Analizando capas espectrales con Gemini...",
      reportLoading: "Generando informe de pre-factibilidad...",
      checkoutTitle: "Pagar Informe Completo ($99)",
      leadBtn: "Cotizar Prospección Geofísica",
      leadSuccess: "¡Solicitud enviada con éxito!",
      introTitle: "Plataforma de Pre-Factibilidad Hidrogeológica y Geofísica con IA",
      introDesc: "AquaFlow AI procesa datos geoespaciales globales y nacionales para estimar el potencial acuífero antes de perforar.",
      introCard1Title: "Ahorra Miles de Dólares",
      introCard1Desc: "Evita perforar pozos secos o de bajo caudal identificando zonas geofísicas prioritarias.",
      introCard2Title: "Basamento Global + Nacional",
      introCard2Desc: "Baseline Copernicus y CHIRPS enriquecido con datos oficiales de INGEMMET y la ANA.",
      introCard3Title: "Dato-como-Moat",
      introCard3Desc: "Cada perforación registrada calibra los modelos locales, blindando la precisión regional."
    },
    en: {
      sidebarTitle: "Your Properties",
      noParcels: "Upload or draw your property",
      newParcelTitle: "New Property",
      parcelName: "Name",
      use: "Expected Water Use",
      yield: "Target Yield (L/s)",
      budget: "Max Budget ($)",
      runBtn: "Execute GeoAI Pipeline",
      pipelineTitle: "GEOPROCESSING TELEMETRY",
      pointsRank: "Recommended Exploration Points",
      pointDetail: "Deep Dive: Projected Point",
      aiExplain: "AI Explainability (Gemini 3.5)",
      wellProfile: "Constructive Well Design",
      geophysicsPlan: "Suggested Geophysical Campaign",
      permitsCheck: "Regulatory Permits Checklist",
      marketplaceTitle: "Contractors Marketplace",
      logOutcome: "Log drilling feedback",
      generateReport: "Download Full Technical Report (PDF)",
      explainLoading: "Analyzing spectral layers with Gemini...",
      reportLoading: "Generating pre-feasibility study report...",
      checkoutTitle: "Unlock Full Report ($99)",
      leadBtn: "Quote Geophysical Campaign",
      leadSuccess: "Inquiry submitted successfully!",
      introTitle: "Hydrogeological & Geophysical Pre-Feasibility Platform",
      introDesc: "AquaFlow AI processes global and national geospatial grids to estimate groundwater potential before drilling.",
      introCard1Title: "Save Thousands of Dollars",
      introCard1Desc: "Avoid drilling dry or low-yield boreholes by identifying geophysical exploration points.",
      introCard2Title: "Global baseline + National Pack",
      introCard2Desc: "Copernicus and CHIRPS baseline grids enriched with official local agency records.",
      introCard3Title: "Data-as-a-Moat",
      introCard3Desc: "Every registered field outcome recalibrates local weights, protecting regional accuracy."
    }
  }[language];

  // Pipeline telemetry steps
  const PIPELINE_STEPS = [
    "Ingesta de polígono y coordenadas WGS84...",
    "Procesando Modelo Digital de Elevación (Copernicus DEM GLO-30)...",
    "Generando red de escorrentía y calculando Índice de Humedad Topográfica (TWI)...",
    "Procesando medians estacionales y anomalías de NDVI seco con Sentinel-2 L2A...",
    "Consultando mapas litológicos regionales y clasificación de permeabilidad...",
    "Correlacionando densidad de lineamientos estructurales y zonas de fracturación...",
    "Consultando inventario de pozos históricos de ANA SNIRH y OpenStreetMap...",
    "Superposición ponderada analítica (AHP) y generación de Índice GWPI...",
    "Ejecutando algoritmo de agrupamiento para priorización de Puntos Candidatos...",
    "Pipeline geoespacial finalizado con éxito!"
  ];

  // Fetch initial baseline data from local API
  useEffect(() => {
    const initData = async () => {
      try {
        const pRes = await fetch("/api/parcels");
        const pData = await pRes.json();
        if (pData && pData.length > 0) {
          setParcels(pData);
        }

        const provRes = await fetch("/api/marketplace/providers");
        const provData = await provRes.json();
        setProviders(provData);

        const outRes = await fetch("/api/well-outcomes");
        const outData = await outRes.json();
        setOutcomes(outData);
      } catch (err) {
        console.error("Failed to load backend databases on startup", err);
      }
    };
    initData();
  }, []);

  // Set selected parcel and trigger/fetch analysis automatically
  const handleSelectParcel = async (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setIsDrawing(false);
    setSelectedPoint(null);
    setExplainText("");

    // Look for previous analyses of this parcel
    try {
      const res = await fetch(`/api/analyses/parcel/${parcel.id}`);
      const list = await res.json();
      if (list && list.length > 0) {
        // Display the latest analysis done
        const latest = list[list.length - 1];
        setActiveAnalysis(latest);
        if (latest.points && latest.points.length > 0) {
          handleSelectPoint(latest.points[0], parcel, latest);
        }
      } else {
        setActiveAnalysis(null);
      }
    } catch (err) {
      console.error("Error fetching analyses", err);
    }
  };

  // Run the full geoprocess simulation with stunning step telemetry loading
  const handleRunAnalysis = async () => {
    if (!selectedParcel) return;
    setIsProcessing(true);
    setTelemetryLogs([]);
    setCurrentStepIdx(0);
  };

  // Stepped loader interval hook
  useEffect(() => {
    if (currentStepIdx >= 0 && currentStepIdx < PIPELINE_STEPS.length) {
      const timer = setTimeout(() => {
        setTelemetryLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${PIPELINE_STEPS[currentStepIdx]}`]);
        setCurrentStepIdx(currentStepIdx + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else if (currentStepIdx === PIPELINE_STEPS.length) {
      // Trigger actual endpoint on server after telemetry finish
      const runServerAnalysis = async () => {
        try {
          const res = await fetch("/api/analyses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parcelId: selectedParcel?.id })
          });
          const analysisResult = await res.json();
          setAnalyses((prev) => [...prev, analysisResult]);
          setActiveAnalysis(analysisResult);
          
          if (analysisResult.points && analysisResult.points.length > 0) {
            handleSelectPoint(analysisResult.points[0], selectedParcel!, analysisResult);
          }
        } catch (err) {
          console.error("Pipeline run failure:", err);
        } finally {
          setIsProcessing(false);
          setCurrentStepIdx(-1);
        }
      };
      runServerAnalysis();
    }
  }, [currentStepIdx]);

  // Select exploring point and trigger Gemini Explain
  const handleSelectPoint = async (point: CandidatePoint, parcelContext = selectedParcel, analysisContext = activeAnalysis) => {
    setSelectedPoint(point);
    setIsExplaining(true);
    setExplainText("");

    try {
      const res = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ point, parcel: parcelContext })
      });
      const data = await res.json();
      
      // Beautiful incremental typewriter effect for the AI explanation text
      const explanation = data.text;
      let i = 0;
      const interval = setInterval(() => {
        setExplainText(explanation.slice(0, i + 5));
        i += 5;
        if (i >= explanation.length) {
          setExplainText(explanation);
          clearInterval(interval);
          setIsExplaining(false);
        }
      }, 10);
    } catch (err) {
      console.error("Failed to get point explanation", err);
      setExplainText(language === "es" ? "Error al cargar la caracterización hidrogeológica." : "Error loading hydrogeological characterization.");
      setIsExplaining(false);
    }
  };

  // Generate full markdown report using server-side Gemini
  const handleGenerateReport = async () => {
    if (!activeAnalysis || !selectedParcel) return;
    setIsGeneratingReport(true);
    setReportText("");
    setShowReportModal(true);

    try {
      const res = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: activeAnalysis, parcel: selectedParcel })
      });
      const data = await res.json();
      setReportText(data.text);
    } catch (err) {
      console.error("Failed to generate complete report", err);
      setReportText(language === "es" ? "Fallo al generar el reporte integral." : "Failed to compile the comprehensive report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Submit lead to local database (simulates Stripe checkout/marketplace inquiry)
  const handleSubmitLead = async (providerId: string, pointId: string) => {
    if (!activeAnalysis) return;
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: activeAnalysis.id,
          pointId,
          providerId
        })
      });
      const newLead = await res.json();
      setLeads((prev) => [...prev, newLead]);
    } catch (err) {
      console.error("Failed to submit lead", err);
    }
  };

  // Save custom polygon from drawing tool
  const handleSaveCustomParcel = async (name: string, coords: [number, number][]) => {
    try {
      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          coordinates: coords,
          areaHa: Math.round((coords.length * 15 + Math.random() * 5) * 10) / 10,
          intendedUse: formUse,
          targetYieldLps: formYield,
          maxBudgetUsd: formBudget,
          countryCode: "PE"
        })
      });
      const newParcel = await res.json();
      setParcels((prev) => [...prev, newParcel]);
      handleSelectParcel(newParcel);
    } catch (err) {
      console.error("Failed to save custom parcel", err);
    }
  };

  // Register well outcomes to the dynamic database (Moat)
  const handleAddOutcome = async (outcomePayload: any) => {
    try {
      const res = await fetch("/api/well-outcomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outcomePayload)
      });
      const newOutcome = await res.json();
      setOutcomes((prev) => [...prev, newOutcome]);
    } catch (err) {
      console.error("Failed to add outcome", err);
    }
  };

  return (
    <div className="min-h-screen bg-bg-obsidian text-[#E0E0E0] font-sans antialiased selection:bg-gold/30 selection:text-white">
      {/* Dynamic Header Component */}
      <Header
        language={language}
        setLanguage={setLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isProcessing={isProcessing}
      />

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "explore" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar Control: Properties and parameters */}
            <section className="lg:col-span-3 flex flex-col space-y-5">
              
              {/* Properties list */}
              <div className="bg-bg-graphite rounded-2xl border border-border-dark p-4 shadow-xl">
                <span className="text-[10px] uppercase font-bold text-slate-cyber tracking-[0.15em] mb-2.5 block">
                  {t.sidebarTitle}
                </span>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {parcels.map((p) => {
                    const isSelected = selectedParcel?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        id={`parcel-select-btn-${p.id}`}
                        onClick={() => handleSelectParcel(p)}
                        className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-gold/10 border-gold/30 text-white font-medium shadow-sm shadow-gold/5"
                            : "bg-bg-obsidian/45 border-border-dark text-slate-cyber hover:bg-bg-card/50 hover:text-white"
                        }`}
                      >
                        <div className="truncate">
                          <span className="text-xs font-semibold block truncate">{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-cyber">{p.areaHa} ha | {p.countryCode}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${isSelected ? "text-gold" : "text-slate-cyber"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parameters Setup form */}
              {selectedParcel && (
                <div className="bg-bg-graphite rounded-2xl border border-border-dark p-4 shadow-xl space-y-4">
                  <span className="text-[10px] uppercase font-bold text-slate-cyber tracking-[0.15em] block border-b border-border-dark pb-2 flex items-center justify-between">
                    <span>{language === "es" ? "Propiedades del Predio" : "Property Properties"}</span>
                    <Sliders className="h-3.5 w-3.5 text-gold" />
                  </span>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-cyber tracking-wider mb-1">{t.use}</label>
                      <select
                        id="form-use-select"
                        value={selectedParcel.intendedUse}
                        disabled
                        className="w-full bg-bg-obsidian border border-border-dark rounded-lg text-xs px-2.5 py-1.5 text-[#E0E0E0] opacity-80"
                      >
                        <option value="riego">Riego Agrícola</option>
                        <option value="domestico">Agua Potable Doméstica</option>
                        <option value="industrial">Uso Industrial / Minero</option>
                        <option value="ganaderia">Ganadería</option>
                        <option value="inmobiliario">Habilitación Inmobiliaria</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-cyber tracking-wider mb-1">{t.yield}</label>
                        <input
                          type="text"
                          id="form-yield-display"
                          value={`${selectedParcel.targetYieldLps} L/s`}
                          disabled
                          className="w-full bg-bg-obsidian border border-border-dark rounded-lg text-xs px-2.5 py-1.5 text-[#E0E0E0] opacity-80 font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-slate-cyber tracking-wider mb-1">{t.budget}</label>
                        <input
                          type="text"
                          id="form-budget-display"
                          value={`$${selectedParcel.maxBudgetUsd.toLocaleString()}`}
                          disabled
                          className="w-full bg-bg-obsidian border border-border-dark rounded-lg text-xs px-2.5 py-1.5 text-[#E0E0E0] opacity-80 font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Execute pipeline core trigger button */}
                  {!activeAnalysis ? (
                    <button
                      id="run-analysis-btn"
                      onClick={handleRunAnalysis}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-tr from-gold to-gold-light hover:from-gold-light hover:to-gold text-bg-obsidian font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-gold/10 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin text-bg-obsidian" />
                      ) : (
                        <Activity className="h-4 w-4 animate-pulse text-bg-obsidian" />
                      )}
                      <span>{t.runBtn}</span>
                    </button>
                  ) : (
                    <div className="bg-gold/10 text-gold border border-gold/25 p-3 rounded-xl text-center text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-1.5 select-none">
                      <CheckCircle2 className="h-4 w-4 text-gold" />
                      <span>Análisis Completado</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Telemetry log display if active pipeline running */}
              {isProcessing && (
                <div className="bg-bg-obsidian border border-gold/20 rounded-2xl p-4 font-mono text-[9px] text-gold/90 h-[220px] overflow-y-auto flex flex-col justify-end space-y-1.5 shadow-2xl">
                  <div className="border-b border-gold/20 pb-1.5 mb-1.5 flex items-center justify-between">
                    <span className="font-bold flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5 text-gold" />
                      {t.pipelineTitle}
                    </span>
                    <span className="animate-pulse">● LIVE</span>
                  </div>
                  {telemetryLogs.map((log, idx) => (
                    <div key={idx} className="leading-tight animate-fade-in break-all">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Center Area: Map Visor & Bento Stats Dashboard */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Introduction Card if no parcel selected */}
              {!selectedParcel && (
                <div className="bg-bg-graphite border border-border-dark rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between min-h-[500px] shadow-gold/5">
                  <div>
                    <div className="inline-flex items-center space-x-2 bg-gold/10 border border-gold/20 px-3.5 py-1.5 rounded-full text-xs text-gold font-semibold mb-6">
                      <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                      <span>AGRO & RURAL WATER GEOMODELING</span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight text-white mb-4 leading-tight">
                      {t.introTitle}
                    </h1>
                    <p className="text-sm md:text-base text-[#E0E0E0] max-w-2xl leading-relaxed mb-8">
                      {t.introDesc}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-bg-obsidian/60 border border-border-dark p-4 rounded-2xl">
                        <span className="text-gold font-display font-bold text-xs uppercase block tracking-wider mb-1">{t.introCard1Title}</span>
                        <p className="text-[11px] text-slate-cyber leading-relaxed">{t.introCard1Desc}</p>
                      </div>
                      <div className="bg-bg-obsidian/60 border border-border-dark p-4 rounded-2xl">
                        <span className="text-gold font-display font-bold text-xs uppercase block tracking-wider mb-1">{t.introCard2Title}</span>
                        <p className="text-[11px] text-slate-cyber leading-relaxed">{t.introCard2Desc}</p>
                      </div>
                      <div className="bg-bg-obsidian/60 border border-border-dark p-4 rounded-2xl">
                        <span className="text-gold font-display font-bold text-xs uppercase block tracking-wider mb-1">{t.introCard3Title}</span>
                        <p className="text-[11px] text-slate-cyber leading-relaxed">{t.introCard3Desc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border-dark pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2 text-xs text-slate-cyber font-mono">
                      <Clock className="h-4 w-4" />
                      <span>Análisis completado en &lt; 5 minutos</span>
                    </div>
                    <span className="text-[11px] text-slate-cyber text-center sm:text-right font-medium">
                      Selecciona un predio demo o presiona <strong className="text-gold font-semibold uppercase">Dibujar Predio</strong> en la cabecera.
                    </span>
                  </div>
                </div>
              )}

              {/* Visual GIS Map and drawing editor */}
              {(selectedParcel || isDrawing) && (
                <InteractiveMap
                  language={language}
                  currentParcel={selectedParcel}
                  points={activeAnalysis?.points || []}
                  selectedPoint={selectedPoint}
                  onSelectPoint={(pt) => handleSelectPoint(pt)}
                  activeLayer={activeLayer}
                  setActiveLayer={setActiveLayer}
                  isDrawing={isDrawing}
                  setIsDrawing={setIsDrawing}
                  customPolygon={customPolygon}
                  setCustomPolygon={setCustomPolygon}
                  onSaveCustomParcel={handleSaveCustomParcel}
                />
              )}

              {/* Bento grid panels showing results if analysis is completed */}
              {activeAnalysis && selectedParcel && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  
                  {/* Left Column Bento: Potential stats and Points list */}
                  <div className="md:col-span-7 space-y-5">
                    
                    {/* General analysis stats */}
                    <div className="bg-bg-graphite border border-border-dark rounded-2xl p-4 shadow-xl grid grid-cols-3 gap-3 shadow-gold/5">
                      <div className="bg-bg-obsidian rounded-xl p-3 border border-border-dark text-center">
                        <span className="text-[9px] uppercase tracking-wider text-slate-cyber font-bold block">GWPI Max</span>
                        <span className="text-2xl font-display font-extrabold text-gold">{activeAnalysis.gwpiMax}</span>
                        <span className="text-[9px] text-slate-cyber font-mono block mt-0.5">/100</span>
                      </div>
                      <div className="bg-bg-obsidian rounded-xl p-3 border border-border-dark text-center">
                        <span className="text-[9px] uppercase tracking-wider text-slate-cyber font-bold block">GWPI Promedio</span>
                        <span className="text-2xl font-display font-extrabold text-gold-light">{activeAnalysis.gwpiMean}</span>
                        <span className="text-[9px] text-slate-cyber font-mono block mt-0.5">/100</span>
                      </div>
                      <div className="bg-bg-obsidian rounded-xl p-3 border border-border-dark text-center">
                        <span className="text-[9px] uppercase tracking-wider text-slate-cyber font-bold block">Confianza</span>
                        <span className="text-2xl font-display font-extrabold text-cyber-cyan">{(activeAnalysis.confidence * 100).toFixed(0)}%</span>
                        <span className="text-[9px] text-cyber-cyan/60 font-mono block mt-0.5">ALTA</span>
                      </div>
                    </div>

                    {/* Points list Ranking */}
                    <div className="bg-bg-graphite border border-border-dark rounded-2xl p-4 shadow-xl shadow-gold/5">
                      <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider mb-3 flex items-center">
                        <MapIcon className="h-4 w-4 mr-1.5 text-gold animate-pulse" />
                        {t.pointsRank}
                      </h3>

                      <div className="space-y-2">
                        {activeAnalysis.points.map((p) => {
                          const isSelected = selectedPoint?.id === p.id;
                          return (
                            <button
                              key={p.id}
                              id={`point-select-card-${p.id}`}
                              onClick={() => handleSelectPoint(p)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-bg-obsidian border-gold/40 shadow-lg shadow-gold/5 text-white"
                                  : "bg-bg-obsidian/50 border-border-dark text-slate-cyber hover:bg-bg-card hover:text-white"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-xs ${
                                  isSelected ? "bg-gold text-bg-obsidian" : "bg-[#1A1A1D] text-slate-cyber"
                                }`}>
                                  {p.rank}
                                </div>
                                <div>
                                  <span className="text-xs font-semibold block">UTM Punto Recomendado {p.rank}</span>
                                  <span className="text-[9px] font-mono text-slate-cyber">
                                    Lat: {p.lat.toFixed(5)}° | Lng: {p.lng.toFixed(5)}° | Elev: {p.elevationM}m
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`text-sm font-display font-bold block ${isSelected ? "text-gold" : "text-slate-cyber"}`}>{p.gwpi}</span>
                                <span className="text-[9px] text-slate-cyber font-mono">GWPI Score</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explorable Point layers Breakdown progress meters */}
                    {selectedPoint && (
                      <div className="bg-bg-graphite border border-border-dark rounded-2xl p-4 shadow-xl shadow-gold/5">
                        <span className="text-[10px] uppercase font-bold text-slate-cyber tracking-[0.1em] mb-3.5 block">
                          Contribución de Capas de Datos — Punto {selectedPoint.rank}
                        </span>

                        <div className="space-y-2.5">
                          {selectedPoint.subscores.map((sub) => (
                            <div key={sub.factor}>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-medium text-[#E0E0E0]">{sub.label}</span>
                                <span className="font-mono text-slate-cyber">
                                  {sub.valueDescription} ({(sub.subscore * 10).toFixed(1)}/10)
                                </span>
                              </div>
                              <div className="w-full bg-bg-obsidian h-1.5 rounded-full overflow-hidden border border-border-dark">
                                <div
                                  className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-500"
                                  style={{ width: `${sub.subscore * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column Bento: Point deeply analyzed features & printable PDF triggers */}
                  <div className="md:col-span-5 space-y-5">
                    {/* Action buttons (Report printing / triggers) */}
                    <button
                      id="generate-report-btn"
                      onClick={handleGenerateReport}
                      className="w-full bg-bg-graphite hover:bg-[#1C1C1F] text-white font-bold text-xs py-3 px-4 rounded-2xl border border-border-dark shadow-xl flex items-center justify-center space-x-2.5 transition-all cursor-pointer shadow-gold/5"
                    >
                      <FileText className="h-4.5 w-4.5 text-gold animate-bounce" />
                      <span>{t.generateReport}</span>
                    </button>

                    {selectedPoint && (
                      <div className="bg-bg-graphite border border-border-dark rounded-2xl overflow-hidden shadow-xl shadow-gold/5">
                        {/* Section Tab bar inside details panel */}
                        <div className="bg-bg-obsidian/80 px-2 py-1 border-b border-border-dark flex overflow-x-auto gap-1">
                          {[
                            { id: "general", label: "Geología AI" },
                            { id: "geophysics", label: "Geofísica" },
                            { id: "well-design", label: "Pozo tubular" },
                            { id: "permits", label: "Trámites ANA" }
                          ].map((sec) => (
                            <button
                              key={sec.id}
                              id={`detail-sec-btn-${sec.id}`}
                              onClick={() => setActiveSection(sec.id as any)}
                              className={`text-[10px] px-2.5 py-2 font-bold tracking-wide rounded-lg whitespace-nowrap transition-all border cursor-pointer ${
                                activeSection === sec.id
                                  ? "bg-bg-obsidian text-gold border-border-dark shadow-sm shadow-gold/5"
                                  : "text-slate-cyber border-transparent hover:text-white"
                              }`}
                            >
                              {sec.label}
                            </button>
                          ))}
                        </div>

                        <div className="p-4 space-y-4 min-h-[300px]">
                          {activeSection === "general" && (
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center">
                                <Sparkles className="h-4 w-4 mr-1.5 text-gold" />
                                {t.aiExplain}
                              </h4>
                              
                              <div className="bg-bg-obsidian/80 rounded-xl p-3.5 border border-border-dark min-h-[220px]">
                                {isExplaining ? (
                                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                                    <span className="text-[10px] text-slate-cyber font-mono tracking-wider">{t.explainExplain}</span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-[#E0E0E0] leading-relaxed font-sans space-y-3">
                                    {explainText ? (
                                      explainText.split("\n\n").map((para, i) => {
                                        if (para.startsWith("###")) {
                                          return <h5 key={i} className="text-xs font-bold text-white uppercase mt-3 mb-1">{para.replace("###", "").trim()}</h5>;
                                        }
                                        return <p key={i}>{para}</p>;
                                      })
                                    ) : (
                                      <p>{language === "es" ? "Cargando análisis..." : "Loading report..."}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {activeSection === "geophysics" && (
                            <div className="space-y-4">
                              <div className="bg-bg-obsidian rounded-xl p-3 border border-border-dark">
                                <span className="text-[10px] text-slate-cyber block uppercase font-bold tracking-wider mb-2">
                                  {t.geophysicsPlan}
                                </span>
                                <div className="space-y-3">
                                  {activeAnalysis.geophysicalPlan.map((plan, idx) => (
                                    <div key={idx} className="border-l-2 border-gold/45 pl-3 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-white font-semibold">{plan.name}</span>
                                        <span className="text-[9px] bg-gold/10 text-gold border border-gold/25 px-1.5 py-0.2 rounded font-bold uppercase">{plan.priority}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-cyber leading-snug">{plan.recommendation}</p>
                                      <span className="block text-[10px] text-slate-cyber font-mono font-bold">Costo Ref: ${plan.estimatedCostUsd} USD</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Marketplace quotes lead sender */}
                              <div className="bg-bg-obsidian rounded-xl p-3 border border-border-dark space-y-3">
                                <span className="text-[10px] text-slate-cyber block uppercase font-bold tracking-wider flex items-center">
                                  <Briefcase className="h-3.5 w-3.5 text-gold mr-1.5" />
                                  {t.marketplaceTitle}
                                </span>
                                
                                {providers.slice(0, 1).map((prov) => {
                                  const leadSubmitted = leads.some((l) => l.providerId === prov.id);
                                  return (
                                    <div key={prov.id} className="bg-bg-graphite/60 p-3 rounded-lg border border-border-dark flex items-center justify-between">
                                      <div>
                                        <span className="text-xs text-white font-bold block">{prov.name}</span>
                                        <span className="text-[9px] text-slate-cyber block">Especialidad: ERT/SEV | Calificación: {prov.rating}★</span>
                                      </div>
                                      
                                      {!leadSubmitted ? (
                                        <button
                                          id={`quote-btn-${prov.id}`}
                                          onClick={() => handleSubmitLead(prov.id, selectedPoint.id)}
                                          className="bg-gold hover:bg-gold-light text-bg-obsidian font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                                        >
                                          {t.leadBtn}
                                        </button>
                                      ) : (
                                        <div className="bg-[#1A1A1D] text-gold border border-border-dark px-2.5 py-1 rounded-lg text-[9px] font-bold">
                                          {t.leadSuccess}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {activeSection === "well-design" && (
                            <WellProfileGraphic
                              language={language}
                              design={activeAnalysis.wellDesign}
                              gwpi={selectedPoint.gwpi}
                            />
                          )}

                          {activeSection === "permits" && (
                            <div className="space-y-3.5">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                {t.permitsCheck}
                              </h4>
                              
                              <div className="space-y-2 bg-bg-obsidian rounded-xl p-4.5 border border-border-dark">
                                {activeAnalysis.wellDesign.permitsChecklist.map((permit, idx) => (
                                  <div key={idx} className="flex items-start space-x-2.5">
                                    <div className="w-4 h-4 rounded-full border border-border-dark flex items-center justify-center shrink-0 mt-0.5">
                                      <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                                    </div>
                                    <span className="text-[11px] text-[#E0E0E0] leading-tight">{permit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Chat consultor panel */}
        {activeTab === "chat" && (
          <AiChatAssistant
            language={language}
            currentParcel={selectedParcel}
            currentAnalysis={activeAnalysis}
          />
        )}

        {/* Tab outcomes logging (the Moat) */}
        {activeTab === "outcomes" && (
          <OutcomeLogger
            language={language}
            currentParcel={selectedParcel}
            points={activeAnalysis?.points || []}
            onAddOutcome={handleAddOutcome}
            outcomes={outcomes}
          />
        )}
      </main>

      {/* FULL TECHNICAL NARRATED STUDY REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-bg-obsidian/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-graphite border border-border-dark rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-gold/10">
            {/* Modal Top controls */}
            <div className="bg-bg-obsidian/80 px-6 py-4 border-b border-border-dark flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-white uppercase tracking-wide flex items-center">
                  <FileText className="h-4.5 w-4.5 mr-2 text-gold" />
                  {language === "es" ? "Estudio de Pre-Factibilidad Integral — AquaFlow" : "Full Hydrogeological Assessment Study — AquaFlow"}
                </h3>
                <p className="text-[10px] text-slate-cyber font-sans mt-0.5">
                  Informe redactado automáticamente en base a datos multifactoriales
                </p>
              </div>
              <button
                id="close-report-modal-btn"
                onClick={() => setShowReportModal(false)}
                className="bg-bg-obsidian hover:bg-border-dark text-[#E0E0E0] border border-border-dark px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Document body text */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-bg-obsidian text-[#E0E0E0]">
              {isGeneratingReport ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gold" />
                  <span className="text-xs text-slate-cyber font-mono tracking-wider">{t.reportLoading}</span>
                </div>
              ) : (
                <div className="prose prose-invert prose-xs max-w-none">
                  {reportText.split("\n").map((line, idx) => {
                    const cleanLine = line.trim();
                    if (cleanLine.startsWith("# ")) {
                      return <h1 key={idx} className="text-2xl font-display font-extrabold text-white border-b border-border-dark pb-3 mb-6">{cleanLine.replace("# ", "")}</h1>;
                    }
                    if (cleanLine.startsWith("## ")) {
                      return <h2 key={idx} className="text-lg font-display font-bold text-white mt-6 mb-3">{cleanLine.replace("## ", "")}</h2>;
                    }
                    if (cleanLine.startsWith("### ")) {
                      return <h3 key={idx} className="text-xs font-bold text-gold-light uppercase tracking-wider mt-4 mb-2">{cleanLine.replace("### ", "")}</h3>;
                    }
                    if (cleanLine.startsWith("* ")) {
                      return <li key={idx} className="text-xs text-[#E0E0E0] mb-1.5 ml-4 list-disc">{cleanLine.replace("* ", "")}</li>;
                    }
                    if (cleanLine.startsWith("[ ]") || cleanLine.startsWith("[x]")) {
                      return (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-[#E0E0E0] mb-1">
                          <input type="checkbox" checked={cleanLine.startsWith("[x]")} disabled className="rounded border-border-dark text-gold focus:ring-gold" />
                          <span>{cleanLine.replace("[ ]", "").replace("[x]", "").trim()}</span>
                        </div>
                      );
                    }
                    if (cleanLine === "---") {
                      return <hr key={idx} className="border-border-dark my-6" />;
                    }
                    if (!cleanLine) return <div key={idx} className="h-2" />;
                    return <p key={idx} className="text-xs text-[#E0E0E0] leading-relaxed mb-4">{cleanLine}</p>;
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom toolbar */}
            <div className="bg-bg-obsidian/80 px-6 py-4 border-t border-border-dark flex items-center justify-between">
              <span className="text-[10px] text-slate-cyber font-mono">
                AquaFlow AI Report Engine v2.0
              </span>
              <button
                id="print-report-btn"
                onClick={() => window.print()}
                className="bg-gold hover:bg-gold-light text-bg-obsidian font-bold text-xs py-1.5 px-4 rounded-xl shadow-md cursor-pointer"
              >
                Imprimir / Exportar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
