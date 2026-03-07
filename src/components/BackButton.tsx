import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05, x: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(-1)}
      className="fixed top-24 left-6 z-40 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-sm text-[10px] font-black tracking-[0.2em] uppercase transition-all"
    >
      <ArrowLeft className="w-4 h-4 text-primary" />
      RETOUR
    </motion.button>
  );
}
