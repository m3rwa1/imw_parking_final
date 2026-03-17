import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Car, DollarSign, BarChart3, MapPin, Camera, ShieldCheck } from 'lucide-react';
import { Navbar, Hero, PageBackground } from './components/Landing';
import { Footer } from './components/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import Reclamation from './pages/Reclamation';
import Tarifs from './pages/Tarifs';
import Abonnements from './pages/Abonnements';
import Contact from './pages/Contact';

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Force scroll to top on every route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg-dark relative">
      <PageBackground />
      <Navbar />
      <Hero />
      
      {/* Excellence Section */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-primary text-xs font-black tracking-[0.5em] uppercase"
              >
                Notre Engagement
              </motion.div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.85] uppercase">
                Un parking pensé pour <br />
                <span className="text-primary italic">l'excellence.</span>
              </h2>
              <div className="w-24 h-1.5 bg-primary" />
            </div>
            
            <p className="text-white/40 text-xl leading-relaxed max-w-xl font-medium">
              Situé au cœur de l'ESTO Oujda, notre complexe de stationnement intègre les dernières technologies pour garantir une fluidité totale à l'entrée comme à la sortie.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-6">
              {[
                { icon: <MapPin className="w-6 h-6" />, text: "EMPLACEMENT STRATÉGIQUE" },
                { icon: <Camera className="w-6 h-6" />, text: "SURVEILLANCE HD 24/7" },
                { icon: <Car className="w-6 h-6" />, text: "ZONES DÉDIÉES" },
                { icon: <ShieldCheck className="w-6 h-6" />, text: "SÉCURITÉ MAXIMALE" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-5 group cursor-default"
                >
                  <div className="w-14 h-14 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    {item.icon}
                  </div>
                  <span className="text-[11px] font-black tracking-widest text-white/60 group-hover:text-white transition-colors uppercase">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="absolute -inset-20 bg-primary/10 rounded-full blur-[150px] animate-pulse" />
            <div className="relative rounded-sm overflow-hidden border border-white/10 shadow-2xl group bg-white/5">
              <img 
                src="https://images.pexels.com/photos/1756957/pexels-photo-1756957.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                alt="Luxury Parking" 
                className="w-full aspect-[4/5] object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Visite Virtuelle Section */}
      <section className="py-40 px-6 relative overflow-hidden bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-primary text-xs font-black tracking-[0.5em] uppercase"
              >
                Immersion Totale
              </motion.div>
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                VISITE <span className="text-primary italic">VIRTUELLE</span>
              </h2>
              <p className="text-white/30 max-w-xl font-medium text-lg">
                Découvrez nos infrastructures conçues pour la sécurité et le confort de vos véhicules.
              </p>
            </div>
            <div className="h-px flex-1 bg-white/10 mx-12 hidden md:block mb-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: "Places VIP", 
                img: "https://images.pexels.com/photos/4481258/pexels-photo-4481258.jpeg?auto=compress&cs=tinysrgb&w=800" 
              },
              { 
                title: "Technologie", 
                img: "https://images.pexels.com/photos/63633/pexels-photo-63633.jpeg?auto=compress&cs=tinysrgb&w=800" 
              },
              { 
                title: "Sécurité", 
                img: "https://images.pexels.com/photos/430205/pexels-photo-430205.jpeg?auto=compress&cs=tinysrgb&w=800" 
              }
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.8 }}
                className="group relative aspect-[3/4] rounded-sm overflow-hidden border border-white/10 shadow-2xl cursor-pointer bg-white/5"
              >
                <img 
                  src={card.img} 
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 p-12 flex flex-col justify-end">
                  <div className="w-16 h-1 bg-primary mb-6 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                  <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-[10px] text-white/40 font-black tracking-[0.3em] uppercase opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    Découvrir l'espace
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-40 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-6">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-primary text-xs font-black tracking-[0.5em] uppercase"
            >
              Services Premium
            </motion.div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 uppercase">
              L'excellence du <span className="text-primary italic">service</span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto text-lg font-medium">
              Des technologies de pointe au service de votre confort et de votre sécurité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: <Car className="w-8 h-8" />,
                title: "Accès Intelligent",
                desc: "Reconnaissance automatique des plaques et guidage dynamique vers votre place réservée."
              },
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: "Paiement Fluide",
                desc: "Facturation à la seconde et paiement sans contact via notre application sécurisée."
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Analyse Temps Réel",
                desc: "Tableaux de bord prédictifs pour optimiser l'occupation et vos revenus quotidiens."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="group p-12 rounded-sm bg-white/5 border border-white/10 hover:border-primary/40 transition-all shadow-2xl relative overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-colors" />
                <div className="w-16 h-16 bg-primary/10 rounded-sm flex items-center justify-center text-primary mb-10 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-5 uppercase tracking-tight">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed text-sm font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tarifs" element={<Tarifs />} />
        <Route path="/abonnements" element={<Abonnements />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/reclamation" element={<Reclamation />} />
        <Route path="/dashboard/:role" element={<Dashboard />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}