import React from "react";
import { Droplet, Globe, Sparkles, Shield, Compass, BookOpen } from "lucide-react";

interface HeaderProps {
  language: "es" | "en";
  setLanguage: (lang: "es" | "en") => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isProcessing: boolean;
}

export default function Header({
  language,
  setLanguage,
  activeTab,
  setActiveTab,
  isProcessing
}: HeaderProps) {
  const t = {
    es: {
      tagline: "Inteligencia Hidrogeológica & Geofísica con IA",
      explore: "Exploración & Mapa",
      chat: "Consultor AI",
      outcomes: "Historial de Pozos (Moat)",
      docs: "Manual Técnico",
      premiumBadge: "Licencia Premium"
    },
    en: {
      tagline: "Hydrogeological & Geophysical AI Intelligence",
      explore: "Exploration & Map",
      chat: "AI Consultant",
      outcomes: "Well Logging (Moat)",
      docs: "Technical Guide",
      premiumBadge: "Premium License"
    }
  }[language];

  return (
    <header className="bg-bg-graphite border-b border-border-dark text-[#E0E0E0] sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-gold to-gold-light p-2 rounded-xl shadow-lg shadow-gold/20 flex items-center justify-center animate-pulse">
            <Droplet className="h-6 w-6 text-bg-obsidian" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-light text-xl tracking-tight text-white">
                AQUAFLOW <span className="font-black text-gold">AI</span>
              </span>
              <span className="hidden sm:inline bg-[#1A1A1D] text-gold border border-border-dark px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase">
                v2.0 GeoAI
              </span>
            </div>
            <p className="text-[9px] text-slate-cyber font-sans uppercase tracking-[0.15em] hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2">
          {[
            { id: "explore", label: t.explore, icon: Compass },
            { id: "chat", label: t.chat, icon: Sparkles },
            { id: "outcomes", label: t.outcomes, icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium tracking-wide transition-all border cursor-pointer ${
                  isActive
                    ? "bg-[#1A1A1D] text-gold border-border-dark shadow-sm shadow-gold/10"
                    : "text-slate-cyber border-transparent hover:text-white hover:bg-[#141417]/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-gold" : "text-slate-cyber"}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Controls & Badges */}
        <div className="flex items-center space-x-3">
          {/* Active pipeline telemetry light */}
          {isProcessing && (
            <div className="flex items-center space-x-1.5 bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full text-[10px] font-mono text-gold-light">
              <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
              <span>GEOPROCESS ACTIVE</span>
            </div>
          )}

          {/* Premium License Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-[#1A1A1D] border border-border-dark px-3 py-1 rounded-full text-xs font-medium text-gold-light">
            <Shield className="h-3 w-3 text-gold" />
            <span>{t.premiumBadge}</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === "es" ? "en" : "es")}
            className="flex items-center space-x-1 bg-[#1A1A1D] hover:bg-border-dark border border-border-dark px-3 py-1.5 rounded-lg text-xs font-medium text-[#E0E0E0] transition-all cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 text-slate-cyber" />
            <span className="uppercase">{language}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
