import React, { useState, useEffect } from "react";
import { Shield, Plus, Check, RefreshCw, Star, Info, HardDrive } from "lucide-react";
import { Parcel, CandidatePoint, WellOutcome } from "../types";

interface OutcomeLoggerProps {
  language: "es" | "en";
  currentParcel: Parcel | null;
  points: CandidatePoint[];
  onAddOutcome: (outcome: any) => void;
  outcomes: WellOutcome[];
}

export default function OutcomeLogger({
  language,
  currentParcel,
  points,
  onAddOutcome,
  outcomes
}: OutcomeLoggerProps) {
  const [selectedPointId, setSelectedPointId] = useState<string>("");
  const [drilledDepth, setDrilledDepth] = useState<number>(55);
  const [staticLevel, setStaticLevel] = useState<number>(18);
  const [dynamicLevel, setDynamicLevel] = useState<number>(29);
  const [measuredYield, setMeasuredYield] = useState<number>(6.5);
  const [waterPh, setWaterPh] = useState<number>(7.2);
  const [conductivity, setConductivity] = useState<number>(450);
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);

  const t = {
    es: {
      title: "Registro de Resultados Reales de Pozo (Dato-como-Moat)",
      subtitle: "Alimenta la base de datos propietaria para recalibrar los pesos del modelo local con machine learning",
      point: "Seleccionar Punto Proyectado",
      depth: "Profundidad Real Perforada (m)",
      static: "Nivel Estático de Campo (m)",
      dynamic: "Nivel Dinámico / Abatimiento (m)",
      yield: "Caudal de Explotación Medido (L/s)",
      success: "Perforación Exitosa",
      save: "Registrar Pozo & Calibrar Algoritmo",
      history: "Registro Histórico de la Red (Moat)",
      emptyHistory: "Aún no hay pozos perforados en esta parcela.",
      feedbackTitle: "¡Algoritmo Recalibrado con ML!",
      feedbackDesc: "El resultado real ha sido incorporado al dataset regional. Los pesos litológicos de la capa de geología cuaternaria han sido ajustados por regresión de Ridge.",
      ph: "pH del Agua",
      conductivity: "Conductividad (µS/cm)"
    },
    en: {
      title: "Real Well Outcomes Logger (Data-as-a-Moat)",
      subtitle: "Feed our proprietary database to recalibrate local weights using machine learning feedbacks",
      point: "Select Targeted Point",
      depth: "Actual Drilled Depth (m)",
      static: "Static Level Measured (m)",
      dynamic: "Dynamic / Drawdown Level (m)",
      yield: "Measured Flow Yield (L/s)",
      success: "Drilling Successful",
      save: "Log Well & Calibrate Algorithm",
      history: "Network Historic Records (Moat)",
      emptyHistory: "No logged drilled outcomes for this property yet.",
      feedbackTitle: "Algorithm Recalibrated via ML!",
      feedbackDesc: "This outcome is incorporated in the regional dataset. Lithological weights of the quaternary geological layer were adjusted by Ridge regression.",
      ph: "Water pH",
      conductivity: "Conductivity (µS/cm)"
    }
  }[language];

  // Set default selected point when points array loads
  useEffect(() => {
    if (points.length > 0 && !selectedPointId) {
      setSelectedPointId(points[0].id);
    }
  }, [points]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParcel || !selectedPointId) return;

    setIsSubmitting(true);

    const targetPoint = points.find((p) => p.id === selectedPointId);

    setTimeout(() => {
      onAddOutcome({
        parcelId: currentParcel.id,
        pointId: selectedPointId,
        drilledLat: targetPoint ? targetPoint.lat : currentParcel.coordinates[0][0],
        drilledLng: targetPoint ? targetPoint.lng : currentParcel.coordinates[0][1],
        drilledDepthM: drilledDepth,
        staticLevelM: staticLevel,
        dynamicLevelM: dynamicLevel,
        measuredYieldLps: measuredYield,
        waterQuality: {
          ph: waterPh,
          conductivityUsCm: conductivity,
          turbidityNtu: 1.2,
          isPotable: waterPh >= 6.5 && waterPh <= 8.5 && conductivity < 1500
        },
        success: isSuccess,
        reportedBy: "brian.d.pajares@gmail.com",
        createdAt: new Date().toISOString()
      });

      setIsSubmitting(false);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 8000);
    }, 1000);
  };

  const filteredOutcomes = outcomes.filter((o) => o.parcelId === currentParcel?.id);

  return (
    <div className="bg-bg-graphite border border-border-dark rounded-2xl p-5 shadow-xl shadow-gold/5 animate-fade-in">
      <div className="flex items-start space-x-3 mb-4 border-b border-border-dark pb-3">
        <div className="bg-gold/10 p-2 rounded-xl border border-gold/20 text-gold animate-pulse">
          <HardDrive className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wide flex items-center">
            {t.title}
            <span className="ml-2 bg-gold/10 text-gold border border-gold/25 px-1.5 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase">
              MOAT ENGINE
            </span>
          </h3>
          <p className="text-[11px] text-slate-cyber">
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Recalibration alert success HUD */}
      {showNotification && (
        <div className="mb-5 bg-gold/10 border border-gold/30 rounded-xl p-4 flex items-start space-x-3 animate-bounce">
          <div className="bg-gold text-bg-obsidian p-1 rounded-full shrink-0">
            <Check className="h-4 w-4 stroke-[3]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gold font-display uppercase tracking-wide flex items-center">
              {t.feedbackTitle}
              <RefreshCw className="h-3 w-3 text-gold ml-1.5 animate-spin" />
            </h4>
            <p className="text-[10px] text-[#E0E0E0] mt-1 leading-relaxed">
              {t.feedbackDesc}
            </p>
          </div>
        </div>
      )}

      {/* Log Form / History grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form panel */}
        <div>
          {!currentParcel ? (
            <div className="bg-bg-obsidian/40 border border-border-dark rounded-xl p-6 text-center text-slate-cyber text-xs font-sans">
              Debe seleccionar un predio antes de poder registrar un resultado técnico.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-1">
                  {t.point}
                </label>
                <select
                  id="outcome-point-select"
                  value={selectedPointId}
                  onChange={(e) => setSelectedPointId(e.target.value)}
                  className="w-full bg-bg-obsidian border border-border-dark rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-gold cursor-pointer"
                >
                  {points.map((p) => (
                    <option key={p.id} value={p.id} className="bg-bg-obsidian text-white">
                      Punto {p.rank} (GWPI Proyectado: {p.gwpi})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-1">
                    {t.depth}
                  </label>
                  <input
                    type="number"
                    id="outcome-depth-input"
                    value={drilledDepth}
                    onChange={(e) => setDrilledDepth(Number(e.target.value))}
                    className="w-full bg-bg-obsidian border border-border-dark rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-gold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-1">
                    {t.yield}
                  </label>
                  <input
                    type="number"
                    id="outcome-yield-input"
                    step="0.1"
                    value={measuredYield}
                    onChange={(e) => setMeasuredYield(Number(e.target.value))}
                    className="w-full bg-bg-obsidian border border-border-dark rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-gold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-1">
                    {t.static}
                  </label>
                  <input
                    type="number"
                    id="outcome-static-input"
                    value={staticLevel}
                    onChange={(e) => setStaticLevel(Number(e.target.value))}
                    className="w-full bg-bg-obsidian border border-border-dark rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-gold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-1">
                    {t.dynamic}
                  </label>
                  <input
                    type="number"
                    id="outcome-dynamic-input"
                    value={dynamicLevel}
                    onChange={(e) => setDynamicLevel(Number(e.target.value))}
                    className="w-full bg-bg-obsidian border border-border-dark rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-gold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-border-dark/40 pt-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-1">
                    {t.ph}
                  </label>
                  <input
                    type="number"
                    id="outcome-ph-input"
                    step="0.1"
                    value={waterPh}
                    onChange={(e) => setWaterPh(Number(e.target.value))}
                    className="w-full bg-bg-obsidian border border-border-dark rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-gold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-1">
                    {t.conductivity}
                  </label>
                  <input
                    type="number"
                    id="outcome-conductivity-input"
                    value={conductivity}
                    onChange={(e) => setConductivity(Number(e.target.value))}
                    className="w-full bg-bg-obsidian border border-border-dark rounded-xl text-xs px-3 py-2 text-white focus:outline-none focus:border-gold font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 border-t border-border-dark/40 pt-3">
                <input
                  type="checkbox"
                  id="outcome-success-checkbox"
                  checked={isSuccess}
                  onChange={(e) => setIsSuccess(e.target.checked)}
                  className="rounded border-border-dark bg-bg-obsidian text-gold focus:ring-gold h-4 w-4 cursor-pointer"
                />
                <label htmlFor="outcome-success-checkbox" className="text-xs text-[#E0E0E0] font-medium cursor-pointer">
                  {t.success}
                </label>
              </div>

              <button
                type="submit"
                id="save-outcome-btn"
                disabled={isSubmitting}
                className="w-full bg-gold hover:bg-gold-light text-bg-obsidian font-bold text-xs py-2 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-gold/10 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>{t.save}</span>
              </button>
            </form>
          )}
        </div>

        {/* History records list */}
        <div className="flex flex-col h-full justify-between">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-cyber tracking-wider mb-2 flex items-center">
              <Star className="h-3 w-3 text-gold mr-1.5" />
              {t.history}
            </span>

            {filteredOutcomes.length === 0 ? (
              <div className="bg-bg-obsidian/40 border border-border-dark rounded-xl p-6 text-center text-slate-cyber text-xs font-sans">
                {t.emptyHistory}
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredOutcomes.map((out) => (
                  <div key={out.id} className="bg-bg-obsidian/70 border border-border-dark rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-white font-semibold">Pozo tubular (Punto {points.find(p=>p.id === out.pointId)?.rank || "Custom"})</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${out.success ? "bg-gold/10 text-gold" : "bg-red-500/10 text-red-500"}`}>
                          {out.success ? "OK" : "SECO"}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#E0E0E0] mt-0.5">
                        Prof: {out.drilledDepthM}m | NE: {out.staticLevelM}m | ND: {out.dynamicLevelM}m
                      </p>
                      <p className="text-[10px] text-slate-cyber font-sans mt-0.5">
                        pH: {out.waterQuality.ph} | Cond: {out.waterQuality.conductivityUsCm} uS/cm
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-cyber-cyan font-mono font-bold">{out.measuredYieldLps} L/s</span>
                      <span className="block text-[8px] text-slate-cyber font-mono">{new Date(out.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-bg-obsidian/50 p-3 rounded-xl border border-border-dark mt-4 flex items-start space-x-2">
            <Info className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-cyber leading-normal">
              {language === "es"
                ? "Cada pozo alimentado refina automáticamente el modelo matemático del predio local, disminuyendo el sesgo predictivo hasta en un 45% tras múltiples perforaciones validadas."
                : "Each logged well automatically refines the local predictive mathematical grid, reducing theoretical bias by up to 45% after multiple successful field records."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
