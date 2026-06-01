import { useEffect, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { TocItem } from '../types';

interface TableOfContentsProps {
  isVisible: boolean;
}

export const TableOfContents = ({ isVisible }: TableOfContentsProps) => {
  const { notes, activeNoteId } = useNotesStore();
  const activeNote = notes.find(note => note.id === activeNoteId) || null;
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    if (activeNote) {
      const headings = extractHeadings(activeNote.content);
      setToc(headings);
    } else {
      setToc([]);
    }
  }, [activeNote]);

  const extractHeadings = (content: string): TocItem[] => {
    const lines = content.split('\n');
    const headings: TocItem[] = [];
    let idCounter = 0;

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          id: `heading-${idCounter++}`,
          text: match[2].trim(),
          level: match[1].length,
        });
      }
    });

    return headings;
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-700/30">
        <h2 className="text-sm font-medium text-slate-300">Table of Contents</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {toc.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">No headings found</p>
        ) : (
          <ul className="space-y-2">
            {toc.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                className="cursor-pointer hover:bg-slate-700/30 rounded px-2 py-1 transition-colors"
                onClick={() => scrollToHeading(item.id)}
              >
                <span className={`text-xs ${
                  item.level === 1 ? 'font-semibold text-slate-300' :
                  item.level === 2 ? 'font-medium text-slate-400' :
                  'text-slate-500'
                }`}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
