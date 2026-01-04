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
    // serverConfig is removed from AppState as it's no longer needed
    projectSavedTime: null,
  });

  // Removed useEffect for hash change as public access modes are deprecated.
  // The app will now primarily operate in admin mode.
  // ParticipantView will only be accessed via direct action from AdminPanel.

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Removed hash manipulations as public access modes are deprecated.
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
        // ParticipantView is now a 'preview' for the admin, potentially showing unsaved local data.
        // The onBack prop now simply returns to ADMIN_DESIGN mode.
        <ParticipantView 
          onBack={() => handleViewChange(ViewMode.ADMIN_DESIGN)} 
        />
      )}
    </div>
  );
};

export default App;