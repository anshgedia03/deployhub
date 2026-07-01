'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from 'react';
import {
  CircleCheck,
  CircleX,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

export const TOAST_DURATION_MS = 4000;
export const TRACK_CLUSTERING_TOAST_DURATION_MS = 2000;
const MAX_TOASTS = 5;
const DEDUP_WINDOW_MS = 500;
const EXIT_TRANSITION_MS = 250;

const STACK_OFFSET_Y = 10;
const STACK_SCALE_DELTA = 0.02;
const STACK_OPACITY_DELTA = 0.06;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
  createdAt: number;
  open: boolean;
  durationMs?: number;
}

export type ShowToastOptions = {
  durationMs?: number;
};

interface ToastContextType {
  showToast: (
    message: string,
    severity?: ToastSeverity,
    options?: ShowToastOptions
  ) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let globalShowToast:
  | ((
    message: string,
    severity?: ToastSeverity,
    options?: ShowToastOptions
  ) => void)
  | null = null;

export const showToastGlobal = (
  message: string,
  severity: ToastSeverity = 'info',
  options?: ShowToastOptions
) => {
  if (globalShowToast) {
    globalShowToast(message, severity, options);
  } else {
    console.log(`[Toast] ${severity.toUpperCase()}: ${message}`);
  }
};

const SEVERITY_TOKENS: Record<
  ToastSeverity,
  { icon: React.ElementType; accentColor: string; bg: string; border: string; progressColor: string; textColor: string }
> = {
  success: {
    icon: CircleCheck,
    accentColor: '#22C55E',
    bg: '#EDFCF2',
    border: '#D1FADF',
    progressColor: '#22C55E',
    textColor: '#16A34A',
  },
  error: {
    icon: CircleX,
    accentColor: '#EF4444',
    bg: '#FEF2F2',
    border: '#FEE2E2',
    progressColor: '#EF4444',
    textColor: '#DC2626',
  },
  warning: {
    icon: AlertTriangle,
    accentColor: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FEF3C7',
    progressColor: '#F59E0B',
    textColor: '#D97706',
  },
  info: {
    icon: Info,
    accentColor: '#3B82F6',
    bg: '#EFF6FF',
    border: '#DBEAFE',
    progressColor: '#3B82F6',
    textColor: '#2563EB',
  },
};

interface ToastItemProps {
  toast: Toast;
  index: number;
  totalCount: number;
  onClose: (id: string) => void;
  onExited: (id: string) => void;
  duration: number;
}

const ToastItem = memo(function ToastItem({
  toast,
  index,
  totalCount,
  onClose,
  onExited,
  duration,
}: ToastItemProps) {
  const tokens = SEVERITY_TOKENS[toast.severity];
  const Icon = tokens.icon;

  const isStacked = totalCount > 1;
  const depth = isStacked ? totalCount - 1 - index : 0;
  const stackOffsetY = depth * STACK_OFFSET_Y;
  const stackScale = isStacked ? 1 - depth * STACK_SCALE_DELTA : 1;
  const stackOpacity = isStacked ? 1 - depth * STACK_OPACITY_DELTA : 1;

  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  const remainingRef = useRef(duration);
  const startedAtRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  const startProgress = useCallback(() => {
    const totalRemainingAtResume = remainingRef.current;
    const resumeAt = Date.now();

    function tick() {
      if (pausedRef.current) return;
      const elapsedSinceResume = Date.now() - resumeAt;
      const currentRemaining = Math.max(0, totalRemainingAtResume - elapsedSinceResume);
      const pct = (currentRemaining / duration) * 100;

      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [duration]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onClose(toast.id);
    }, remainingRef.current);
    startedAtRef.current = Date.now();
  }, [onClose, toast.id]);

  useEffect(() => {
    setIsVisible(true);
    startTimer();
    startProgress();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [startTimer, startProgress]);

  useEffect(() => {
    if (!toast.open) {
      setIsVisible(false);
      const timeout = setTimeout(() => onExited(toast.id), EXIT_TRANSITION_MS);
      return () => clearTimeout(timeout);
    }
  }, [toast.open, toast.id, onExited]);

  const handleMouseEnter = useCallback(() => {
    pausedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const elapsed = Date.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  }, []);

  const handleMouseLeave = useCallback(() => {
    pausedRef.current = false;
    startTimer();
    startProgress();
  }, [startTimer, startProgress]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartXRef.current;
    const dy = t.clientY - touchStartYRef.current;
    if (dy < -40 || Math.abs(dx) > 80) {
      onClose(toast.id);
    }
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => onClose(toast.id)}
      className={cn(
        'fixed top-4 right-4 sm:top-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[380px] z-[9999] transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-auto select-none active:scale-[0.98] active:opacity-90',
        isVisible ? 'opacity-100' : 'opacity-0 translate-x-8 -translate-y-2 scale-95'
      )}
      style={{
        transform: `translateY(${stackOffsetY}px) scale(${stackScale})`,
        transformOrigin: 'top right',
        opacity: isVisible ? stackOpacity : 0,
        zIndex: 9999 + index,
      }}
    >
      <div
        className="relative overflow-hidden rounded-[16px] border shadow-md p-3 sm:py-3.5 sm:px-4 pr-10"
        style={{
          backgroundColor: tokens.bg,
          borderColor: tokens.border,
          color: tokens.textColor,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0" style={{ color: tokens.accentColor }}>
            <Icon className="w-[22px] h-[22px]" strokeWidth={2.25} />
          </div>
          <div className="flex-1 text-[15px] font-medium leading-relaxed break-words">
            {toast.message}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(toast.id);
          }}
          className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-md transition-all opacity-60 hover:opacity-100 hover:bg-black/5"
          style={{ color: tokens.accentColor }}
        >
          <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
        </button>

        <div className="absolute bottom-0 left-3 right-3 h-[2.5px] rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full transition-none"
            style={{
              width: `${progress}%`,
              backgroundColor: tokens.progressColor,
              opacity: 0.8,
            }}
          />
        </div>
      </div>
    </div>
  );
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastShownRef = useRef<Map<string, number>>(new Map());

  const showToast = useCallback(
    (msg: string, sev: ToastSeverity = 'info', options?: ShowToastOptions) => {
      const dedupKey = `${msg}|${sev}`;
      const now = Date.now();
      const last = lastShownRef.current.get(dedupKey);
      if (last && now - last < DEDUP_WINDOW_MS) return;
      lastShownRef.current.set(dedupKey, now);

      const id = `toast-${now}-${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => {
        let next = prev;
        if (prev.length >= MAX_TOASTS) {
          next = prev.map((t, i) => (i === 0 ? { ...t, open: false } : t));
        }
        return [
          ...next,
          {
            id,
            message: msg,
            severity: sev,
            createdAt: now,
            open: true,
            ...(options?.durationMs != null
              ? { durationMs: options.durationMs }
              : {}),
          },
        ];
      });
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, open: false } : t))
    );
  }, []);

  const handleExited = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            totalCount={toasts.length}
            onClose={dismissToast}
            onExited={handleExited}
            duration={toast.durationMs ?? TOAST_DURATION_MS}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}