import codecs
import re

print("Starting replacement...")

with codecs.open('src/pages/ClientDashboard2.tsx', 'r', 'utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { PRICING } from '../constants';", """import { RefreshCw, XCircle } from 'lucide-react';\n\nconst API_BASE = 'http://localhost:5000';
function getToken() { return localStorage.getItem('access_token'); }
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}""")

# 2. State & Fetches
state_hooks = """
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [occupiedSpots, setOccupiedSpots] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/pricing/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setPricingPlans(data.data); })
      .catch(() => {});
  }, []);

  const pricingMap: Record<string, any> = {};
  pricingPlans.forEach(p => { if (p.name) pricingMap[p.name] = p; });
  const getP = (key: string) => parseFloat(pricingMap[key]?.price ?? 0);

  const fetchSpots = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vehicles/occupied-spots`, { headers: authHeaders() });
      if (res.ok) setOccupiedSpots(await res.json() || []);
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchSpots();
    const t = setInterval(fetchSpots, 15000);
    return () => clearInterval(t);
  }, [fetchSpots]);

  const normalizeSpot = (s: string) => {
    if (!s) return s.toUpperCase();
    let p = '', n = '';
    for (const c of s) { if (c >= '0' && c <= '9') n += c; else p += c; }
    return n ? p.toUpperCase() + String(parseInt(n, 10)).padStart(3, '0') : s.toUpperCase();
  };

  const occupiedMap: Record<string, any> = {};
  if (Array.isArray(occupiedSpots)) {
    occupiedSpots.forEach((s: any) => {
      if (typeof s === 'string') { occupiedMap[normalizeSpot(s)] = true; occupiedMap[s.toUpperCase()] = true; }
      else if (s && s.spot_number) { occupiedMap[normalizeSpot(s.spot_number)] = s; occupiedMap[s.spot_number.toUpperCase()] = s; }
    });
  }
"""
content = content.replace("  const [isSubscribed, setIsSubscribed] = useState(clientData.isSubscribed);", state_hooks + "\n  const [isSubscribed, setIsSubscribed] = useState(clientData.isSubscribed);")

# 3. Spots logic
spots_replacement = """
  const typeMap = isExtraReservation ? 'standard' : (isSubscribed ? 'subscriber' : 'standard');
  const userSpots = typeMap === 'subscriber' 
    ? Array.from({ length: 60 }).map((_, i) => {
        const id = `A${(i + 1).toString().padStart(3, '0')}`;
        return { id, isOccupied: !!occupiedMap[id], type: 'subscriber' };
      })
    : Array.from({ length: 100 }).map((_, i) => {
        const id = `A${(i + 61).toString().padStart(3, '0')}`;
        return { id, isOccupied: !!occupiedMap[id], type: 'standard' };
      });

  const isUserZoneFull = userSpots.every(s => s.isOccupied);
  const canBook = !isUserZoneFull;
"""
content = re.sub(r'  const spots = \[.*?\];\n\n  const userType =.*?const canBook = !isUserZoneFull;', spots_replacement, content, flags=re.DOTALL)

# 4. handleSelectPlan
content = re.sub(r'  const handleSelectPlan =.*?setStep\(\'payment\'\);\n  \};', """  const [selectedPlanData, setSelectedPlanData] = useState<any>(null);
  const handleSelectPlan = (planName: any) => {
    const dbPlan = pricingMap[planName];
    setPlan(planName);
    setSelectedPlanData(dbPlan ? { label: dbPlan.label, price: parseFloat(dbPlan.price), unit: dbPlan.unit } : null);
    setStep('payment');
    setApiError(null);
  };""", content, flags=re.DOTALL)

# 5. Payment Func
payment_func = """
  const getPrice = (): string => {
    if (!plan) return '0.00';
    const base = getP(plan);
    return (plan === 'hourly' ? base * (hours || 1) : base).toFixed(2);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setApiError(null);
    try {
      const amount = parseFloat(getPrice());
      if (plan?.includes('subscription')) {
        const planTypeMap: Record<string, string> = {
          subscription_basic: 'MONTHLY',
          subscription_premium: 'MONTHLY',
          subscription_annual: 'ANNUAL',
        };
        const planType = planTypeMap[plan] || 'MONTHLY';

        const res = await fetch(`${API_BASE}/api/subscriptions/create`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ license_plate: clientData.plate, plan_type: planType }),
        });
        const data = await res.json();
        if (!res.ok) {
          setApiError(data.error || 'Erreur création abonnement');
          setIsProcessing(false);
          return;
        }
        setIsSubscribed(true);
      }

      await fetch(`${API_BASE}/api/payments/create`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amount, payment_method: 'CARD' }),
      }).catch(() => {});
      
      setStep('spot');
    } catch {
      setApiError('Erreur serveur');
    } finally {
      setIsProcessing(false);
    }
  };
"""
content = re.sub(r'  const handlePayment = \(\) => \{.*?setStep\(\'spot\'\);\n    \}, 2000\);\n  \};', payment_func, content, flags=re.DOTALL)

# 6. Confirm Spot
confirm_func = """
  const handleConfirmSpot = async () => {
    if (!selectedSpot) return;
    setIsProcessing(true);
    setApiError(null);

    try {
      if (isExtraReservation) {
        const now = new Date();
        const endTime = new Date(now.getTime() + hours * 3600000);
        const amount = parseFloat(getPrice());
        const res = await fetch(`${API_BASE}/api/reservations/`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            proche_id: 0,
            nom_proche: extraPlate,
            place_number: selectedSpot,
            license_plate: extraPlate,
            vehicle_type: vehicleType,
            start_time: now.toISOString().replace('T', ' ').substring(0, 19),
            end_time: endTime.toISOString().replace('T', ' ').substring(0, 19),
            montant: amount,
            payment_method: 'ONLINE',
          }),
        });
        const data = await res.json();
        if (!res.ok) { setApiError(data.error || 'Erreur réservation'); setIsProcessing(false); return; }
      } else {
        const expectedEnd = plan === 'hourly' ? new Date(Date.now() + hours * 3600000).toISOString() : null;
        const res = await fetch(`${API_BASE}/api/vehicles/entry`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            license_plate: clientData.plate,
            vehicle_type: 'Voiture',
            spot_number: selectedSpot,
            ...(expectedEnd ? { expected_end_time: expectedEnd } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) { setApiError(data.error || 'Erreur entrée'); setIsProcessing(false); return; }
      }
      setIsFinished(true);
    } catch {
      setApiError('Erreur serveur');
    } finally {
      setIsProcessing(false);
    }
  };
"""
content = re.sub(r'  const handleConfirmSpot = \(\) => \{.*?setIsFinished\(true\);\n  \};', confirm_func, content, flags=re.DOTALL)

# 7. Pricing replacement
content = content.replace('PRICING.hourly', "getP('hourly')")
content = content.replace('PRICING.daily', "getP('daily')")
content = content.replace('PRICING.night', "getP('night')")
content = content.replace('PRICING.weekend', "getP('weekend')")
content = content.replace('PRICING.subscription_basic', "getP('subscription_basic')")
content = content.replace('PRICING.subscription_premium', "getP('subscription_premium')")
content = content.replace('PRICING.subscription_annual', "getP('subscription_annual')")

# The complex payment text fixes
content = content.replace('{(hours * getP(\'hourly\')).toFixed(2)}€', '{getPrice()} DH')
content = content.replace('getP(\'hourly\').toFixed(2)}€', 'getP(\'hourly\').toFixed(2)} DH')
content = content.replace('getP(\'daily\').toFixed(2)}€', 'getP(\'daily\').toFixed(2)} DH')
content = content.replace('getP(\'night\').toFixed(2)}€', 'getP(\'night\').toFixed(2)} DH')
content = content.replace('getP(\'weekend\').toFixed(2)}€', 'getP(\'weekend\').toFixed(2)} DH')
content = content.replace('getP(\'subscription_basic\').toFixed(2)}€', 'getP(\'subscription_basic\').toFixed(2)} DH')
content = content.replace('getP(\'subscription_premium\').toFixed(2)}€', 'getP(\'subscription_premium\').toFixed(2)} DH')
content = content.replace('getP(\'subscription_annual\').toFixed(2)}€', 'getP(\'subscription_annual\').toFixed(2)} DH')

content = re.sub(r'Total à payer</span>\n.*?<span className="text-primary font-black">\n.*?</span\n', 'Total à payer</span>\n                      <span className="text-primary font-black">\n                        {getPrice()} DH</span\n', content, flags=re.DOTALL)

content = re.sub(r'PAYER \{plan === \'hourly\'.*?\}€', 'PAYER {getPrice()} DH', content, flags=re.DOTALL)


# Error display in UI
err_ui = """
                    <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">
                      {plan === 'hourly' ? 'Détails de la durée' : 'Détails de la formule'}
                    </h3>
                    {apiError && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-[11px] text-red-400 font-medium">{apiError}</p></div>}
"""
content = content.replace('<h3 className="text-2xl font-black mb-8 uppercase tracking-tight">\n                    {plan === \'hourly\' ? \'Détails de la durée\' : \'Détails de la formule\'}\n                  </h3>', err_ui)

err_spot_ui = """
                    <p className="text-white/40 text-sm mb-10 font-medium">
                      {isSubscribed 
                        ? 'Veuillez choisir votre place réservée sur le plan.' 
                        : 'Veuillez maintenant choisir votre place sur le plan.'}
                    </p>
                    {apiError && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"><AlertCircle className="w-4 h-4 text-red-400 shrink-0" /><p className="text-[11px] text-red-400 font-medium">{apiError}</p></div>}
"""
content = re.sub(r'<p className="text-white/40 text-sm mb-10 font-medium">.*?</p>', err_spot_ui, content, flags=re.DOTALL)

with codecs.open('src/pages/ClientDashboard.tsx', 'w', 'utf-8') as f:
    f.write(content)
print("done")
