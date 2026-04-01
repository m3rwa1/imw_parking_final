import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail } from 'lucide-react';

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer id="contact-section" className="py-24 px-6 border-t border-white/5 bg-[#0a0a0c] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          {/* Column 1 */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-sm shadow-lg shadow-primary/20">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">IMW <span className="text-primary">Parking</span></span>
            </div>
            <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs">
              Solution intelligente de gestion de stationnement conçue pour l'efficacité, la sécurité et une expérience utilisateur sans friction.
            </p>
          </div>

          {/* Column 2 */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-primary" />
              <h4 className="text-lg font-black uppercase tracking-tight">Qui sommes-nous ?</h4>
            </div>
            <p className="text-white/60 text-sm font-medium leading-relaxed">
              ce site est réalisé par l'équipe de pfe : marwa nia , warda baqrage et iman tonouh de GRS.
            </p>
          </div>

          {/* Column 3 */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-primary" />
              <h4 className="text-lg font-black uppercase tracking-tight">Contact</h4>
            </div>
            <div 
              onClick={() => navigate('/contact')}
              className="flex items-center gap-3 text-white/60 hover:text-primary transition-colors cursor-pointer group"
            >
              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">contact@smartpark.ma</span>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20">
            © 2026 – Application de Gestion de Parking
          </p>
        </div>
      </div>
    </footer>
  );
}
