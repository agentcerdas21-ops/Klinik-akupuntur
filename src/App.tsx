import React, { useState } from 'react';
import { DbProvider, useClinic } from './context/DbContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { MobileNav } from './components/common/MobileNav';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickActionModal } from './components/dashboard/QuickActionModal';

// Views
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Modals
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isTherapyModalOpen, setIsTherapyModalOpen] = useState(false);

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

  const handleStartTherapyForPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setIsTherapyModalOpen(true);
  };

  const handleStartSaleForPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('sales');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100/75 text-slate-800 antialiased font-sans">
      {/* Desktop Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleNavigate} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          activeTab={activeTab}
        />

        {/* Scrollable Workspace Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* VIEW ROUTING */}
            {activeTab === 'dashboard' && (
              <ExecutiveDashboard
                onNavigate={handleNavigate}
                onSelectPatient={handleSelectPatient}
                onOpenPatientModal={() => setIsPatientModalOpen(true)}
                onOpenTherapyModal={() => setIsTherapyModalOpen(true)}
                onOpenSaleModal={() => handleNavigate('sales')}
                onOpenExpenseModal={() => handleNavigate('finance')}
              />
            )}

            {activeTab === 'patients' && (
              <>
                {selectedPatientId ? (
                  <PatientDetailView
                    patientId={selectedPatientId}
                    onBack={() => setSelectedPatientId(null)}
                    onStartTherapy={() => setIsTherapyModalOpen(true)}
                    onStartSale={() => {
                      setActiveTab('sales');
                    }}
                  />
                ) : (
                  <PatientList
                    onSelectPatient={handleSelectPatient}
                    onOpenAddModal={() => setIsPatientModalOpen(true)}
                  />
                )}
              </>
            )}

            {activeTab === 'therapy' && (
              <TherapySessionList
                onOpenAddModal={() => setIsTherapyModalOpen(true)}
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

            {activeTab === 'finance' && <FinanceView />}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav activeTab={activeTab} setActiveTab={handleNavigate} />

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
        onOpenPatientModal={() => setIsPatientModalOpen(true)}
        onOpenTherapyModal={() => setIsTherapyModalOpen(true)}
        onOpenSaleModal={() => handleNavigate('sales')}
        onOpenExpenseModal={() => handleNavigate('finance')}
      />

      {/* Patient Add Modal */}
      <PatientFormModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={(patient) => {
          setSelectedPatientId(patient.id);
          setActiveTab('patients');
        }}
      />

      {/* Therapy Add Modal */}
      <TherapyFormModal
        isOpen={isTherapyModalOpen}
        onClose={() => setIsTherapyModalOpen(false)}
        initialPatientId={selectedPatientId || undefined}
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
