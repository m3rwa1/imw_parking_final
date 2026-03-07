import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Navbar, PageBackground } from '../components/Landing';
import { Clock, Sun, Moon, Calendar, ArrowLeft, ChevronRight, Mail } from 'lucide-react';
import { PRICING } from '../constants';
import { BackButton } from '../components/BackButton';

export default function Tarifs() {
  const navigate = useNavigate();

  const pricing = [
    {
      title: "Tarif Horaire",
      price: `${PRICING.hourly.toFixed(2)}€`,
      unit: "/ heure",
      description: "Idéal pour les courses rapides et les rendez-vous en ville.",
      icon: <Clock className="w-6 h-6" />,
      features: ["Paiement à la minute après la 1ère heure", "Accès 24h/24", "Place garantie"]
    },
    {
      title: "Forfait Journée",
      price: `${PRICING.daily.toFixed(2)}€`,
      unit: "/ 12 heures",
      description: "Parfait pour une journée de travail ou de shopping.",
      icon: <Sun className="w-6 h-6" />,
      features: ["Économisez 50% sur le tarif horaire", "Sorties multiples autorisées", "Vidéosurveillance incluse"]
    },
    {
      title: "Tarif Nuit",
      price: `${PRICING.night.toFixed(2)}€`,
      unit: "/ nuit (20h - 08h)",
      description: "Sécurisez votre véhicule pendant votre sommeil.",
      icon: <Moon className="w-6 h-6" />,
      features: ["Tarif fixe avantageux", "Éclairage renforcé", "Patrouilles régulières"]
    },
    {
      title: "Forfait Weekend",
      price: `${PRICING.weekend.toFixed(2)}€`,
      unit: "/ du ven. au lun.",
      description: "Profitez de votre weekend sans soucis de stationnement.",
      icon: <Calendar className="w-6 h-6" />,
      features: ["Accès illimité 72h", "Support prioritaire", "Lavage express offert"]
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
              <span className="text-white">Tarifs</span>
            </motion.div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 uppercase">
              Nos <span className="text-primary italic">Tarifs</span>
            </h1>
            <p className="text-white/40 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
              Une tarification transparente et adaptée à tous vos besoins de stationnement.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricing.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/5 p-10 rounded-sm hover:border-primary/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                
                <div className="w-14 h-14 bg-primary/10 rounded-sm flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{item.title}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-primary">{item.price}</span>
                  <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">{item.unit}</span>
                </div>
                <p className="text-white/40 text-sm mb-8 leading-relaxed font-medium">
                  {item.description}
                </p>
                <ul className="space-y-4">
                  {item.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3 text-[11px] font-black tracking-wider text-white/60 uppercase">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
