import { create } from 'zustand';

export type FileManagerView = "projects" | "project-folders" | "sessions" | "files";

interface FileManagerState {
  view: FileManagerView;
  setView: (view: FileManagerView) => void;
}

export const useFileManagerStore = create<FileManagerState>((set) => ({
  view: "projects",
  setView: (view) => set({ view }),
}));
