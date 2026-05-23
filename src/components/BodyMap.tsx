/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Activity, 
  Sparkles,
  Layers,
  ShieldCheck,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface BodyRegion {
  id: string;
  name: string;
  symptoms: string[];
  color: string;
  glowColor: string;
  description: string;
  technicalLabel: string;
}

const BODY_REGIONS: BodyRegion[] = [
  {
    id: 'head',
    name: 'Head, Neck & Brain',
    symptoms: ['Severe headache', 'Dizziness', 'Stiff neck', 'Throat pain', 'Nasal congestion', 'Vision blurriness'],
    color: 'from-blue-500 via-indigo-500 to-indigo-700',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    description: 'Nerve centers, localized cranial pressures, stiff cervical spine, or sinus restriction.',
    technicalLabel: 'CRANIAL & CERVICAL AXIS'
  },
  {
    id: 'chest',
    name: 'Chest & Respiration',
    symptoms: ['Chest pain', 'Shortness of breath', 'High heart rate', 'Persistent cough', 'Palpitations', 'Tightness'],
    color: 'from-rose-500 to-red-600',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Cardiopulmonary system indicators. Requires high precision monitoring and keyword safeguards.',
    technicalLabel: 'CARDIOPULMONARY COMPARTMENT'
  },
  {
    id: 'abdomen',
    name: 'Abdomen & Gastro',
    symptoms: ['Severe stomach ache', 'Nausea/vomiting', 'Acid reflux', 'Lower abdominal cramps', 'Gastric burning'],
    color: 'from-amber-400 to-amber-600',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Visceral digestive tract symptoms, visceral spasms, or localized acute lower cramps.',
    technicalLabel: 'GASTROINTESTINAL CORE'
  },
  {
    id: 'back',
    name: 'Spine & Back',
    symptoms: ['Upper back stiffness', 'Lower back sore', 'Numbness in spine', 'Muscle spasm in shoulder'],
    color: 'from-cyan-400 to-blue-500',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    description: 'Musculoskeletal posterior structures, radiating radicular nerve pressure or spinal stiffness.',
    technicalLabel: 'MEDULLARY / PARAVERTEBRAL SECTOR'
  },
  {
    id: 'limbs',
    name: 'Limbs & Joints',
    symptoms: ['Joint swelling', 'Arm weakness', 'Leg numbness', 'Severe muscle strain', 'Sprained ankle'],
    color: 'from-emerald-400 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    description: 'Terminal extremities, micro-vessel blockages, localized motor sprains, or arthralgia.',
    technicalLabel: 'APPENDICULAR EXTREMITIES'
  }
];

interface BodyMapProps {
  onSelectSymptom: (symptom: string) => void;
  selectedSymptomText: string;
}

export default function BodyMap({ onSelectSymptom, selectedSymptomText }: BodyMapProps) {
  const [activeRegion, setActiveRegion] = useState<string>('chest');

  const selectedRegion = BODY_REGIONS.find(r => r.id === activeRegion) || BODY_REGIONS[0];

  return (
    <div id="interactive-body-map" className="border border-slate-100 rounded-3xl p-6 bg-white shadow-xl bg-clinical-dots relative overflow-hidden">
      {/* Decorative scanning neon line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-[pulse_2.5s_infinite]" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-5 border-b border-slate-100/80 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-blue-600 mb-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Precision Bio-Mapping</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            Interactive Biometric Atlas
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md">
            Click specific zones on the biometric display grid to retrieve peer-reviewed symptom templates.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-wide">
          <Layers className="w-3.5 h-3.5 text-blue-500" /> Layer: Musculoskeletal
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Dynamic Bio-Scanner Graphics */}
        <div className="lg:col-span-5 bg-slate-900/95 rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-between min-h-[360px] shadow-inner relative overflow-hidden group">
          {/* Cyberpunk matrix background */}
          <div className="absolute inset-0 bg-clinical-grid opacity-10 pointer-events-none" />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[8px] font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 px-2 py-1 rounded-full uppercase">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" /> System Scan Live
          </div>

          {/* Interactive SVG Human Map representation */}
          <div className="w-full max-w-[150px] relative z-11 py-2 flex justify-center">
            <svg viewBox="0 0 200 400" className="w-full h-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.15)] select-none">
              <defs>
                <linearGradient id="bodyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Background Coordinates */}
              <line x1="100" y1="20" x2="100" y2="380" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
              <line x1="30" y1="200" x2="170" y2="200" stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
              <circle cx="100" cy="180" r="110" fill="none" stroke="#1e293b" strokeWidth="1" />
              <circle cx="100" cy="180" r="140" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5 5" />

              <g className="transition-all duration-300">
                {/* 1. Head Node */}
                <motion.ellipse 
                  cx="100" 
                  cy="60" 
                  rx="24"
                  ry="28"
                  fill={activeRegion === 'head' ? '#6366f1' : '#475569'} 
                  fillOpacity={activeRegion === 'head' ? 0.35 : 0.15}
                  stroke={activeRegion === 'head' ? '#818cf8' : '#64748b'}
                  strokeWidth={activeRegion === 'head' ? 3 : 1.5}
                  onClick={() => setActiveRegion('head')}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer transition-colors"
                />
                {/* Pulse Ring if Head is active */}
                {activeRegion === 'head' && (
                  <circle cx="100" cy="60" r="34" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 3" className="animate-[spin_8s_linear_infinite]" />
                )}

                {/* 2. Chest Node */}
                <motion.rect 
                  x="78" 
                  y="100" 
                  width="44" 
                  height="55" 
                  rx="8"
                  fill={activeRegion === 'chest' ? '#ef4444' : '#475569'} 
                  fillOpacity={activeRegion === 'chest' ? 0.35 : 0.15}
                  stroke={activeRegion === 'chest' ? '#f87171' : '#64748b'}
                  strokeWidth={activeRegion === 'chest' ? 3 : 1.5}
                  onClick={() => setActiveRegion('chest')}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer transition-colors"
                />
                
                {/* 3. Abdomen Node */}
                <motion.rect 
                  x="82" 
                  y="160" 
                  width="36" 
                  height="48" 
                  rx="6"
                  fill={activeRegion === 'abdomen' ? '#f59e0b' : '#475569'} 
                  fillOpacity={activeRegion === 'abdomen' ? 0.35 : 0.15}
                  stroke={activeRegion === 'abdomen' ? '#fbbf24' : '#64748b'}
                  strokeWidth={activeRegion === 'abdomen' ? 3 : 1.5}
                  onClick={() => setActiveRegion('abdomen')}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer transition-colors"
                />

                {/* 4. Spine/Back Click Nodes on outer sides */}
                <motion.path 
                  d="M 66,120 Q 56,180 66,240" 
                  fill="none"
                  stroke={activeRegion === 'back' ? '#06b6d4' : '#475569'}
                  strokeWidth={activeRegion === 'back' ? 5 : 2.5}
                  strokeLinecap="round"
                  onClick={() => setActiveRegion('back')}
                  className="cursor-pointer hover:stroke-cyan-400 transition-colors"
                />
                <motion.path 
                  d="M 134,120 Q 144,180 134,240" 
                  fill="none"
                  stroke={activeRegion === 'back' ? '#06b6d4' : '#475569'}
                  strokeWidth={activeRegion === 'back' ? 5 : 2.5}
                  strokeLinecap="round"
                  onClick={() => setActiveRegion('back')}
                  className="cursor-pointer hover:stroke-cyan-400 transition-colors"
                />

                {/* 5. Extremities/Limbs (Joint connections, arms & legs) */}
                {/* Arms */}
                <motion.path 
                  d="M 72,110 L 40,195" 
                  stroke={activeRegion === 'limbs' ? '#10b981' : '#475569'} 
                  strokeWidth={activeRegion === 'limbs' ? 6 : 3.5}
                  strokeLinecap="round"
                  onClick={() => setActiveRegion('limbs')}
                  className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                />
                <motion.path 
                  d="M 128,110 L 160,195" 
                  stroke={activeRegion === 'limbs' ? '#10b981' : '#475569'} 
                  strokeWidth={activeRegion === 'limbs' ? 6 : 3.5}
                  strokeLinecap="round"
                  onClick={() => setActiveRegion('limbs')}
                  className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                />
                {/* Legs */}
                <motion.path 
                  d="M 88,215 L 75,320 L 70,380" 
                  stroke={activeRegion === 'limbs' ? '#10b981' : '#475569'} 
                  strokeWidth={activeRegion === 'limbs' ? 7 : 4}
                  strokeLinecap="round"
                  onClick={() => setActiveRegion('limbs')}
                  className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                />
                <motion.path 
                  d="M 112,215 L 125,320 L 130,380" 
                  stroke={activeRegion === 'limbs' ? '#10b981' : '#475569'} 
                  strokeWidth={activeRegion === 'limbs' ? 7 : 4}
                  strokeLinecap="round"
                  onClick={() => setActiveRegion('limbs')}
                  className="cursor-pointer hover:stroke-emerald-400 transition-colors"
                />
              </g>

              {/* Glowing Heart Center indicator */}
              <circle cx="100" cy="118" r="3" fill="#ef4444" className="animate-ping" />
              <circle cx="100" cy="118" r="1.5" fill="#ef4444" />
            </svg>
          </div>

          <div className="w-full text-center space-y-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 block">BIO-SCANNER TARGET RANGE</span>
            <div className="flex justify-center gap-1.5">
              {['head', 'chest', 'back', 'abdomen', 'limbs'].map((rId) => (
                <button
                  key={rId}
                  onClick={() => setActiveRegion(rId)}
                  className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all border ${
                    activeRegion === rId
                      ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_8px_rgba(37,99,235,0.4)]'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {rId}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: High Fidelity Medical Presets Control Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Active Area Summary Panel */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600" />
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
              {selectedRegion.technicalLabel}
            </span>
            <div className="flex h-max items-center gap-2.5 mb-2">
              <div className={`p-2 rounded-xl bg-gradient-to-tr ${selectedRegion.color} text-white shadow-sm`}>
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-base font-black text-slate-900 font-sans">{selectedRegion.name}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {selectedRegion.description}
            </p>
          </div>

          {/* Interactive Symptoms presets list */}
          <div className="space-y-3 flex-1 flex flex-col justify-end">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Diagnostic Presets
              </label>
              <span className="text-[9px] font-mono font-bold text-slate-400">Click to multi-select</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {selectedRegion.symptoms.map((symptom) => {
                  const isSelected = selectedSymptomText.toLowerCase().includes(symptom.toLowerCase());
                  return (
                    <motion.button
                      layoutId={`sym-${symptom}`}
                      key={symptom}
                      type="button"
                      onClick={() => onSelectSymptom(symptom)}
                      className={`text-left p-3 rounded-xl text-xs font-black transition-all border flex items-center justify-between group/btn ${
                        isSelected 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.15)] glow-ring-blue' 
                          : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center gap-2 pr-1.5">
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/btn:bg-blue-500 transition-colors shrink-0" />
                        )}
                        <span className="truncate leading-tight font-sans tracking-tight">{symptom}</span>
                      </span>
                      {isSelected ? (
                        <span className="text-[9px] font-mono tracking-widest bg-white/20 px-2 py-0.5 rounded-md uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="text-slate-400 group-hover/btn:text-blue-600 text-[10px] font-mono font-bold flex items-center gap-0.5 opacity-60 group-hover/btn:opacity-100">
                          <Plus className="w-3 h-3" /> ADD
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
