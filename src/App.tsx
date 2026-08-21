import React, { useState } from 'react';
import { DbProvider, useClinic } from './context/DbContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { MobileNav } from './components/common/MobileNav';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickActionModal } from './components/dashboard/QuickActionModal';
import { Patient, TherapySession } from './types';

// Views
import { LoginView } from './components/auth/LoginView';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { PatientList } from './components/patients/PatientList';
import { PatientDetailView } from './components/patients/PatientDetailView';
import { PatientFormModal } from './components/patients/PatientFormModal';
import { TherapySessionList } from './components/therapy/TherapySessionList';
import { TherapyFormModal } from './components/therapy/TherapyFormModal';
import { ServicesView } from './components/services/ServicesView';
import { HerbalProductsView } from './components/herbal/HerbalProductsView';
import { SalesPOSView } from './components/sales/SalesPOSView';
import { PaymentsView } from './components/payments/PaymentsView';
import { InvoicesView } from './components/sales/InvoicesView';
import { FinanceView } from './components/finance/FinanceView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

const ClinicApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Modals & Edit Targets
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isTherapyModalOpen, setIsTherapyModalOpen] = useState(false);
  const [therapyToEdit, setTherapyToEdit] = useState<TherapySession | null>(null);

  // Finance tab & modal trigger
  const [financeInitialTab, setFinanceInitialTab] = useState<'expenses' | 'income'>('expenses');
  const [financeAutoOpenModal, setFinanceAutoOpenModal] = useState<'expense' | 'income' | null>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K for global search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    // If navigating to main tabs, reset drill-down state if needed
    if (tab !== 'patients') {
      setSelectedPatientId(null);
    }
    if (tab !== 'invoices') {
      setSelectedInvoiceId(null);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('patients');
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setActiveTab('invoices');
  };

  const handleOpenAddPatient = () => {
    setPatientToEdit(null);
    setIsPatientModalOpen(true);
  };

  const handleOpenEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setIsPatientModalOpen(true);
  };

  const handleOpenAddTherapy = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    setTherapyToEdit(null);
    setIsTherapyModalOpen(true);
  };

  const handleOpenEditTherapy = (session: TherapySession) => {
    setTherapyToEdit(session);
    setIsTherapyModalOpen(true);
  };

  const handleOpenNewSale = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    }
    setActiveTab('sales');
  };

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/75 text-slate-800 antialiased font-sans">
      {/* Desktop Sidebar Navigation & Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        setActiveTab={handleNavigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          onOpenSearch={() => setIsGlobalSearchOpen(true)}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateTab={handleNavigate}
          onSelectPatient={handleSelectPatient}
          onSelectInvoice={handleSelectInvoice}
          activeTab={activeTab}
        />

        {/* Scrollable Workspace Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* VIEW ROUTING */}
            {activeTab === 'dashboard' && (
              <ExecutiveDashboard
                onNavigateTab={handleNavigate}
                onSelectPatient={handleSelectPatient}
                onSelectInvoice={handleSelectInvoice}
                onOpenPatientModal={handleOpenAddPatient}
                onOpenTherapyModal={() => handleOpenAddTherapy()}
                onOpenSaleModal={() => handleNavigate('sales')}
                onOpenInvoices={() => handleNavigate('invoices')}
                onOpenExpenseModal={() => {
                  setFinanceInitialTab('expenses');
                  setFinanceAutoOpenModal('expense');
                  handleNavigate('finance');
                }}
                onOpenQuickAction={(actionType) => {
                  if (actionType === 'new_patient') handleOpenAddPatient();
                  else if (actionType === 'new_therapy') handleOpenAddTherapy();
                  else if (actionType === 'new_sale') handleNavigate('sales');
                  else if (actionType === 'cashier_invoice') handleNavigate('invoices');
                  else if (actionType === 'herbal_products') handleNavigate('herbal');
                  else if (actionType === 'new_expense') {
                    setFinanceInitialTab('expenses');
                    setFinanceAutoOpenModal('expense');
                    handleNavigate('finance');
                  } else if (actionType === 'new_income') {
                    setFinanceInitialTab('income');
                    setFinanceAutoOpenModal('income');
                    handleNavigate('finance');
                  } else {
                    setIsQuickActionOpen(true);
                  }
                }}
              />
            )}

            {activeTab === 'patients' && (
              <>
                {selectedPatientId ? (
                  <PatientDetailView
                    patientId={selectedPatientId}
                    onBack={() => setSelectedPatientId(null)}
                    onEditPatient={handleOpenEditPatient}
                    onOpenAddTherapy={handleOpenAddTherapy}
                    onEditTherapy={handleOpenEditTherapy}
                    onOpenNewSale={handleOpenNewSale}
                    onSelectInvoice={handleSelectInvoice}
                  />
                ) : (
                  <PatientList
                    onSelectPatient={handleSelectPatient}
                    onOpenAddModal={handleOpenAddPatient}
                    onOpenEditModal={handleOpenEditPatient}
                  />
                )}
              </>
            )}

            {activeTab === 'therapy' && (
              <TherapySessionList
                onOpenAddModal={handleOpenAddTherapy}
                onOpenEditModal={handleOpenEditTherapy}
                onSelectPatient={handleSelectPatient}
              />
            )}

            {activeTab === 'services' && <ServicesView />}

            {activeTab === 'herbal' && <HerbalProductsView />}

            {activeTab === 'sales' && (
              <SalesPOSView
                initialPatientId={selectedPatientId || undefined}
                onSaleComplete={(invId) => {
                  setSelectedInvoiceId(invId);
                  setActiveTab('invoices');
                }}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsView
                onSelectInvoice={handleSelectInvoice}
                onOpenNewPaymentModal={() => setActiveTab('sales')}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesView
                selectedInvoiceId={selectedInvoiceId}
                onClearSelectedInvoice={() => setSelectedInvoiceId(null)}
                onOpenNewSale={() => setActiveTab('sales')}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceView
                initialTab={financeInitialTab}
                autoOpenModal={financeAutoOpenModal}
                onClearAutoOpenModal={() => setFinanceAutoOpenModal(null)}
              />
            )}

            {activeTab === 'reports' && <ReportsView />}

            {(activeTab === 'settings' || activeTab === 'profile' || activeTab === 'backup') && (
              <SettingsView />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        setActiveTab={handleNavigate}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onToggleMoreMenu={() => setIsMobileSidebarOpen(true)}
      />

      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsApp />

      {/* Global Command+K Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectPatient={handleSelectPatient}
        onSelectInvoice={handleSelectInvoice}
      />

      {/* Global Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenPatientModal={handleOpenAddPatient}
        onOpenTherapyModal={() => handleOpenAddTherapy()}
        onOpenInvoices={() => handleNavigate('invoices')}
        onOpenSaleModal={() => handleNavigate('sales')}
        onOpenHerbalModal={() => handleNavigate('herbal')}
        onOpenIncomeModal={() => {
          setFinanceInitialTab('income');
          setFinanceAutoOpenModal('income');
          handleNavigate('finance');
        }}
        onOpenExpenseModal={() => {
          setFinanceInitialTab('expenses');
          setFinanceAutoOpenModal('expense');
          handleNavigate('finance');
        }}
      />

      {/* Patient Add / Edit Modal */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        patientToEdit={patientToEdit}
        onClose={() => {
          setIsPatientModalOpen(false);
          setPatientToEdit(null);
        }}
        onSuccess={(patient) => {
          setSelectedPatientId(patient.id);
          setActiveTab('patients');
        }}
      />

      {/* Therapy Add / Edit Modal */}
      <TherapyFormModal
        isOpen={isTherapyModalOpen}
        sessionToEdit={therapyToEdit}
        initialPatientId={selectedPatientId || undefined}
        onClose={() => {
          setIsTherapyModalOpen(false);
          setTherapyToEdit(null);
        }}
        onSuccess={() => {
          setActiveTab('therapy');
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DbProvider>
        <ClinicApp />
      </DbProvider>
    </AuthProvider>
  );
}

export default App;
