import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car, MapPin, Clock, CreditCard, LogOut, ChevronRight, CheckCircle2,
  AlertCircle, Calendar, Star, MessageSquareWarning, Moon,
  Zap, Crown, ShieldCheck, RefreshCw, XCircle
} from 'lucide-react';
import { PRICING } from '../constants';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';

// ── Plan Parking Client — 60 fidèles / 100 standards ──────────────
interface ParkingMapClientProps {
  step: string;
  selectedSpot: string | null;
  onSelectSpot: (spot: string) => void;
  isSubscribed: boolean;
}

function ParkingMapClient({
  step,
  selectedSpot,
  onSelectSpot,
  isSubscribed,
}: ParkingMapClientProps) {
  const TOTAL          = 160;
  const LOYAL_TOTAL    = 60;  // A001–A060 réservées aux clients fidèles
  const STANDARD_TOTAL = TOTAL - LOYAL_TOTAL;
  const PAGE_SIZE = 20;
  const [page, setPage]              = useState(0);
  const [occupiedSpots, setOccupied] = useState<any[]>([]);
  const [loading, setLoading]        = useState(true);
  const [zone, setZone]              = useState<'LOYAL' | 'STANDARD'>(
    // Les abonnés voient directement la zone fidèles, les autres standards
    isSubscribed ? 'LOYAL' : 'STANDARD'
  );

  const zoneTotal  = zone === 'LOYAL' ? LOYAL_TOTAL : STANDARD_TOTAL;
  const zoneOffset = zone === 'LOYAL' ? 0 : LOYAL_TOTAL;
  const totalPages = Math.ceil(zoneTotal / PAGE_SIZE);

  const fetchSpots = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/api/vehicles/occupied-spots', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) setOccupied(await res.json() || []);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSpots(); }, [fetchSpots]);
  useEffect(() => {
    const t = setInterval(fetchSpots, 15000);
    return () => clearInterval(t);
  }, [fetchSpots]);

  // Normaliser A01/A1/A001 → A001
  const normalizeSpot = (spot: string): string => {
    if (!spot) return spot.toUpperCase();
    let prefix = '', numStr = '';
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
      occupiedMap[s.spot_number.toUpperCase()]  = s;
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
    return { spotId, info, isOccupied: !!info };
  });

  const canSelect = step === 'spot';

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

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-sm shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-base font-black uppercase tracking-tight">Plan du Parking IMW</h3>
            <p className="text-[10px] text-white/30 mt-0.5">
              A{String(pageStartNum).padStart(3,'0')}–A{String(pageEndNum).padStart(3,'0')} &bull; {zone === 'LOYAL' ? 'Zone fidèles' : 'Zone standards'}
            </p>
            <p className="text-[9px] text-white/30 mt-0.5">
              Fidèles: {totalOccupiedLoyal}/{LOYAL_TOTAL} • Standards: {totalOccupiedStandard}/{STANDARD_TOTAL}
            </p>
          </div>
        </div>
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
          <button onClick={fetchSpots} className="p-2 hover:bg-white/10 rounded-lg text-white/30 hover:text-primary transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-5 flex-wrap">
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
        {canSelect && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Sélectionnée</span>
          </div>
        )}
      </div>

      {/* Grille 20 places */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {spots.map(({ spotId, info, isOccupied }) => {
            const isSelected = selectedSpot === spotId;
            return (
              <motion.div
                key={spotId}
                whileHover={!isOccupied && canSelect ? { scale: 1.08 } : {}}
                onClick={() => !isOccupied && canSelect && onSelectSpot(spotId)}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all relative group
                  ${isOccupied
                    ? 'bg-primary/20 border-primary/40 text-primary cursor-not-allowed'
                    : isSelected
                      ? 'bg-blue-400 border-blue-400 text-white shadow-xl shadow-blue-400/30 cursor-pointer'
                      : canSelect
                        ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400 hover:border-emerald-400 cursor-pointer'
                        : 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
                  }`}
              >
                <Car className="w-3 h-3" />
                <span className="text-[7px] font-black leading-none">{spotId}</span>
                {/* Tooltip plaque */}
                {isOccupied && info && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-bg-dark border border-primary/30 text-white text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl">
                    🚗 {info.license_plate}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Message si pas encore au step spot */}
      {!canSelect && (
        <div className="p-5 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider leading-relaxed">
            Choisissez votre formule et procédez au paiement pour sélectionner une place.
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
          ← Précédent
        </button>
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`rounded-full transition-all ${i === page ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`} />
          ))}
        </div>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed">
          Suivant →
        </button>
      </div>
    </div>
  );
}

// ── Dashboard Client ──────────────────────────────────────────────
export default function ClientDashboard() {
  const location = useLocation();
  const navigate  = useNavigate();
  const clientData = {
    name:               location.state?.name               || 'Client',
    isSubscribed:       location.state?.isSubscribed       || false,
    subscriptionExpiry: location.state?.subscriptionExpiry || null,
    plate:              location.state?.plate              || '',
    email:              location.state?.email              || '',
  };

  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [hours, setHours]               = useState(1);
  const [plan, setPlan]                 = useState<string | null>(null);
  const [step, setStep]                 = useState(clientData.isSubscribed ? 'spot' : 'selection');
  const [isFinished, setIsFinished]     = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails]   = useState({ number: '', expiry: '', cvv: '', name: '' });

  // ── Capacité BD pour le message "places épuisées" ─────────────
  const [totalOccupied, setTotalOccupied] = useState(0);
  const [loadingCapacity, setLoadingCapacity] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const TOTAL_SPOTS = 160;

  const fetchCapacity = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:5000/api/vehicles/capacity', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setTotalOccupied(data.occupied || 0);
        setLastCheck(new Date());
      }
    } catch { /* silencieux */ }
    finally { setLoadingCapacity(false); }
  }, []);

  useEffect(() => {
    fetchCapacity();
    const t = setInterval(fetchCapacity, 15000);
    return () => clearInterval(t);
  }, [fetchCapacity]);

  const isFull      = totalOccupied >= TOTAL_SPOTS;
  const spotsLeft   = TOTAL_SPOTS - totalOccupied;

  const calculateRemainingDays = () => {
    if (!clientData.subscriptionExpiry) return null;
    try {
      const diff = new Date(clientData.subscriptionExpiry).getTime() - Date.now();
      const days = Math.ceil(diff / 86400000);
      return isNaN(days) ? null : days;
    } catch { return null; }
  };
  const remainingDays = calculateRemainingDays();

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectPlan = (p: string) => { setPlan(p); setStep('payment'); };
  const handlePayment    = () => {
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); setStep('spot'); }, 2000);
  };
  const handleConfirmSpot = () => setIsFinished(true);
  const handleBackStep    = () => {
    if (step === 'payment') setStep('selection');
    else if (step === 'spot' && !clientData.isSubscribed) setStep('payment');
  };

  const getPrice = () => {
    const prices: Record<string, number> = {
      hourly:               (hours || 1) * (PRICING.hourly || 0),
      daily:                PRICING.daily              || 0,
      night:                PRICING.night              || 0,
      weekend:              PRICING.weekend            || 0,
      subscription_basic:   PRICING.subscription_basic || 0,
      subscription_premium: PRICING.subscription_premium || 0,
      subscription_annual:  PRICING.subscription_annual  || 0,
    };
    return plan ? (prices[plan] || 0).toFixed(2) : '0.00';
  };

  // ── Écran confirmation ────────────────────────────────────────
  if (isFinished) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card-dark border border-white/5 p-12 rounded-[3rem] text-center shadow-2xl">
          <div className="w-24 h-24 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Merci, {clientData.name} !</h2>
          <p className="text-white/40 mb-10 leading-relaxed">
            Votre réservation pour la place <span className="text-primary font-bold">{selectedSpot}</span> est confirmée.
          </p>
          <button onClick={() => navigate('/')} className="w-full btn-primary justify-center py-4 rounded-2xl shadow-xl shadow-primary/20">
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark p-6 md:p-12 relative overflow-hidden">
      <PageBackground />
      {(step === 'payment' || (step === 'spot' && !clientData.isSubscribed)) && (
        <BackButton onClick={handleBackStep} />
      )}

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-20 gap-8">
          <div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-4">Espace Client</motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              Bonjour, <span className="text-primary italic">{clientData.name}</span>
            </h1>
            <p className="text-white/30 mt-4 text-sm font-medium uppercase tracking-widest">
              {clientData.isSubscribed ? 'Votre abonnement est actif.' : 'Configurez votre session de stationnement.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {clientData.isSubscribed && remainingDays !== null && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 px-6 py-4 bg-emerald-400/10 border border-emerald-400/20 rounded-sm">
                <Clock className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60">Expire dans</p>
                  <p className="text-sm font-black text-emerald-400 uppercase">{remainingDays} JOURS</p>
                </div>
              </motion.div>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/reclamation')} className="btn-secondary px-8 py-4">
              <MessageSquareWarning className="w-4 h-4 text-primary" />RÉCLAMATION
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="p-5 bg-white/5 hover:bg-red-500/10 text-white/20 hover:text-red-500 rounded-sm transition-all border border-white/10 group">
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </motion.button>
          </div>
        </header>

        {/* Plaque */}
        {clientData.plate && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 flex flex-col items-center">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm">
              <Car className="w-6 h-6 text-primary" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Matricule Véhicule</p>
                <p className="text-2xl font-black text-primary font-mono tracking-wider">{clientData.plate}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PARKING PLEIN ── */}
        {!clientData.isSubscribed && isFull && step === 'selection' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
            <div className="bg-card-dark border border-primary/20 p-16 rounded-[3rem] text-center space-y-8 shadow-2xl">
              <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mx-auto relative">
                <XCircle className="w-14 h-14 text-primary" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-3">Places Indisponibles</h2>
                <p className="text-white/40 text-sm font-medium leading-relaxed max-w-md mx-auto">
                  Toutes les <span className="text-white font-black">{TOTAL_SPOTS} places</span> sont actuellement occupées.
                  Veuillez patienter et réessayer ultérieurement.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
                  <p className="text-2xl font-black">{TOTAL_SPOTS}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Total</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-5 rounded-2xl text-center">
                  <p className="text-2xl font-black text-primary">{totalOccupied}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Occupées</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center">
                  <p className="text-2xl font-black text-white/40">0</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Libres</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-white/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest">
                  Mis à jour à {lastCheck.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={fetchCapacity}
                className="w-full flex items-center justify-center gap-3 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                <RefreshCw className="w-4 h-4" />Vérifier à nouveau
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── CONTENU NORMAL ── */}
        {(clientData.isSubscribed || !isFull || step !== 'selection') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

            {/* Gauche */}
            <div className="lg:col-span-1 space-y-10">
              <AnimatePresence mode="wait">

                {/* Étape Sélection */}
                {step === 'selection' && (
                  <motion.div key="selection" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Choisissez votre formule</h3>

                    {/* Compteur places */}
                    {!clientData.isSubscribed && (
                      <div className={`flex items-center gap-3 p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest
                        ${spotsLeft <= 10 ? 'bg-amber-400/10 border-amber-400/20 text-amber-400' : 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${spotsLeft <= 10 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        {spotsLeft} place{spotsLeft > 1 ? 's' : ''} disponible{spotsLeft > 1 ? 's' : ''}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { key: 'hourly',               label: 'Horaire',     price: `${(PRICING.hourly||0).toFixed(2)}€/h`,   icon: Clock,     color: 'primary' },
                        { key: 'daily',                label: 'Journée',     price: `${(PRICING.daily||0).toFixed(2)}€/12h`,  icon: Calendar,  color: 'primary' },
                        { key: 'night',                label: 'Nuit',        price: `${(PRICING.night||0).toFixed(2)}€/nuit`, icon: Moon,      color: 'primary' },
                        { key: 'weekend',              label: 'Weekend',     price: `${(PRICING.weekend||0).toFixed(2)}€/72h`,icon: Star,      color: 'primary' },
                        { key: 'subscription_basic',   label: 'Abo Basic',   price: `${(PRICING.subscription_basic||0).toFixed(2)}€/m`,   icon: Zap,   color: 'emerald' },
                        { key: 'subscription_premium', label: 'Abo Premium', price: `${(PRICING.subscription_premium||0).toFixed(2)}€/m`, icon: Crown, color: 'emerald' },
                        { key: 'subscription_annual',  label: 'Abo Annuel',  price: `${(PRICING.subscription_annual||0).toFixed(2)}€/an`, icon: Star,  color: 'emerald' },
                      ].map(({ key, label, price, icon: Icon, color }) => (
                        <motion.button key={key} whileHover={{ y: -5 }}
                          onClick={() => handleSelectPlan(key)}
                          className={`p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left transition-all group
                            ${color === 'emerald' ? 'hover:border-emerald-400/50' : 'hover:border-primary/50'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-sm flex items-center justify-center transition-all
                              ${color === 'emerald'
                                ? 'bg-emerald-400/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-white'
                                : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm uppercase tracking-tight">{label}</h4>
                              <p className="text-[9px] text-white/30 uppercase tracking-widest">{price}</p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Étape Paiement */}
                {step === 'payment' && (
                  <motion.div key="payment" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-sm shadow-2xl">
                    <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary mb-10">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Paiement</h3>
                    <div className="space-y-8">
                      {plan === 'hourly' && (
                        <div className="flex flex-col items-center gap-6 bg-white/5 p-8 rounded-sm border border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Durée</p>
                          <div className="flex items-center gap-10">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setHours(Math.max(1, hours - 1))}
                              className="w-14 h-14 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black text-2xl transition-colors">-</motion.button>
                            <div className="text-center">
                              <span className="text-5xl font-black block leading-none">{hours}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-2 block">HEURE{hours > 1 ? 'S' : ''}</span>
                            </div>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setHours(hours + 1)}
                              className="w-14 h-14 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black text-2xl transition-colors">+</motion.button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xl border-t border-white/10 pt-6">
                        <span className="font-black uppercase tracking-tight">Total</span>
                        <span className="text-primary font-black">{getPrice()}€</span>
                      </div>
                      <div className="space-y-3">
                        <input type="text" name="name" placeholder="NOM SUR LA CARTE" value={cardDetails.name} onChange={handleCardChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10 uppercase" />
                        <div className="relative">
                          <input type="text" name="number" placeholder="NUMÉRO DE CARTE" value={cardDetails.number} onChange={handleCardChange} maxLength={19}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10" />
                          <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" name="expiry" placeholder="MM/AA" value={cardDetails.expiry} onChange={handleCardChange} maxLength={5}
                            className="bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10" />
                          <input type="password" name="cvv" placeholder="CVV" value={cardDetails.cvv} onChange={handleCardChange} maxLength={3}
                            className="bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-emerald-400/5 border border-emerald-400/10 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-[10px] text-emerald-400/60 font-medium leading-relaxed">Données cryptées SSL 256-bit.</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handlePayment} disabled={isProcessing}
                        className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                          isProcessing ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-primary text-white'}`}>
                        {isProcessing
                          ? <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />TRAITEMENT...</>
                          : <><CreditCard className="w-5 h-5" />PAYER {getPrice()}€</>}
                      </motion.button>
                      <button onClick={() => setStep('selection')} className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors">
                        Changer de formule
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Étape Spot — confirmation */}
                {step === 'spot' && (
                  <motion.div key="spot" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-sm shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-400/10 rounded-sm flex items-center justify-center text-emerald-400 mb-10">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">
                      {clientData.isSubscribed ? 'Abonnement Actif' : 'Paiement validé'}
                    </h3>
                    <p className="text-white/40 text-sm mb-10 font-medium">
                      Cliquez sur une place <span className="text-emerald-400 font-bold">verte</span> pour la sélectionner.
                    </p>
                    <div className="space-y-6">
                      <div className="p-6 bg-white/5 rounded-sm border border-white/10">
                        <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-2">Place sélectionnée</p>
                        <p className="text-2xl font-black text-primary uppercase">{selectedSpot || 'Aucune'}</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        disabled={!selectedSpot} onClick={handleConfirmSpot}
                        className={`w-full py-5 rounded-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          selectedSpot ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}>
                        Confirmer la place <ChevronRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Droite — Plan A001–A160 ✅ */}
            <div className="lg:col-span-2">
              <ParkingMapClient
                step={step}
                selectedSpot={selectedSpot}
                onSelectSpot={setSelectedSpot}
                isSubscribed={clientData.isSubscribed}
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}