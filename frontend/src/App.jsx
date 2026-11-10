import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';

// Feature Views
import { DashboardOverview } from './components/DashboardOverview';
import { DocumentHub } from './components/DocumentHub';
import { HandoverAnalysis } from './components/HandoverAnalysis';
import { KnowledgeGapDetector } from './components/KnowledgeGapDetector';
import { AiKnowledgeAssistant } from './components/AiKnowledgeAssistant';
import { HandoverReports } from './components/HandoverReports';
import { AuditHistory } from './components/AuditHistory';

function MainApp() {
  const { user, isAuthenticated } = useAuth();

  // Navigation State
  const [view, setView] = useState('app'); // 'landing' | 'app'
  const [currentTab, setCurrentTab] = useState('overview'); // 'overview' | 'documents' | 'analysis' | 'gaps' | 'assistant' | 'reports' | 'audit'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals & Popups
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Data State
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [activeDocument, setActiveDocument] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [docsData, statsData, statusData] = await Promise.allSettled([
        api.documents.list(),
        api.analysis.getStats(),
        api.system.getStatus(),
      ]);

      if (docsData.status === 'fulfilled') {
        setDocuments(docsData.value);
        if (!activeDocument && docsData.value.length > 0) {
          setActiveDocument(docsData.value[0]);
        }
      }
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value);
      }
      if (statusData.status === 'fulfilled') {
        setSystemStatus(statusData.value);
      }
    } catch (e) {
      console.warn('Initial data load error:', e);
    }
  };

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4500);
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  // If on landing view, render the landing page
  if (view === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={() => setView('app')}
          onOpenAuth={handleOpenAuth}
        />
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setView('app');
            loadAllData();
            showToast('success', 'Welcome', 'Session started successfully.');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenSettings={() => setShowSettingsModal(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onUploadClick={() => setCurrentTab('documents')}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAuth={() => handleOpenAuth('login')}
        systemStatus={systemStatus}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Viewport */}
      <main
        className={`flex-1 transition-all duration-300 pt-20 pb-12 px-6 sm:px-8 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {currentTab === 'overview' && (
            <DashboardOverview
              stats={stats}
              documents={documents}
              onSelectTab={(tab) => setCurrentTab(tab)}
              onSelectDocument={(doc) => setActiveDocument(doc)}
              onUploadClick={() => setCurrentTab('documents')}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentHub
              documents={documents}
              onRefreshDocuments={loadAllData}
              onSelectDocumentForAnalysis={(doc) => {
                setActiveDocument(doc);
                setCurrentTab('analysis');
              }}
              showToast={showToast}
            />
          )}

          {currentTab === 'analysis' && (
            <HandoverAnalysis
              documents={documents}
              activeDocument={activeDocument}
              onSelectDocument={(doc) => setActiveDocument(doc)}
              showToast={showToast}
            />
          )}

          {currentTab === 'gaps' && (
            <KnowledgeGapDetector showToast={showToast} />
          )}

          {currentTab === 'assistant' && (
            <AiKnowledgeAssistant documents={documents} showToast={showToast} />
          )}

          {currentTab === 'reports' && (
            <HandoverReports documents={documents} showToast={showToast} />
          )}

          {currentTab === 'audit' && (
            <AuditHistory showToast={showToast} />
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onRefreshData={loadAllData}
        showToast={showToast}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          loadAllData();
          showToast('success', 'Logged In', 'Account session updated.');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
