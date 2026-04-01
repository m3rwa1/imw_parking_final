import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Car, User, LogIn, Menu, X, ChevronRight, Mail } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function PageBackground() {
  return (
    <div className="page-bg">
      <div className="page-bg-overlay" />
      <img 
        src="https://images.pexels.com/photos/1756957/pexels-photo-1756957.jpeg?auto=compress&cs=tinysrgb&w=1200" 
        alt="Parking Texture" 
        className="page-bg-image"
      />
    </div>
  );
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
      isScrolled ? "bg-bg-dark/95 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-primary p-2 rounded-sm transform group-hover:rotate-12 transition-transform duration-300">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">IMW<span className="text-primary">Parking</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'ACCUEIL', path: '/' },
            { label: 'TARIFS', path: '/tarifs' },
            { label: 'ABONNEMENTS', path: '/abonnements' }
          ].map((item) => (
            <Link 
              key={item.label}
              to={item.path} 
              className="text-[11px] font-black tracking-[0.2em] hover:text-primary transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/contact')}
            className="hidden lg:flex items-center gap-2 px-6 py-3 rounded-sm text-[11px] font-black tracking-widest text-white bg-primary hover:bg-primary/90 transition-all uppercase shadow-xl shadow-primary/20"
          >
            <Mail className="w-4 h-4" />
            CONTACT
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login', { state: { mode: 'register' } })}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-sm text-[11px] font-black tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-primary/30 uppercase"
          >
            <User className="w-4 h-4" />
            S'INSCRIRE
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

export function Hero() {
  const navigate = useNavigate();
  
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
      <PageBackground />

      <div className="relative z-20 text-center max-w-5xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.3em] text-white/80 mb-12"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          La destination ultime pour le stationnement de luxe
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-6xl md:text-[8rem] font-black tracking-tighter mb-8 leading-[0.8] uppercase"
        >
          Gérez votre <br />
          <span className="text-primary italic">parking</span>
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex items-center justify-center gap-3 text-xs font-black tracking-[0.4em] text-white/60 uppercase mb-16"
        >
          <span>IMW Parking Maroc</span>
          <ChevronRight className="w-3 h-3 text-primary" />
          <span className="text-white">Accueil</span>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: '#ff1e1e' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login', { state: { mode: 'register' } })}
            className="btn-primary px-20 py-6 text-lg"
          >
            <User className="w-6 h-6" />
            COMMENCER MAINTENANT
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tarifs')}
            className="btn-secondary px-20 py-6 text-lg"
          >
            VOIR LES TARIFS
          </motion.button>
        </div>
      </div>
    </div>
  );
}
