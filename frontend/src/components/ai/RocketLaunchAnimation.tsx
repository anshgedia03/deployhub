"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Rocket } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface RocketLaunchAnimationProps {
  isLaunching: boolean;
  onAnimationComplete: () => void;
  onImpact?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  inputRef: React.RefObject<HTMLDivElement | null>;
}

type Phase = 'idle' | 'charging' | 'flying' | 'collided' | 'energy' | 'complete';

// Catmull-Rom spline curve evaluator for 100% smooth continuous multipoint paths
const getCatmullRomPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
};

export const RocketLaunchAnimation: React.FC<RocketLaunchAnimationProps> = ({
  isLaunching,
  onAnimationComplete,
  onImpact,
  containerRef,
  buttonRef,
  inputRef,
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [rocketPos, setRocketPos] = useState<{ x: number; y: number; angle: number; scale: number }>({
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
  });

  const [particles, setParticles] = useState<Particle[]>([]);
  const [energyProgress, setEnergyProgress] = useState<number>(0);
  const [inputRect, setInputRect] = useState<{ width: number; height: number; x: number; y: number }>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const particleIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pathPointsRef = useRef<Point[]>([]);

  // Check for prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const startAnimation = useCallback(() => {
    if (!containerRef.current || !buttonRef.current || !inputRef.current) {
      onAnimationComplete();
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const btnRect = buttonRef.current.getBoundingClientRect();
    const inRect = inputRef.current.getBoundingClientRect();

    // Calculate positions relative to container
    const startPoint: Point = {
      x: btnRect.left - containerRect.left + btnRect.width / 2,
      y: btnRect.top - containerRect.top + btnRect.height / 2,
    };

    // Target collision point near the right/bottom edge of the input box
    const targetPoint: Point = {
      x: inRect.right - containerRect.left - 24,
      y: inRect.top - containerRect.top + inRect.height / 2 + 6,
    };

    setInputRect({
      width: inRect.width,
      height: inRect.height,
      x: inRect.left - containerRect.left,
      y: inRect.top - containerRect.top,
    });

    if (prefersReducedMotion) {
      setPhase('collided');
      setTimeout(() => {
        setPhase('energy');
        setEnergyProgress(0);
        const startTime = performance.now();
        const duration = 1200;

        const step = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          setEnergyProgress(progress);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            setPhase('complete');
            setTimeout(onAnimationComplete, 200);
          }
        };
        requestAnimationFrame(step);
      }, 150);
      return;
    }

    // Step 1: Pre-launch downward compression (120ms)
    setPhase('charging');
    setRocketPos({
      x: startPoint.x,
      y: startPoint.y + 4,
      angle: -30,
      scale: 0.85,
    });

    setTimeout(() => {
      // Step 2: Launch & Flight calculation
      setPhase('flying');

      const W = containerRect.width;
      const H = containerRect.height;

      // Dynamic waypoints creating a sweeping continuous roller-coaster arc across the chat area
      const wp0 = { ...startPoint };
      
      // Arc up and right towards the center-top
      const wp1 = {
        x: W * 0.45,
        y: Math.max(20, H * 0.15)
      };
      
      // Swoop down to the center-left to create a loop
      const wp2 = {
        x: W * 0.25,
        y: H * 0.55
      };
      
      // Pull up and right towards the top-right corner
      const wp3 = {
        x: Math.min(W - 40, W * 0.8),
        y: Math.max(40, H * 0.25)
      };
      
      // Dive into the target
      const wp4 = { ...targetPoint };

      const waypoints = [wp0, wp1, wp2, wp3, wp4];
      pathPointsRef.current = waypoints;
      startTimeRef.current = performance.now();

      const FLIGHT_DURATION = 1450; // Total smooth flight time

      const getSplinePoint = (globalT: number) => {
        const clampedT = Math.max(0, Math.min(1, globalT));
        const numSegments = waypoints.length - 1; // 4 segments
        const floatIndex = clampedT * numSegments;
        const index = Math.min(Math.floor(floatIndex), numSegments - 1);
        const localT = floatIndex - index;

        const p0 = waypoints[Math.max(index - 1, 0)];
        const p1 = waypoints[index];
        const p2 = waypoints[Math.min(index + 1, waypoints.length - 1)];
        const p3 = waypoints[Math.min(index + 2, waypoints.length - 1)];

        return getCatmullRomPoint(p0, p1, p2, p3, localT);
      };

      const animateFlight = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const rawT = Math.min(1, elapsed / FLIGHT_DURATION);
        // Smoothstep easing
        const t = rawT * rawT * (3 - 2 * rawT);

        // Calculate positions dynamically from a single continuous spline
        const curPos = getSplinePoint(t);
        const nextPos = getSplinePoint(t + 0.02);

        // Calculate heading angle
        const dx = nextPos.x - curPos.x;
        const dy = nextPos.y - curPos.y;
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 45; // Adjust for Rocket SVG orientation

        // Rocket scaling on final dive
        const rocketScale = rawT > 0.85 ? 1.15 - (rawT - 0.85) * 0.8 : 1.05;

        setRocketPos({
          x: curPos.x,
          y: curPos.y,
          angle: angleDeg,
          scale: rocketScale,
        });

        // Emit trail particles
        if (Math.random() < 0.85) {
          const colors = ['#00F5FF', '#38BDF8', '#818CF8', '#FFFFFF', '#67E8F9'];
          const angleRad = ((angleDeg - 45) * Math.PI) / 180;
          const backOffset = 18;
          const px = curPos.x - Math.cos(angleRad) * backOffset + (Math.random() - 0.5) * 6;
          const py = curPos.y - Math.sin(angleRad) * backOffset + (Math.random() - 0.5) * 6;

          const newParticle: Particle = {
            id: ++particleIdRef.current,
            x: px,
            y: py,
            vx: -Math.cos(angleRad) * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 1.5,
            vy: -Math.sin(angleRad) * (Math.random() * 2 + 1) + (Math.random() - 0.5) * 1.5,
            size: Math.random() * 4 + 2,
            opacity: 0.9,
            color: colors[Math.floor(Math.random() * colors.length)] || '#38BDF8',
          };

          setParticles((prev) => [...prev.slice(-35), newParticle]);
        }

        if (rawT < 1) {
          animFrameRef.current = requestAnimationFrame(animateFlight);
        } else {
          // Flight Complete -> Impact & Energy Loop
          handleCollision(targetPoint);
        }
      };

      animFrameRef.current = requestAnimationFrame(animateFlight);
    }, 120);
  }, [containerRef, buttonRef, inputRef, prefersReducedMotion, onAnimationComplete]);

  // Step 3: Collision, Impact Flash & Particle Burst
  const handleCollision = (point: Point) => {
    setPhase('collided');
    if (onImpact) onImpact();

    // Spawn 24 radial impact sparks
    const impactSparks: Particle[] = [];
    const colors = ['#00F5FF', '#38BDF8', '#60A5FA', '#F472B6', '#FFFFFF'];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      impactSparks.push({
        id: ++particleIdRef.current,
        x: point.x,
        y: point.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 2,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)] || '#00F5FF',
      });
    }
    setParticles((prev) => [...prev, ...impactSparks]);

    // Step 4: Start traveling border energy pulse (2 rounds)
    setTimeout(() => {
      setPhase('energy');
      setEnergyProgress(0);

      const ENERGY_DURATION = 1500; // 2 complete loops around input field
      const startEnergyTime = performance.now();

      const animateEnergy = (now: number) => {
        const elapsed = now - startEnergyTime;
        const progress = Math.min(1, elapsed / ENERGY_DURATION);
        setEnergyProgress(progress);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animateEnergy);
        } else {
          setPhase('complete');
          setTimeout(() => {
            setPhase('idle');
            setParticles([]);
            onAnimationComplete();
          }, 200);
        }
      };

      animFrameRef.current = requestAnimationFrame(animateEnergy);
    }, 80);
  };

  // Particle Physics Update Loop
  useEffect(() => {
    if (phase === 'idle' || phase === 'complete') return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.04,
            size: Math.max(0.5, p.size - 0.08),
          }))
          .filter((p) => p.opacity > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [phase]);

  // Trigger when isLaunching prop changes
  useEffect(() => {
    if (isLaunching && phase === 'idle') {
      startAnimation();
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isLaunching, phase, startAnimation]);

  if (phase === 'idle') return null;

  // Calculate SVG perimeter for energy border
  const perimeter = 2 * (inputRect.width + inputRect.height);
  const strokeDashoffset = -energyProgress * perimeter * 2; // 2 full revolutions

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Particle Canvas / Elements */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Flying Rocket Element */}
      {(phase === 'charging' || phase === 'flying') && (
        <div
          className="absolute pointer-events-none will-change-transform flex items-center justify-center"
          style={{
            left: `${rocketPos.x}px`,
            top: `${rocketPos.y}px`,
            transform: `translate(-50%, -50%) rotate(${rocketPos.angle}deg) scale(${rocketPos.scale})`,
            transition: phase === 'charging' ? 'transform 120ms ease-in' : 'none',
          }}
        >
          {/* Neon Glow halo */}
          <div className="absolute inset-0 -m-3 rounded-full bg-cyan-400/30 blur-md animate-pulse pointer-events-none" />

          {/* Engine Exhaust Flame Flare */}
          {phase === 'flying' && (
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '8px',
                height: '22px',
                background: 'linear-gradient(to bottom, #FFFFFF 0%, #00F5FF 40%, #3B82F6 80%, transparent 100%)',
                borderRadius: '50%',
                filter: 'drop-shadow(0 0 8px #00F5FF)',
              }}
            />
          )}

          {/* Rocket Icon Container */}
          <div className="relative w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.75)]">
            <Rocket className="w-5 h-5 text-cyan-300 fill-cyan-400/30" />
          </div>
        </div>
      )}

      {/* Impact Collision Flash Ring */}
      {phase === 'collided' && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${rocketPos.x}px`,
            top: `${rocketPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-16 h-16 rounded-full border-2 border-cyan-400 bg-cyan-400/20 animate-ping" />
          <div className="absolute inset-0 -m-4 rounded-full bg-white/40 blur-sm animate-pulse" />
        </div>
      )}

      {/* Traveling Neon Energy Border on Input Wrapper */}
      {(phase === 'energy' || phase === 'collided') && inputRect.width > 0 && (
        <svg
          className="absolute pointer-events-none"
          style={{
            left: `${inputRect.x}px`,
            top: `${inputRect.y}px`,
            width: `${inputRect.width}px`,
            height: `${inputRect.height}px`,
            overflow: 'visible',
          }}
        >
          <defs>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F5FF" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Underlay Ambient Glow Path */}
          <rect
            x="0"
            y="0"
            width={inputRect.width}
            height={inputRect.height}
            rx="16"
            ry="16"
            fill="none"
            stroke="url(#energyGrad)"
            strokeWidth="3"
            filter="url(#cyanGlow)"
            strokeDasharray={`${perimeter * 0.35} ${perimeter * 0.65}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Core White-Hot Traveling Arc */}
          <rect
            x="0"
            y="0"
            width={inputRect.width}
            height={inputRect.height}
            rx="16"
            ry="16"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeDasharray={`${perimeter * 0.15} ${perimeter * 0.85}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      )}
    </div>
  );
};
