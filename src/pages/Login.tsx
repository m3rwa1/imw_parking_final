import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, ArrowRight, X, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';
import { apiService } from '../services/api';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMode = location.state?.mode === 'register' ? false : true;
  
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.mode) {
      setIsLogin(location.state.mode === 'login');
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Login
        const response = await apiService.login(email, password);
        
        if (response.error) {
          setError(response.error);
          setIsLoading(false);
          return;
        }
        
        // Route based on role
        if (response.user) {
          const { role, name: userName, id } = response.user;
          localStorage.setItem('user', JSON.stringify(response.user));
          
          if (role === 'ADMIN') {
            navigate('/dashboard/admin');
          } else if (role === 'MANAGER') {
            navigate('/dashboard/manager');
          } else if (role === 'AGENT') {
            navigate('/dashboard/agent');
          } else if (role === 'CLIENT') {
            navigate('/client/dashboard', { 
              state: { 
                name: userName,
                isSubscribed: true,
                isNew: false,
                userId: id
              } 
            });
          }
        }
      } else {
        // Register
        const response = await apiService.register(name, email, password, 'CLIENT');
        
        if (response.error) {
          setError(response.error);
          setIsLoading(false);
          return;
        }
        
        // Auto login after registration
        const loginResponse = await apiService.login(email, password);
        if (loginResponse.user) {
          const { role, name: userName, id } = loginResponse.user;
          localStorage.setItem('user', JSON.stringify(loginResponse.user));
          
          navigate('/client/dashboard', { 
            state: { 
              name: userName,
              isNew: true,
              email: email,
              userId: id
            } 
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
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
                disabled={isLoading}
                className="btn-primary w-full py-5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>Traitement en cours...</>
                ) : (
                  <>
                    {isLogin ? 'Se connecter' : 'S\'inscrire'}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
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
