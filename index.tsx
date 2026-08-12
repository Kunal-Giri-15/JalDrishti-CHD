import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Droplets, 
  AlertTriangle, 
  ClipboardList, 
  ShieldCheck, 
  Bell, 
  TrendingUp, 
  CloudRain,
  Activity, 
  LogOut,
  MapPin,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Map as MapIcon,
  BookOpen,
  LayoutDashboard,
  ShieldAlert,
  Clock,
  Inbox,
  Megaphone,
  CheckCircle2,
  ChevronRight,
  Target,
  UserCheck,
  BarChart3,
  ShieldHalf,
  KeyRound,
  ShieldX,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';

// --- DATA LAYER ---
const CITY_RAINFALL_BASE = 52;
type DrainageStatus = 'Good' | 'Fair' | 'Poor';

interface WardBase {
  id: string;
  name: string;
  zone: string;
  drainage: DrainageStatus;
  historicalIncidents: number;
  lat: number;
  lng: number;
}

const CHANDIGARH_SECTORS_REFERENCE: WardBase[] = [
  { id: 's17', name: 'Sector 17', zone: 'City Centre', drainage: 'Good', historicalIncidents: 2, lat: 45, lng: 48 },
  { id: 's22', name: 'Sector 22', zone: 'West Chandigarh', drainage: 'Fair', historicalIncidents: 6, lat: 50, lng: 40 },
  { id: 's35', name: 'Sector 35', zone: 'South Chandigarh', drainage: 'Good', historicalIncidents: 3, lat: 65, lng: 42 },
  { id: 's15', name: 'Sector 15', zone: 'North Chandigarh', drainage: 'Fair', historicalIncidents: 5, lat: 42, lng: 35 },
  { id: 's26', name: 'Sector 26', zone: 'East Chandigarh', drainage: 'Poor', historicalIncidents: 11, lat: 48, lng: 65 },
  { id: 's43', name: 'Sector 43', zone: 'South Chandigarh', drainage: 'Fair', historicalIncidents: 4, lat: 75, lng: 38 },
  { id: 's19', name: 'Sector 19', zone: 'Central Chandigarh', drainage: 'Poor', historicalIncidents: 9, lat: 52, lng: 55 },
  { id: 's7', name: 'Sector 7', zone: 'North Chandigarh', drainage: 'Good', historicalIncidents: 1, lat: 30, lng: 52 },
  { id: 's32', name: 'Sector 32', zone: 'South Chandigarh', drainage: 'Fair', historicalIncidents: 7, lat: 70, lng: 55 },
  { id: 's47', name: 'Sector 47', zone: 'South Chandigarh', drainage: 'Poor', historicalIncidents: 13, lat: 85, lng: 60 },
  { id: 's11', name: 'Sector 11', zone: 'North Chandigarh', drainage: 'Good', historicalIncidents: 2, lat: 35, lng: 38 },
  { id: 's20', name: 'Sector 20', zone: 'Central Chandigarh', drainage: 'Fair', historicalIncidents: 5, lat: 55, lng: 58 }
];

// Authority Allowlist
const AUTHORITY_ALLOWLIST = [
  {
    id: 'CHD-Dept-001',
    password: '@Dept-001',
    accessCode: '001CHD#ABCD',
    department: 'Chandigarh Municipal Corporation (CHD MC)'
  },
  {
    id: 'CUH-Dept-002',
    password: '@Dept-002',
    accessCode: '002CHD#EFGH',
    department: 'Chandigarh Housing Board (CHD HB)'
  },
  {
    id: 'CUH-Dept-003',
    password: '@Dept-003',
    accessCode: '003CHD#IJKL',
    department: 'Chandigarh Urban Planning (CHD UP)'
  }
];

const calculateRiskScore = (rainfall: number, drainage: DrainageStatus, history: number): number => {
  const rainWeight = Math.min(rainfall * 0.8, 40);
  const drainageWeight = drainage === 'Poor' ? 40 : drainage === 'Fair' ? 20 : 5;
  const historyWeight = Math.min(history * 2.5, 20);
  return Math.min(Math.round(rainWeight + drainageWeight + historyWeight), 100);
};

const calculatePreparedness = (drainage: DrainageStatus, history: number): number => {
  const base = drainage === 'Good' ? 85 : drainage === 'Fair' ? 60 : 35;
  const modifier = Math.max(0, 10 - history); 
  return Math.min(base + modifier, 100);
};

type Role = 'Citizen' | 'Authority';
type AuthState = 'landing' | 'role-select' | 'login' | 'authenticated';

interface Ward {
  id: string;
  name: string;
  zone: string;
  riskScore: number;
  preparedness: number;
  status: string; 
  lat: number;
  lng: number;
  rainfall: number;
}

interface Report {
  id: string;
  wardId: string;
  landmark: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  status: 'Pending' | 'Reviewing' | 'Resolved';
  timestamp: string;
}

interface Broadcast {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  issuedBy: string;
}

interface Alert {
  id: string;
  wardName: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  timestamp: string;
  category: string;
  isEscalated?: boolean;
}

const INITIAL_WARDS: Ward[] = CHANDIGARH_SECTORS_REFERENCE.map((w, index) => {
  const sectorRainfall = CITY_RAINFALL_BASE + (index % 10 - 5);
  return {
    ...w,
    rainfall: sectorRainfall,
    status: `${w.drainage} infrastructure`,
    riskScore: calculateRiskScore(sectorRainfall, w.drainage, w.historicalIncidents),
    preparedness: calculatePreparedness(w.drainage, w.historicalIncidents)
  };
});

const generateSystemAlerts = (wards: Ward[], reports: Report[]): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  // 1. Check for Escalations: Reports in High Risk Sectors
  // Rule: If a citizen report is submitted for a sector that is already marked as High Risk
  reports.forEach(report => {
    const ward = wards.find(w => w.id === report.wardId);
    if (ward && ward.riskScore >= 70) {
      alerts.push({
        id: `esc-alert-${report.id}`,
        wardName: ward.name,
        title: 'CRITICAL ESCALATION',
        description: `Live complaint received in Sector ${ward.name} which is ALREADY High Risk (${ward.riskScore}%). Immediate field response required.`,
        severity: 'Critical',
        timestamp: report.timestamp,
        category: 'Live Incident',
        isEscalated: true
      });
    }
  });

  // 2. Regular Risk Assessments
  wards.forEach(ward => {
    if (ward.riskScore >= 75) {
      alerts.push({
        id: `alert-risk-${ward.id}`,
        wardName: ward.name,
        title: 'Critical Flood Risk',
        description: `Extreme vulnerability detected in ${ward.name}. High risk score indicates imminent flooding.`,
        severity: 'High',
        timestamp: now,
        category: 'Risk Assessment'
      });
    } else if (ward.riskScore >= 50) {
      alerts.push({
        id: `alert-risk-${ward.id}`,
        wardName: ward.name,
        title: 'Moderate Flood Risk',
        description: `Elevated risk detected. Monitoring required.`,
        severity: 'Medium',
        timestamp: now,
        category: 'Risk Assessment'
      });
    }
  });

  // Sort: Critical/Escalated first
  return alerts.sort((a, b) => {
    if (a.isEscalated && !b.isEscalated) return -1;
    if (!a.isEscalated && b.isEscalated) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
};

const getRiskLevel = (score: number): string => score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
const getRiskColor = (score: number): string => score >= 70 ? '#f87171' : score >= 40 ? '#fb923c' : '#4ade80';
const Badge = ({ children, color }: { children?: React.ReactNode; color: string }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
    {children}
  </span>
);

const LandingPage = ({ onStartLogin }: { onStartLogin: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 px-6 lg:px-12 py-4 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-lg border-b border-slate-100 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <button onClick={() => scrollToSection('hero')} className="flex items-center gap-3 group">
            <div className={`p-2 rounded-xl transition-all ${isScrolled ? 'bg-[#1e3a8a] text-white' : 'bg-white/10 text-white border border-white/20'}`}>
              <Droplets size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <h1 className={`text-xl font-black tracking-tighter leading-none uppercase ${isScrolled ? 'text-[#1e3a8a]' : 'text-white'}`}>JalDrishti</h1>
              <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isScrolled ? 'text-slate-400' : 'text-white/60'}`}>UT Chandigarh</p>
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-10">
            <button onClick={() => scrollToSection('hero')} className={`text-xs font-black uppercase tracking-widest transition-colors ${isScrolled ? 'text-slate-600 hover:text-[#1e3a8a]' : 'text-white/80 hover:text-white'}`}>Overview</button>
            <button onClick={() => scrollToSection('features')} className={`text-xs font-black uppercase tracking-widest transition-colors ${isScrolled ? 'text-slate-600 hover:text-[#1e3a8a]' : 'text-white/80 hover:text-white'}`}>How It Works</button>
            <button onClick={() => scrollToSection('mission')} className={`text-xs font-black uppercase tracking-widest transition-colors ${isScrolled ? 'text-slate-600 hover:text-[#1e3a8a]' : 'text-white/80 hover:text-white'}`}>Impact</button>
            <button onClick={onStartLogin} className={`text-xs font-black uppercase tracking-widest transition-colors ${isScrolled ? 'text-slate-600 hover:text-[#1e3a8a]' : 'text-white/80 hover:text-white'}`}>Risk Map</button>
            <button onClick={onStartLogin} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isScrolled ? 'bg-[#1e3a8a] text-white shadow-lg hover:shadow-blue-900/20' : 'bg-white text-[#1e3a8a] hover:bg-blue-50'}`}>Access Portal</button>
          </nav>
        </div>
      </header>
      <section id="hero" className="bg-[#1e3a8a] relative min-h-screen flex items-center pt-32 pb-20 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="animate-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-8">
              <Droplets className="text-white" size={14} />
              <span className="text-[11px] font-bold text-white tracking-wide">Smart Civic-Tech for Monsoon Preparedness</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight">From Flooded Streets to Informed Decisions.</h1>
            <p className="text-lg lg:text-xl text-blue-100/80 mb-10 max-w-2xl leading-relaxed">JalDrishti-Chandigarh empowers authorities and citizens with real-time, sector-level intelligence to proactively manage water-logging before it becomes a crisis.</p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onStartLogin} className="bg-[#00a852] hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20">Get Started <ArrowRight size={20} /></button>
              <button onClick={onStartLogin} className="bg-white text-[#1e3a8a] px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-lg">Explore the Dashboard</button>
            </div>
          </div>
          <div className="relative animate-in zoom-in-95 duration-1000 w-full group/mockup">
            <div className="bg-white/10 p-2 rounded-[24px] backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 group-hover/mockup:scale-[1.03] group-hover/mockup:-translate-y-2 group-hover/mockup:shadow-blue-500/20">
              <div className="bg-[#f8fafc] rounded-[20px] overflow-hidden shadow-xl border border-slate-200">
                <div className="bg-[#1e3a8a] px-6 py-4 flex items-center justify-between">
                  <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-400" /><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /></div>
                  <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest">JalDrishti Dashboard</div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-transform duration-300 hover:scale-105"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">High Risk</p><p className="text-3xl font-black text-rose-500">4</p></div>
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-transform duration-300 hover:scale-105"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Medium</p><p className="text-3xl font-black text-orange-400">7</p></div>
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm transition-transform duration-300 hover:scale-105"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Low Risk</p><p className="text-3xl font-black text-emerald-500">4</p></div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm"><h4 className="text-xs font-black text-slate-800 uppercase mb-6 tracking-wider">Chandigarh Sector Risk Map</h4><div className="grid grid-cols-5 gap-3">{['bg-rose-400', 'bg-orange-400', 'bg-emerald-400', 'bg-orange-400', 'bg-emerald-400', 'bg-orange-400', 'bg-rose-400', 'bg-emerald-400', 'bg-orange-400', 'bg-emerald-400', 'bg-emerald-400', 'bg-orange-400', 'bg-rose-400', 'bg-orange-400', 'bg-emerald-400'].map((color, i) => (<div key={i} className={`${color} h-16 rounded-lg opacity-80`} />))}</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="bg-white py-14 px-6 lg:px-12 border-b border-slate-100">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-5"><div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><BarChart3 size={28} /></div><div><h4 className="font-bold text-slate-900 text-base">Data-Driven Decisions</h4><p className="text-xs text-slate-500 font-medium">Real-time analytics for authority actions</p></div></div>
          <div className="flex items-center justify-center md:justify-start gap-5 border-y md:border-y-0 md:border-x border-slate-100 py-8 md:py-0 md:px-12"><div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><ShieldHalf size={28} /></div><div><h4 className="font-bold text-slate-900 text-base">Government Ready</h4><p className="text-xs text-slate-500 font-medium">Built for scaleable civic governance</p></div></div>
          <div className="flex items-center justify-center md:justify-start gap-5"><div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Users size={28} /></div><div><h4 className="font-bold text-slate-900 text-base">Citizen Participation</h4><p className="text-xs text-slate-500 font-medium">Direct reporting and alerts system</p></div></div>
        </div>
        <p className="text-center mt-12 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Built for Civic Governance • Designed for Real-World Impact</p>
      </div>
      <section id="features" className="py-24 px-6 lg:px-12 bg-[#fcfdfe]">
        <div className="max-w-[1600px] mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-black text-[#1e293b] mb-4 tracking-tight">Intelligence That Transforms Response</h2>
          <p className="text-slate-500 font-medium text-lg mb-16">Ward-level precision meets citywide coordination</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[{ icon: Target, title: 'Proactive Governance', desc: 'Predict risks. Allocate resources before disruption happens in vulnerable sectors.', tag: 'Resource optimization', color: 'bg-blue-600' }, { icon: MapPin, title: 'Ward-Level Intelligence', desc: 'Granular insights that reflect specific on-ground hydrology and drainage realities.', tag: '15+ sectors monitored', color: 'bg-emerald-600' }, { icon: Users, title: 'Citizen Participation', desc: 'Turning public input and field reports into actionable, verified intelligence.', tag: 'Real-time field reporting', color: 'bg-blue-700' }].map((item, i) => (
              <div key={i} className="bg-white p-12 rounded-[40px] text-left border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
                <div className={`${item.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-lg`}><item.icon size={28} /></div>
                <h4 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h4>
                <p className="text-slate-500 font-semibold mb-12 leading-relaxed text-lg">{item.desc}</p>
                <div className="flex items-center gap-2 text-blue-600 text-sm font-bold"><CheckCircle2 size={16} /> {item.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#1e3a8a] py-32 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-[1600px] mx-auto text-center relative z-10">
          <div className="flex justify-center mb-10"><div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md border border-white/20"><Droplets size={32} /></div></div>
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">Because every monsoon should be <br /> managed — not endured.</h2>
          <p className="text-blue-100/80 text-xl font-medium max-w-3xl mx-auto leading-relaxed">Transforming Chandigarh's approach from emergency response to strategic preparedness.</p>
        </div>
      </section>
      <section className="py-32 px-6 lg:px-12 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white p-12 lg:p-20 rounded-[48px] shadow-[0_24px_80px_rgba(0,0,0,0.06)] border border-blue-100/50 flex flex-col items-center text-center animate-in zoom-in-95 duration-700">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-10 shadow-lg shadow-blue-200"><ShieldCheck size={32} /></div>
            <h2 className="text-3xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">Be part of Chandigarh's shift from reactive response to proactive resilience.</h2>
            <p className="text-slate-500 text-lg font-semibold max-w-3xl mb-12 leading-relaxed">Join government officials, civic authorities, and citizens in building a safer, more prepared Chandigarh.</p>
            <button onClick={onStartLogin} className="bg-[#00a852] hover:bg-emerald-600 text-white px-10 py-5 rounded-[22px] font-black text-xl flex items-center gap-3 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95">Access JalDrishti-Chandigarh <ArrowRight size={24} /></button>
            <div className="mt-10 flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-widest"><span>No credit card required</span><span className="w-1 h-1 rounded-full bg-slate-300" /><span>Government verified platform</span></div>
          </div>
        </div>
      </section>
      <footer className="bg-[#0b1221] text-white pt-24 pb-12 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-8"><div className="bg-[#1e3a8a] p-2 rounded-xl"><Droplets size={24} /></div><h3 className="text-3xl font-black tracking-tighter uppercase">JalDrishti</h3></div>
              <p className="text-slate-400 text-base font-bold mb-3">UT Administration of Chandigarh</p>
              <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">An advanced civic-tech initiative integrated with real-time sector-level intelligence for monsoon flood management.</p>
            </div>
            <div><h5 className="font-black text-sm uppercase tracking-widest text-emerald-500 mb-10">Platform</h5><ul className="space-y-5 text-slate-400 font-bold text-base"><li className="hover:text-white cursor-pointer" onClick={() => scrollToSection('hero')}>Overview</li><li className="hover:text-white cursor-pointer" onClick={() => scrollToSection('features')}>How It Works</li><li className="hover:text-white cursor-pointer" onClick={() => scrollToSection('mission')}>Impact</li><li className="hover:text-white cursor-pointer" onClick={onStartLogin}>Risk Map</li><li className="hover:text-white cursor-pointer" onClick={onStartLogin}>Access Portal</li></ul></div>
            <div><h5 className="font-black text-sm uppercase tracking-widest text-emerald-500 mb-10">Support</h5><ul className="space-y-5 text-slate-400 font-bold text-base"><li>Police/Fire: <span className="text-white">100 / 101</span></li><li>MC Helpline: <span className="text-white">155304</span></li><li>Control Room: <span className="text-white">0172-2707000</span></li><li>Disaster Mgmt: <span className="text-white">1070</span></li></ul></div>
          </div>
          <div className="pt-12 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] space-y-2"><p>© 2025 UT ADMINISTRATION CHANDIGARH</p><p className="text-slate-600">DEPARTMENT OF IT</p></div>
            <div className="flex gap-12 text-slate-600 text-[10px] font-black uppercase tracking-widest mt-4 md:mt-0"><span className="hover:text-white cursor-pointer transition-colors">Privacy Framework</span><span className="hover:text-white cursor-pointer transition-colors">Usage Terms</span><span className="hover:text-white cursor-pointer transition-colors">Accessibility</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const RoleSelection = ({ onSelect, onBack }: { onSelect: (r: Role) => void; onBack: () => void }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 font-sans animate-in fade-in duration-500">
    <div className="max-w-4xl w-full text-center mb-16">
      <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4 text-center">Select Access Portal</h2>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-sm text-center">Authentication is required to proceed</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl w-full">
      <div 
        onClick={() => onSelect('Authority')} 
        className="group bg-white border border-slate-200 p-12 rounded-[48px] shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-[#1e3a8a] opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="bg-blue-50 p-6 rounded-[32px] text-[#1e3a8a] mb-10 group-hover:bg-[#1e3a8a] group-hover:text-white transition-all duration-500">
          <Building2 size={56} />
        </div>
        <h3 className="text-3xl font-black mb-4 text-slate-900 tracking-tight">Authority</h3>
        <p className="text-slate-500 font-semibold leading-relaxed">
          Government officials, Disaster Management teams, and MC Chandigarh planners.
        </p>
        <div className="mt-10 flex items-center gap-2 text-[#1e3a8a] font-black text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          Login as Admin <ArrowRight size={16} />
        </div>
      </div>

      <div 
        onClick={() => onSelect('Citizen')} 
        className="group bg-white border border-slate-200 p-12 rounded-[48px] shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="bg-emerald-50 p-6 rounded-[32px] text-emerald-600 mb-10 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
          <UserCheck size={56} />
        </div>
        <h3 className="text-3xl font-black mb-4 text-slate-900 tracking-tight">Citizen</h3>
        <p className="text-slate-500 font-semibold leading-relaxed">
          Residents of Chandigarh Sectors, civic volunteers, and community reporters.
        </p>
        <div className="mt-10 flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          Continue as Resident <ArrowRight size={16} />
        </div>
      </div>
    </div>

    <button onClick={onBack} className="mt-16 text-slate-400 font-black hover:text-slate-900 transition-colors uppercase tracking-[0.2em] text-xs">
      Return to Homepage
    </button>
  </div>
);

const LoginPage = ({ role, onLogin, onBack }: { role: Role; onLogin: (user: any) => void; onBack: () => void }) => {
  const isAuthority = role === 'Authority';
  const themeColor = isAuthority ? '#1e3a8a' : '#059669';
  const [isSignUp, setIsSignUp] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const [formData, setFormData] = useState({ id: '', password: '', accessCode: '' });
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isAuthority) {
      if (!agreement) { setError('Please confirm your citizenship and ethical use.'); return; }
      const citizenRegistry = JSON.parse(localStorage.getItem('jd_citizen_registry') || '[]');
      if (isSignUp) {
        if (citizenRegistry.some((u: any) => u.email === formData.id)) { setError('Email already registered. Please log in.'); return; }
        const newUser = { email: formData.id, password: formData.password };
        localStorage.setItem('jd_citizen_registry', JSON.stringify([...citizenRegistry, newUser]));
        onLogin({ email: formData.id, role: 'Citizen' });
      } else {
        const user = citizenRegistry.find((u: any) => u.email === formData.id && u.password === formData.password);
        if (user) { onLogin({ ...user, role: 'Citizen' }); } else { setError('Incorrect credentials or user not registered.'); }
      }
    } else {
      const authUser = AUTHORITY_ALLOWLIST.find(u => u.id === formData.id && u.password === formData.password && u.accessCode === formData.accessCode);
      if (authUser) { onLogin({ ...authUser, role: 'Authority' }); } else { setError('Verification failed. Invalid ID, Password, or Access Code.'); }
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex items-center justify-center p-6 font-sans relative overflow-x-hidden overflow-y-auto">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.2px, transparent 1.2px)', backgroundSize: '40px 40px' }} />
      <div className="w-full max-w-[480px] py-12 animate-in zoom-in-95 duration-500 relative flex flex-col justify-center">
        <div className="bg-white px-8 pb-10 pt-16 rounded-[48px] shadow-2xl border border-slate-100 relative w-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 rounded-[28px] shadow-xl z-20 w-20 h-20 flex items-center justify-center transition-transform hover:scale-105" style={{ backgroundColor: themeColor, color: 'white' }}>{isAuthority ? <Lock size={36} /> : <UserCheck size={36} />}</div>
          <div className="text-center mb-8"><h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{isAuthority ? 'Authority Login' : (isSignUp ? 'Citizen Signup' : 'Citizen Access')}</h2><p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.25em] leading-relaxed">Official JalDrishti Chandigarh Portal</p></div>
          {error && (<div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-in fade-in slide-in-from-top-2"><ShieldX size={16} /><span className="flex-1">{error}</span></div>)}
          <form className="space-y-5" onSubmit={handleAuth}>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1">{isAuthority ? 'Government ID' : 'Email Address'}</label><div className="relative group"><Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} /><input type={isAuthority ? "text" : "email"} required value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder={isAuthority ? "CHD-DEPT-XXX" : "your@email.com"} className="w-full bg-slate-50 border-2 border-slate-50 rounded-[22px] py-4 pl-14 pr-6 outline-none font-bold text-slate-900 focus:border-slate-100 focus:bg-white transition-all shadow-inner text-sm" /></div></div>
            <div className="space-y-1.5">
              <div className="flex justify-between px-1"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Password</label>{!isAuthority && (<button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[9px] font-black uppercase tracking-widest transition-opacity hover:opacity-70" style={{ color: themeColor }}>{isSignUp ? 'Switch to Login' : 'Need an Account?'}</button>)}</div>
              <div className="relative group"><KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} /><input type="password" required placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-50 rounded-[22px] py-4 pl-14 pr-6 outline-none font-bold text-slate-900 focus:border-slate-100 focus:bg-white transition-all shadow-inner text-sm" /></div>
            </div>
            {isAuthority && (<div className="space-y-1.5 animate-in slide-in-from-top-4"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1">Authority Access Code</label><div className="relative group"><ShieldAlert className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={18} /><input type="password" required placeholder="Verification Code" value={formData.accessCode} onChange={e => setFormData({ ...formData, accessCode: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-50 rounded-[22px] py-4 pl-14 pr-6 outline-none font-bold text-slate-900 focus:border-slate-100 focus:bg-white transition-all shadow-inner text-sm" /></div></div>)}
            {!isAuthority && (<div className="px-1 py-2 flex items-start gap-3 group cursor-pointer" onClick={() => setAgreement(!agreement)}><div className={`mt-0.5 shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${agreement ? 'bg-emerald-500 border-emerald-500 shadow-lg' : 'bg-slate-50 border-slate-200'}`}>{agreement && <CheckCircle2 size={12} className="text-white" />}</div><p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">I confirm that I am a valid citizen of India and will use this platform for ethical and lawful purposes.</p></div>)}
            <div className="pt-2"><button type="submit" disabled={!isAuthority && !agreement} className={`w-full text-white py-5 rounded-[22px] font-black text-lg transition-all shadow-lg hover:scale-[1.01] hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 group ${(!isAuthority && !agreement) ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ backgroundColor: themeColor }}>{isSignUp ? 'Create Citizen Profile' : 'Enter Portal'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" /></button></div>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-50 text-center"><button onClick={onBack} className="text-slate-400 text-[9px] font-black hover:text-slate-900 uppercase tracking-[0.3em] transition-colors">← Change Access Mode</button></div>
        </div>
        <div className="mt-6 text-center space-y-2"><div className="flex items-center justify-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-[0.4em]"><ShieldCheck size={12} className="opacity-60" /> Verified {isAuthority ? 'Authority' : 'Public'} Channel</div><p className="text-slate-300 text-[8px] font-black uppercase tracking-[0.25em]">NIC UT Chandigarh Digital Standards Compliant</p></div>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENTS ---

const OverviewDashboard = ({ wards }: { wards: Ward[] }) => {
  const avgRisk = Math.round(wards.reduce((a, b) => a + b.riskScore, 0) / (wards.length || 1));
  const avgPrep = Math.round(wards.reduce((a, b) => a + b.preparedness, 0) / (wards.length || 1));
  const highRiskCount = wards.filter(w => w.riskScore >= 70).length;
  const currentRain = Math.round(wards.reduce((a, b) => a + b.rainfall, 0) / (wards.length || 1));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Average Risk Score', val: `${avgRisk}/100`, sub: 'Calculated city-wide', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Preparedness Index', val: `${avgPrep}%`, sub: 'Infrastructure readiness', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'High-Risk Areas', val: highRiskCount.toString(), sub: 'Requiring action', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Regional Rainfall', val: `${currentRain}mm`, sub: 'Last 24h Average', icon: CloudRain, color: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-[#e2e8f0] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}><stat.icon size={18} /></div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{stat.label}</span>
            </div>
            <h3 className="text-4xl font-black text-slate-900 mb-2">{stat.val}</h3>
            <p className="text-xs font-medium text-slate-600">{stat.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-[#e2e8f0] p-8 min-h-[500px] flex flex-col">
          <h4 className="font-bold text-xl mb-8 text-slate-900">Chandigarh Sector Risk Map</h4>
          <div className="flex-1 bg-slate-50 rounded-[32px] relative overflow-hidden min-h-[400px]">
            {wards.map(w => (
              <div 
                key={w.id} 
                className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-150 group"
                style={{ top: `${w.lat}%`, left: `${w.lng}%`, backgroundColor: getRiskColor(w.riskScore) }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 font-bold">
                  {w.name}: {w.riskScore}% Risk
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-[40px] border border-[#e2e8f0] p-8">
          <h4 className="font-bold text-xl mb-10 text-slate-900">High-Risk Sectors</h4>
          <div className="space-y-6">
            {wards.filter(w => w.riskScore >= 70).sort((a,b) => b.riskScore - a.riskScore).slice(0, 6).map((ward, idx) => (
              <div key={ward.id} className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{ward.name}</h5>
                    <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-tight">{ward.status}</p>
                  </div>
                </div>
                <span className="font-black text-rose-600">{ward.riskScore}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const RiskMap = ({ wards }: { wards: Ward[] }) => {
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in">
      <div className="flex-1 bg-white rounded-[40px] border border-[#e2e8f0] p-6 relative overflow-hidden min-h-[550px]">
        <div className="w-full h-full bg-slate-100 rounded-[32px] relative cursor-crosshair">
          {wards.map(w => (
            <div 
              key={w.id} 
              onMouseEnter={() => setSelectedWardId(w.id)}
              onMouseLeave={() => setSelectedWardId(null)}
              className={`absolute w-8 h-8 rounded-full border-4 border-white shadow-2xl cursor-pointer transition-all hover:scale-125 z-10 flex items-center justify-center ${selectedWardId === w.id ? 'scale-125 ring-4 ring-blue-200 z-20' : ''}`}
              style={{ top: `${w.lat}%`, left: `${w.lng}%`, backgroundColor: getRiskColor(w.riskScore) }}
            >
              {selectedWardId === w.id && (
                <div className="absolute bottom-full mb-4 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 min-w-[240px] pointer-events-none animate-in slide-in-from-bottom-2 z-50">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-bold text-xl text-slate-900 leading-tight">{w.name}</h5>
                    <Badge color={w.riskScore >= 70 ? 'bg-rose-100 text-rose-600' : w.riskScore >= 40 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}>
                      {getRiskLevel(w.riskScore)}
                    </Badge>
                  </div>
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex justify-between items-center"><span className="text-slate-700 font-semibold uppercase">Risk Score</span><span className="font-bold text-slate-900">{w.riskScore}</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-700 font-semibold uppercase">Rainfall</span><span className="font-bold text-slate-900">{Math.round(w.rainfall)}mm</span></div>
                    <div className="flex justify-between items-center"><span className="text-slate-700 font-semibold uppercase">Drainage</span><span className="font-bold text-slate-900">{w.status}</span></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PrepIndex = ({ wards }: { wards: Ward[] }) => (
  <div className="space-y-8 animate-in fade-in">
    <h2 className="text-3xl font-black text-slate-900">Infrastructure Preparedness</h2>
    <div className="bg-white p-10 rounded-[40px] border border-slate-100 min-h-[450px]">
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={wards} margin={{ bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            fontSize={10} 
            interval={0} 
            angle={-45} 
            textAnchor="end" 
            height={100}
            style={{ fontWeight: 600, fill: '#1e293b' }}
          />
          <YAxis axisLine={false} tickLine={false} fontSize={10} style={{ fontWeight: 600, fill: '#1e293b' }} />
          <Tooltip cursor={{fill: '#f8fafc'}} />
          <Bar dataKey="preparedness" name="Prep Index" radius={[8, 8, 0, 0]} barSize={40}>
            {wards.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.preparedness > 80 ? '#10b981' : entry.preparedness > 50 ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const WardRankings = ({ wards }: { wards: Ward[] }) => {
  const ranked = useMemo(() => [...wards].sort((a,b) => b.riskScore - a.riskScore), [wards]);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sector Leaderboard</h2>
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-800 uppercase tracking-widest bg-slate-50/50">
              <th className="px-8 py-6">Rank</th>
              <th className="px-8 py-6">Sector Name</th>
              <th className="px-8 py-6 text-center">Risk Score</th>
              <th className="px-8 py-6 text-right">Preparedness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.map((w, i) => (
              <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6 font-semibold text-slate-600">#{(i+1).toString().padStart(2, '0')}</td>
                <td className="px-8 py-6 font-bold text-slate-900">{w.name}</td>
                <td className="px-8 py-6 text-center font-black text-rose-600">{w.riskScore}%</td>
                <td className="px-8 py-6 text-right font-black text-emerald-600">{w.preparedness}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AlertsList = ({ alerts }: { alerts: Alert[] }) => (
  <div className="space-y-8 animate-in fade-in">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-black text-slate-900">System Warning Engine</h2>
        <p className="text-slate-700 font-semibold mt-1">Real-time action priority based on risk.</p>
      </div>
    </div>
    <div className="grid gap-6">
      {alerts.length === 0 ? (
        <div className="bg-white p-16 rounded-[40px] text-center border-2 border-dashed border-slate-200">
           <ShieldAlert size={48} className="text-slate-300 mx-auto mb-4" />
           <p className="text-slate-700 font-bold uppercase tracking-widest text-sm">No Active Advisories</p>
        </div>
      ) : (
        alerts.map(a => (
          <div key={a.id} className={`p-8 rounded-[32px] border-l-[12px] bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
            a.isEscalated 
              ? 'border-l-rose-700 bg-rose-50 ring-4 ring-rose-100/50' 
              : a.severity === 'High' 
                ? 'border-l-rose-500' 
                : 'border-l-orange-500'
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                 <Badge color={a.isEscalated ? 'bg-rose-600 text-white' : a.severity === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}>
                   {a.isEscalated ? 'CRITICAL LIVE ESCALATION' : a.category}
                 </Badge>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">{a.title}: <span className="text-slate-600">{a.wardName}</span></h4>
              <p className={`font-medium leading-relaxed max-w-3xl ${a.isEscalated ? 'text-rose-900' : 'text-slate-800'}`}>{a.description}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

// AUTHORITY VIEW: Complaint Management
const ReportedComplaints = ({ reports, wards }: { reports: Report[]; wards: Ward[] }) => (
  <div className="space-y-8 animate-in fade-in">
    <h2 className="text-3xl font-black text-slate-900">Citizen Inundation Reports</h2>
    <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-100 border-b border-slate-300">
          <tr className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">
            <th className="px-8 py-6">Sector</th>
            <th className="px-8 py-6">Landmark</th>
            <th className="px-8 py-6">Severity</th>
            <th className="px-8 py-6">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {reports.map(r => (
            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-8 py-6 font-bold text-slate-900">{wards.find(w => w.id === r.wardId)?.name}</td>
              <td className="px-8 py-6 font-semibold text-slate-600">{r.landmark}</td>
              <td className="px-8 py-6"><Badge color={r.severity === 'High' ? 'bg-rose-100 text-rose-600' : r.severity === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}>{r.severity}</Badge></td>
              <td className="px-8 py-6 text-sm text-slate-700">{r.description}</td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr>
              <td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No field reports received</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// AUTHORITY VIEW: Broadcast Form
const BroadcastingSection = ({ onBroadcast }: { onBroadcast: (b: {title: string, content: string}) => void }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center">Emergency Broadcast</h2>
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onBroadcast({title, content}); setTitle(''); setContent(''); }}>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest">Notice Heading</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-300 p-4 rounded-2xl font-semibold outline-none focus:border-blue-500" placeholder="e.g., Heavy Rain Alert: Sector 15" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest">Advisory Message</label>
            <textarea required rows={5} value={content} onChange={e => setContent(e.target.value)} className="w-full bg-slate-50 border border-slate-300 p-4 rounded-2xl font-semibold outline-none focus:border-blue-500" placeholder="Enter detailed warning instructions..."></textarea>
          </div>
          <button type="submit" className="w-full bg-[#1e3a8a] text-white py-5 rounded-[24px] font-black shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95">
             <Megaphone size={20} /> Deploy Official Broadcast
          </button>
        </form>
      </div>
    </div>
  );
};

// CITIZEN VIEW: Report Form
const ReportForm = ({ wards, onSubmit }: { wards: Ward[]; onSubmit: (r: any) => void }) => {
  const [form, setForm] = useState({ wardId: '', landmark: '', severity: 'Medium' as 'Low'|'Medium'|'High', description: '' });
  const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95">
      <h2 className="text-3xl font-black text-slate-900 text-center">Report Water-Logging</h2>
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl">
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); if (wordCount <= 50) onSubmit(form); }}>
          <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Affected Sector</label>
             <select required value={form.wardId} onChange={e => setForm({...form, wardId: e.target.value})} className="w-full bg-slate-50 border border-slate-300 p-4 rounded-2xl font-bold outline-none text-slate-800">
               <option value="">Select Sector...</option>
               {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
             </select>
          </div>
          
          <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nearest Landmark</label>
             <input required placeholder="e.g. Near Market Parking" value={form.landmark} onChange={e => setForm({...form, landmark: e.target.value})} className="w-full bg-slate-50 border border-slate-300 p-4 rounded-2xl font-bold outline-none" />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Severity Level</label>
             <div className="grid grid-cols-3 gap-3">
               {(['Low', 'Medium', 'High'] as const).map(s => (
                 <button 
                   key={s} 
                   type="button" 
                   onClick={() => setForm({...form, severity: s})} 
                   className={`py-3 rounded-xl font-black text-xs uppercase border-2 transition-all ${form.severity === s ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
              <span className={`text-[10px] font-black uppercase tracking-widest ${wordCount > 50 ? 'text-rose-500' : 'text-slate-400'}`}>{wordCount}/50 Words</span>
            </div>
            <textarea rows={4} required placeholder="Describe water level and immediate risks..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-slate-50 border border-slate-300 p-4 rounded-2xl font-semibold outline-none focus:border-emerald-500"></textarea>
          </div>

          <button type="submit" disabled={wordCount > 50} className="w-full bg-[#059669] text-white py-5 rounded-[24px] font-black shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">Submit Situation Report</button>
        </form>
      </div>
    </div>
  );
};

// CITIZEN VIEW: Resources (Broadcast Display)
const Resources = ({ broadcasts }: { broadcasts: Broadcast[] }) => (
  <div className="space-y-12 animate-in fade-in">
    <h2 className="text-3xl font-black text-slate-900">Official Advisories & Resources</h2>
    
    {/* Broadcast Feed */}
    <div className="space-y-6">
      {broadcasts.map((b) => (
        <div key={b.id} className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[40px] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-amber-200 opacity-30 group-hover:opacity-50 transition-opacity"><AlertTriangle size={80} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <Badge color="bg-amber-500 text-white">OFFICIAL WARNING</Badge>
               <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{new Date(b.timestamp).toLocaleString()}</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-2">{b.title}</h4>
            <p className="text-slate-800 font-semibold leading-relaxed max-w-3xl mb-6">{b.content}</p>
            <div className="pt-4 border-t border-amber-200 text-[10px] font-black uppercase tracking-widest text-amber-600">
               Issued by: {b.issuedBy}
            </div>
          </div>
        </div>
      ))}
      
      {broadcasts.length === 0 && (
         <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[40px] text-slate-400 font-bold uppercase tracking-widest text-sm">
           No active public notices at this time.
         </div>
      )}
    </div>

    {/* Standard Resources */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
      {[
        { title: 'Emergency Helplines', desc: 'Dial 112 for disaster management.', icon: Activity },
        { title: 'Safe Shelters', desc: 'Map of designated Community Centres.', icon: MapPin },
      ].map((r, i) => (
        <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 hover:shadow-xl transition-all group">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 mb-6 w-fit group-hover:scale-110 transition-transform"><r.icon size={24} /></div>
          <h4 className="text-xl font-black mb-2">{r.title}</h4>
          <p className="text-slate-600 font-semibold">{r.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const App = () => {
  const [authState, setAuthState] = useState<AuthState>(() => (localStorage.getItem('jd_auth_state') as AuthState) || 'landing');
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('jd_role') as Role) || 'Citizen');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('jd_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedZone, setSelectedZone] = useState('All Sectors - Chandigarh');
  
  const [wards] = useState<Ward[]>(INITIAL_WARDS);
  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem('jd_reports');
    return saved ? JSON.parse(saved) : [];
  });
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(() => {
    const saved = localStorage.getItem('jd_broadcasts');
    return saved ? JSON.parse(saved) : [];
  });

  const alerts = useMemo(() => generateSystemAlerts(wards, reports), [wards, reports]);

  useEffect(() => {
    localStorage.setItem('jd_reports', JSON.stringify(reports));
    localStorage.setItem('jd_broadcasts', JSON.stringify(broadcasts));
    localStorage.setItem('jd_auth_state', authState);
    localStorage.setItem('jd_role', role);
    if (currentUser) {
      localStorage.setItem('jd_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('jd_user');
    }
  }, [reports, broadcasts, authState, role, currentUser]);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setRole(user.role);
    setAuthState('authenticated');
    setActiveTab('Overview');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthState('landing');
    localStorage.removeItem('jd_auth_state');
  };

  const addReport = (report: any) => {
    const newReport: Report = { ...report, id: `rep_${Date.now()}`, status: 'Pending', timestamp: new Date().toISOString() };
    // Add new report to the top
    setReports([newReport, ...reports]);
    setActiveTab('Alerts');
  };

  const addBroadcast = (b: {title: string, content: string}) => {
    const newBroadcast: Broadcast = { 
      ...b, 
      id: `brd_${Date.now()}`, 
      timestamp: new Date().toISOString(),
      issuedBy: currentUser?.department || 'Chandigarh Administration'
    };
    // Add new broadcast to the top
    setBroadcasts([newBroadcast, ...broadcasts]);
    setActiveTab('Overview');
  };

  const filteredWards = useMemo(() => {
    if (selectedZone === 'All Sectors - Chandigarh') return wards;
    return wards.filter(w => w.zone === selectedZone);
  }, [wards, selectedZone]);

  const navItems = [
    { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'Risk Map', icon: MapIcon, label: 'Risk Map' },
    { id: 'Preparedness Index', icon: ShieldCheck, label: 'Preparedness' },
    { id: 'Alerts', icon: Bell, label: 'Alerts', count: alerts.length },
    { id: 'Ward Rankings', icon: TrendingUp, label: 'Sector Rankings' }
  ];

  if (role === 'Citizen') {
    navItems.push({ id: 'Report Water-Logging', icon: ClipboardList, label: 'Report' }, { id: 'Resources', icon: BookOpen, label: 'Resources' });
  } else {
    navItems.push({ id: 'Reported Complaints', icon: Inbox, label: 'Complaints' }, { id: 'Broadcasting Section', icon: Megaphone, label: 'Broadcast' });
  }

  if (authState === 'landing') return <LandingPage onStartLogin={() => setAuthState('role-select')} />;
  if (authState === 'role-select') return <RoleSelection onSelect={(r) => { setRole(r); setAuthState('login'); }} onBack={() => setAuthState('landing')} />;
  if (authState === 'login') return <LoginPage role={role} onLogin={handleLogin} onBack={() => setAuthState('role-select')} />;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 overflow-hidden">
      <header className="bg-[#1e3a8a] text-white px-6 py-4 flex items-center justify-between shadow-lg z-50">
        <div className="flex items-center gap-3">
          <Droplets className="text-emerald-400" size={24} />
          <h1 className="text-xl font-black tracking-tight leading-none uppercase">JalDrishti</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2 text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              {role === 'Authority' ? currentUser?.department : 'Citizen Portal'}
            </span>
            <span className="text-[8px] font-bold text-white/60 uppercase">
              {currentUser?.id || currentUser?.email}
            </span>
          </div>
          <select 
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-[#2d4ca1] text-xs px-4 py-2 rounded-lg border border-white/20 outline-none font-bold text-white"
          >
            {['All Sectors - Chandigarh', 'North Chandigarh', 'South Chandigarh', 'East Chandigarh', 'West Chandigarh', 'Central Chandigarh'].map(z => <option key={z} value={z}>{z}</option>)}
          </select>
          <div className="flex items-center gap-3 border-l border-white/20 pl-4">
            <button onClick={handleLogout} className="text-white hover:text-rose-400 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col py-6 z-40">
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-black transition-all group ${
                  activeTab === item.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count ? <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{item.count}</span> : null}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-10">
          {activeTab === 'Overview' && <OverviewDashboard wards={filteredWards} />}
          {activeTab === 'Risk Map' && <RiskMap wards={filteredWards} />}
          {activeTab === 'Preparedness Index' && <PrepIndex wards={filteredWards} />}
          {activeTab === 'Alerts' && <AlertsList alerts={alerts} />}
          {activeTab === 'Ward Rankings' && <WardRankings wards={filteredWards} />}
          {activeTab === 'Report Water-Logging' && <ReportForm wards={wards} onSubmit={addReport} />}
          {activeTab === 'Resources' && <Resources broadcasts={broadcasts} />}
          {activeTab === 'Reported Complaints' && <ReportedComplaints reports={reports} wards={wards} />}
          {activeTab === 'Broadcasting Section' && <BroadcastingSection onBroadcast={addBroadcast} />}
        </main>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}