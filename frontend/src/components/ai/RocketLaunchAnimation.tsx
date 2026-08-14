"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Rocket } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Particle extends Point {
  id: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface InputBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  collision: Point;
}

interface RocketLaunchAnimationProps {
  isLaunching: boolean;
  onAnimationComplete: () => void;
  onImpact?: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  inputRef: React.RefObject<HTMLDivElement | null>;
}

type Phase = 'idle' | 'charging' | 'flying' | 'impact' | 'energy' | 'complete';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const getSplinePoint = (points: Point[], t: number): Point => {
  const clampedT = clamp(t, 0, 1);
  const segments = points.length - 1;
  const rawIndex = clampedT * segments;
  const index = Math.min(Math.floor(rawIndex), segments - 1);
  const localT = rawIndex - index;
  const p0 = points[Math.max(index - 1, 0)];
  const p1 = points[index];
  const p2 = points[Math.min(index + 1, points.length - 1)];
  const p3 = points[Math.min(index + 2, points.length - 1)];
  const tt = localT * localT;
  const ttt = tt * localT;

  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * localT + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * localT + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt),
  };
};

const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
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
  const [rocket, setRocket] = useState({ x: 0, y: 0, angle: -28, scale: 1, speed: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [energyProgress, setEnergyProgress] = useState(0);
  const [inputBounds, setInputBounds] = useState<InputBounds | null>(null);

  const frameRef = useRef<number | null>(null);
  const timeoutRefs = useRef<number[]>([]);
  const hasImpactedRef = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const clearTimers = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    timeoutRefs.current.forEach((timer) => window.clearTimeout(timer));
    timeoutRefs.current = [];
  }, []);

  const addTimer = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timeoutRefs.current.push(timer);
    return timer;
  }, []);

  const measureScene = useCallback(() => {
    const container = containerRef.current;
    const button = buttonRef.current;
    const input = inputRef.current;

    if (!container || !button || !input) return null;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const padding = 18;
    const safeWidth = Math.max(1, containerRect.width);
    const safeHeight = Math.max(1, containerRect.height);

    const start = {
      x: clamp(buttonRect.left - containerRect.left + buttonRect.width / 2, padding, safeWidth - padding),
      y: clamp(buttonRect.top - containerRect.top + buttonRect.height / 2, padding, safeHeight - padding),
    };

    const radius = Math.max(0, inputRect.height / 2 - 1);
    const arcAngle = Math.PI / 4;
    const inputX = inputRect.left - containerRect.left;
    const inputY = inputRect.top - containerRect.top;
    const rightArcCenter = inputX + inputRect.width - radius - 1;
    const inputCenterY = inputY + inputRect.height / 2;
    const collision = {
      x: clamp(rightArcCenter + Math.cos(arcAngle) * radius, inputX + inputRect.width * 0.72, inputX + inputRect.width - 2),
      y: clamp(inputCenterY + Math.sin(arcAngle) * radius, inputY + 2, inputY + inputRect.height - 2),
    };

    return {
      containerRect,
      start,
      inputBounds: {
        x: inputX,
        y: inputY,
        width: inputRect.width,
        height: inputRect.height,
        collision,
      },
    };
  }, [buttonRef, containerRef, inputRef]);

  const finishAnimation = useCallback(() => {
    setPhase('idle');
    setParticles([]);
    setEnergyProgress(0);
    hasImpactedRef.current = false;
    onAnimationComplete();
  }, [onAnimationComplete]);

  const animateEnergyBorder = useCallback(() => {
    setPhase('energy');
    setEnergyProgress(0);

    const startTime = performance.now();
    const duration = prefersReducedMotion ? 700 : 1640;
    const rounds = prefersReducedMotion ? 1 : 2;

    const step = (now: number) => {
      const progress = clamp((now - startTime) / duration, 0, 1);
      setEnergyProgress(progress * rounds);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
        return;
      }

      setPhase('complete');
      addTimer(finishAnimation, prefersReducedMotion ? 260 : 380);
    };

    frameRef.current = requestAnimationFrame(step);
  }, [addTimer, finishAnimation, prefersReducedMotion]);

  const triggerImpact = useCallback((collisionPoint: Point) => {
    if (hasImpactedRef.current) return;
    hasImpactedRef.current = true;
    onImpact?.();
    setPhase('impact');
    setRocket((prev) => ({ ...prev, x: collisionPoint.x, y: collisionPoint.y, scale: 1.22 }));

    const sparks = Array.from({ length: prefersReducedMotion ? 6 : 16 }, (_, index) => {
      const angle = -Math.PI * 0.9 + (index / 15) * Math.PI * 1.55;
      const speed = Math.random() * 2.4 + 1.2;

      return {
        id: performance.now() + index,
        x: collisionPoint.x,
        y: collisionPoint.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.6 + 1.2,
        opacity: 1,
        color: index % 3 === 0 ? '#e0faff' : index % 2 === 0 ? '#67e8f9' : '#38bdf8',
      };
    });

    setParticles(sparks);
    addTimer(animateEnergyBorder, prefersReducedMotion ? 90 : 150);
  }, [addTimer, animateEnergyBorder, onImpact, prefersReducedMotion]);

  const startAnimation = useCallback(() => {
    clearTimers();

    const scene = measureScene();
    if (!scene) {
      finishAnimation();
      return;
    }

    setInputBounds(scene.inputBounds);
    setParticles([]);
    hasImpactedRef.current = false;

    if (prefersReducedMotion) {
      setRocket({ x: scene.start.x, y: scene.start.y, angle: -28, scale: 1, speed: 0 });
      setPhase('charging');
      addTimer(() => triggerImpact(scene.inputBounds.collision), 140);
      return;
    }

    setPhase('charging');
    setRocket({ x: scene.start.x, y: scene.start.y + 5, angle: -30, scale: 0.84, speed: 0 });

    addTimer(() => {
      setPhase('flying');

      const width = scene.containerRect.width;
      const height = scene.containerRect.height;
      const minX = 18;
      const maxX = Math.max(minX, width - 18);
      const minY = 18;
      const maxY = Math.max(minY, height - 76);
      const roomy = width > 720 && height > 480;

      const waypoints: Point[] = [
        scene.start,
        {
          x: clamp(scene.start.x + width * (roomy ? 0.24 : 0.18), minX, maxX),
          y: clamp(height * 0.18, minY, maxY),
        },
        {
          x: clamp(width * (roomy ? 0.72 : 0.58), minX, maxX),
          y: clamp(height * 0.30, minY, maxY),
        },
        {
          x: clamp(width * (roomy ? 0.34 : 0.28), minX, maxX),
          y: clamp(height * (roomy ? 0.58 : 0.46), minY, maxY),
        },
        {
          x: clamp(width * 0.82, minX, maxX),
          y: clamp(height * 0.20, minY, maxY),
        },
        scene.inputBounds.collision,
      ];

      const startTime = performance.now();
      const duration = roomy ? 1520 : 1180;
      let lastParticleTime = 0;

      const step = (now: number) => {
        const rawT = clamp((now - startTime) / duration, 0, 1);
        const easedT = easeInOutCubic(rawT);
        const current = getSplinePoint(waypoints, easedT);
        const next = getSplinePoint(waypoints, clamp(easedT + 0.015, 0, 1));
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const speed = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 45;
        const impactScale = rawT > 0.9 ? 1.14 - (rawT - 0.9) * 1.6 : 1.04 + speed * 0.015;

        setRocket({
          x: current.x,
          y: current.y,
          angle,
          scale: clamp(impactScale, 0.98, 1.16),
          speed: clamp(speed, 0, 8),
        });

        if (now - lastParticleTime > 38) {
          lastParticleTime = now;
          setParticles((prev) => [
            ...prev.slice(-24),
            {
              id: now + Math.random(),
              x: current.x - dx * 1.1 + (Math.random() - 0.5) * 5,
              y: current.y - dy * 1.1 + (Math.random() - 0.5) * 5,
              vx: -dx * 0.2 + (Math.random() - 0.5) * 0.8,
              vy: -dy * 0.2 + (Math.random() - 0.5) * 0.8,
              size: Math.random() * 3.2 + 1.4,
              opacity: 0.86,
              color: Math.random() > 0.45 ? '#38bdf8' : '#22d3ee',
            },
          ]);
        }

        if (rawT < 1) {
          frameRef.current = requestAnimationFrame(step);
          return;
        }

        triggerImpact(scene.inputBounds.collision);
      };

      frameRef.current = requestAnimationFrame(step);
    }, 130);
  }, [addTimer, clearTimers, finishAnimation, measureScene, prefersReducedMotion, triggerImpact]);

  useEffect(() => {
    if (!isLaunching || phase !== 'idle') return;
    const launchFrame = requestAnimationFrame(startAnimation);
    return () => cancelAnimationFrame(launchFrame);
  }, [isLaunching, phase, startAnimation]);

  useEffect(() => {
    if (!isLaunching) return;

    const handleResize = () => {
      const scene = measureScene();
      if (!scene) return;
      setInputBounds(scene.inputBounds);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLaunching, measureScene]);

  useEffect(() => {
    if (particles.length === 0) return;

    const step = () => {
      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.96,
            vy: particle.vy * 0.96,
            opacity: particle.opacity - 0.055,
            size: Math.max(0, particle.size - 0.08),
          }))
          .filter((particle) => particle.opacity > 0 && particle.size > 0)
      );
    };

    const timer = window.setInterval(step, 16);
    return () => window.clearInterval(timer);
  }, [particles.length]);

  useEffect(() => clearTimers, [clearTimers]);

  if (phase === 'idle' || !inputBounds) return null;

  const borderWidth = Math.max(0, inputBounds.width - 2);
  const borderHeight = Math.max(0, inputBounds.height - 2);
  const radius = Math.max(0, borderHeight / 2);
  const rightArcCenterX = inputBounds.width - radius - 1;
  const centerY = inputBounds.height / 2;
  const startAngle = Math.PI / 4;
  const startX = rightArcCenterX + Math.cos(startAngle) * radius;
  const startY = centerY + Math.sin(startAngle) * radius;
  const perimeter = 2 * Math.max(0, borderWidth - 2 * radius) + 2 * Math.PI * radius;
  const dashLength = perimeter * (prefersReducedMotion ? 0.82 : 0.22);
  const dashOffset = -energyProgress * perimeter;
  const energyPath = [
    `M ${startX} ${startY}`,
    `A ${radius} ${radius} 0 0 1 ${rightArcCenterX} ${centerY + radius}`,
    `H ${radius + 1}`,
    `A ${radius} ${radius} 0 0 1 ${radius + 1} ${centerY - radius}`,
    `H ${rightArcCenterX}`,
    `A ${radius} ${radius} 0 1 1 ${startX} ${startY}`,
  ].join(' ');

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full blur-[0.5px]"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2.6}px ${particle.color}`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {(phase === 'charging' || phase === 'flying' || phase === 'impact') && !prefersReducedMotion && (
        <div
          className="absolute transition-transform duration-100 ease-out"
          style={{
            left: `${rocket.x}px`,
            top: `${rocket.y}px`,
            transform: `translate(-50%, -50%) rotate(${rocket.angle}deg) scale(${rocket.scale})`,
            filter: `drop-shadow(0 0 ${10 + rocket.speed * 1.6}px rgba(34,211,238,0.94)) drop-shadow(0 0 ${20 + rocket.speed * 2}px rgba(14,165,233,0.45))`,
          }}
        >
          <div className="relative grid place-items-center">
            {phase === 'flying' && (
              <span className="absolute h-5 w-2 -translate-x-3 translate-y-3 rounded-full bg-cyan-300/70 blur-[3px]" />
            )}
            <Rocket className="h-5 w-5 text-cyan-200 fill-sky-400/15" />
          </div>
        </div>
      )}

      {phase === 'impact' && (
        <div
          className="absolute rounded-full animate-rocket-impact"
          style={{
            left: `${inputBounds.collision.x}px`,
            top: `${inputBounds.collision.y}px`,
            width: '42px',
            height: '42px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(224,250,255,0.95) 0%, rgba(34,211,238,0.52) 38%, rgba(14,165,233,0.18) 68%, transparent 100%)',
          }}
        />
      )}

      {(phase === 'energy' || phase === 'complete') && (
        <div
          className={`absolute rounded-full transition-opacity duration-300 ${
            phase === 'complete' ? 'animate-rocket-input-final-pulse' : ''
          }`}
          style={{
            left: `${inputBounds.x}px`,
            top: `${inputBounds.y}px`,
            width: `${inputBounds.width}px`,
            height: `${inputBounds.height}px`,
          }}
        >
          <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${inputBounds.width} ${inputBounds.height}`}>
            <defs>
              <linearGradient id="deployhubRocketEnergy" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e0faff" stopOpacity="0" />
                <stop offset="35%" stopColor="#7dd3fc" stopOpacity="0.72" />
                <stop offset="72%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
              <filter id="deployhubRocketGlow" x="-45%" y="-45%" width="190%" height="190%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d={energyPath}
              fill="none"
              stroke="url(#deployhubRocketEnergy)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${dashLength} ${Math.max(1, perimeter - dashLength)}`}
              strokeDashoffset={dashOffset}
              filter="url(#deployhubRocketGlow)"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
