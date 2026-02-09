import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

interface ConfettiLayerProps {
  isActive: boolean;
  type: 'basic' | 'stars' | 'fireworks' | 'random';
  boardId: string;
  currentUserId?: string;
}

const fireConfetti = (
  type: string, 
  origin: { x: number; y: number }, 
  angle: number, 
  velocity: number,
  distance: number
) => {
  const count = Math.min(Math.max(distance / 5, 20), 100);
  
  const defaults = {
    origin,
    angle,
    startVelocity: velocity,
    particleCount: count,
    spread: 60,
    zIndex: 100,
  };

  if (type === 'stars') {
    confetti({
      ...defaults,
      shapes: ['star'],
      colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
    });
  } else if (type === 'fireworks') {
      confetti({
          ...defaults,
          spread: 360,
          ticks: 50,
          gravity: 0,
          decay: 0.94,
          startVelocity: 30,
          shapes: ['star'],
          colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
      });
      confetti({
          ...defaults,
          spread: 360,
          ticks: 50,
          gravity: 0,
          decay: 0.94,
          startVelocity: 30,
          shapes: ['circle'],
          colors: ['#FF0000', '#00FF00', '#0000FF'],
      });
  } else if (type === 'random') {
     confetti({
      ...defaults,
      colors: [
         '#' + Math.floor(Math.random()*16777215).toString(16),
         '#' + Math.floor(Math.random()*16777215).toString(16)
      ]
     });
  } else {
    confetti(defaults);
  }
};

export default function ConfettiLayer({ isActive, type, boardId, currentUserId }: ConfettiLayerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  
  // Ref to track if we should fire
  const dragRef = useRef<{ start: { x: number; y: number } | null }>({ start: null });
  
  // Multiplayer Logic
  const fireMutation = useMutation(api.confetti.fire);
  const recentEvents = useQuery(api.confetti.recent, { boardId: boardId as Id<"boards"> });
  const lastProcessedTimeRef = useRef<number>(0);

  // Initialize timestamp on mount
  React.useEffect(() => {
    lastProcessedTimeRef.current = Date.now();
  }, []);

  // Listen for remote events
  React.useEffect(() => {
    if (!recentEvents) return;

    const newEvents = recentEvents.filter(e => e._creationTime > lastProcessedTimeRef.current);
    
    if (newEvents.length > 0) {
      // Sort oldest to newest
      const sorted = [...newEvents].sort((a, b) => a._creationTime - b._creationTime);
      
      sorted.forEach(event => {
        // Update high watermark
        lastProcessedTimeRef.current = Math.max(lastProcessedTimeRef.current, event._creationTime);
        
        // Skip our own events (we fired them locally)
        if (event.senderId === currentUserId) return;
        
        const origin = {
          x: event.originX,
          y: event.originY, 
        };
        
        fireConfetti(
          event.type,
          origin,
          event.angle,
          event.velocity,
          event.distance
        );
      });
    }
  }, [recentEvents, currentUserId]);


  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive) return;
    const pos = { x: e.clientX, y: e.clientY };
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDragging(true);
    dragRef.current.start = pos;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isActive || !isDragging) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isActive || !isDragging || !dragRef.current.start) return;

    const endPos = { x: e.clientX, y: e.clientY };
    const start = dragRef.current.start;
    
    // Slingshot mechanic: Fire opposite to drag direction
    const vectorX = start.x - endPos.x;
    const vectorY = start.y - endPos.y;
    
    const distance = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    const angle = Math.atan2(vectorY, vectorX); // Radians
    
    const degrees = angle * (180 / Math.PI);
    const firingAngle = -degrees;

    // Velocity based on distance
    const maxDist = 500;
    const velocity = Math.min(distance / maxDist, 1) * 90 + 10;
    
    // Normalized Origin
    const origin = {
      x: start.x / window.innerWidth,
      y: start.y / window.innerHeight,
    };

    // Fire Locally (Instant feedback)
    fireConfetti(type, origin, firingAngle, velocity, distance);
    
    // Broadcast to others
    if (boardId) {
       try {
         await fireMutation({
           boardId: boardId as Id<"boards">,
           type,
           originX: origin.x,
           originY: origin.y,
           angle: firingAngle,
           velocity,
           distance,
         });
       } catch (err) {
         console.error("Failed to broadcast confetti:", err);
       }
    }

    setIsDragging(false);
    setStartPos(null);
    setCurrentPos(null);
    dragRef.current.start = null;
  };
  
  // Visual Feedback - Slingshot Arrow
  const targetX = startPos && currentPos ? startPos.x + (startPos.x - currentPos.x) : 0;
  const targetY = startPos && currentPos ? startPos.y + (startPos.y - currentPos.y) : 0;

  // Render ALWAYS to receive events. Pointer events depend on isActive.
  return (
    <div 
      className={`fixed inset-0 z-50 ${isActive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {isActive && isDragging && startPos && currentPos && (
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {/* Drag Line (String) */}
          <line 
            x1={startPos.x} 
            y1={startPos.y} 
            x2={currentPos.x} 
            y2={currentPos.y} 
            stroke="rgba(100, 100, 100, 0.4)" 
            strokeWidth="2" 
            strokeDasharray="5,5"
          />
          
          {/* Firing Trajectory Arrow */}
          <line 
            x1={startPos.x} 
            y1={startPos.y} 
            x2={targetX} 
            y2={targetY} 
            stroke="rgba(255, 50, 50, 0.8)" 
            strokeWidth="4" 
          />
          <circle cx={startPos.x} cy={startPos.y} r="5" fill="red" />
          
          {/* Arrow head at target */}
          <polygon 
             points={`${targetX},${targetY} ${targetX-10},${targetY-5} ${targetX-10},${targetY+5}`}
             fill="red"
             transform={`rotate(${Math.atan2(targetY - startPos.y, targetX - startPos.x) * (180/Math.PI)}, ${targetX}, ${targetY})`}
          />
        </svg>
      )}
    </div>
  );
}


