import { create } from 'zustand';
import { Note, Folder } from '../types';
import { loadNotes, saveNotes, generateId } from '../utils/storage';

interface NotesState {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  searchQuery: string;
  expandedFolders: string[];
  loadNotes: () => void;
  getActiveNote: () => Note | undefined;
  setActiveNote: (id: string) => void;
  createNote: (parentId?: string | null, filePath?: string | null) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  setSearchQuery: (query: string) => void;
  createFolder: (name: string, parentId?: string | null) => void;
  deleteFolder: (id: string) => void;
  toggleFolder: (id: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  folders: [],
  activeNoteId: null,
  searchQuery: '',
  expandedFolders: [],

  loadNotes: () => {
    const data = loadNotes();
    set({
      notes: data.notes,
      folders: data.folders,
      expandedFolders: data.expandedFolders,
    });
  },

  getActiveNote: () => {
    const state = get();
    return state.notes.find((n) => n.id === state.activeNoteId);
  },

  setActiveNote: (id: string) => {
    set({ activeNoteId: id });
  },

  createNote: (parentId = null, filePath = null) => {
    const newNote: Note = {
      id: generateId(),
      title: '新建笔记',
      content: '# 新建笔记\n\n开始编写内容...',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId,
      filePath,
      fileHandle: null,
    };
    set((state) => {
      const updatedNotes = [newNote, ...state.notes];
      saveNotes({ notes: updatedNotes, folders: state.folders, expandedFolders: state.expandedFolders });
      return { notes: updatedNotes, activeNoteId: newNote.id };
    });
  },

  addNote: (note: Note) => {
    set((state) => {
      const updatedNotes = [note, ...state.notes];
      saveNotes({ notes: updatedNotes, folders: state.folders, expandedFolders: state.expandedFolders });
      return { notes: updatedNotes, activeNoteId: note.id };
    });
  },

  updateNote: (id: string, content: string) => {
    set((state) => {
      const updatedNotes = state.notes.map((note) => {
        if (note.id === id) {
          const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim();
          return {
            ...note,
            content,
            title: firstLine || note.title,
            updatedAt: Date.now(),
          };
        }
        return note;
      });
      saveNotes({ notes: updatedNotes, folders: state.folders, expandedFolders: state.expandedFolders });
      return { notes: updatedNotes };
    });
  },

  deleteNote: (id: string) => {
    set((state) => {
      const updatedNotes = state.notes.filter((note) => note.id !== id);
      saveNotes({ notes: updatedNotes, folders: state.folders, expandedFolders: state.expandedFolders });
      const newActiveId = state.activeNoteId === id ? (updatedNotes[0]?.id || null) : state.activeNoteId;
      return { notes: updatedNotes, activeNoteId: newActiveId };
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  createFolder: (name: string, parentId = null) => {
    const newFolder: Folder = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parentId,
    };
    set((state) => {
      const updatedFolders = [newFolder, ...state.folders];
      saveNotes({ notes: state.notes, folders: updatedFolders, expandedFolders: state.expandedFolders });
      return { folders: updatedFolders };
    });
  },

  deleteFolder: (id: string) => {
    set((state) => {
      const updatedFolders = state.folders.filter((folder) => folder.id !== id);
      const updatedNotes = state.notes.map((note) => {
        if (note.parentId === id) {
          return { ...note, parentId: null };
        }
        return note;
      });
      saveNotes({ notes: updatedNotes, folders: updatedFolders, expandedFolders: state.expandedFolders });
      return { folders: updatedFolders, notes: updatedNotes };
    });
  },

  toggleFolder: (id: string) => {
    set((state) => {
      const expandedFolders = state.expandedFolders.includes(id)
        ? state.expandedFolders.filter((fid) => fid !== id)
        : [...state.expandedFolders, id];
      saveNotes({ notes: state.notes, folders: state.folders, expandedFolders });
      return { expandedFolders };
    });
  },
}));
