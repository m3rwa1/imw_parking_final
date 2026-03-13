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
  Truck,
  Activity,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ type: 'Voiture', plate: '', spot: '' });
  const [editingVehicle, setEditingVehicle] = useState<{id: number, plate: string} | null>(null);
  const [editingPrice, setEditingPrice] = useState<{index: number, label: string, value: string} | null>(null);
  const [viewingReclamation, setViewingReclamation] = useState<typeof reclamations[0] | null>(null);
  const [reclamationFilter, setReclamationFilter] = useState<'all' | 'urgent'>('all');
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('parking_users') || '[]');
    setRegisteredUsers(users);
  }, []);
  
  const [vehicles, setVehicles] = useState([
    { id: 1, type: 'Voiture', plate: 'AB-123-CD', time: '14:20', status: 'En cours', spot: 'A-12' },
    { id: 2, type: 'Moto', plate: 'XY-987-ZZ', time: '13:45', status: 'Sorti', exit: '15:10', spot: 'B-05' },
    { id: 3, type: 'Camion', plate: 'EF-456-GH', time: '12:10', status: 'En cours', spot: 'C-01' },
    { id: 4, type: 'Voiture', plate: 'JK-001-LM', time: '11:30', status: 'Sorti', exit: '14:00', spot: 'A-08' },
  ]);

  const [reclamations, setReclamations] = useState([
    { id: 1, client: 'Jean Dupont', subject: 'Problème barrière', date: 'Aujourd\'hui', status: 'Urgent' },
    { id: 2, client: 'Marie Curie', subject: 'Erreur facturation', date: 'Hier', status: 'En attente' },
  ]);

  const [logs] = useState([
    { id: 1, action: 'Connexion Agent', user: 'Agent #12', time: '10:05' },
    { id: 2, action: 'Modification Plaque', user: 'Admin', time: '09:30' },
    { id: 3, action: 'Suppression Entrée', user: 'Agent #05', time: '08:45' },
  ]);

  const [subscriptions, setSubscriptions] = useState([
    { id: 1, user: 'Paul Martin', plate: 'AA-001-BB', type: 'Mensuel', status: 'En attente' },
    { id: 2, user: 'Sophie Bernard', plate: 'CC-222-DD', type: 'Annuel', status: 'Actif' },
  ]);

  const [pricingData, setPricingData] = useState(() => {
    const saved = localStorage.getItem('parking_pricing');
    return saved ? JSON.parse(saved) : [
      { label: 'Tarif Horaire (Standard)', value: '2.50€' },
      { label: 'Tarif Nuit (20h - 08h)', value: '1.50€' },
      { label: 'Forfait Journée (24h)', value: '15.00€' },
      { label: 'Abonnement Mensuel', value: '85.00€' },
    ];
  });

  const [parkingSettings, setParkingSettings] = useState(() => {
    const saved = localStorage.getItem('parking_settings');
    return saved ? JSON.parse(saved) : {
      name: 'IMW PARKING MAROC',
      capacity: 160,
      notifications: true,
      maintenance: false
    };
  });

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

  const handleQuickEntry = () => {
    if (!newVehicle.plate || !newVehicle.spot) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    const id = vehicles.length + 1;
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setVehicles([{ id, ...newVehicle, time, status: 'En cours' }, ...vehicles]);
    setShowQuickEntry(false);
    setNewVehicle({ type: 'Voiture', plate: '', spot: '' });
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.spot.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleEditPlate = (id: number) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      setEditingVehicle({ id: vehicle.id, plate: vehicle.plate });
    }
  };

  const handleResolveReclamation = (id: number) => {
    setReclamations(reclamations.filter(r => r.id !== id));
    setViewingReclamation(null);
    alert('Réclamation résolue avec succès.');
  };

  const handleApproveSubscription = (id: number) => {
    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: 'Actif' } : s));
    alert('Abonnement approuvé.');
  };

  const handleRejectSubscription = (id: number) => {
    setSubscriptions(subscriptions.map(s => s.id === id ? { ...s, status: 'Rejeté' } : s));
    alert('Abonnement rejeté.');
  };

  const savePrice = () => {
    if (editingPrice) {
      const newData = [...pricingData];
      newData[editingPrice.index] = { label: editingPrice.label, value: editingPrice.value };
      setPricingData(newData);
      localStorage.setItem('parking_pricing', JSON.stringify(newData));
      setEditingPrice(null);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('parking_settings', JSON.stringify(parkingSettings));
    alert('Paramètres enregistrés avec succès.');
  };

  const savePlate = () => {
    if (editingVehicle) {
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? { ...v, plate: editingVehicle.plate } : v));
      setEditingVehicle(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex relative overflow-hidden">
      <PageBackground />
      <BackButton />

      {/* Edit Modal */}
      <AnimatePresence>
        {editingVehicle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingVehicle(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Modifier la plaque</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nouvelle immatriculation</label>
                  <input 
                    type="text"
                    value={editingVehicle.plate}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, plate: e.target.value.toUpperCase() })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                    autoFocus
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingVehicle(null)}
                    className="flex-1 btn-secondary justify-center py-4"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={savePlate}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingPrice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPrice(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Modifier le Tarif</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{editingPrice.label}</label>
                  <input 
                    type="text"
                    value={editingPrice.value}
                    onChange={(e) => setEditingPrice({ ...editingPrice, value: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                    autoFocus
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingPrice(null)}
                    className="flex-1 btn-secondary justify-center py-4"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={savePrice}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {viewingReclamation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingReclamation(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{viewingReclamation.subject}</h3>
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest">Client: {viewingReclamation.client} • {viewingReclamation.date}</p>
                </div>
                <button onClick={() => setViewingReclamation(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-sm">
                  <p className="text-sm text-white/60 leading-relaxed">
                    Ceci est un message détaillé de la réclamation. Le client signale un problème avec le système de barrière à l'entrée A-12.
                  </p>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setViewingReclamation(null)}
                    className="flex-1 btn-secondary justify-center py-4"
                  >
                    Fermer
                  </button>
                  <button 
                    onClick={() => handleResolveReclamation(viewingReclamation.id)}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Marquer comme Résolu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showQuickEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickEntry(false)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Entrée Rapide</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Type de véhicule</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Voiture', 'Moto', 'Camion'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewVehicle({ ...newVehicle, type: t })}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          newVehicle.type === t 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Plaque d'immatriculation</label>
                  <input 
                    type="text"
                    value={newVehicle.plate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                    placeholder="AB-123-CD"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Place assignée</label>
                  <input 
                    type="text"
                    value={newVehicle.spot}
                    onChange={(e) => setNewVehicle({ ...newVehicle, spot: e.target.value.toUpperCase() })}
                    placeholder="A-01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowQuickEntry(false)}
                    className="flex-1 btn-secondary justify-center py-4 rounded-2xl"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleQuickEntry}
                    className="flex-1 btn-primary justify-center py-4 rounded-2xl"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-sm py-4 pl-12 pr-6 text-[11px] font-black tracking-widest focus:outline-none focus:border-primary w-64 transition-all focus:w-80 uppercase"
              />
            </div>
            {(role === 'agent' || role === 'admin') && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowQuickEntry(true)}
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
                  {filteredVehicles.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-colors ${
                            row.type === 'Voiture' ? 'bg-blue-400/10 text-blue-400' :
                            row.type === 'Moto' ? 'bg-amber-400/10 text-amber-400' :
                            'bg-purple-400/10 text-purple-400'
                          }`}>
                            {row.type === 'Voiture' && <Car className="w-6 h-6" />}
                            {row.type === 'Moto' && <Activity className="w-6 h-6" />}
                            {row.type === 'Camion' && <Truck className="w-6 h-6" />}
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
                            title="Modifier la plaque"
                          >
                            <Edit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteVehicle(row.id)}
                            className="p-3 rounded-sm text-white/40 hover:text-red-400 transition-all"
                            title="Supprimer l'entrée"
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
                <div className="aspect-square w-64 mx-auto border-2 border-dashed border-primary/40 rounded-3xl flex items-center justify-center mb-10 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                  <div className="w-full h-1 bg-primary/40 absolute animate-[scan_2s_linear_infinite]" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60">Caméra Active</span>
                </div>
                <button 
                  onClick={() => alert('Fonctionnalité de saisie manuelle bientôt disponible.')}
                  className="btn-primary w-full py-4 rounded-2xl justify-center"
                >
                  Saisir Code Manuellement
                </button>
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
                  <div className="flex gap-2">
                    {['7J', '30J', '90J'].map(period => (
                      <button 
                        key={period}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                          period === '7J' ? 'bg-primary text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
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
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Rapports Financiers</h3>
                <button 
                  onClick={() => alert('Génération d\'un nouveau rapport en cours...')}
                  className="btn-primary px-6 py-3 rounded-2xl text-xs"
                >
                  Générer un rapport
                </button>
              </div>
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
                    <button 
                      onClick={() => alert(`Téléchargement du ${report.title}...`)}
                      className="p-3 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all"
                    >
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
                          <button 
                            onClick={() => handleApproveSubscription(sub.id)}
                            className="bg-primary hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            Approuver
                          </button>
                          <button 
                            onClick={() => handleRejectSubscription(sub.id)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            Rejeter
                          </button>
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
                  <button 
                    onClick={() => setReclamationFilter('all')}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
                      reclamationFilter === 'all' ? 'bg-primary text-white' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    Toutes
                  </button>
                  <button 
                    onClick={() => setReclamationFilter('urgent')}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
                      reclamationFilter === 'urgent' ? 'bg-red-400 text-white' : 'bg-red-400/10 border border-red-400/20 text-red-400'
                    }`}
                  >
                    Urgentes ({reclamations.filter(r => r.status === 'Urgent').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reclamations
                  .filter(rec => reclamationFilter === 'all' || rec.status === 'Urgent')
                  .map((rec) => (
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
                      <button 
                        onClick={() => setViewingReclamation(rec)}
                        className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all border border-white/5"
                      >
                        Détails
                      </button>
                      <button 
                        onClick={() => handleResolveReclamation(rec.id)}
                        className="bg-primary hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                      >
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
                  {pricingData.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-sm text-white/60">{p.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{p.value}</span>
                        <button 
                          onClick={() => setEditingPrice({ index: i, label: p.label, value: p.value })}
                          className="p-2 hover:bg-white/10 rounded-lg text-primary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => alert('Tous les tarifs ont été enregistrés avec succès.')}
                  className="w-full btn-primary py-4 rounded-2xl justify-center"
                >
                  Enregistrer les Tarifs
                </button>
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

          {activeView === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-dark border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Utilisateurs Enregistrés</h3>
                  <p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Gestion des comptes clients et abonnés.</p>
                </div>
                <div className="text-xs text-white/40 font-black uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  {registeredUsers.length} Clients
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {registeredUsers.length > 0 ? registeredUsers.map((user, i) => (
                  <div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{user.name}</h4>
                        <p className="text-sm text-white/40 font-medium">{user.email} • Plaque: <span className="font-mono text-white/60">{user.plate || 'N/A'}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase ${
                        user.isSubscribed ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-white/10 text-white/40 border border-white/10'
                      }`}>
                        {user.isSubscribed ? 'Abonné' : 'Standard'}
                      </span>
                      <button className="p-3 hover:bg-white/10 rounded-2xl text-white/20 hover:text-white transition-all border border-transparent hover:border-white/10">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="p-32 text-center text-white/20">
                    <Users className="w-16 h-16 mx-auto mb-6 opacity-5" />
                    <p className="text-xl font-black uppercase tracking-widest">Aucun utilisateur</p>
                    <p className="text-sm mt-2">Les nouveaux inscrits apparaîtront ici.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl space-y-8"
            >
              <div className="bg-card-dark border border-white/5 p-12 rounded-[3rem] space-y-10 shadow-2xl">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Paramètres Système</h3>
                  <p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Configuration globale de l'infrastructure de parking.</p>
                </div>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom de l'Établissement</label>
                      <input 
                        type="text" 
                        value={parkingSettings.name} 
                        onChange={(e) => setParkingSettings({ ...parkingSettings, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 focus:outline-none focus:border-primary text-sm font-bold transition-all" 
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Capacité Totale (Places)</label>
                      <input 
                        type="number" 
                        value={parkingSettings.capacity} 
                        onChange={(e) => setParkingSettings({ ...parkingSettings, capacity: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 focus:outline-none focus:border-primary text-sm font-bold transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">Notifications Critiques</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Alertes email quand l'occupation dépasse 90%</p>
                      </div>
                      <button 
                        onClick={() => setParkingSettings({ ...parkingSettings, notifications: !parkingSettings.notifications })}
                        className={`w-14 h-8 rounded-full relative transition-all ${parkingSettings.notifications ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: parkingSettings.notifications ? 24 : 4 }}
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" 
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">Mode Maintenance</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Désactiver les nouvelles réservations en ligne</p>
                      </div>
                      <button 
                        onClick={() => setParkingSettings({ ...parkingSettings, maintenance: !parkingSettings.maintenance })}
                        className={`w-14 h-8 rounded-full relative transition-all ${parkingSettings.maintenance ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: parkingSettings.maintenance ? 24 : 4 }}
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" 
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  className="w-full btn-primary py-5 rounded-[1.5rem] justify-center text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                >
                  Sauvegarder la configuration
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
