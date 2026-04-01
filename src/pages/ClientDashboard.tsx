import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Car, MapPin, Clock, CreditCard, LogOut, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Calendar, Star, ArrowRight, MessageSquareWarning, Moon, Zap, Crown, Lock, ShieldCheck, Plus, X } from 'lucide-react';
import { PRICING } from '../constants';
import { apiService } from '../services/api';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';

export default function ClientDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const clientData = {
    name: location.state?.name || 'Client',
    isSubscribed: location.state?.isSubscribed || false,
    isNew: location.state?.isNew || false,
    subscriptionExpiry: location.state?.subscriptionExpiry || null,
    subscriptionStatus: location.state?.subscriptionStatus || 'none',
    plate: location.state?.plate || '',
    email: location.state?.email || ''
  };
  
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [occupiedSpotsMap, setOccupiedSpotsMap] = useState<Record<string, boolean>>({});

  const fetchData = React.useCallback(async () => {
    try {
      const [spotsRes, pricingRes, subsRes] = await Promise.all([
        apiService.getOccupiedSpots(),
        apiService.getPricingPlans(),
        apiService.getMySubscriptions()
      ]);

      if (!spotsRes.error && Array.isArray(spotsRes)) {
        const map: Record<string, boolean> = {};
        spotsRes.forEach((spot: any) => {
          if (typeof spot === 'string') map[spot.toUpperCase()] = true;
        });
        setOccupiedSpotsMap(map);
      }

      const pData = (pricingRes as any).data;
      if (!pricingRes.error && Array.isArray(pData)) {
        setPricingPlans(pData);
      }

      const sData = (subsRes as any).data;
      if (!subsRes.error && Array.isArray(sData)) {
        const activeSub = sData.find((s: any) => s.status === 'ACTIVE');
        if (activeSub) {
          const expiryDate = new Date(activeSub.end_date);
          const now = new Date();
          if (expiryDate > now) {
            setIsSubscribed(true);
            setSubscriptionStatus('ACTIVE');
            setSubscriptionExpiry(activeSub.end_date);
            setStep((prev: any) => prev === 'selection' ? 'spot' : prev);
          } else {
            setIsSubscribed(false);
            setSubscriptionStatus('EXPIRED');
            setSubscriptionExpiry(null);
          }
        } else {
          setIsSubscribed(false);
          setSubscriptionStatus('none');
          setSubscriptionExpiry(null);
        }
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 15000);
    return () => clearInterval(t);
  }, [fetchData]);

  const pricingMap: Record<string, any> = {};
  pricingPlans.forEach(p => { if (p.name) pricingMap[p.name] = p; });
  
  const getP = (key: keyof typeof PRICING) => {
    return parseFloat(pricingMap[key]?.price) || PRICING[key];
  };

  const [isSubscribed, setIsSubscribed] = useState(clientData.isSubscribed);
  const [subscriptionStatus, setSubscriptionStatus] = useState(clientData.subscriptionStatus);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(clientData.subscriptionExpiry);
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [plan, setPlan] = useState<'hourly' | 'daily' | 'night' | 'weekend' | 'subscription_basic' | 'subscription_premium' | 'subscription_annual' | null>(null);
  const [step, setStep] = useState<any>(isSubscribed ? 'spot' : 'selection');
  const [isFinished, setIsFinished] = useState(false);
  const [isInParking, setIsInParking] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtraReservation, setIsExtraReservation] = useState(false);
  const [extraPlate, setExtraPlate] = useState('');
  const [vehicleType, setVehicleType] = useState('Voiture');
  const [spotPage, setSpotPage] = useState(0);
  const [justSubscribed, setJustSubscribed] = useState(false);

  // Reset page when userType changes
  React.useEffect(() => {
    setSpotPage(0);
  }, [isSubscribed, isExtraReservation]);

  // Automatic redirect to home after success
  React.useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000); // Redirect after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [isFinished, navigate]);

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'number') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    } else if (name === 'expiry') {
      value = value.replace(/\D/g, '');
      if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    } else if (name === 'cvv') {
      value = value.replace(/\D/g, '');
    }
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const validateLuhn = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (!cleaned || cleaned.length < 13 || cleaned.length > 19) return false;
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateExpiry = (expiry: string) => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = parseInt(now.getFullYear().toString().slice(-2), 10);
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) return false;
    return true;
  };

  const calculateRemainingDays = () => {
    if (!subscriptionExpiry) return null;
    try {
      const expiry = new Date(subscriptionExpiry);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return isNaN(days) || days < 0 ? null : days;
    } catch (e) {
      return null;
    }
  };

  const remainingDays = calculateRemainingDays();

  const spots = [
    ...Array.from({ length: 60 }).map((_, i) => {
      const spotId = `A-${(i + 1).toString().padStart(2, '0')}`;
      return { id: spotId, isOccupied: !!occupiedSpotsMap[spotId], type: 'subscriber' };
    }),
    ...Array.from({ length: 100 }).map((_, i) => {
      const spotId = `S-${(i + 1).toString().padStart(2, '0')}`;
      return { id: spotId, isOccupied: !!occupiedSpotsMap[spotId], type: 'standard' };
    })
  ];

  const userType = (isSubscribed && !isExtraReservation) ? 'subscriber' : 'standard';
  const userSpots = spots.filter(s => s.type === userType);
  
  const spotsPerPage = 24;
  const totalSpotPages = Math.ceil(userSpots.length / spotsPerPage);
  const paginatedSpots = userSpots.slice(spotPage * spotsPerPage, (spotPage + 1) * spotsPerPage);

  const isUserZoneFull = userSpots.every(s => s.isOccupied);
  const canBook = !isUserZoneFull;

  const handleSelectPlan = (selectedPlan: typeof plan) => {
    setPlan(selectedPlan);
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!cardDetails.name.trim()) {
      setApiError("Veuillez saisir le nom figurant sur la carte.");
      return;
    }
    if (!validateLuhn(cardDetails.number)) {
      setApiError("Le numéro de carte est invalide.");
      return;
    }
    if (!validateExpiry(cardDetails.expiry)) {
      setApiError("La date d'expiration est invalide ou dépassée.");
      return;
    }
    if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
      setApiError("Le cryptogramme (CVV) est invalide.");
      return;
    }

    setIsProcessing(true);
    setApiError(null);
    try {
      if (plan?.includes('subscription')) {
        const planTypeMap: Record<string, 'MONTHLY' | 'ANNUAL'> = {
          'subscription_basic': 'MONTHLY',
          'subscription_premium': 'MONTHLY',
          'subscription_annual': 'ANNUAL'
        };
        const pType = planTypeMap[plan] || 'MONTHLY';
        
        const now = new Date();
        const end = new Date();
        if (pType === 'ANNUAL') end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);

        const res = await apiService.createSubscription({
          license_plate: clientData.plate || extraPlate,
          plan_type: pType,
          start_date: now.toISOString(),
          end_date: end.toISOString()
        });
        
        if (res.error) {
          setApiError(res.error);
          setIsProcessing(false);
          return;
        }

        setIsSubscribed(false);
        setSubscriptionStatus('PENDING');
        setJustSubscribed(true);
        setIsFinished(true);
        return;
      }
      setStep('spot');
    } catch (err: any) {
      setApiError("Erreur de paiement : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSpot = async () => {
    if (!selectedSpot) return;
    setIsProcessing(true);
    setApiError(null);

    const isSub = plan?.includes('subscription');

    try {
      if (!isSub) {
        const end = new Date();
        if (plan === 'hourly') end.setHours(end.getHours() + hours);
        else if (plan === 'daily') end.setHours(end.getHours() + 12);
        else if (plan === 'night') end.setHours(end.getHours() + 12);
        else if (plan === 'weekend') end.setHours(end.getHours() + 72);

        let montant = 0;
        if (plan === 'hourly') montant = hours * getP('hourly');
        else if (plan === 'daily') montant = getP('daily');
        else if (plan === 'night') montant = getP('night');
        else if (plan === 'weekend') montant = getP('weekend');

        const res = await apiService.createReservation({
          proche_id: 0,
          place_number: selectedSpot,
          nom_proche: isExtraReservation ? 'Proche' : clientData.name,
          license_plate: isExtraReservation ? extraPlate : clientData.plate,
          vehicle_type: isExtraReservation ? vehicleType : 'Voiture',
          start_time: new Date().toISOString(),
          end_time: end.toISOString(),
          montant,
          payment_method: 'CARD'
        });

        if (res.error) {
          setApiError(res.error);
          setIsProcessing(false);
          return;
        }
      } else {
        const res = await apiService.vehicleEntry({
          license_plate: clientData.plate,
          vehicle_type: 'Voiture',
          spot_number: selectedSpot,
          expected_end_time: undefined
        });

        if (res.error) {
          console.error(res.error);
        }
      }
      setIsFinished(true);
    } catch (err: any) {
      setApiError("Erreur de réservation : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleParking = () => {
    const action = isInParking ? 'Sortie' : 'Entrée';
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setIsInParking(!isInParking);
    setLastAction(`${action} enregistrée à ${time}`);
    
    // Simulate saving to a global log or something
    const currentPlate = isExtraReservation ? extraPlate : clientData.plate;
    console.log(`Véhicule ${currentPlate} - ${action} à ${time}`);
  };

  const handleBackStep = () => {
    if (step === 'payment') {
      setStep(isExtraReservation ? 'extra_form' : 'selection');
    } else if (step === 'spot' && !isSubscribed) {
      setStep('payment');
    } else if (step === 'spot' && isExtraReservation) {
      setStep('payment');
    } else if (step === 'extra_form') {
      setIsExtraReservation(false);
      setStep('spot');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark p-6 md:p-12 relative overflow-hidden">
      <PageBackground />
      {(step === 'payment' || step === 'extra_form' || (step === 'spot' && (!isSubscribed || isExtraReservation))) && !isFinished && (
        <BackButton onClick={handleBackStep} />
      )}
      
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
              {isSubscribed 
                ? "Votre abonnement Premium est actif." 
                : "Configurez votre session de stationnement."}
            </p>
            {apiError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[11px] text-red-400 font-medium">{apiError}</p>
              </motion.div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-4 ml-auto">
            {isSubscribed && remainingDays !== null && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.4)' }}
                className="flex items-center gap-3 px-6 py-4 bg-emerald-400/10 border border-emerald-400/20 rounded-sm shadow-lg shadow-emerald-400/5 transition-all cursor-default"
              >
                <div className="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60">Abonnement expire dans</p>
                  <p className="text-sm font-black text-emerald-400 uppercase">{remainingDays} JOURS</p>
                </div>
              </motion.div>
            )}
            
            {isSubscribed && !isExtraReservation && (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -2, 
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  borderColor: 'rgba(52, 211, 153, 0.4)',
                  boxShadow: '0 0 20px rgba(52, 211, 153, 0.2)'
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsExtraReservation(true);
                  setStep('extra_form');
                  setSelectedSpot(null);
                }}
                className="min-w-[200px] bg-emerald-400/5 border border-emerald-400/20 px-8 py-4 rounded-sm font-black uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-3 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                RÉSERVER PROCHE
              </motion.button>
            )}

            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ 
                scale: 1.05, 
                y: -2, 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/reclamation')}
              className="min-w-[180px] bg-white/5 backdrop-blur-md border border-white/10 px-8 py-4 rounded-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 shadow-lg transition-all"
            >
              <MessageSquareWarning className="w-4 h-4 text-primary" />
              RÉCLAMATION
            </motion.button>

            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ 
                scale: 1.05, 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="min-w-[140px] px-6 py-4 rounded-sm transition-all border border-white/10 group bg-white/5 text-white/40 hover:text-red-500 flex items-center justify-center gap-3"
              title="Déconnexion / Retour"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Quitter</span>
            </motion.button>
          </div>
        </header>

        {/* Centered Plate Info */}
        {(clientData.plate || (isExtraReservation && extraPlate)) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 flex flex-col items-center text-center"
          >
            <motion.div 
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.2)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
              className="inline-flex items-center gap-4 px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm transition-all cursor-default group"
            >
              <Car className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-1">Matricule Véhicule</p>
                <p className="text-2xl font-black text-primary font-mono tracking-wider">
                  {isExtraReservation ? extraPlate || '...' : clientData.plate}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isFinished ? (
          <div className="flex items-center justify-center py-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-sm shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-emerald-400/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto mb-8">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Merci, {clientData.name} !</h2>
              {justSubscribed ? (
                <p className="text-white/40 mb-10 leading-relaxed">
                  Votre demande d'abonnement a bien été enregistrée et le paiement est validé.
                  <br/><br/>
                  <strong className="text-white">Attention :</strong> Il faut attendre l'acceptation de l'abonnement par l'administrateur pour qu'il soit actif.
                  <br/><br/>
                  En attendant, si vous souhaitez vous garer, veuillez réserver une place en tant que client standard.
                </p>
              ) : (
                <p className="text-white/40 mb-10 leading-relaxed">
                  Votre réservation pour la place <span className="text-primary font-bold">{selectedSpot}</span> est confirmée. 
                  Un ticket avec les détails a été envoyé à votre adresse email.
                </p>
              )}
              <div className="flex flex-col gap-4">
                {isSubscribed && (
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsExtraReservation(true);
                      setStep('extra_form');
                      setSelectedSpot(null);
                      setIsFinished(false);
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-sm font-black uppercase tracking-widest border border-white/10"
                  >
                    Réserver pour un proche
                  </motion.button>
                )}
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2, boxShadow: '0 20px 40px -10px rgba(239,68,68,0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-primary to-rose-600 text-white py-4 rounded-sm font-black uppercase tracking-widest shadow-xl shadow-primary/30"
                >
                  Retour à l'accueil
                </motion.button>
                <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-4">
                  Redirection automatique dans quelques secondes...
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Left: Configuration / Status */}
          <div className="lg:col-span-1 space-y-10">
            <AnimatePresence mode="wait">
              {step === 'extra_form' && (
                <motion.div 
                  key="extra_form"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-sm shadow-2xl space-y-8"
                >
                  <h3 className="text-2xl font-black uppercase tracking-tight">Nouvelle Réservation</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Matricule du véhicule</label>
                      <input 
                        type="text"
                        placeholder="EX: YA-23-22"
                        value={extraPlate}
                        onChange={(e) => setExtraPlate(e.target.value.toUpperCase())}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Type de véhicule</label>
                      <select 
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all text-white"
                      >
                        <option value="Voiture" className="bg-bg-dark">Voiture</option>
                        <option value="Moto" className="bg-bg-dark">Moto</option>
                        <option value="Camionnette" className="bg-bg-dark">Camionnette</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nombre d'heures</label>
                      <div className="flex items-center gap-6 bg-white/5 p-4 rounded-xl border border-white/10">
                        <button 
                          onClick={() => setHours(Math.max(1, hours - 1))}
                          className="w-10 h-10 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black"
                        >-</button>
                        <span className="text-xl font-black flex-1 text-center">{hours}h</span>
                        <button 
                          onClick={() => setHours(hours + 1)}
                          className="w-10 h-10 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black"
                        >+</button>
                      </div>
                    </div>

                    <div className="pt-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Total à payer</p>
                      <p className="text-3xl font-black text-primary">{(hours * getP('hourly')).toFixed(2)}€</p>
                    </div>

                    <button 
                      onClick={() => {
                        if (!extraPlate) {
                          return;
                        }
                        setPlan('hourly');
                        setStep('payment');
                      }}
                      className="w-full btn-primary py-5 rounded-xl font-black uppercase tracking-widest"
                    >
                      Procéder au paiement
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsExtraReservation(false);
                        setStep('spot');
                      }}
                      className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'selection' && (
                <motion.div 
                  key="selection"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-black uppercase tracking-tight">Choisissez votre formule</h3>
                  
                  {!canBook ? (
                    <div className="p-12 bg-primary/10 border border-primary/20 rounded-sm text-center space-y-6">
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-3xl font-black uppercase text-primary tracking-tighter">FULL PLACES</h3>
                      <p className="text-sm text-white/60 uppercase tracking-widest leading-relaxed">
                        Désolé, toutes les places dédiées aux {isSubscribed ? 'abonnés' : 'clients standards'} sont actuellement occupées.
                        Veuillez réessayer plus tard ou contacter le support.
                      </p>
                      <button 
                        onClick={() => navigate('/')}
                        className="btn-primary w-full py-4 text-xs font-black"
                      >
                        RETOUR À L'ACCUEIL
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.button 
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectPlan('hourly')}
                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-primary/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">Horaire</h4>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">{getP('hourly').toFixed(2)}€/h</p>
                          </div>
                        </div>
                      </motion.button>

                      <motion.button 
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectPlan('daily')}
                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-primary/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">Journée</h4>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">{getP('daily').toFixed(2)}€/12h</p>
                          </div>
                        </div>
                      </motion.button>

                      <motion.button 
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectPlan('night')}
                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-primary/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Moon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">Nuit</h4>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">{getP('night').toFixed(2)}€/nuit</p>
                          </div>
                        </div>
                      </motion.button>

                      <motion.button 
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectPlan('weekend')}
                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-primary/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <Star className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">Weekend</h4>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">{getP('weekend').toFixed(2)}€/72h</p>
                          </div>
                        </div>
                      </motion.button>

                      <motion.button 
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectPlan('subscription_basic')}
                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-emerald-400/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-400/10 rounded-sm flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-white transition-all">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">Abo Basic</h4>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">{getP('subscription_basic').toFixed(2)}€/m</p>
                          </div>
                        </div>
                      </motion.button>

                      <motion.button 
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectPlan('subscription_premium')}
                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-emerald-400/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-400/10 rounded-sm flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-white transition-all">
                            <Crown className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">Abo Premium</h4>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">{getP('subscription_premium').toFixed(2)}€/m</p>
                          </div>
                        </div>
                      </motion.button>

                      <motion.button 
                        whileHover={{ y: -5 }}
                        onClick={() => handleSelectPlan('subscription_annual')}
                        className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-emerald-400/50 transition-all group relative overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-400/10 rounded-sm flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-white transition-all">
                            <Star className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-tight">Abo Annuel</h4>
                            <p className="text-[9px] text-white/30 uppercase tracking-widest">{getP('subscription_annual').toFixed(2)}€/an</p>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  )}
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
                    {plan === 'hourly' ? 'Détails de la durée' : 'Détails de la formule'}
                  </h3>
                  
                  <div className="space-y-8">
                    {plan === 'hourly' ? (
                      <div className="flex flex-col items-center gap-6 bg-white/5 p-8 rounded-sm border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Sélectionner la durée</p>
                        <div className="flex items-center gap-10">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setHours(Math.max(1, hours - 1))}
                            className="w-14 h-14 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black text-2xl transition-colors"
                          >-</motion.button>
                          <div className="text-center">
                            <span className="text-5xl font-black block leading-none">{hours}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-2 block">HEURE{hours > 1 ? 'S' : ''}</span>
                          </div>
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setHours(hours + 1)}
                            className="w-14 h-14 rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black text-2xl transition-colors"
                          >+</motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-white/5 rounded-sm border border-white/10">
                        <p className="text-xs font-black uppercase tracking-widest">
                          {plan === 'daily' ? 'Forfait Journée' : 
                           plan === 'night' ? 'Tarif Nuit' :
                           plan === 'weekend' ? 'Forfait Weekend' :
                           plan === 'subscription_basic' ? 'Abonnement Basic' : 
                           plan === 'subscription_premium' ? 'Abonnement Premium' : 
                           plan === 'subscription_annual' ? 'Abonnement Annuel' : 'Formule Sélectionnée'}
                        </p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">
                          {plan?.includes('subscription') ? 'Valable 30 jours' : 
                           plan === 'weekend' ? 'Valable 72 heures' :
                           plan === 'night' ? 'Valable 12 heures' : 'Valable pour la session'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                      <span className="text-white/40">Tarif unitaire</span>
                      <span className="text-white">
                        {plan === 'hourly' ? getP('hourly').toFixed(2) : 
                         plan === 'daily' ? getP('daily').toFixed(2) :
                         plan === 'night' ? getP('night').toFixed(2) :
                         plan === 'weekend' ? getP('weekend').toFixed(2) :
                         plan === 'subscription_basic' ? getP('subscription_basic').toFixed(2) :
                         plan === 'subscription_premium' ? getP('subscription_premium').toFixed(2) :
                         plan === 'subscription_annual' ? getP('subscription_annual').toFixed(2) : '0.00'}€
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xl border-t border-white/10 pt-6">
                      <span className="font-black uppercase tracking-tight">Total à payer</span>
                      <span className="text-primary font-black">
                        {plan === 'hourly' ? (hours * getP('hourly')).toFixed(2) : 
                         plan === 'daily' ? getP('daily').toFixed(2) :
                         plan === 'night' ? getP('night').toFixed(2) :
                         plan === 'weekend' ? getP('weekend').toFixed(2) :
                         plan === 'subscription_basic' ? getP('subscription_basic').toFixed(2) :
                         plan === 'subscription_premium' ? getP('subscription_premium').toFixed(2) :
                         plan === 'subscription_annual' ? getP('subscription_annual').toFixed(2) : '0.00'}€
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Informations de paiement</label>
                        
                        <div className="space-y-3">
                          <div className="relative">
                            <input 
                              type="text"
                              name="name"
                              placeholder="NOM SUR LA CARTE"
                              value={cardDetails.name}
                              onChange={handleCardChange}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10 uppercase"
                            />
                            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                          </div>

                          <div className="relative">
                            <input 
                              type="text"
                              name="number"
                              placeholder="NUMÉRO DE CARTE"
                              value={cardDetails.number}
                              onChange={handleCardChange}
                              maxLength={19}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
                            />
                            <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text"
                              name="expiry"
                              placeholder="MM/AA"
                              value={cardDetails.expiry}
                              onChange={handleCardChange}
                              maxLength={5}
                              className="bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
                            />
                            <input 
                              type="password"
                              name="cvv"
                              placeholder="CVV"
                              value={cardDetails.cvv}
                              onChange={handleCardChange}
                              maxLength={3}
                              className="bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-bold focus:outline-none focus:border-primary transition-all placeholder:text-white/10"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-emerald-400/5 border border-emerald-400/10 rounded-xl">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-[10px] text-emerald-400/60 font-medium leading-relaxed">
                          Vos données sont cryptées et sécurisées par le protocole SSL 256-bit.
                        </p>
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2, boxShadow: "0 20px 40px -10px rgba(239,68,68,0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                        isProcessing ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-rose-600 text-white'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          TRAITEMENT EN COURS...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          PAYER {plan === 'hourly' ? (hours * getP('hourly')).toFixed(2) : 
                                 plan === 'daily' ? getP('daily').toFixed(2) :
                                 plan === 'night' ? getP('night').toFixed(2) :
                                 plan === 'weekend' ? getP('weekend').toFixed(2) :
                                 plan === 'subscription_basic' ? getP('subscription_basic').toFixed(2) :
                                 plan === 'subscription_premium' ? getP('subscription_premium').toFixed(2) :
                                 plan === 'subscription_annual' ? getP('subscription_annual').toFixed(2) : '0.00'}€
                        </>
                      )}
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
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">
                    {isSubscribed ? 'Abonnement Actif' : 'Paiement validé'}
                  </h3>
                  <p className="text-white/40 text-sm mb-10 font-medium">
                    {isSubscribed 
                      ? 'Veuillez choisir votre place réservée sur le plan.' 
                      : 'Veuillez maintenant choisir votre place sur le plan.'}
                  </p>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-sm border border-white/10">
                      <p className="text-[10px] uppercase font-black text-white/30 tracking-widest mb-2">Place sélectionnée</p>
                      <p className="text-2xl font-black text-primary uppercase">{selectedSpot || "Aucune"}</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!selectedSpot}
                      onClick={handleConfirmSpot}
                      className={`w-full py-5 rounded-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-2xl ${
                        selectedSpot 
                          ? 'bg-gradient-to-r from-primary to-rose-600 text-white shadow-primary/30' 
                          : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
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
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Libre</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
                {paginatedSpots.map((spot) => {
                  return (
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
                              : 'bg-emerald-400/5 border-emerald-400/20 text-emerald-400/40 hover:border-emerald-400/50 hover:bg-emerald-400/10'
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
                      {spot.isOccupied && (
                        <div className="absolute inset-0 flex items-center justify-center bg-bg-dark/60 backdrop-blur-[1px]">
                          <Lock className="w-4 h-4 text-white/20" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {totalSpotPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 bg-white/5 border border-white/10 rounded-sm p-2 w-max mx-auto shadow-2xl">
                  <button 
                    onClick={() => setSpotPage(p => Math.max(0, p - 1))}
                    disabled={spotPage === 0}
                    className="w-10 h-10 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-[10px] font-black tracking-widest uppercase text-white/40 px-4">
                    Page <span className="text-white">{spotPage + 1}</span> / {totalSpotPages}
                  </div>
                  <button 
                    onClick={() => setSpotPage(p => Math.min(totalSpotPages - 1, p + 1))}
                    disabled={spotPage === totalSpotPages - 1}
                    className="w-10 h-10 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

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
      )}
      </div>
    </div>
  );
} 