import { Note } from '../types';

const STORAGE_KEY = 'markdown-notes';

export interface StorageData {
  notes: Note[];
  folders: any[];
  expandedFolders: string[];
}

export const loadNotes = (): StorageData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return {
          notes: parsed.map(n => ({ ...n, parentId: n.parentId || null })),
          folders: [],
          expandedFolders: [],
        };
      }
      return {
        notes: (parsed.notes || []).map((n: any) => ({ ...n, parentId: n.parentId || null })),
        folders: (parsed.folders || []).map((f: any) => ({ ...f, parentId: f.parentId || null })),
        expandedFolders: parsed.expandedFolders || [],
      };
    }
  } catch (error) {
    console.error('Failed to load notes:', error);
  }
  return getDefaultData();
};

export const saveNotes = (data: StorageData): void => {
  try {
    const dataToSave = {
      ...data,
      notes: data.notes.map(note => {
        const { fileHandle, ...rest } = note;
        return rest;
      }),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save notes:', error);
  }
};

export const getDefaultData = (): StorageData => ({
  notes: [],
  folders: [],
  expandedFolders: [],
});

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
