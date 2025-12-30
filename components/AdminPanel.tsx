import React, { useState, useRef, useEffect } from 'react';
import { AppState, ViewMode, ImageElement, Participant } from '../types';
import { FONTS, THEMES } from '../constants';
import CertificateCanvas from './CertificateCanvas';
import { generateCertificateText } from '../services/geminiService';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { 
  Upload, 
  Move, 
  Type, 
  Palette, 
  Settings, 
  QrCode, 
  Wand2, 
  Trash2,
  Users,
  PenTool,
  Share2,
  Download,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Eye,
  FileArchive,
  X,
  Plus,
  UserPlus
} from 'lucide-react';

interface AdminPanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  onViewChange: (mode: ViewMode) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, onViewChange }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'graphics' | 'data'>('content');
  const [geminiApiKey, setGeminiApiKey] = useState(process.env.API_KEY || '');
  const [aiTopic, setAiTopic] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // QR & Link State
  const [qrBlobUrl, setQrBlobUrl] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState('');
  
  // Bulk Export State
  const [isBulkExporting, setIsBulkExporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [exportingParticipant, setExportingParticipant] = useState<Participant | null>(null);

  // Individual QR Modal
  const [selectedForQr, setSelectedForQr] = useState<Participant | null>(null);
  const [individualQrUrl, setIndividualQrUrl] = useState<string | null>(null);

  // Manual Participant Entry State
  const [newParticipant, setNewParticipant] = useState({ name: '', id: '', rank: '', role: '' });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize publicUrl on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicUrl(window.location.href.split('#')[0]);
    }
  }, []);

  // --- QR Logic ---

  // Master Claim URL
  const claimUrl = publicUrl ? `${publicUrl}#claim` : '';

  useEffect(() => {
    if (claimUrl) {
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(claimUrl)}`;
      fetch(apiUrl)
        .then(res => res.blob())
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          setQrBlobUrl(objectUrl);
        })
        .catch(err => console.error("Error fetching QR code", err));
    }
    return () => { if (qrBlobUrl) URL.revokeObjectURL(qrBlobUrl); };
  }, [claimUrl]);

  // Individual "Portable" QR Logic
  useEffect(() => {
    if (selectedForQr && publicUrl) {
      // Create a payload with just essential text data (no images)
      const payload = {
        pId: selectedForQr.id,
        pName: selectedForQr.name,
        pExtras: selectedForQr, // other csv fields including rank/role
        design: state.design,
        content: state.content
        // images omitted to keep URL length scannable
      };
      
      const b64Data = btoa(JSON.stringify(payload));
      const portableUrl = `${publicUrl}#portable?data=${b64Data}`;
      
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(portableUrl)}`;
      fetch(apiUrl)
        .then(res => res.blob())
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          setIndividualQrUrl(objectUrl);
        })
        .catch(err => console.error("Error fetching individual QR", err));
    } else {
      setIndividualQrUrl(null);
    }
  }, [selectedForQr, publicUrl, state.design, state.content]);


  // --- Handlers ---

  const handleContentChange = (key: string, value: string) => {
    setState(prev => ({
      ...prev,
      content: { ...prev.content, [key]: value }
    }));
  };

  const handleDesignChange = (key: string, value: any) => {
    setState(prev => ({
      ...prev,
      design: { ...prev.design, [key]: value }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: ImageElement = {
          id: Date.now().toString() + Math.random().toString(), // Ensure unique ID
          src: event.target?.result as string,
          x: type === 'logo' ? 50 : 650, // Default positions
          y: type === 'logo' ? 50 : 550,
          width: 150,
          height: 100,
          type
        };
        setState(prev => ({ ...prev, images: [...prev.images, newImage] }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setState(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
  };

  const handleMoveImage = (id: string, x: number, y: number) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img => img.id === id ? { ...img, x, y } : img)
    }));
  };

  const handleAiGenerate = async () => {
    if (!aiTopic) return alert("Please enter a topic.");
    setIsAiLoading(true);
    try {
      const key = geminiApiKey || process.env.API_KEY; 
      if (!key) {
        alert("API Key not found in env. Please ensure API_KEY is set.");
        setIsAiLoading(false);
        return;
      }
      const text = await generateCertificateText(aiTopic, 'Formal and celebratory', key);
      handleContentChange('bodyTemplate', text);
    } catch (err) {
      alert("AI Generation failed. Check console.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const normalizedData = results.data.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(k => {
              newRow[k.toLowerCase()] = row[k];
            });
            if (!newRow.id) newRow.id = Math.random().toString(36).substr(2, 9);
            if (!newRow.name) newRow.name = "Unknown Participant";
            return newRow;
          });
          
          setState(prev => ({ ...prev, participants: [...prev.participants, ...normalizedData as any] }));
          alert(`Added ${normalizedData.length} participants.`);
        }
      });
    }
  };

  const handleAddParticipant = () => {
    if (!newParticipant.name) return alert("Name is required");
    
    const participant: Participant = {
      id: newParticipant.id || Math.random().toString(36).substr(2, 9),
      name: newParticipant.name,
      rank: newParticipant.rank,
      role: newParticipant.role
    };

    setState(prev => ({
      ...prev,
      participants: [participant, ...prev.participants]
    }));

    setNewParticipant({ name: '', id: '', rank: '', role: '' });
  };

  const handleDeleteParticipant = (id: string) => {
    setState(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.id !== id)
    }));
  };

  // --- Export Functions ---

  const generateSinglePdfBlob = async (participant: Participant): Promise<{blob: Blob, name: string} | null> => {
    if (!canvasRef.current) return null;
    
    // Set participant to render
    setExportingParticipant(participant);
    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 50));

    const canvas = await html2canvas(canvasRef.current, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: null
    });

    return new Promise(resolve => {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [1000, 707],
          hotfixes: ['px_scaling']
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        pdf.addImage(imgData, 'JPEG', 0, 0, 1000, 707);
        const blob = pdf.output('blob');
        const name = `Certificate_${participant.name.replace(/\s+/g,'_')}.pdf`;
        resolve({ blob, name });
    });
  };

  const handleIndividualDownload = async (p: Participant) => {
    setIsBulkExporting(true);
    try {
        const result = await generateSinglePdfBlob(p);
        if (result) {
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.name;
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (e) {
        console.error(e);
        alert("Download failed.");
    } finally {
        setIsBulkExporting(false);
        setExportingParticipant(null);
    }
  };

  const handleBulkDownloadPdf = async () => {
    if (state.participants.length === 0) return;
    if (!canvasRef.current) return;

    setIsBulkExporting(true);
    setBulkProgress({ current: 0, total: state.participants.length });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1000, 707],
      hotfixes: ['px_scaling']
    });

    try {
      for (let i = 0; i < state.participants.length; i++) {
        const p = state.participants[i];
        setExportingParticipant(p);
        setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        await new Promise(resolve => setTimeout(resolve, 50));

        if (canvasRef.current) {
          const canvas = await html2canvas(canvasRef.current, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: null
          });
          const imgData = canvas.toDataURL('image/jpeg', 0.85);
          if (i > 0) pdf.addPage([1000, 707], 'landscape');
          pdf.addImage(imgData, 'JPEG', 0, 0, 1000, 707);
        }
      }
      pdf.save(`All_Certificates_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed.");
    } finally {
      setIsBulkExporting(false);
      setExportingParticipant(null);
    }
  };

  const handleBulkDownloadZip = async () => {
     if (state.participants.length === 0) return;
     setIsBulkExporting(true);
     setBulkProgress({ current: 0, total: state.participants.length });
     
     const zip = new JSZip();
     const folder = zip.folder("Certificates");

     try {
       for (let i = 0; i < state.participants.length; i++) {
         const p = state.participants[i];
         // Update progress UI
         setBulkProgress(prev => ({ ...prev, current: i + 1 }));
         
         const result = await generateSinglePdfBlob(p);
         if (result && folder) {
            folder.file(result.name, result.blob);
         }
       }
       
       const content = await zip.generateAsync({ type: "blob" });
       const url = URL.createObjectURL(content);
       const a = document.createElement('a');
       a.href = url;
       a.download = "Certificates_Archive.zip";
       a.click();
       URL.revokeObjectURL(url);
     } catch (err) {
       console.error(err);
       alert("ZIP generation failed.");
     } finally {
        setIsBulkExporting(false);
        setExportingParticipant(null);
     }
  };

  // --- Render Helpers ---

  const renderContentTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Certificate Title</label>
        <input 
          type="text" 
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
          value={state.content.title}
          onChange={(e) => handleContentChange('title', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subtitle</label>
        <input 
          type="text" 
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          value={state.content.subtitle}
          onChange={(e) => handleContentChange('subtitle', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Recipient Name (Placeholder)</label>
        <input 
          disabled 
          type="text" 
          value="{{name}}" 
          className="mt-1 block w-full bg-gray-100 text-gray-500 rounded-md border p-2 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">This will be replaced by CSV data.</p>
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Body Text</label>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Topic (e.g. Science Fair)"
              className="text-xs border rounded p-1 w-32"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
            <button 
              onClick={handleAiGenerate}
              disabled={isAiLoading}
              className="text-xs bg-purple-600 text-white px-2 py-1 rounded flex items-center hover:bg-purple-700 disabled:opacity-50"
            >
              <Wand2 size={12} className="mr-1" />
              {isAiLoading ? 'Thinking...' : 'AI Draft'}
            </button>
          </div>
        </div>
        <textarea 
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          value={state.content.bodyTemplate}
          onChange={(e) => handleContentChange('bodyTemplate', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Available placeholders: <code>{`{{name}}`}</code>, <code>{`{{id}}`}</code>, <code>{`{{rank}}`}</code>, <code>{`{{role}}`}</code>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
           <label className="block text-sm font-medium text-gray-700">Signer Name</label>
           <input 
            type="text" 
            className="mt-1 block w-full rounded-md border p-2"
            value={state.content.signerName}
            onChange={(e) => handleContentChange('signerName', e.target.value)}
          />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700">Signer Title</label>
           <input 
            type="text" 
            className="mt-1 block w-full rounded-md border p-2"
            value={state.content.signerTitle}
            onChange={(e) => handleContentChange('signerTitle', e.target.value)}
          />
        </div>
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input 
          type="text" 
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
          value={state.content.date}
          onChange={(e) => handleContentChange('date', e.target.value)}
        />
      </div>
    </div>
  );

  const renderDesignTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => handleDesignChange('theme', t.id)}
              className={`p-2 text-xs border rounded text-left ${state.design.theme === t.id ? 'border-blue-50 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'}`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Typography</label>
        <select 
          className="w-full border p-2 rounded"
          value={state.design.fontFamily}
          onChange={(e) => handleDesignChange('fontFamily', e.target.value)}
        >
          {FONTS.map(f => (
            <option key={f.value} value={f.value}>{f.name}</option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="flex items-center space-x-2">
           <input 
            type="checkbox" 
            checked={state.design.isMetallicTitle}
            onChange={(e) => handleDesignChange('isMetallicTitle', e.target.checked)}
            className="rounded text-blue-600"
          />
          <span className="text-sm">Metallic Gold Title Effect</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
           <label className="block text-sm font-medium text-gray-700">Title Color</label>
           <input 
            type="color" 
            className="w-full h-8 mt-1" 
            value={state.design.titleColor}
            onChange={(e) => handleDesignChange('titleColor', e.target.value)}
            disabled={state.design.isMetallicTitle}
          />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700">Accent Color</label>
           <input 
            type="color" 
            className="w-full h-8 mt-1" 
            value={state.design.accentColor}
            onChange={(e) => handleDesignChange('accentColor', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderGraphicsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors flex flex-col items-center">
          <Upload className="mx-auto h-6 w-6 text-blue-500 mb-2" />
          <p className="text-sm font-medium text-gray-900 mb-1">Add Logo</p>
          <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} />
          <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700" onClick={() => logoInputRef.current?.click()}>Upload</button>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors flex flex-col items-center">
          <PenTool className="mx-auto h-6 w-6 text-purple-500 mb-2" />
          <p className="text-sm font-medium text-gray-900 mb-1">Add Signature</p>
          <input type="file" accept="image/*" className="hidden" ref={signatureInputRef} onChange={(e) => handleImageUpload(e, 'signature')} />
          <button className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700" onClick={() => signatureInputRef.current?.click()}>Upload</button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Active Elements</h4>
        {state.images.length === 0 && <p className="text-xs text-gray-400 italic">No graphics added yet.</p>}
        {state.images.map((img, index) => (
          <div key={img.id} className="flex items-center justify-between p-2 bg-white border rounded shadow-sm">
            <div className="flex items-center space-x-2">
              <img src={img.src} alt="thumb" className="w-8 h-8 object-contain bg-gray-100 rounded" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold capitalize">{img.type}</span>
                <span className="text-[10px] text-gray-500">#{index + 1}</span>
              </div>
            </div>
            <button onClick={() => removeImage(img.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDataTab = () => {
    return (
      <div className="space-y-6">
        {/* Manual Add Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h4 className="flex items-center font-bold text-gray-800 mb-3"><UserPlus size={18} className="mr-2 text-indigo-600" />Add Single Participant</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
             <input 
               type="text" 
               placeholder="Name *" 
               className="border p-2 rounded text-sm"
               value={newParticipant.name}
               onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
             />
             <input 
               type="text" 
               placeholder="ID (Optional)" 
               className="border p-2 rounded text-sm"
               value={newParticipant.id}
               onChange={(e) => setNewParticipant({...newParticipant, id: e.target.value})}
             />
             <input 
               type="text" 
               placeholder="Rank (Optional)" 
               className="border p-2 rounded text-sm"
               value={newParticipant.rank}
               onChange={(e) => setNewParticipant({...newParticipant, rank: e.target.value})}
             />
             <input 
               type="text" 
               placeholder="Role (Optional)" 
               className="border p-2 rounded text-sm"
               value={newParticipant.role}
               onChange={(e) => setNewParticipant({...newParticipant, role: e.target.value})}
             />
          </div>
          <button 
            onClick={handleAddParticipant}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded flex items-center"
          >
            <Plus size={14} className="mr-1" /> Add Participant
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="flex items-center font-bold text-blue-900 mb-2"><Users size={18} className="mr-2" />Bulk Data Import</h4>
          <p className="text-sm text-blue-800 mb-4">Upload a CSV with <code>id</code>, <code>name</code>, <code>rank</code>, <code>role</code> columns.</p>
          <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCsvUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
        </div>

        {state.participants.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="font-bold text-gray-800">Bulk Actions</h4>
            <div className="flex gap-2">
              <button 
                onClick={handleBulkDownloadPdf}
                disabled={isBulkExporting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center disabled:opacity-50 text-xs"
              >
                {isBulkExporting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
                Export PDF (All)
              </button>
              <button 
                onClick={handleBulkDownloadZip}
                disabled={isBulkExporting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center disabled:opacity-50 text-xs"
              >
                {isBulkExporting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <FileArchive className="mr-2 h-4 w-4" />}
                Export ZIP (Files)
              </button>
            </div>
            {isBulkExporting && <div className="text-xs text-center text-gray-500">Processing {bulkProgress.current} / {bulkProgress.total}</div>}
          </div>
        )}

        <div className="bg-white border rounded-lg p-4 shadow-sm">
           <div className="mb-4 pb-4 border-b">
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center"><Globe size={16} className="mr-2 text-blue-500" />Public Access URL</label>
              <p className="text-xs text-gray-500 mb-2">If scanning with a phone while running locally, change <code>localhost</code> to your IP (e.g., <code>192.168.1.5:3000</code>).</p>
              <input type="text" value={publicUrl} onChange={(e) => setPublicUrl(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm font-mono" placeholder="https://..." />
           </div>
           
           <div className="flex items-center space-x-2">
              <div className="flex-1">
                 <h4 className="font-bold text-gray-900 flex items-center"><QrCode className="mr-2 h-4 w-4 text-indigo-600" /> Master QR</h4>
                 <p className="text-xs text-gray-400">Links to search portal</p>
              </div>
              {qrBlobUrl && <img src={qrBlobUrl} alt="QR" className="w-12 h-12 border rounded" />}
           </div>
        </div>

        <div className="max-h-60 overflow-y-auto border rounded relative">
          <table className="min-w-full text-xs text-left text-gray-500">
            <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.participants.slice(0, 100).map((p, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-[10px]">{p.id}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-2 text-gray-600">{p.rank || '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{p.role || '-'}</td>
                  <td className="px-4 py-2 flex justify-end gap-2">
                    <button onClick={() => setExportingParticipant(p)} title="Preview" className="text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
                    <button onClick={() => handleIndividualDownload(p)} title="Download PDF" className="text-gray-400 hover:text-green-600"><Download size={14} /></button>
                    <button onClick={() => setSelectedForQr(p)} title="Get Portable QR" className="text-gray-400 hover:text-indigo-600"><QrCode size={14} /></button>
                    <button onClick={() => handleDeleteParticipant(p.id)} title="Delete" className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {state.participants.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center">No participants loaded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Controls */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col z-20 shadow-lg">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">CertiGenius AI</h1>
          <p className="text-xs text-gray-500">Admin Dashboard</p>
        </div>

        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'content' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Type size={16} className="mx-auto mb-1" />Content</button>
          <button onClick={() => setActiveTab('design')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'design' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Palette size={16} className="mx-auto mb-1" />Design</button>
          <button onClick={() => setActiveTab('graphics')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'graphics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Settings size={16} className="mx-auto mb-1" />Graphics</button>
          <button onClick={() => setActiveTab('data')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}><Users size={16} className="mx-auto mb-1" />Data</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'design' && renderDesignTab()}
          {activeTab === 'graphics' && renderGraphicsTab()}
          {activeTab === 'data' && renderDataTab()}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-gray-100 relative overflow-hidden flex flex-col">
        <div className="absolute top-4 right-4 z-30 flex gap-2">
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200 shadow-sm">Admin Preview Mode</span>
        </div>
        
        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
           <CertificateCanvas 
             ref={canvasRef}
             design={state.design}
             content={state.content}
             images={state.images}
             onMoveImage={handleMoveImage}
             participant={exportingParticipant || { id: '12345', name: 'John A. Sample', rank: '1st', role: 'Winner' }} 
           />
        </div>
      </div>

      {/* Individual QR Modal Overlay */}
      {selectedForQr && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full relative">
              <button onClick={() => setSelectedForQr(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={20}/></button>
              <h3 className="text-lg font-bold mb-2 text-center text-gray-800">Portable QR Code</h3>
              <p className="text-xs text-center text-gray-500 mb-4">
                 For <strong>{selectedForQr.name}</strong>.<br/>
                 This QR contains the certificate data embedded in the link. 
                 <span className="text-orange-500 block mt-1">(Images omitted to fit in QR)</span>
              </p>
              
              <div className="flex justify-center mb-4">
                 {individualQrUrl ? (
                    <img src={individualQrUrl} alt="Individual QR" className="w-48 h-48 border rounded-lg" />
                 ) : (
                    <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-xs text-gray-400">Generating...</div>
                 )}
              </div>
              
              <div className="flex justify-center">
                 <a 
                   href={individualQrUrl || '#'} 
                   download={`QR_${selectedForQr.id}.png`}
                   className={`bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center ${!individualQrUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                 >
                    <Download size={14} className="mr-2" />
                    Save QR Image
                 </a>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;