import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Navbar, PageBackground } from '../components/Landing';
import { Footer } from '../components/Footer';
import { Star, Zap, Shield, Crown, ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { PRICING } from '../constants';
import { BackButton } from '../components/BackButton';
import { ChevronRight } from 'lucide-react';

export default function Abonnements() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Mensuel Basique",
      price: `${PRICING.subscription_basic.toFixed(2)}€`,
      period: "/ mois",
      description: "La solution idéale pour les travailleurs quotidiens.",
      icon: <Zap className="w-6 h-6" />,
      features: ["Accès du lun. au ven.", "08h00 - 19h00", "Place garantie", "Vidéosurveillance", "Badge d'accès physique"]
    },
    {
      name: "Mensuel Premium",
      price: `${PRICING.subscription_premium.toFixed(2)}€`,
      period: "/ mois",
      description: "Liberté totale et services exclusifs 24/7.",
      icon: <Star className="w-6 h-6" />,
      features: ["Accès illimité 24h/24", "7 jours sur 7", "Place réservée fixe", "Support prioritaire", "Accès via smartphone"]
    },
    {
      name: "Annuel Illimité",
      price: `${PRICING.subscription_annual.toFixed(2)}€`,
      period: "/ an",
      description: "L'option la plus économique pour une tranquillité maximale.",
      icon: <Crown className="w-6 h-6" />,
      features: ["Tous les avantages Premium", "2 mois offerts", "Place VIP à l'entrée", "Conciergerie dédiée", "Assurance incluse", "Accès à tous nos parkings"]
    }
  ];

  return (
    <div className="min-h-screen bg-bg-dark text-white relative">
      <PageBackground />
      <Navbar />
      <BackButton />
      
      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
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
              <span className="text-white">Abonnements</span>
            </motion.div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 uppercase">
              Nos <span className="text-primary italic">Abonnements</span>
            </h1>
            <p className="text-white/40 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              Choisissez la formule qui vous correspond et profitez d'un stationnement sans contraintes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                transition={{ delay: index * 0.1 }}
                className={`p-12 rounded-sm border transition-all group relative overflow-hidden backdrop-blur-xl ${
                  index === 1 
                    ? 'bg-primary/5 border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-10' 
                    : 'bg-white/5 border-white/5 hover:border-primary/30'
                }`}
              >
                {index === 1 && (
                  <div className="absolute top-8 right-8 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-sm uppercase tracking-[0.2em]">
                    Plus Populaire
                  </div>
                )}
                
                <div className={`w-16 h-16 rounded-sm flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 ${
                  index === 1 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {plan.icon}
                </div>
                
                <h3 className="text-3xl font-black mb-2 uppercase tracking-tight">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className={`text-5xl font-black ${index === 1 ? 'text-white' : 'text-primary'}`}>
                    {plan.price}
                  </span>
                  <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">{plan.period}</span>
                </div>
                
                <p className="text-white/40 text-sm mb-12 leading-relaxed font-medium">
                  {plan.description}
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login', { state: { mode: 'register' } })}
                  className={`w-full py-5 rounded-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 mb-12 ${
                    index === 1 ? 'bg-white text-primary hover:bg-white/90' : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  S'abonner maintenant
                  <ChevronRight className="w-5 h-5" />
                </motion.button>

                <ul className="space-y-5">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-4 text-[11px] font-black tracking-wider text-white/60 uppercase">
                      <CheckCircle2 className={`w-5 h-5 ${index === 1 ? 'text-primary' : 'text-primary/60'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}