import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

// ─── Config visuelle par type ─────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, {
  icon: React.ReactNode;
  border: string;
  bg: string;
  iconColor: string;
  bar: string;
}> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    bar: 'bg-emerald-400',
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    bar: 'bg-red-400',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    bar: 'bg-amber-400',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    bar: 'bg-blue-400',
  },
};

// ─── Toast Item ───────────────────────────────────────────────────────────────

const ToastItem: React.FC<{ toast: Toast; onClose: (id: number) => void }> = ({ toast, onClose }) => {
  const cfg = TOAST_CONFIG[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`
        relative overflow-hidden flex items-start gap-3 min-w-[280px] max-w-[360px]
        backdrop-blur-xl border rounded-2xl p-4 shadow-2xl
        bg-[#0d0d0d]/90 ${cfg.border}
      `}
    >
      {/* Barre de progression */}
      <motion.div
        className={`absolute bottom-0 left-0 h-[2px] ${cfg.bar}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 3.5, ease: 'linear' }}
      />

      {/* Icône */}
      <div className={`mt-0.5 flex-shrink-0 ${cfg.iconColor} p-1.5 rounded-xl ${cfg.bg}`}>
        {cfg.icon}
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-semibold text-white/90 leading-snug pt-0.5">
        {toast.message}
      </p>

      {/* Fermer */}
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-white/30 hover:text-white/70 transition-colors mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + counter++;
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-suppression après 3.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const closeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Conteneur positionné en haut à droite */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onClose={closeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
