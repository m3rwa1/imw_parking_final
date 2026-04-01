import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Car, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface SidebarItem {
  id: string;
  label: string;
  icon: any;
}

interface SidebarProps {
  role?: string;
  filteredSidebar: SidebarItem[];
  activeView: string;
  handleViewChange: (id: string) => void;
  activeReservationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  role, 
  filteredSidebar, 
  activeView, 
  handleViewChange, 
  activeReservationsCount 
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-80 border-r border-white/10 flex flex-col sticky top-0 h-screen bg-bg-dark/80 backdrop-blur-2xl z-20 overflow-hidden">
      <div className="p-10 pb-8 flex-shrink-0">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-primary p-2 rounded-sm transform group-hover:rotate-12 transition-transform duration-300">
            <Car className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">IMW<span className="text-primary">Parking</span></span>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-10 pb-6 pr-8 custom-scrollbar">
          {filteredSidebar.map((item) => (
            <motion.button 
              key={item.id}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleViewChange(item.id)}
              className={`w-full flex items-center justify-between gap-4 px-6 py-4 rounded-sm text-[11px] font-black tracking-widest uppercase transition-all duration-300 ${
                activeView === item.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
              {item.id === 'reservations' && activeReservationsCount > 0 && (
                <span className="bg-white/20 text-white text-[9px] px-2 py-1 rounded-full border border-white/20">
                  {activeReservationsCount}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

      <div className="mt-auto p-10 pt-8 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-sm border border-white/10">
          <div className="w-12 h-12 rounded-sm bg-primary/20 flex items-center justify-center text-sm font-black text-primary ring-1 ring-primary/20">
            {role?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-black uppercase tracking-tight truncate">{role}</p>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Session Active</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-sm text-[11px] font-black tracking-widest uppercase text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </motion.button>
      </div>
    </aside>
  );
};
