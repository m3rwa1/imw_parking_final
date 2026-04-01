import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ChevronRight, User, ArrowRight, X, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';
import { useAuth } from '../contexts/AuthContext';

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
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    if (location.state?.mode) {
      setIsLogin(location.state.mode === 'login');
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!isLogin) {
        // ✅ Validation mot de passe
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
          setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
          setLoading(false);
          return;
        }

        const regRes = await register(name, email, password, plate || undefined);
        if (regRes.error) { setError(regRes.error); return; }
        
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        
        navigate('/client/dashboard', {
          state: { name: user?.name || name, email: user?.email || email, plate: user?.license_plate || plate, isNew: true, isSubscribed: false }
        });
      } else {
        const loginRes = await login(email, password);
        if (loginRes.error) { setError(loginRes.error); return; }
        
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        
        if (!user) { setError('Erreur de connexion.'); return; }
        
        const role = user.role?.toUpperCase();
        if (role === 'ADMIN')   { navigate('/dashboard/admin');   return; }
        if (role === 'MANAGER') { navigate('/dashboard/manager'); return; }
        if (role === 'AGENT')   { navigate('/dashboard/agent');   return; }
        navigate('/client/dashboard', {
          state: { name: user.name, email: user.email, plate: user.license_plate || '', isNew: false, isSubscribed: false }
        });
      }
    } catch {
      setError('Erreur réseau. Vérifiez que le backend tourne sur localhost:5000');
    } finally {
      setLoading(false);
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
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Nom Complet</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-sm text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                        placeholder="Jean Dupont"
                        required={!isLogin}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Plaque d'immatriculation</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                        <Car className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-sm text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                        placeholder="AB-123-CD"
                        required={!isLogin}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Professionnel</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-sm text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                  placeholder="nom@exemple.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Mot de Passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-primary transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-sm text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-sm flex items-center gap-3 text-red-400 text-xs font-bold uppercase tracking-wider"
              >
                <X className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-sm text-[11px] font-black tracking-[0.3em] uppercase flex items-center justify-center gap-3 transition-all shadow-xl ${
                  loading 
                    ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    TRAITEMENT...
                  </>
                ) : (
                  <>
                    {isLogin ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
                    <ArrowRight className="w-4 h-4" />
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
