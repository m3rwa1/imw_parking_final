import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft,
  Car, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  DollarSign,
  FileText,
  ShieldCheck,
  CreditCard,
  Maximize,
  ScanLine,
  Truck,
  Activity,
  ChevronRight,
  ChevronLeft,
  Crown,
  Zap,
  X,
  RefreshCw,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { PageBackground } from '../components/Landing';
import { apiService } from '../services/api';
import { useToast } from '../components/Toast';
import { StatCard } from '../components/dashboard/StatCard';
import { Sidebar } from '../components/dashboard/Sidebar';
import { VehiclesView } from '../components/dashboard/VehiclesView';

// Helper function to translate subscription plan types
const getPlanTypeLabel = (planType: string): string => {
  const translations: Record<string, string> = {
    'HOURLY': 'Horaire',
    'DAILY': 'Journalier',
    'MONTHLY': 'Mensuel',
    'ANNUAL': 'Annuel'
  };
  return translations[planType] || planType;
};

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Check authentication
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [navigate]);

  if (!isAuthenticated) {
    return null;
  }
  
  // Set initial view based on role
  const getInitialView = () => {
    if (role === 'admin') return 'vehicles';
    if (role === 'manager') return 'stats';
    return 'vehicles';
  };

  const [activeView, setActiveView] = useState(getInitialView());
  const [adminMapZone, setAdminMapZone] = useState<'fidèles' | 'standards'>('standards');
  const [adminMapPage, setAdminMapPage] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [usersPage, setUsersPage] = useState(0);
  const [vehiclesPage, setVehiclesPage] = useState(0);
  const [reclamationsPage, setReclamationsPage] = useState(0);
  const [subscriptionsPage, setSubscriptionsPage] = useState(0);
  const [reservationsPage, setReservationsPage] = useState(0);
  const [reportsPage, setReportsPage] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [viewHistory, setViewHistory] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ type: 'Voiture', plate: '', spot: '', endDate: '' });
  const [editingVehicle, setEditingVehicle] = useState<{id: number, plate: string, type: string, spot: string, endDate: string} | null>(null);
  const [editingPrice, setEditingPrice] = useState<{id: number, label: string, price: number} | null>(null);
  const [viewingReclamation, setViewingReclamation] = useState<any | null>(null);
  const [reclamationFilter, setReclamationFilter] = useState<'all' | 'urgent'>('all');
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0); // Total users from API
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [totalReservations, setTotalReservations] = useState(0);
  const [activeReservations, setActiveReservations] = useState<any[]>([]);
  const [statsPeriod, setStatsPeriod] = useState('7J');
  const [loading, setLoading] = useState(false); // Start as false to show content immediately
  const [backendError, setBackendError] = useState<string | null>(null); // Track backend errors
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    active_now: 0, 
    total_revenue: 0, 
    entries_today: 0, 
    total_exits: 0 
  });
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);
  const [vehicleDistribution, setVehicleDistribution] = useState<any[]>([]);
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const chartScrollRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (showSpinner: boolean = false) => {
    if (showSpinner) setLoading(true);
    setBackendError(null);
    try {
      const days = statsPeriod === '7J' ? 7 : statsPeriod === '30J' ? 30 : 90;
      const [vRes, sRes, rRes, subRes, pRes, lRes, revRes, resRes, distRes] = await Promise.all([
        apiService.getActiveVehicles(),
        apiService.getTodayStats(),
        apiService.getAllReclamations(),
        apiService.getAllSubscriptions(),
        apiService.getPricingPlans(),
        apiService.getActivityLogs(),
        apiService.getRevenueHistory(days),
        apiService.getAdminReservations(reservationsPage + 1, 5),
        apiService.getVehicleDistribution()
      ]);

      // Check if backend likely down. Ignore permission errors (403) which are expected for some roles.
      const responses = [vRes, sRes, rRes, subRes, pRes, lRes, revRes, resRes];
      const nonPermissionErrors = responses.filter(r => r?.error && !String(r.error).toLowerCase().includes('permissions insuffisantes'));
      if (nonPermissionErrors.length > 0) {
        setBackendError('❌ Backend non accessible - Assurez-vous que le serveur Python tourne sur localhost:5000');
      } else {
        setBackendError(null);
      }

      // Validation et normalisation des réponses
      if (!vRes.error && Array.isArray(vRes.data)) {
        setVehicles(vRes.data);
      } else {
        setVehicles([]);
        if (vRes.error) console.error('Erreur getActiveVehicles:', vRes.error);
      }

      if (!sRes.error && typeof sRes === 'object') {
        setStats({
          active_now: sRes.active_now ?? 0,
          total_revenue: sRes.total_revenue ?? 0,
          entries_today: sRes.entries_today ?? 0,
          total_exits: sRes.total_exits ?? 0,
          active_subscriptions: sRes.active_subscriptions ?? 0,
          trends: sRes.trends || {}
        });
      } else {
        setStats({
          active_now: 0,
          total_revenue: 0,
          entries_today: 0,
          total_exits: 0,
          active_subscriptions: 0,
          trends: {}
        });
        if (sRes.error) console.error('Erreur getTodayStats:', sRes.error);
      }

      if (!rRes.error && Array.isArray(rRes.data)) {
        setReclamations(rRes.data);
      } else {
        setReclamations([]);
        if (rRes.error) console.error('Erreur getAllReclamations:', rRes.error);
      }

      if (!subRes.error && Array.isArray(subRes.data)) {
        setSubscriptions(subRes.data);
      } else {
        setSubscriptions([]);
        if (subRes.error) console.error('Erreur getAllSubscriptions:', subRes.error);
      }

      if (!pRes.error && Array.isArray(pRes.data)) {
        setPricingData(pRes.data);
      } else {
        setPricingData([]);
        if (pRes.error) console.error('Erreur getPricingPlans:', pRes.error);
      }

      if (!lRes.error && Array.isArray(lRes.data)) {
        setLogs(lRes.data);
      } else {
        setLogs([]);
        if (lRes.error) console.error('Erreur getActivityLogs:', lRes.error);
      }

      if (!revRes.error && Array.isArray(revRes)) {
        setRevenueHistory(revRes);
      } else {
        setRevenueHistory([]);
        if (revRes.error) console.error('Erreur getRevenueHistory:', revRes.error);
      }

      if (!distRes.error && Array.isArray(distRes)) {
        setVehicleDistribution(distRes);
      } else {
        setVehicleDistribution([]);
      }

      if (!resRes.error && resRes.data && Array.isArray(resRes.data)) {
        setActiveReservations(resRes.data);
        setTotalReservations(resRes.total || 0);
      } else {
        setActiveReservations([]);
        setTotalReservations(0);
        if (resRes.error) console.error('Erreur getAdminReservations:', resRes.error);
      }
    } catch (e) {
      const errorMsg = (e instanceof Error) ? e.message : 'Erreur lors du chargement des données';
      console.error('fetchData error:', errorMsg, e);
      // showToast will be called on data mount with detailed error if needed
    } finally {
      setLoading(false);
    }
  }, [statsPeriod, reservationsPage]);

  // Load users when page changes
  const fetchUsers = useCallback(async (page: number = 1) => {
    try {
      const res = await apiService.getAllUsers(page, 5); // 5 users per page to match frontend pagination
      if (!res.error && Array.isArray(res.data)) {
        setTotalUsers(res.total || 0);
        const mappedUsers = res.data.map((u: any) => ({
          id: u.id, name: u.name, email: u.email, role: u.role,
          plate: u.license_plate || 'N/A', 
          isSubscribed: u.role === 'CLIENT' && u.has_active_sub === 1,
          is_active: u.is_active, created_at: u.created_at
        }));
        setRegisteredUsers(mappedUsers);
      } else {
        setRegisteredUsers([]);
      }
    } catch {
      setRegisteredUsers([]);
    }
  }, []);

  useEffect(() => {
    // Initial load with spinner only
    fetchData(true);
  }, []);

  // Déclencher le rafraîchissement lors des changements de filtres/pages
  useEffect(() => {
    fetchData(false);
  }, [statsPeriod, reservationsPage, usersPage, vehiclesPage, subscriptionsPage, reclamationsPage, reportsPage, logsPage]);

  // Auto-refresh every 30s without spinner
  useEffect(() => {
    const timer = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Load users when page changes
  useEffect(() => {
    fetchUsers(usersPage + 1); // API uses 1-based page numbering
  }, [usersPage, fetchUsers]);

  useEffect(() => {
    if (chartScrollRef.current) {
      chartScrollRef.current.scrollTo({
        left: chartScrollRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [revenueHistory]);
  
  const handleViewChange = (newView: string) => {
    if (newView !== activeView) {
      setViewHistory((prev: string[]) => [...prev, activeView]);
      setActiveView(newView);
    }
  };

  const handleBackView = () => {
    if (viewHistory.length > 0) {
      const prevView = viewHistory[viewHistory.length - 1];
      setViewHistory((prev: string[]) => prev.slice(0, -1));
      setActiveView(prevView);
    } else {
      // If no history, don't go back to login, just stay or do nothing
      // Or maybe navigate to home if they really want to exit
      // navigate('/');
    }
  };
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem('parking_reports');
    return saved ? JSON.parse(saved) : [
      { id: 1, type: 'daily', title: 'Rapport Journalier', date: '09 Mars 2024', size: '1.2 MB' },
      { id: 2, type: 'weekly', title: 'Rapport Hebdomadaire (S10)', date: '03-09 Mars 2024', size: '4.5 MB' },
      { id: 3, type: 'monthly', title: 'Bilan Mensuel (Février)', date: 'Février 2024', size: '12.8 MB' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('parking_reports', JSON.stringify(reports));
  }, [reports]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    // Simulate "Gathering data" phase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    // Simulate "Analyzing statistics" phase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const subCount = stats?.active_subscriptions || 0;
    
    const newDaily = {
      id: Date.now(),
      type: 'daily',
      title: `Rapport Journalier - ${dateStr}`,
      date: dateStr,
      size: '1.4 MB',
      stats: {
        subscribers: subCount,
        occupancy: activeVehicles,
        revenue: stats?.total_revenue || 0
      }
    };

    setReports((prev: any) => {
      const updated = [newDaily, ...prev];
      const dailyCount = updated.filter(r => r.type === 'daily').length;
      
      if (dailyCount > 0 && dailyCount % 7 === 0) {
        const newWeekly = {
          id: Date.now() + 1,
          type: 'weekly',
          title: `Rapport Hebdomadaire - Semaine ${Math.ceil(dailyCount / 7)}`,
          date: `Période du ${dateStr}`,
          size: '5.2 MB'
        };
        
        const weeklyCount = [newWeekly, ...updated.filter(r => r.type === 'weekly')].length;
        if (weeklyCount > 0 && weeklyCount % 4 === 0) {
          const newMonthly = {
            id: Date.now() + 2,
            type: 'monthly',
            title: `Bilan Mensuel - ${now.toLocaleDateString('fr-FR', { month: 'long' })}`,
            date: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
            size: '15.5 MB'
          };
          return [newMonthly, newWeekly, ...updated];
        }
        return [newWeekly, ...updated];
      }
      return updated;
    });
    
    setIsGenerating(false);
  };

  const handleDeleteReport = (id: number) => {
    setReports(reports.filter((r: any) => r.id !== id));
  };

  const handleSaveReportEdit = () => {
    if (editingReport) {
      setReports(reports.map((r: any) => r.id === editingReport.id ? editingReport : r));
      setEditingReport(null);
    }
  };

  const handleUploadReport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newReport = {
        title: file.name,
        date: new Date().toLocaleDateString('fr-FR'),
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
      };
      setReports([newReport, ...reports]);
    }
  };


  const activeVehicles = vehicles.filter((v: any) => v.status === 'IN').length;

  const [parkingSettings, setParkingSettings] = useState({
    name: 'IMW PARKING MAROC',
    capacity: 160,
    notifications: true,
    maintenance: false
  });

  const sidebarItems = [
    // Agent Features
    { id: 'vehicles', icon: Car, label: 'Gestion Véhicules', role: ['agent', 'admin'] },
    { id: 'map', icon: MapPin, label: 'Plan du Parking', role: ['agent', 'admin'] },
    // Manager Features
    { id: 'stats', icon: BarChart3, label: 'Statistiques', role: ['manager', 'admin'] },
    { id: 'reports', icon: FileText, label: 'Rapports Financiers', role: ['manager', 'admin'] },
    { id: 'subs', icon: CreditCard, label: 'Abonnements', role: ['manager', 'admin'] },
    
    // Admin Features
    { id: 'reservations', icon: Clock, label: 'Réservations', role: ['admin', 'manager'] },
    { id: 'reclamations', icon: MessageSquare, label: 'Réclamations', role: ['admin'] },
    { id: 'logs', icon: Activity, label: 'Logs Système', role: ['admin'] },
    { id: 'pricing', icon: DollarSign, label: 'Gestion Tarifs', role: ['admin'] },
    { id: 'users', icon: Users, label: 'Utilisateurs', role: ['admin'] },
    { id: 'settings', icon: Settings, label: 'Paramètres', role: ['admin'] },
  ];

  const filteredSidebar = sidebarItems.filter(item => item.role.includes(role || ''));

  const matchingUsers = registeredUsers.filter((u: any) => {
    const q = searchQuery.toLowerCase();
    const n = (u.name || '').toLowerCase();
    const e = (u.email || '').toLowerCase();
    const p = (u.plate || '').toLowerCase();
    return n.includes(q) || e.includes(q) || p.includes(q);
  });
  // Data already paginated from backend (5 per page), no need to slice again
  const filteredUsers = matchingUsers;

  const handleVehicleExit = async (vehicle: any) => {
    if (window.confirm(`Confirmer la sortie du véhicule ${vehicle.license_plate} ?`)) {
      try {
        const res = await apiService.vehicleExit({ license_plate: vehicle.license_plate });
        if (res.error) showToast(res.error, 'error');
        else {
          showToast(`Sortie enregistrée. Prix: ${res.price}€`, 'success');
          fetchData();
        }
      } catch {
        showToast('Erreur lors de la sortie', 'error');
      }
    }
  };

  const handleDeleteVehicle = async (id: number, originType?: string) => {
    const isReservation = originType === 'reservation';
    const msg = isReservation 
      ? 'Voulez-vous vraiment supprimer cette réservation ?' 
      : 'Voulez-vous vraiment supprimer définitivement cette entrée ?';

    if (window.confirm(msg)) {
      try {
        const res = isReservation 
          ? await apiService.deleteReservation(id)
          : await apiService.deleteVehicle(id);
          
        if (res.error) showToast(res.error, 'error');
        else {
          showToast(isReservation ? 'Réservation supprimée' : 'Entrée supprimée', 'success');
          fetchData();
        }
      } catch {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleQuickEntry = async () => {
    if (!newVehicle.plate || !newVehicle.spot) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.vehicleEntry({
        license_plate: newVehicle.plate,
        spot_number: newVehicle.spot,
        vehicle_type: newVehicle.type as any,
        expected_end_time: newVehicle.endDate ? newVehicle.endDate.replace('T', ' ') + ':00' : undefined
      });
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Entrée enregistrée', 'success');
        setShowQuickEntry(false);
        setNewVehicle({ type: 'Voiture', plate: '', spot: '', endDate: '' });
        fetchData();
      }
    } catch {
      showToast('Erreur réseau', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((v: any) => 
    (v.license_plate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.spot_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.vehicle_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Pagination for vehicles (8 per page to match UI)
  const paginatedVehicles = filteredVehicles.slice(vehiclesPage * 8, (vehiclesPage + 1) * 8);
  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle({ 
      id: vehicle.id, 
      plate: vehicle.license_plate || '', 
      type: vehicle.vehicle_type || vehicle.type || 'Voiture', 
      spot: vehicle.spot_number || vehicle.spot || '',
      endDate: vehicle.expected_end_time ? vehicle.expected_end_time.substring(0, 16) : '' 
    });
  };

  const handleResolveReclamation = async (id: number) => {
    try {
      const res = await apiService.updateReclamationStatus(id, 'RESOLVED');
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Réclamation marquée comme résolue', 'success');
        fetchData();
        setViewingReclamation(null);
      }
    } catch {
      showToast('Erreur lors de la résolution', 'error');
    }
  };

  const handleApproveSubscription = async (id: number) => {
    try {
      const res = await apiService.updateSubscriptionStatus(id, 'ACTIVE');
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Abonnement approuvé', 'success');
        fetchData();
      }
    } catch {
      showToast('Erreur lors de l\'approbation', 'error');
    }
  };

  const handleRejectSubscription = async (id: number) => {
    try {
      const res = await apiService.updateSubscriptionStatus(id, 'CANCELLED');
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Abonnement rejeté', 'info');
        fetchData();
      }
    } catch {
      showToast('Erreur lors du rejet', 'error');
    }
  };

  const handleDeleteSubscription = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet abonnement ?')) return;
    try {
      const res = await apiService.deleteSubscription(id);
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Abonnement supprimé', 'success');
        fetchData();
      }
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleValidateReservation = async (id: number) => {
    try {
      const res = await apiService.validateReservation(id);
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Réservation validée et véhicule ajouté', 'success');
        fetchData();
      }
    } catch {
      showToast('Erreur lors de la validation', 'error');
    }
  };

  const savePrice = async () => {
    if (editingPrice) {
      try {
        const res = await apiService.updatePricingPlan(editingPrice.id, { 
          price: editingPrice.price,
          label: editingPrice.label 
        });
        if (res.error) showToast(res.error, 'error');
        else {
          showToast('Tarif mis à jour', 'success');
          fetchData();
          setEditingPrice(null);
        }
      } catch {
        showToast('Erreur lors de la modification', 'error');
      }
    }
  };

  const handleToggleUserSubscription = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'CANCELLED' : 'ACTIVE';
      const res = await apiService.updateSubscriptionStatus(id, newStatus as any);
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Statut mis à jour', 'success');
        fetchData();
      }
    } catch {
      showToast('Erreur lors de la modification', 'error');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
  };

  const saveUserChanges = async () => {
    if (editingUser) {
      try {
        const res = await apiService.updateUser(editingUser.id, {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          license_plate: editingUser.license_plate
        });
        if (res.error) showToast(res.error, 'error');
        else {
          showToast('Utilisateur mis à jour', 'success');
          fetchUsers(usersPage + 1); // Reload users on current page after update
          setEditingUser(null);
        }
      } catch {
        showToast('Erreur lors de la modification', 'error');
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment désactiver cet utilisateur ?')) return;
    try {
      const res = await apiService.deleteUser(id);
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Utilisateur désactivé', 'success');
        fetchUsers(usersPage + 1);
      }
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleDeleteReservation = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette réservation ? Cette action est irréversible.")) return;
    try {
      const res = await apiService.deleteReservation(id);
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Réservation supprimée', 'success');
        fetchData(false);
      }
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleClearAllUsers = async () => {
    if (!window.confirm("Voulez-vous vraiment désactiver TOUS les clients ? Cette action est irréversible.")) return;
    try {
      const res = await apiService.clearAllUsers();
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Tous les clients ont été désactivés', 'success');
        setRegisteredUsers([]);
        setTotalUsers(0);
        if (usersPage === 0) {
          fetchUsers(1);
        } else {
          setUsersPage(0);
        }
      }
    } catch {
      showToast('Erreur lors de la suppression groupée', 'error');
    }
  };

  const handleClearAllReservations = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer TOUTES les réservations ?")) return;
    try {
      const res = await apiService.clearAllReservations();
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Toutes les réservations ont été supprimées', 'success');
        setActiveReservations([]);
        fetchData(false);
      }
    } catch {
      showToast('Erreur lors de la suppression des réservations', 'error');
    }
  };

  const handleClearAllReclamations = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer TOUTES les réclamations ?")) return;
    try {
      const res = await apiService.clearAllReclamations();
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Toutes les réclamations ont été supprimées', 'success');
        setReclamations([]);
        fetchData(false);
      }
    } catch {
      showToast('Erreur lors de la suppression des réclamations', 'error');
    }
  };

  const handleClearAllLogs = async () => {
    if (!window.confirm("Voulez-vous vraiment effacer TOUT le journal système ?")) return;
    try {
      const res = await apiService.clearAllLogs();
      if (res.error) showToast(res.error, 'error');
      else {
        showToast('Le journal système a été effacé', 'success');
        setLogs([]);
        fetchData(false);
      }
    } catch {
      showToast('Erreur lors de l\'effacement des logs', 'error');
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('parking_settings', JSON.stringify(parkingSettings));
  };

  const saveVehicleEntry = async () => {
    if (editingVehicle) {
      try {
        const res = await apiService.updateVehicleEntry(editingVehicle.id, {
          license_plate: editingVehicle.plate,
          vehicle_type: editingVehicle.type,
          spot_number: editingVehicle.spot,
          expected_end_time: editingVehicle.endDate ? editingVehicle.endDate.replace('T', ' ') + ':00' : null
        });
        if (res.error) showToast(res.error, 'error');
        else {
          showToast('Véhicule mis à jour', 'success');
          fetchData();
          setEditingVehicle(null);
        }
      } catch {
        showToast('Erreur lors de la modification', 'error');
      }
    }
  };


  return (
    <div className="min-h-screen bg-bg-dark flex relative overflow-hidden">
      <PageBackground />
      
      {/* Loading Spinner during data fetch */}
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/50 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"
            />
            <div className="text-center">
              <p className="text-white/80 font-black text-lg">Chargement des données...</p>
              <p className="text-white/40 text-xs mt-2 font-black tracking-widest uppercase">Connexion au backend</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Backend Error Banner */}
      {backendError && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-rose-500/10 border-b border-rose-500/20 px-6 py-4 text-center"
        >
          <p className="text-rose-400 font-black text-sm">{backendError}</p>
        </motion.div>
      )}
      
      {/* Custom Back Button for Dashboard */}
      {viewHistory.length > 0 && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackView}
          className="fixed top-24 left-6 z-40 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-sm text-[10px] font-black tracking-[0.2em] uppercase transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
          RETOUR
        </motion.button>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingVehicle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingVehicle(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Modifier le véhicule</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Nouvelle immatriculation</label>
                  <input 
                    type="text"
                    value={editingVehicle.plate}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, plate: e.target.value.toUpperCase() })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Type de véhicule</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Voiture', 'Moto', 'Camion'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setEditingVehicle({ ...editingVehicle, type: t })}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          editingVehicle.type === t 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <input 
                    type="text"
                    value={editingVehicle.spot}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, spot: e.target.value.toUpperCase() })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Fin Estimée</label>
                  <input 
                    type="datetime-local"
                    value={editingVehicle.endDate}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, endDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest text-white"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingVehicle(null)}
                    className="flex-1 btn-secondary justify-center py-4"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={saveVehicleEntry}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingPrice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPrice(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Modifier le Tarif</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">{editingPrice.label}</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editingPrice.price}
                    onChange={(e) => setEditingPrice({ ...editingPrice, price: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-sm py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                    autoFocus
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingPrice(null)}
                    className="flex-1 btn-secondary justify-center py-4"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={savePrice}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {viewingReclamation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingReclamation(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-card-dark border border-white/10 p-10 rounded-sm shadow-2xl"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{viewingReclamation.subject}</h3>
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest">Client: {viewingReclamation.user_name || viewingReclamation.client} • {viewingReclamation.created_at || viewingReclamation.date}</p>
                </div>
                <button onClick={() => setViewingReclamation(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-sm">
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                    {viewingReclamation.description || viewingReclamation.message || "Aucun message détaillé fourni."}
                  </p>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setViewingReclamation(null)}
                    className="flex-1 btn-secondary justify-center py-4"
                  >
                    Fermer
                  </button>
                  <button 
                    onClick={() => handleResolveReclamation(viewingReclamation.id)}
                    className="flex-1 btn-primary justify-center py-4"
                  >
                    Marquer comme Résolu
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Report Modal */}
        {editingReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingReport(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-xl font-black uppercase tracking-tight mb-8">Modifier le Rapport</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Titre du Rapport</label>
                  <input 
                    type="text" 
                    value={editingReport.title} 
                    onChange={(e) => setEditingReport({ ...editingReport, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary text-sm font-bold transition-all" 
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button onClick={() => setEditingReport(null)} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all">Annuler</button>
                  <button onClick={handleSaveReportEdit} className="flex-1 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">Sauvegarder</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-xl font-black uppercase tracking-tight mb-8">Modifier Utilisateur</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom Complet</label>
                  <input 
                    type="text" 
                    value={editingUser.name} 
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-primary text-sm font-bold transition-all" 
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button onClick={() => setEditingUser(null)} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all">Annuler</button>
                  <button onClick={saveUserChanges} className="flex-1 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">Sauvegarder</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showQuickEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickEntry(false)}
              className="absolute inset-0 bg-bg-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card-dark border border-white/10 p-10 rounded-[2.5rem] shadow-2xl"
            >
              <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">Entrée Rapide</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Type de véhicule</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Voiture', 'Moto', 'Camion'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setNewVehicle({ ...newVehicle, type: t })}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          newVehicle.type === t 
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Plaque d'immatriculation</label>
                  <input 
                    type="text"
                    value={newVehicle.plate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                    placeholder="AB-123-CD"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Place assignée</label>
                  <input 
                    type="text"
                    value={newVehicle.spot}
                    onChange={(e) => setNewVehicle({ ...newVehicle, spot: e.target.value.toUpperCase() })}
                    placeholder="A-01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Fin Estimée (Optionnel)</label>
                  <input 
                    type="datetime-local"
                    value={newVehicle.endDate}
                    onChange={(e) => setNewVehicle({ ...newVehicle, endDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary text-xl font-mono tracking-widest text-white"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowQuickEntry(false)}
                    className="flex-1 btn-secondary justify-center py-4 rounded-2xl"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleQuickEntry}
                    className="flex-1 btn-primary justify-center py-4 rounded-2xl"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar 
        role={role}
        filteredSidebar={filteredSidebar}
        activeView={activeView}
        handleViewChange={handleViewChange}
        activeReservationsCount={activeReservations.length}
      />

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto relative z-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-primary text-[10px] font-black tracking-[0.5em] uppercase mb-4"
            >
              Tableau de Bord
            </motion.div>
            <h1 className="text-5xl font-black uppercase tracking-tighter leading-none">
              {sidebarItems.find(i => i.id === activeView)?.label}
            </h1>
            <p className="text-white/40 text-[10px] mt-4 font-black uppercase tracking-[0.2em]">
              {activeView === 'map' ? (
                <>Interface Admin — <span className="text-white/20 font-medium lowercase italic">Dernière MàJ: {new Date().toLocaleTimeString()}</span></>
              ) : (
                `Interface ${role} — Optimisation des performances de gestion.`
              )}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="RECHERCHER..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-sm py-4 pl-12 pr-6 text-[11px] font-black tracking-widest focus:outline-none focus:border-primary w-64 transition-all focus:w-80 uppercase"
              />
            </div>
            {(role === 'agent' || role === 'admin') && (
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQuickEntry(true)}
                  className="bg-gradient-to-r from-primary to-rose-600 text-white px-8 py-4 rounded-sm font-black uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center gap-3 border border-white/10"
                >
                  <Plus className="w-4 h-4" />
                  ENTRÉE RAPIDE
                </motion.button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* AGENT VIEWS */}
          {activeView === 'vehicles' && (
            <VehiclesView
              vehicles={vehicles}
              setVehicles={setVehicles}
              filteredVehicles={filteredVehicles}
              paginatedVehicles={paginatedVehicles}
              vehiclesPage={vehiclesPage}
              setVehiclesPage={setVehiclesPage}
              handleEditVehicle={handleEditVehicle}
              handleDeleteVehicle={handleDeleteVehicle}
              handleVehicleExit={handleVehicleExit}
              activeVehicles={activeVehicles}
            />
          )}

          {activeView === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem] text-center">
                  <p className="text-primary text-5xl font-black mb-2">{(vehicles.filter(v => v.status === 'IN').length + activeReservations.filter(r => (r.status === 'PENDING' || r.status === 'VALIDATED') && !vehicles.some(v => v.spot_number === r.place_number && v.status === 'IN')).length)}</p>
                  <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em]">Indisponibles / Occupées</p>
                </div>
                <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem] text-center">
                  <p className="text-emerald-400 text-5xl font-black mb-2">{160 - (vehicles.filter(v => v.status === 'IN').length + activeReservations.filter(r => (r.status === 'PENDING' || r.status === 'VALIDATED') && !vehicles.some(v => v.spot_number === r.place_number && v.status === 'IN')).length)}</p>
                  <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em]">Libres</p>
                </div>
                <div className="bg-card-dark border border-white/5 p-8 rounded-[2rem] text-center">
                  <p className="text-white text-5xl font-black mb-2">160</p>
                  <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em]">Total</p>
                </div>
              </div>

              {/* Main Map Card */}
              <div className="bg-card-dark border border-white/5 p-10 rounded-[2rem] space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Plan du Parking IMW</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                        160 Places Totales • {(vehicles.filter(v => v.status === 'IN').length + activeReservations.filter(r => (r.status === 'PENDING' || r.status === 'VALIDATED') && !vehicles.some(v => v.spot_number === r.place_number && v.status === 'IN')).length)} indisponibles • {160 - (vehicles.filter(v => v.status === 'IN').length + activeReservations.filter(r => (r.status === 'PENDING' || r.status === 'VALIDATED') && !vehicles.some(v => v.spot_number === r.place_number && v.status === 'IN')).length)} libres
                      </p>
                      <p className="text-[10px] text-white/20 uppercase tracking-widest mt-0.5">
                        60 fidèles (A-01 à A-60) • 100 standards (S-01 à S-100)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button 
                      onClick={() => { setAdminMapZone('fidèles'); setAdminMapPage(0); }}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        adminMapZone === 'fidèles' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Fidèles
                    </button>
                    <button 
                      onClick={() => { setAdminMapZone('standards'); setAdminMapPage(0); }}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        adminMapZone === 'standards' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      Standards
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-white/5">
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Occupée / Réservée</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Libre {adminMapZone === 'fidèles' ? 'Fidèle' : 'Standard'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      {adminMapZone === 'fidèles' 
                        ? `A-${(adminMapPage * 20 + 1).toString().padStart(2, '0')} - A-${Math.min(60, (adminMapPage + 1) * 20).toString().padStart(2, '0')}`
                        : `S-${(adminMapPage * 20 + 1).toString().padStart(2, '0')} - S-${Math.min(100, (adminMapPage + 1) * 20).toString().padStart(2, '0')}`
                      }
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const spotIndex = adminMapPage * 20 + i + 1;
                    if (adminMapZone === 'fidèles' && spotIndex > 60) return null;
                    if (adminMapZone === 'standards' && spotIndex > 100) return null;
                    
                    const spotId = adminMapZone === 'fidèles'
                      ? `A-${spotIndex.toString().padStart(2, '0')}`
                      : `S-${spotIndex.toString().padStart(2, '0')}`;
                    const isOccupied = vehicles.some(v => v.spot_number === spotId && v.status === 'IN');
                    const isReserved = activeReservations.some(r => r.place_number === spotId && (r.status === 'PENDING' || r.status === 'VALIDATED'));
                    const isUnavailable = isOccupied || isReserved;
                    
                    return (
                      <motion.div 
                        key={spotId}
                        whileHover={{ scale: 1.02 }}
                        className={`aspect-[4/3] rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden ${
                          isUnavailable 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]'
                            : 'bg-emerald-400/5 border-emerald-400/20 text-emerald-400'
                        }`}
                      >
                        {isUnavailable ? (
                          <Car className="w-6 h-6 animate-in fade-in zoom-in duration-500" />
                        ) : (
                          <Car className="w-6 h-6 opacity-20" />
                        )}
                        <span className="text-[10px] font-black tracking-widest uppercase">{spotId}</span>
                        {isUnavailable && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-6">
                  <button 
                    disabled={adminMapPage === 0}
                    onClick={() => setAdminMapPage(prev => Math.max(0, prev - 1))}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: adminMapZone === 'fidèles' ? 3 : 5 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          adminMapPage === i ? 'bg-primary w-4' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <button 
                    disabled={adminMapPage === (adminMapZone === 'fidèles' ? 2 : 4)}
                    onClick={() => setAdminMapPage(prev => prev + 1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* MANAGER VIEWS */}
          {activeView === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Véhicules Actifs" 
                  value={(stats.active_now || 0).toString()} 
                  icon={<Car className="w-6 h-6 text-primary" />}
                  trend={stats.trends?.occupancy || "0%"}
                  positive={(stats.trends?.occupancy || "").startsWith('+')}
                />
                <StatCard 
                  title="Revenu Journalier" 
                  value={`${stats.total_revenue || 0} DH`} 
                  icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
                  trend={stats.trends?.revenue || "0%"}
                  positive={(stats.trends?.revenue || "").startsWith('+')}
                />
                <StatCard 
                  title="Taux d'Occupation" 
                  value={`${Math.round(((stats.active_now || 0) / 160) * 100)}%`} 
                  icon={<BarChart3 className="w-6 h-6 text-blue-400" />}
                  trend="Capacité: 160 places"
                  positive={true}
                />
                <StatCard 
                  title="Entrées du Jour" 
                  value={stats.entries_today?.toString() || "0"} 
                  icon={<AlertCircle className="w-6 h-6 text-primary" />}
                  trend={stats.trends?.entries || "0%"}
                  positive={(stats.trends?.entries || "").startsWith('+')}
                />
              </div>

              <div className="bg-card-dark border border-white/5 p-10 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-bold">Analyse des revenus journaliers</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Données basées sur la période sélectionnée</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                      {['7J', '30J', '90J'].map(period => (
                        <button 
                          key={period}
                          onClick={() => setStatsPeriod(period)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                            statsPeriod === period ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isGenerating}
                      onClick={handleGenerateReport}
                      className={`btn-primary px-6 py-3 rounded-xl text-[10px] flex items-center gap-2 relative overflow-hidden ${isGenerating ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {isGenerating ? (
                        <>
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Activity className="w-4 h-4" />
                          </motion.div>
                          Génération...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Générer Rapport
                        </>
                      )}
                      {isGenerating && (
                        <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                      )}
                    </motion.button>
                  </div>
                </div>
                <div className="h-80 overflow-x-auto pb-4 custom-scrollbar" ref={chartScrollRef}>
                  <div className="flex items-end gap-6 min-w-max h-full">
                    {revenueHistory && revenueHistory.length > 0 ? (
                      (() => {
                        const maxRevenue = Math.max(...revenueHistory.map((r: any) => r.revenue || 0), 1);
                        return revenueHistory.map((item: any, i: number) => {
                          const percentage = (item.revenue / maxRevenue) * 100;
                          return (
                            <div key={i} className="w-16 flex flex-col items-center gap-4 group">
                              <div className="relative w-full h-full flex items-end">
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: `${Math.max(percentage, 2)}%`, opacity: 1 }}
                                  transition={{ type: "spring", stiffness: 100, damping: 15, delay: i * 0.02 }}
                                  className="w-full bg-gradient-to-t from-primary/40 to-primary group-hover:from-primary group-hover:to-primary/80 transition-all rounded-2xl relative shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                >
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    whileHover={{ opacity: 1, y: 0 }}
                                    className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-bg-dark text-[10px] font-black px-3 py-1.5 rounded-lg shadow-2xl pointer-events-none z-20 whitespace-nowrap"
                                  >
                                    {item.revenue ? `${item.revenue.toLocaleString()} DH` : '0 DH'}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
                                  </motion.div>
                                </motion.div>
                              </div>
                              <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                                {new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <div className="w-full flex items-center justify-center text-white/40 text-sm">
                        Aucune donnée disponible
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'reports' && (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Rapports Financiers</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      localStorage.removeItem('parking_reports');
                      setReports([]);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Trash2 className="w-3 h-3" />
                    Vider tout
                  </button>
                  <label className="btn-secondary px-6 py-3 rounded-2xl text-xs cursor-pointer flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Uploader un rapport
                    <input type="file" className="hidden" onChange={handleUploadReport} />
                  </label>
                  <button 
                    onClick={handleGenerateReport}
                    className="btn-primary px-6 py-3 rounded-2xl text-xs"
                  >
                    Générer un rapport
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {reports.map((report: any) => (
                    <motion.div 
                      key={report.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.03)' }}
                      className="bg-card-dark border border-white/5 p-6 rounded-3xl flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                          report.type === 'monthly' ? 'bg-purple-400/10 text-purple-400' :
                          report.type === 'weekly' ? 'bg-blue-400/10 text-blue-400' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {report.type === 'monthly' ? <BarChart3 className="w-6 h-6" /> :
                           report.type === 'weekly' ? <Activity className="w-6 h-6" /> :
                           <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">{report.title}</h4>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              report.type === 'monthly' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' :
                              report.type === 'weekly' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                              'bg-primary/10 text-primary border-primary/20'
                            }`}>
                              {report.type}
                            </span>
                          </div>
                          <p className="text-xs text-white/40">{report.date} • {report.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingReport(report)}
                          className="p-3 hover:bg-white/10 rounded-2xl text-white/20 hover:text-primary transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-3 hover:bg-white/10 rounded-2xl text-white/20 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.1, rotate: -45 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => {
                          try {
                            await apiService.downloadReport(report.type as any);
                            showToast('Téléchargement terminé', 'success');
                          } catch (e) {
                            showToast('Erreur lors du téléchargement. Vérifiez les permissions.', 'error');
                          }
                        }}
                        className="p-3 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all"
                      >
                        <ArrowDownLeft className="w-5 h-5" />
                      </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeView === 'subs' && (
            <motion.div 
              key="subs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-dark border border-white/5 rounded-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg">Demandes d'Abonnements</h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      localStorage.removeItem('parking_subscriptions');
                      setSubscriptions([]);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Trash2 className="w-3 h-3" />
                    Vider tout
                  </button>
                  <button className="text-xs font-bold text-primary hover:underline">Historique complet</button>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold">{sub.user_name || sub.user}</h4>
                        <p className="text-xs text-white/40">Plaque: <span className="font-mono text-white/60">{sub.license_plate || sub.plate}</span> • Type: {getPlanTypeLabel(sub.plan_type || sub.type || 'MONTHLY')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                        sub.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-400' :
                        sub.status === 'PENDING' ? 'bg-primary/10 text-primary' : 
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {sub.status === 'ACTIVE' ? 'Actif' : sub.status === 'PENDING' ? 'En attente' : sub.status === 'CANCELLED' ? 'Annulé' : sub.status}
                      </span>
                      {sub.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveSubscription(sub.id)}
                            className="bg-primary hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            Approuver
                          </button>
                          <button 
                            onClick={() => handleRejectSubscription(sub.id)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            Rejeter
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleDeleteSubscription(sub.id)}
                          className="bg-white/5 hover:bg-rose-500 hover:text-white text-rose-500 p-2.5 rounded-xl transition-all border border-transparent hover:border-rose-500/50"
                          title="Supprimer l'abonnement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ADMIN VIEWS */}
          {activeView === 'reservations' && (
            <motion.div 
              key="reservations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-sm overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Liste des Réservations Actives</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Gestion en temps réel des places occupées</p>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <p className="text-[9px] text-primary/60 font-black uppercase tracking-widest">Mise à jour: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{activeReservations.length} ACTIVES</span>
                  </div>
                  <button 
                    onClick={handleClearAllReservations}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Trash2 className="w-3 h-3" />
                    Vider tout
                  </button>
                </div>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.2em] text-white/40 bg-white/[0.01] border-b border-white/10">
                    <th className="px-8 py-5 font-black">Place</th>
                    <th className="px-8 py-5 font-black">Véhicule</th>
                    <th className="px-8 py-5 font-black">Plaque</th>
                    <th className="px-8 py-5 font-black">Propriétaire</th>
                    <th className="px-8 py-5 font-black">Début</th>
                    <th className="px-8 py-5 font-black">Fin</th>
                    <th className="px-8 py-5 font-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeReservations.length > 0 ? activeReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-white/[0.02] transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                            <span className="text-sm font-black text-primary group-hover:text-white">{res.place_number || '---'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-sm border border-white/10">
                            {((res.vehicle || res.vehicle_type || 'Voiture').toLowerCase().includes('moto')) ? (
                              <div className="w-4 h-4 flex items-center justify-center text-white/60">🏍️</div>
                            ) : ((res.vehicle || res.vehicle_type || 'Voiture').toLowerCase().includes('camion')) ? (
                              <Truck className="w-4 h-4 text-white/60" />
                            ) : (
                              <Car className="w-4 h-4 text-white/60" />
                            )}
                          </div>
                          <span className="text-xs font-black uppercase tracking-tight text-white/80">
                            {res.vehicle || res.vehicle_type || 'Voiture'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex items-center px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm font-mono text-xs tracking-wider group-hover:border-primary/30 transition-all">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2" />
                          {res.plate_number || res.license_plate}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-black uppercase tracking-tight text-white/90">{res.owner_name || res.nom_proche}</span>
                          <span className="text-[9px] text-white/20 font-medium lowercase tracking-wider">{res.owner_email || res.user_email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-black tracking-tight text-white/80 whitespace-nowrap">
                          {res.start_time ? new Date(res.start_time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-black tracking-tight text-white/80 whitespace-nowrap">
                          {res.end_time ? new Date(res.end_time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '---'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleDeleteReservation(res.id)}
                            className="p-2.5 bg-rose-500/5 hover:bg-rose-500/10 rounded-sm text-rose-500/60 hover:text-rose-500 transition-all border border-rose-500/10 hover:border-rose-500/20"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-24 text-center text-white/20">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-black uppercase tracking-widest">Aucune réservation active</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {totalReservations > 5 && (
                <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                  <button 
                    disabled={reservationsPage === 0}
                    onClick={() => setReservationsPage(prev => Math.max(0, prev - 1))}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Page {reservationsPage + 1} sur {Math.ceil(totalReservations / 5)}
                  </span>
                  <button 
                    disabled={reservationsPage >= Math.ceil(totalReservations / 5) - 1}
                    onClick={() => setReservationsPage(prev => prev + 1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'reclamations' && (
            <motion.div 
              key="reclamations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Centre de Support & Réclamations</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={handleClearAllReclamations}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest mr-4"
                  >
                    <Trash2 className="w-3 h-3" />
                    Vider tout
                  </button>
                  <button 
                    onClick={() => setReclamationFilter('all')}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
                      reclamationFilter === 'all' ? 'bg-primary text-white' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    Toutes
                  </button>
                  <button 
                    onClick={() => setReclamationFilter('urgent')}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold transition-colors ${
                      reclamationFilter === 'urgent' ? 'bg-red-400 text-white' : 'bg-red-400/10 border border-red-400/20 text-red-400'
                    }`}
                  >
                    Urgentes ({reclamations.filter(r => r.status === 'Urgent').length})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {reclamations
                  .filter(rec => reclamationFilter === 'all' || rec.status === 'Urgent')
                  .map((rec) => (
                  <div key={rec.id} className="bg-card-dark border border-white/5 p-8 rounded-[2rem] flex items-center justify-between group hover:border-primary/30 transition-all shadow-xl">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl ${rec.status === 'Urgent' || rec.status === 'OPEN' ? 'bg-red-400/10 text-red-400' : 'bg-blue-400/10 text-blue-400'}`}>
                        <AlertCircle className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{rec.subject}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-white/60 font-medium">{rec.user_name || rec.client}</p>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <p className="text-xs text-white/40">{rec.created_at || rec.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setViewingReclamation(rec)}
                        className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all border border-white/5"
                      >
                        Détails
                      </button>
                      <button 
                        onClick={() => handleResolveReclamation(rec.id)}
                        className="bg-primary hover:bg-red-600 text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Résoudre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'logs' && (
            <motion.div 
              key="logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-dark border border-white/5 rounded-3xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="font-bold">Journal d'Audit Système</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Traçabilité complète des actions administratives et de sécurité</p>
                    <button 
                      onClick={handleClearAllLogs}
                      className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <Trash2 className="w-3 h-3" />
                      Vider tout
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Système Opérationnel
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {logs.slice(logsPage * 20, (logsPage + 1) * 20).map((log) => (
                  <div key={log.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                      <span className="text-sm font-bold">{log.action}</span>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="text-xs text-white/40 font-medium">{log.user_name || log.user}</span>
                      <span className="text-xs font-mono text-white/20">{log.created_at || log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              {logs.length > 20 && (
                <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                  <button 
                    disabled={logsPage === 0}
                    onClick={() => setLogsPage(prev => Math.max(0, prev - 1))}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Page {logsPage + 1} / {Math.ceil(logs.length / 20)}
                  </span>
                  <button 
                    disabled={logsPage >= Math.ceil(logs.length / 20) - 1}
                    onClick={() => setLogsPage(prev => prev + 1)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-card-dark border border-white/5 p-10 rounded-[2.5rem] space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
                
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Configuration des Tarifs</h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">Gestion des offres et forfaits de stationnement</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {pricingData.reduce((acc: any[], current: any) => {
                    const x = acc.find(item => item.label === current.label);
                    if (!x) return acc.concat([current]);
                    return acc;
                  }, []).map((p: any, i: number) => (
                    <div key={i} className="group p-6 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-3xl transition-all hover:border-primary/30">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          {p.label.toLowerCase().includes('nuit') ? <Moon className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <button 
                          onClick={() => setEditingPrice({ 
                            id: p.id, 
                            label: p.label || p.name, 
                            price: p.price 
                          })}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-primary transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-bold text-white/90 mb-1">{p.label || p.name}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-primary">{p.price}</span>
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">MAD / {p.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-6 relative z-10">
                  <ShieldCheck className="w-12 h-12 text-primary shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold mb-1">Sécurité des Tarifs</h4>
                    <p className="text-xs text-white/50 leading-relaxed uppercase tracking-wider font-medium text-[9px]">
                      Toute modification est enregistrée dans les logs système pour une traçabilité complète.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-dark border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Utilisateurs Enregistrés</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Gestion des comptes clients et abonnés.</p>
                    <button 
                      onClick={handleClearAllUsers}
                      className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <Trash2 className="w-3 h-3" />
                      Vider tout
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setUsersPage(0);
                      }}
                      className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold focus:outline-none focus:border-primary transition-all w-64 placeholder:text-white/20"
                    />
                  </div>
                  <div className="text-xs text-white/60 font-black uppercase tracking-[0.3em] bg-white/10 px-4 py-2 rounded-full border border-white/20">
                    {totalUsers} Clients
                  </div>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {matchingUsers.length > 0 ? (
                  <>
                    {filteredUsers.map((user, i) => (
                        <div key={i} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                          <div className="flex items-center gap-6 flex-1">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{user.name}</h4>
                              <p className="text-sm text-white/60 font-medium mb-3">{user.email}</p>
                              {/* Display license plates as badges */}
                              <div className="flex flex-wrap gap-2">
                                {user.license_plate && user.license_plate !== 'N/A' && (
                                  user.license_plate.split(', ').map((plate: string, idx: number) => (
                                    <span 
                                      key={idx}
                                      className="text-[10px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all"
                                    >
                                      {plate}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div 
                              className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase transition-all border ${
                                user.isSubscribed 
                                  ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' 
                                  : 'bg-white/10 text-white/60 border-white/20'
                              }`}
                            >
                              {user.isSubscribed ? 'Fidèle' : 'Standard'}
                            </div>
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all border border-white/5 hover:border-white/10"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-3 bg-rose-500/5 hover:bg-rose-500/20 rounded-2xl text-rose-500/60 hover:text-rose-500 transition-all border border-rose-500/10 hover:border-rose-500/20"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    
                    {/* Pagination Controls */}
                    <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                      <div className="flex items-center">
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest mr-4">
                          Page {usersPage + 1} sur {Math.max(1, Math.ceil(totalUsers / 5))}
                        </span>
                        <button 
                          disabled={usersPage === 0}
                          onClick={() => setUsersPage(prev => Math.max(0, prev - 1))}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Précédent
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {Array.from({ length: Math.ceil(totalUsers / 5) }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setUsersPage(i)}
                            className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all border ${
                              usersPage === i 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button 
                        disabled={usersPage >= Math.ceil(totalUsers / 5) - 1}
                        onClick={() => setUsersPage(prev => prev + 1)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-32 text-center text-white/20">
                    <Users className="w-16 h-16 mx-auto mb-6 opacity-5" />
                    <p className="text-xl font-black uppercase tracking-widest">Aucun utilisateur trouvé</p>
                    <p className="text-sm mt-2">Essayez d'ajuster votre recherche.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl space-y-8"
            >
              <div className="bg-card-dark border border-white/5 p-12 rounded-[3rem] space-y-10 shadow-2xl">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Paramètres Système</h3>
                  <p className="text-[10px] text-white/40 mt-2 font-black uppercase tracking-widest">Configuration globale de l'infrastructure de parking.</p>
                </div>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom de l'Établissement</label>
                      <input 
                        type="text" 
                        value={parkingSettings.name} 
                        onChange={(e) => setParkingSettings({ ...parkingSettings, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 focus:outline-none focus:border-primary text-sm font-bold transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">Notifications Critiques</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Alertes email quand l'occupation dépasse 90%</p>
                      </div>
                      <button 
                        onClick={() => setParkingSettings({ ...parkingSettings, notifications: !parkingSettings.notifications })}
                        className={`w-14 h-8 rounded-full relative transition-all ${parkingSettings.notifications ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: parkingSettings.notifications ? 24 : 4 }}
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" 
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">Mode Maintenance</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">Désactiver les nouvelles réservations en ligne</p>
                      </div>
                      <button 
                        onClick={() => setParkingSettings({ ...parkingSettings, maintenance: !parkingSettings.maintenance })}
                        className={`w-14 h-8 rounded-full relative transition-all ${parkingSettings.maintenance ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: parkingSettings.maintenance ? 24 : 4 }}
                          className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md" 
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  className="w-full btn-primary py-5 rounded-[1.5rem] justify-center text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                >
                  Sauvegarder la configuration
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}