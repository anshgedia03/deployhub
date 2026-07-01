"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import introJs from "intro.js";
import "intro.js/minified/introjs.min.css";
import { Compass } from "lucide-react";
import { usePathname } from "@/i18n/routing";
import { useEffect, useRef, useCallback } from "react";
import { PAGE_TOURS } from "@/constants/tour-button";


import { useTranslations, useLocale } from "next-intl";


const TOUR_CONFIG = {
  HIDE_BACK_ON_FIRST_STEP: true,
  SHOW_HEADER_CLOSE_BUTTON: true,
  SHOW_HEADER_ICON: true,
  SHOW_PROGRESS: false,
  SHOW_BULLETS: true,
  EXIT_ON_OVERLAY_CLICK: true,
  OVERLAY_OPACITY: 0.55,
  ACTIVE_BULLET_SHAPE: "rounded",
  AUTO_START_DELAY: 2000,
} as const;

const getBulletShapeStyles = (shape: "rounded") => {
  const base = `
    .introjs-tooltip.app-tour-tooltip .introjs-bullets ul li a {
      background: #e0e0e0;
      width: 8px;
      height: 8px;
      transition: all 0.2s ease;
    }
    .introjs-tooltip.app-tour-tooltip .introjs-bullets ul li a.active {
      background: #6C3BC9;
      width: 40px;
      height: 10px;
    }
  `;

  switch (shape) {
    case "rounded":
      return `${base}
        .introjs-tooltip.app-tour-tooltip .introjs-bullets ul li a { border-radius: 4px; }
        .introjs-tooltip.app-tour-tooltip .introjs-bullets ul li a.active { 
          border-radius: 6px; 
          width: 14px;
        }
      `;
    default:
      return `${base}
        .introjs-tooltip.app-tour-tooltip .introjs-bullets ul li a { border-radius: 50%; }
        .introjs-tooltip.app-tour-tooltip .introjs-bullets ul li a.active { border-radius: 50%; }
      `;
  }
};

const TOUR_STYLES = `
  .introjs-tooltip.app-tour-tooltip {
    border: 1px solid white;
    border-radius: 14px;
    min-width: 340px;
    background: #ffffff;
    box-shadow: 0 16px 48px rgba(60, 30, 120, 0.15);
    overflow: hidden;
    font-family: var(--font-sans), system-ui, sans-serif;
  }
  .introjs-tooltip.app-tour-tooltip .introjs-tooltip-header {
    border-bottom: none;
    padding: 16px 16px 14px;
    background: #6C3BC9;
    display: flex;
    justify-content: space-between;
    align-items: center;                /* changed to center to align icon and title vertically */
    position: relative;
  }
  .introjs-tooltip.app-tour-tooltip .introjs-tooltip-title {
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    margin: 0;
    padding-right: 32px;               /* space for close button */
    flex: 1;                           /* allow title to take remaining space */
  }
  
  /* New icon container before title */
  .tour-header-icon {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    flex-shrink: 0;
    color: #ffffff;
  }
  .tour-header-icon svg {
    width: 16px;
    height: 16px;
  }
  
  .introjs-tooltip.app-tour-tooltip .introjs-skipbutton {
    display: none !important;
  }
  
  .introjs-tooltip.app-tour-tooltip .tour-header-close {
    position: absolute;
    top: 16px;
    right: 12px;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    border-radius: 50%;
    width: 27px;
    height: 27px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s;
    color: #ffffff;
    z-index: 1;
  }
  .introjs-tooltip.app-tour-tooltip .tour-header-close:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  .introjs-tooltip.app-tour-tooltip .tour-header-close svg {
    width: 16px;
    height: 16px;
  }
  
  /* Flex layout for buttons container */
  .introjs-tooltip.app-tour-tooltip .introjs-tooltipbuttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 4px 16px 12px;
    background: #ffffff;
    border-top: none;
    gap: 8px;
  }

  .introjs-tooltip.app-tour-tooltip .introjs-bullets {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 5px 10px 0 10px;
  }
  .introjs-tooltip.app-tour-tooltip .introjs-bullets ul {
    display: flex;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  ${getBulletShapeStyles(TOUR_CONFIG.ACTIVE_BULLET_SHAPE)}

  .introjs-tooltip.app-tour-tooltip .introjs-bullets ul li a:hover {
    background: #b0a0d0;
  }

  .tour-step-counter {
    font-size: 13px;
    color: #555;
    margin-right: auto;
    white-space: nowrap;
  }

  .introjs-tooltip.app-tour-tooltip .introjs-nextbutton,
  .introjs-tooltip.app-tour-tooltip .introjs-donebutton {
    background: #6C3BC9;
    color: #ffffff;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    text-shadow: none;
    box-shadow: none;
    cursor: pointer;
    transition: background 0.2s;
  }
  .introjs-tooltip.app-tour-tooltip .introjs-nextbutton:hover,
  .introjs-tooltip.app-tour-tooltip .introjs-donebutton:hover {
    background: #5730a0;
  }
  .introjs-tooltip.app-tour-tooltip .introjs-prevbutton {
    background: transparent;
    color: #777;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    transition: opacity 0.2s, visibility 0.2s;
  }

  .introjs-tooltip.app-tour-tooltip .introjs-prevbutton.hidden,
  .introjs-tooltip.app-tour-tooltip .introjs-prevbutton[disabled] {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    width: 0;
    padding: 0;
    margin: 0;
    border: none;
  }

  .tour-skip-btn {
    flex-basis: 100%;
    order: 99;
    margin-top: 8px;
    background: none;
    border: none;
    color: #777;
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
    text-align: center;
    transition: color 0.2s;
  }
  .tour-skip-btn:hover {
    color: #555;
  }

  .introjs-tooltip.app-tour-tooltip .introjs-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    display: none;
  }
`;

export function TourButton() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Header");
  const tTour = useTranslations("Tour");
  const introRef = useRef<ReturnType<typeof introJs> | null>(null);
  const stylesInjected = useRef(false);
  const totalStepsRef = useRef(0);

  useEffect(() => {
    if (!stylesInjected.current && typeof document !== "undefined") {
      if (!document.querySelector("style[data-tour-styles]")) {
        const styleEl = document.createElement("style");
        styleEl.setAttribute("data-tour-styles", "true");
        styleEl.textContent = TOUR_STYLES;
        document.head.appendChild(styleEl);
      }
      stylesInjected.current = true;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (introRef.current) {
        introRef.current.exit();
        introRef.current = null;
      }
    };
  }, [pathname]);

  const updatePrevButtonVisibility = useCallback((intro: ReturnType<typeof introJs>) => {
    if (!TOUR_CONFIG.HIDE_BACK_ON_FIRST_STEP) return;

    const currentStep = intro.getCurrentStep();
    const prevButton = document.querySelector<HTMLButtonElement>(
      ".introjs-tooltip.app-tour-tooltip .introjs-prevbutton"
    );

    if (prevButton) {
      if (currentStep === 0) {
        prevButton.classList.add("hidden");
        prevButton.setAttribute("aria-hidden", "true");
        prevButton.setAttribute("tabindex", "-1");
      } else {
        prevButton.classList.remove("hidden");
        prevButton.removeAttribute("aria-hidden");
        prevButton.removeAttribute("tabindex");
      }
    }
  }, []);

  // ✨ Inject custom close (×) button into header
  const addHeaderCloseButton = useCallback((intro: ReturnType<typeof introJs>) => {
    if (!TOUR_CONFIG.SHOW_HEADER_CLOSE_BUTTON) return;

    setTimeout(() => {
      const header = document.querySelector(".introjs-tooltip.app-tour-tooltip .introjs-tooltip-header");

      if (header && !header.querySelector(".tour-header-close")) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "tour-header-close";
        closeBtn.type = "button";
        closeBtn.setAttribute("aria-label", "Close tour");
        closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
        closeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          intro.exit();
        };
        header.appendChild(closeBtn);
      }
    }, 0);
  }, []);

  // 🧭 Inject compass icon before the title
  const addHeaderIcon = useCallback(() => {
    if (!TOUR_CONFIG.SHOW_HEADER_ICON) return;

    setTimeout(() => {
      const header = document.querySelector(".introjs-tooltip.app-tour-tooltip .introjs-tooltip-header");
      if (!header) return;

      if (!header.querySelector(".tour-header-icon")) {
        const title = header.querySelector(".introjs-tooltip-title");
        const icon = document.createElement("span");
        icon.className = "tour-header-icon";
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/></svg>`;

        // Insert before the title element
        if (title) {
          header.insertBefore(icon, title);
        } else {
          header.prepend(icon); // fallback
        }
      }
    }, 0);
  }, []);

  // Inject "Skip Tour" into footer
  const addCustomSkipButton = useCallback((intro: ReturnType<typeof introJs>) => {
    setTimeout(() => {
      const tooltip = document.querySelector(".introjs-tooltip.app-tour-tooltip");
      const buttonsContainer = tooltip?.querySelector(".introjs-tooltipbuttons");

      if (buttonsContainer && !buttonsContainer.querySelector(".tour-skip-btn")) {
        const skipBtn = document.createElement("button");
        skipBtn.className = "tour-skip-btn";
        skipBtn.textContent = tTour("skip");
        skipBtn.type = "button";
        skipBtn.onclick = () => intro.exit();
        buttonsContainer.appendChild(skipBtn);
      }
    }, 0);
  }, [tTour]);

  const addStepCounter = useCallback((intro: ReturnType<typeof introJs>) => {
    setTimeout(() => {
      const container = document.querySelector(".introjs-tooltip.app-tour-tooltip .introjs-tooltipbuttons");
      if (!container) return;

      const currentStep = intro.getCurrentStep();
      const total = totalStepsRef.current;
      const progressText = `${currentStep! + 1} ${tTour("of")} ${total}`;

      let counter = container.querySelector<HTMLSpanElement>(".tour-step-counter");

      if (!counter) {
        counter = document.createElement("span");
        counter.className = "tour-step-counter";
        const prevBtn = container.querySelector(".introjs-prevbutton");
        if (prevBtn) {
          container.insertBefore(counter, prevBtn);
        } else {
          container.appendChild(counter);
        }
      }

      counter.textContent = progressText;
    }, 0);
  }, [tTour]);

  const startTour = useCallback(() => {
    if (introRef.current) {
      introRef.current.exit();
      introRef.current = null;
    }

    // Normalize pathname to ensure it matches PAGE_TOURS keys (remove trailing slash)
    const normalizedPathname = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    const pageSteps = PAGE_TOURS[normalizedPathname] ?? [];
    const mappedSteps = pageSteps
      .map((step) => {
        // Use current locale to pick the right content
        const stepTitle = (step.title as any)[locale] || step.title.en;
        const stepIntro = (step.intro as any)[locale] || step.intro.en;

        if (!step.element) {
          // If no element is provided, intro.js shows a centered tooltip
          return { title: stepTitle, intro: stepIntro };
        }
        try {
          const el = document.querySelector<HTMLElement>(step.element);
          if (!el) {
            console.warn(`Tour element not found: ${step.element}`);
            return null;
          }
          return { element: el, title: stepTitle, intro: stepIntro };
        } catch (e) {
          console.error(`Invalid selector: ${step.element}`, e);
          return null;
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (!mappedSteps.length) {
      console.warn("No valid tour steps found for path:", pathname);
      return false;
    }

    const intro = introJs();
    introRef.current = intro;
    totalStepsRef.current = mappedSteps.length;

    intro.setOptions({
      showProgress: false,
      showBullets: TOUR_CONFIG.SHOW_BULLETS,
      nextLabel: tTour("next"),
      prevLabel: tTour("back"),
      doneLabel: tTour("done"),
      exitOnOverlayClick: TOUR_CONFIG.EXIT_ON_OVERLAY_CLICK,
      exitOnEsc: true,
      overlayOpacity: TOUR_CONFIG.OVERLAY_OPACITY,
      tooltipClass: "app-tour-tooltip",
      steps: mappedSteps,
    });

    intro.onAfterChange((targetElement: HTMLElement) => {
      updatePrevButtonVisibility(intro);
      addHeaderIcon();                     // ensure icon appears
      addHeaderCloseButton(intro);
      addCustomSkipButton(intro);
      addStepCounter(intro);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    intro.onExit(() => {
      introRef.current = null;
    });

    intro.start();
    setTimeout(() => {
      updatePrevButtonVisibility(intro);
      addHeaderIcon();
      addHeaderCloseButton(intro);
      addCustomSkipButton(intro);
      addStepCounter(intro);
    }, 50);

    return true;
  }, [pathname, locale, tTour, updatePrevButtonVisibility, addHeaderCloseButton, addCustomSkipButton, addStepCounter, addHeaderIcon]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Normalize pathname for key lookup
    const normalizedPathname = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

    // Check if tour has already been shown for this page
    const tourKey = `has_shown_tour_${normalizedPathname}`;
    const hasShown = localStorage.getItem(tourKey);

    if (!hasShown && PAGE_TOURS[normalizedPathname]) {
      const timer = setTimeout(() => {
        // Try to start the tour. We don't mark it as shown if no elements were found,
        // allowing it to retry on next visit or after data loads.
        const started = startTour();
        if (started) {
          localStorage.setItem(tourKey, "true");
        }
      }, TOUR_CONFIG.AUTO_START_DELAY);

      return () => clearTimeout(timer);
    }
  }, [pathname, startTour]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          id="tour-header-button"
          onClick={startTour}
          variant="outline"
          className="text-purple-600 border-purple-200 bg-primary-foreground hover:bg-purple-50 text-xs h-8 sm:h-9 md:px-2 sm:px-4"
          aria-label="Start product tour"
        >
          <div className="flex flex-row gap-1 items-center">
            <Compass className="h-4 w-4" />
            <span className="hidden sm:inline">{t("viewTour")}</span>
          </div>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-xs">{t("viewTour")}</span>
      </TooltipContent>
    </Tooltip>
  );
}