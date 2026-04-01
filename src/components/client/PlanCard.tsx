import React from 'react';
import { motion } from 'motion/react';
import { Clock, Moon } from 'lucide-react';

export const PlanCard = ({
  p,
  onSelect,
  variant = 'default'
}: {
  p: any;
  onSelect: (id: any) => void;
  variant?: 'default' | 'highlight';
}) => (
  <motion.button 
    key={p.id}
    whileHover={{ y: -5 }}
    onClick={() => onSelect(p.id)}
    className={`p-6 ${variant === 'highlight' ? 'bg-primary/10 border-primary/30' : 'bg-white/5'} backdrop-blur-xl border border-white/10 rounded-sm text-left hover:border-primary/50 transition-all group relative overflow-hidden`}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-primary/10 rounded-sm flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
        {p.label.toLowerCase().includes('nuit') ? <Moon className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="font-black text-sm uppercase tracking-tight">{p.label}</h4>
        <p className="text-[9px] text-white/30 uppercase tracking-widest">{p.price.toFixed(2)}€ / {p.unit}</p>
      </div>
    </div>
  </motion.button>
);
