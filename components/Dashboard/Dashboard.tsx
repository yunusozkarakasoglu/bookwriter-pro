import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Book, Clock, Library, Search, FileText, BookOpen, Layers, 
  PenTool, Settings, Filter, StickyNote, CheckSquare, ClipboardList, 
  Maximize2, Minimize2, MoreHorizontal, Calendar, Tag, ChevronDown, Check, X,
  Edit, Copy, Trash2, Download, Upload, ArrowRight
} from 'lucide-react';
import { Project, WikiEntry, Citation, NoteEntry } from '../../types';

interface DashboardProps {
  projects: Project[];
  wikis: WikiEntry[];
  citations: Citation[];
  notes: NoteEntry[];
  onOpenProject: (p: Project) => void;
  onCreateProject: () => void;
  onEditProject: (p: Project) => void;
  onDuplicateProject: (p: Project) => void;
  onDeleteProject: (p: Project) => void;
  onExportProject: (p: Project) => void;
  onGlobalExport: () => void; // New global export
  onGlobalImport: () => void; // Added missing prop
  onImportProject: () => void;
  onOpenDraft: () => void;
  onRestore: () => void; 
  onAddWiki: () => void;
  onAddCitation: () => void;
  onAddNote: () => void;
  onOpenSettings: () => void;
  onEditWiki: (wiki: WikiEntry) => void;
  onEditCitation: (citation: Citation) => void;
  onEditNote: (note: NoteEntry) => void;
  onExportItem: (type: 'wiki' | 'citation' | 'note', item: any) => void;
  onDeleteItem: (type: 'wiki' | 'citation' | 'note', item: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    projects, wikis, citations, notes,
    onOpenProject, onCreateProject, onOpenDraft, onAddWiki, onAddCitation, onAddNote, onOpenSettings,
    onEditWiki, onEditCitation, onEditNote, onEditProject, onDuplicateProject, onDeleteProject, onExportProject, onGlobalExport, onImportProject,
    onExportItem, onDeleteItem, onGlobalImport
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'citations' | 'wikis' | 'notes'>('projects');
  const [search, setSearch] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  // Advanced Filter States
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterProject, setFilterProject] = useState<string>('all');
  
  // New Search Source State
  const [searchSources, setSearchSources] = useState({
      projects: true,
      citations: true,
      wikis: true,
      notes: true
  });

  const [searchScope, setSearchScope] = useState({ title: true, content: true });
  const filterMenuRef = useRef<HTMLDivElement>(null);
  
  // Context Menus
  const [projectContextMenu, setProjectContextMenu] = useState<{ x: number, y: number, projectId: string } | null>(null);
  const [wikiContextMenu, setWikiContextMenu] = useState<{ x: number, y: number, wikiId: string } | null>(null);
  const [citationContextMenu, setCitationContextMenu] = useState<{ x: number, y: number, citationId: string } | null>(null);
  const [noteContextMenu, setNoteContextMenu] = useState<{ x: number, y: number, noteId: string } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      // General close for all context menus
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setProjectContextMenu(null);
          setWikiContextMenu(null);
          setCitationContextMenu(null);
          setNoteContextMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, type: 'project' | 'wiki' | 'citation' | 'note', id: string) => {
      e.preventDefault();
      e.stopPropagation();
      const x = e.clientX > window.innerWidth - 200 ? e.clientX - 200 : e.clientX;
      
      // Clear others
      setProjectContextMenu(null);
      setWikiContextMenu(null);
      setCitationContextMenu(null);
      setNoteContextMenu(null);

      if (type === 'project') setProjectContextMenu({ x, y: e.clientY, projectId: id });
      if (type === 'wiki') setWikiContextMenu({ x, y: e.clientY, wikiId: id });
      if (type === 'citation') setCitationContextMenu({ x, y: e.clientY, citationId: id });
      if (type === 'note') setNoteContextMenu({ x, y: e.clientY, noteId: id });
  };

  const clearFilters = () => {
      setSearch('');
      setFilterProject('all');
      setSearchScope({ title: true, content: true });
      setSearchSources({ projects: true, citations: true, wikis: true, notes: true });
      setShowFilterMenu(false);
  };

  // Determine if we are in "Global Search Mode"
  const isSearching = search.trim().length > 0;
  const isFilterActive = isSearching || filterProject !== 'all' || !searchScope.title || !searchScope.content || !searchSources.projects || !searchSources.wikis;

  // --- Data Enrichment ---
  const allWikis = useMemo(() => wikis.map(w => ({ ...w, projectName: w.projectId === 'global' ? 'Genel' : (projects.find(p => p.id === w.projectId)?.name || 'Bilinmeyen'), project: w.projectId === 'global' ? null : projects.find(p => p.id === w.projectId) })), [wikis, projects]);
  const allCitations = useMemo(() => citations.map(c => ({ ...c, projectName: projects.find(p => p.id === c.projectId)?.name || 'Bilinmeyen', project: projects.find(p => p.id === c.projectId) })), [citations, projects]);
  const allNotes = useMemo(() => notes.map(n => ({ ...n, projectName: n.projectId === 'global' ? 'Genel' : (projects.find(p => p.id === n.projectId)?.name || 'Bilinmeyen'), project: n.projectId === 'global' ? null : projects.find(p => p.id === n.projectId) })), [notes, projects]);

  // --- Filtering ---
  const filterList = (list: any[], type: 'projects' | 'wikis' | 'citations' | 'notes') => {
      // 1. Source Check (Checkbox)
      if (!searchSources[type]) return [];

      let result = list;

      // 2. Project Filter
      if (filterProject !== 'all') {
          result = result.filter(item => 
              (item.projectId && item.projectId === filterProject) || 
              (item.project && item.project.id === filterProject) ||
              (item.id && type === 'projects' && item.id === filterProject)
          );
      }

      // 3. Search Text & Scope
      if (search) {
          const q = search.toLowerCase();
          result = result.filter(item => {
              const matchTitle = (item.title || item.source || item.name || '').toLowerCase().includes(q);
              const matchCode = (item.code || '').toLowerCase().includes(q);
              const contentText = (item.content || item.description || item.longSummary || '').toLowerCase();
              const matchContent = contentText.includes(q);

              if (searchScope.title && searchScope.content) return matchTitle || matchCode || matchContent;
              if (searchScope.title) return matchTitle || matchCode;
              if (searchScope.content) return matchContent;
              
              return false; 
          });
      }
      return result;
  };

  const filteredProjects = filterList(projects, 'projects');
  const filteredWikis = filterList(allWikis, 'wikis');
  const filteredCitations = filterList(allCitations, 'citations');
  const filteredNotes = filterList(allNotes, 'notes');

  const tabs = [
      { id: 'projects', label: 'KİTAPLAR', count: projects.length, icon: Library, color: 'text-white', activeColor: 'text-[#3a72ab]' },
      { id: 'citations', label: 'KAYNAKLAR', count: citations.length, icon: BookOpen, color: 'text-white', activeColor: 'text-[#3a72ab]' },
      { id: 'wikis', label: 'WIKI', count: wikis.length, icon: FileText, color: 'text-white', activeColor: 'text-[#3a72ab]' },
      { id: 'notes', label: 'NOTLAR', count: notes.length, icon: ClipboardList, color: 'text-white', activeColor: 'text-[#3a72ab]' },
  ] as const;

  // --- Render Helpers for Cards ---
  const renderProjectCard = (project: Project) => (
      <div 
        key={project.id} 
        onClick={() => onOpenProject(project)} 
        onContextMenu={(e) => handleContextMenu(e, 'project', project.id)}
        className="bg-white p-4 rounded-xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col relative overflow-hidden h-48"
    >
        {project.isDraft && <div className="absolute top-0 right-0 bg-yellow-300 text-yellow-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg shadow-sm">TASLAK</div>}
        <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-slate-50 text-slate-800 group-hover:bg-[#3a72ab] group-hover:text-white transition-colors">
                <Book size={16} />
            </div>
            <button onClick={(e) => {e.stopPropagation(); handleContextMenu(e, 'project', project.id)}} className="text-slate-300 hover:text-slate-600">
                <MoreHorizontal size={16} />
            </button>
        </div>
        <h3 className="font-bold text-slate-800 text-md mb-2 leading-tight group-hover:text-[#3a72ab] transition-colors">{project.name}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-auto leading-relaxed">{project.description || 'Açıklama girilmemiş.'}</p>
        <div className="pt-3 mt-3 border-t border-slate-50 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <div className="flex items-center gap-1"><Calendar size={10} /> {new Date(project.lastModified).toLocaleDateString()}</div>
            <div className="flex items-center gap-1"><Layers size={10} /> {project.chapters.length}</div>
        </div>
    </div>
  );

  const renderWikiCard = (wiki: any) => (
    <div 
        key={wiki.id} 
        onClick={() => onEditWiki(wiki)} 
        onContextMenu={(e) => handleContextMenu(e, 'wiki', wiki.id)}
        className="bg-white p-4 rounded-xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-48 relative"
    >
        <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <FileText size={16} />
            </div>
            <button onClick={(e) => handleContextMenu(e, 'wiki', wiki.id)} className="text-slate-300 hover:text-slate-600 p-1"><MoreHorizontal size={16}/></button>
        </div>
        <div className="absolute top-4 right-12 font-mono text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md">{wiki.code}</div>
        <h3 className="font-bold text-slate-800 text-md mb-2 truncate">{wiki.title}</h3>
        <div className="text-xs text-slate-500 line-clamp-3 mb-auto leading-relaxed" dangerouslySetInnerHTML={{__html: wiki.content.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...'}} />
        <div className="pt-3 mt-3 border-t border-slate-50 flex items-center justify-between">
            <div className="flex gap-1">{wiki.tags.slice(0,1).map((t:any) => <span key={t} className="bg-slate-50 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 uppercase">#{t}</span>)}</div>
            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{wiki.projectName}</span>
        </div>
    </div>
  );

  const renderCitationCard = (cite: any) => (
    <div 
        key={cite.id} 
        onClick={() => onEditCitation(cite)} 
        onContextMenu={(e) => handleContextMenu(e, 'citation', cite.id)}
        className="bg-white p-4 rounded-xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-48 relative"
    >
        <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <BookOpen size={16} />
            </div>
            <button onClick={(e) => handleContextMenu(e, 'citation', cite.id)} className="text-slate-300 hover:text-slate-600 p-1"><MoreHorizontal size={16}/></button>
        </div>
        <div className="absolute top-4 right-12 text-[9px] font-bold uppercase bg-slate-50 text-slate-500 px-2 py-1 rounded-md">{cite.type}</div>
        <h3 className="font-bold text-slate-800 text-md mb-2 line-clamp-2 leading-tight">{cite.source}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-auto leading-relaxed italic font-serif">{cite.description}</p>
        <div className="pt-3 mt-3 border-t border-slate-50 flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{cite.code}</span>
            <span className="text-[10px] text-slate-400 truncate flex-1 text-right">{cite.projectName}</span>
        </div>
    </div>
  );

  const renderNoteCard = (note: any) => (
    <div 
        key={note.id} 
        onClick={() => onEditNote(note)}
        onContextMenu={(e) => handleContextMenu(e, 'note', note.id)} 
        className="bg-white p-4 rounded-xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-48 relative"
    >
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${note.type === 'task' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                {note.type === 'task' ? <CheckSquare size={16} /> : <StickyNote size={16} />}
            </div>
            <button onClick={(e) => handleContextMenu(e, 'note', note.id)} className="text-slate-300 hover:text-slate-600 p-1"><MoreHorizontal size={16}/></button>
        </div>
        <div className="absolute top-4 right-12 text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md max-w-[80px] truncate">{note.projectName}</div>
        <h3 className="font-bold text-slate-800 text-md mb-2 line-clamp-2 leading-tight">{note.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-auto leading-relaxed">{note.shortDescription || 'Açıklama yok.'}</p>
        <div className="pt-3 mt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-medium text-slate-400">
            <div className="flex gap-1">{note.tags.slice(0,1).map((t:any) => <span key={t} className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">#{t}</span>)}</div>
            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
        </div>
    </div>
  );

  return (
    <div className="flex h-full w-full bg-[#c7d5e1] overflow-hidden font-sans relative">
      
      {/* LEFT SIDEBAR NAVIGATION - BLUE GRADIENT THEME */}
      <aside className={`flex-shrink-0 bg-gradient-to-b from-[#4a85c2] to-[#3a72ab] border-r border-[#3a72ab] flex flex-col transition-all duration-300 relative shadow-2xl z-20 ${isSidebarVisible ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        
        {/* ... Sidebar Header ... */}
        <div className="h-20 flex items-center px-6 border-b border-white/10 bg-white/5 backdrop-blur-sm shrink-0 relative z-10">
             <button onClick={onOpenDraft} className="w-full bg-white text-[#3a72ab] text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg flex items-center justify-center gap-2">
                 <PenTool size={14} /> Editör Modu
             </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if(isSearching) setSearch(''); // Clear search if clicking tab
                            setActiveTab(tab.id as any);
                        }}
                        className={`w-full relative group p-4 rounded-xl text-left transition-all duration-200 border ${
                            isActive && !isSearching
                            ? 'bg-white shadow-lg transform scale-105 border-transparent' 
                            : 'bg-transparent text-blue-100 hover:bg-white/10 border-white/20'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                             <tab.icon size={20} className={isActive && !isSearching ? tab.activeColor : 'text-blue-200'} />
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive && !isSearching ? 'bg-blue-50 text-[#3a72ab]' : 'bg-white/20 text-white'}`}>
                                 {tab.count}
                             </span>
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${isActive && !isSearching ? 'text-[#3a72ab]' : 'text-white'}`}>
                            {tab.label}
                        </span>
                    </button>
                )
            })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5 relative z-10">
            <button onClick={onOpenSettings} className="w-full flex items-center justify-center gap-2 text-blue-100 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold">
                <Settings size={16} /> Ayarlar
            </button>
        </div>
      </aside>


      {/* RIGHT CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#c7d5e1] relative">
        {/* ... Toolbar Header ... */}
        <header className="h-20 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10 shadow-sm">
            
            {/* Search & Filter Container */}
            <div className="flex-1 max-w-xl relative flex items-center gap-2" ref={filterMenuRef}>
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        className={`w-full h-12 pl-12 pr-4 border rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400 ${isSearching ? 'bg-white border-indigo-300 ring-4 ring-indigo-50 text-indigo-900' : 'bg-slate-100/50 border-slate-200 focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50'}`}
                        placeholder="Tüm kütüphanede ara..."
                        value={search}
                        onFocus={() => setShowFilterMenu(true)}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            if (e.target.value.length > 0) setShowFilterMenu(false);
                        }}
                    />
                </div>
                
                {/* Filter Popup Menu - Re-positioned under input */}
                {showFilterMenu && (
                    <div className="absolute top-14 left-0 w-full bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2 flex items-center gap-2">
                            <Filter size={12}/> GELİŞMİŞ ARAMA & FİLTRE
                        </h4>
                        
                        {/* Project Select */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Proje / Kitap</label>
                            <select 
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-all font-medium text-slate-600"
                            >
                                <option value="all">Tüm Projeler</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* Source Selection Grid */}
                        <div className="mb-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm ${searchSources.projects ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {searchSources.projects && <Check size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={searchSources.projects} onChange={() => setSearchSources(prev => ({ ...prev, projects: !prev.projects }))} />
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 font-mono">Kitaplar</span>
                                </label>
                                
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm ${searchSources.citations ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {searchSources.citations && <Check size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={searchSources.citations} onChange={() => setSearchSources(prev => ({ ...prev, citations: !prev.citations }))} />
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 font-mono">Kaynaklar</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm ${searchSources.wikis ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {searchSources.wikis && <Check size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={searchSources.wikis} onChange={() => setSearchSources(prev => ({ ...prev, wikis: !prev.wikis }))} />
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 font-mono">Wiki</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm ${searchSources.notes ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {searchSources.notes && <Check size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={searchSources.notes} onChange={() => setSearchSources(prev => ({ ...prev, notes: !prev.notes }))} />
                                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 font-mono">Notlar</span>
                                </label>
                            </div>
                        </div>

                        {/* Scope Selection */}
                        <div className="mb-2">
                            <label className="block text-xs font-bold text-slate-700 mb-2">Arama Kapsamı</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm ${searchScope.title ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {searchScope.title && <Check size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={searchScope.title} onChange={() => setSearchScope(prev => ({ ...prev, title: !prev.title }))} />
                                    <span className="text-xs text-slate-600 group-hover:text-slate-900">Başlıklar</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group select-none">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shadow-sm ${searchScope.content ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {searchScope.content && <Check size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={searchScope.content} onChange={() => setSearchScope(prev => ({ ...prev, content: !prev.content }))} />
                                    <span className="text-xs text-slate-600 group-hover:text-slate-900">İçerikler</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Clear Filter Button */}
                {isFilterActive && (
                    <button 
                        onClick={clearFilters}
                        className="h-12 w-12 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Filtreleri Temizle"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-6">
                
                {/* Global Export/Import Actions */}
                <button 
                    onClick={onGlobalExport}
                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center gap-2 transition-all font-bold text-xs"
                    title="Yedekle (Dışarı Aktar)"
                >
                    <Download size={16} /> <span className="hidden md:inline">Yedekle</span>
                </button>

                <button 
                    onClick={onGlobalImport}
                    className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center gap-2 transition-all font-bold text-xs"
                    title="İçe Aktar (Yükle)"
                >
                    <Upload size={16} /> <span className="hidden md:inline">Yükle</span>
                </button>
                
                <div className="h-8 w-px bg-slate-200 mx-2"></div>
                
                <button 
                    onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                    className="h-10 w-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-all"
                    title={isSidebarVisible ? "Tam Ekran" : "Menüyü Göster"}
                >
                    {isSidebarVisible ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                </button>
            </div>
        </header>


        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scroll relative">
            
            {/* Page Title & Count (Hide if searching) */}
            {!isSidebarVisible && !isSearching && (
                <div className="mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{tabs.find(t => t.id === activeTab)?.label}</h1>
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">{tabs.find(t => t.id === activeTab)?.count}</span>
                </div>
            )}

            {/* --- GLOBAL SEARCH RESULTS VIEW --- */}
            {isSearching ? (
                <div className="animate-in fade-in duration-300 pb-20">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                <Search size={24} className="text-indigo-600" />
                                Arama Sonuçları: <span className="text-indigo-600 italic">"{search}"</span>
                            </h2>
                            <p className="text-slate-500 text-xs mt-1">
                                {filteredProjects.length + filteredWikis.length + filteredCitations.length + filteredNotes.length} kayıt bulundu.
                            </p>
                        </div>
                        <button onClick={clearFilters} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors">
                            Aramayı Temizle
                        </button>
                    </div>

                    <div className="space-y-12">
                        
                        {/* 1. Projects Section */}
                        {searchSources.projects && filteredProjects.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/50">
                                    <Library size={18} className="text-indigo-600" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Bulunan Kitaplar ({filteredProjects.length})</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredProjects.map(renderProjectCard)}
                                </div>
                            </section>
                        )}

                        {/* 2. Wikis Section */}
                        {searchSources.wikis && filteredWikis.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/50">
                                    <FileText size={18} className="text-indigo-600" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Bulunan Wikiler ({filteredWikis.length})</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredWikis.map(renderWikiCard)}
                                </div>
                            </section>
                        )}

                        {/* 3. Citations Section */}
                        {searchSources.citations && filteredCitations.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/50">
                                    <BookOpen size={18} className="text-indigo-600" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Bulunan Kaynaklar ({filteredCitations.length})</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredCitations.map(renderCitationCard)}
                                </div>
                            </section>
                        )}

                         {/* 4. Notes Section */}
                         {searchSources.notes && filteredNotes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200/50">
                                    <ClipboardList size={18} className="text-indigo-600" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Bulunan Notlar ({filteredNotes.length})</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredNotes.map(renderNoteCard)}
                                </div>
                            </section>
                        )}

                        {/* No Results State */}
                        {(filteredProjects.length === 0 && filteredWikis.length === 0 && filteredCitations.length === 0 && filteredNotes.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <Search size={64} className="text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-500">Sonuç Bulunamadı</h3>
                                <p className="text-slate-400 mt-2 text-sm max-w-xs text-center">
                                    Aradığınız kriterlere uygun kayıt bulunamadı. Lütfen anahtar kelimeyi veya filtreleri kontrol edin.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* --- STANDARD TAB VIEW --- */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                    
                    {/* --- NOTES GRID --- */}
                    {activeTab === 'notes' && (
                        <>
                            {/* Add New Note Card */}
                            <div onClick={onAddNote} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-center justify-center h-48 border-dashed border-2">
                                <div className="w-16 h-16 bg-[#3a72ab] rounded-full flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                    <Plus size={32} />
                                </div>
                                <span className="font-bold text-slate-600 group-hover:text-[#3a72ab] transition-colors">
                                    Yeni Not Ekle
                                </span>
                            </div>
                            {filteredNotes.map(renderNoteCard)}
                        </>
                    )}

                    {/* --- CITATIONS GRID --- */}
                    {activeTab === 'citations' && (
                        <>
                            {/* Add New Citation Card */}
                            <div onClick={onAddCitation} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-center justify-center h-48 border-dashed border-2">
                                <div className="w-16 h-16 bg-[#3a72ab] rounded-full flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                    <Plus size={32} />
                                </div>
                                <span className="font-bold text-slate-600 group-hover:text-[#3a72ab] transition-colors">
                                    Kaynak / Alıntı Ekle
                                </span>
                            </div>
                            {filteredCitations.map(renderCitationCard)}
                        </>
                    )}

                    {/* --- WIKIS GRID --- */}
                    {activeTab === 'wikis' && (
                        <>
                            {/* Add New Wiki Card */}
                            <div onClick={onAddWiki} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-center justify-center h-48 border-dashed border-2">
                                <div className="w-16 h-16 bg-[#3a72ab] rounded-full flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                    <Plus size={32} />
                                </div>
                                <span className="font-bold text-slate-600 group-hover:text-[#3a72ab] transition-colors">
                                    Yeni Wiki Ekle
                                </span>
                            </div>
                            {filteredWikis.map(renderWikiCard)}
                        </>
                    )}

                    {/* --- PROJECTS GRID --- */}
                    {activeTab === 'projects' && (
                        <>
                            {/* Add New Project Card */}
                            <div onClick={onCreateProject} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col items-center justify-center h-48 border-dashed border-2">
                                <div className="w-16 h-16 bg-[#3a72ab] rounded-full flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                    <Plus size={32} />
                                </div>
                                <span className="font-bold text-slate-600 group-hover:text-[#3a72ab] transition-colors">
                                    Yeni Kitap Ekle
                                </span>
                            </div>
                            {filteredProjects.map(renderProjectCard)}
                        </>
                    )}
                </div>
            )}
            
            {/* Empty State for TABS (Not searching) */}
            {!isSearching && ((activeTab === 'notes' && filteredNotes.length === 0) ||
              (activeTab === 'citations' && filteredCitations.length === 0) ||
              (activeTab === 'wikis' && filteredWikis.length === 0) ||
              (activeTab === 'projects' && filteredProjects.length === 0)) && (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 bg-white/20 mt-4">
                    <div className="p-3 bg-white/50 rounded-full mb-2"><MoreHorizontal size={24} /></div>
                    <p className="font-bold text-xs uppercase tracking-widest">Başlamak için yeni kayıt ekleyin</p>
                    {isFilterActive && <button onClick={clearFilters} className="mt-2 text-[10px] font-bold text-white bg-slate-400 px-2 py-1 rounded hover:bg-slate-500">Filtreleri Temizle</button>}
                </div>
            )}

        </div>

        {/* --- CONTEXT MENUS --- */}
        <div ref={menuRef}>
            {/* Project Context Menu */}
            {projectContextMenu && (
                <div 
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-100 w-48 py-1 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: projectContextMenu.y, left: projectContextMenu.x }}
                >
                    <div className="px-3 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proje İşlemleri</div>
                    <button onClick={(e) => { e.stopPropagation(); const p = projects.find(p => p.id === projectContextMenu.projectId); if (p) onEditProject(p); setProjectContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Edit size={12} /> Özellikleri Düzenle</button>
                    <button onClick={(e) => { e.stopPropagation(); const p = projects.find(p => p.id === projectContextMenu.projectId); if (p) onDuplicateProject(p); setProjectContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Copy size={12} /> Çoğalt</button>
                    <button onClick={(e) => { e.stopPropagation(); const p = projects.find(p => p.id === projectContextMenu.projectId); if (p) onExportProject(p); setProjectContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Download size={12} /> Yedekle (.json)</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); const p = projects.find(p => p.id === projectContextMenu.projectId); setProjectContextMenu(null); if (p) onDeleteProject(p); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Sil</button>
                </div>
            )}

            {/* Wiki Context Menu */}
            {wikiContextMenu && (
                <div 
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-100 w-48 py-1 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: wikiContextMenu.y, left: wikiContextMenu.x }}
                >
                    <div className="px-3 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wiki İşlemleri</div>
                    <button onClick={(e) => { e.stopPropagation(); const w = wikis.find(i => i.id === wikiContextMenu.wikiId); if (w) onEditWiki(w); setWikiContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Edit size={12} /> Düzenle</button>
                    <button onClick={(e) => { e.stopPropagation(); const w = wikis.find(i => i.id === wikiContextMenu.wikiId); if (w) onExportItem('wiki', w); setWikiContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Download size={12} /> Yedekle (.json)</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); const w = wikis.find(i => i.id === wikiContextMenu.wikiId); setWikiContextMenu(null); if (w) onDeleteItem('wiki', w); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Sil</button>
                </div>
            )}

            {/* Citation Context Menu */}
            {citationContextMenu && (
                <div 
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-100 w-48 py-1 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: citationContextMenu.y, left: citationContextMenu.x }}
                >
                    <div className="px-3 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kaynak İşlemleri</div>
                    <button onClick={(e) => { e.stopPropagation(); const c = citations.find(i => i.id === citationContextMenu.citationId); if (c) onEditCitation(c); setCitationContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Edit size={12} /> Düzenle</button>
                    <button onClick={(e) => { e.stopPropagation(); const c = citations.find(i => i.id === citationContextMenu.citationId); if (c) onExportItem('citation', c); setCitationContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Download size={12} /> Yedekle (.json)</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); const c = citations.find(i => i.id === citationContextMenu.citationId); setCitationContextMenu(null); if (c) onDeleteItem('citation', c); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Sil</button>
                </div>
            )}

            {/* Note Context Menu */}
            {noteContextMenu && (
                <div 
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-100 w-48 py-1 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: noteContextMenu.y, left: noteContextMenu.x }}
                >
                    <div className="px-3 py-2 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">Not İşlemleri</div>
                    <button onClick={(e) => { e.stopPropagation(); const n = notes.find(i => i.id === noteContextMenu.noteId); if (n) onEditNote(n); setNoteContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Edit size={12} /> Düzenle</button>
                    <button onClick={(e) => { e.stopPropagation(); const n = notes.find(i => i.id === noteContextMenu.noteId); if (n) onExportItem('note', n); setNoteContextMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"><Download size={12} /> Yedekle (.json)</button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button onClick={(e) => { e.stopPropagation(); const n = notes.find(i => i.id === noteContextMenu.noteId); setNoteContextMenu(null); if (n) onDeleteItem('note', n); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Sil</button>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;