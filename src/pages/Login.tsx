import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, ArrowRight, X, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode = location.state?.mode === 'register' ? false : true;
  
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.mode) {
      setIsLogin(location.state.mode === 'login');
    }
  }, [location.state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Employee Logic
    if (email.includes('admin')) {
      navigate('/dashboard/admin');
      return;
    }
    if (email.includes('manager')) {
      navigate('/dashboard/manager');
      return;
    }
    if (email.includes('agent')) {
      navigate('/dashboard/agent');
      return;
    }

    // Client Logic
    const users = JSON.parse(localStorage.getItem('parking_users') || '[]');
    
    if (!isLogin) {
      // Registration
      const existingUser = users.find((u: any) => u.email === email);
      if (existingUser) {
        setError("Cet email est déjà utilisé.");
        return;
      }

      const newUser = { name, email, password, plate, isSubscribed: false };
      users.push(newUser);
      localStorage.setItem('parking_users', JSON.stringify(users));

      navigate('/client/dashboard', { 
        state: { 
          name: name, 
          isNew: true,
          email: email,
          plate: plate
        } 
      });
    } else {
      // Login
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (!user) {
        // Fallback for demo: check if it's a special email
        if (email.includes('sub')) {
          navigate('/client/dashboard', { 
            state: { 
              name: email.split('@')[0], 
              isSubscribed: true,
              isNew: false 
            } 
          });
          return;
        }
        setError("Email ou mot de passe incorrect.");
        return;
      }

      navigate('/client/dashboard', { 
        state: { 
          name: user.name, 
          isSubscribed: user.isSubscribed,
          isNew: false,
          email: user.email,
          plate: user.plate
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      <PageBackground />
      <BackButton />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-sm overflow-hidden shadow-2xl relative z-10"
      >
        <div className="p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-sm">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase">IMW<span className="text-primary">Parking</span></span>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
              {isLogin ? 'Bon retour !' : 'Créer un compte'}
            </h2>
            <p className="text-white/40 text-[11px] font-black uppercase tracking-widest">
              {isLogin ? 'Connectez-vous pour gérer votre espace.' : 'Rejoignez la nouvelle génération de stationnement.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="JEAN DUPONT"
                      className="w-full bg-white/5 border border-white/10 rounded-sm py-4 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-white/20 text-xs font-bold uppercase tracking-wider"
                      required={!isLogin}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Plaque d'immatriculation</label>
                    <div className="relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                      <input 
                        type="text" 
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        placeholder="AB-123-CD"
                        className="w-full bg-white/5 border border-white/10 rounded-sm py-4 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-white/20 text-xs font-bold uppercase tracking-wider font-mono"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="VOTRE@EMAIL.COM"
                  className="w-full bg-white/5 border border-white/10 rounded-sm py-4 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-white/20 text-xs font-bold uppercase tracking-wider"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-sm py-4 pl-11 pr-4 focus:outline-none focus:border-primary transition-all text-white placeholder:text-white/20 text-xs font-bold uppercase tracking-wider"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 p-4 rounded-sm border border-primary/20"
              >
                {error}
              </motion.p>
            )}

            <div className="pt-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="btn-primary w-full py-5 justify-center"
              >
                {isLogin ? 'Se connecter' : 'S\'inscrire'}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
              {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-black ml-2 hover:underline"
              >
                {isLogin ? 'Créer un compte' : 'Se connecter'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
