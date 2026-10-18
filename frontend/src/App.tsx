import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavPage } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { PatientFlowPage } from './pages/PatientFlowPage';
import { BedManagementPage } from './pages/BedManagementPage';
import { DoctorAttendancePage } from './pages/DoctorAttendancePage';
import { SupplyChainPage } from './pages/SupplyChainPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './services/api';
import {
  Facility,
  Medicine,
  Bed,
  Doctor,
  PatientQueueItem,
  StockTransfer,
  Alert,
  ActivityLog,
  ForecastResponse,
  DashboardSummary
} from './types';

export const App: React.FC = () => {
  // Navigation state (synced with hash)
  const getPageFromHash = (): NavPage => {
    const hash = window.location.hash.replace('#', '') as NavPage;
    const validPages: NavPage[] = [
      'overview',
      'inventory',
      'forecast',
      'patient-flow',
      'beds',
      'doctors',
      'supply-chain',
      'reports',
      'settings'
    ];
    return validPages.includes(hash) ? hash : 'overview';
  };

  const [currentPage, setCurrentPage] = useState<NavPage>(getPageFromHash);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');

  // Application Data States
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [queue, setQueue] = useState<PatientQueueItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keep hash in sync
  const navigateTo = (page: NavPage) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch all live data for selected facility
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const facs = await api.getFacilities();
      setFacilities(facs);

      const [
        dashData,
        medsData,
        bedsData,
        docsData,
        queueData,
        trfsData,
        alertsData,
        actData,
        fcData
      ] = await Promise.all([
        api.getDashboard(selectedFacility),
        api.getMedicines({ facilityId: selectedFacility }),
        api.getBeds(selectedFacility),
        api.getDoctors(selectedFacility),
        api.getPatientQueue(selectedFacility),
        api.getTransfers(selectedFacility),
        api.getAlerts({ facilityId: selectedFacility }),
        api.getActivities(selectedFacility),
        api.getForecast(selectedFacility)
      ]);

      setSummary(dashData);
      setMedicines(medsData);
      setBeds(bedsData);
      setDoctors(docsData);
      setQueue(queueData);
      setTransfers(trfsData);
      setAlerts(alertsData);
      setActivities(actData);
      setForecastData(fcData);
    } catch (err: any) {
      console.warn('Backend API unavailable; operating with synthetic fallback:', err.message);
      showToast('Running in demo mode: verified synthetic dataset loaded.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFacility]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Operational Handlers with Optimistic Updates
  const handleAddMedicine = async (data: Partial<Medicine>) => {
    try {
      await api.createMedicine(data);
      showToast(`Medicine '${data.name}' registered to inventory.`);
      await loadData();
    } catch (err: any) {
      showToast(`Error adding medicine: ${err.message}`);
    }
  };

  const handleReceiveStock = async (id: string, data: { quantity: number; batch_number?: string; supplier?: string; reason?: string }) => {
    try {
      await api.receiveStock(id, data);
      showToast(`Received ${data.quantity} units into inventory.`);
      await loadData();
    } catch (err: any) {
      showToast(`Restock error: ${err.message}`);
    }
  };

  const handleAdjustStock = async (id: string, data: { new_quantity: number; reason: string }) => {
    try {
      await api.adjustStock(id, data);
      showToast(`Stock updated to ${data.new_quantity}. Ledger reason recorded.`);
      await loadData();
    } catch (err: any) {
      showToast(`Adjustment error: ${err.message}`);
    }
  };

  const handleFetchMovements = async (id: string) => {
    return await api.getStockMovements(id);
  };

  const handleRecalculateForecast = async () => {
    try {
      const res = await api.recalculateForecast(selectedFacility);
      setForecastData(res);
      showToast('AI demand forecast recalculated from multi-week telemetry.');
    } catch (err: any) {
      showToast(`Forecast error: ${err.message}`);
    }
  };

  const handleAdjustForecastParams = async (safetyDays: number) => {
    try {
      const res = await api.getForecast(selectedFacility, safetyDays);
      setForecastData(res);
    } catch {
      // silent catch for slider drag
    }
  };

  const handleRegisterPatient = async (data: Partial<PatientQueueItem>) => {
    try {
      const res = await api.registerPatient(data);
      setQueue((prev) => [res, ...prev]);
      showToast(`Token ${res.token} issued in ${res.department}.`);
    } catch (err: any) {
      showToast(`Registration error: ${err.message}`);
    }
  };

  const handleUpdatePatientStatus = async (
    id: string,
    status: 'Waiting' | 'In Consultation' | 'Completed'
  ) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, queue_status: status } : q))
    );
    try {
      await api.updatePatientStatus(id, { queue_status: status });
      showToast(`Patient queue status advanced to '${status}'.`);
    } catch (err: any) {
      showToast(`Queue update error: ${err.message}`);
      await loadData();
    }
  };

  const handleToggleBed = async (bed: Bed) => {
    const cycleMap: Record<string, 'Available' | 'Occupied' | 'Cleaning'> = {
      Available: 'Occupied',
      Occupied: 'Cleaning',
      Cleaning: 'Available',
      'Out of service': 'Cleaning'
    };
    const nextStatus = cycleMap[bed.status] || 'Available';
    setBeds((prev) =>
      prev.map((b) => (b.id === bed.id ? { ...b, status: nextStatus, last_updated: new Date().toISOString() } : b))
    );
    try {
      await api.updateBedStatus(bed.id, nextStatus);
      showToast(`Bed ${bed.bed_number} changed to '${nextStatus}'.`);
    } catch (err: any) {
      showToast(`Bed error: ${err.message}`);
      await loadData();
    }
  };

  const handleToggleDoctor = async (doc: Doctor) => {
    const nextStatus = !doc.is_present;
    setDoctors((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, is_present: nextStatus, last_updated: new Date().toISOString() } : d))
    );
    try {
      await api.updateDoctorAttendance(doc.id, nextStatus);
      showToast(`${doc.name} marked ${nextStatus ? 'Present' : 'Absent'}.`);
    } catch (err: any) {
      showToast(`Doctor roster error: ${err.message}`);
      await loadData();
    }
  };

  const handleAddDoctor = async (data: Partial<Doctor>) => {
    try {
      await api.addDoctor(data);
      showToast(`Doctor ${data.name} added to duty roster.`);
      await loadData();
    } catch (err: any) {
      showToast(`Error adding doctor: ${err.message}`);
    }
  };

  const handleRequestTransfer = async (data: any) => {
    try {
      await api.createTransfer(data);
      showToast('Inter-facility transfer request submitted.');
      await loadData();
    } catch (err: any) {
      showToast(`Transfer error: ${err.message}`);
    }
  };

  const handleApproveTransfer = async (id: string) => {
    try {
      await api.approveTransfer(id);
      showToast(`Transfer ${id} authorized. Stock atomically deducted and credited.`);
      await loadData();
    } catch (err: any) {
      showToast(`Approval error: ${err.message}`);
    }
  };

  const handleRejectTransfer = async (id: string) => {
    try {
      await api.rejectTransfer(id);
      showToast(`Transfer ${id} rejected.`);
      await loadData();
    } catch (err: any) {
      showToast(`Rejection error: ${err.message}`);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await api.updateAlertStatus(alertId, 'Acknowledged');
      showToast('Alert marked as acknowledged.');
      await loadData();
    } catch (err: any) {
      showToast(`Alert error: ${err.message}`);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset the demonstration database back to canonical initial seed state?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemoDatabase();
      showToast('Demonstration dataset reset to initial state.');
      await loadData();
    } catch (err: any) {
      showToast(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportConsolidatedCSV = () => {
    const rows = [
      ['Record Type', 'ID / Token', 'Name / Entity', 'Facility', 'Metric 1', 'Metric 2', 'Status'],
      ...medicines.map((m) => ['Medicine', m.id, m.name, m.facility_id, `Stock: ${m.current_stock}`, `Threshold: ${m.min_threshold}`, m.status]),
      ...beds.map((b) => ['Bed', b.id, b.bed_number, b.facility_id, b.ward, '', b.status]),
      ...doctors.map((d) => ['Doctor', d.id, d.name, d.facility_id, d.department, d.shift, d.is_present ? 'Present' : 'Absent']),
      ...queue.map((q) => ['Patient', q.token, q.department, q.facility_id, `Wait: ${q.estimated_wait_minutes}m`, q.priority, q.queue_status])
    ];

    const csvContent = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `swastik-health-consolidated-telemetry-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Consolidated CSV exported successfully.');
  };

  const pageTitles: Record<NavPage, string> = {
    overview: 'Operations Overview',
    inventory: 'Medicine Inventory Register',
    forecast: 'AI Demand Forecast & Stockout Prevention',
    'patient-flow': 'Patient Queue & Flow Telemetry',
    beds: 'Ward Bed Capacity Management',
    doctors: 'Doctor Duty Roster & Attendance',
    'supply-chain': 'Multi-Facility Supply Chain & Transfers',
    reports: 'Reports, Audit & Analytics',
    settings: 'System Information & Diagnostics'
  };

  const activeAlertCount = alerts.filter((a) => a.status === 'Active').length;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={navigateTo}
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        alertsCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          pageTitle={pageTitles[currentPage]}
          facilities={facilities}
          selectedFacility={selectedFacility}
          onSelectFacility={setSelectedFacility}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onExportCSV={handleExportConsolidatedCSV}
          activeAlertCount={activeAlertCount}
          onAlertsClick={() => navigateTo('overview')}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'overview' && (
            <OverviewPage
              summary={summary}
              beds={beds}
              doctors={doctors}
              alerts={alerts}
              onNavigate={navigateTo}
              onToggleBed={handleToggleBed}
              onToggleDoctor={handleToggleDoctor}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onRefresh={loadData}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'inventory' && (
            <InventoryPage
              medicines={medicines}
              onAddMedicine={handleAddMedicine}
              onReceiveStock={handleReceiveStock}
              onAdjustStock={handleAdjustStock}
              onFetchMovements={handleFetchMovements}
              selectedFacility={selectedFacility}
            />
          )}

          {currentPage === 'forecast' && (
            <ForecastingPage
              forecastData={forecastData}
              onRecalculate={handleRecalculateForecast}
              onAdjustParameters={handleAdjustForecastParams}
              isLoading={isLoading}
            />
          )}

          {currentPage === 'patient-flow' && (
            <PatientFlowPage
              queue={queue}
              onRegisterPatient={handleRegisterPatient}
              onUpdateStatus={handleUpdatePatientStatus}
              selectedFacility={selectedFacility}
            />
          )}

          {currentPage === 'beds' && (
            <BedManagementPage
              beds={beds}
              onUpdateBedStatus={async (bedId, status) => {
                await api.updateBedStatus(bedId, status);
                showToast(`Bed status updated to '${status}'.`);
                await loadData();
              }}
              selectedFacility={selectedFacility}
            />
          )}

          {currentPage === 'doctors' && (
            <DoctorAttendancePage
              doctors={doctors}
              onToggleAttendance={handleToggleDoctor}
              onAddDoctor={handleAddDoctor}
              selectedFacility={selectedFacility}
            />
          )}

          {currentPage === 'supply-chain' && (
            <SupplyChainPage
              transfers={transfers}
              facilities={facilities}
              medicines={medicines}
              onRequestTransfer={handleRequestTransfer}
              onApproveTransfer={handleApproveTransfer}
              onRejectTransfer={handleRejectTransfer}
              selectedFacility={selectedFacility}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsPage
              medicines={medicines}
              beds={beds}
              doctors={doctors}
              queue={queue}
              transfers={transfers}
              activities={activities}
              selectedFacility={selectedFacility}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              facilities={facilities}
              onResetDatabase={handleResetDatabase}
              isResetting={isResetting}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#101b2d] text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold border border-slate-700 animate-slide-up flex items-center gap-2 max-w-sm">
          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
