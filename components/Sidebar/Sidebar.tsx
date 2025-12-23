import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Home, ChevronLeft, LayoutGrid, Plus, Trash2, ArrowUp, ArrowDown, Edit2, Folder, File, Book
} from 'lucide-react';
import { Project, Chapter } from '../../types';

interface SidebarProps {
  project: Project | null;
  activeChapterId: string | null;
  collapsed: boolean;
  onSelectChapter: (id: string) => void;
  onGoDashboard: () => void;
  onToggle: () => void;
  onAddChapter: (parentId?: string) => void;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, direction: 'up' | 'down') => void;
  onRenameChapter: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    project, activeChapterId, collapsed, onSelectChapter, onGoDashboard, onToggle,
    onAddChapter, onDeleteChapter, onMoveChapter, onRenameChapter
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState(''); // Local state for input
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setContextMenu(null);
        }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const startRenaming = (chapter: Chapter) => {
      setRenamingId(chapter.id);
      setRenameValue(chapter.title);
      setContextMenu(null);
  };

  const submitRename = (id: string) => {
      if (renameValue.trim()) {
          onRenameChapter(id, renameValue);
      }
      setRenamingId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
      if (e.key === 'Enter') {
          submitRename(id);
      }
  };

  const renderChapter = (chapter: Chapter, level = 0) => {
    const isActive = activeChapterId === chapter.id;
    const isRenaming = renamingId === chapter.id;
    const hasChildren = chapter.children && chapter.children.length > 0;

    return (
      <div key={chapter.id} className="select-none group/item">
        <div 
          className={`flex items-center gap-2 px-3 py-2 my-1 text-[13px] transition-all relative rounded-lg cursor-pointer border border-transparent ${
            isActive 
            ? 'bg-white text-[#3a72ab] font-bold shadow-md' 
            : 'text-blue-50 hover:bg-white/10 hover:text-white'
          }`}
          style={{ paddingLeft: `${level * 14 + 12}px` }}
          onClick={() => !isRenaming && onSelectChapter(chapter.id)}
          onContextMenu={(e) => handleContextMenu(e, chapter.id)}
          onDoubleClick={() => startRenaming(chapter)}
        >
          <div className="flex-1 flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
                <Folder size={14} className={`shrink-0 ${isActive ? 'text-[#3a72ab]' : 'text-blue-200'}`} fill={isActive ? "currentColor" : "none"} />
            ) : (
                <FileText size={14} className={`shrink-0 ${isActive ? 'text-[#3a72ab]' : 'text-blue-200'}`} />
            )}
            
            {isRenaming ? (
                <input 
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, chapter.id)}
                    onBlur={() => submitRename(chapter.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white border border-blue-300 rounded px-1 py-0 text-xs outline-none shadow-sm text-slate-800"
                />
            ) : (
                <span className="truncate">{chapter.title}</span>
            )}
          </div>

          {/* Hover Action: Add Sub Chapter */}
          {!isRenaming && (
            <button 
                onClick={(e) => { e.stopPropagation(); onAddChapter(chapter.id); }}
                className={`opacity-0 group-hover/item:opacity-100 p-0.5 rounded transition-all ${isActive ? 'hover:bg-blue-100 text-[#3a72ab]' : 'hover:bg-white/20 text-white'}`}
                title="Alt Bölüm Ekle"
            >
                <Plus size={12} />
            </button>
          )}
        </div>
        {hasChildren && (
          <div className="mt-0 ml-4 border-l border-white/20">
            {chapter.children.map(child => renderChapter(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className="w-16 flex-shrink-0 bg-gradient-to-b from-[#4a85c2] to-[#3a72ab] shadow-2xl relative border-r border-[#3a72ab] flex flex-col items-center py-6 gap-4 z-30">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-black text-sm border border-white/20 shadow-inner">B</div>
        <button onClick={onGoDashboard} className="p-3 hover:bg-white/20 rounded-xl text-white transition-all"><Home size={20} /></button>
        <button onClick={onToggle} className="p-3 hover:bg-white/20 rounded-xl text-white mt-auto mb-4 transition-all"><ChevronLeft size={20} className="rotate-180" /></button>
      </div>
    );
  }

  return (
    <div className="w-72 flex-shrink-0 bg-gradient-to-b from-[#4a85c2] to-[#3a72ab] shadow-2xl relative border-r border-[#3a72ab] flex flex-col h-full z-30">
      {/* Glass overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
      
      <div className="h-20 flex items-center px-6 gap-3 mb-2 border-b border-white/10 bg-white/5 backdrop-blur-sm relative z-10">
        <div className="w-10 h-10 bg-white text-[#3a72ab] rounded-xl flex items-center justify-center font-black text-sm shadow-lg">BP</div>
        <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none drop-shadow-md">BookWriter</h1>
            <span className="text-[10px] text-blue-100 font-medium opacity-80">Pro Editor v2.1</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scroll py-4 px-4 relative z-10">
        <button 
          onClick={onGoDashboard}
          className="w-full flex items-center gap-3 px-4 py-3 text-blue-50 hover:bg-white/10 hover:text-white rounded-xl transition-all text-xs font-bold mb-8 border border-transparent hover:border-white/10 shadow-sm"
        >
          <Home size={18} /> <span>DASHBOARD</span>
        </button>

        <div className="mb-4 px-2 flex items-center justify-between group">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid size={12} /> SAYFA YAPISI
            </span>
            <button onClick={() => onAddChapter()} className="p-1 hover:bg-white/20 text-blue-200 hover:text-white rounded transition-colors" title="Ana Bölüm Ekle">
                <Plus size={16} />
            </button>
        </div>

        <div className="space-y-1 pb-20">
          {project?.chapters.map(c => renderChapter(c))}
          {project?.chapters.length === 0 && (
              <div className="text-center py-12 text-blue-200 text-xs italic bg-white/5 rounded-xl border border-white/5 mx-2">
                  <Book size={24} className="mx-auto mb-2 opacity-50"/>
                  Henüz sayfa oluşturulmadı.
              </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-white/5 relative z-10">
          <button onClick={onToggle} className="flex items-center gap-2 text-xs font-bold text-blue-100 hover:text-white transition-colors w-full justify-center py-2 hover:bg-white/5 rounded-lg">
              <ChevronLeft size={16} /> Paneli Gizle
          </button>
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div 
            ref={menuRef}
            className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-100 w-52 py-2 animate-in fade-in zoom-in-95 duration-100 text-slate-700"
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            <div className="px-4 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Sayfa İşlemleri
            </div>
            <button 
                onClick={() => startRenaming(project?.chapters.find(c => c.id === contextMenu.id) || {id: contextMenu.id, title: '', content: '', children: [], citations: []} as any)} 
                className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
            >
                <Edit2 size={14} /> Yeniden Adlandır
            </button>
            <button 
                onClick={() => { onAddChapter(contextMenu.id); setContextMenu(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
            >
                <Plus size={14} /> Alt Sayfa Ekle
            </button>
            <div className="h-px bg-slate-100 my-1"></div>
            <button 
                onClick={() => { onMoveChapter(contextMenu.id, 'up'); setContextMenu(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 transition-colors"
            >
                <ArrowUp size={14} /> Yukarı Taşı
            </button>
            <button 
                onClick={() => { onMoveChapter(contextMenu.id, 'down'); setContextMenu(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-3 transition-colors"
            >
                <ArrowDown size={14} /> Aşağı Taşı
            </button>
            <div className="h-px bg-slate-100 my-1"></div>
            <button 
                type="button"
                onClick={() => { onDeleteChapter(contextMenu.id); setContextMenu(null); }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
            >
                <Trash2 size={14} /> Sayfayı Sil
            </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;