import { useState, useEffect, useRef } from 'react';
import { Image, Download, List, Code, Save } from 'lucide-react';
import { useNotesStore } from '../store/notesStore';

interface NoteEditorProps {
  onExportPDF: () => void;
  onToggleToc: () => void;
  showToc: boolean;
}

export const NoteEditor = ({ onExportPDF, onToggleToc, showToc }: NoteEditorProps) => {
  const { notes, activeNoteId, updateNote } = useNotesStore();
  const activeNote = notes.find(note => note.id === activeNoteId) || null;
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeNote) {
      setContent(activeNote.content);
    }
  }, [activeNote]);

  useEffect(() => {
    const count = content.replace(/\s/g, '').length;
    setWordCount(count);
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (saveStatus === 'saved') {
      setSaveStatus('saving');
    }
  };

  const handleBlur = () => {
    if (activeNote && saveStatus !== 'saved') {
      updateNote(activeNote.id, content);
      setSaveStatus('saved');
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const imageMarkdown = `![${file.name}](${base64})`;
        
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = content.substring(0, start) + imageMarkdown + content.substring(end);
          setContent(newContent);
        } else {
          setContent(content + '\n' + imageMarkdown);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!activeNote) return;
    
    setSaveStatus('saving');
    
    try {
      if (activeNote.fileHandle) {
        const writable = await activeNote.fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      } else {
        const fileName = activeNote.filePath || `${activeNote.title}.md`;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      updateNote(activeNote.id, content);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('saving'), 3000);
    }
  };

  const handleSaveToFile = () => {
    handleSave();
  };

  if (!activeNote) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-500">
          <Code className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">Select a note to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-700/30 bg-slate-800/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-slate-300">{activeNote.title}</h2>
            <span className="text-xs text-slate-500">• {wordCount} chars</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImageUpload}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Insert image"
            >
              <Image className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
            <button
              onClick={onToggleToc}
              className={`p-2 rounded-lg transition-colors ${
                showToc ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
              title="Table of contents"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={handleSaveToFile}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Save"
            >
              <Save className={`w-4 h-4 ${
                saveStatus === 'saved' ? 'text-green-400' : 
                saveStatus === 'saving' ? 'text-yellow-400 animate-pulse' : 
                'text-red-400'
              }`} />
            </button>
            <button
              onClick={onExportPDF}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Export PDF"
            >
              <Download className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
        className="flex-1 p-4 bg-transparent text-slate-200 resize-none focus:outline-none font-mono text-sm leading-relaxed"
        placeholder="Start writing..."
        spellCheck={false}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
