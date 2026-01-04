import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AppState, Participant, DesignConfig, CertificateContent, ImageElement } from '../types';
import { DEFAULT_DESIGN, DEFAULT_CONTENT } from '../constants';
import CertificateCanvas from './CertificateCanvas';
import { Download, Search, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

interface ParticipantViewProps {
  onBack: () => void; // This prop is used to return to the Admin Panel.
  initialParticipant?: Participant | null; // Optional prop to directly load a participant
}

const ParticipantView: React.FC<ParticipantViewProps> = ({ onBack, initialParticipant = null }) => {
  const [searchId, setSearchId] = useState('');
  const [foundParticipant, setFoundParticipant] = useState<Participant | null>(initialParticipant);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  // Removed isPortableMode and portableState

  // Load Admin state from localStorage (Simulation DB)
  const loadLocalState = (): AppState | null => {
    const saved = localStorage.getItem('certigenius_demo_db');
    if (saved) return JSON.parse(saved);
    return null;
  };

  const adminState = loadLocalState();

  useEffect(() => {
    // If an initial participant is provided (e.g., from AdminPanel preview), set it directly.
    if (initialParticipant) {
      setFoundParticipant(initialParticipant);
    } else {
      // If no initial participant, ensure the search form is shown if adminState exists.
      // Or show an error if no adminState is configured.
      setFoundParticipant(null);
    }
  }, [initialParticipant]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminState) {
      setError("System Error: No event configuration found on this device.");
      return;
    }

    const participant = adminState.participants.find(
      p => p.id.toLowerCase() === searchId.toLowerCase() || 
           p.name.toLowerCase() === searchId.toLowerCase()
    );

    if (participant) {
      setFoundParticipant(participant);
      setError('');
    } else {
      setFoundParticipant(null); // Ensure no participant is set if not found
      setError('No certificate found for this ID or Name.');
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current || !foundParticipant) return;
    setIsDownloading(true);

    try {
      // Ensure the canvas is rendered before capturing
      // A small delay might be needed for fonts/images to fully load and render in html2canvas context
      await new Promise(resolve => setTimeout(resolve, 100)); 

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Certificate_${foundParticipant.name.replace(/\s+/g, '_')}.pdf`);

    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // --- 1. Admin Setup Missing ---
  // This state is now reached if the Admin tries to access ParticipantView without any saved data.
  if (!adminState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Configuration Found</h2>
          <p className="text-gray-600 mb-6 text-sm">
            The administrative data (certificate design, content, and participants) is not loaded on this device.
            Please set up your certificates in the Admin Panel first.
          </p>
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-xs flex items-center justify-center">
            <ArrowLeft size={14} className="mr-1" /> Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  // Determine which config to use (always adminState now)
  const activeDesign = adminState.design || DEFAULT_DESIGN;
  const activeContent = adminState.content || DEFAULT_CONTENT;
  const activeImages = adminState.images || [];

  // --- 2. Local Search Page (for Admin preview if initialParticipant is null) ---
  if (!foundParticipant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 p-4">
        <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{activeContent.title || 'Certificate Preview'}</h1>
            <p className="text-slate-500">Search for a Participant</p>
        </div>

        <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white text-center">
            <Search className="mx-auto h-8 w-8 mb-2 opacity-80" />
            <h2 className="text-xl font-semibold">Find Participant's Certificate</h2>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Enter Name or ID"
                  className="w-full border-2 border-gray-200 rounded-lg p-3 text-lg focus:border-indigo-500 focus:outline-none transition"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        <button 
          onClick={onBack} 
          className="mt-8 text-gray-400 hover:text-gray-600 text-xs flex items-center"
        >
          <ArrowLeft size={14} className="mr-1" /> Go to Admin Panel
        </button>
      </div>
    );
  }

  // --- 3. Certificate Preview & Download Screen ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-sm z-20 px-4 py-3 flex justify-between items-center print-hide">
        <button 
          onClick={() => setFoundParticipant(null)} // Go back to search form if an admin, otherwise if it's initial it goes to nothing.
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Search
        </button>
        <div className="flex items-center text-green-600 font-medium">
          <CheckCircle className="mr-2" size={20} />
          Certificate Ready
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center">
        
        <div className="w-full max-w-4xl flex justify-end items-center mb-6 print-hide">
           <button 
             onClick={handleDownload}
             disabled={isDownloading}
             className="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition flex items-center font-bold ml-auto"
           >
             {isDownloading ? (
               <span className="animate-pulse">Generating PDF...</span>
             ) : (
               <>
                 <Download className="mr-2" />
                 Download PDF
               </>
             )}
           </button>
        </div>

        {/* Certificate Canvas */}
        <div className="overflow-auto max-w-full shadow-2xl border-8 border-white rounded-lg">
           <CertificateCanvas 
             ref={certificateRef}
             design={activeDesign}
             content={activeContent}
             images={activeImages}
             onMoveImage={() => {}} 
             participant={foundParticipant}
             readOnly={true}
           />
        </div>
        
        <p className="mt-8 text-gray-400 text-sm print-hide">
          Generated by CertiGenius AI
        </p>
      </div>
    </div>
  );
};

export default ParticipantView;