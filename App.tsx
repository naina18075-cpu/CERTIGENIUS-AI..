import React, { useState, useEffect } from 'react';
import AdminPanel from './components/AdminPanel';
import ParticipantView from './components/ParticipantView';
import { AppState, ViewMode } from './types';
import { DEFAULT_DESIGN, DEFAULT_CONTENT } from './constants';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.ADMIN_DESIGN);
  
  // Initial State for Admin
  const [state, setState] = useState<AppState>({
    design: DEFAULT_DESIGN,
    content: DEFAULT_CONTENT,
    images: [],
    participants: [],
    projectSavedTime: null,
  });

  // Check URL hash on load to simulate QR scan landing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#claim')) {
        setViewMode(ViewMode.PARTICIPANT_LOGIN);
      } else if (hash.startsWith('#portable')) {
        setViewMode(ViewMode.PARTICIPANT_VIEW);
      } else {
        setViewMode(ViewMode.ADMIN_DESIGN);
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Check initial hash
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === ViewMode.PARTICIPANT_LOGIN) {
      window.location.hash = 'claim';
    } else if (mode === ViewMode.ADMIN_DESIGN) {
      window.location.hash = '';
    }
  };

  return (
    <div className="font-inter text-slate-900">
      {viewMode === ViewMode.ADMIN_DESIGN || viewMode === ViewMode.ADMIN_DATA ? (
        <AdminPanel 
          state={state} 
          setState={setState} 
          onViewChange={handleViewChange}
        />
      ) : (
        <ParticipantView 
          onBack={() => handleViewChange(ViewMode.ADMIN_DESIGN)} 
        />
      )}
    </div>
  );
};

export default App;