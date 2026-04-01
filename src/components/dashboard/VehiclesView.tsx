import React from 'react';
import { motion } from 'motion/react';
import { Trash2, Car, Activity, Truck, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';

interface VehiclesViewProps {
  vehicles: any[];
  setVehicles: (v: any[]) => void;
  filteredVehicles: any[];
  paginatedVehicles: any[];
  vehiclesPage: number;
  setVehiclesPage: React.Dispatch<React.SetStateAction<number>>;
  handleEditVehicle: (vehicle: any) => void;
  handleDeleteVehicle: (id: number, originType?: string) => void;
  handleVehicleExit: (vehicle: any) => void;
  activeVehicles: number;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  setVehicles,
  filteredVehicles,
  paginatedVehicles,
  vehiclesPage,
  setVehiclesPage,
  handleEditVehicle,
  handleDeleteVehicle,
  handleVehicleExit,
  activeVehicles
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden shadow-2xl"
    >
      <div className="p-10 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Contrôle des Flux</h3>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Modification et suppression des entrées en temps réel.</p>
            <button 
              onClick={() => {
                localStorage.removeItem('parking_vehicles');
                setVehicles([]);
              }}
              className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
            >
              <Trash2 className="w-3 h-3" />
              Vider tout
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Occupation</p>
            <p className="text-lg font-black text-emerald-400">{activeVehicles} / 160 PLACES</p>
          </div>
          <div className="w-16 h-16 rounded-sm border-2 border-emerald-400/20 border-t-emerald-400 flex items-center justify-center text-xs font-black">
            {Math.round((activeVehicles / 160) * 100)}%
          </div>
        </div>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.2em] text-white/20 border-b border-white/10">
            <th className="px-10 py-6 font-black">Véhicule</th>
            <th className="px-10 py-6 font-black">Plaque</th>
            <th className="px-10 py-6 font-black">Place</th>
            <th className="px-10 py-6 font-black">Entrée</th>
            <th className="px-10 py-6 font-black">Sortie/Fin</th>
            <th className="px-10 py-6 font-black">Statut</th>
            <th className="px-10 py-6 font-black text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {paginatedVehicles.map((row) => (
            <tr key={row.id} className="hover:bg-white/[0.03] transition-colors group">
              <td className="px-10 py-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-colors ${
                    (row.vehicle_type || row.type) === 'Voiture' ? 'bg-blue-400/10 text-blue-400' :
                    (row.vehicle_type || row.type) === 'Moto' ? 'bg-primary/10 text-primary' : 
                    'bg-purple-400/10 text-purple-400'
                  }`}>
                    {(row.vehicle_type || row.type) === 'Voiture' && <Car className="w-6 h-6" />}
                    {(row.vehicle_type || row.type) === 'Moto' && <Activity className="w-6 h-6" />}
                    {(row.vehicle_type || row.type) === 'Camion' && <Truck className="w-6 h-6" />}
                  </div>
                  <span className="text-sm font-black uppercase tracking-tight">{row.vehicle_type || row.type}</span>
                </div>
              </td>
              <td className="px-10 py-6">
                <span className="text-xs font-mono bg-white/10 px-4 py-2 rounded-sm border border-white/10 group-hover:border-primary/50 transition-all">
                  {row.license_plate}
                </span>
              </td>
              <td className="px-10 py-6">
                <span className="text-sm text-white/60 font-black uppercase tracking-widest">{row.spot_number || row.spot}</span>
              </td>
              <td className="px-10 py-6">
                <span className="text-sm text-white/60 font-medium whitespace-nowrap">{row.entry_time ? new Date(row.entry_time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : (row.time || '---')}</span>
              </td>
              <td className="px-10 py-6">
                <span className="text-sm text-white/60 font-medium whitespace-nowrap">
                  {row.exit_time && String(row.exit_time).length > 5 
                    ? new Date(row.exit_time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) 
                    : (row.expected_end_time && String(row.expected_end_time).length > 5
                        ? `~${new Date(row.expected_end_time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` 
                        : '---')}
                </span>
              </td>
              <td className="px-10 py-6">
                <span className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-sm uppercase ${
                  row.status === 'IN' ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20' : 
                  row.status === 'PENDING' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                  row.status === 'VALIDATED' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' :
                  'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {row.origin_type === 'reservation' ? `RÉS. ${row.status}` : row.status}
                </span>
              </td>
              <td className="px-10 py-6">
                <div className="flex items-center justify-end gap-3">
                  {row.status === 'IN' && row.origin_type !== 'reservation' && (
                    <motion.button 
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(52, 211, 153, 0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleVehicleExit(row)}
                      className="p-2.5 rounded-sm text-emerald-400/60 hover:text-emerald-400 transition-all border border-emerald-400/20"
                      title="Enregistrer la sortie"
                    >
                      <Activity className="w-4 h-4 rotate-90" />
                    </motion.button>
                  )}
                  {row.origin_type !== 'reservation' && (
                    <motion.button 
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditVehicle(row)}
                      className="p-2.5 rounded-sm text-white/40 hover:text-white transition-all"
                      title="Modifier le véhicule"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteVehicle(row.id, row.origin_type)}
                    className="p-2.5 rounded-sm text-white/40 hover:text-red-400 transition-all"
                    title={row.origin_type === 'reservation' ? "Annuler la réservation" : "Supprimer l'entrée"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination Controls for Vehicles */}
      {filteredVehicles.length > 0 && (
        <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <button 
            disabled={vehiclesPage === 0}
            onClick={() => setVehiclesPage(prev => Math.max(0, prev - 1))}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>
          <div className="flex gap-2">
            {Array.from({ length: Math.ceil(filteredVehicles.length / 8) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setVehiclesPage(i)}
                className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all border ${
                  vehiclesPage === i 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button 
            disabled={vehiclesPage >= Math.ceil(filteredVehicles.length / 8) - 1}
            onClick={() => setVehiclesPage(prev => prev + 1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
};
