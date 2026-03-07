import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Car, MapPin, Clock, CreditCard, LogOut, ChevronRight, CheckCircle2, AlertCircle, Calendar, Star, ArrowRight, MessageSquareWarning } from 'lucide-react';
import { PRICING } from '../constants';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';

export default function ClientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const clientData = location.state || { name: 'Client', isSubscribed: false, isNew: false };
  
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [plan, setPlan] = useState<'hourly' | 'subscription' | null>(clientData.isSubscribed ? 'subscription' : null);
  const [step, setStep] = useState(clientData.isSubscribed ? 'spot' : 'selection');
  const [isFinished, setIsFinished] = useState(false);

  const spots = Array.from({ length: 24 }).map((_, i) => ({
    id: `A-${i + 1}`,
    isOccupied: i % 7 === 0 || i % 5 === 0
  }));

  const handleSelectPlan = (selectedPlan: 'hourly' | 'subscription') => {
    setPlan(selectedPlan);
    setStep('payment');
  };

  const handlePayment = () => {
    setStep('spot');
  };

  const handleConfirmSpot = () => {
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card-dark border border-white/5 p-12 rounded-[3rem] text-center shadow-2xl"
        >
          <div className="w-24 h-24 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Merci, {clientData.name} !</h2>
          <p className="text-white/40 mb-10 leading-relaxed">
            Votre réservation pour la place <span className="text-primary font-bold">{selectedSpot}</span> est confirmée. 
            Un ticket avec les détails a été envoyé à votre adresse email.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full btn-primary justify-center py-4 rounded-2xl shadow-xl shadow-primary/20"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark p-6 md:p-12 relative overflow-hidden">
      <PageBackground />
      <BackButton />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-20 gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-4"
            >
              Espace Client
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
              Bonjour, <span className="text-primary italic">{clientData.name}</span>
            </h1>
            <p className="text-white/30 mt-4 text-sm font-medium uppercase tracking-widest">
              {clientData.isSubscribed 
                ? "Votre abonnement Premium est actif." 
                : "Configurez votre session de stationnement."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/reclamation')}
              className="btn-secondary px-8 py-4"
            >
              <MessageSquareWarning className="w-4 h-4 text-primary" />
              RÉCLAMATION
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="p-5 bg-white/5 hover:bg-red-500/10 text-white/20 hover:text-red-500 rounded-sm transition-all border border-white/10 group"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </motion.button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Left: Configuration / Status */}
          <div className="lg:col-span-1 space-y-10">
            <AnimatePresence mode="wait">
              {step === 'selection' && (
                <motion.div 
                  key="selection"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-black uppercase tracking-tight">Choisissez votre formule</h3>
                  
                  <motion.button 
                    whileHover={{ y: -5 }}
                    onClick={() => handleSelectPlan('hourly')}
                    className="w-full p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-primary/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                    <div className="w-14 h-14 bg-primary/10 rounded-sm flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <Clock className="w-7 h-7" />
                    </div>
                    <h4 className="font-black text-2xl mb-3 uppercase tracking-tight">Stationnement Horaire</h4>
                    <p className="text-sm text-white/30 leading-relaxed font-medium">Payez uniquement pour le temps passé. Idéal pour les visites occasionnelles.</p>
                    <div className="mt-8 flex items-center text-primary text-[10px] font-black tracking-[0.3em] uppercase">
                      Sélectionner <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ y: -5 }}
                    onClick={() => handleSelectPlan('subscription')}
                    className="w-full p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-primary/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-400/10 transition-colors" />
                    <div className="w-14 h-14 bg-emerald-400/10 rounded-sm flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 group-hover:bg-emerald-400 group-hover:text-white transition-all duration-500">
                      <Star className="w-7 h-7" />
                    </div>
                    <h4 className="font-black text-2xl mb-3 uppercase tracking-tight">Abonnement Mensuel</h4>
                    <p className="text-sm text-white/30 leading-relaxed font-medium">Accès illimité 24/7. La solution la plus économique pour les habitués.</p>
                    <div className="mt-8 flex items-center text-emerald-400 text-[10px] font-black tracking-[0.3em] uppercase">
                      Sélectionner <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </motion.button>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div 
                  key="payment"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-sm shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                  
                  <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary mb-10">
                    {plan === 'hourly' ? <Clock className="w-8 h-8" /> : <Calendar className="w-8 h-8" />}
                  </div>
                  <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">
                    {plan === 'hourly' ? 'Détails de la durée' : 'Détails de l\'abonnement'}
                  </h3>
                  
                  <div className="space-y-8">
                    {plan === 'hourly' ? (
                      <div className="flex items-center justify-between bg-white/5 p-6 rounded-sm border border-white/10">
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setHours(Math.max(1, hours - 1))}
                          className="w-12 h-12 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black text-xl transition-colors"
                        >-</motion.button>
                        <span className="text-3xl font-black">{hours} HEURE{hours > 1 ? 'S' : ''}</span>
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setHours(hours + 1)}
                          className="w-12 h-12 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black text-xl transition-colors"
                        >+</motion.button>
                      </div>
                    ) : (
                      <div className="p-6 bg-white/5 rounded-sm border border-white/10">
                        <p className="text-xs font-black uppercase tracking-widest">Abonnement Premium</p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Valable 30 jours à partir d'aujourd'hui</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-white/40">Tarif {plan === 'hourly' ? 'horaire' : 'mensuel'}</span>
                      <span className="text-white">
                        {plan === 'hourly' ? PRICING.hourly.toFixed(2) : PRICING.subscription_basic.toFixed(2)}€
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xl border-t border-white/10 pt-6">
                      <span className="font-black uppercase tracking-tight">Total à payer</span>
                      <span className="text-primary font-black">
                        {plan === 'hourly' ? (hours * PRICING.hourly).toFixed(2) : PRICING.subscription_basic.toFixed(2)}€
                      </span>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePayment}
                      className="w-full btn-primary justify-center py-5"
                    >
                      <CreditCard className="w-5 h-5" />
                      PAYER MAINTENANT
                    </motion.button>
                    
                    <button 
                      onClick={() => setStep('selection')}
                      className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-colors"
                    >
                      Changer de formule
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'spot' && (
                <motion.div 
                  key="spot"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-sm shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                  
                  <div className="w-16 h-16 bg-emerald-400/10 rounded-sm flex items-center justify-center text-emerald-400 mb-10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Paiement validé</h3>
                  <p className="text-white/40 text-sm mb-10 font-medium">Veuillez maintenant choisir votre place sur le plan.</p>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-sm border border-white/10">
                      <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-2">Place sélectionnée</p>
                      <p className="text-2xl font-black text-primary uppercase">{selectedSpot || "Aucune"}</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!selectedSpot}
                      onClick={handleConfirmSpot}
                      className={`w-full py-5 rounded-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        selectedSpot 
                          ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                          : 'bg-white/5 text-white/20 cursor-not-allowed'
                      }`}
                    >
                      Confirmer la place
                      <ChevronRight className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Map */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-sm shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                <h3 className="text-2xl font-black flex items-center gap-4 uppercase tracking-tight">
                  <MapPin className="w-7 h-7 text-primary" />
                  Plan du Parking
                </h3>
                <div className="flex gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Occupé</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Libre</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
                {spots.map((spot) => (
                  <motion.button
                    key={spot.id}
                    whileHover={!spot.isOccupied && step === 'spot' ? { scale: 1.1, y: -5 } : {}}
                    whileTap={!spot.isOccupied && step === 'spot' ? { scale: 0.95 } : {}}
                    disabled={spot.isOccupied || step === 'selection' || step === 'payment'}
                    onClick={() => setSelectedSpot(spot.id)}
                    className={`aspect-square rounded-sm border flex flex-col items-center justify-center gap-2 transition-all relative group ${
                      spot.isOccupied 
                        ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed' 
                        : selectedSpot === spot.id
                          ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/50 z-10'
                          : step === 'selection' || step === 'payment'
                            ? 'bg-white/5 border-white/5 text-white/10 cursor-not-allowed'
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <Car className={`w-7 h-7 ${spot.isOccupied ? 'opacity-10' : 'opacity-100'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{spot.id}</span>
                    {selectedSpot === spot.id && (
                      <motion.div 
                        layoutId="activeSpot"
                        className="absolute inset-0 border-2 border-white rounded-sm"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="mt-16 p-8 bg-primary/5 border border-primary/10 rounded-sm flex items-start gap-6">
                <AlertCircle className="w-7 h-7 text-primary shrink-0 mt-1" />
                <p className="text-xs text-white/60 leading-relaxed font-medium uppercase tracking-wider">
                  {step === 'selection' || step === 'payment' 
                    ? "Veuillez d'abord choisir votre formule et procéder au paiement pour débloquer la sélection de place."
                    : "Une fois votre place confirmée, vous recevrez un ticket numérique par email. Veuillez vous garer uniquement sur la place réservée."}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
