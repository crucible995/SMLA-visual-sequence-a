import React, { useEffect, useRef, useState } from 'react';
import ASCIIDataLayer from '../../components/ASCIIDataLayer';

export default function VisualSequenceA() {
  const videoRef = useRef(null);
  const [activeImages, setActiveImages] = useState([]);
  const [glowOpacity, setGlowOpacity] = useState(0);
  const [imageSequenceActive, setImageSequenceActive] = useState(false);
  const [videoOpacity, setVideoOpacity] = useState(0.85); // Current video opacity
  const [videoBrightness, setVideoBrightness] = useState(0.9); // Current video brightness
  const [videoFadeOpacity, setVideoFadeOpacity] = useState(0); // Video fade-in opacity
  const [logoOpacity, setLogoOpacity] = useState(0); // Logo fade-in/out opacity
  const [videoScale, setVideoScale] = useState(0.7); // Video scale
  const imageIdCounter = useRef(0);
  const animationFrameRef = useRef(null);
  const quarterHistory = useRef({ left: [], right: [] });
  const verticalProgressRef = useRef({ left: 0, right: 100 }); // Track vertical progression for each side
  const directionRef = useRef({ left: 1, right: -1 }); // 1 = down, -1 = up
  const hasCompletedFirstPass = useRef({ left: false, right: false }); // Track if first pass is complete
  
  // Image filenames from grainybatch folder
  const imageFilenames = [
    'Gu3u8qiXsAE79R-.jpeg',
    'GuZ2ctZXkAA6bz9.jpeg',
    'GupboqlWkAEjjUb.jpeg',
    'Gut55srWcAEZtTP.jpeg',
    'GvQj_r1XwAEHUSL.jpeg',
    'GvUzdogXwAAYkm4.jpeg',
    'GvWBvddXYAAMFpu.jpeg',
    'GvazZFpWYAEkBZc.jpeg',
    'GvbvjyuXwAAqLMa.jpeg',
    'GvcWVKBWMAEVX9z.jpeg',
    'GviBKB8WMAAt8xO.jpeg',
    'GvlAwi_XoAAbf-a.jpeg',
    'GvpfLKpWwAAfM0F.jpeg'
  ];
  
  // Function to get the next available quarter for a side
  const getNextQuarter = (side) => {
    const quarters = [0, 1, 2, 3]; // 0-25%, 25-50%, 50-75%, 75-100%
    const history = quarterHistory.current[side];
    
    // If we have history, prefer quarters we haven't used recently
    if (history.length > 0) {
      // Get quarters we haven't used in the last 2-3 placements
      const recentQuarters = history.slice(-2);
      const availableQuarters = quarters.filter(q => !recentQuarters.includes(q));
      
      // If all quarters were used recently, just pick from all quarters
      if (availableQuarters.length === 0) {
        return quarters[Math.floor(Math.random() * quarters.length)];
      }
      
      // Pick randomly from available quarters
      return availableQuarters[Math.floor(Math.random() * availableQuarters.length)];
    }
    
    // First placement - pick any quarter
    return quarters[Math.floor(Math.random() * quarters.length)];
  };
  
  // Function to generate position along curved path within a specific quarter
  const generateCurvedPosition = (side, quarter = null) => {
    // If no quarter specified, get the next one
    if (quarter === null) {
      quarter = getNextQuarter(side);
    }
    
    // Update history
    quarterHistory.current[side].push(quarter);
    if (quarterHistory.current[side].length > 4) {
      quarterHistory.current[side].shift(); // Keep only recent history
    }
    
    // Generate y position within the specified quarter
    const quarterSize = 25; // Each quarter is 25% of height
    const quarterStart = quarter * quarterSize;
    const yPercent = quarterStart + Math.random() * quarterSize;
    
    // Calculate curve offset based on vertical position
    // Using a sine curve to create the bowed effect
    const curveIntensity = 192; // pixels of maximum curve
    const curveOffset = Math.sin((yPercent / 100) * Math.PI) * curveIntensity;
    
    // Base horizontal position
    const baseX = side === 'left' ? 27.5 : 72.5; // percentage
    
    // Add curve offset and some random variation
    const xPercent = baseX + (curveOffset / window.innerWidth * 100) * (side === 'left' ? -1 : 1) + (Math.random() - 0.5) * 10;
    
    console.log(`[VisualSequenceA] Placing ${side} image in quarter ${quarter} (${quarterStart}-${quarterStart + quarterSize}%)`);
    
    return { x: xPercent, y: yPercent };
  };
  
  
  // Function to spawn images on both sides simultaneously
  const spawnImagePair = () => {
    const newImages = [];
    
    ['left', 'right'].forEach(side => {
      let yPercent;
      
      // Check if we're still in the first pass
      if (!hasCompletedFirstPass.current[side]) {
        // First pass: follow linear progression
        const progressStep = 8 + Math.random() * 4;
        verticalProgressRef.current[side] += progressStep * directionRef.current[side];
        
        // Check if we've completed the first pass
        if (side === 'left' && verticalProgressRef.current.left >= 100) {
          hasCompletedFirstPass.current.left = true;
          verticalProgressRef.current.left = 100;
          console.log('[VisualSequenceA] Left side completed first pass');
        } else if (side === 'right' && verticalProgressRef.current.right <= 0) {
          hasCompletedFirstPass.current.right = true;
          verticalProgressRef.current.right = 0;
          console.log('[VisualSequenceA] Right side completed first pass');
        }
        
        // Use the linear progression position with some stagger
        const verticalStagger = (Math.random() - 0.5) * 15; // ±7.5% vertical variation
        const baseY = verticalProgressRef.current[side];
        yPercent = Math.max(0, Math.min(100, baseY + verticalStagger));
      } else {
        // After first pass: randomly distribute across the entire vertical range
        yPercent = Math.random() * 100;
      }
      
      // Calculate curve offset based on vertical position
      const curveIntensity = 192;
      const curveOffset = Math.sin((yPercent / 100) * Math.PI) * curveIntensity;
      
      // Base horizontal position with more natural variation
      const baseX = side === 'left' ? 27.5 : 72.5;
      
      // Add horizontal stagger range: ±8% from the curved path
      const horizontalStagger = (Math.random() - 0.5) * 16;
      const xPercent = baseX + (curveOffset / window.innerWidth * 100) * (side === 'left' ? -1 : 1) + horizontalStagger;
      
      const newImage = {
        id: imageIdCounter.current++,
        src: `/grainybatch/${imageFilenames[Math.floor(Math.random() * imageFilenames.length)]}`,
        side: side,
        opacity: 0,
        lifetime: 0,
        maxLifetime: 3.5 + Math.random() * 1.5, // 3.5-5 seconds lifetime
        x: xPercent,
        y: yPercent
      };
      
      newImages.push(newImage);
    });
    
    setActiveImages(prev => [...prev, ...newImages]);
    console.log('[VisualSequenceA] Spawned images - Left:', hasCompletedFirstPass.current.left ? 'random' : `linear at ${verticalProgressRef.current.left.toFixed(1)}%`, 'Right:', hasCompletedFirstPass.current.right ? 'random' : `linear at ${verticalProgressRef.current.right.toFixed(1)}%`);
  };

  useEffect(() => {
    console.log('[VisualSequenceA] Component mounted - site name and sidebar should be hidden');
    console.log('[VisualSequenceA] Page loaded successfully');
    console.log('[VisualSequenceA] Applying radial mask (62%) and 0.7px blur to video for border fade');
    
    // Start video fade-in to match ASCII layer (1.5 seconds)
    const fadeInStart = Date.now();
    const fadeIn = () => {
      const elapsed = (Date.now() - fadeInStart) / 1000;
      if (elapsed < 1.5) {
        setVideoFadeOpacity(elapsed / 1.5);
        requestAnimationFrame(fadeIn);
      } else {
        setVideoFadeOpacity(1);
        console.log('[VisualSequenceA] Video fade-in complete');
      }
    };
    fadeIn();
    
    // Auto-play video when component mounts and set volume
    if (videoRef.current) {
      videoRef.current.volume = 0.075; // Start at 7.5% volume
      console.log('[VisualSequenceA] Video starting with 7.5% volume, will ramp up over 7 seconds');
      videoRef.current.play().then(() => {
        console.log('[VisualSequenceA] Video started playing automatically with audio');
        
        // Start volume ramp-up
        const startVolume = 0.075; // Start at 7.5%
        const targetVolume = 0.165; // Target volume: 16.5%
        const rampDuration = 7000; // 7 seconds in milliseconds
        const startTime = Date.now();
        
        const rampVolume = () => {
          const elapsed = Date.now() - startTime;
          
          if (elapsed < rampDuration) {
            // Calculate progress (0 to 1)
            const progress = elapsed / rampDuration;
            // Apply easing curve (ease-in-out)
            const easedProgress = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            // Set volume - interpolate between start and target
            if (videoRef.current) {
              videoRef.current.volume = startVolume + (easedProgress * (targetVolume - startVolume));
            }
            
            requestAnimationFrame(rampVolume);
          } else {
            // Ensure we're at target volume
            if (videoRef.current) {
              videoRef.current.volume = targetVolume;
              console.log('[VisualSequenceA] Volume ramp complete - now at 16.5%');
            }
          }
        };
        
        requestAnimationFrame(rampVolume);
      }).catch((error) => {
        console.error('[VisualSequenceA] Error auto-playing video:', error);
        console.log('[VisualSequenceA] Note: Some browsers require user interaction before playing audio');
      });
    }

    // Add keyboard event listener for 'y' key
    const handleKeyPress = (event) => {
      if (event.key.toLowerCase() === 'y') {
        console.log('[VisualSequenceA] Y key pressed - restarting video');
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.volume = 0.075; // Start at 7.5% volume for restart
          videoRef.current.play().then(() => {
            console.log('[VisualSequenceA] Video restarted - ramping volume over 7 seconds');
            
            // Start volume ramp-up for restart
            const startVolume = 0.075; // Start at 7.5%
            const targetVolume = 0.165; // Target volume: 16.5%
            const rampDuration = 7000; // 7 seconds in milliseconds
            const startTime = Date.now();
            
            const rampVolume = () => {
              const elapsed = Date.now() - startTime;
              
              if (elapsed < rampDuration) {
                // Calculate progress (0 to 1)
                const progress = elapsed / rampDuration;
                // Apply easing curve (ease-in-out)
                const easedProgress = progress < 0.5 
                  ? 2 * progress * progress 
                  : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                // Set volume - interpolate between start and target
                if (videoRef.current) {
                  videoRef.current.volume = startVolume + (easedProgress * (targetVolume - startVolume));
                }
                
                requestAnimationFrame(rampVolume);
              } else {
                // Ensure we're at target volume
                if (videoRef.current) {
                  videoRef.current.volume = targetVolume;
                  console.log('[VisualSequenceA] Volume ramp complete - now at 16.5%');
                }
              }
            };
            
            requestAnimationFrame(rampVolume);
          }).catch((error) => {
            console.error('[VisualSequenceA] Error restarting video:', error);
          });
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);
    
    // Video time tracking for image spawning
    let lastSpawnTime = 0;
    let glowFadeStarted = false;
    let glowFadeOutStarted = false;
    let videoTransitionStarted = false;
    let videoFadeOutStarted = false;
    let initialFadeInComplete = false;
    let logoFadeStarted = false;
    let videoScaleStarted = false;
    
    // Mark initial fade-in as complete after 1.5 seconds
    setTimeout(() => {
      initialFadeInComplete = true;
    }, 1500);
    
    const checkVideoTime = () => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        
        
        // Start spawning images at 19.65 seconds
        if (currentTime >= 19.65 && currentTime <= 28.5) {
          if (!imageSequenceActive) setImageSequenceActive(true);
          // Spawn image pairs every 0.1 seconds
          if (currentTime - lastSpawnTime >= 0.1) {
            spawnImagePair();
            lastSpawnTime = currentTime;
          }
          
          // Start glow fade-in and reduce ASCII opacity
          if (!glowFadeStarted && currentTime >= 19.65) {
            glowFadeStarted = true;
            console.log('[VisualSequenceA] Starting glow fade-in');
            // Fade in over 1.5 seconds
            const fadeInStart = Date.now();
            const fadeIn = () => {
              const elapsed = (Date.now() - fadeInStart) / 1000;
              if (elapsed < 1.5) {
                setGlowOpacity(elapsed / 1.5);
                requestAnimationFrame(fadeIn);
              } else {
                setGlowOpacity(1);
              }
            };
            fadeIn();
          }
          
          // Start video opacity and brightness transition
          if (!videoTransitionStarted && currentTime >= 19.65) {
            videoTransitionStarted = true;
            console.log('[VisualSequenceA] Starting video opacity/brightness transition');
            // Transition over 0.6 seconds
            const transitionStart = Date.now();
            const startOpacity = 0.85;
            const startBrightness = 0.9;
            const targetOpacity = 0.892;
            const targetBrightness = 0.9185;
            
            const transitionVideo = () => {
              const elapsed = (Date.now() - transitionStart) / 1000;
              if (elapsed < 0.6) {
                // Linear interpolation
                const progress = elapsed / 0.6;
                setVideoOpacity(startOpacity + (targetOpacity - startOpacity) * progress);
                setVideoBrightness(startBrightness + (targetBrightness - startBrightness) * progress);
                requestAnimationFrame(transitionVideo);
              } else {
                setVideoOpacity(targetOpacity);
                setVideoBrightness(targetBrightness);
                console.log('[VisualSequenceA] Video transition complete - opacity: 0.892, brightness: 0.9185');
              }
            };
            transitionVideo();
          }
          
          // Start video scale animation
          if (!videoScaleStarted && currentTime >= 19.65) {
            videoScaleStarted = true;
            console.log('[VisualSequenceA] Starting video scale animation from 0.7 to 0.79');
            // Scale up over 0.8 seconds with easing
            const scaleStart = Date.now();
            const startScale = 0.7;
            const targetScale = 0.79;
            
            const scaleVideo = () => {
              const elapsed = (Date.now() - scaleStart) / 1000;
              if (elapsed < 0.8) {
                // Ease-out cubic for smooth deceleration
                const progress = 1 - Math.pow(1 - elapsed / 0.8, 3);
                setVideoScale(startScale + (targetScale - startScale) * progress);
                requestAnimationFrame(scaleVideo);
              } else {
                setVideoScale(targetScale);
                console.log('[VisualSequenceA] Video scale animation complete - scale: 0.79');
              }
            };
            scaleVideo();
          }
        }
        
        // Start fade-out when images stop spawning
        if (!glowFadeOutStarted && currentTime > 28.5 && glowFadeStarted) {
          glowFadeOutStarted = true;
          console.log('[VisualSequenceA] Starting glow fade-out');
          // Fade out over 1.5 seconds
          const fadeOutStart = Date.now();
          const fadeOut = () => {
            const elapsed = (Date.now() - fadeOutStart) / 1000;
            if (elapsed < 1.5) {
              setGlowOpacity(1 - elapsed / 1.5);
              requestAnimationFrame(fadeOut);
            } else {
              setGlowOpacity(0);
            }
          };
          fadeOut();
        }
        
        // Start logo fade-in at the same time as glow fade-out (28.5s)
        if (!logoFadeStarted && currentTime > 28.5) {
          logoFadeStarted = true;
          console.log('[VisualSequenceA] Starting logo fade-in at 28.5s');
          // Fade in over 0.5 seconds
          const fadeInStart = Date.now();
          const fadeIn = () => {
            const elapsed = (Date.now() - fadeInStart) / 1000;
            if (elapsed < 0.5) {
              setLogoOpacity(elapsed / 0.5);
              requestAnimationFrame(fadeIn);
            } else {
              setLogoOpacity(1);
              console.log('[VisualSequenceA] Logo fade-in complete');
            }
          };
          fadeIn();
        }
        
        // Fade out logo at the same time as video (0.75s before end)
        if (!videoFadeOutStarted && logoFadeStarted && duration && currentTime >= duration - 0.75) {
          console.log('[VisualSequenceA] Starting logo fade-out with video fade-out');
          const logoFadeOutStart = Date.now();
          const logoFadeOut = () => {
            const elapsed = (Date.now() - logoFadeOutStart) / 1000;
            if (elapsed < 0.75) {
              setLogoOpacity(1 - (elapsed / 0.75));
              requestAnimationFrame(logoFadeOut);
            } else {
              setLogoOpacity(0);
              console.log('[VisualSequenceA] Logo fade-out complete');
            }
          };
          logoFadeOut();
        }
        
        // Start video fade-out 0.75 seconds before the end
        if (!videoFadeOutStarted && duration && currentTime >= duration - 0.75) {
          videoFadeOutStarted = true;
          console.log('[VisualSequenceA] Starting video fade-out 0.75s before end');
          const fadeOutStart = Date.now();
          const fadeOut = () => {
            const elapsed = (Date.now() - fadeOutStart) / 1000;
            if (elapsed < 0.75) {
              setVideoFadeOpacity(1 - (elapsed / 0.75));
              requestAnimationFrame(fadeOut);
            } else {
              setVideoFadeOpacity(0);
              console.log('[VisualSequenceA] Video fade-out complete');
            }
          };
          fadeOut();
        }
        
        // Reset if video restarts
        if (currentTime < 19.65) {
          if (imageSequenceActive) setImageSequenceActive(false);
          glowFadeStarted = false;
          glowFadeOutStarted = false;
          videoTransitionStarted = false;
          videoFadeOutStarted = false;
          logoFadeStarted = false;
          videoScaleStarted = false;
          setGlowOpacity(0);
          setLogoOpacity(0);
          setVideoOpacity(0.85);
          setVideoBrightness(0.9);
          setVideoScale(0.7);
          verticalProgressRef.current = { left: 0, right: 100 }; // Reset vertical progress
          directionRef.current = { left: 1, right: -1 }; // Reset directions
          hasCompletedFirstPass.current = { left: false, right: false }; // Reset first pass tracking
          // Only reset fade opacity if initial fade-in is complete
          if (initialFadeInComplete) {
            setVideoFadeOpacity(1);
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(checkVideoTime);
    };
    
    // Start checking video time
    animationFrameRef.current = requestAnimationFrame(checkVideoTime);
    
    return () => {
      console.log('[VisualSequenceA] Component unmounting');
      // Clean up event listener
      window.removeEventListener('keydown', handleKeyPress);
      // Cancel animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Update image lifecycles
  useEffect(() => {
    const updateImages = () => {
      setActiveImages(prev => {
        return prev
          .map(img => {
            const updatedImg = { ...img };
            updatedImg.lifetime += 0.016; // ~60fps
            
            // Fade in during first 0.2 seconds
            if (updatedImg.lifetime < 0.2) {
              updatedImg.opacity = updatedImg.lifetime / 0.2 * 0.365; // max opacity 0.365
            }
            // Fade out during last 0.5 seconds
            else if (updatedImg.lifetime > updatedImg.maxLifetime - 0.5) {
              const fadeOutProgress = (updatedImg.lifetime - (updatedImg.maxLifetime - 0.5)) / 0.5;
              updatedImg.opacity = 0.365 * (1 - fadeOutProgress);
            }
            // Full opacity in between
            else {
              updatedImg.opacity = 0.365;
            }
            
            return updatedImg;
          })
          .filter(img => img.lifetime < img.maxLifetime);
      });
    };
    
    const interval = setInterval(updateImages, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-black flex items-center justify-center overflow-hidden relative">
      {/* ASCII Data Layer Component */}
      <ASCIIDataLayer reduceOpacity={imageSequenceActive} />
      {/* Left vertical line with glow and curve */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: 'calc(15% - 87px)',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '296px',
          opacity: glowOpacity,
          transition: 'opacity 0.1s ease-out',
          zIndex: 5,
        }}
      >
        {/* Multiple glow layers */}
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(52.5px)' }}>
          <path
            d="M 100 0 Q 68 148 100 296"
            stroke="rgba(147, 197, 253, 0.18)"
            strokeWidth="20"
            fill="none"
          />
        </svg>
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(35px)' }}>
          <path
            d="M 100 0 Q 68 148 100 296"
            stroke="rgba(147, 197, 253, 0.24)"
            strokeWidth="12"
            fill="none"
          />
        </svg>
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(22.5px)' }}>
          <path
            d="M 100 0 Q 68 148 100 296"
            stroke="rgba(191, 219, 254, 0.3)"
            strokeWidth="8"
            fill="none"
          />
        </svg>
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(13px)' }}>
          <path
            d="M 100 0 Q 68 148 100 296"
            stroke="rgba(191, 219, 254, 0.36)"
            strokeWidth="4"
            fill="none"
          />
        </svg>
        {/* Core line */}
        <svg className="absolute inset-0" viewBox="0 0 200 296">
          <path
            d="M 100 0 Q 68 148 100 296"
            stroke="rgba(219, 234, 254, 0.06)"
            strokeWidth="1.5"
            fill="none"
            style={{ filter: 'blur(1.5px)' }}
          />
        </svg>
      </div>
      
      {/* Right vertical line with glow and curve */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: 'calc(15% - 87px)',
          top: '50%',
          transform: 'translate(50%, -50%)',
          width: '200px',
          height: '296px',
          opacity: glowOpacity,
          transition: 'opacity 0.1s ease-out',
          zIndex: 5,
        }}
      >
        {/* Multiple glow layers */}
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(52.5px)' }}>
          <path
            d="M 100 0 Q 132 148 100 296"
            stroke="rgba(147, 197, 253, 0.18)"
            strokeWidth="20"
            fill="none"
          />
        </svg>
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(35px)' }}>
          <path
            d="M 100 0 Q 132 148 100 296"
            stroke="rgba(147, 197, 253, 0.24)"
            strokeWidth="12"
            fill="none"
          />
        </svg>
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(22.5px)' }}>
          <path
            d="M 100 0 Q 132 148 100 296"
            stroke="rgba(191, 219, 254, 0.3)"
            strokeWidth="8"
            fill="none"
          />
        </svg>
        <svg className="absolute inset-0" viewBox="0 0 200 296" style={{ filter: 'blur(13px)' }}>
          <path
            d="M 100 0 Q 132 148 100 296"
            stroke="rgba(191, 219, 254, 0.36)"
            strokeWidth="4"
            fill="none"
          />
        </svg>
        {/* Core line */}
        <svg className="absolute inset-0" viewBox="0 0 200 296">
          <path
            d="M 100 0 Q 132 148 100 296"
            stroke="rgba(219, 234, 254, 0.06)"
            strokeWidth="1.5"
            fill="none"
            style={{ filter: 'blur(1.5px)' }}
          />
        </svg>
      </div>
      
      {/* Memory images */}
      {activeImages.map(img => (
        <div
          key={img.id}
          className="absolute"
          style={{
            left: `${img.x}%`,
            top: `${img.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '146px',
            height: '220px',
            opacity: img.opacity,
            pointerEvents: 'none',
            transition: 'opacity 0.1s ease-out',
            zIndex: 8
          }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${img.src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
              maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
              filter: 'blur(0.5px) saturate(0.3) brightness(0.8)',
              // Blue tint overlay
              position: 'relative'
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                backgroundColor: 'rgba(30, 58, 138, 0.6)', // Blue tint
                mixBlendMode: 'overlay' // could try "color" or other approaches
              }}
            />
          </div>
        </div>
      ))}
      
      {/* Logo with glow and blur - appears when curved lines fade out */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          zIndex: 20,
          opacity: logoOpacity,
          transition: 'opacity 0.1s ease-out'
        }}
      >
        {/* Multiple logo layers for intense glow effect */}
        <div className="relative">
          {/* Outermost glow layer */}
          <img
            src="/sitelogo-2.svg"
            alt=""
            className="absolute w-[86px] h-[86px]"
            style={{
              filter: `
                invert(90%) 
                sepia(13%) 
                saturate(1000%) 
                hue-rotate(167deg) 
                brightness(103%) 
                contrast(101%)
                blur(60px)
                drop-shadow(0 0 80px rgba(147, 197, 253, 0.4))
              `,
              opacity: 0.077,
              transform: 'scale(1.8) translate(-50%, -50%)',
              top: '50%',
              left: '50%'
            }}
          />
          {/* Middle glow layer */}
          <img
            src="/sitelogo-2.svg"
            alt=""
            className="absolute w-[86px] h-[86px]"
            style={{
              filter: `
                invert(90%) 
                sepia(13%) 
                saturate(1000%) 
                hue-rotate(167deg) 
                brightness(103%) 
                contrast(101%)
                blur(30px)
                drop-shadow(0 0 40px rgba(147, 197, 253, 0.6))
              `,
              opacity: 0.077,
              transform: 'scale(1.4) translate(-50%, -50%)',
              top: '50%',
              left: '50%'
            }}
          />
          {/* Inner glow layer */}
          <img
            src="/sitelogo-2.svg"
            alt=""
            className="absolute w-[86px] h-[86px]"
            style={{
              filter: `
                invert(90%) 
                sepia(13%) 
                saturate(1000%) 
                hue-rotate(167deg) 
                brightness(103%) 
                contrast(101%)
                blur(15px)
                drop-shadow(0 0 25px rgba(191, 219, 254, 0.7))
              `,
              opacity: 0.077,
              transform: 'scale(1.2) translate(-50%, -50%)',
              top: '50%',
              left: '50%'
            }}
          />
          {/* Core logo with multiple drop shadows */}
          <img
            src="/sitelogo-2.svg"
            alt="Simula.earth Logo"
            className="w-[86px] h-[86px] relative"
            style={{
              filter: `
                invert(90%) 
                sepia(13%) 
                saturate(1000%) 
                hue-rotate(167deg) 
                brightness(103%) 
                contrast(101%)
                blur(0.5px)
                drop-shadow(0 0 15px rgba(219, 234, 254, 0.7))
                drop-shadow(0 0 30px rgba(191, 219, 254, 0.5))
                drop-shadow(0 0 45px rgba(147, 197, 253, 0.4))
                drop-shadow(0 0 60px rgba(147, 197, 253, 0.25))
              `,
              opacity: 0.077,
              mixBlendMode: 'screen'
            }}
          />
        </div>
      </div>
      
      {/* Video */}
      <video 
        ref={videoRef}
        className="object-contain relative z-10"
        style={{ 
          width: 'auto', 
          height: 'auto',
          transform: `scale(${videoScale})`,
          maskImage: 'radial-gradient(ellipse at center, black 5.7%, transparent 55%)',
          maskSize: 'auto',
          maskRepeat: 'no-repeat',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 5.7%, transparent 55%)',
          WebkitMaskSize: 'auto',
          WebkitMaskRepeat: 'no-repeat',
          filter: `blur(0.35px) brightness(${videoBrightness})`,
          opacity: videoOpacity * videoFadeOpacity
        }}
        controls={false}
        onLoadedData={() => {
          console.log('[VisualSequenceA] Video loaded and ready to play');
          if (videoRef.current) {
            videoRef.current.volume = 0.075;
            console.log('[VisualSequenceA] Video volume set to 7.5% on load (will ramp up when playing)');
          }
        }}
        onPlay={() => console.log('[VisualSequenceA] Video started playing')}
        onPause={() => console.log('[VisualSequenceA] Video paused')}
        onEnded={() => console.log('[VisualSequenceA] Video ended')}
      >
        <source src="/coolvid.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}