import React, { useState } from 'react';
import { Navbar, PageBackground } from '../components/Landing';
import { motion } from 'motion/react';
import { BackButton } from '../components/BackButton';
import { ChevronRight, AlertCircle, CheckCircle2, Send } from 'lucide-react';

export default function Reclamation() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
                      Envoyer une autre demande
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.history.back()}
                      className="btn-primary"
                    >
                      Retour
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-sm space-y-8 shadow-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nom</label>
                      <input 
                        type="text" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-5 focus:outline-none focus:border-primary transition-all text-xs font-bold uppercase tracking-wider"
                        placeholder="VOTRE NOM"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Email</label>
                      <input 
                        type="email" 
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-5 focus:outline-none focus:border-primary transition-all text-xs font-bold uppercase tracking-wider"
                        placeholder="VOTRE@EMAIL.COM"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Sujet</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-5 focus:outline-none focus:border-primary transition-all appearance-none text-xs font-bold uppercase tracking-wider">
                      <option>Problème de barrière</option>
                      <option>Erreur de facturation</option>
                      <option>Place occupée</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Message</label>
                    <textarea 
                      required
                      rows={4}
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
