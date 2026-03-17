import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Car, Users, BarChart3, Settings, LogOut, Search, Plus,
  ArrowUpRight, Clock, MapPin, Trash2, Edit2,
  AlertCircle, CheckCircle2, MessageSquare, TrendingUp, DollarSign,
  FileText, ShieldCheck, CreditCard, ScanLine, Truck, Activity, X, AlertTriangle, RefreshCw,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';
import { useToast } from '../components/Toast';
import { apiService } from '../services/api';

// ── Places A001–A160 ──────────────────────────────────────────────
const ALL_SPOTS = Array.from({ length: 160 }, (_, i) =>
  `A${String(i + 1).padStart(3, '0')}`
);

// ── Composant Statistiques avec graphique réel ───────────────────
function StatsView({ stats, occupiedTotal, totalSpots, occupancyPct }: {
  stats: any; occupiedTotal: number; totalSpots: number; occupancyPct: number;
}) {
  const [weeklyData, setWeeklyData] = React.useState<any[]>([]);
  const [loadingChart, setLoadingChart] = React.useState(true);

  React.useEffect(() => {
    const fetchWeekly = async () => {
      setLoadingChart(true);
      try {
        const token = localStorage.getItem('access_token');
        // Récupérer les entrées des 7 derniers jours
        const res = await fetch('http://localhost:5000/api/stats/weekly', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWeeklyData(data);
        }
      } catch { /* silencieux */ }
      finally { setLoadingChart(false); }
    };
    fetchWeekly();
  }, []);

  // Préparer les données du graphique sur 7 jours
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const today = new Date();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayLabel = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
    const dateStr  = d.toISOString().slice(0, 10);
    const found    = weeklyData.find((r: any) => r.date === dateStr);
    return {
      label:   dayLabel,
      date:    dateStr,
      entries: found ? found.entries : 0,
      isToday: i === 6,
    };
  });

  const maxEntries = Math.max(...chartData.map(d => d.entries), 1);

  return (
    <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem] hover:border-primary/20 transition-all group">
          <TrendingUp className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
          <h4 className="text-white/40 text-xs uppercase tracking-widest mb-2 font-bold">Entrées Aujourd'hui</h4>
          <p className="text-5xl font-bold tracking-tighter">{stats?.total_entries ?? stats?.entries_today ?? 0}</p>
          <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-3 py-1 rounded-full">
            <ArrowUpRight className="w-4 h-4" /><span>Aujourd'hui</span>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem]">
          <Users className="w-10 h-10 text-blue-400 mb-6" />
          <h4 className="text-white/40 text-xs uppercase tracking-widest mb-2 font-bold">Véhicules Actifs</h4>
          <p className="text-5xl font-bold tracking-tighter">{stats?.active_now ?? occupiedTotal}</p>
          <div className="mt-6 flex items-center gap-2 text-blue-400 text-sm font-bold bg-blue-400/10 w-fit px-3 py-1 rounded-full">
            <Activity className="w-4 h-4" /><span>En ce moment</span>
          </div>
        </div>
        <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem]">
          <Clock className="w-10 h-10 text-purple-400 mb-6" />
          <h4 className="text-white/40 text-sm uppercase tracking-widest mb-2 font-bold">Taux d'Occupation</h4>
          <p className="text-5xl font-bold tracking-tighter">{occupancyPct}%</p>
          <div className="mt-6 flex items-center gap-2 text-purple-400 text-sm font-bold bg-purple-400/10 w-fit px-3 py-1 rounded-full">
            <Activity className="w-4 h-4" /><span>Temps réel</span>
          </div>
        </div>
      </div>

      {/* Graphique entrées 7 derniers jours */}
      <div className="bg-card-dark border border-white/5 p-10 rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-bold">Entrées des 7 derniers jours</h3>
            <p className="text-[10px] text-white/30 mt-1 font-medium uppercase tracking-widest">Données réelles depuis MySQL</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">En direct</span>
          </div>
        </div>

        {loadingChart ? (
          <div className="h-64 flex items-center justify-center">
            <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : (
          <div className="h-64 flex items-end gap-4">
            {chartData.map((d, i) => {
              const pct = maxEntries > 0 ? (d.entries / maxEntries) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <span className={`text-xs font-black transition-all ${d.entries > 0 ? 'text-white' : 'text-white/20'}`}>
                    {d.entries > 0 ? d.entries : ''}
                  </span>
                  <div className="w-full relative" style={{ height: '200px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, d.entries > 0 ? 4 : 0)}%` }}
                      transition={{ delay: i * 0.08, duration: 0.8, ease: 'easeOut' }}
                      style={{ position: 'absolute', bottom: 0, width: '100%' }}
                      className={`rounded-xl transition-all cursor-pointer
                        ${d.isToday
                          ? 'bg-primary shadow-lg shadow-primary/30 group-hover:bg-red-400'
                          : d.entries > 0
                            ? 'bg-white/20 group-hover:bg-primary/60'
                            : 'bg-white/5'}`}>
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-bg-dark border border-white/20 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.entries} entrée{d.entries !== 1 ? 's' : ''}
                      </div>
                    </motion.div>
                  </div>
                  <div className="text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-widest block ${d.isToday ? 'text-primary' : 'text-white/40'}`}>
                      {d.label}
                    </span>
                    {d.isToday && <span className="text-[8px] text-primary/60 font-black uppercase">Auj.</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Légende */}
        {!loadingChart && chartData.every(d => d.entries === 0) && (
          <div className="text-center text-white/20 mt-4">
            <p className="text-xs font-black uppercase tracking-widest">Aucune entrée cette semaine</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Composant Logs Système ────────────────────────────────────────
function LogsView() {
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [loading, setLoading]   = React.useState(true);
  const [search, setSearch]     = React.useState('');

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/api/logs/?page=1&per_page=200', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const logs: any[] = data.data || [];
        const connexions   = logs.filter(l => l.action?.toLowerCase().includes('connexion'));
        const deconnexions = logs.filter(l =>
          l.action?.toLowerCase().includes('déconnexion') ||
          l.action?.toLowerCase().includes('deconnexion')
        );
        const result = connexions.map((conn: any) => {
          const deconn = deconnexions.find((d: any) =>
            d.user_id === conn.user_id && new Date(d.created_at) > new Date(conn.created_at)
          );
          return {
            user_id:         conn.user_id,
            user_name:       conn.user_name || '—',
            user_role:       conn.user_role || '—',
            connected_at:    conn.created_at,
            disconnected_at: deconn?.created_at || null,
          };
        });
        result.sort((a: any, b: any) =>
          new Date(b.connected_at).getTime() - new Date(a.connected_at).getTime()
        );
        setSessions(result);
      }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchLogs(); }, [fetchLogs]);
  React.useEffect(() => {
    const t = setInterval(fetchLogs, 15000);
    return () => clearInterval(t);
  }, [fetchLogs]);

  const fmt = (dt: string | null) => {
    if (!dt) return null;
    try {
      const d = new Date(dt);
      return {
        time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      };
    } catch { return null; }
  };

  const roleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':   return 'bg-primary/10 text-primary border-primary/20';
      case 'MANAGER': return 'bg-purple-400/10 text-purple-400 border-purple-400/20';
      case 'AGENT':   return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
      default:        return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
    }
  };

  const filtered = sessions.filter(s =>
    // ✅ Afficher seulement ADMIN, MANAGER, AGENT — pas les CLIENT
    ['ADMIN', 'MANAGER', 'AGENT'].includes(s.user_role?.toUpperCase()) &&
    (s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
     s.user_role?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Journal de Connexions</h3>
          <p className="text-[10px] text-white/30 mt-1 font-medium">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} • Rafraîchissement auto 15s
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">En direct</span>
          </div>
          <button onClick={fetchLogs} className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-primary transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input type="text" placeholder="RECHERCHER PAR NOM OU RÔLE..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-[11px] font-black tracking-widest focus:outline-none focus:border-primary uppercase transition-all" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-card-dark border border-white/5 rounded-3xl overflow-hidden">
        <div className="px-8 py-5 border-b border-white/5 grid grid-cols-12 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 bg-white/[0.02]">
          <span className="col-span-4">Utilisateur</span>
          <span className="col-span-2">Rôle</span>
          <span className="col-span-3 text-emerald-400">Connexion</span>
          <span className="col-span-3 text-red-400">Déconnexion</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-white/20">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-widest">{search ? `Aucun résultat pour "${search}"` : 'Aucune session enregistrée'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((s: any, i: number) => {
              const conn   = fmt(s.connected_at);
              const deconn = fmt(s.disconnected_at);
              return (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="px-8 py-5 grid grid-cols-12 items-center hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black border ${roleColor(s.user_role)}`}>
                      {s.user_name?.charAt(0)?.toUpperCase()}
                    </div>
                    <p className="text-sm font-bold text-white">{s.user_name}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${roleColor(s.user_role)}`}>{s.user_role}</span>
                  </div>
                  <div className="col-span-3">
                    {conn ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-black text-emerald-400">{conn.time}</p>
                          <p className="text-[9px] font-mono text-white/30">{conn.date}</p>
                        </div>
                      </div>
                    ) : <span className="text-white/20 text-xs">—</span>}
                  </div>
                  <div className="col-span-3">
                    {deconn ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-black text-red-400">{deconn.time}</p>
                          <p className="text-[9px] font-mono text-white/30">{deconn.date}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Session active</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Composant Plan Parking A001–A160 paginé (60 fidèles / 100 standards) ─────
function ParkingMap({ occupiedSpots }: { occupiedSpots: any[] }) {
  const TOTAL          = 160;
  const LOYAL_TOTAL    = 60;  // A001–A060 réservées aux clients fidèles
  const STANDARD_TOTAL = TOTAL - LOYAL_TOTAL; // A061–A160 pour clients standards
  const PAGE_SIZE      = 20;

  const [page, setPage] = React.useState(0);
  const [zone, setZone] = React.useState<'LOYAL' | 'STANDARD'>('LOYAL');

  const zoneTotal   = zone === 'LOYAL' ? LOYAL_TOTAL : STANDARD_TOTAL;
  const zoneOffset  = zone === 'LOYAL' ? 0 : LOYAL_TOTAL; // décalage de numérotation
  const totalPages  = Math.ceil(zoneTotal / PAGE_SIZE);

  // ✅ Normaliser A01/A1/A001 → A001 pour matcher le plan
  const normalizeSpot = (spot: string): string => {
    if (!spot) return spot.toUpperCase();
    let prefix = '';
    let numStr  = '';
    for (const ch of spot) {
      if (ch >= '0' && ch <= '9') numStr += ch;
      else prefix += ch;
    }
    if (!numStr) return spot.toUpperCase();
    return prefix.toUpperCase() + String(parseInt(numStr, 10)).padStart(3, '0');
  };

  const occupiedMap: Record<string, any> = {};
  occupiedSpots.forEach(s => {
    if (s.spot_number) {
      occupiedMap[normalizeSpot(s.spot_number)] = s;
      occupiedMap[s.spot_number.toUpperCase()]  = s; // fallback
    }
  });

  const pageStartIndex = page * PAGE_SIZE;
  const pageStartNum   = zoneOffset + pageStartIndex + 1;
  const pageEndNum     = Math.min(pageStartNum + PAGE_SIZE - 1, zone === 'LOYAL' ? LOYAL_TOTAL : TOTAL);

  const getSpotNumber = (spotId: string): number | null => {
    let numStr = '';
    for (const ch of spotId) {
      if (ch >= '0' && ch <= '9') numStr += ch;
    }
    if (!numStr) return null;
    return parseInt(numStr, 10);
  };

  const spots = Array.from({ length: pageEndNum - pageStartNum + 1 }, (_, i) => {
    const num    = pageStartNum + i;
    const spotId = `A${String(num).padStart(3, '0')}`;
    const info   = occupiedMap[spotId];
    return { num, spotId, info, isOccupied: !!info };
  });

  const totalOccupiedLoyal = Object.keys(occupiedMap).filter(k => {
    if (!k.startsWith('A')) return false;
    const n = getSpotNumber(k);
    return n !== null && n >= 1 && n <= LOYAL_TOTAL;
  }).length;

  const totalOccupiedStandard = Object.keys(occupiedMap).filter(k => {
    if (!k.startsWith('A')) return false;
    const n = getSpotNumber(k);
    return n !== null && n > LOYAL_TOTAL && n <= TOTAL;
  }).length;

  const totalOccupied = totalOccupiedLoyal + totalOccupiedStandard;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-sm shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MapPin className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-base font-black uppercase tracking-tight">Plan du Parking IMW</h3>
            <p className="text-[10px] text-white/30 font-medium mt-0.5">
              Places A001–A160 &bull; {totalOccupied} occupées &bull; {TOTAL - totalOccupied} libres
            </p>
            <p className="text-[9px] text-white/30 font-medium mt-0.5">
              60 fidèles (A001–A060) &bull; 100 standards (A061–A160)
            </p>
          </div>
        </div>
        {/* Zone & range affichés */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-white/5 p-1">
            <button
              onClick={() => { setZone('LOYAL'); setPage(0); }}
              className={`px-3 py-1 text-[9px] font-black uppercase rounded-full transition-all ${
                zone === 'LOYAL' ? 'bg-primary text-white' : 'text-white/40'
              }`}
            >
              Fidèles
            </button>
            <button
              onClick={() => { setZone('STANDARD'); setPage(0); }}
              className={`px-3 py-1 text-[9px] font-black uppercase rounded-full transition-all ${
                zone === 'STANDARD' ? 'bg-primary text-white' : 'text-white/40'
              }`}
            >
              Standards
            </button>
          </div>
          <span className="text-[10px] text-white/20 font-mono bg-white/5 px-3 py-1 rounded-full">
            A{String(pageStartNum).padStart(3,'0')} – A{String(pageEndNum).padStart(3,'0')}
          </span>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Occupée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">
            Libre {zone === 'LOYAL' ? 'fidèle' : 'standard'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono">
          <span>Fidèles: {totalOccupiedLoyal}/{LOYAL_TOTAL}</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>Standards: {totalOccupiedStandard}/{STANDARD_TOTAL}</span>
        </div>
      </div>

      {/* Grille 20 places */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {spots.map(({ spotId, info, isOccupied }) => (
          <motion.div key={spotId} whileHover={{ scale: 1.08 }}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all relative group
              ${isOccupied
                ? 'bg-primary/20 border-primary/40 text-primary shadow-lg shadow-primary/10'
                : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'}`}>
            <Car className="w-3 h-3" />
            <span className="text-[7px] font-black leading-none">{spotId}</span>
            {/* Tooltip plaque au survol */}
            {isOccupied && info && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg-dark border border-primary/30 text-white text-[9px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl">
                🚗 {info.license_plate}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
          ← Précédent
        </button>
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`rounded-full transition-all ${i === page ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`} />
          ))}
        </div>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
          className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
          Suivant →
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const refreshTimer = useRef<any>(null);

  const getInitialView = () => {
    if (role === 'admin') return 'reclamations';
    if (role === 'manager') return 'stats';
    return 'vehicles';
  };

  const [activeView, setActiveView]         = useState(getInitialView());
  const [searchQuery, setSearchQuery]       = useState('');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [newVehicle, setNewVehicle]         = useState({ type: 'Voiture', plate: '', spot: '' });
  const [editingVehicle, setEditingVehicle] = useState<{ id: number; plate: string } | null>(null);
  const [editingPrice, setEditingPrice]     = useState<any | null>(null);
  const [viewingReclamation, setViewingReclamation] = useState<any>(null);
  const [reclamationFilter, setReclamationFilter]   = useState<'all' | 'urgent'>('all');
  const [confirmDelete, setConfirmDelete]   = useState<{ id: number; plate: string } | null>(null);
  const [downloadingReport, setDownloadingReport]   = useState<string | null>(null);

  // ── Données BD ────────────────────────────────────────────────
  const [vehicles, setVehicles]               = useState<any[]>([]);
  const [occupiedSpots, setOccupiedSpots]     = useState<any[]>([]);
  const [reclamations, setReclamations]       = useState<any[]>([]);
  const [resolvedIds, setResolvedIds]         = useState<Set<number>>(new Set());
  const [subscriptions, setSubscriptions]     = useState<any[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [stats, setStats]                     = useState<any>(null);
  const [capacity, setCapacity]               = useState<any>(null);
  const [loading, setLoading]                 = useState(true);
  const [lastRefresh, setLastRefresh]         = useState<Date>(new Date());

  // ── Tarifs BD ────────────────────────────────────────────────
  const [pricingData, setPricingData]         = useState<any[]>([]);
  const [pricingLoading, setPricingLoading]   = useState(false);
  const [savingPrice, setSavingPrice]         = useState(false);

  const [parkingSettings, setParkingSettings] = useState(() => {
    const saved = localStorage.getItem('parking_settings');
    return saved ? JSON.parse(saved) : { name: 'IMW PARKING MAROC', capacity: 160, notifications: true, maintenance: false };
  });

  // ── Rapports ─────────────────────────────────────────────────
  const downloadReport = async (type: string) => {
    setDownloadingReport(type);
    showToast('Génération du fichier Excel...', 'info');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:5000/api/reports/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { showToast('Erreur lors de la génération du rapport', 'error'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `IMW_Parking_${type}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Rapport Excel téléchargé !', 'success');
    } catch { showToast('Erreur réseau', 'error'); }
    finally { setDownloadingReport(null); }
  };

  // ── Chargement données BD ─────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const vehiclesRes  = await apiService.getActiveVehicles();
      const vehiclesList = Array.isArray(vehiclesRes) ? vehiclesRes : (vehiclesRes.data || []);
      setVehicles(vehiclesList.map((v: any) => ({
        id:     v.id,
        type:   v.vehicle_type || 'Voiture',
        plate:  v.license_plate,
        time:   v.entry_time ? new Date(v.entry_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
        status: 'En cours',
        spot:   v.spot_number || 'N/A',
      })));

      // ✅ Charger les places occupées pour le plan
      const spotsRes = await fetch('http://localhost:5000/api/vehicles/occupied-spots', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (spotsRes.ok) setOccupiedSpots(await spotsRes.json() || []);

      const capRes = await apiService.getCapacity();
      if (!capRes.error) setCapacity(capRes);

      if (role === 'admin' || role === 'manager') {
        const recRes  = await apiService.getAllReclamations();
        const recList = Array.isArray(recRes) ? recRes : (recRes.data || []);
        setResolvedIds(prev => {
          setReclamations(
            recList.filter((r: any) => !prev.has(r.id)).map((r: any) => ({
              id:          r.id,
              client:      r.user_name || 'Client',
              subject:     r.subject,
              description: r.description,
              date:        r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '',
              status:      r.status === 'OPEN' ? 'Urgent' : 'En attente',
            }))
          );
          return prev;
        });

        const subRes  = await apiService.getAllSubscriptions();
        const subList = Array.isArray(subRes) ? subRes : (subRes.data || []);
        setSubscriptions(subList.map((s: any) => ({
          id:     s.id,
          user:   s.user_name || 'Client',
          plate:  s.license_plate,
          type:   s.plan_type,
          status: s.status === 'ACTIVE' ? 'Actif' : s.status === 'EXPIRED' ? 'Expiré' : 'Annulé',
        })));
      }

      if (role === 'admin') {
        const usersRes = await apiService.getAllUsers();
        setRegisteredUsers(Array.isArray(usersRes) ? usersRes : (usersRes.data || []));
      }

      if (role === 'admin' || role === 'manager') {
        const statsRes = await apiService.getTodayStats();
        if (!statsRes.error) setStats(statsRes);
      }

      setLastRefresh(new Date());
    } catch {
      if (!silent) showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    refreshTimer.current = setInterval(() => loadData(true), 10000);
    return () => clearInterval(refreshTimer.current);
  }, [loadData]);

  const loadPricing = useCallback(async () => {
    setPricingLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/api/pricing/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) setPricingData(await res.json());
    } catch { /* silencieux */ }
    finally { setPricingLoading(false); }
  }, []);

  useEffect(() => {
    if (activeView === 'pricing') loadPricing();
  }, [activeView, loadPricing]);

  const sidebarItems = [
    { id: 'vehicles',     icon: Car,          label: 'Gestion Véhicules',   role: ['agent', 'admin'] },
    { id: 'map',          icon: MapPin,        label: 'Plan du Parking',     role: ['agent', 'admin', 'manager'] },
    { id: 'scanner',      icon: ScanLine,      label: 'Scanner Ticket',      role: ['agent', 'admin'] },
    { id: 'stats',        icon: BarChart3,     label: 'Statistiques',        role: ['manager', 'admin'] },
    { id: 'reports',      icon: FileText,      label: 'Rapports Financiers', role: ['manager', 'admin'] },
    { id: 'subs',         icon: CreditCard,    label: 'Abonnements',         role: ['manager', 'admin'] },
    { id: 'reclamations', icon: MessageSquare, label: 'Réclamations',        role: ['admin'] },
    { id: 'logs',         icon: Activity,      label: 'Logs Système',        role: ['admin'] },
    { id: 'pricing',      icon: DollarSign,    label: 'Gestion Tarifs',      role: ['admin'] },
    { id: 'users',        icon: Users,         label: 'Utilisateurs',        role: ['admin'] },
    { id: 'settings',     icon: Settings,      label: 'Paramètres',          role: ['admin'] },
  ];

  const filteredSidebar  = sidebarItems.filter(item => item.role.includes(role || ''));
  const filteredVehicles = vehicles.filter(v =>
    v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.spot.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const occupiedTotal = capacity?.occupied || vehicles.length;
  const totalSpots    = capacity?.total    || 160;
  const occupancyPct  = Math.round((occupiedTotal / totalSpots) * 100);

  const handleDeleteVehicle    = (id: number, plate: string) => setConfirmDelete({ id, plate });
  const confirmDeleteVehicle   = async () => {
    if (!confirmDelete) return;
    try {
      await apiService.deleteVehicle(confirmDelete.id);
      showToast(`Véhicule ${confirmDelete.plate} supprimé`, 'error');
      loadData(true);
    } catch { showToast('Erreur lors de la suppression', 'error'); }
    setConfirmDelete(null);
  };

  const handleQuickEntry = async () => {
    if (!newVehicle.plate || !newVehicle.spot) { showToast('Veuillez remplir tous les champs', 'warning'); return; }
    try {
      const res = await apiService.vehicleEntry({
        license_plate: newVehicle.plate,
        vehicle_type:  newVehicle.type as any,
        spot_number:   newVehicle.spot,
      });
      if (res.error) { showToast(res.error, 'error'); return; }
      showToast(`Véhicule ${newVehicle.plate} enregistré à la place ${newVehicle.spot}`, 'success');
      setShowQuickEntry(false);
      setNewVehicle({ type: 'Voiture', plate: '', spot: '' });
      loadData(true);
    } catch { showToast("Erreur lors de l'enregistrement", 'error'); }
  };

  const handleEditPlate = (id: number) => {
    const v = vehicles.find(v => v.id === id);
    if (v) setEditingVehicle({ id: v.id, plate: v.plate });
  };

  const savePlate = () => {
    if (editingVehicle) {
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? { ...v, plate: editingVehicle.plate } : v));
      setEditingVehicle(null);
      showToast('Plaque modifiée', 'success');
    }
  };

  const handleResolveReclamation = async (id: number) => {
    try {
      await apiService.updateReclamationStatus(id, 'RESOLVED');
      setResolvedIds(prev => new Set(prev).add(id));
      setReclamations(prev => prev.filter(r => r.id !== id));
      setViewingReclamation(null);
      showToast('Réclamation résolue', 'success');
    } catch { showToast('Erreur', 'error'); }
  };

  const handleApproveSubscription = async (id: number) => {
    try {
      await apiService.updateSubscriptionStatus(id, 'ACTIVE');
      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: 'Actif' } : s));
      showToast('Abonnement approuvé', 'success');
    } catch { showToast('Erreur', 'error'); }
  };

  const handleRejectSubscription = async (id: number) => {
    try {
      await apiService.updateSubscriptionStatus(id, 'CANCELLED');
      setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: 'Annulé' } : s));
      showToast('Abonnement annulé', 'error');
    } catch { showToast('Erreur', 'error'); }
  };

  const savePrice = async () => {
    if (!editingPrice) return;
    setSavingPrice(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:5000/api/pricing/${editingPrice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ label: editingPrice.label, price: parseFloat(editingPrice.price), unit: editingPrice.unit }),
      });
      if (!res.ok) { showToast('Erreur lors de la sauvegarde', 'error'); return; }
      showToast('Tarif mis à jour en base de données !', 'success');
      setEditingPrice(null);
      loadPricing();
    } catch { showToast('Erreur réseau', 'error'); }
    finally { setSavingPrice(false); }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('parking_settings', JSON.stringify(parkingSettings));
    showToast('Paramètres enregistrés', 'success');
  };

  const REPORTS = [
    { title: 'Rapport Quotidien',    subtitle: "Activité d'aujourd'hui", type: 'daily',    icon: '📅', color: 'border-blue-400/20 hover:border-blue-400/40' },
    { title: 'Rapport Hebdomadaire', subtitle: '7 derniers jours',        type: 'weekly',   icon: '📊', color: 'border-emerald-400/20 hover:border-emerald-400/40' },
    { title: 'Analyse Mensuelle',    subtitle: 'Mois en cours complet',   type: 'monthly',  icon: '📈', color: 'border-purple-400/20 hover:border-purple-400/40' },
    { title: 'Audit Sécurité',       subtitle: '30 derniers jours',       type: 'security', icon: '🔐', color: 'border-amber-400/20 hover:border-amber-400/40' },
  ];

  return (
    <div className="min-h-screen bg-bg-dark flex relative overflow-hidden">
      <PageBackground />
      <BackButton />

      <AnimatePresence>
        {/* Modal Suppression */}
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDelete(null)} className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-card-dark border border-red-500/20 p-10 rounded-3xl shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Confirmer la suppression</h3>
              <p className="text-white/40 text-sm mb-8">Supprimer <span className="font-mono text-white font-bold">{confirmDelete.plate}</span> ?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setConfirmDelete(null)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-xs py-4 rounded-2xl transition-all">Annuler</button>
                <button onClick={confirmDeleteVehicle} className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase text-xs py-4 rounded-2xl transition-all flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" />Supprimer</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Modifier Plaque */}
        {editingVehicle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingVehicle(null)} className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl">
              <h3 className="text-2xl font-black mb-8 uppercase">Modifier la plaque</h3>
              <input type="text" value={editingVehicle.plate} onChange={(e) => setEditingVehicle({ ...editingVehicle, plate: e.target.value.toUpperCase() })} className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest mb-6" autoFocus />
              <div className="flex gap-4">
                <button onClick={() => setEditingVehicle(null)} className="flex-1 btn-secondary justify-center py-4">Annuler</button>
                <button onClick={savePlate} className="flex-1 btn-primary justify-center py-4">Enregistrer</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Réclamation */}
        {viewingReclamation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingReclamation(null)} className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl">
              <div className="flex justify-between items-start mb-8">
                <div><h3 className="text-2xl font-black uppercase mb-2">{viewingReclamation.subject}</h3><p className="text-white/40 text-xs font-black uppercase tracking-widest">Client: {viewingReclamation.client} • {viewingReclamation.date}</p></div>
                <button onClick={() => setViewingReclamation(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 bg-white/5 border border-white/10 rounded-sm mb-6"><p className="text-sm text-white/60 leading-relaxed">{viewingReclamation.description || 'Aucun détail.'}</p></div>
              <div className="flex gap-4">
                <button onClick={() => setViewingReclamation(null)} className="flex-1 btn-secondary justify-center py-4">Fermer</button>
                <button onClick={() => handleResolveReclamation(viewingReclamation.id)} className="flex-1 btn-primary justify-center py-4">Marquer Résolu</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Modifier Tarif */}
        {editingPrice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !savingPrice && setEditingPrice(null)} className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl">
              <h3 className="text-2xl font-black mb-2 uppercase">Modifier le Tarif</h3>
              <p className="text-white/40 text-sm mb-8 font-medium">{editingPrice.label}</p>
              <div className="space-y-5 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Libellé</label>
                  <input type="text" value={editingPrice.label} onChange={(e) => setEditingPrice({ ...editingPrice, label: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-sm font-bold" autoFocus />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Prix (€)</label>
                  <input type="number" step="0.01" min="0" value={editingPrice.price} onChange={(e) => setEditingPrice({ ...editingPrice, price: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-2xl font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Unité</label>
                  <input type="text" value={editingPrice.unit} onChange={(e) => setEditingPrice({ ...editingPrice, unit: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-sm font-bold" placeholder="ex: par heure, par nuit..." />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setEditingPrice(null)} disabled={savingPrice} className="flex-1 btn-secondary justify-center py-4 disabled:opacity-50">Annuler</button>
                <button onClick={savePrice} disabled={savingPrice} className="flex-1 btn-primary justify-center py-4 disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingPrice ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Sauvegarde...</> : 'Enregistrer en BD'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Entrée Rapide */}
        {showQuickEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickEntry(false)} className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-2xl font-black mb-8 uppercase">Entrée Rapide</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Type</label>
                  <div className="grid grid-cols-3 gap-3">{['Voiture','Moto','Camion'].map(t => <button key={t} onClick={() => setNewVehicle({...newVehicle, type: t})} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newVehicle.type === t ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>{t}</button>)}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Plaque</label>
                  <input type="text" value={newVehicle.plate} onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})} placeholder="AB-123-CD" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Place</label>
                  <input type="text" value={newVehicle.spot} onChange={(e) => setNewVehicle({...newVehicle, spot: e.target.value.toUpperCase()})} placeholder="A001" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest" />
                  <p className="text-[10px] text-white/20 ml-1">Ex: A01, A001, A1 — format libre</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowQuickEntry(false)} className="flex-1 btn-secondary justify-center py-4 rounded-2xl">Annuler</button>
                  <button onClick={handleQuickEntry} className="flex-1 btn-primary justify-center py-4 rounded-2xl">Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-80 border-r border-white/10 flex flex-col h-screen sticky top-0 bg-bg-dark/80 backdrop-blur-2xl z-20">
        <div className="p-10 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-primary p-2 rounded-sm transform group-hover:rotate-12 transition-transform duration-300"><Car className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-black tracking-tighter uppercase">IMW<span className="text-primary">Parking</span></span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-10 space-y-2 min-h-0">
          {filteredSidebar.map((item) => (
            <motion.button key={item.id} whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-sm text-[11px] font-black tracking-widest uppercase transition-all duration-300 ${activeView === item.id ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'}`}>
              <item.icon className="w-5 h-5" />{item.label}
            </motion.button>
          ))}
        </nav>
        <div className="p-10 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-4 mb-6 bg-white/5 p-4 rounded-sm border border-white/10">
            <div className="w-12 h-12 rounded-sm bg-primary/20 flex items-center justify-center text-sm font-black text-primary ring-1 ring-primary/20">{role?.charAt(0).toUpperCase()}</div>
            <div className="overflow-hidden"><p className="text-sm font-black uppercase tracking-tight truncate">{role}</p><p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Session Active</p></div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { apiService.logout(); navigate('/'); }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-sm text-[11px] font-black tracking-widest uppercase text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all">
            <LogOut className="w-4 h-4" />Déconnexion
          </motion.button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-4">Tableau de Bord</motion.div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">{sidebarItems.find(i => i.id === activeView)?.label}</h1>
            <div className="flex items-center gap-4 mt-3">
              <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Interface {role}</p>
              <span className="text-[10px] text-white/20 font-mono">Dernière MàJ: {lastRefresh.toLocaleTimeString('fr-FR')}</span>
              <button onClick={() => loadData()} className="p-1 hover:text-primary text-white/20 transition-colors"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input type="text" placeholder="RECHERCHER..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border border-white/10 rounded-sm py-4 pl-12 pr-6 text-[11px] font-black tracking-widest focus:outline-none focus:border-primary w-64 transition-all focus:w-80 uppercase" />
            </div>
            {(role === 'agent' || role === 'admin') && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowQuickEntry(true)} className="btn-primary px-8 py-4">
                <Plus className="w-4 h-4" />ENTRÉE RAPIDE
              </motion.button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-4 text-white/40">
              <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              <span className="font-black uppercase tracking-widest text-sm">Chargement...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── VÉHICULES ── */}
            {activeView === 'vehicles' && (
              <motion.div key="vehicles" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                  <div><h3 className="text-2xl font-black uppercase tracking-tight">Contrôle des Flux</h3><p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Données en temps réel • Rafraîchissement auto 10s</p></div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Occupation</p><p className="text-lg font-black text-emerald-400">{occupiedTotal} / {totalSpots} PLACES</p></div>
                    <div className="w-16 h-16 rounded-sm border-2 border-emerald-400/20 border-t-emerald-400 flex items-center justify-center text-xs font-black">{occupancyPct}%</div>
                  </div>
                </div>
                {filteredVehicles.length === 0 ? (
                  <div className="p-20 text-center text-white/20"><Car className="w-16 h-16 mx-auto mb-6 opacity-10" /><p className="font-black uppercase tracking-widest">Aucun véhicule actif</p></div>
                ) : (
                  <table className="w-full text-left">
                    <thead><tr className="text-[10px] uppercase tracking-[0.2em] text-white/20 border-b border-white/10"><th className="px-10 py-6 font-black">Véhicule</th><th className="px-10 py-6 font-black">Plaque</th><th className="px-10 py-6 font-black">Place</th><th className="px-10 py-6 font-black">Entrée</th><th className="px-10 py-6 font-black">Statut</th><th className="px-10 py-6 font-black text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredVehicles.map((row) => (
                        <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-10 py-6"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-sm flex items-center justify-center ${row.type==='Voiture'?'bg-blue-400/10 text-blue-400':row.type==='Moto'?'bg-amber-400/10 text-amber-400':'bg-purple-400/10 text-purple-400'}`}>{row.type==='Voiture'?<Car className="w-6 h-6"/>:row.type==='Moto'?<Activity className="w-6 h-6"/>:<Truck className="w-6 h-6"/>}</div><span className="text-sm font-black uppercase tracking-tight">{row.type}</span></div></td>
                          <td className="px-10 py-6"><span className="text-xs font-mono bg-white/10 px-4 py-2 rounded-sm border border-white/10 group-hover:border-primary/50 transition-all">{row.plate}</span></td>
                          <td className="px-10 py-6"><span className="text-sm text-white/60 font-black uppercase tracking-widest">{row.spot}</span></td>
                          <td className="px-10 py-6"><span className="text-sm text-white/60">{row.time}</span></td>
                          <td className="px-10 py-6"><span className="text-[10px] font-black tracking-widest px-4 py-1.5 rounded-sm uppercase bg-blue-400/10 text-blue-400 border border-blue-400/20">{row.status}</span></td>
                          <td className="px-10 py-6"><div className="flex items-center justify-end gap-4">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleEditPlate(row.id)} className="p-3 rounded-sm text-white/40 hover:text-white hover:bg-white/10 transition-all"><Edit2 className="w-4 h-4" /></motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteVehicle(row.id, row.plate)} className="p-3 rounded-sm text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"><Trash2 className="w-4 h-4" /></motion.button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {/* ── PLAN DU PARKING ✅ ── */}
            {activeView === 'map' && (
              <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card-dark border border-red-500/20 p-5 rounded-2xl text-center">
                    <p className="text-3xl font-black text-red-400">{occupiedTotal}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Occupées</p>
                  </div>
                  <div className="bg-card-dark border border-emerald-400/20 p-5 rounded-2xl text-center">
                    <p className="text-3xl font-black text-emerald-400">{totalSpots - occupiedTotal}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Libres</p>
                  </div>
                  <div className="bg-card-dark border border-white/10 p-5 rounded-2xl text-center">
                    <p className="text-3xl font-black">{totalSpots}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Total</p>
                  </div>
                </div>
                {/* ✅ Composant Plan avec places réelles de la BD */}
                <ParkingMap occupiedSpots={occupiedSpots} />
              </motion.div>
            )}

            {/* ── SCANNER ── */}
            {activeView === 'scanner' && (
              <motion.div key="scanner" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto bg-card-dark border border-white/5 p-12 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <div className="relative z-10">
                  <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-primary/5"><ScanLine className="w-12 h-12 text-primary" /></div>
                  <h3 className="text-2xl font-bold mb-4">Scanner de Ticket</h3>
                  <p className="text-white/40 mb-10">Placez le QR code du ticket client devant la caméra.</p>
                  <button onClick={() => showToast('Fonctionnalité bientôt disponible', 'info')} className="btn-primary w-full py-4 rounded-2xl justify-center">Saisir Code Manuellement</button>
                </div>
              </motion.div>
            )}

            {/* ── STATS ── */}
                        {activeView === 'stats' && (
              <StatsView stats={stats} occupiedTotal={occupiedTotal} totalSpots={totalSpots} occupancyPct={occupancyPct} />
            )}
            {activeView === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-2xl font-black uppercase tracking-tight">Rapports Financiers</h3><p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Téléchargez les données réelles en format Excel (.xlsx)</p></div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => downloadReport('monthly')} disabled={!!downloadingReport} className="btn-primary px-8 py-4 disabled:opacity-50">
                    {downloadingReport==='monthly'?<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Génération...</>:<><Download className="w-4 h-4"/>RAPPORT MENSUEL</>}
                  </motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {REPORTS.map((r)=>(<motion.div key={r.type} whileHover={{scale:1.01}} className={`bg-card-dark border ${r.color} p-8 rounded-3xl flex items-center justify-between transition-all group cursor-pointer`} onClick={()=>!downloadingReport&&downloadReport(r.type)}><div className="flex items-center gap-5"><div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 group-hover:border-white/20 transition-all">{r.icon}</div><div><h4 className="font-black text-base uppercase tracking-tight">{r.title}</h4><p className="text-xs text-white/40 mt-1 font-medium">{r.subtitle}</p><p className="text-[10px] text-white/20 mt-1 font-mono uppercase tracking-widest">Format .xlsx</p></div></div><motion.div whileHover={{scale:1.1}} whileTap={{scale:0.9}} className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 transition-all ${downloadingReport===r.type?'bg-primary border-primary':'bg-white/5 group-hover:bg-primary group-hover:border-primary'}`}>{downloadingReport===r.type?<svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>:<Download className="w-5 h-5 text-white/40 group-hover:text-white transition-all"/>}</motion.div></motion.div>))}
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"><p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Contenu des fichiers Excel</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{sheet:'Résumé',desc:'KPI & indicateurs clés'},{sheet:'Entrées & Sorties',desc:'Historique des passages'},{sheet:'Utilisateurs',desc:'Comptes & rôles'},{sheet:'Abonnements',desc:'Plans actifs & expirés'}].map((s,i)=>(<div key={i} className="flex items-start gap-3"><div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary text-[10px] font-black flex-shrink-0 mt-0.5">{i+1}</div><div><p className="text-xs font-black text-white/70">{s.sheet}</p><p className="text-[10px] text-white/30">{s.desc}</p></div></div>))}</div></div>
              </motion.div>
            )}

            {/* ── ABONNEMENTS ── */}
            {activeView === 'subs' && (
              <motion.div key="subs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card-dark border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between"><h3 className="font-bold text-lg">Demandes d'Abonnements</h3><span className="text-xs font-bold text-white/40">{subscriptions.length} total</span></div>
                <div className="divide-y divide-white/5">
                  {subscriptions.length===0?<div className="p-20 text-center text-white/20"><p className="font-black uppercase tracking-widest">Aucun abonnement</p></div>
                  :subscriptions.map(sub=>(<div key={sub.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors"><div className="flex items-center gap-6"><div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-400"><Users className="w-6 h-6"/></div><div><h4 className="font-bold">{sub.user}</h4><p className="text-xs text-white/40">Plaque: <span className="font-mono text-white/60">{sub.plate}</span> • {sub.type}</p></div></div><div className="flex items-center gap-4"><span className={`text-[10px] font-bold px-3 py-1 rounded-full ${sub.status==='Actif'?'bg-emerald-400/10 text-emerald-400':sub.status==='Expiré'?'bg-amber-400/10 text-amber-400':'bg-white/10 text-white/40'}`}>{sub.status}</span>{sub.status==='En attente'&&<div className="flex gap-2"><button onClick={()=>handleApproveSubscription(sub.id)} className="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Approuver</button><button onClick={()=>handleRejectSubscription(sub.id)} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Rejeter</button></div>}</div></div>))}
                </div>
              </motion.div>
            )}

            {/* ── RÉCLAMATIONS ── */}
            {activeView === 'reclamations' && (
              <motion.div key="reclamations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div><h3 className="font-bold text-lg">Centre de Support & Réclamations</h3><p className="text-[10px] text-white/30 mt-1 font-medium">{reclamations.length} réclamation{reclamations.length!==1?'s':''} en attente</p></div>
                  <div className="flex gap-2">
                    <button onClick={()=>setReclamationFilter('all')} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${reclamationFilter==='all'?'bg-primary text-white':'bg-white/5 border border-white/10'}`}>Toutes</button>
                    <button onClick={()=>setReclamationFilter('urgent')} className={`px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${reclamationFilter==='urgent'?'bg-red-400 text-white':'bg-red-400/10 border border-red-400/20 text-red-400'}`}>Urgentes ({reclamations.filter(r=>r.status==='Urgent').length})</button>
                  </div>
                </div>
                {reclamations.length===0
                  ?<div className="bg-card-dark border border-white/5 p-20 rounded-[2rem] text-center text-white/20"><CheckCircle2 className="w-16 h-16 mx-auto mb-6 opacity-10 text-emerald-400"/><p className="font-black uppercase tracking-widest">Aucune réclamation en attente</p><p className="text-[10px] text-white/20 mt-2">Toutes les réclamations ont été traitées</p></div>
                  :<div className="grid grid-cols-1 gap-4">{reclamations.filter(rec=>reclamationFilter==='all'||rec.status==='Urgent').map(rec=>(<div key={rec.id} className="bg-card-dark border border-white/5 p-8 rounded-[2rem] flex items-center justify-between group hover:border-primary/30 transition-all shadow-xl"><div className="flex items-center gap-6"><div className={`p-4 rounded-2xl ${rec.status==='Urgent'?'bg-red-400/10 text-red-400':'bg-blue-400/10 text-blue-400'}`}><AlertCircle className="w-7 h-7"/></div><div><h4 className="text-lg font-bold group-hover:text-primary transition-colors">{rec.subject}</h4><div className="flex items-center gap-3 mt-1"><p className="text-sm text-white/60 font-medium">{rec.client}</p><span className="w-1 h-1 rounded-full bg-white/20"/><p className="text-xs text-white/40">{rec.date}</p><span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${rec.status==='Urgent'?'bg-red-400/10 text-red-400':'bg-blue-400/10 text-blue-400'}`}>{rec.status}</span></div></div></div><div className="flex items-center gap-3"><button onClick={()=>setViewingReclamation(rec)} className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all border border-white/5">Détails</button><button onClick={()=>handleResolveReclamation(rec.id)} className="bg-primary hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"><CheckCircle2 className="w-4 h-4"/>Résoudre</button></div></div>))}</div>}
              </motion.div>
            )}

            {/* ── LOGS ── */}
            {activeView === 'logs' && <LogsView />}

            {/* ── TARIFS ── */}
            {activeView === 'pricing' && (
              <motion.div key="pricing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card-dark border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                  <div className="flex items-center justify-between"><h3 className="text-xl font-bold">Configuration des Tarifs</h3><button onClick={loadPricing} className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-primary transition-all"><RefreshCw className="w-4 h-4"/></button></div>
                  {pricingLoading?(<div className="flex items-center justify-center h-32"><svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg></div>):(
                    <div className="space-y-4">
                      {pricingData.map((plan:any)=>(<div key={plan.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"><div><p className="text-sm font-bold text-white">{plan.label}</p><p className="text-[10px] text-white/30 font-mono mt-0.5">{plan.unit}</p></div><div className="flex items-center gap-4"><span className="text-lg font-black text-primary">{Number(plan.price).toFixed(2)}€</span><button onClick={()=>setEditingPrice({id:plan.id,label:plan.label,price:String(plan.price),unit:plan.unit})} className="p-2 hover:bg-white/10 rounded-lg text-primary transition-colors"><Edit2 className="w-4 h-4"/></button></div></div>))}
                      {pricingData.length===0&&(<div className="p-10 text-center text-white/20"><DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20"/><p className="text-xs font-black uppercase tracking-widest">Aucun tarif trouvé</p></div>)}
                    </div>
                  )}
                </div>
                <div className="bg-primary/10 border border-primary/20 p-10 rounded-[2.5rem] flex flex-col justify-center text-center space-y-6">
                  <ShieldCheck className="w-16 h-16 text-primary mx-auto"/>
                  <div><h4 className="text-xl font-bold mb-3">Sécurité des Tarifs</h4><p className="text-sm text-white/60 leading-relaxed">Toute modification est enregistrée directement en base de données MySQL.</p></div>
                  <div className="flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/><span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Synchronisé avec MySQL</span></div>
                </div>
              </motion.div>
            )}

            {/* ── UTILISATEURS ── */}
            {activeView === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card-dark border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]"><div><h3 className="text-2xl font-black uppercase tracking-tight">Utilisateurs Enregistrés</h3><p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Données réelles depuis MySQL.</p></div><div className="text-xs text-white/40 font-black uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full border border-white/10">{registeredUsers.length} Utilisateurs</div></div>
                <div className="divide-y divide-white/5">
                  {registeredUsers.length===0?<div className="p-32 text-center text-white/20"><Users className="w-16 h-16 mx-auto mb-6 opacity-5"/><p className="text-xl font-black uppercase tracking-widest">Aucun utilisateur</p></div>
                  :registeredUsers.map((user:any,i:number)=>(<div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"><div className="flex items-center gap-6"><div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">{user.name?.charAt(0)}</div><div><h4 className="text-lg font-bold group-hover:text-primary transition-colors">{user.name}</h4><p className="text-sm text-white/40">{user.email} • <span className="text-white/60">{user.role}</span></p></div></div><span className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase ${user.role==='CLIENT'?'bg-blue-400/10 text-blue-400 border border-blue-400/20':user.role==='AGENT'?'bg-amber-400/10 text-amber-400 border border-amber-400/20':user.role==='MANAGER'?'bg-purple-400/10 text-purple-400 border border-purple-400/20':'bg-primary/10 text-primary border border-primary/20'}`}>{user.role}</span></div>))}
                </div>
              </motion.div>
            )}

            {/* ── PARAMÈTRES ── */}
            {activeView === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-8">
                <div className="bg-card-dark border border-white/5 p-12 rounded-[3rem] space-y-10 shadow-2xl">
                  <div><h3 className="text-2xl font-black uppercase tracking-tight">Paramètres Système</h3><p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Configuration globale.</p></div>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom de l'Établissement</label><input type="text" value={parkingSettings.name} onChange={(e)=>setParkingSettings({...parkingSettings,name:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 focus:outline-none focus:border-primary text-sm font-bold transition-all"/></div>
                      <div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Capacité Totale</label><input type="number" value={parkingSettings.capacity} onChange={(e)=>setParkingSettings({...parkingSettings,capacity:parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 focus:outline-none focus:border-primary text-sm font-bold transition-all"/></div>
                    </div>
                    <div className="space-y-6">{[{key:'notifications',label:'Notifications Critiques',desc:"Alertes email quand l'occupation dépasse 90%"},{key:'maintenance',label:'Mode Maintenance',desc:'Désactiver les nouvelles réservations'}].map(({key,label,desc})=>(<div key={key} className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5"><div><h4 className="text-sm font-black uppercase tracking-tight">{label}</h4><p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">{desc}</p></div><button onClick={()=>setParkingSettings({...parkingSettings,[key]:!(parkingSettings as any)[key]})} className={`w-14 h-8 rounded-full relative transition-all ${(parkingSettings as any)[key]?'bg-primary shadow-lg shadow-primary/20':'bg-white/10'}`}><motion.div animate={{x:(parkingSettings as any)[key]?24:4}} className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"/></button></div>))}</div>
                  </div>
                  <button onClick={handleSaveSettings} className="w-full btn-primary py-5 rounded-[1.5rem] justify-center text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20">Sauvegarder la configuration</button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>
    </div>
  );
}