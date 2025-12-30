import React, { useState, useEffect, useRef } from 'react';

interface DraggableProps {
  x: number;
  y: number;
  onDragEnd: (x: number, y: number) => void;
  children: React.ReactNode;
  editable?: boolean;
}

const Draggable: React.FC<DraggableProps> = ({ x, y, onDragEnd, children, editable = true }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x, y });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    // Capture pointer to track even if mouse leaves the div
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    onDragEnd(position.x, position.y);
  };

  return (
    <div
      ref={ref}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        position: 'absolute',
        top: 0,
        left: 0,
        cursor: editable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'none', 
        zIndex: isDragging ? 50 : 10
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={editable ? "hover:outline hover:outline-2 hover:outline-blue-400 hover:outline-dashed rounded p-1 transition-outline" : ""}
    >
      {children}
    </div>
  );
};

export default Draggable;