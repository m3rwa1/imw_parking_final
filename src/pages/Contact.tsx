import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Navbar, PageBackground } from '../components/Landing';
import { Footer } from '../components/Footer';
import { Mail, MapPin, Phone, Send, MessageSquare, ChevronRight } from 'lucide-react';
import { BackButton } from '../components/BackButton';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white relative">
      <PageBackground />
      <Navbar />
      <BackButton />

      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <MessageSquare className="w-8 h-8" />
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-6"
            >
              Nous <span className="text-primary italic">Contacter</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 max-w-2xl mx-auto text-lg font-medium leading-relaxed"
            >
              L'équipe IMW Parking est à votre écoute pour toute demande d'assistance technique ou commerciale.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Form */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-7 bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-sm shadow-2xl"
            >
              {submitted ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-400">
                    <Send className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Message Envoyé</h2>
                  <p className="text-white/40 font-medium">Nous vous répondrons dans les plus brefs délais.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Votre Nom</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Entrez votre nom"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-6 focus:outline-none focus:border-primary transition-all text-sm font-bold placeholder:text-white/10"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Votre Email</label>
                      <input 
                        type="email" 
                        required
                        placeholder="nom@exemple.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-6 focus:outline-none focus:border-primary transition-all text-sm font-bold placeholder:text-white/10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Sujet</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Sujet de votre message"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-6 focus:outline-none focus:border-primary transition-all text-sm font-bold placeholder:text-white/10"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Message</label>
                    <textarea 
                      required
                      rows={5}
                      placeholder="Comment pouvons-nous vous aider ?"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-sm py-5 px-6 focus:outline-none focus:border-primary transition-all text-sm font-bold resize-none placeholder:text-white/10"
                    />
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full btn-primary justify-center py-6 text-[11px] font-black tracking-[0.3em]"
                  >
                    ENVOYER LE MESSAGE
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              )}
            </motion.div>

            {/* Info */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-5 space-y-8"
            >
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-10">Coordonnées</h3>
                
                <div className="space-y-10">
                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center text-primary shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight mb-1">ESTO Oujda</h4>
                      <p className="text-white/40 text-sm font-medium">Département Informatique, Maroc</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight mb-1">Email</h4>
                      <p className="text-white/40 text-sm font-medium">contact@smartpark.ma</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-sm flex items-center justify-center text-primary shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase tracking-tight mb-1">Téléphone</h4>
                      <p className="text-white/40 text-sm font-medium">+212 5XX XX XX XX</p>
                    </div>
                  </div>
                </div>

                <div className="mt-16 pt-10 border-t border-white/10">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-6">Suivez-nous</h5>
                  <div className="flex gap-6">
                    {['INSTAGRAM', 'FACEBOOK', 'LINKEDIN'].map(social => (
                      <a 
                        key={social} 
                        href="#" 
                        className="text-[10px] font-black tracking-widest text-white/60 hover:text-primary transition-colors"
                      >
                        {social}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 p-8 rounded-sm flex items-start gap-6">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0 mt-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-medium uppercase tracking-wider">
                  Notre équipe de support technique est disponible 24h/24 et 7j/7 pour répondre à vos besoins urgents.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
