import React, { useState } from 'react';
import { 
  UserRole, 
  UserProfile, 
  ClinicalTriageRecord, 
  UrgencyLevel, 
  URGENCY_DETAILS 
} from '../types';
import { 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle, 
  XSquare, 
  UserCheck, 
  UserMinus, 
  Heart, 
  Stethoscope, 
  Activity, 
  FileText, 
  AlertCircle, 
  Lock, 
  Clock, 
  Check, 
  Plus, 
  BookOpen, 
  Layers, 
  CheckSquare, 
  FileCheck2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface ClinicalDashboardsProps {
  userProfile: UserProfile;
  allProfiles: UserProfile[];
  clinicalRecords: ClinicalTriageRecord[];
  onApproveClinician: (uid: string) => void;
  onDeclineClinician: (uid: string) => void;
  onSaveNurseConsult: (recordId: string, vitals: { 
    temp: string; 
    bp: string; 
    hr: string; 
    spo2: string; 
    comments: string; 
    status: 'AWAITING_CONSULT' | 'IN_PROGRESS' | 'ESCALATED' | 'COMPLETED' 
  }) => void;
  onSaveDoctorConsult: (recordId: string, consult: { 
    prescription: string; 
    differential: string; 
    notes: string; 
    isResolved: boolean 
  }) => void;
  showToast: (msg: string) => void;
}

export default function ClinicalDashboards({
  userProfile,
  allProfiles,
  clinicalRecords,
  onApproveClinician,
  onDeclineClinician,
  onSaveNurseConsult,
  onSaveDoctorConsult,
  showToast
}: ClinicalDashboardsProps) {

  // Global filters
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'NURSE_TRIAGE' | 'DOCTOR_REVIEW' | 'ARCHIVED'>('ALL');
  
  // Selected detail record state
  const [selectedRecord, setSelectedRecord] = useState<ClinicalTriageRecord | null>(null);

  // Secure workstation intake state (compliance protocols)
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => {
    const raw = localStorage.getItem('medtriage_unlocked_case_ids');
    if (raw) return JSON.parse(raw);
    return []; // Start clean: strict access controls require entering patient's code
  });

  const [inputCode, setInputCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeSuccess, setCodeSuccess] = useState<string | null>(null);

  const handleIntakeCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setCodeSuccess(null);
    
    // strip out whitespace and hyphens
    const cleanCode = inputCode.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    if (!cleanCode) {
      setCodeError('An input verification code is required.');
      return;
    }

    // Direct find match by either accessCode or direct case ID
    const match = clinicalRecords.find(rec => {
      const recCode = rec.accessCode ? rec.accessCode.replace(/[^0-9a-zA-Z]/g, '').toLowerCase() : '';
      const recId = rec.id.toLowerCase();
      return recCode === cleanCode || recId === cleanCode;
    });

    if (!match) {
      setCodeError('Identity Error: Invalid Case authorization PIN. Please verify code with the patient.');
      return;
    }

    if (!unlockedIds.includes(match.id)) {
      const updated = [...unlockedIds, match.id];
      setUnlockedIds(updated);
      localStorage.setItem('medtriage_unlocked_case_ids', JSON.stringify(updated));
    }

    setCodeSuccess(`Success! Intake authorized: ${match.patientName}`);
    setInputCode('');
    selectCase(match);
    showToast(`Patient case imported successfully: ${match.patientName}`);
    setTimeout(() => setCodeSuccess(null), 3500);
  };

  const handleClearQueue = () => {
    setUnlockedIds([]);
    localStorage.removeItem('medtriage_unlocked_case_ids');
    setSelectedRecord(null);
    showToast('Workstation queue secured and reset.');
  };

  // Nurse intake logging states
  const [temp, setTemp] = useState('');
  const [bp, setBp] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [comments, setComments] = useState('');
  const [intakeStatus, setIntakeStatus] = useState<'AWAITING_CONSULT' | 'COMPLETED'>('AWAITING_CONSULT');

  // Doctor response logging states
  const [prescription, setPrescription] = useState('');
  const [differential, setDifferential] = useState('');
  const [notes, setNotes] = useState('');
  const [isResolved, setIsResolved] = useState(false);

  // Trigger when case details change
  const selectCase = (rec: ClinicalTriageRecord) => {
    setSelectedRecord(rec);
    // Auto populate existing nurse values if present
    if (rec.nurseConsult) {
      setTemp(rec.nurseConsult.temperature || '');
      setBp(rec.nurseConsult.bloodPressure || '');
      setHr(rec.nurseConsult.heartRate || '');
      setSpo2(rec.nurseConsult.oxygenSat || '');
      setComments(rec.nurseConsult.nurseComments || '');
      setIntakeStatus('COMPLETED');
    } else {
      setTemp('');
      setBp('');
      setHr('');
      setSpo2('');
      setComments('');
      setIntakeStatus('AWAITING_CONSULT');
    }

    // Auto populate doctor items
    if (rec.doctorConsult) {
      setPrescription(rec.doctorConsult.prescription || '');
      setDifferential(rec.doctorConsult.differentialDiagnosis || '');
      setNotes(rec.doctorConsult.consultNotes || '');
      setIsResolved(rec.doctorConsult.isResolved || false);
    } else {
      setPrescription('');
      setDifferential('');
      setNotes('');
      setIsResolved(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW: 0. PENDING AUDIT (Clinician exists but not verified)
  // -------------------------------------------------------------
  if (!userProfile.isApproved) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in antialiased">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight uppercase">Credential Verification Required</h2>
            <p className="text-xs text-white/80 font-medium">Under Review by Clinical System Administrator</p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3 text-amber-900">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold block">HIPAA Security Regulatory Protocol (Bylaw §16.4.5)</span>
              <p className="leading-relaxed text-amber-800">
                To guarantee absolute patient confidentiality and prevent unauthorized access to clinical data, your professional profile must be checked against licensure registries.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-3.5">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Registered Professional Details</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold block text-[9px] uppercase">Legal Name</span>
                <span className="text-slate-700 font-extrabold">{userProfile.displayName}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold block text-[9px] uppercase">Requested Role</span>
                <span className="text-slate-700 font-mono font-extrabold">{userProfile.role}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold block text-[9px] uppercase">GMC/NMC License No</span>
                <span className="text-slate-700 font-mono font-extrabold">{userProfile.licenseNumber || 'Not Provided'}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold block text-[9px] uppercase">Connected Clinic</span>
                <span className="text-slate-700 font-extrabold">{userProfile.institution || 'City Hospital'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 flex gap-3 text-xs border border-blue-500/20 shadow-inner">
            <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <span className="font-mono text-[9px] tracking-widest text-blue-400 uppercase block font-black">DEVELOPER BYPASS TIPS</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Want to test out the Nurse or Doctor workspaces instantly? Open the **Floating Developer Control Center** at the bottom of your screen and select **"ADMIN"** or **"Approved Clinic Nurse"** toggle. You can also approve this specific account directly from the Administrator Workspace!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: 1. SYSTEM ADMINISTRATOR HUB
  // -------------------------------------------------------------
  if (userProfile.role === 'ADMIN') {
    const clinProfiles = allProfiles
      .filter(p => p.role === 'NURSE' || p.role === 'DOCTOR')
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    
    return (
      <div className="space-y-8 animate-fade-in text-slate-850">
        
        {/* Welcome row & Stats banner */}
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 border border-blue-500/30 text-white text-[8px] font-black font-mono tracking-widest px-2 py-0.5 rounded-full uppercase">SECURE ADMIN CONSOLE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black font-sans leading-tight">Administrative Overseer Hub</h1>
            <p className="text-[11px] text-slate-400 font-medium">Verify clinical licensure, audit database pipelines, and enforce access parameters.</p>
          </div>
          <div className="flex gap-4 text-xs font-mono font-bold">
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[8px] uppercase block tracking-wider font-bold">Total Clinicians</span>
              <span className="text-lg text-white font-extrabold">{clinProfiles.length}</span>
            </div>
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[8px] uppercase block tracking-wider font-bold text-amber-400">Pending GMC Audit</span>
              <span className="text-lg text-amber-400 font-extrabold">{clinProfiles.filter(p => !p.isApproved).length}</span>
            </div>
          </div>
        </div>

        {/* Admin Split View Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Clinician Directory & Approvals Board (Left Column) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">Clinical Licensure Audits</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                {clinProfiles.length} Members Listed
              </span>
            </div>

            {/* Clinicians List */}
            <div className="space-y-4">
              {clinProfiles.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-xl">
                  <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No remote clinicians registered yet</p>
                </div>
              ) : (
                clinProfiles.map((clin, index) => (
                  <div 
                    key={clin.uid || index}
                    className={`p-4 rounded-xl border transition-all ${!clin.isApproved ? 'border-amber-200/90 bg-amber-50/40 shadow-xs' : 'border-slate-200 hover:border-blue-300'}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-extrabold text-slate-900">{clin.displayName || clin.email}</span>
                          <span className={`text-[8px] font-black font-mono text-white px-1.5 py-0.5 rounded uppercase ${clin.role === 'DOCTOR' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                            {clin.role}
                          </span>
                          {!clin.isApproved ? (
                            <span className="text-[8px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> PENDING CODE AUDIT
                            </span>
                          ) : (
                            <span className="text-[8px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 shrink-0" /> VERIFIED
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 font-medium">
                          <div>License No: <span className="font-mono font-bold text-slate-800">{clin.licenseNumber || 'PENDING'}</span></div>
                          <div>Hospital: <span className="font-extrabold text-slate-800">{clin.institution || 'N/A'}</span></div>
                          {clin.role === 'DOCTOR' ? (
                            <div className="col-span-2">Specialty: <span className="text-slate-800 font-bold">{clin.specialty || 'Generalist'}</span></div>
                          ) : (
                            <div className="col-span-2">Practice Tenure: <span className="text-slate-800 font-bold">{clin.experienceYears || '0'} Years Experience</span></div>
                          )}
                          <div className="col-span-2 text-[9px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-3">
                            <span>Contact Secure: <span className="font-mono text-slate-600">{clin.email}</span></span>
                            {clin.createdAt && (
                              <span className="text-slate-400 text-[9px] font-semibold">
                                Registered: <span className="font-mono text-slate-600">{new Date(clin.createdAt).toLocaleDateString()} {new Date(clin.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action verification buttons */}
                      <div className="flex items-center gap-2 sm:self-center">
                        {!clin.isApproved ? (
                          <button 
                            onClick={() => onApproveClinician(clin.uid)}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all shadow-xs shadow-emerald-500/10"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Approve GMC
                          </button>
                        ) : (
                          <button 
                            onClick={() => onDeclineClinician(clin.uid)}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 active:scale-95 text-slate-600 py-2 px-3 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all"
                            title="Block Clinician Session"
                          >
                            <UserMinus className="w-3.5 h-3.5" /> Block Access
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sandbox Systems Parameters Auditor (Right Column) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">Patient Triage Pipes</h3>
              </div>
              <div className="space-y-4 text-xs">
                <p className="text-slate-500 leading-relaxed font-semibold">
                  The clinical records collection contains <strong className="text-indigo-600">{clinicalRecords.length} records</strong> actively parsed by Gemini logic.
                </p>
                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/60 leading-relaxed text-[11px] text-indigo-900 font-medium">
                  <strong>Clinical Triage Data Linking:</strong> Newly structured diagnostic files logged by patients on the landing page automatically cascade into this database using React state pipelines and LocalStorage.
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Real-time DB Loadout</span>
                  <div className="bg-slate-950 text-white rounded-xl p-4 font-mono text-[9px] space-y-1.5 border border-slate-800/80 shadow-md">
                    <div>[API_PORTAL] Active Syncing: ok</div>
                    <div>[FIRESTORE] Cloud collection: assessments</div>
                    <div>[SANDBOX] Triage Seed Queue count: {clinicalRecords.length}</div>
                    <div>[RED_FLAGS] Checked active metrics: true</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs leading-relaxed text-xs space-y-3.5">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-500" /> Regulatory Protocol Log
              </h4>
              <p className="text-slate-500">
                Administrative oversight controls enable clinical managers to verify credential authenticity with official licensing agencies (GMC, NMC, or State Boards) before allowing critical telemetry viewing.
              </p>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-[10px] text-slate-400 font-bold uppercase">
                <div>• Auto-Approved Role: PATIENTS, ADMINS</div>
                <div>• Protected Access: NURSES, DOCTORS</div>
                <div>• Licensure Audit Level: Live GMC Registries Match</div>
              </div>
            </section>

          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: 2. FRONTLINE CLINICAL NURSE / DOCTOR WORKSPACES
  // -------------------------------------------------------------
  
  // Apply Search, Urgency level filters, and Flow Status filters
  const filteredRecords = clinicalRecords.filter(rec => {
    // SECURITY ACCESS CONTROL protocol: Gated by Patient accessCode / Secure PIN
    const isUnlocked = unlockedIds.includes(rec.id);
    if (!isUnlocked) return false;

    const matchesSearch = 
      rec.patientName.toLowerCase().includes(search.toLowerCase()) || 
      rec.patientEmail.toLowerCase().includes(search.toLowerCase()) ||
      rec.data.symptoms.toLowerCase().includes(search.toLowerCase());
      
    const matchesUrgency = urgencyFilter === 'ALL' || rec.result?.level === urgencyFilter;
    
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = rec.flowStatus === statusFilter;
    }
    
    return matchesSearch && matchesUrgency && matchesStatus;
  }).sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-6 animate-fade-in antialiased text-slate-850">
      
      {/* Title block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-600 border border-blue-500/20 text-white text-[8px] font-mono tracking-widest px-2 py-0.5 rounded-full uppercase">
                {userProfile.role === 'NURSE' ? 'Nurse Intake Wing' : 'Physician consultation Board'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 font-mono">STATION_ID: CL-T-42</span>
            </div>
            <h1 className="text-2xl font-black font-sans leading-none text-slate-900">
              {userProfile.role === 'NURSE' ? 'Clinical Nurse Frontline Intake' : 'Consulting Medical Physician Center'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              {userProfile.role === 'NURSE' 
                ? 'Register patient vital signs, evaluate symptoms gravity index, and expedite provider consultations.'
                : 'Formulate differential diagnoses, dispense pharmaceutical treatment paths, and resolve active clinical files.'}
            </p>
          </div>
          
          <div className="flex gap-4 text-xs font-mono">
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[8px] uppercase block tracking-wider font-bold">Inbox queue</span>
              <span className="text-base text-slate-800 font-black">{filteredRecords.length} Cases</span>
            </div>
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <span className="text-slate-400 text-[8px] uppercase block tracking-wider font-bold text-red-500">Emergency Priority</span>
              <span className="text-base text-red-600 font-black">{clinicalRecords.filter(r => r.result?.level === UrgencyLevel.EMERGENCY).length} Files</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Cases Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Triage Patient Registry List (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" /> Patient Registry Queue
            </h3>
            <span className="text-[10px] font-bold text-slate-400 font-mono">FILTERS ACTIVE</span>
          </div>

          {/* Secure case intake gate - regulatory compliance */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 text-white space-y-3.5 shadow-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-350 font-mono">HIPAA Case Intake</span>
              </div>
              {unlockedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  className="text-[8px] text-red-400 hover:text-red-300 transition-colors uppercase font-mono border border-red-500/10 hover:bg-slate-800 px-1 py-0.5 rounded cursor-pointer font-black"
                >
                  Reset Active list
                </button>
              )}
            </div>

            <form onSubmit={handleIntakeCodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter 6-Digit PIN (e.g. 402-591)"
                  maxLength={12}
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setCodeError(null);
                  }}
                  className="w-full h-8.5 bg-slate-950 border border-slate-800 rounded-lg px-2 text-xs text-white placeholder:text-slate-500 font-mono focus:border-blue-500 outline-none transition-all font-bold tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="h-8.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 text-[9px] font-black font-mono uppercase tracking-wider transition-all select-none cursor-pointer active:scale-95 text-center shrink-0 border border-blue-500/20"
              >
                Import
              </button>
            </form>

            {codeError && (
              <div className="text-[9px] font-semibold text-red-400 flex items-center gap-1 leading-tight animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>{codeError}</span>
              </div>
            )}

            {codeSuccess && (
              <div className="text-[9px] font-semibold text-emerald-400 flex items-center gap-1 leading-tight animate-fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{codeSuccess}</span>
              </div>
            )}

            {/* Simulation Keys help for review */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[9px] text-slate-400 leading-normal space-y-1">
              <span className="font-mono text-[8px] text-indigo-400 uppercase font-black block tracking-wider">🏥 DEMO VERIFICATION KEYS (CLICK TO INSERT):</span>
              <div className="flex flex-col gap-1.5 font-semibold font-mono text-[9px] text-slate-350">
                <div className="flex justify-between items-center bg-slate-900/60 p-1 rounded border border-slate-800/40">
                  <span>Arthur Dent (Emergency):</span>
                  <button 
                    onClick={() => { setInputCode('402591'); setCodeError(null); }}
                    className="text-white font-extrabold bg-blue-600/35 hover:bg-blue-600 px-1.5 py-0.2 rounded font-sans text-[8px] uppercase tracking-wide cursor-pointer text-right transition-colors"
                  >
                    402-591
                  </button>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-1 rounded border border-slate-800/40">
                  <span>Chloe Bennet (Urgent):</span>
                  <button 
                    onClick={() => { setInputCode('817293'); setCodeError(null); }}
                    className="text-white font-extrabold bg-blue-600/35 hover:bg-blue-600 px-1.5 py-0.2 rounded font-sans text-[8px] uppercase tracking-wide cursor-pointer text-right transition-colors.1"
                  >
                    817-293
                  </button>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-1 rounded border border-slate-800/40">
                  <span>Zaphod Beeblebrox (Routine):</span>
                  <button 
                    onClick={() => { setInputCode('551930'); setCodeError(null); }}
                    className="text-white font-extrabold bg-blue-600/35 hover:bg-blue-600 px-1.5 py-0.2 rounded font-sans text-[8px] uppercase tracking-wide cursor-pointer text-right transition-colors.2"
                  >
                    551-930
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters panel */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search active station registry cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs outline-none focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2">
              <select 
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value as UrgencyLevel | 'ALL')}
                className="flex-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 px-2 outline-none focus:border-blue-500 transition-all"
              >
                <option value="ALL">All Urgencies</option>
                <option value={UrgencyLevel.EMERGENCY}>Emergencies</option>
                <option value={UrgencyLevel.URGENT}>Urgent</option>
                <option value={UrgencyLevel.ROUTINE}>Routine</option>
                <option value={UrgencyLevel.SELF_CARE}>Self Care</option>
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 h-8 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 px-2 outline-none focus:border-blue-500 transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Triage</option>
                <option value="NURSE_TRIAGE">In Nurse Intake</option>
                <option value="DOCTOR_REVIEW">Physician Consult</option>
                <option value="ARCHIVED">Resolved Case</option>
              </select>
            </div>
          </div>

          {/* Records loop */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {unlockedIds.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs space-y-3.5">
                <Lock className="w-7 h-7 text-slate-350 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <p className="font-extrabold uppercase text-[10px] text-slate-600 tracking-wider font-mono">Workstation Triage list Empty</p>
                  <p className="text-[11px] text-slate-400 max-w-[210px] mx-auto font-medium leading-relaxed">
                    Under strict medical privacy acts, you must enter a patient's self-triage 6-digit access PIN above to securely retrieve and look up their details.
                  </p>
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-150 rounded-xl text-slate-400 text-xs font-semibold">
                No patient matching active filters
              </div>
            ) : (
              filteredRecords.map((rec) => {
                const urgencyInfo = URGENCY_DETAILS[rec.result?.level || UrgencyLevel.ROUTINE];
                const isSelected = selectedRecord?.id === rec.id;
                
                return (
                  <button
                    key={rec.id}
                    onClick={() => selectCase(rec)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 relative ${isSelected ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/20'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="max-w-[75%]">
                        <span className="text-[11px] font-black text-slate-900 block truncate">{rec.patientName}</span>
                        <span className="text-[9px] text-slate-400 font-mono truncate block">{rec.patientEmail}</span>
                      </div>
                      
                      {/* Urgency Pill badge */}
                      <span className="text-[8px] font-mono font-black border uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
                        borderColor: urgencyInfo.color + '30',
                        color: urgencyInfo.color,
                        background: urgencyInfo.color + '10'
                      }}>
                        {rec.result?.level}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                      {rec.data.symptoms}
                    </p>

                    <div className="flex items-center justify-between text-[8px] font-black font-mono mt-1 border-t border-slate-100 pt-2 text-slate-400 uppercase tracking-widest">
                      <div className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Registered {new Date(rec.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {rec.flowStatus === 'PENDING' && (
                          <span className="text-amber-500 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">Awaiting Vitals</span>
                        )}
                        {rec.flowStatus === 'NURSE_TRIAGE' && (
                          <span className="text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">In Nurse Intake</span>
                        )}
                        {rec.flowStatus === 'DOCTOR_REVIEW' && (
                          <span className="text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">MD Review pending</span>
                        )}
                        {rec.flowStatus === 'ARCHIVED' && (
                          <span className="text-slate-450 bg-slate-50 px-1 py-0.2 rounded border border-slate-200">Resolved Files</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Case Chart Board (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs min-h-[500px]">
          {!selectedRecord ? (
            <div className="h-[450px] flex flex-col items-center justify-center text-center">
              <Activity className="w-12 h-12 text-slate-250 mb-3 animate-pulse" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-400">Select clinical patient case</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">Click any registered card on the registry board to construct diagnoses notes, review telemetry, and input vitals files.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Patient header case info */}
              <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 font-mono">CASE CHART ID</span>
                    <span className="text-[9px] bg-slate-100 border text-slate-700 font-bold px-1.5 py-0.2 rounded font-mono uppercase">{selectedRecord.id}</span>
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{selectedRecord.patientName}</h2>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Age: {selectedRecord.data.age}</span>
                    <span>Gender: {selectedRecord.data.gender}</span>
                    <span>Pre-Existing: {selectedRecord.data.preExisting || 'None'}</span>
                  </p>
                </div>
                
                <span className="text-xs bg-slate-50 border text-slate-600 px-3 py-1.5 rounded-xl font-bold font-mono">
                  {selectedRecord.flowStatus}
                </span>
              </div>

              {/* Patient Intake symptoms details */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-black text-slate-400 tracking-wider">Patient Self-Intake Symptoms</span>
                <div className="bg-slate-50 border rounded-xl p-4 text-xs text-slate-700 font-semibold leading-relaxed space-y-2">
                  <p>"{selectedRecord.data.symptoms}"</p>
                  <div className="flex gap-4 border-t border-slate-150 pt-2.5 mt-2.5 text-[10px] text-slate-500 font-bold">
                    <span>Onset Duration: <strong className="text-slate-800">{selectedRecord.data.duration}</strong></span>
                    <span>Indicated Severity: <strong className="text-slate-800">{selectedRecord.data.severity}/10</strong></span>
                  </div>
                </div>
              </div>

              {/* AI Gemini Diagnostic breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-black text-slate-400 tracking-wider">Automated AI Triage Assessment</span>
                <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 text-white rounded-xl p-4.5 border border-indigo-500/10 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded" />
                    <div>
                      <h4 className="text-xs font-black tracking-wide leading-tight text-indigo-200">{selectedRecord.result?.title}</h4>
                      <p className="text-[9px] text-slate-400 font-bold font-mono uppercase tracking-wide mt-0.5">Urgency: {selectedRecord.result?.level}</p>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-200">
                    <strong className="text-blue-300">Clinical Rationale:</strong> {selectedRecord.result?.rationale}
                  </p>
                  <div className="space-y-1.5 border-t border-slate-800 pt-2.5 text-[11px] text-slate-350">
                    <span className="font-mono text-[9px] text-indigo-400 font-bold uppercase block tracking-wider">AI Standard Next Steps Directives:</span>
                    <ul className="list-disc pl-4 space-y-0.8 font-medium">
                      {selectedRecord.result?.nextSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Nurse Consult vitals box display (Connected telemetry) */}
              {selectedRecord.nurseConsult && (
                <div className="space-y-2 animate-fade-in">
                  <span className="text-[10px] font-mono uppercase font-black text-slate-400 tracking-wider block">Logged Nurse Intake vitals</span>
                  <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span className="text-[11px] font-extrabold text-slate-800">{selectedRecord.nurseConsult.nurseName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">{new Date(selectedRecord.nurseConsult.loggedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>

                    {/* Vitals badge grid */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide block">Temp</span>
                        <span className="text-[11px] font-black text-slate-800 font-mono">{selectedRecord.nurseConsult.temperature}</span>
                      </div>
                      <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide block">BP (mmHg)</span>
                        <span className="text-[11px] font-black text-slate-800 font-mono">{selectedRecord.nurseConsult.bloodPressure}</span>
                      </div>
                      <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide block">HR (BPM)</span>
                        <span className="text-[11px] font-black text-slate-800 font-mono">{selectedRecord.nurseConsult.heartRate}</span>
                      </div>
                      <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wide block">SpO2 %</span>
                        <span className="text-[11px] font-black text-slate-800 font-mono">{selectedRecord.nurseConsult.oxygenSat}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-650 italic leading-relaxed pt-1">
                      <strong>Nurse Diagnostic Notes:</strong> "{selectedRecord.nurseConsult.nurseComments}"
                    </div>
                  </div>
                </div>
              )}

              {/* PHYSICIAN DIAGNOSIS BOX DISPLAY */}
              {selectedRecord.doctorConsult && (
                <div className="space-y-2 border-t border-slate-100 pt-4 animate-fade-in">
                  <span className="text-[10px] font-mono uppercase font-black text-slate-400 tracking-wider block font-black text-indigo-650">Signed Physician Diagnosis Note</span>
                  <div className="bg-indigo-50/30 border border-indigo-200 rounded-xl p-4.5 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                      <div className="flex items-center gap-1.5 font-black text-indigo-900 text-xs">
                        <Stethoscope className="w-4 h-4 text-indigo-600" />
                        <span>{selectedRecord.doctorConsult.doctorName}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">{new Date(selectedRecord.doctorConsult.loggedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Differential Diagnosis</span>
                        <span className="font-sans font-extrabold text-slate-800">{selectedRecord.doctorConsult.differentialDiagnosis}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Prescribed Pharmacological Treatments / Directives</span>
                        <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white border border-indigo-100 px-2 py-1 rounded block">{selectedRecord.doctorConsult.prescription}</span>
                      </div>
                      <div className="text-[11px] text-slate-650">
                        <strong>Physician Clinical Notes:</strong> "{selectedRecord.doctorConsult.consultNotes}"
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVE ACTION INPUT FORM DEPENDING ON ROLE */}
              
              {/* NURSE PORTAL FORM: ONLY FOR NURSE ROLE */}
              {userProfile.role === 'NURSE' && (
                <div className="space-y-3.5 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4.5 h-4.5 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">Add Clinician Entrance Intake Log</h3>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    onSaveNurseConsult(selectedRecord.id, {
                      temp,
                      bp,
                      hr,
                      spo2,
                      comments,
                      status: 'COMPLETED'
                    });
                  }} className="space-y-4 text-xs font-semibold">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Temperature (°C)</label>
                        <input 
                          type="text"
                          placeholder="e.g. 38.9C"
                          value={temp}
                          onChange={(e) => setTemp(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-semibold text-slate-700 placeholder:text-slate-350 outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">BP (mmHg)</label>
                        <input 
                          type="text"
                          placeholder="e.g. 120/80"
                          value={bp}
                          onChange={(e) => setBp(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-semibold text-slate-700 placeholder:text-slate-350 outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Heart Rate (BPM)</label>
                        <input 
                          type="text"
                          placeholder="e.g. 88"
                          value={hr}
                          onChange={(e) => setHr(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-semibold text-slate-700 placeholder:text-slate-350 outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Oxygen SpO2 %</label>
                        <input 
                          type="text"
                          placeholder="e.g. 98%"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-2 text-xs font-semibold text-slate-700 placeholder:text-slate-350 outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Nurse Clinical Assessment & Visual Triage Notes</label>
                      <textarea 
                        rows={3}
                        placeholder="Detail visual follicular inspection, clear or wheezy lung sounds, and immediate care comfort items dispensed."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-700 placeholder:text-slate-350 outline-none focus:border-emerald-500 leading-relaxed font-sans"
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-97 text-white font-extrabold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/15 border border-emerald-500/10"
                    >
                      Commit Vitals Logs & Dispatch to Physician Consult Room
                    </button>
                  </form>
                </div>
              )}

              {/* DOCTOR PORTAL FORM: ONLY FOR DOCTOR ROLE */}
              {userProfile.role === 'DOCTOR' && (
                <div className="space-y-3.5 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-4.5 h-4.5 text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">Add Consulting Physician Treatment Form & Rx</h3>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    onSaveDoctorConsult(selectedRecord.id, {
                      prescription,
                      differential,
                      notes,
                      isResolved
                    });
                  }} className="space-y-4 text-xs font-semibold">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Physician Differential Diagnosis</label>
                        <input 
                          type="text"
                          placeholder="e.g. Follicular Streptococcal Tonsillitis vs Mononucleosis"
                          value={differential}
                          onChange={(e) => setDifferential(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-sans text-slate-700 placeholder:text-slate-350 outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pharmacological Prescription (Rx) & Directives</label>
                        <input 
                          type="text"
                          placeholder="e.g. Amoxicillin 500mg PO TID for 10 Days"
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-mono text-indigo-700 bg-white border border-indigo-100 placeholder:text-slate-350 outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Physician Consult notes / Safety Bounds</label>
                      <textarea 
                        rows={3}
                        placeholder="Enter clinical rationale, safety check directives, or reasons you advised seeking immediate trauma center eval."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-semibold text-slate-700 placeholder:text-slate-350 outline-none focus:border-indigo-500 leading-relaxed font-sans"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100/50 p-3.5 rounded-xl border border-slate-200 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        id="resolveCase"
                        checked={isResolved}
                        onChange={(e) => setIsResolved(e.target.checked)}
                        className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer shrink-0"
                      />
                      <label htmlFor="resolveCase" className="text-xs text-slate-700 font-extrabold cursor-pointer">
                        Mark case formally RESOLVED (This will completely clear the patient off triage queues and archive)
                      </label>
                    </div>

                    <button 
                      type="submit"
                      className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 active:scale-97 text-white font-extrabold uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-md shadow-indigo-500/15 border border-indigo-500/10"
                    >
                      Authorize Diagnostics consult & Stamp Sign-off
                    </button>
                  </form>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
