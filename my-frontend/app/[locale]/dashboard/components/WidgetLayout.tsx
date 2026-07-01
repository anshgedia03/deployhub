"use client";

import { Download, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";

interface WidgetLayoutProps {
  title: string;
  description?: string;
  isResizing?: boolean;
  isMaximized?: boolean;
  widgetRef?: React.RefCallback<HTMLDivElement>;
  onMaximize?: () => void;
  onDownload?: () => void;
  onRemove?: () => void;
  onClick?: () => void;
  children: React.ReactNode;
}

function useMergedRef<T>(forwardedRef?: React.RefCallback<T>) {
  const internalRef = useRef<T>(null);
  const callbackRef = useCallback(
    (node: T | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      }
    },
    [forwardedRef]
  );
  return { internalRef, callbackRef };
}

export function WidgetLayout({
  title,
  description,
  isResizing,
  widgetRef,
  onMaximize,
  onDownload,
  onRemove,
  onClick,
  children,
  isMaximized,
}: WidgetLayoutProps) {
  const { internalRef: contentRef, callbackRef } = useMergedRef<HTMLDivElement>(widgetRef);

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onDownload === "function") {
      onDownload();
      return;
    }

    const container = contentRef.current;
    if (!container) return;

    // Find the first SVG (Recharts renders SVG charts)
    const svg = container.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/\s+/g, "_").toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [onDownload, contentRef, title]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onRemove === "function") {
      onRemove();
    }
  }, [onRemove]);

  const handleMaximize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof onMaximize === "function") {
      onMaximize();
    }
  }, [onMaximize]);

  return (
    <Card
      className={cn(
        "w-full h-full flex flex-col shadow-sm border bg-card overflow-hidden transition-colors duration-150",
        "p-2 sm:p-3 md:p-4 border border-border!",
        isResizing ? "border-red-300 bg-red-50" : "border-gray-100 bg-white",
        onClick && "cursor-pointer transition-all"
      )}
      onDoubleClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-2 sm:mb-3">
        <div className="min-w-0">
          <CardTitle className="text-xs sm:text-sm font-semibold text-foreground leading-tight truncate">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
              {description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-gray-500 hover:text-gray-900 transition-colors"
            onClick={handleMaximize}
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-gray-500 hover:text-gray-900 transition-colors"
            onClick={handleDownload}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            onClick={handleRemove}
            title="Remove Widget"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 p-0" ref={callbackRef}>
        {children}
      </CardContent>
    </Card>
  );
}
