import React, { useState } from "react";
import { Info, HelpCircle, ArrowRight, Layers, FileText } from "lucide-react";
import { WellDesign } from "../types";

interface WellProfileGraphicProps {
  language: "es" | "en";
  design: WellDesign;
  gwpi: number;
}

export default function WellProfileGraphic({
  language,
  design,
  gwpi
}: WellProfileGraphicProps) {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const isPeru = design.permitsChecklist.some((p) => p.includes("ANA") || p.includes("Nacional"));

  const t = {
    es: {
      title: "Perfil de Diseño Preliminar de Pozo",
      subtitle: "Diagrama constructivo estimado basado en modelo litológico",
      depth: "Profundidad",
      casing: "Entubado PVC",
      screens: "Filtros Johnson",
      gravel: "Pre-filtro de Grava",
      static: "Nivel Estático (Reposo)",
      dynamic: "Nivel Dinámico (Bombeo)",
      drawdown: "Abatimiento",
      bedrock: "Sótano Geológico",
      diameter: "Diámetro Encamisado",
      aquifer: "Tipo Acuífero",
      yield: "Caudal Explotación",
      infoAlert: "Este diseño es preliminar e indicativo. Requiere confirmación por tomografía eléctrica y diseño definitivo firmado por ingeniero colegiado antes de perforar."
    },
    en: {
      title: "Preliminary Well Design Profile",
      subtitle: "Estimated constructive logging based on litological model",
      depth: "Depth",
      casing: "PVC Casing",
      screens: "Johnson Screens",
      gravel: "Gravel Pack",
      static: "Static Level (Rest)",
      dynamic: "Dynamic Level (Pumping)",
      drawdown: "Drawdown Cone",
      bedrock: "Geological Bedrock",
      diameter: "Casing Diameter",
      aquifer: "Aquifer Type",
      yield: "Exploitation Yield",
      infoAlert: "This design is preliminary and advisory. Requires validation by electrical resistivity tomography and final logging signed by a certified professional engineer."
    }
  }[language];

  // Stratigraphy layers based on country profiles
  const strata = isPeru
    ? [
        { id: "s1", name: "Limos / Coluviales", depth: "0 - 4.5m", color: "fill-amber-950/10 stroke-amber-900/30", hatch: "clay", desc: "Suelo franco y limo de permeabilidad baja-media." },
        { id: "s2", name: "Gravas y Arenas (Acuífero)", depth: "4.5 - 28m", color: "fill-gold/10 stroke-gold-light/25", hatch: "gravel", desc: "Conglomerado de alta porosidad primaria. Excelente conductividad hídrica." },
        { id: "s3", name: "Limos Arcillosos (Sello)", depth: "28 - 45m", color: "fill-slate-800/15 stroke-slate-700/25", hatch: "silt", desc: "Estrato confinante de limos y arcillas compactas." },
        { id: "s4", name: "Sótano Volcánico (Basalto)", depth: "45m+", color: "fill-slate-950/20 stroke-slate-900/30", hatch: "rock", desc: "Roca basáltica masiva con fisuración secundaria localizada." }
      ]
    : [
        { id: "s1", name: "Suelos / Arenas", depth: "0 - 8m", color: "fill-amber-950/10 stroke-amber-900/30", hatch: "clay", desc: "Suelo superficial franco-arenoso altamente permeable." },
        { id: "s2", name: "Volcánico Fisurado", depth: "8 - 35m", color: "fill-slate-800/15 stroke-slate-700/25", hatch: "rock", desc: "Lavas basálticas diaclasadas con alta permeabilidad secundaria." },
        { id: "s3", name: "Arcillas Impermeables", depth: "35 - 50m", color: "fill-rose-950/10 stroke-rose-900/25", hatch: "silt", desc: "Horizonte impermeable arcilloso." },
        { id: "s4", name: "Sótano Intrusivo Duro", depth: "50m+", color: "fill-slate-950/25 stroke-slate-900/35", hatch: "rock", desc: "Roca plutónica masiva impermeable." }
      ];

  return (
    <div className="bg-bg-graphite border border-border-dark rounded-2xl p-5 shadow-xl shadow-gold/5 animate-fade-in">
      <div className="flex items-start justify-between mb-4 border-b border-border-dark pb-3">
        <div>
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wide flex items-center">
            <Layers className="h-4.5 w-4.5 mr-2 text-gold" />
            {t.title}
          </h3>
          <p className="text-[11px] text-slate-cyber">
            {t.subtitle}
          </p>
        </div>
        <div className="bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded text-[10px] font-mono">
          {design.wellType}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Well parameters HUD */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2.5">
            <div className="bg-bg-obsidian/50 rounded-xl p-3 border border-border-dark">
              <span className="text-[10px] text-slate-cyber block uppercase tracking-wider font-semibold">{t.aquifer}</span>
              <span className="text-sm text-gold font-bold">{design.aquiferType}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-bg-obsidian/50 rounded-xl p-3 border border-border-dark">
                <span className="text-[10px] text-slate-cyber block uppercase tracking-wider font-semibold">{t.diameter}</span>
                <span className="text-sm text-white font-mono font-bold">{design.casingDiameterInches}" PVC C10</span>
              </div>
              <div className="bg-bg-obsidian/50 rounded-xl p-3 border border-border-dark">
                <span className="text-[10px] text-slate-cyber block uppercase tracking-wider font-semibold">{t.yield}</span>
                <span className="text-sm text-cyber-cyan font-mono font-bold">{design.yieldRangeLps.min} - {design.yieldRangeLps.max} L/s</span>
              </div>
            </div>

            <div className="bg-bg-obsidian/50 rounded-xl p-3 border border-border-dark">
              <span className="text-[10px] text-slate-cyber block uppercase tracking-wider font-semibold">Profundidad de Perforación</span>
              <span className="text-sm text-white font-mono font-bold">
                {design.depthPreRange.min} - {design.depthPreRange.max} {design.depthPreRange.unit}
              </span>
            </div>

            <div className="bg-bg-obsidian/50 rounded-xl p-3 border border-border-dark">
              <span className="text-[10px] text-slate-cyber block uppercase tracking-wider font-semibold">Nivel Freático Estimado</span>
              <span className="text-xs text-gold-light font-mono font-medium">
                Estático: {design.staticLevelRange.min} - {design.staticLevelRange.max} m | Dinámico: ~{design.staticLevelRange.max + 12} m
              </span>
            </div>
          </div>

          {/* Interactive Strata Details Card */}
          <div className="bg-bg-obsidian/30 border border-border-dark rounded-xl p-3">
            <span className="text-[10px] text-slate-cyber block uppercase tracking-wider font-semibold mb-1.5 flex items-center">
              <Info className="h-3 w-3 mr-1 text-gold" />
              {language === "es" ? "Estratigrafía Inferida" : "Inferred Stratigraphy"}
            </span>
            <div className="space-y-1.5">
              {strata.map((s) => (
                <div
                  key={s.id}
                  onMouseEnter={() => setHoveredSection(s.id)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={`p-2 rounded-lg text-xs transition-all border cursor-help ${
                    hoveredSection === s.id
                      ? "bg-bg-graphite border-gold/30 text-white shadow-sm shadow-gold/5"
                      : "bg-bg-obsidian/50 border-transparent text-slate-cyber"
                  }`}
                >
                  <div className="flex justify-between font-medium">
                    <span className={hoveredSection === s.id ? "text-gold" : "text-[#E0E0E0]"}>{s.name}</span>
                    <span className="font-mono text-[10px]">{s.depth}</span>
                  </div>
                  {hoveredSection === s.id && (
                    <p className="text-[10px] text-slate-cyber mt-1 leading-snug animate-fade-in">{s.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: High-fidelity vertical sectional SVG diagram */}
        <div className="lg:col-span-7 bg-bg-obsidian rounded-xl border border-border-dark p-4 flex items-center justify-center min-h-[350px]">
          <svg className="w-full max-w-[340px] h-[400px]" viewBox="0 0 300 450">
            {/* SVG Background Definitions for Strata Hatches */}
            <defs>
              <pattern id="hatch-clay" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" className="stroke-border-dark/40 stroke-[2]" />
              </pattern>
              <pattern id="hatch-gravel" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="2.5" className="fill-gold/10 stroke-[#C9A227]/20 stroke-[1]" />
                <circle cx="15" cy="12" r="3" className="fill-gold/10 stroke-[#F5D170]/15 stroke-[1]" />
              </pattern>
              <pattern id="hatch-rock" width="30" height="30" patternTransform="rotate(30)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="30" y2="0" className="stroke-border-dark/30 stroke-[1.5]" />
                <line x1="15" y1="0" x2="15" y2="30" className="stroke-border-dark/20 stroke-[1]" />
              </pattern>
            </defs>

            {/* STRATIGRAPHY BACKDROPS */}
            {/* Layer 1: 0 - 65px (topsoil) */}
            <rect x="0" y="0" width="300" height="65" className={`${strata[0].color}`} />
            <rect x="0" y="0" width="300" height="65" fill="url(#hatch-clay)" />
            
            {/* Layer 2: 65 - 240px (aquifer gravels) */}
            <rect x="0" y="65" width="300" height="175" className={`${strata[1].color}`} />
            <rect x="0" y="65" width="300" height="175" fill="url(#hatch-gravel)" />

            {/* Layer 3: 240 - 340px (silt clay seal) */}
            <rect x="0" y="240" width="300" height="100" className={`${strata[2].color}`} />
            <rect x="0" y="240" width="300" height="100" fill="url(#hatch-clay)" />

            {/* Layer 4: 340 - 450px (bedrock volcanic) */}
            <rect x="0" y="340" width="300" height="110" className={`${strata[3].color}`} />
            <rect x="0" y="340" width="300" height="110" fill="url(#hatch-rock)" />

            {/* STRATA BORDER LINES */}
            <line x1="0" y1="65" x2="300" y2="65" className="stroke-border-dark/40 stroke-[1] stroke-dasharray-[4_4]" />
            <line x1="0" y1="240" x2="300" y2="240" className="stroke-border-dark/40 stroke-[1] stroke-dasharray-[4_4]" />
            <line x1="0" y1="340" x2="300" y2="340" className="stroke-border-dark/40 stroke-[1] stroke-dasharray-[4_4]" />

            {/* WELL RECONSTRUCTION STRUCTURE */}
            {/* 1. Gravel Pack outer layer (120px wide) */}
            <rect x="126" y="55" width="48" height="330" className="fill-slate-600/30 stroke-slate-500/20 stroke-[1]" />
            
            {/* 2. Outer tubular borehole wall (134px wide) */}
            <line x1="126" y1="40" x2="126" y2="385" className="stroke-slate-400/30 stroke-[1.5]" />
            <line x1="174" y1="40" x2="174" y2="385" className="stroke-slate-400/30 stroke-[1.5]" />

            {/* 3. PVC Encasement Casing (136 to 164 - 28px wide) */}
            {/* Upper Casing (solid tube, 40 to 140px depth) */}
            <rect x="136" y="40" width="28" height="100" className="fill-slate-900 stroke-gold stroke-[2]" />
            {/* Upper-mid solid casing (140 to 180) */}
            <rect x="136" y="140" width="28" height="40" className="fill-slate-900 stroke-gold stroke-[2]" />

            {/* 4. REJILLAS FILTRANTES (Screens) - (depth 180 to 280, inside aquifer) */}
            <g>
              <rect x="136" y="180" width="28" height="100" className="fill-slate-900 stroke-cyber-cyan stroke-[2]" />
              {/* Horizontal screen notches */}
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={i} x1="138" y1={185 + i * 6} x2="162" y2={185 + i * 6} className="stroke-cyber-cyan/50 stroke-[1.5]" />
              ))}
            </g>

            {/* Lower solid casing and end cap (280 to 380) */}
            <rect x="136" y="280" width="28" height="100" className="fill-slate-900 stroke-gold stroke-[2]" />
            {/* Conical cap at bottom of casing */}
            <polygon points="136,380 164,380 150,392" className="fill-slate-900 stroke-gold stroke-[2]" />

            {/* WATER LEVELS (STATIC & DYNAMIC) */}
            {/* STATIC LEVEL LINE (floating blue, depth 100px) */}
            <g>
              <line x1="30" y1="100" x2="270" y2="100" className="stroke-cyber-cyan stroke-[2]" />
              {/* Floating inverted static level triangle */}
              <polygon points="150,100 145,92 155,92" className="fill-cyber-cyan" />
              <text x="35" y="94" className="fill-cyber-cyan font-sans text-[9px] font-bold tracking-wide uppercase">{t.static} ~16m</text>
            </g>

            {/* DYNAMIC LEVEL CONE OF DEPRESSION */}
            <g>
              <path d="M 30,100 Q 150,170 270,100" className="fill-transparent stroke-cyber-cyan/80 stroke-[1.5] stroke-dasharray-[4_3]" />
              <text x="35" y="124" className="fill-cyber-cyan/80 font-sans text-[9px] font-bold tracking-wide uppercase">{t.dynamic} ~28m</text>
            </g>

            {/* SUBMERSIBLE WATER PUMP SUGGESTED INTAKE */}
            <g>
              {/* suggested level cable */}
              <line x1="150" y1="40" x2="150" y2="148" className="stroke-slate-500 stroke-[1.5]" />
              {/* pump body */}
              <rect x="144" y="148" width="12" height="26" rx="2" className="fill-gold stroke-gold-light stroke-[1]" />
              {/* pump intake details */}
              <line x1="146" y1="168" x2="154" y2="168" className="stroke-slate-950 stroke-[2]" />
              <text x="170" y="162" className="fill-gold font-mono text-[9px] font-bold">Bomba Sumergible sugerida (150 msnm)</text>
            </g>

            {/* ELEVATION/DEPTH RIGHT AXIS MARKERS */}
            {Array.from({ length: 9 }).map((_, i) => {
              const depthM = i * 10;
              const y = 40 + i * 45;
              return (
                <g key={i}>
                  <line x1="285" y1={y} x2="295" y2={y} className="stroke-border-dark stroke-[1]" />
                  <text x="260" y={y + 4} className="fill-slate-cyber font-mono text-[9px] text-right">{depthM}m</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Advisory disclaimer banner */}
      <div className="mt-4 flex items-start space-x-2 bg-bg-obsidian border border-border-dark p-3 rounded-xl animate-fade-in">
        <HelpCircle className="h-4.5 w-4.5 text-gold shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-cyber leading-snug">
          {t.infoAlert}
        </p>
      </div>
    </div>
  );
}
