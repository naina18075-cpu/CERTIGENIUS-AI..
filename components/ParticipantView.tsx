import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AppState, Participant, DesignConfig, CertificateContent, ImageElement } from '../types';
import { DEFAULT_DESIGN, DEFAULT_CONTENT } from '../constants';
import CertificateCanvas from './CertificateCanvas';
import { Download, Search, CheckCircle, ArrowLeft, QrCode, AlertTriangle } from 'lucide-react';

interface ParticipantViewProps {
  onBack: () => void;
}

const ParticipantView: React.FC<ParticipantViewProps> = ({ onBack }) => {
  const [searchId, setSearchId] = useState('');
  const [foundParticipant, setFoundParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  // State for Portable Mode
  const [isPortableMode, setIsPortableMode] = useState(false);
  const [portableState, setPortableState] = useState<{
    design: DesignConfig;
    content: CertificateContent;
    images: ImageElement[];
  } | null>(null);

  // Load Admin state from localStorage (Simulation DB)
  const loadLocalState = (): AppState | null => {
    const saved = localStorage.getItem('certigenius_demo_db');
    if (saved) return JSON.parse(saved);
    return null;
  };

  const adminState = loadLocalState();

  useEffect(() => {
    // Check if we are in "Portable Mode" (Data in URL)
    if (window.location.hash.startsWith('#portable')) {
      setIsPortableMode(true);
      try {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const dataStr = params.get('data');
        if (dataStr) {
          const decoded = JSON.parse(atob(dataStr));
          setPortableState({
            design: decoded.design || DEFAULT_DESIGN,
            content: decoded.content || DEFAULT_CONTENT,
            images: [], // Images are too heavy for QR codes usually, so we omit them in portable mode
          });
          setFoundParticipant({
            id: decoded.pId || '000',
            name: decoded.pName || 'Participant',
            ...decoded.pExtras
          });
        }
      } catch (e) {
        console.error("Failed to parse portable data", e);
        setError("Invalid link format.");
      }
    }
  }, []);

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
      setFoundParticipant(null);
      setError('No certificate found for this ID or Name.');
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current || !foundParticipant) return;
    setIsDownloading(true);

    try {
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

  // --- 1. Admin Setup Missing (Only relevant for Local Mode) ---
  if (!isPortableMode && !adminState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Issue</h2>
          <p className="text-gray-600 mb-6 text-sm">
            You are trying to access the <strong>Master Database</strong> mode, but this device cannot connect to the Admin's local storage.
          </p>
          <div className="bg-blue-50 p-4 rounded text-left mb-6 text-sm">
             <p className="font-bold text-blue-800 mb-2">Try "Portable Mode" instead:</p>
             <ul className="list-disc pl-5 text-blue-700 space-y-1">
               <li>Ask the Admin to generate an <strong>Individual QR Code</strong> for you.</li>
               <li>That QR code contains the certificate data directly inside the link.</li>
               <li>It works on any network!</li>
             </ul>
          </div>
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-xs">
            Admin Login
          </button>
        </div>
      </div>
    );
  }

  // --- 2. Landing Page (For Master DB Mode) ---
  if (!foundParticipant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 p-4">
        <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{adminState?.content.title || 'Certificate Portal'}</h1>
            <p className="text-slate-500">Self-Service Claim Portal</p>
        </div>

        <div className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-6 text-white text-center">
            <Search className="mx-auto h-8 w-8 mb-2 opacity-80" />
            <h2 className="text-xl font-semibold">Find Your Certificate</h2>
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
      </div>
    );
  }

  // Determine which config to use (Portable vs Admin Local)
  const activeDesign = isPortableMode && portableState ? portableState.design : adminState!.design;
  const activeContent = isPortableMode && portableState ? portableState.content : adminState!.content;
  // Portable mode currently doesn't support heavy images in QR, so we fallback to empty if portable
  const activeImages = isPortableMode && portableState ? portableState.images : adminState!.images;

  // --- 3. Certificate Preview & Download Screen ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white shadow-sm z-20 px-4 py-3 flex justify-between items-center print-hide">
        <button 
          onClick={() => {
            if (isPortableMode) {
                // If portable, clearing participant just refreshes or goes back to nothing, so we go home
                window.location.hash = '';
                window.location.reload();
            } else {
                setFoundParticipant(null);
            }
          }}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2" size={20} />
          {isPortableMode ? 'Exit' : 'Back'}
        </button>
        <div className="flex items-center text-green-600 font-medium">
          <CheckCircle className="mr-2" size={20} />
          {isPortableMode ? 'Portable Certificate Loaded' : 'Certificate Ready'}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center">
        
        <div className="w-full max-w-4xl flex justify-between items-center mb-6 print-hide">
           {isPortableMode && (
             <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
               Portable Mode (Images hidden to fit in QR)
             </span>
           )}
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