import { useRef, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { Note } from '../types';
import { generateId } from '../utils/storage';
import { FileText, Search, Plus, FolderOpen, Folder, ChevronRight, Trash2, Upload } from 'lucide-react';

export const NoteList = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; id: string } | null>(null);

  const {
    notes,
    folders,
    activeNoteId,
    setActiveNote,
    createNote,
    addNote,
    deleteNote,
    searchQuery,
    deleteFolder,
    toggleFolder,
    expandedFolders,
  } = useNotesStore();

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query);
  });

  const getTreeData = (): any[] => {
    const buildTree = (parentId: string | null): any[] => {
      const folderNodes: any[] = folders
        .filter((f) => f.parentId === parentId)
        .map((folder) => {
          const isExpanded = expandedFolders.includes(folder.id);
          const children = isExpanded ? buildTree(folder.id) : [];
          return { item: folder, type: 'folder' as const, children };
        });

      const noteNodes: any[] = notes
        .filter((n) => n.parentId === parentId)
        .map((note) => ({ item: note, type: 'note' as const }));

      return [...folderNodes, ...noteNodes];
    };

    return buildTree(null);
  };

  const treeData = getTreeData();

  const handleContextMenu = (e: React.MouseEvent, type: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder(folderId);
    closeContextMenu();
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const content = await file.text();
        const title = getTitle(content) || file.name.replace(/\.(md|txt)$/i, '');
        
        const newNote: Note = {
          id: generateId(),
          title,
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          parentId: null,
          filePath: file.name,
          fileHandle: null,
        };
        
        if ('getFileHandle' in File.prototype) {
          try {
            const handle = await (file as any).getFileHandle?.();
            if (handle) {
              newNote.fileHandle = handle;
            }
          } catch (e) {
            console.warn('Failed to get file handle:', e);
          }
        }
        
        addNote(newNote);
      }
    }
  };

  const handleFolderSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const parentId = 'root';
    const fileMap = new Map<string, { file: File; path: string }>();

    Array.from(files).forEach((file) => {
      const fullPath = (file as any).webkitRelativePath || file.name;
      const pathParts = fullPath.split('/');
      pathParts.pop();
      const folderPath = pathParts.join('/');

      if (!fileMap.has(folderPath) || !fileMap.get(folderPath)!.file.name.endsWith('.md')) {
        fileMap.set(folderPath, { file, path: fullPath });
      }
    });

    fileMap.forEach(({ file, path }) => {
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const title = getTitle(content) || file.name.replace(/\.(md|txt)$/i, '');
          
          const newNote: Note = {
            id: generateId(),
            title,
            content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            parentId,
            filePath: path,
            fileHandle: null,
          };
          
          addNote(newNote);
        };
        reader.readAsText(file, 'utf-8');
      }
    });
  };

  const getTitle = (content: string): string => {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1] : '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleOpenFile = () => {
    fileInputRef.current?.click();
  };

  const handleOpenFolder = () => {
    folderInputRef.current?.click();
  };

  const renderTree = (nodes: any[], depth = 0) => {
    if (nodes.length === 0) return null;

    return nodes.map((node) => (
      <div key={node.item.id} className="relative">
        {node.type === 'folder' ? (
          <div
            className={`group flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-200 ${
              depth > 0 ? `pl-${4 + depth * 4}` : ''
            } hover:bg-slate-700/30`}
            onClick={() => toggleFolder(node.item.id)}
            onContextMenu={(e) => handleContextMenu(e, 'folder', node.item.id)}
          >
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              expandedFolders.includes(node.item.id) ? 'rotate-90' : ''
            }`} />
            <Folder className={`w-4 h-4 ${expandedFolders.includes(node.item.id) ? 'text-yellow-400' : 'text-yellow-500'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 truncate">{node.item.name}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(node.item.id);
              }}
              className="p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 rounded transition-all"
              title="Delete folder"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className={`group flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-200 ${
              depth > 0 ? `pl-${4 + depth * 4}` : ''
            } ${
              activeNoteId === node.item.id
                ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-500'
                : 'hover:bg-slate-700/30 border-l-2 border-transparent'
            }`}
            onClick={() => setActiveNote(node.item.id)}
            onContextMenu={(e) => handleContextMenu(e, 'note', node.item.id)}
          >
            <span className="w-4" />
            <FileText className={`w-4 h-4 ${activeNoteId === node.item.id ? 'text-cyan-400' : 'text-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${activeNoteId === node.item.id ? 'text-white' : 'text-slate-300'}`}>
                {node.item.title}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNote(node.item.id);
              }}
              className="p-1 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 rounded transition-all"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        {node.children && node.children.length > 0 && expandedFolders.includes(node.item.id) && (
          <div className="ml-4">
            {renderTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  const hasContent = notes.length > 0 || folders.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFile}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200"
              title="Open files"
            >
              <FolderOpen className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={handleOpenFolder}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200"
              title="Open folder"
            >
              <Folder className="w-4 h-4 text-yellow-400" />
            </button>
          </div>
          <button
            onClick={() => createNote()}
            className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
            title="New note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => useNotesStore.getState().setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.txt"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      <input
        {...({
          ref: folderInputRef,
          type: 'file',
          multiple: true,
          directory: 'true',
          webkitdirectory: 'true',
          mozdirectory: 'true',
          onChange: (e: any) => handleFolderSelect(e.target.files),
          className: 'hidden',
        } as any)}
      />

      <div 
        className="flex-1 overflow-y-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={closeContextMenu}
      >
        {!hasContent ? (
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-600/50'}`}>
              <FolderOpen className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-sm text-slate-400 mb-2">Drag and drop files here</p>
              <p className="text-xs text-slate-500 mb-4">or</p>
              <button
                onClick={handleOpenFile}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
              >
                Browse files
              </button>
            </div>
          </div>
        ) : searchQuery.trim() ? (
          <div className="p-2">
            <p className="text-xs text-slate-500 px-4 py-2">Search results:</p>
            <ul>
              {filteredNotes.map((note, index) => (
                <li key={note.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <div
                    className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 ${
                      activeNoteId === note.id
                        ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-500'
                        : 'hover:bg-slate-700/30 border-l-2 border-transparent'
                    }`}
                    onClick={() => setActiveNote(note.id)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      activeNoteId === note.id ? 'bg-cyan-500' : 'bg-slate-500 group-hover:bg-slate-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        activeNoteId === note.id ? 'text-white' : 'text-slate-300'
                      }`}>
                        {note.title}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={`p-2 transition-all duration-300 ${isDragging ? 'bg-cyan-500/10' : ''}`}>
            {isDragging && (
              <div className="mb-2 p-3 rounded-lg border-2 border-cyan-500 bg-cyan-500/10">
                <div className="flex items-center gap-2 text-cyan-400 text-sm">
                  <Upload className="w-4 h-4" />
                  <span>Drop files to import</span>
                </div>
              </div>
            )}
            {renderTree(treeData)}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-700/30">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{notes.length} notes</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Saved
          </span>
        </div>
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl py-2 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'folder' && (
            <button
              onClick={() => handleDeleteFolder(contextMenu.id)}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
            >
              <Trash2 className="w-4 h-4 inline-block mr-2" />
              Delete Folder
            </button>
          )}
          {contextMenu.type === 'note' && (
            <button
              onClick={() => {
                deleteNote(contextMenu.id);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700/50 transition-colors"
            >
              <Trash2 className="w-4 h-4 inline-block mr-2" />
              Delete Note
            </button>
          )}
        </div>
      )}
    </div>
  );
};
