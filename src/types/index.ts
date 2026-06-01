export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  parentId: string | null;
  filePath: string | null;
  fileHandle: FileSystemFileHandle | null;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  parentId: string | null;
}

export interface NotesState {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  searchQuery: string;
  expandedFolders: string[];
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export type TreeItem = Note | Folder;

export interface TreeNode {
  item: TreeItem;
  type: 'note' | 'folder';
  children?: TreeNode[];
}
