import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, PageBackground } from '../components/Landing';
import { motion } from 'motion/react';
import { BackButton } from '../components/BackButton';
import { ChevronRight, AlertCircle, CheckCircle2, Send, Construction, Receipt, MapPin, HelpCircle } from 'lucide-react';
import { apiService } from '../services/api';

const SUBJECTS = [
  { id: 'Problème de barrière', label: 'Barrière', icon: Construction, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'Erreur de facturation', label: 'Facture', icon: Receipt, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'Place occupée', label: 'Place', icon: MapPin, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'Autre', label: 'Autre', icon: HelpCircle, color: 'text-purple-400', bg: 'bg-purple-400/10' }
];

export default function Reclamation() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    isUrgent: false
  });

  const [error, setError] = useState<string | null>(null);

  // Charger les données de l'utilisateur si connecté
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      setFormData(prev => ({ ...prev, name: user.name, email: user.email }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.subject) {
      setError('Veuillez sélectionner un sujet pour votre réclamation.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.createReclamation({
        subject: formData.subject,
        description: formData.message
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Erreur réseau. Impossible d\'envoyer la réclamation.');
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-24"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 text-[10px] font-black tracking-[0.4em] text-white/40 uppercase mb-8"
            >
              <span>IMW Parking Maroc</span>
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
            <div className="md:col-span-1 space-y-8">
              <div className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm">
                <h3 className="font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Urgences
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
            </div>

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
                  <p className="text-white/40 mb-10 font-medium">
                    Merci pour votre retour. Un membre de notre équipe reviendra vers vous très prochainement.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSubmitted(false)}
                      className="btn-secondary"
                    >
                      Nouvelle réclamation
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/')}
                      className="btn-primary"
                    >
                      Retour à l'accueil
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-sm space-y-8 shadow-2xl">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nom</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-5 focus:outline-none focus:border-primary transition-all text-xs font-bold uppercase tracking-wider"
                        placeholder="VOTRE NOM"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-5 focus:outline-none focus:border-primary transition-all text-xs font-bold uppercase tracking-wider"
                        placeholder="VOTRE@EMAIL.COM"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Sujet de la réclamation</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {SUBJECTS.map((subj) => (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, subject: subj.id })}
                          className={`flex flex-col items-center gap-3 p-6 rounded-sm border transition-all ${
                            formData.subject === subj.id 
                              ? `bg-primary border-primary text-white shadow-lg shadow-primary/30` 
                              : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                          }`}
                        >
                          <subj.icon className={`w-6 h-6 ${formData.subject === subj.id ? 'text-white' : 'text-white/20'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{subj.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-sm group cursor-pointer" onClick={() => setFormData({ ...formData, isUrgent: !formData.isUrgent })}>
                    <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${formData.isUrgent ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}>
                      {formData.isUrgent && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white">Marquer comme urgent</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-1">Traitement prioritaire par nos équipes</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Message</label>
                    <textarea 
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-5 focus:outline-none focus:border-primary transition-all resize-none text-xs font-bold uppercase tracking-wider"
                      placeholder="DÉCRIVEZ VOTRE PROBLÈME..."
                    />
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="w-full btn-primary justify-center py-5"
                  >
                    <Send className="w-5 h-5" />
                    ENVOYER LA RÉCLAMATION
                  </motion.button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
