import { useState, useEffect } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { useNotesStore } from './store/notesStore';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { NotePreview } from './components/NotePreview';
import { TableOfContents } from './components/TableOfContents';
import { parseMarkdown } from './utils/markdown';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function App() {
  const { loadNotes, getActiveNote, createNote } = useNotesStore();
  const [showToc, setShowToc] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
    setTimeout(() => setIsLoading(false), 800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        createNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadNotes, createNote]);

  const handleExportPDF = async () => {
    const activeNote = getActiveNote();
    if (!activeNote) return;

    const container = document.createElement('div');
    container.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      background: white;
      color: #1f2937;
    `;

    const style = document.createElement('style');
    style.textContent = `
      .pdf-content h1 { font-size: 24px; color: #1f2937; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
      .pdf-content h2 { font-size: 20px; color: #374151; margin-top: 24px; margin-bottom: 12px; }
      .pdf-content h3 { font-size: 18px; color: #4b5563; margin-top: 20px; margin-bottom: 10px; }
      .pdf-content p { font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 12px; }
      .pdf-content code { background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: 'Fira Code', monospace; font-size: 12px; }
      .pdf-content pre { background: #1f2937; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
      .pdf-content pre code { color: #e5e7eb; background: none; padding: 0; }
      .pdf-content blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #6b7280; font-style: italic; margin: 16px 0; }
      .pdf-content table { border-collapse: collapse; width: 100%; margin: 16px 0; }
      .pdf-content th, .pdf-content td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
      .pdf-content th { background: #f9fafb; font-weight: 600; }
      .pdf-content ul, .pdf-content ol { padding-left: 24px; margin-bottom: 12px; }
      .pdf-content li { margin: 4px 0; }
      .pdf-content img { max-width: 100%; border-radius: 8px; margin: 16px 0; }
      .pdf-content a { color: #3b82f6; text-decoration: none; }
      .pdf-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    `;
    container.appendChild(style);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'pdf-content';
    contentDiv.innerHTML = parseMarkdown(activeNote.content);
    container.appendChild(contentDiv);

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${activeNote.title}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center animate-pulse">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white tracking-wider">MARKDOWN</h2>
            <p className="text-sm text-slate-400 mt-1">Loading...</p>
          </div>
          <div className="w-40 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <header className="relative px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 transition-all duration-300 group-hover:shadow-cyan-500/40 group-hover:scale-105">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Markdown Editor
              </h1>
              <p className="text-xs text-slate-400">Write, Preview, Create</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
              <span className="px-2 py-1 bg-slate-800/50 rounded-lg text-xs">Ctrl+N</span>
              <span className="text-slate-500">新建</span>
              <span className="px-2 py-1 bg-slate-800/50 rounded-lg text-xs ml-2">Ctrl+S</span>
              <span className="text-slate-500">保存</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 flex-shrink-0 bg-slate-800/30 backdrop-blur-sm border-r border-slate-700/30">
          <NoteList />
        </aside>

        <section className="flex-1 flex overflow-hidden">
          <div className="w-1/2 flex-shrink-0 bg-slate-800/20 border-r border-slate-700/20">
            <NoteEditor
              onExportPDF={handleExportPDF}
              onToggleToc={() => setShowToc(!showToc)}
              showToc={showToc}
            />
          </div>

          <div className="flex-1 bg-slate-900/50">
            <NotePreview />
          </div>

          {showToc && (
            <div className="w-56 flex-shrink-0 bg-slate-800/40 backdrop-blur-sm border-l border-slate-700/30">
              <TableOfContents isVisible={showToc} />
            </div>
          )}
        </section>
      </main>

      <div className="fixed bottom-4 right-4 flex items-center gap-2 text-xs text-slate-500">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>Auto-save enabled</span>
      </div>
    </div>
  );
}

export default App;
