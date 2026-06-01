import { useEffect, useRef, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { parseMarkdown } from '../utils/markdown';
import { FileText, Maximize2, X, Eye } from 'lucide-react';

export const NotePreview = () => {
  const { notes, activeNoteId } = useNotesStore();
  const activeNote = notes.find(note => note.id === activeNoteId) || null;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.querySelectorAll('pre code').forEach((block) => {
        (window as any).hljs?.highlightElement(block as HTMLElement);
      });
    }
  }, [activeNote]);

  if (!activeNote) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-500">
          <Eye className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Preview will appear here</p>
        </div>
      </div>
    );
  }

  const htmlContent = parseMarkdown(activeNote.content);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm">
        <div className="h-full flex flex-col">
          <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">{activeNote.title}</h2>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div 
              className="max-w-4xl mx-auto prose prose-invert prose-cyan"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-700/30 bg-slate-800/20 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-medium text-slate-300">Preview</h2>
        </div>
        <button
          onClick={() => setIsFullscreen(true)}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-slate-400 hover:text-white" />
        </button>
      </div>
      <div ref={previewRef} className="flex-1 overflow-y-auto p-6">
        <div 
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};
