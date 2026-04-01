import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactElement<any>;
  trend?: string;
  positive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, positive }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
    whileHover={{ y: -5, borderColor: 'rgba(239,68,68,0.3)' }}
    className="bg-card-dark border border-white/5 p-8 rounded-[2rem] transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
    {icon && React.cloneElement(icon, { className: `${icon.props.className || ''} mb-6 group-hover:scale-110 transition-transform` })}
    <h4 className="text-white/40 text-xs uppercase tracking-widest mb-2 font-bold">{title}</h4>
    <p className="text-5xl font-bold tracking-tighter">{value}</p>
    <div className={`mt-6 flex items-center gap-2 text-sm font-bold bg-emerald-400/10 w-fit px-3 py-1 rounded-full ${positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
      {positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
      <span>{trend}</span>
    </div>
  </motion.div>
);
