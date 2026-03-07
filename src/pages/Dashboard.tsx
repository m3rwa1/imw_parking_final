import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  DollarSign,
  FileText,
  ShieldCheck,
  CreditCard,
  Maximize,
  ScanLine,
  Activity,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';
import { apiService } from '../services/api';

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  
  // Set initial view based on role
  const getInitialView = () => {
    if (role === 'admin') return 'reclamations';
    if (role === 'manager') return 'stats';
    return 'vehicles';
  };

  const [activeView, setActiveView] = useState(getInitialView());
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [logs] = useState([
    { id: 1, action: 'Connexion Agent', user: 'Agent #12', time: '10:05' },
    { id: 2, action: 'Modification Plaque', user: 'Admin', time: '09:30' },
    { id: 3, action: 'Suppression Entrée', user: 'Agent #05', time: '08:45' },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [vehiclesRes, reclamationsRes, subscriptionsRes] = await Promise.all([
          apiService.getActiveVehicles().catch(() => ({ data: [] })),
          apiService.getAllReclamations().catch(() => ({ data: [] })),
          apiService.getAllSubscriptions().catch(() => ({ data: [] }))
        ]);
        
        setVehicles(vehiclesRes.data || vehiclesRes || []);
        setReclamations(reclamationsRes.data || reclamationsRes || []);
        setSubscriptions(subscriptionsRes.data || subscriptionsRes || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const sidebarItems = [
    // Agent Features
    { id: 'vehicles', icon: Car, label: 'Gestion Véhicules', role: ['agent', 'admin'] },
    { id: 'map', icon: MapPin, label: 'Plan du Parking', role: ['agent', 'admin'] },
    { id: 'scanner', icon: ScanLine, label: 'Scanner Ticket', role: ['agent', 'admin'] },
    
    // Manager Features
    { id: 'stats', icon: BarChart3, label: 'Statistiques', role: ['manager', 'admin'] },
    { id: 'reports', icon: FileText, label: 'Rapports Financiers', role: ['manager', 'admin'] },
    { id: 'subs', icon: CreditCard, label: 'Abonnements', role: ['manager', 'admin'] },
    
    // Admin Features
    { id: 'reclamations', icon: MessageSquare, label: 'Réclamations', role: ['admin'] },
    { id: 'logs', icon: Activity, label: 'Logs Système', role: ['admin'] },
    { id: 'pricing', icon: DollarSign, label: 'Gestion Tarifs', role: ['admin'] },
    { id: 'users', icon: Users, label: 'Utilisateurs', role: ['admin'] },
    { id: 'settings', icon: Settings, label: 'Paramètres', role: ['admin'] },
  ];

  const filteredSidebar = sidebarItems.filter(item => item.role.includes(role || ''));

  const handleDeleteVehicle = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer ce véhicule ?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const handleEditPlate = (id: number) => {
    const newPlate = prompt('Entrez la nouvelle plaque d\'immatriculation :');
    if (newPlate) {
      setVehicles(vehicles.map(v => v.id === id ? { ...v, plate: newPlate } : v));
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex relative overflow-hidden">
      <PageBackground />
      <BackButton />
      
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/10 flex flex-col sticky top-0 h-screen bg-bg-dark/80 backdrop-blur-2xl z-20">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-16 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-primary p-2 rounded-sm transform group-hover:rotate-12 transition-transform duration-300">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">IMW<span className="text-primary">Parking</span></span>
          </div>

          <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] pr-2 custom-scrollbar">
            {filteredSidebar.map((item) => (
              <motion.button 
                key={item.id}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-sm text-[11px] font-black tracking-widest uppercase transition-all duration-300 ${
                  activeView === item.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-white/10">
          <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-sm border border-white/10">
            <div className="w-12 h-12 rounded-sm bg-primary/20 flex items-center justify-center text-sm font-black text-primary ring-1 ring-primary/20">
              {role?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black uppercase tracking-tight truncate">{role}</p>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Session Active</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-sm text-[11px] font-black tracking-widest uppercase text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-4"
            >
              Tableau de Bord
            </motion.div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">
              {sidebarItems.find(i => i.id === activeView)?.label}
            </h1>
            <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-widest">Interface {role} — Optimisation des performances de gestion.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="RECHERCHER..."
                className="bg-white/5 border border-white/10 rounded-sm py-4 pl-12 pr-6 text-[11px] font-black tracking-widest focus:outline-none focus:border-primary w-64 transition-all focus:w-80 uppercase"
              />
            </div>
            {role === 'agent' && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary px-8 py-4"
              >
                <Plus className="w-4 h-4" />
                ENTRÉE RAPIDE
              </motion.button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* AGENT VIEWS */}
          {activeView === 'vehicles' && (
            <motion.div 
              key="vehicles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden shadow-2xl"
            >
              <div className="p-10 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Contrôle des Flux</h3>
                  <p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Modification et suppression des entrées en temps réel.</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Occupation</p>
                    <p className="text-lg font-black text-emerald-400">124 / 160 PLACES</p>
                  </div>
                  <div className="w-16 h-16 rounded-sm border-2 border-emerald-400/20 border-t-emerald-400 flex items-center justify-center text-xs font-black">
                    78%
                  </div>
                </div>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.2em] text-white/20 border-b border-white/10">
                    <th className="px-10 py-6 font-black">Véhicule</th>
                    <th className="px-10 py-6 font-black">Plaque</th>
                    <th className="px-10 py-6 font-black">Place</th>
                    <th className="px-10 py-6 font-black">Entrée</th>
                    <th className="px-10 py-6 font-black">Statut</th>
                    <th className="px-10 py-6 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {vehicles.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-sm bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Car className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight">{row.type}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-xs font-mono bg-white/10 px-4 py-2 rounded-sm border border-white/10 group-hover:border-primary/50 transition-all">
                          {row.plate}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm text-white/60 font-black uppercase tracking-widest">{row.spot}</span>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-sm text-white/60 font-medium">{row.time}</span>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-sm uppercase ${
                          row.status === 'En cours' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' : 'bg-white/10 text-white/40 border border-white/10'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center justify-end gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditPlate(row.id)}
                            className="p-3 rounded-sm text-white/40 hover:text-white transition-all"
                            aria-label={`Modifier la plaque du véhicule ${row.plate}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteVehicle(row.id)}
                            className="p-3 rounded-sm text-white/40 hover:text-red-400 transition-all"
                            aria-label={`Supprimer l'entrée du véhicule ${row.plate}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeView === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-8 gap-4">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:scale-105 ${
                      i % 5 === 0 
                        ? 'bg-white/5 border-white/10 text-white/20' 
                        : 'bg-primary/10 border-primary/20 text-primary'
                    }`}
                  >
                    <Car className={`w-6 h-6 ${i % 5 === 0 ? 'opacity-20' : 'opacity-100'}`} />
                    <span className="text-[10px] font-bold">A-{i+1}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-6 justify-center p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-white/60">Occupé</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/10 border border-white/20" />
                  <span className="text-xs text-white/60">Libre</span>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'scanner' && (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto bg-card-dark border border-white/5 p-12 rounded-[3rem] text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 animate-pulse" />
              <div className="relative z-10">
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-primary/5">
                  <ScanLine className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Scanner de Ticket</h3>
                <p className="text-white/40 mb-10">Placez le QR code du ticket client devant la caméra pour valider la sortie ou vérifier le paiement.</p>
                <div className="aspect-square w-64 mx-auto border-2 border-dashed border-primary/40 rounded-3xl flex items-center justify-center mb-10 relative" role="img" aria-label="Zone de capture vidéo pour scanner QR code">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                  <div className="w-full h-1 bg-primary/40 absolute animate-[scan_2s_linear_infinite]" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60">Caméra Active</span>
                </div>
                <button className="btn-primary w-full py-4 rounded-2xl justify-center" aria-label="Saisir manuellement le code de ticket">Saisir Code Manuellement</button>
              </div>
            </motion.div>
          )}

          {/* MANAGER VIEWS */}
          {activeView === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem] hover:border-primary/20 transition-all group">
                  <TrendingUp className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
                  <h4 className="text-white/40 text-xs uppercase tracking-widest mb-2 font-bold">Chiffre d'Affaires Mensuel</h4>
                  <p className="text-5xl font-bold tracking-tighter">34,500€</p>
                  <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-3 py-1 rounded-full">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+8.4% vs mois dernier</span>
                  </div>
                </div>
                {/* ... other stats ... */}
                <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem]">
                  <Users className="w-10 h-10 text-blue-400 mb-6" />
                  <h4 className="text-white/40 text-xs uppercase tracking-widest mb-2 font-bold">Nouveaux Abonnés</h4>
                  <p className="text-5xl font-bold tracking-tighter">42</p>
                  <div className="mt-6 flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-400/10 w-fit px-3 py-1 rounded-full">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+15% cette semaine</span>
                  </div>
                </div>
                <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem]">
                  <Clock className="w-10 h-10 text-purple-400 mb-6" />
                  <h4 className="text-white/40 text-sm uppercase tracking-widest mb-2 font-bold">Taux d'Occupation</h4>
                  <p className="text-5xl font-bold tracking-tighter">78%</p>
                  <div className="mt-6 flex items-center gap-2 text-red-400 text-sm font-bold bg-red-400/10 w-fit px-3 py-1 rounded-full">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>-2% vs hier</span>
                  </div>
                </div>
              </div>

              <div className="bg-card-dark border border-white/5 p-10 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xl font-bold">Analyse des revenus journaliers</h3>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="period-select" className="text-[10px] text-white/40 font-bold uppercase">Période</label>
                    <select id="period-select" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none" aria-label="Sélectionner la période">
                      <option>7 derniers jours</option>
                      <option>30 derniers jours</option>
                    </select>
                  </div>
                </div>
                <div className="h-80 flex items-end gap-6">
                  {[40, 65, 45, 90, 55, 75, 85].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                      <div className="relative w-full">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.1, duration: 1 }}
                          className="w-full bg-primary/20 group-hover:bg-primary transition-all rounded-2xl relative"
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {h * 15}€
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[10px] text-white/40 font-bold uppercase">Jour {i+1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Rapport Quotidien', date: '02 Mars 2024', size: '1.2 MB' },
                  { title: 'Rapport Hebdomadaire', date: '26 Fév - 02 Mars', size: '4.5 MB' },
                  { title: 'Analyse Mensuelle', date: 'Février 2024', size: '12.8 MB' },
                  { title: 'Audit Sécurité', date: '01 Mars 2024', size: '0.8 MB' },
                ].map((report, i) => (
                  <div key={i} className="bg-card-dark border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">{report.title}</h4>
                        <p className="text-xs text-white/40">{report.date} • {report.size}</p>
                      </div>
                    </div>
                    <button className="p-3 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all" aria-label={`Télécharger le rapport: ${report.title}`}>
                      <ArrowDownLeft className="w-5 h-5 -rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'subs' && (
            <motion.div 
              key="subs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-dark border border-white/5 rounded-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg">Demandes d'Abonnements</h3>
                <button className="text-xs font-bold text-primary hover:underline">Historique complet</button>
              </div>
              <div className="divide-y divide-white/5">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">{sub.user}</h4>
                        <p className="text-xs text-white/40">Plaque: <span className="font-mono text-white/60">{sub.plate}</span> • Type: {sub.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                        sub.status === 'Actif' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/10 text-white/40'
                      }`}>
                        {sub.status}
                      </span>
                      {sub.status === 'En attente' && (
                        <div className="flex gap-2">
                          <button className="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all" aria-label={`Approuver l'abonnement de ${sub.user}`}>Approuver</button>
                          <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all" aria-label={`Rejeter l'abonnement de ${sub.user}`}>Rejeter</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ADMIN VIEWS */}
          {activeView === 'reclamations' && (
            <motion.div 
              key="reclamations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Centre de Support & Réclamations</h3>
                <div className="flex gap-2">
                  <button className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-colors">Toutes</button>
                  <button className="px-5 py-2.5 rounded-full bg-red-400/10 border border-red-400/20 text-xs font-bold text-red-400">Urgentes (2)</button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reclamations.map((rec) => (
                  <div key={rec.id} className="bg-card-dark border border-white/5 p-8 rounded-[2rem] flex items-center justify-between group hover:border-primary/30 transition-all shadow-xl">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${rec.status === 'Urgent' ? 'bg-red-400/10 text-red-400' : 'bg-blue-400/10 text-blue-400'}`}>
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{rec.subject}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-white/60 font-medium">{rec.client}</p>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <p className="text-xs text-white/40">{rec.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all border border-white/5">
                        Détails
                      </button>
                      <button className="bg-primary hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
                        <CheckCircle2 className="w-4 h-4" />
                        Résoudre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-dark border border-white/5 rounded-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-bold">Journal d'Audit Système</h3>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Système Opérationnel
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {logs.map((log) => (
                  <div key={log.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      <span className="text-sm font-bold">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-xs text-white/40 font-medium">{log.user}</span>
                      <span className="text-xs font-mono text-white/20">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-card-dark border border-white/5 p-10 rounded-[2.5rem] space-y-8">
                <h3 className="text-xl font-bold">Configuration des Tarifs</h3>
                <div className="space-y-6">
                  {[
                    { label: 'Tarif Horaire (Standard)', value: '2.50€' },
                    { label: 'Tarif Nuit (20h - 08h)', value: '1.50€' },
                    { label: 'Forfait Journée (24h)', value: '15.00€' },
                    { label: 'Abonnement Mensuel', value: '85.00€' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm text-white/60">{p.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{p.value}</span>
                        <button className="p-2 hover:bg-white/10 rounded-lg text-primary" aria-label={`Modifier le tarif: ${p.label}`}>
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full btn-primary py-4 rounded-2xl justify-center">Enregistrer les Tarifs</button>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 p-10 rounded-[2.5rem] flex flex-col justify-center text-center">
                <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
                <h4 className="text-xl font-bold mb-4">Sécurité des Tarifs</h4>
                <p className="text-sm text-white/60 leading-relaxed">
                  Toute modification des tarifs est enregistrée dans les logs système et nécessite une validation à deux facteurs pour les changements majeurs.
                </p>
              </div>
            </motion.div>
          )}

          {/* Fallback placeholder for other views */}
          {['users', 'settings'].includes(activeView) && (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-96 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-[3rem]"
            >
              <Settings className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-bold">Module en cours de déploiement</p>
              <p className="text-sm">Cette fonctionnalité sera disponible dans la prochaine mise à jour.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
