import React, { useState, useEffect } from 'react';
import AdminPanel from './components/AdminPanel';
import ParticipantView from './components/ParticipantView';
import WelcomeScreen from './components/WelcomeScreen'; // Import the new WelcomeScreen
import { AppState, ViewMode } from './types';
import { DEFAULT_DESIGN, DEFAULT_CONTENT } from './constants';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WELCOME); // Set initial view to WelcomeScreen
  
  // Initial State for Admin
  const [state, setState] = useState<AppState>({
    design: DEFAULT_DESIGN,
    content: DEFAULT_CONTENT,
    images: [],
    participants: [],
    projectSavedTime: null,
  });

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="font-inter text-slate-900">
      {viewMode === ViewMode.WELCOME ? (
        <WelcomeScreen onViewChange={handleViewChange} />
      ) : viewMode === ViewMode.ADMIN_DESIGN || viewMode === ViewMode.ADMIN_DATA ? (
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