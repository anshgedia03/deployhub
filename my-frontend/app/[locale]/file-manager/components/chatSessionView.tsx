"use client";

import {
  Search,
  FolderPlus,
  Upload,
  CheckCircle2,
  SlidersHorizontal,
  PanelLeft,
  ChevronLeft,
} from "lucide-react";
import { ChatSession } from "@/lib/api/services/chat";

interface ChatSessionViewProps {
  onToggleSidebar: () => void;
  onBack: () => void;
  onOpenTimeline: () => void;
  session: ChatSession;
}

export function ChatSessionView({
  onToggleSidebar,
  onBack,
  onOpenTimeline,
  session,
}: ChatSessionViewProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <main className="w-full h-full shadow-sm p-4 flex flex-col rounded-lg border border-border bg-background-child overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row w-full items-start lg:items-center pb-4 gap-4 lg:gap-2">
        <div className="flex items-center gap-2 w-full lg:flex-1">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1 rounded hover:bg-background-selected text-foreground shrink-0"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onBack}
            className="p-1 rounded hover:bg-background-selected text-foreground shrink-0 mr-1"
            title="Back to Folders"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-[#E7E7E7] border border-transparent rounded-md pl-10 pr-4 py-2 text-sm outline-none focus:bg-white focus:border-primary transition-all placeholder:text-muted-foreground text-foreground shadow-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 w-full lg:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <button className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-muted text-sm font-medium text-foreground transition-colors whitespace-nowrap">
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Folder</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-sm hover:bg-muted text-sm font-medium text-foreground transition-colors whitespace-nowrap">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* Folder Grid Area */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="font-semibold text-2xl text-gray-900 mb-4">
          {session.title}
        </h2>

        {/* Specific Timelines Folder Card */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 gap-4">
          <div
            className="flex flex-col gap-2 cursor-pointer group"
            onClick={onOpenTimeline}
          >
            <div className="bg-background border border-border rounded p-4 aspect-[4/3] flex items-center justify-center group-hover:shadow-md transition-all">
              <svg
                width="100"
                height="80"
                viewBox="0 0 128 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.174 100C5.003 100 0 95.167 0 89.205V6.169C0 2.76 2.859 0 6.385 0h13.103c1.86 0 3.67.568 5.173 1.625l8.992 6.315a9 9 0 0 0 5.172 1.625h68.05c3.526 0 6.385 2.762 6.385 6.169v8.624S57.485 100 11.174 100"
                  fill="#b98bf8"
                />
                <path
                  d="M127.939 30.524v58.678c0 2.981-1.25 5.68-3.272 7.634-2.023 1.953-4.816 3.161-7.902 3.161H11.173c6.171 0 11.174-4.833 11.174-10.795V30.524c0-3.407 2.859-6.169 6.385-6.169h92.822c3.527 0 6.385 2.762 6.385 6.169"
                  fill="#d6bbfb"
                />
              </svg>
            </div>
            <div className="flex justify-between items-start px-1">
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">
                  Timelines
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formatDate(session.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
