import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, CreditCard, ShieldCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// ── Luhn Algorithm ─────────────────────────────────────────────
function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]);
    if (shouldDouble) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// ── Expiry Validation ──────────────────────────────────────────
function expiryValid(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1]);
  const year = parseInt(match[2]) + 2000;
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const exp = new Date(year, month - 1);
  return exp >= new Date(now.getFullYear(), now.getMonth());
}

// ── Card brand detection ───────────────────────────────────────
function getCardBrand(num: string): string {
  const n = num.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  return '';
}

// ── Field indicator ────────────────────────────────────────────
const FieldStatus = ({ valid, touched }: { valid: boolean; touched: boolean }) => {
  if (!touched) return null;
  return valid
    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-4 top-1/2 -translate-y-1/2" />
    : <XCircle className="w-4 h-4 text-primary absolute right-4 top-1/2 -translate-y-1/2" />;
};

export const PaymentDetails = ({
  selectedPlanData,
  hours,
  cardDetails,
  onCardChange,
  onPay,
  processing,
  setStep,
}: any) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const rawNumber = cardDetails.number?.replace(/\D/g, '') || '';
  const cardBrand = getCardBrand(rawNumber);

  const validations = {
    name: (cardDetails.name || '').trim().length >= 3,
    number: luhnCheck(rawNumber) && rawNumber.length >= 12,
    expiry: expiryValid(cardDetails.expiry || ''),
    cvv: /^\d{3,4}$/.test(cardDetails.cvv || ''),
  };

  const allValid = Object.values(validations).every(Boolean);

  // Auto-format card number as user types (groups of 4)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'number') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
      onCardChange({ target: { name, value: formatted } });
    } else if (name === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
      onCardChange({ target: { name, value: formatted } });
    } else if (name === 'cvv') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      onCardChange({ target: { name, value: digits } });
    } else {
      onCardChange(e);
    }

    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = () => {
    // Mark all fields as touched to show all errors
    setTouched({ name: true, number: true, expiry: true, cvv: true });
    setSubmitted(true);

    const newErrors: Record<string, string> = {};
    if (!validations.name) newErrors.name = 'Nom invalide (minimum 3 caractères)';
    if (!validations.number) newErrors.number = 'Numéro de carte invalide';
    if (!validations.expiry) newErrors.expiry = 'Date expirée ou invalide';
    if (!validations.cvv) newErrors.cvv = 'CVV invalide (3 ou 4 chiffres)';
    setErrors(newErrors);

    if (allValid) onPay();
  };

  const amount = selectedPlanData?.label?.toLowerCase().includes('horaire')
    ? (hours * selectedPlanData.price).toFixed(2)
    : selectedPlanData?.price?.toFixed(2) || '0.00';

  const inputBase = 'w-full bg-white/5 border rounded-xl py-4 px-5 text-sm font-bold focus:outline-none transition-all placeholder:text-white/10';
  const getInputClass = (field: string) => {
    if (!touched[field]) return `${inputBase} border-white/10 focus:border-primary`;
    if (validations[field as keyof typeof validations]) return `${inputBase} border-emerald-400/50 focus:border-emerald-400`;
    return `${inputBase} border-primary/50 focus:border-primary`;
  };

  return (
    <div className="space-y-5">
      {/* Amount summary */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Montant à payer</p>
          <p className="text-2xl font-black text-primary">{amount} <span className="text-sm font-bold text-white/40">MAD</span></p>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
          Informations de paiement
        </label>

        {/* Nom sur la carte */}
        <div className="relative">
          <input
            type="text"
            name="name"
            placeholder="NOM SUR LA CARTE"
            value={cardDetails.name || ''}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            className={`${getInputClass('name')} uppercase`}
          />
          <FieldStatus valid={validations.name} touched={!!touched.name} />
        </div>
        {touched.name && !validations.name && (
          <p className="text-[10px] text-primary font-bold ml-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.name || 'Nom invalide'}
          </p>
        )}

        {/* Numéro de carte */}
        <div className="relative">
          <input
            type="text"
            name="number"
            placeholder="XXXX XXXX XXXX XXXX"
            value={cardDetails.number || ''}
            onChange={handleChange}
            onBlur={() => handleBlur('number')}
            maxLength={19}
            className={getInputClass('number')}
          />
          {cardBrand && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/30 uppercase tracking-widest">
              {cardBrand}
            </span>
          )}
          {!cardBrand && <FieldStatus valid={validations.number} touched={!!touched.number} />}
          {cardBrand && touched.number && (
            <div className="absolute right-16 top-1/2 -translate-y-1/2">
              <FieldStatus valid={validations.number} touched={!!touched.number} />
            </div>
          )}
        </div>
        {touched.number && !validations.number && (
          <p className="text-[10px] text-primary font-bold ml-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Numéro de carte invalide (vérification Luhn)
          </p>
        )}
        {touched.number && validations.number && (
          <p className="text-[10px] text-emerald-400 font-bold ml-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Carte {cardBrand} valide
          </p>
        )}

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              name="expiry"
              placeholder="MM/AA"
              value={cardDetails.expiry || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('expiry')}
              maxLength={5}
              className={getInputClass('expiry')}
            />
            <FieldStatus valid={validations.expiry} touched={!!touched.expiry} />
          </div>
          <div className="relative">
            <input
              type="password"
              name="cvv"
              placeholder="CVV"
              value={cardDetails.cvv || ''}
              onChange={handleChange}
              onBlur={() => handleBlur('cvv')}
              maxLength={4}
              className={getInputClass('cvv')}
            />
            <FieldStatus valid={validations.cvv} touched={!!touched.cvv} />
          </div>
        </div>
        {(touched.expiry && !validations.expiry) && (
          <p className="text-[10px] text-primary font-bold ml-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Date expiré ou invalide (ex: 12/27)
          </p>
        )}
        {(touched.cvv && !validations.cvv) && (
          <p className="text-[10px] text-primary font-bold ml-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> CVV invalide (3 ou 4 chiffres)
          </p>
        )}
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-3 p-4 bg-emerald-400/5 border border-emerald-400/10 rounded-xl">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-[10px] text-emerald-400/60 font-medium leading-relaxed">
          Données cryptées SSL 256-bit. Numéros de test acceptés : <span className="font-black">4242 4242 4242 4242</span>
        </p>
      </div>

      {/* All fields invalid warning */}
      <AnimatePresence>
        {submitted && !allValid && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-primary/10 border border-primary/30 rounded-xl"
          >
            <p className="text-xs text-primary font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Veuillez corriger les champs en rouge avant de payer.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay button */}
      <motion.button
        whileHover={!processing ? { scale: 1.02, y: -2, boxShadow: '0 20px 40px -10px rgba(239,68,68,0.4)' } : {}}
        whileTap={!processing ? { scale: 0.98 } : {}}
        onClick={handleSubmit}
        disabled={processing}
        className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
          processing
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : allValid && Object.keys(touched).length > 0
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20'
            : 'bg-gradient-to-r from-primary to-rose-600 text-white'
        }`}
      >
        {processing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            TRAITEMENT EN COURS...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            PAYER {amount} MAD
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
  );
};
