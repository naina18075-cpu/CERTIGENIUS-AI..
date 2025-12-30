import React, { forwardRef } from 'react';
import Draggable from './Draggable';
import { DesignConfig, CertificateContent, ImageElement, Participant } from '../types';
import { THEMES } from '../constants';

interface CertificateCanvasProps {
  design: DesignConfig;
  content: CertificateContent;
  images: ImageElement[];
  onMoveImage: (id: string, x: number, y: number) => void;
  participant?: Participant | null; // If provided, fills placeholders
  readOnly?: boolean;
}

const CertificateCanvas = forwardRef<HTMLDivElement, CertificateCanvasProps>(
  ({ design, content, images, onMoveImage, participant, readOnly = false }, ref) => {
    
    // Helper to replace placeholders
    const processText = (text: string) => {
      if (!participant) return text;
      // Simple mustache replacement
      return text.replace(/\{\{(\w+)\}\}/g, (_, key) => participant[key] || `{{${key}}}`);
    };

    const currentTheme = THEMES.find(t => t.id === design.theme) || THEMES[0];
    const isDark = design.theme === 'dark' || design.theme === 'artdeco';

    return (
      <div className="w-full overflow-hidden flex justify-center p-4 bg-gray-200">
        {/* Aspect Ratio Container (A4 Landscape approx 297mm x 210mm ~ 1.414 ratio) */}
        <div 
          className="relative w-[1000px] h-[707px] shadow-2xl origin-top transform transition-transform"
          // In a real app we might scale this div based on viewport using transform: scale()
        >
          <div 
            ref={ref} 
            className={`w-full h-full relative p-16 flex flex-col items-center text-center ${currentTheme.bgClass} ${design.fontFamily}`}
            style={{ color: design.bodyColor }}
          >
            
            {/* --- Static Layout Content (Standard Certificate Flow) --- */}
            
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 w-full z-10">
              
              {/* Main Title */}
              <h1 
                className={`text-6xl font-bold tracking-wide mb-4 ${design.isMetallicTitle ? 'metallic-gold' : ''}`}
                style={{ 
                  color: design.isMetallicTitle ? undefined : design.titleColor,
                  fontSize: `${3.75 * design.fontSizeScale}rem`
                }}
              >
                {content.title}
              </h1>

              {/* Subtitle */}
              <p className="text-2xl opacity-80 italic">
                {content.subtitle}
              </p>

              {/* Recipient Name (The most important part) */}
              <div className="py-8 w-full border-b border-gray-300/30">
                 <h2 
                   className={`text-5xl font-bold ${design.fontFamily === 'font-greatvibes' ? 'text-7xl' : ''}`}
                   style={{ color: design.accentColor }}
                 >
                   {processText('{{name}}')}
                 </h2>
              </div>

              {/* Body Text */}
              <div className="max-w-3xl text-xl leading-relaxed mt-6">
                <p>{processText(content.bodyTemplate)}</p>
              </div>

              {/* Footer: Date & Signatures */}
              <div className="absolute bottom-16 w-full px-20 flex justify-between items-end">
                <div className="flex flex-col items-center border-t border-gray-400 pt-2 min-w-[200px]">
                  <p className="text-lg font-bold">{content.date}</p>
                  <p className="text-sm uppercase tracking-widest opacity-70">Date</p>
                </div>

                <div className="flex flex-col items-center border-t border-gray-400 pt-2 min-w-[200px]">
                  {/* Signature Name as Text if no image is placed there, or just label */}
                   <p className="text-lg font-bold">{content.signerName}</p>
                   <p className="text-sm uppercase tracking-widest opacity-70">{content.signerTitle}</p>
                </div>
              </div>

            </div>

            {/* --- Draggable Layer (Logos, Signatures) --- */}
            {images.map(img => (
              <Draggable
                key={img.id}
                x={img.x}
                y={img.y}
                onDragEnd={(x, y) => onMoveImage(img.id, x, y)}
                editable={!readOnly}
              >
                <img 
                  src={img.src} 
                  alt={img.type} 
                  style={{ width: img.width, height: img.height }}
                  className="object-contain pointer-events-none" // pointer-events-none inside draggable allows drag
                />
              </Draggable>
            ))}

          </div>
        </div>
      </div>
    );
  }
);

export default CertificateCanvas;