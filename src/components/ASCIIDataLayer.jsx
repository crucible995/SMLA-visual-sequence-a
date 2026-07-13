import React, { useEffect, useRef } from 'react';

const ASCIIDataLayer = ({ reduceOpacity = false }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gridRef = useRef([]);
  const opacityRef = useRef(0);
  const reduceOpacityRef = useRef(reduceOpacity);
  reduceOpacityRef.current = reduceOpacity;
  
  // ASCII characters for data visualization
  const dataChars = '01234567890ABCDEF#@%&*+-=/<>[]{}()';
  const gridSize = 24; // Larger cells = fewer characters = better performance
  // Removed cycling for better performance
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    console.log('[ASCIIDataLayer] Canvas initialized:', canvas.width, 'x', canvas.height);
    
    // Initialize grid
    const cols = Math.ceil(canvas.width / gridSize);
    const rows = Math.ceil(canvas.height / gridSize);
    const centerX = cols / 2;
    const centerY = rows / 2;
    
    // Create grid with distance-based properties
    gridRef.current = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const dx = Math.abs(x - centerX);
        const dy = Math.abs(y - centerY);
        const distance = Math.max(dx, dy); // Use Chebyshev distance for square shape
        const maxDistance = Math.max(centerX, centerY);
        const normalizedDistance = distance / maxDistance;
        
        gridRef.current.push({
          x: x * gridSize,
          y: y * gridSize,
          char: dataChars[Math.floor(Math.random() * dataChars.length)],
          distance: normalizedDistance,
          opacity: 0,
          // Add oscillation factors for creating patches
          oscFactorX: Math.random() * Math.PI * 2,
          oscFactorY: Math.random() * Math.PI * 2,
          oscSpeed: 1 + Math.random() * 2 // Random speed between 1-3
        });
      }
    }
    
    // Always visible, just fade in on mount
    const fadeInStart = Date.now();
    const fadeIn = () => {
      const elapsed = (Date.now() - fadeInStart) / 1000;
      if (elapsed < 1.5) {
        opacityRef.current = elapsed / 1.5;
        requestAnimationFrame(fadeIn);
      } else {
        opacityRef.current = 1;
      }
    };
    fadeIn();
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const time = Date.now() / 1000; // Time in seconds
      
      // Set text properties
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw characters
      let charCount = 0;
      gridRef.current.forEach(cell => {
        // Skip cells too close to center (radial transparency)
        if (cell.distance < 0.25) return;
        
        // Calculate opacity based on distance from center
        let cellOpacity;
        if (cell.distance < 0.45) {
          // Linear fade in from center (in-between approach)
          cellOpacity = (cell.distance - 0.25) / 0.2;
        } else if (cell.distance > 0.7) {
          // Fade out to edges
          cellOpacity = 1 - (cell.distance - 0.7) / 0.3;
        } else {
          // Full opacity in middle range
          cellOpacity = 1;
        }
        
        // Add oscillating opacity based on position and time
        // Create patches by using sine waves with cell position
        const oscX = Math.sin(cell.x / 100 + cell.oscFactorX + time * cell.oscSpeed);
        const oscY = Math.sin(cell.y / 100 + cell.oscFactorY + time * cell.oscSpeed * 0.7);
        // Combine oscillations and map to range to maintain minimum opacity
        const oscillation = (oscX * oscY + 1) / 2; // Normalize to 0-1
        const range = reduceOpacityRef.current ? 0.28 : 0.7; // Mid-range for noticeable but not too dramatic effect
        const oscMultiplier = 0.3 + oscillation * range; // Map to 0.3-1 or 0.3-0.58
        
        // Apply oscillation to cell opacity
        cellOpacity *= oscMultiplier;
        
        // Apply global opacity and keep it subtle but visible
        cellOpacity *= opacityRef.current * 0.151;
        
        // Ensure minimum opacity floor of 0.05 for visible cells
        if (cellOpacity > 0 && cellOpacity < 0.05) {
          cellOpacity = 0.05;
        }
        
        // Draw character with blue tint
        ctx.fillStyle = `rgba(140, 180, 235, ${cellOpacity})`;
        ctx.fillText(cell.char, cell.x + gridSize / 2, cell.y + gridSize / 2);
        charCount++;
      });
      
      // Log once to check if we're rendering
      if (charCount > 0 && opacityRef.current === 0) {
        console.log('[ASCIIDataLayer] Drawing', charCount, 'characters, opacity:', opacityRef.current);
      }
      // Throttle to 30fps for better performance
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, 33);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Reinitialize grid on resize
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);
      const centerX = cols / 2;
      const centerY = rows / 2;
      
      gridRef.current = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const dx = Math.abs(x - centerX);
          const dy = Math.abs(y - centerY);
          const distance = Math.max(dx, dy); // Use Chebyshev distance for square shape
          const maxDistance = Math.max(centerX, centerY);
          const normalizedDistance = distance / maxDistance;
          
          gridRef.current.push({
            x: x * gridSize,
            y: y * gridSize,
            char: dataChars[Math.floor(Math.random() * dataChars.length)],
            distance: normalizedDistance,
            opacity: 0,
            // Add oscillation factors for creating patches
            oscFactorX: Math.random() * Math.PI * 2,
            oscFactorY: Math.random() * Math.PI * 2,
            oscSpeed: 1 + Math.random() * 2 // Random speed between 1-3
          });
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3
      }}
    />
  );
};

export default ASCIIDataLayer;