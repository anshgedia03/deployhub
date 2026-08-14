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
  containerRef: React.RefObject<HTMLDivElement | null>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  inputRef: React.RefObject<HTMLDivElement | null>;
}

export const RocketLaunchAnimation: React.FC<RocketLaunchAnimationProps> = ({
  isLaunching,
  onAnimationComplete,
  containerRef,
  buttonRef,
  inputRef,
}) => {
  const [phase, setPhase] = useState<'idle' | 'charging' | 'flying' | 'collided' | 'energy' | 'complete'>('idle');
  const [rocketPos, setRocketPos] = useState<{ x: number; y: number; angle: number; scale: number }>({
    x: 0,
    y: 0,
    angle: -45,
    scale: 1,
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [energyProgress, setEnergyProgress] = useState(0);
  const [inputRect, setInputRect] = useState<{ width: number; height: number; x: number; y: number }>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pathPointsRef = useRef<Point[]>([]);

  // Cubic Bezier curve evaluator
  const getBezierPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    return {
      x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
    };
  };

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
      // Reduced motion fallback: quick flash & energy pulse
      setPhase('collided');
      setTimeout(() => {
        setPhase('energy');
        setEnergyProgress(0);
        const startTime = performance.now();
        const duration = 1200; // 1 subtle round

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

      // Dynamic control points creating a sweeping arc across the chat area
      const p0 = { ...startPoint };
      const p1: Point = {
        x: Math.max(40, p0.x - W * 0.1),
        y: Math.max(40, H * 0.25),
      };
      const p2: Point = {
        x: Math.min(W - 40, W * 0.85),
        y: Math.max(30, H * 0.15),
      };
      const p3: Point = {
        x: Math.min(W - 30, targetPoint.x + 40),
        y: targetPoint.y - 120,
      };
      const p4 = { ...targetPoint };

      pathPointsRef.current = [p0, p1, p2, p3, p4];
      startTimeRef.current = performance.now();

      const FLIGHT_DURATION = 1350; // Total smooth flight time

      const animateFlight = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const rawT = Math.min(1, elapsed / FLIGHT_DURATION);
        // Ease in-out quad for dynamic acceleration
        const t = rawT < 0.5 ? 2 * rawT * rawT : -1 + (4 - 2 * rawT) * rawT;

        // Composite Bezier: Segment 1 (0 to 0.55) and Segment 2 (0.55 to 1.0)
        let curPos: Point;
        let nextPos: Point;

        if (t <= 0.55) {
          const segT = t / 0.55;
          const nextT = Math.min(1, segT + 0.02);
          curPos = getBezierPoint(p0, p1, p2, p3, segT);
          nextPos = getBezierPoint(p0, p1, p2, p3, nextT);
        } else {
          const segT = (t - 0.55) / 0.45;
          const nextT = Math.min(1, segT + 0.02);
          curPos = getBezierPoint(p2, p3, { x: targetPoint.x + 10, y: targetPoint.y - 40 }, p4, segT);
          nextPos = getBezierPoint(p2, p3, { x: targetPoint.x + 10, y: targetPoint.y - 40 }, p4, nextT);
        }

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

        // Emit exhaust trail particles
        if (Math.random() > 0.25) {
          setParticles((prev) => [
            ...prev.slice(-18),
            {
              id: Math.random(),
              x: curPos.x - dx * 0.4 + (Math.random() - 0.5) * 6,
              y: curPos.y - dy * 0.4 + (Math.random() - 0.5) * 6,
              vx: -dx * 0.15 + (Math.random() - 0.5) * 1.5,
              vy: -dy * 0.15 + (Math.random() - 0.5) * 1.5,
              size: Math.random() * 4 + 2,
              opacity: 0.9,
              color: Math.random() > 0.5 ? '#38bdf8' : '#00f0ff',
            },
          ]);
        }

        if (rawT < 1) {
          animFrameRef.current = requestAnimationFrame(animateFlight);
        } else {
          // Collision phase
          handleCollision(targetPoint);
        }
      };

      animFrameRef.current = requestAnimationFrame(animateFlight);
    }, 120);
  }, [containerRef, buttonRef, inputRef, onAnimationComplete, prefersReducedMotion]);

  // Handle Collision & Sparks
  const handleCollision = (targetPoint: Point) => {
    setPhase('collided');

    // Create explosion sparks
    const impactSparks: Particle[] = Array.from({ length: 14 }).map((_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.5;
      return {
        id: Math.random(),
        x: targetPoint.x,
        y: targetPoint.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        opacity: 1,
        color: i % 2 === 0 ? '#38bdf8' : '#67e8f9',
      };
    });
    setParticles(impactSparks);

    // After brief collision impact flash (100ms), start the 2-round energy border animation
    setTimeout(() => {
      setPhase('energy');
      setEnergyProgress(0);

      const ENERGY_DURATION = 1600; // ~800ms per round * 2 rounds = 1600ms
      const energyStartTime = performance.now();

      const animateEnergy = (now: number) => {
        const elapsed = now - energyStartTime;
        const progress = Math.min(2, (elapsed / ENERGY_DURATION) * 2); // 0 to 2 for exactly 2 full rounds
        setEnergyProgress(progress);

        if (progress < 2) {
          animFrameRef.current = requestAnimationFrame(animateEnergy);
        } else {
          // Final pulse flash
          setPhase('complete');
          setTimeout(() => {
            setPhase('idle');
            setParticles([]);
            onAnimationComplete();
          }, 350);
        }
      };

      animFrameRef.current = requestAnimationFrame(animateEnergy);
    }, 100);
  };

  // Trigger when isLaunching becomes true
  useEffect(() => {
    if (isLaunching && phase === 'idle') {
      startAnimation();
    }
  }, [isLaunching, phase, startAnimation]);

  // Particle physics loop
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            opacity: p.opacity - 0.07,
            size: Math.max(0, p.size - 0.15),
          }))
          .filter((p) => p.opacity > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  if (phase === 'idle') return null;

  // SVG perimeter calculations for rounded pill input border
  const W = Math.max(0, inputRect.width - 2);
  const H = Math.max(0, inputRect.height - 2);
  const R = H / 2;
  const perimeter = 2 * Math.max(0, W - 2 * R) + 2 * Math.PI * R;
  const strokeLength = perimeter * 0.28; // Length of the traveling energy beam (28% of perimeter)
  // Travel distance: starts at 0 and travels 2 * perimeter
  const strokeOffset = -energyProgress * perimeter;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Particles & Sparks */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none blur-[0.5px]"
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

      {/* Flying Rocket */}
      {(phase === 'charging' || phase === 'flying') && (
        <div
          className="absolute pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: `${rocketPos.x}px`,
            top: `${rocketPos.y}px`,
            transform: `translate(-50%, -50%) rotate(${rocketPos.angle}deg) scale(${rocketPos.scale})`,
            filter: 'drop-shadow(0 0 10px #00f0ff) drop-shadow(0 0 20px #38bdf8)',
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Engine plume flame */}
            <div className="absolute -bottom-2.5 -left-2.5 w-3 h-3 rounded-full bg-cyan-400 blur-[2px] animate-pulse opacity-90" />
            <Rocket className="w-5 h-5 text-cyan-300 fill-cyan-400/20" />
          </div>
        </div>
      )}

      {/* Collision Impact Flash */}
      {phase === 'collided' && (
        <div
          className="absolute rounded-full pointer-events-none animate-ping duration-150"
          style={{
            left: `${inputRect.x + inputRect.width - 24}px`,
            top: `${inputRect.y + inputRect.height / 2}px`,
            width: '36px',
            height: '36px',
            background: 'radial-gradient(circle, rgba(0,240,255,0.9) 0%, rgba(56,189,248,0.4) 60%, transparent 100%)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}

      {/* Traveling Energy Border SVG Overlay */}
      {(phase === 'energy' || phase === 'complete') && inputRect.width > 0 && (
        <div
          className={`absolute pointer-events-none transition-all duration-300 ${
            phase === 'complete' ? 'shadow-[0_0_25px_rgba(6,182,212,0.6)] rounded-full' : ''
          }`}
          style={{
            left: `${inputRect.x}px`,
            top: `${inputRect.y}px`,
            width: `${inputRect.width}px`,
            height: `${inputRect.height}px`,
          }}
        >
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${inputRect.width} ${inputRect.height}`}
          >
            <defs>
              <linearGradient id="rocketEnergyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
              <filter id="rocketNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Glowing neon traveling line */}
            <rect
              x="1"
              y="1"
              width={W}
              height={H}
              rx={R}
              ry={R}
              fill="none"
              stroke="url(#rocketEnergyGradient)"
              strokeWidth="2"
              strokeDasharray={`${strokeLength} ${perimeter - strokeLength}`}
              strokeDashoffset={strokeOffset}
              filter="url(#rocketNeonGlow)"
              className="transition-all"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
