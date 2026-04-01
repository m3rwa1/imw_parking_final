import React from 'react';

export const HoursSelector = ({
  hours,
  setHours,
  variant = 'normal'
}: {
  hours: number;
  setHours: (n: number) => void;
  variant?: 'compact' | 'normal' | 'large';
}) => {
  const sizes = variant === 'large' ? 'w-14 h-14 text-2xl' : variant === 'compact' ? 'w-8 h-8 text-lg' : 'w-10 h-10 text-lg';
  const gap = variant === 'large' ? 'gap-10' : 'gap-6';
  return (
    <div className={`flex items-center ${gap} bg-white/5 p-4 rounded-xl border border-white/10`}> 
      <button 
        onClick={() => setHours(Math.max(1, hours - 1))}
        className={`${sizes} rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black`}
      >-</button>
      <div className="text-center">
        <span className={variant === 'large' ? 'text-5xl font-black block leading-none' : 'text-xl font-black block leading-none'}>{hours}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1 block">HEURE{hours > 1 ? 'S' : ''}</span>
      </div>
      <button 
        onClick={() => setHours(hours + 1)}
        className={`${sizes} rounded-sm bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center font-black`}
      >+</button>
    </div>
  );
};
