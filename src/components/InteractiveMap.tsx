import React, { useState, useRef, useEffect } from "react";
import { Layers, Compass, Move, Maximize2, MousePointer, Edit3, PlusCircle, Check, Trash2, Upload, AlertCircle } from "lucide-react";
import { Parcel, CandidatePoint } from "../types";

interface InteractiveMapProps {
  language: "es" | "en";
  currentParcel: Parcel | null;
  points: CandidatePoint[];
  selectedPoint: CandidatePoint | null;
  onSelectPoint: (point: CandidatePoint) => void;
  activeLayer: "gwpi" | "geologia" | "lineamientos" | "twi" | "ndvisecco" | "drenaje";
  setActiveLayer: (layer: "gwpi" | "geologia" | "lineamientos" | "twi" | "ndvisecco" | "drenaje") => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
  customPolygon: [number, number][];
  setCustomPolygon: (poly: [number, number][]) => void;
  onSaveCustomParcel: (name: string, coords: [number, number][]) => void;
}

export default function InteractiveMap({
  language,
  currentParcel,
  points,
  selectedPoint,
  onSelectPoint,
  activeLayer,
  setActiveLayer,
  isDrawing,
  setIsDrawing,
  customPolygon,
  setCustomPolygon,
  onSaveCustomParcel
}: InteractiveMapProps) {
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({ lat: -12.0463, lng: -77.0427 });
  const [zoom, setZoom] = useState<number>(14);
  const [customName, setCustomName] = useState<string>("");
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");

  const canvasRef = useRef<HTMLDivElement>(null);

  const t = {
    es: {
      layers: "Capas Temáticas",
      drawHelp: "Haz clic en la cuadrícula para añadir vértices. Mínimo 3 puntos para cerrar.",
      clearDraw: "Limpiar dibujo",
      closeDraw: "Cerrar Polígono y Analizar",
      drawBtn: "Dibujar Predio",
      cancelDraw: "Cancelar",
      polygonName: "Nombre del Predio",
      saveAnalysis: "Guardar y Ejecutar Análisis",
      layersDesc: "Cambia de capa para observar la correlación espectral y litológica:",
      noParcel: "Dibuja un predio o selecciona uno pre-cargado de la izquierda para iniciar.",
      dragDrop: "Arrastra y suelta tu archivo KMZ, KML o GeoJSON aquí",
      dragDropOr: "o haz clic para explorar en tu disco duro",
      coordsTracker: "Coordenadas UTM / EPSG:4326"
    },
    en: {
      layers: "Thematic Layers",
      drawHelp: "Click on the grid to add vertices. Minimum 3 points to close.",
      clearDraw: "Clear Drawing",
      closeDraw: "Close Polygon & Analyze",
      drawBtn: "Draw Property",
      cancelDraw: "Cancel",
      polygonName: "Property Name",
      saveAnalysis: "Save & Run Analysis",
      layersDesc: "Switch layers to observe spectral and lithological correlation:",
      noParcel: "Draw a property or select a pre-loaded one from the left to start.",
      dragDrop: "Drag & drop your KMZ, KML or GeoJSON file here",
      dragDropOr: "or click to browse your local disk",
      coordsTracker: "UTM / EPSG:4326 Coordinates Tracker"
    }
  }[language];

  // Base coordinates translation helper for our high-fidelity virtual GIS Canvas
  // Centered around the current parcel, or a default Lima coordinates
  const centroid = currentParcel
    ? getCentroid(currentParcel.coordinates)
    : customPolygon.length > 0
    ? getCentroid(customPolygon)
    : { lat: -12.046374, lng: -77.042793 };

  function getCentroid(coords: [number, number][]) {
    let latSum = 0;
    let lngSum = 0;
    coords.forEach(([lat, lng]) => {
      latSum += lat;
      lngSum += lng;
    });
    return { lat: latSum / coords.length, lng: lngSum / coords.length };
  }

  // Handle map cursor mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixels to realistic relative coordinates around centroid
    const dLat = ((rect.height / 2 - y) / rect.height) * 0.015;
    const dLng = ((x - rect.width / 2) / rect.width) * 0.018;

    setCursorCoords({
      lat: centroid.lat + dLat,
      lng: centroid.lng + dLng
    });
  };

  // Click on map to draw custom polygon
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dLat = ((rect.height / 2 - y) / rect.height) * 0.015;
    const dLng = ((x - rect.width / 2) / rect.width) * 0.018;

    const clickLat = centroid.lat + dLat;
    const clickLng = centroid.lng + dLng;

    setCustomPolygon([...customPolygon, [clickLat, clickLng]]);
  };

  // Handle file drop (KMZ/KML/GeoJSON mock parser)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const parseMockKml = (fileName: string) => {
    // Generate a beautiful, realistic randomized polygon representing the imported KML file
    const rootLat = -12.046 + (Math.random() - 0.5) * 0.08;
    const rootLng = -77.042 + (Math.random() - 0.5) * 0.08;
    const sides = 5 + Math.floor(Math.random() * 3);
    const coords: [number, number][] = [];
    
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const r = 0.003 + Math.random() * 0.002;
      coords.push([rootLat + Math.sin(angle) * r, rootLng + Math.cos(angle) * r]);
    }

    const mockParcelName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    onSaveCustomParcel(mockParcelName, coords);
    setUploadError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "kml" || ext === "kmz" || ext === "geojson" || ext === "json" || ext === "shp") {
        parseMockKml(file.name);
      } else {
        setUploadError(language === "es" ? "Formato no soportado. Suba archivos .KML, .KMZ o .GeoJSON" : "Unsupported format. Please upload .KML, .KMZ or .GeoJSON files");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      parseMockKml(file.name);
    }
  };

  // Convert relative coordinates to SVG pixel space (centered around box of 1000x1000)
  const getSvgCoords = (coords: [number, number][]) => {
    if (coords.length === 0) return "";
    return coords
      .map(([lat, lng]) => {
        const dy = lat - centroid.lat;
        const dx = lng - centroid.lng;
        // Map degrees to SVG coordinates
        const x = 500 + dx * 32000;
        const y = 500 - dy * 36000;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const pointToSvg = (lat: number, lng: number) => {
    const dy = lat - centroid.lat;
    const dx = lng - centroid.lng;
    return {
      x: 500 + dx * 32000,
      y: 500 - dy * 36000
    };
  };

  return (
    <div className="bg-bg-graphite rounded-2xl border border-border-dark overflow-hidden shadow-2xl flex flex-col h-[650px] relative shadow-gold/5">
      {/* Upper GIS Dashboard Control Header */}
      <div className="bg-bg-obsidian/70 px-4 py-3 border-b border-border-dark flex flex-wrap items-center justify-between gap-3 z-10 animate-fade-in">
        <div className="flex items-center space-x-2">
          <Compass className="h-5 w-5 text-gold animate-spin-slow" />
          <h2 className="text-sm font-display font-semibold text-white tracking-wide uppercase">
            {language === "es" ? "Visor Espacial de Pre-Factibilidad" : "Spatial Pre-Feasibility Viewer"}
          </h2>
        </div>

        {/* Drawing Controls */}
        <div className="flex space-x-2">
          {!isDrawing ? (
            <button
              id="start-draw-btn"
              onClick={() => {
                setIsDrawing(true);
                setCustomPolygon([]);
              }}
              className="bg-gold hover:bg-gold-light text-bg-obsidian text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t.drawBtn}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-gold font-mono animate-pulse hidden md:inline">
                ● DRAWING MODE
              </span>
              <button
                id="cancel-draw-btn"
                onClick={() => {
                  setIsDrawing(false);
                  setCustomPolygon([]);
                }}
                className="bg-bg-obsidian hover:bg-border-dark text-[#E0E0E0] border border-border-dark text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
              >
                {t.cancelDraw}
              </button>
              {customPolygon.length > 0 && (
                <button
                  id="clear-draw-btn"
                  onClick={() => setCustomPolygon([])}
                  className="text-red-500 hover:bg-red-500/10 text-xs font-medium p-1.5 rounded-lg transition-all"
                  title={t.clearDraw}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Map Rendering Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Layer selector floats */}
        <div className="absolute top-4 left-4 z-20 flex flex-col space-y-1 bg-bg-obsidian/85 backdrop-blur-md p-2 rounded-xl border border-border-dark w-52 shadow-xl shadow-gold/5">
          <span className="text-[10px] text-slate-cyber font-bold uppercase tracking-[0.1em] px-2 mb-1 flex items-center">
            <Layers className="h-3 w-3 mr-1.5 text-gold" />
            {t.layers}
          </span>
          {[
            { id: "gwpi", label: "Groundwater (GWPI)", desc: "Heatmap de potencial hídrico" },
            { id: "geologia", label: "Geología Local", desc: "Contactos litológicos" },
            { id: "lineamientos", label: "Estructuras / Fallas", desc: "Lineamientos estructurales" },
            { id: "twi", label: "Acumulación TWI", desc: "Humedad topográfica" },
            { id: "ndvisecco", label: "Verdor Seco (NDVI)", desc: "Humedad de vegetación" },
            { id: "drenaje", label: "Red Hidrográfica", desc: "Red de drenaje fluvial" }
          ].map((layer) => (
            <button
              key={layer.id}
              id={`layer-toggle-${layer.id}`}
              onClick={() => setActiveLayer(layer.id as any)}
              className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex flex-col ${
                activeLayer === layer.id
                  ? "bg-bg-graphite text-white font-medium border-l-2 border-gold pl-2 border border-border-dark"
                  : "text-slate-cyber border border-transparent hover:bg-bg-obsidian hover:text-white"
              }`}
            >
              <span className="font-medium text-[11px]">{layer.label}</span>
              <span className="text-[9px] text-slate-cyber font-sans leading-tight">{layer.desc}</span>
            </button>
          ))}
        </div>

        {/* Map Grid / Interactive GIS Container */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleMapClick}
          className={`flex-1 relative cursor-crosshair bg-[radial-gradient(#2A2A2C_1px,transparent_1px)] [background-size:24px_24px] overflow-hidden ${
            isDrawing ? "border-2 border-dashed border-gold/45" : ""
          }`}
        >
          {/* Layer Programmatic Background Rendering */}
          <div className="absolute inset-0 z-0 select-none opacity-40 pointer-events-none transition-all">
            {activeLayer === "gwpi" && (
              <div className="w-full h-full bg-gradient-to-tr from-[#C9A227]/10 via-[#F5D170]/15 to-[#00E5FF]/20 relative animate-fade-in">
                <div className="absolute top-[25%] left-[30%] w-96 h-96 rounded-full bg-cyber-cyan/20 blur-[80px]" />
                <div className="absolute bottom-[20%] right-[35%] w-72 h-72 rounded-full bg-gold/15 blur-[70px]" />
              </div>
            )}
            {activeLayer === "geologia" && (
              <div className="w-full h-full bg-bg-obsidian relative animate-fade-in">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-[#132A13]/20 border-r border-dashed border-emerald-500/10" />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-amber-950/15" />
                <div className="absolute top-[35%] left-[20%] w-80 h-80 rounded-full bg-emerald-500/10 blur-[60px]" />
              </div>
            )}
            {activeLayer === "lineamientos" && (
              <div className="w-full h-full bg-[linear-gradient(45deg,#141417_25%,transparent_25%),linear-gradient(-45deg,#141417_25%,transparent_25%)] [background-size:40px_40px] opacity-15 animate-fade-in" />
            )}
            {activeLayer === "twi" && (
              <div className="w-full h-full bg-bg-obsidian relative animate-fade-in">
                {/* Simulated high-quality hydrological flow streams */}
                <div className="absolute top-[10%] left-[10%] w-[80%] h-1 bg-gradient-to-r from-cyber-cyan/10 via-cyber-cyan/35 to-cyber-cyan/10 rotate-12 blur-[1px]" />
                <div className="absolute top-[30%] left-[25%] w-[60%] h-1 bg-gradient-to-r from-cyber-cyan/10 via-cyber-cyan/35 to-cyber-cyan/10 rotate-[15deg] blur-[1px]" />
                <div className="absolute top-[48%] left-[5%] w-[90%] h-1 bg-gradient-to-r from-cyber-cyan/10 via-cyber-cyan/45 to-cyber-cyan/10 rotate-[8deg] blur-[2px]" />
                <div className="absolute bottom-[20%] left-[15%] w-[70%] h-1 bg-gradient-to-r from-cyber-cyan/10 via-cyber-cyan/35 to-cyber-cyan/10 rotate-12 blur-[1px]" />
              </div>
            )}
            {activeLayer === "ndvisecco" && (
              <div className="w-full h-full bg-bg-obsidian relative animate-fade-in">
                <div className="absolute top-[45%] left-[10%] w-[75%] h-[120px] rounded-full bg-lime-500/10 blur-[45px] rotate-6" />
                <div className="absolute top-[15%] left-[35%] w-[45%] h-[80px] rounded-full bg-emerald-500/10 blur-[40px] rotate-12" />
              </div>
            )}
            {activeLayer === "drenaje" && (
              <div className="w-full h-full bg-bg-obsidian relative animate-fade-in">
                <div className="absolute top-[48%] left-0 w-full h-[6px] bg-cyber-cyan/20 blur-[3px] rotate-[8deg]" />
                <div className="absolute top-[48%] left-0 w-full h-[1.5px] bg-cyber-cyan/40 rotate-[8deg]" />
                <div className="absolute top-[25%] left-[45%] w-1/2 h-[3px] bg-cyber-cyan/15 blur-[2px] rotate-[28deg]" />
                <div className="absolute top-[25%] left-[45%] w-1/2 h-[1px] bg-cyber-cyan/30 rotate-[28deg]" />
              </div>
            )}
          </div>

          {/* Fallback drag-and-drop placeholder if no parcel and not drawing */}
          {!currentParcel && !isDrawing && customPolygon.length === 0 && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center transition-all ${
                dragOver ? "bg-gold/10 border-4 border-gold" : "bg-bg-obsidian/85"
              }`}
            >
              <div className="bg-bg-graphite p-4 rounded-full border border-border-dark shadow-xl mb-4 text-gold shadow-gold/5">
                <Upload className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="text-white font-semibold text-sm font-display mb-1">
                {t.dragDrop}
              </h3>
              <p className="text-xs text-slate-cyber max-w-sm mb-4">
                {t.dragDropOr}
              </p>

              {/* Browse Hidden Trigger */}
              <label className="bg-gold/10 hover:bg-gold/20 text-gold text-xs font-semibold px-4 py-2 rounded-xl border border-gold/30 transition-all cursor-pointer">
                <span>{language === "es" ? "Explorar Archivos" : "Browse Files"}</span>
                <input
                  type="file"
                  accept=".kml,.kmz,.geojson,.json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {uploadError && (
                <div className="flex items-center space-x-1.5 mt-4 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="text-[10px] text-slate-cyber font-mono mt-8 border-t border-border-dark pt-4 w-full max-w-xs">
                {t.noParcel}
              </div>
            </div>
          )}

          {/* SVG Vector Drawing Workspace */}
          <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            {/* RENDER CURRENT PARCEL POLYGON */}
            {currentParcel && (
              <g>
                {/* Outer shadow/fill */}
                <polygon
                  points={getSvgCoords(currentParcel.coordinates)}
                  className="fill-cyber-cyan/5 stroke-cyber-cyan/70 stroke-[2.5] transition-all"
                  strokeDasharray="10 5"
                />
                {/* Pulsing boundary glow */}
                <polygon
                  points={getSvgCoords(currentParcel.coordinates)}
                  className="fill-transparent stroke-cyber-cyan/15 stroke-[8] animate-pulse"
                />
              </g>
            )}

            {/* RENDER CUSTOM DRAWN POLYGON */}
            {isDrawing && customPolygon.length > 0 && (
              <g>
                <polygon
                  points={getSvgCoords(customPolygon)}
                  className="fill-gold/10 stroke-gold/80 stroke-[2.5]"
                  strokeDasharray="5 5"
                />
                {customPolygon.map((coord, idx) => {
                  const pt = pointToSvg(coord[0], coord[1]);
                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6"
                        className="fill-gold stroke-bg-obsidian stroke-[2] pointer-events-auto cursor-pointer"
                      />
                      <text
                        x={pt.x + 10}
                        y={pt.y + 4}
                        className="fill-gold font-mono text-[10px] bg-bg-obsidian font-bold"
                      >
                        V{idx + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* DRAW GEOLOGICAL FAULT LINEAMENTS OVERLAYS */}
            {activeLayer === "lineamientos" && (
              <g>
                {/* Fault lines */}
                <line x1="200" y1="200" x2="800" y2="800" className="stroke-red-500/40 stroke-[4]" strokeDasharray="15 5" />
                <line x1="800" y1="200" x2="300" y2="900" className="stroke-red-400/30 stroke-[2]" />
                <line x1="100" y1="500" x2="900" y2="580" className="stroke-purple-500/30 stroke-[3]" strokeDasharray="10 10" />
                
                {/* Geological annotations */}
                <text x="540" y="520" className="fill-red-400 font-mono text-[9px] font-bold opacity-75 uppercase">Falla Principal San Ramón (Normal)</text>
                <text x="320" y="780" className="fill-purple-400 font-mono text-[9px] font-bold opacity-60 uppercase">Fracturamiento Secundario</text>
              </g>
            )}

            {/* RENDER CANDIDATE POINTS */}
            {!isDrawing && points.length > 0 && points.map((p) => {
              const pt = pointToSvg(p.lat, p.lng);
              const isSelected = selectedPoint?.id === p.id;
              
              return (
                <g key={p.id} className="pointer-events-auto cursor-pointer" onClick={() => onSelectPoint(p)}>
                  {/* Outer Radar Waves */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? "32" : "18"}
                    className={`${isSelected ? "fill-cyber-cyan/10 stroke-cyber-cyan/40" : "fill-gold/5 stroke-gold/20"} stroke-[1.5] transition-all`}
                  />
                  {/* Outer Solid Ring */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? "18" : "10"}
                    className={`${isSelected ? "fill-bg-obsidian/90 stroke-cyber-cyan" : "fill-[#1A1A1D]/80 stroke-gold"} stroke-[2.5] transition-all`}
                  />
                  {/* Center Dot */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    className={`${isSelected ? "fill-cyber-cyan animate-pulse" : "fill-gold"} transition-all`}
                  />
                  {/* Point Label Card overlay */}
                  <g transform={`translate(${pt.x + 14}, ${pt.y - 12})`}>
                    <rect
                      width="72"
                      height="24"
                      rx="4"
                      className={`${isSelected ? "fill-cyber-cyan stroke-cyber-cyan" : "fill-bg-obsidian/95 stroke-border-dark"} stroke-[1.5]`}
                    />
                    <text
                      x="6"
                      y="16"
                      className={`${isSelected ? "fill-bg-obsidian font-bold" : "fill-[#E0E0E0]"} font-sans text-[10px] font-medium`}
                    >
                      Punto {p.rank} ({p.gwpi})
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Coordinate grid lines labels */}
          <div className="absolute bottom-2 left-2 bg-bg-obsidian/85 border border-border-dark px-2 py-1 rounded text-[9px] font-mono text-slate-cyber z-10 select-none animate-fade-in">
            LAT: {cursorCoords.lat.toFixed(5)}° | LNG: {cursorCoords.lng.toFixed(5)}°
          </div>

          <div className="absolute bottom-2 right-2 bg-bg-obsidian/85 border border-border-dark px-2 py-1 rounded text-[9px] font-mono text-slate-cyber z-10 select-none animate-fade-in">
            Zoom: {zoom}x | CRS: EPSG:4326 (WGS84)
          </div>

          {/* Float Help banner during drawing mode */}
          {isDrawing && (
            <div className="absolute top-4 right-4 bg-gold/10 border border-gold/30 px-3 py-2 rounded-xl text-xs text-gold-light font-sans z-20 flex items-center space-x-2 shadow-lg max-w-xs backdrop-blur-md animate-fade-in">
              <PlusCircle className="h-4 w-4 animate-spin-slow text-gold" />
              <span>{t.drawHelp}</span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Drawing Submission Bar */}
      {isDrawing && customPolygon.length >= 3 && (
        <div className="bg-bg-obsidian/95 border-t border-border-dark px-4 py-3 z-20 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-2xl">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <span className="text-xs text-slate-cyber font-medium whitespace-nowrap">{t.polygonName}:</span>
            <input
              type="text"
              id="draw-parcel-name-input"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Ej. Fundo Zapotal"
              className="bg-bg-graphite border border-border-dark rounded-lg text-xs px-2.5 py-1.5 text-white focus:outline-none focus:border-gold flex-1"
            />
          </div>
          <button
            id="save-draw-parcel-btn"
            onClick={() => {
              onSaveCustomParcel(customName || "Mi Predio Dibujado", customPolygon);
              setIsDrawing(false);
              setCustomName("");
            }}
            className="bg-gold hover:bg-gold-light text-bg-obsidian font-bold text-xs px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>{t.saveAnalysis}</span>
          </button>
        </div>
      )}
    </div>
  );
}
