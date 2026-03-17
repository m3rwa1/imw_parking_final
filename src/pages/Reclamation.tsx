import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, PageBackground } from '../components/Landing';
import { motion } from 'motion/react';
import { BackButton } from '../components/BackButton';
import { ChevronRight, AlertCircle, CheckCircle2, Send, Construction, Receipt, MapPin, HelpCircle, Loader } from 'lucide-react';
import { apiService } from '../services/api';

const SUBJECTS = [
  { id: 'Problème de barrière', label: 'Barrière',  icon: Construction, color: 'text-red-400',     bg: 'bg-red-400/10' },
  { id: 'Erreur de facturation', label: 'Facture',  icon: Receipt,      color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  { id: 'Place occupée',         label: 'Place',    icon: MapPin,       color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'Autre',                 label: 'Autre',    icon: HelpCircle,   color: 'text-purple-400',  bg: 'bg-purple-400/10' },
];

export default function Reclamation() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [formData, setFormData] = useState({
    subject:  '',
    message:  '',
    isUrgent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.subject) {
      setError('Veuillez sélectionner un sujet pour votre réclamation.');
      return;
    }
    if (!formData.message.trim()) {
      setError('Veuillez décrire votre problème.');
      return;
    }

    // Vérifier que l'utilisateur est connecté
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Vous devez être connecté pour soumettre une réclamation.');
      return;
    }

    setLoading(true);
    try {
      const description = formData.isUrgent
        ? `[URGENT] ${formData.message.trim()}`
        : formData.message.trim();

      const res = await apiService.createReclamation({
        subject:     formData.subject,
        description: description,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Erreur réseau. Vérifiez que le backend tourne sur localhost:5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark relative">
      <PageBackground />
      <Navbar />
      <BackButton />

      <div className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-24">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-8">
              <span>IMW Parking</span>
              <ChevronRight className="w-3 h-3 text-primary" />
              <span className="text-white">Réclamation</span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 uppercase">
              Centre de <span className="text-primary italic">Réclamation</span>
            </h1>
            <p className="text-white/40 max-w-xl mx-auto text-lg font-medium leading-relaxed">
              Un problème avec votre stationnement ou une barrière défectueuse ?
              Notre équipe est là pour vous aider 24h/24.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Sidebar info */}
            <div className="md:col-span-1 space-y-8">
              <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm">
                <h3 className="font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <AlertCircle className="w-5 h-5 text-primary" />Urgences
                </h3>
                <p className="text-[11px] text-white/40 leading-relaxed font-black uppercase tracking-wider">
                  Pour toute urgence immédiate sur le site, veuillez utiliser l'interphone aux bornes de sortie.
                </p>
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm">
                <h3 className="font-black mb-4 uppercase tracking-widest text-xs">Temps de réponse</h3>
                <p className="text-[11px] text-white/40 leading-relaxed font-black uppercase tracking-wider">
                  Nous traitons les réclamations standard sous 24h ouvrées.
                </p>
              </div>
              {/* Badge connecté */}
              <div className="p-6 bg-emerald-400/5 border border-emerald-400/20 rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  
                </div>
                <p className="text-[10px] text-white/30 mt-2 font-medium">
                  Votre réclamation sera visible immédiatement par l'administration.
                </p>
              </div>
            </div>

            {/* Formulaire */}
            <div className="md:col-span-2">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-16 rounded-sm text-center"
                >
                  <div className="w-20 h-20 bg-emerald-400/10 rounded-sm flex items-center justify-center mx-auto mb-8 text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Réclamation Envoyée</h2>
                  <p className="text-white/40 mb-4 font-medium">
                    Merci pour votre retour. Un membre de notre équipe reviendra vers vous très prochainement.
                  </p>
                  <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-10">
                    ✓ Visible par l'administration
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setSubmitted(false); setFormData({ subject: '', message: '', isUrgent: false }); }}
                      className="btn-secondary">
                      Nouvelle réclamation
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/')} className="btn-primary">
                      Retour à l'accueil
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-sm space-y-8 shadow-2xl">

                  {/* Sujet */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Sujet de la réclamation <span className="text-primary">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {SUBJECTS.map((subj) => (
                        <button key={subj.id} type="button"
                          onClick={() => setFormData({ ...formData, subject: subj.id })}
                          className={`flex flex-col items-center gap-3 p-6 rounded-sm border transition-all ${
                            formData.subject === subj.id
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                              : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                          }`}>
                          <subj.icon className={`w-6 h-6 ${formData.subject === subj.id ? 'text-white' : 'text-white/20'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{subj.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Urgent */}
                  <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-sm group cursor-pointer"
                    onClick={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}>
                    <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${formData.isUrgent ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}>
                      {formData.isUrgent && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white">Marquer comme urgent</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Traitement prioritaire par nos équipes</p>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Message <span className="text-primary">*</span>
                    </label>
                    <textarea
                      required rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-5 focus:outline-none focus:border-primary transition-all resize-none text-xs font-bold uppercase tracking-wider"
                      placeholder="DÉCRIVEZ VOTRE PROBLÈME EN DÉTAIL..."
                    />
                  </div>

                  {/* Erreur */}
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-4 bg-primary/10 border border-primary/20 rounded-sm flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <p className="text-[11px] font-black uppercase tracking-widest text-primary">{error}</p>
                    </motion.div>
                  )}

                  {/* Bouton soumettre */}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary justify-center py-5 disabled:opacity-50">
                    {loading
                      ? <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Envoi en cours...</>
                      : <><Send className="w-5 h-5" />ENVOYER LA RÉCLAMATION</>
                    }
                  </motion.button>

                  <p className="text-[9px] text-white/20 text-center font-black uppercase tracking-widest">
                    Vous devez être connecté à votre compte pour soumettre une réclamation
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}