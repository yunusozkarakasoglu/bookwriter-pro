import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Save, ChevronLeft, ChevronRight, Settings, X, Grid, Moon, Database, BookOpen, FileText, Search, ArrowLeft, Eye, Plus, Tag, User, PenTool, Layout, Globe, Check, AlertTriangle, Download, Upload, Info, CheckCircle, ClipboardList, StickyNote, CheckSquare, Book,
  ArrowRight, List as ListIcon, Layers, NotebookPen, RefreshCw, FileJson, Calendar, Trash2, ShieldCheck, Cloud, HardDrive, Smartphone, FileCode
} from 'lucide-react';
import { Project, Chapter, WikiEntry, Citation, NoteEntry, AppState } from './types';
import RichTextEditor from './components/Editor/RichTextEditor';
import Sidebar from './components/Sidebar/Sidebar';
import RightPanel from './components/RightPanel/RightPanel';
import Dashboard from './components/Dashboard/Dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [isPreview, setIsPreview] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'current'>('current'); 
  
  // Project Modal Tabs
  const [projectModalTab, setProjectModalTab] = useState<'general' | 'content' | 'hierarchy' | 'settings'>('general');
  
  const [settingsTab, setSettingsTab] = useState<'app' | 'backup' | 'about'>('app'); 
  
  // Wizard local state for Color Picker
  const [wizardColor, setWizardColor] = useState('#d8dee3');

  const [pendingSelectionRange, setPendingSelectionRange] = useState<Range | null>(null);
  const [pendingSelectionText, setPendingSelectionText] = useState<string>('');
  
  // Temporary state for Rich Text Content in forms
  const [tempHtmlContent, setTempHtmlContent] = useState('');

  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null); // For Single Item/Project Import
  const fullBackupInputRef = useRef<HTMLInputElement>(null); // For Full System Restore

  const [modal, setModal] = useState<{ 
    type: 'project' | 'wiki' | 'citation' | 'note' | 'wikiPreview' | 'citationPreview' | 'notePreview' | 'database' | 'link-selector' | 'save-draft' | 'settings' | 'import-conflict' | 'delete-confirm' | 'full-restore-confirm', 
    data?: any,
    deleteType?: 'project' | 'wiki' | 'citation' | 'note' | 'chapter', // Added chapter
    mode?: 'create' | 'edit',
    dbTab?: 'wiki' | 'citations' | 'notes',
    linkType?: 'wiki' | 'citation',
    importData?: { project: Project, relatedWikis: WikiEntry[], relatedCitations: Citation[], relatedNotes: NoteEntry[] },
    restoreData?: AppState // For full backup restore
  } | null>(null);

  // Sync temp content when modal data changes
  useEffect(() => {
    if (modal?.data?.content) {
      setTempHtmlContent(modal.data.content);
    } else if (modal?.data?.detailContent) {
      setTempHtmlContent(modal.data.detailContent);
    } else {
      setTempHtmlContent('');
    }
  }, [modal]);
  
  // SAMPLE DATA CREATION
  const createSampleData = () => {
    const pId = 'p-sample-1';
    
    const wikis: WikiEntry[] = [
        { id: 'w-1', projectId: pId, code: 'W-GIL', title: 'Gılgamış Destanı Özeti', tags: ['mitoloji', 'sümer'], content: '<p><strong>Gılgamış Destanı</strong>, Mezopotamya\'dan günümüze ulaşan en eski edebi eserdir. Uruk kralı Gılgamış\'ın ölümsüzlüğü arayışını anlatır.</p>' },
        { id: 'w-2', projectId: pId, code: 'W-ISA', title: 'İsa Peygamber Hayatı', tags: ['din', 'tarih'], content: '<p>Celile\'de doğmuş, Hristiyanlığın merkezi figürüdür. 1. yüzyılda Roma İmparatorluğu\'nun Yahudiye eyaletinde yaşamıştır.</p>' }
    ];

    const citations: Citation[] = [
        { id: 'c-1', projectId: pId, code: 'REF-INAL', type: 'author', source: 'Halil İnalcık', description: 'Osmanlı Tarihçisi', number: 1 },
        { id: 'c-2', projectId: pId, code: 'LNK-WIKI', type: 'link', source: 'Wikipedia Kaynağı', description: 'Genel tarihçe sayfası', url: 'https://wikipedia.org', number: 2 }
    ];

    const notes: NoteEntry[] = [
        { id: 'n-1', projectId: 'global', type: 'note', title: 'Kitap Fikri: Uzay Operası', shortDescription: 'Yeni bir bilim kurgu serisi için fikirler.', content: '<p>Ana karakter bir pilot olmalı.</p>', tags: ['fikir', 'scifi'], status: 'pending', createdAt: new Date().toISOString() },
        { id: 'n-2', projectId: pId, type: 'task', title: 'Giriş bölümünü revize et', shortDescription: 'Dil bilgisi hataları kontrol edilecek.', content: '<p>Özellikle ilk paragraf çok uzun.</p>', tags: ['revizyon', 'acil'], status: 'pending', createdAt: new Date().toISOString() }
    ];

    const ch2: Chapter = { id: 'c-sub-1', title: 'Sümer Tabletleri', content: '<p>Tabletlerin okunması süreci...</p>', children: [] };
    const ch1: Chapter = { id: 'c-main-1', title: 'Giriş: Kadim Medeniyetler', content: '<p>Tarihin başlangıcına yolculuk...</p>', children: [ch2] };

    const project: Project = {
        id: pId,
        name: 'Tarih ve Mitoloji İncelemeleri',
        author: 'Anonim Araştırmacı',
        description: 'Örnek kitap veri seti.',
        longSummary: 'Bu kitap, antik medeniyetlerden günümüze uzanan tarihi ve mitolojik olayları incelemektedir.',
        plan: '1. Bölüm: Antik Çağ\n2. Bölüm: Orta Çağ\n3. Bölüm: Yeni Çağ',
        orientation: 'portrait',
        pageSize: 'A4',
        pageTheme: '#d8dee3',
        lastModified: new Date().toISOString(),
        chapters: [ch1]
    };

    return { project, wikis, citations, notes };
  };

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('bookwriter_state_v13'); // Bump version
    if (saved) return JSON.parse(saved);
    
    const { project, wikis, citations, notes } = createSampleData();
    return {
      currentProject: null,
      activeChapterId: null,
      projects: [project],
      wikis: wikis,        
      citations: citations,
      notes: notes,
      sidebarOpen: true,
      rightPanelOpen: true,
      rightPanelWidth: 320,
      activeRightTab: 'plan',
      editorViewOptions: { showSubChapters: true, showCitations: true }
    };
  });

  const isResizing = useRef(false);

  useEffect(() => {
    localStorage.setItem('bookwriter_state_v13', JSON.stringify(state));
  }, [state]);

  const createCheckpoint = useCallback(() => {
    localStorage.setItem('bookwriter_checkpoint', JSON.stringify(state));
    alert('Veritabanı yedeği başarıyla alındı.');
  }, [state]);

  const restoreCheckpoint = useCallback(() => {
    if(!confirm("Mevcut veriler silinecek ve son yedek yüklenecek. Onaylıyor musunuz?")) return;
    const saved = localStorage.getItem('bookwriter_checkpoint');
    if (saved) {
      setState(JSON.parse(saved));
      alert('Yedek geri yüklendi.');
      setModal(null);
    } else {
        alert("Kayıtlı yedek bulunamadı.");
    }
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const findChapter = (chapters: Chapter[], id: string): Chapter | undefined => {
      for (const c of chapters) {
          if (c.id === id) return c;
          if (c.children.length) {
              const found = findChapter(c.children, id);
              if (found) return found;
          }
      }
      return undefined;
  };

  const activeChapter = state.currentProject?.chapters && state.activeChapterId 
      ? findChapter(state.currentProject.chapters, state.activeChapterId) 
      : undefined;

  // --- FULL SYSTEM BACKUP & RESTORE ---

  const handleFullBackup = () => {
      const backupData = {
          version: '2.2.0',
          timestamp: new Date().toISOString(),
          state: state
      };

      const dateStr = new Date().toISOString().slice(0, 10);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `BookWriter_Backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleFullRestoreClick = () => {
      fullBackupInputRef.current?.click();
  };

  const handleFullRestoreRequest = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              if (!json.state || !json.state.projects) {
                  alert('Geçersiz yedek dosyası formatı.');
                  return;
              }
              
              setModal({ type: 'full-restore-confirm', restoreData: json.state });

          } catch (err) {
              alert('Dosya okunamadı. JSON formatı bozuk olabilir.');
          }
          if (fullBackupInputRef.current) fullBackupInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const performFullRestore = () => {
      if (modal?.type === 'full-restore-confirm' && modal.restoreData) {
          setState(modal.restoreData);
          setModal(null);
          alert('Sistem başarıyla geri yüklendi.');
          setView('dashboard');
      }
  };

  // --- Project Actions ---

  const openProject = (project: Project) => {
    setState(prev => ({
      ...prev,
      currentProject: project,
      activeChapterId: project.chapters[0]?.id || null
    }));
    setView('editor');
  };

  const handleUpdateProjectSettings = (settings: Partial<Project>) => {
    if (!state.currentProject) return;
    const updated = { ...state.currentProject, ...settings };
    setState(prev => ({
        ...prev,
        currentProject: updated,
        projects: prev.projects.map(p => p.id === updated.id ? updated : p)
    }));
  };

  // --- Dashboard Project Management Actions ---
  
  const handleEditProjectProperties = (project: Project) => {
      setModal({ type: 'project', mode: 'edit', data: project });
      setWizardColor(project.pageTheme || '#d8dee3');
      setProjectModalTab('general');
  };

  const handleDuplicateProject = (project: Project) => {
      const newId = `p-${Date.now()}`;
      const newProject: Project = {
          ...project,
          id: newId,
          name: `${project.name} (Kopya)`,
          lastModified: new Date().toISOString()
      };
      
      const newWikis = state.wikis.filter(w => w.projectId === project.id).map(w => ({
          ...w, id: `w-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, projectId: newId
      }));

      const newCitations = state.citations.filter(c => c.projectId === project.id).map(c => ({
          ...c, id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, projectId: newId
      }));

      const newNotes = state.notes.filter(n => n.projectId === project.id).map(n => ({
          ...n, id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, projectId: newId
      }));

      setState(prev => ({
          ...prev,
          projects: [...prev.projects, newProject],
          wikis: [...prev.wikis, ...newWikis],
          citations: [...prev.citations, ...newCitations],
          notes: [...prev.notes, ...newNotes]
      }));
  };

  // Instead of direct delete, open confirmation modal
  const handleDeleteProjectRequest = (project: Project) => {
      setModal({ type: 'delete-confirm', data: project, deleteType: 'project' });
  };

  // Actual Delete Action
  const performDeleteProject = (project: Project) => {
      setState(prev => ({
          ...prev,
          projects: prev.projects.filter(p => p.id !== project.id),
          wikis: prev.wikis.filter(w => w.projectId !== project.id),
          citations: prev.citations.filter(c => c.projectId !== project.id),
          notes: prev.notes.filter(n => n.projectId !== project.id),
          currentProject: prev.currentProject?.id === project.id ? null : prev.currentProject
      }));
      setModal(null);
  };

  // --- IMPORT / EXPORT LOGIC ---

  const handleExportProject = (project: Project) => {
      const projectData = {
          project: project,
          relatedWikis: state.wikis.filter(w => w.projectId === project.id),
          relatedCitations: state.citations.filter(c => c.projectId === project.id),
          relatedNotes: state.notes.filter(n => n.projectId === project.id)
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  // Generic Export for single items
  const handleExportItem = (type: 'wiki' | 'citation' | 'note', item: any) => {
      const exportData = {
          type: type,
          data: item,
          exportedAt: new Date().toISOString()
      };
      
      const title = item.title || item.source || 'Item';
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${type}_${title.substring(0,10).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              
              // 1. PROJECT IMPORT
              if (json.project && json.project.id) {
                  const existingProject = state.projects.find(p => p.id === json.project.id);
                  if (existingProject) {
                      setModal({ 
                          type: 'import-conflict', 
                          data: existingProject, 
                          importData: json 
                      });
                  } else {
                      integrateImportedProject(json);
                  }
                  return;
              }

              // 2. SINGLE ITEM IMPORT (Wiki, Citation, Note)
              if (json.type && json.data) {
                  const item = json.data;
                  // Assign new ID to prevent hard conflicts, or could check existence. 
                  // For simplicity, we assume we want to import it as a copy or new item.
                  // But user might want to restore. Let's keep ID but if exists, maybe append (Copy).
                  // For now: Just add. If ID conflicts, it might be weird. Let's regenerate ID for single item imports to be safe.
                  const newItem = { ...item, id: `${json.type[0]}-${Date.now()}` }; 
                  
                  if (json.type === 'wiki') {
                      setState(prev => ({ ...prev, wikis: [...prev.wikis, newItem] }));
                      alert('Wiki başarıyla içeri aktarıldı.');
                  } else if (json.type === 'citation') {
                      setState(prev => ({ ...prev, citations: [...prev.citations, newItem] }));
                      alert('Kaynak başarıyla içeri aktarıldı.');
                  } else if (json.type === 'note') {
                      setState(prev => ({ ...prev, notes: [...prev.notes, newItem] }));
                      alert('Not başarıyla içeri aktarıldı.');
                  }
                  return;
              }

              alert('Geçersiz veya tanınmayan dosya formatı.');

          } catch (err) {
              alert('Dosya okunamadı. JSON formatı bozuk olabilir.');
          }
          // Reset input
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const integrateImportedProject = (data: any) => {
      setState(prev => {
          // Clean existing data if ID matches (Overwrite logic)
          const filteredProjects = prev.projects.filter(p => p.id !== data.project.id);
          const filteredWikis = prev.wikis.filter(w => w.projectId !== data.project.id);
          const filteredCitations = prev.citations.filter(c => c.projectId !== data.project.id);
          const filteredNotes = prev.notes.filter(n => n.projectId !== data.project.id);

          return {
              ...prev,
              projects: [...filteredProjects, data.project],
              wikis: [...filteredWikis, ...(data.relatedWikis || [])],
              citations: [...filteredCitations, ...(data.relatedCitations || [])],
              notes: [...filteredNotes, ...(data.relatedNotes || [])],
          };
      });
      alert('Proje başarıyla içe aktarıldı.');
      setModal(null);
  };

  // -------------------------

  const handleOpenDraft = () => {
      if (state.currentProject) {
          setView('editor');
          return;
      }
      
      const draftProject: Project = {
          id: `draft-${Date.now()}`,
          name: 'Adsız Taslak Çalışma',
          author: 'Ben',
          description: 'Hızlı taslak modu.',
          longSummary: '',
          plan: '',
          orientation: 'portrait',
          pageSize: 'A4',
          pageTheme: '#ffffff',
          chapters: [{
              id: 'draft-ch-1',
              title: 'Taslak Metin',
              content: '<p>Düşüncelerinizi buraya yazmaya başlayın...</p>',
              children: []
          }],
          lastModified: new Date().toISOString(),
          isDraft: true
      };

      setState(prev => ({
          ...prev,
          currentProject: draftProject,
          activeChapterId: draftProject.chapters[0].id
      }));
      setView('editor');
  };

  const handleSidebarDashboardClick = () => {
      if (state.currentProject?.isDraft) {
          setModal({ type: 'save-draft' });
      } else {
          setView('dashboard');
      }
  };

  const handleSaveDraftAsProject = () => {
      if (!state.currentProject) return;

      const realProject: Project = {
          ...state.currentProject,
          isDraft: false,
          name: state.currentProject.name === 'Adsız Taslak Çalışma' ? `Taslak ${new Date().toLocaleDateString()}` : state.currentProject.name
      };

      setState(prev => ({
          ...prev,
          projects: [...prev.projects, realProject],
          currentProject: realProject
      }));
      setModal(null);
      setView('dashboard');
  };

  const handleDiscardDraft = () => {
      setState(prev => ({
          ...prev,
          currentProject: null,
          activeChapterId: null
      }));
      setModal(null);
      setView('dashboard');
  };

  const handleSaveProjectModal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Check if editing existing project
    if (modal?.mode === 'edit' && modal.data) {
        const updatedProject: Project = {
            ...modal.data,
            name: (formData.get('name') as string) || '',
            author: (formData.get('author') as string) || '',
            description: (formData.get('description') as string) || '',
            longSummary: (formData.get('longSummary') as string) || '',
            plan: (formData.get('plan') as string) || '',
            orientation: (formData.get('orientation') as any) || 'portrait',
            pageSize: (formData.get('pageSize') as any) || 'A4',
            pageTheme: (formData.get('pageTheme') as string) || '#d8dee3',
            lastModified: new Date().toISOString(),
        };

        setState(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === updatedProject.id ? updatedProject : p),
            currentProject: prev.currentProject?.id === updatedProject.id ? updatedProject : prev.currentProject
        }));
        
        setModal(null);
        return;
    }

    // Creating new Project
    const defaultPagesRaw = formData.get('defaultPages') as string;
    const defaultPages = defaultPagesRaw 
        ? defaultPagesRaw.split('\n').filter(t => t.trim()).map((t, i) => ({
            id: `c-${Date.now()}-${i}`,
            title: t.trim(),
            content: '',
            children: []
        }))
        : [{
            id: `c-${Date.now()}`,
            title: 'Giriş',
            content: '<p>Hikayeniz burada başlıyor...</p>',
            children: []
        }];

    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: (formData.get('name') as string) || '',
      author: (formData.get('author') as string) || '',
      description: (formData.get('description') as string) || '',
      longSummary: (formData.get('longSummary') as string) || '',
      plan: (formData.get('plan') as string) || '',
      orientation: (formData.get('orientation') as any) || 'portrait',
      pageSize: (formData.get('pageSize') as any) || 'A4',
      pageTheme: (formData.get('pageTheme') as string) || '#d8dee3',
      chapters: defaultPages,
      lastModified: new Date().toISOString(),
      isDraft: false
    };
    setState(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
      currentProject: newProject,
      activeChapterId: newProject.chapters[0].id
    }));
    setModal(null);
    setProjectModalTab('general');
    setWizardColor('#d8dee3');
    setView('editor');
  };

  // --- Sidebar / Structure Actions ---

  const handleRenameChapter = (id: string, newTitle: string) => {
      if (!state.currentProject) return;
      const updateTitle = (chapters: Chapter[]): Chapter[] => {
          return chapters.map(c => {
              if (c.id === id) return { ...c, title: newTitle };
              if (c.children.length) return { ...c, children: updateTitle(c.children) };
              return c;
          });
      };
      const updatedChapters = updateTitle(state.currentProject.chapters);
      const updatedProject = { ...state.currentProject, chapters: updatedChapters };
      setState(s => ({ ...s, currentProject: updatedProject, projects: s.projects.map(p => p.id === updatedProject.id ? updatedProject : p) }));
  };

  const handleAddChapter = (parentId?: string) => {
    if (!state.currentProject) return;
    const newChapter: Chapter = {
        id: `c-${Date.now()}`,
        title: parentId ? 'Yeni Alt Sayfa' : 'Yeni Bölüm',
        content: '',
        children: []
    };
    const cloneChapters = (chapters: Chapter[]): Chapter[] => {
        if (!parentId) return [...chapters, newChapter];
        return chapters.map(c => {
            if (c.id === parentId) return { ...c, children: [...c.children, newChapter] };
            if (c.children.length) return { ...c, children: cloneChapters(c.children) };
            return c;
        });
    };
    const updatedChapters = cloneChapters(state.currentProject.chapters);
    const updatedProject = { ...state.currentProject, chapters: updatedChapters };
    
    setState(s => ({ ...s, currentProject: updatedProject, activeChapterId: newChapter.id }));
  };

  // Triggers deletion confirmation
  const handleDeleteChapterRequest = (id: string) => {
    if (!state.currentProject) return;
    const chapter = findChapter(state.currentProject.chapters, id);
    if(chapter) {
        setModal({ type: 'delete-confirm', data: chapter, deleteType: 'chapter' });
    }
  };

  // Executes actual deletion
  const performDeleteChapter = (chapter: Chapter) => {
    if (!state.currentProject) return;
    const id = chapter.id;

    const filterChapters = (chapters: Chapter[]): Chapter[] => {
        return chapters.filter(c => c.id !== id).map(c => ({
            ...c, children: filterChapters(c.children)
        }));
    };
    
    const updatedChapters = filterChapters(state.currentProject.chapters);
    const updatedProject = { ...state.currentProject, chapters: updatedChapters };
    
    let nextActive = state.activeChapterId;
    if (state.activeChapterId === id) {
        nextActive = updatedChapters[0]?.id || null;
    }
    
    setState(s => ({ 
        ...s, 
        currentProject: updatedProject, 
        activeChapterId: nextActive,
        projects: s.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    }));
    setModal(null);
  };

  const handleMoveChapter = (id: string, direction: 'up' | 'down') => {
      if (!state.currentProject) return;
      const moveInList = (list: Chapter[]): Chapter[] => {
          const index = list.findIndex(c => c.id === id);
          if (index > -1) {
              const newList = [...list];
              if (direction === 'up' && index > 0) [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
              else if (direction === 'down' && index < list.length - 1) [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
              return newList;
          }
          return list.map(c => ({ ...c, children: moveInList(c.children) }));
      };
      const updatedChapters = moveInList(state.currentProject.chapters);
      setState(s => ({ ...s, currentProject: { ...s.currentProject!, chapters: updatedChapters } }));
  };

  const handleUpdateChapterContent = (id: string, content: string) => {
    if (!state.currentProject) return;
    const updateChaptersRecursive = (chapters: Chapter[]): Chapter[] => {
      return chapters.map(c => {
        if (c.id === id) return { ...c, content };
        if (c.children.length > 0) return { ...c, children: updateChaptersRecursive(c.children) };
        return c;
      });
    };
    const updatedChapters = updateChaptersRecursive(state.currentProject.chapters);
    const updatedProject = { ...state.currentProject, chapters: updatedChapters };
    setState(prev => ({
      ...prev, currentProject: updatedProject, projects: prev.projects.map(p => p.id === updatedProject.id ? updatedProject : p)
    }));
  };

  // --- GLOBAL Data Management ---
  
  const handleSaveWiki = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const content = fd.get('content-html') as string; 
      const targetProjectId = fd.get('projectId') as string;

      if (!targetProjectId) return;

      const newWiki: WikiEntry = {
          id: modal?.data?.id || `w-${Date.now()}`,
          projectId: targetProjectId,
          code: modal?.data?.code || `WIKI-${Math.floor(1000 + Math.random() * 9000)}`,
          title: (fd.get('title') as string) || '',
          content: content || '',
          tags: (fd.get('tags') as string || '').split(',').map(s => s.trim()).filter(Boolean)
      };

      let updatedWikis = [...state.wikis];
      if (modal?.mode === 'edit') {
          updatedWikis = updatedWikis.map(w => w.id === newWiki.id ? newWiki : w);
      } else {
          updatedWikis.push(newWiki);
      }
      setState(s => ({ ...s, wikis: updatedWikis }));
      
      if(modal?.type === 'link-selector' || pendingSelectionRange) {
          handleLinkItem('wiki', newWiki);
          setModal(null);
      } else {
          setModal({ type: 'database', dbTab: 'wiki' });
      }
  };

  const handleDeleteWikiRequest = (wiki: WikiEntry) => {
      setModal({ type: 'delete-confirm', data: wiki, deleteType: 'wiki' });
  };

  const performDeleteWiki = (wiki: WikiEntry) => {
      setState(s => ({ ...s, wikis: s.wikis.filter(w => w.id !== wiki.id) }));
      setModal(null);
  };

  const handleSaveCitation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const targetProjectId = fd.get('projectId') as string;
    
    if (!targetProjectId) return;
    
    const newCitation: Citation = {
        id: modal?.data?.id || `cite-${Date.now()}`,
        projectId: targetProjectId,
        code: modal?.data?.code || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        type: fd.get('type') as any,
        source: (fd.get('source') as string) || '',
        description: (fd.get('description') as string) || '',
        detailContent: (fd.get('detailContent') as string) || '',
        url: (fd.get('url') as string) || '',
        author: (fd.get('author') as string) || '',
        number: modal?.data?.number || 0
    };

    let updatedCitations = [...state.citations];
    if (modal?.mode === 'edit') {
        updatedCitations = updatedCitations.map(c => c.id === newCitation.id ? newCitation : c);
    } else {
        updatedCitations.push(newCitation);
    }
    setState(s => ({ ...s, citations: updatedCitations }));
    
    if(modal?.type === 'link-selector' || pendingSelectionRange) {
        handleLinkItem('citation', newCitation);
        setModal(null);
    } else {
        setModal({ type: 'database', dbTab: 'citations' });
    }
  };

  const handleDeleteCitationRequest = (citation: Citation) => {
      setModal({ type: 'delete-confirm', data: citation, deleteType: 'citation' });
  };

  const performDeleteCitation = (citation: Citation) => {
      setState(s => ({ ...s, citations: s.citations.filter(c => c.id !== citation.id) }));
      setModal(null);
  };

  const handleSaveNote = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const content = fd.get('content-html') as string;
      const targetProjectId = fd.get('projectId') as string;

      const newNote: NoteEntry = {
          id: modal?.data?.id || `n-${Date.now()}`,
          projectId: targetProjectId,
          type: fd.get('type') as any,
          title: (fd.get('title') as string) || '',
          shortDescription: (fd.get('shortDescription') as string) || '',
          content: content || '',
          tags: (fd.get('tags') as string || '').split(',').map(s => s.trim()).filter(Boolean),
          status: 'pending',
          createdAt: modal?.data?.createdAt || new Date().toISOString()
      };

      let updatedNotes = [...state.notes];
      if (modal?.mode === 'edit') {
          updatedNotes = updatedNotes.map(n => n.id === newNote.id ? newNote : n);
      } else {
          updatedNotes.push(newNote);
      }
      setState(s => ({ ...s, notes: updatedNotes }));
      setModal({ type: 'database', dbTab: 'notes' });
  };

  const handleDeleteNoteRequest = (note: NoteEntry) => {
      setModal({ type: 'delete-confirm', data: note, deleteType: 'note' });
  };

  const performDeleteNote = (note: NoteEntry) => {
      setState(s => ({ ...s, notes: s.notes.filter(n => n.id !== note.id) }));
      setModal(null);
  };

  // --- Linking Logic ---

  const handleOpenLinkSelector = (type: 'wiki' | 'citation', range: Range, text: string) => {
      setPendingSelectionRange(range);
      setPendingSelectionText(text);
      setModal({ type: 'link-selector', linkType: type });
      setSearchQuery('');
      setFilterScope('current');
  };

  const handleLinkItem = (type: 'wiki' | 'citation', item: any) => {
      if (!pendingSelectionRange || !state.currentProject) return;

      const span = document.createElement('span');
      span.className = "citation-marker text-indigo-600 font-bold cursor-pointer hover:underline relative mx-0.5";
      span.setAttribute('data-id', item.id);
      span.setAttribute('data-type', type);
      span.setAttribute('contenteditable', 'false');
      span.innerText = `(*)`; // Temporary placeholder, updated by Editor

      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(pendingSelectionRange);
      pendingSelectionRange.deleteContents();
      
      const textNode = document.createTextNode(pendingSelectionText || item.title || item.source);
      pendingSelectionRange.insertNode(span);
      span.parentNode?.insertBefore(textNode, span);

      // Force update content immediately
      if (state.activeChapterId) {
          const editor = document.querySelector('.editor-content') as HTMLElement;
          if(editor) {
              const newContent = editor.innerHTML;
              handleUpdateChapterContent(state.activeChapterId, newContent);
          }
      }
      
      setPendingSelectionRange(null);
      setPendingSelectionText('');
      setModal(null);
  };

  // Resize logic
  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 200 && newWidth < 500) {
      setState(s => ({ ...s, rightPanelWidth: newWidth }));
    }
  }, []);

  // --- Filtering Logic ---
  const getFilteredItems = (type: 'wiki' | 'citation' | 'note') => {
      let items: any[] = type === 'wiki' ? state.wikis : type === 'citation' ? state.citations : state.notes;

      items = items.map(item => ({
          ...item,
          projectName: item.projectId === 'global' ? 'Genel' : (state.projects.find(p => p.id === item.projectId)?.name || 'Bilinmeyen')
      }));

      if (filterScope === 'current' && state.currentProject) {
          items = items.filter(item => item.projectId === state.currentProject?.id);
      }
      
      return items.filter(item => {
          const text = (item.title || item.source || '').toLowerCase();
          const q = searchQuery.toLowerCase();
          const code = (item.code || '').toLowerCase();
          const desc = (item.shortDescription || item.description || '').toLowerCase();
          const content = (item.content || '').toLowerCase();
          return text.includes(q) || code.includes(q) || desc.includes(q) || content.includes(q);
      });
  };

  const filteredWikis = getFilteredItems('wiki');
  const filteredCitations = getFilteredItems('citation');
  const filteredNotes = getFilteredItems('note');

  // --- Modal Header Logic ---
  const getModalHeader = () => {
    if (!modal) return null;

    if (modal.type === 'delete-confirm') {
        const itemType = modal.deleteType === 'wiki' ? 'Wiki' : modal.deleteType === 'citation' ? 'Kaynak' : modal.deleteType === 'note' ? 'Not' : modal.deleteType === 'chapter' ? 'Sayfa/Bölüm' : 'Proje';
        return { title: `${itemType} Sil`, subtitle: 'Bu işlem geri alınamaz.', icon: Trash2, color: 'text-red-600 bg-red-50' };
    }
    if (modal.type === 'full-restore-confirm') {
        return { title: 'Sistem Geri Yükleme', subtitle: 'Çakışma raporu ve onay', icon: RefreshCw, color: 'text-orange-600 bg-orange-50' };
    }
    if (modal.type === 'import-conflict') {
        return { title: 'Proje Çakışması', subtitle: 'Bu ID\'ye sahip bir proje zaten var.', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' };
    }
    if (modal.type === 'link-selector') {
        const isWiki = modal.linkType === 'wiki';
        return {
            title: isWiki ? 'Wiki Bağla' : 'Kaynak Bağla',
            subtitle: isWiki ? 'Metne bir bilgi notu ekleyin' : 'Metne bir kaynak veya alıntı ekleyin',
            icon: isWiki ? FileText : BookOpen,
            color: isWiki ? 'text-indigo-600 bg-indigo-50' : 'text-emerald-600 bg-emerald-50'
        };
    }
    if (modal.type === 'project') {
        return { title: 'Yeni Kitap', subtitle: 'Proje oluşturma sihirbazı', icon: Book, color: 'text-slate-800 bg-slate-100' };
    }
    if (modal.type === 'database') {
        if (modal.dbTab === 'notes') return { title: 'Notlar & Görevler', subtitle: 'Proje notları ve yapılacaklar', icon: ClipboardList, color: 'text-blue-600 bg-blue-50' };
        if (modal.dbTab === 'wiki') return { title: 'Wiki Kütüphanesi', subtitle: 'Karakterler, yerler ve bilgiler', icon: FileText, color: 'text-indigo-600 bg-indigo-50' };
        return { title: 'Kaynak Yönetimi', subtitle: 'Alıntılar, referanslar ve kaynakça', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' };
    }
    if (modal.type === 'wiki') return { title: 'Wiki Düzenle', subtitle: 'Wiki kaydını güncelle', icon: FileText, color: 'text-indigo-600 bg-indigo-50' };
    if (modal.type === 'citation') return { title: 'Kaynak Düzenle', subtitle: 'Kaynak kaydını güncelle', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' };
    if (modal.type === 'note') return { title: 'Not Düzenle', subtitle: 'Not detaylarını düzenle', icon: StickyNote, color: 'text-blue-600 bg-blue-50' };
    
    return { title: 'Önizleme', subtitle: 'Kayıt detayları', icon: Eye, color: 'text-slate-500 bg-slate-100' };
  };

  const modalHeader = getModalHeader();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#c7d5e1] text-[13px] selection:bg-blue-100 font-sans">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
      <input type="file" ref={fullBackupInputRef} className="hidden" accept=".json" onChange={handleFullRestoreRequest} />
      
      {view === 'dashboard' ? (
        <Dashboard 
          projects={state.projects} 
          wikis={state.wikis} 
          citations={state.citations} 
          notes={state.notes} // Pass Notes
          onOpenProject={openProject} 
          onCreateProject={() => { setModal({ type: 'project' }); setProjectModalTab('general'); setWizardColor('#d8dee3'); }}
          onEditProject={handleEditProjectProperties}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProjectRequest}
          onExportProject={handleExportProject}
          onImportProject={handleImportClick}
          onOpenDraft={handleOpenDraft}
          onRestore={restoreCheckpoint}
          onAddWiki={() => { setModal({ type: 'database', dbTab: 'wiki', mode: 'create' }); setFilterScope('all'); }}
          onAddCitation={() => { setModal({ type: 'database', dbTab: 'citations', mode: 'create' }); setFilterScope('all'); }}
          onAddNote={() => { setModal({ type: 'database', dbTab: 'notes', mode: 'create' }); setFilterScope('all'); }}
          onOpenSettings={() => { setModal({ type: 'settings' }); setSettingsTab('app'); }}
          onEditWiki={(wiki) => setModal({ type: 'wiki', data: wiki, mode: 'edit' })}
          onEditCitation={(citation) => setModal({ type: 'citation', data: citation, mode: 'edit' })}
          onEditNote={(note) => setModal({ type: 'note', data: note, mode: 'edit' })}
          onExportItem={handleExportItem}
          onDeleteItem={(type, item) => {
              if (type === 'wiki') handleDeleteWikiRequest(item);
              if (type === 'citation') handleDeleteCitationRequest(item);
              if (type === 'note') handleDeleteNoteRequest(item);
          }}
        />
      ) : (
        <>
          <Sidebar 
            project={state.currentProject} 
            activeChapterId={state.activeChapterId}
            collapsed={!state.sidebarOpen}
            onSelectChapter={(id) => setState(s => ({ ...s, activeChapterId: id }))}
            onGoDashboard={handleSidebarDashboardClick}
            onToggle={() => setState(s => ({ ...s, sidebarOpen: !s.sidebarOpen }))}
            onAddChapter={handleAddChapter}
            onDeleteChapter={handleDeleteChapterRequest}
            onMoveChapter={handleMoveChapter}
            onRenameChapter={handleRenameChapter}
          />

          <main className={`flex-1 flex flex-col bg-[#c7d5e1] transition-all border-r border-l border-slate-200/50 ${isPreview ? 'overflow-auto' : 'overflow-hidden'}`}>
            {/* ... Header and Content ... */}
            {!isPreview && (
              <header className="h-14 border-b border-slate-300/50 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-200"><ChevronLeft size={14} /></button>
                     <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors border border-slate-200"><ChevronRight size={14} /></button>
                  </div>
                  <h1 className="font-bold text-slate-800 text-sm tracking-tight border-r border-slate-200 pr-4 mr-2">
                    {state.currentProject?.name}
                    {state.currentProject?.isDraft && <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] uppercase">Taslak</span>}
                  </h1>
                  
                  <div className="flex items-center gap-2">
                     <button 
                        onClick={() => { setModal({ type: 'database', dbTab: 'wiki' }); setFilterScope('current'); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                     >
                        <FileText size={14} className="text-indigo-500"/> Wiki Ekle
                     </button>
                     <button 
                        onClick={() => { setModal({ type: 'database', dbTab: 'citations' }); setFilterScope('current'); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 rounded-lg text-[11px] font-bold transition-all shadow-sm"
                     >
                        <BookOpen size={14} className="text-emerald-500"/> Kaynak Ekle
                     </button>
                  </div>

                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setModal({ type: 'database', dbTab: 'notes', mode: 'create' }); setFilterScope('current'); }}
                    className="px-3 py-1.5 bg-[#fef9c3] text-slate-800 border border-yellow-200 hover:bg-[#fef08a] rounded-lg flex items-center gap-2 text-xs font-bold transition-all shadow-sm hover:shadow-md"
                  >
                      <NotebookPen size={16} className="text-slate-600" /> Not/Görev
                  </button>
                </div>
              </header>
            )}

            <div className={`flex-1 overflow-y-auto custom-scroll relative ${isPreview ? '' : 'bg-[#c7d5e1]'}`}>
              <div 
                className={`${state.currentProject?.orientation === 'landscape' ? 'max-w-5xl' : 'max-w-[850px]'} mx-auto min-h-[1000px] p-12 transition-all shadow-2xl my-10 border border-slate-200`}
                style={{ backgroundColor: state.currentProject?.pageTheme || '#ffffff' }}
              >
                
                {isPreview && (
                    <div className="fixed top-6 right-6 z-50">
                        <button onClick={() => setIsPreview(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full font-bold shadow-xl hover:bg-slate-800 transition-all">
                            <ArrowLeft size={16} /> Editöre Dön
                        </button>
                    </div>
                )}

                <RichTextEditor 
                  chapter={state.activeChapterId && !isPreview ? activeChapter : undefined} 
                  content={isPreview && activeChapter ? activeChapter.content : ''}
                  onChange={(val) => state.activeChapterId && handleUpdateChapterContent(state.activeChapterId, val)}
                  onLinkRequested={handleOpenLinkSelector}
                  wikis={state.wikis} 
                  citations={state.citations} 
                  onPreview={() => setIsPreview(true)}
                  mode="full"
                  viewOptions={state.editorViewOptions}
                  pageTheme={state.currentProject?.pageTheme || '#ffffff'}
                />
              </div>
            </div>
          </main>

          <div style={{ width: state.rightPanelOpen ? state.rightPanelWidth : 0 }} className="flex-shrink-0 bg-white flex flex-col relative transition-all duration-300 shadow-xl z-20">
            {state.rightPanelOpen && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400 z-50" onMouseDown={startResizing} />
                
                <button 
                    onClick={() => setState(s => ({ ...s, rightPanelOpen: false }))}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full p-2 bg-slate-200 border border-r-0 border-slate-300 rounded-l-xl shadow-md text-slate-500 hover:text-indigo-600 hover:bg-white transition-all z-50 group"
                >
                    <ChevronRight size={24} />
                </button>

                <RightPanel 
                  project={state.currentProject}
                  globalWikis={state.wikis}
                  globalCitations={state.citations}
                  togglePanel={() => setState(s => ({ ...s, rightPanelOpen: false }))}
                  viewOptions={state.editorViewOptions}
                  onViewOptionsChange={(newOpts) => setState(s => ({ ...s, editorViewOptions: newOpts }))}
                  onUpdateProject={handleUpdateProjectSettings}
                />
              </>
            )}
            {!state.rightPanelOpen && (
              <button onClick={() => setState(s => ({ ...s, rightPanelOpen: true }))} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-slate-200 border border-r-0 border-slate-300 rounded-l-xl shadow-md text-slate-500 hover:text-indigo-600 hover:bg-white hover:pl-4 transition-all z-50">
                <ChevronLeft size={24} />
              </button>
            )}
          </div>
        </>
      )}

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          {/* DELETE CONFIRM MODAL */}
          {modal.type === 'delete-confirm' && modal.data ? (
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center border border-slate-100 animate-in zoom-in-95 duration-200">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trash2 size={40} strokeWidth={2} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                      {modal.deleteType === 'wiki' ? 'Wiki Sil?' : modal.deleteType === 'citation' ? 'Kaynak Sil?' : modal.deleteType === 'note' ? 'Not Sil?' : modal.deleteType === 'chapter' ? 'Sayfa/Bölüm Sil?' : 'Projeyi Sil?'}
                  </h3>
                  
                  <p className="text-sm text-slate-500 mb-2 px-2">
                      <span className="font-bold text-slate-800">{modal.data.name || modal.data.title || modal.data.source}</span> öğesi silinecek.
                  </p>
                  
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                      BU İŞLEM GERİ ALINAMAZ.
                  </p>

                  <div className="flex gap-4">
                      <button 
                        onClick={() => setModal(null)} 
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm uppercase hover:bg-slate-200 transition-colors"
                      >
                          VAZGEÇ
                      </button>
                      <button 
                        onClick={() => {
                            if (modal.deleteType === 'wiki') performDeleteWiki(modal.data);
                            else if (modal.deleteType === 'citation') performDeleteCitation(modal.data);
                            else if (modal.deleteType === 'note') performDeleteNote(modal.data);
                            else if (modal.deleteType === 'chapter') performDeleteChapter(modal.data);
                            else performDeleteProject(modal.data);
                        }} 
                        className="flex-1 py-3 bg-[#dc2626] text-white rounded-lg font-bold text-sm uppercase hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                      >
                          EVET, SİL
                      </button>
                  </div>
              </div>
          ) : modal.type === 'full-restore-confirm' && modal.restoreData ? (
              // ... (Same restore modal) ...
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full border border-slate-200 flex flex-col">
                  {/* ... Same content as previous step ... */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-orange-50">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white text-orange-600 rounded-xl shadow-sm border border-orange-100">
                              <RefreshCw size={24} />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-800">Sistem Geri Yükleme Onayı</h3>
                              <p className="text-xs text-orange-700 font-medium">Mevcut veriler silinecek ve yedek dosyasındaki veriler yüklenecektir.</p>
                          </div>
                      </div>
                      <button onClick={() => setModal(null)} className="p-2 hover:bg-white/50 rounded-lg text-slate-500 transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="p-8 grid grid-cols-2 gap-8 relative">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 text-[10px] font-black p-2 rounded-full border-4 border-white z-10">VS</div>
                      <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center mb-4">MEVCUT DURUM</h4>
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-500 flex items-center gap-2"><Book size={14}/> Projeler</span>
                                  <span className="font-bold text-slate-800">{state.projects.length}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-500 flex items-center gap-2"><FileText size={14}/> Wikiler</span>
                                  <span className="font-bold text-slate-800">{state.wikis.length}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-500 flex items-center gap-2"><BookOpen size={14}/> Kaynaklar</span>
                                  <span className="font-bold text-slate-800">{state.citations.length}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-500 flex items-center gap-2"><StickyNote size={14}/> Notlar</span>
                                  <span className="font-bold text-slate-800">{state.notes.length}</span>
                              </div>
                          </div>
                          <div className="text-center text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">
                              Bu veriler kalıcı olarak silinecek!
                          </div>
                      </div>
                      <div className="space-y-4">
                          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest text-center mb-4">YÜKLENECEK YEDEK</h4>
                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between text-sm">
                                  <span className="text-indigo-600 flex items-center gap-2"><Book size={14}/> Projeler</span>
                                  <span className="font-bold text-indigo-900">{modal.restoreData.projects?.length || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-indigo-600 flex items-center gap-2"><FileText size={14}/> Wikiler</span>
                                  <span className="font-bold text-indigo-900">{modal.restoreData.wikis?.length || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-indigo-600 flex items-center gap-2"><BookOpen size={14}/> Kaynaklar</span>
                                  <span className="font-bold text-indigo-900">{modal.restoreData.citations?.length || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-indigo-600 flex items-center gap-2"><StickyNote size={14}/> Notlar</span>
                                  <span className="font-bold text-indigo-900">{modal.restoreData.notes?.length || 0}</span>
                              </div>
                          </div>
                          <div className="text-center text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg">
                              Bu veriler sisteme eklenecek.
                          </div>
                      </div>
                  </div>

                  <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3">
                      <button onClick={() => setModal(null)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors uppercase tracking-wider">
                          İptal Et
                      </button>
                      <button 
                        onClick={performFullRestore}
                        className="px-6 py-3 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex items-center gap-2 uppercase tracking-wider"
                      >
                          <RefreshCw size={16} /> Onayla ve Geri Yükle
                      </button>
                  </div>
              </div>
          ) : modal.type === 'import-conflict' && modal.data && modal.importData ? (
              // ... (Same conflict modal) ...
               <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full border border-slate-200 flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-orange-50">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white text-orange-500 rounded-xl shadow-sm">
                              <AlertTriangle size={24} />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-slate-800">Proje Çakışması Algılandı</h3>
                              <p className="text-xs text-orange-700 font-medium">Bu ID'ye sahip bir proje zaten sistemde mevcut.</p>
                          </div>
                      </div>
                      <button onClick={() => setModal(null)} className="p-2 hover:bg-white/50 rounded-lg text-slate-500 transition-colors"><X size={20}/></button>
                  </div>
                  <div className="p-8 grid grid-cols-2 gap-8">
                      {/* Current Project */}
                      <div className="relative group">
                          <div className="absolute -top-3 left-4 bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-black uppercase rounded tracking-widest border border-slate-200">Mevcut Proje</div>
                          <div className="p-5 border-2 border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
                              <h4 className="font-bold text-slate-800 text-lg mb-1">{modal.data.name}</h4>
                              <p className="text-xs text-slate-500 mb-4">{modal.data.author}</p>
                              
                              <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Calendar size={14} className="text-slate-400" /> 
                                      {new Date(modal.data.lastModified).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Layers size={14} className="text-slate-400" /> 
                                      {modal.data.chapters.length} Bölüm
                                  </div>
                              </div>
                          </div>
                      </div>
                      {/* Imported Project */}
                      <div className="relative group">
                          <div className="absolute -top-3 left-4 bg-indigo-100 text-indigo-600 px-2 py-0.5 text-[10px] font-black uppercase rounded tracking-widest border border-indigo-200">Yedek Dosyası</div>
                          <div className="p-5 border-2 border-indigo-100 rounded-xl bg-indigo-50/30 hover:bg-white hover:border-indigo-300 transition-all">
                              <h4 className="font-bold text-slate-800 text-lg mb-1">{modal.importData.project.name}</h4>
                              <p className="text-xs text-slate-500 mb-4">{modal.importData.project.author}</p>
                              
                              <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Calendar size={14} className="text-indigo-400" /> 
                                      {new Date(modal.importData.project.lastModified).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                      <Layers size={14} className="text-indigo-400" /> 
                                      {modal.importData.project.chapters.length} Bölüm
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3">
                      <button onClick={() => setModal(null)} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors uppercase">
                          İptal Et
                      </button>
                      <button 
                        onClick={() => integrateImportedProject(modal.importData)}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 uppercase"
                      >
                          <RefreshCw size={14} /> Üzerine Yaz & Güncelle
                      </button>
                  </div>
              </div>
          ) : modal.type === 'save-draft' ? (
              // ... (Same draft modal) ...
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 text-center">
                  <div className="mx-auto w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4">
                      <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Taslak Kaydedilsin mi?</h3>
                  <p className="text-slate-500 text-sm mb-6">
                      Bu taslak çalışmayı projeleriniz arasına kaydetmek istiyor musunuz? Kaydetmezseniz veriler silinecektir.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={handleDiscardDraft} className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-lg font-bold text-xs uppercase hover:bg-red-100 transition-colors">
                          Sil
                      </button>
                      <button onClick={handleSaveDraftAsProject} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                          Projeye Dönüştür
                      </button>
                  </div>
              </div>
          ) : modal.type === 'settings' ? (
              // ... (Same settings modal) ...
              // For brevity in response, keeping structure
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-3xl h-[600px] flex">
                  {/* Settings Sidebar */}
                  <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
                      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 px-3 mt-2">Ayarlar</h2>
                      <nav className="space-y-1 flex-1">
                          <button onClick={() => setSettingsTab('app')} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${settingsTab === 'app' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
                              <Layout size={14} /> Uygulama
                          </button>
                          <button onClick={() => setSettingsTab('backup')} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${settingsTab === 'backup' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
                              <Database size={14} /> Yedekleme
                          </button>
                          <button onClick={() => setSettingsTab('about')} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${settingsTab === 'about' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
                              <Info size={14} /> Hakkında
                          </button>
                      </nav>
                      <button onClick={() => setModal(null)} className="mt-auto w-full py-2 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300">Kapat</button>
                  </div>
                  {/* Settings Content */}
                  <div className="flex-1 p-8 bg-white overflow-y-auto">
                      {settingsTab === 'app' && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Uygulama Ayarları</h3>
                              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                                  <div>
                                      <div className="font-bold text-slate-700 text-sm">Tema</div>
                                      <div className="text-xs text-slate-400">Uygulama görünümünü değiştirin.</div>
                                  </div>
                                  <select className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 outline-none">
                                      <option>Aydınlık (Varsayılan)</option>
                                      <option>Karanlık (Yakında)</option>
                                  </select>
                              </div>
                              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                                  <div>
                                      <div className="font-bold text-slate-700 text-sm">Editor Yazı Boyutu</div>
                                      <div className="text-xs text-slate-400">Yazma alanındaki varsayılan font boyutu.</div>
                                  </div>
                                  <select className="bg-slate-50 border border-slate-200 rounded-lg text-xs p-2 outline-none">
                                      <option>Küçük (14px)</option>
                                      <option selected>Orta (16px)</option>
                                      <option>Büyük (18px)</option>
                                  </select>
                              </div>
                          </div>
                      )}
                      {settingsTab === 'backup' && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                              {/* Top Banner */}
                              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-4">
                                  <div className="p-2 bg-white rounded-full text-emerald-600 shadow-sm border border-emerald-100">
                                      <ShieldCheck size={24} />
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-emerald-900 text-sm">Verileriniz Güvende!</h4>
                                      <p className="text-xs text-emerald-700 mt-1">
                                          3 Katmanlı yedekleme sistemi aktif: LocalStorage, Manuel Dosya Yedekleme ve (Yakında) Bulut Senkronizasyonu.
                                      </p>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                  {/* Cloud Backup Card */}
                                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all relative overflow-hidden group">
                                      <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg">Yakında</div>
                                      <div className="flex items-center gap-2 mb-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                                          <Cloud size={20} />
                                          <span className="font-bold text-sm">Bulut Yedekleme</span>
                                      </div>
                                      <p className="text-xs text-slate-400 mb-6 min-h-[40px]">
                                          Otomatik olarak her 30 saniyede buluta yedeklenir. (Premium)
                                      </p>
                                      <div className="space-y-2 opacity-50 grayscale group-hover:grayscale-0 transition-all cursor-not-allowed">
                                          <button onClick={() => alert('Bu özellik yakında gelecek!')} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                              <RefreshCw size={14} className="animate-spin-slow" /> Şimdi Senkronize Et
                                          </button>
                                          <button onClick={() => alert('Bu özellik yakında gelecek!')} className="w-full py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                              <Download size={14} /> Buluttan Geri Yükle
                                          </button>
                                      </div>
                                  </div>

                                  {/* Local Backup Card */}
                                  <div className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all bg-white">
                                      <div className="flex items-center gap-2 mb-3 text-blue-600">
                                          <HardDrive size={20} />
                                          <span className="font-bold text-sm">Local Yedekleme</span>
                                      </div>
                                      <p className="text-xs text-slate-500 mb-6 min-h-[40px]">
                                          Kullanıcı verilerinizi cihazınıza JSON dosyası olarak yedekleyin.
                                      </p>
                                      <div className="space-y-2">
                                          <button 
                                            onClick={handleFullBackup}
                                            className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                          >
                                              <RefreshCw size={14} /> Şimdi Kaydet
                                          </button>
                                          <button 
                                            onClick={handleFullRestoreClick}
                                            className="w-full py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                                          >
                                              <Upload size={14} /> Cihazdan Geri Yükle (.json)
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              {/* Developer Tools */}
                              <div className="border border-slate-200 rounded-xl p-6 text-center bg-slate-50">
                                  <div className="flex justify-center text-emerald-600 mb-2">
                                      <FileCode size={20} />
                                  </div>
                                  <h4 className="font-bold text-slate-800 text-sm mb-1">Geliştirici Araçları</h4>
                                  <p className="text-xs text-slate-500 mb-4">Projenin mimari yapısını ve veri şemasını içeren teknik dökümanı indirin.</p>
                                  <button className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2">
                                      <Database size={14} /> Proje Bilgisini İndir
                                  </button>
                              </div>

                              {/* Security Features List */}
                              <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-3">
                                      <ShieldCheck size={16} className="text-blue-600" /> Güvenlik Özellikleri
                                  </h4>
                                  <div className="space-y-2">
                                      <div className="flex items-center gap-2 text-xs text-slate-600">
                                          <CheckCircle size={14} className="text-emerald-500" /> 
                                          <span><span className="font-bold">LocalStorage</span> - Anında tarayıcı içi kayıt</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-600">
                                          <CheckCircle size={14} className="text-emerald-500" /> 
                                          <span><span className="font-bold">Bulut Sync</span> - Otomatik yedekleme (30 saniye)</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-600">
                                          <CheckCircle size={14} className="text-emerald-500" /> 
                                          <span><span className="font-bold">Manuel Backup</span> - JSON dosya desteği</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                       {settingsTab === 'about' && (
                          <div className="space-in-from-right-4 duration-300 text-center pt-10">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-200 mb-6">BP</div>
                              <h3 className="text-xl font-bold text-slate-800">BookWriter Pro</h3>
                              <p className="text-sm text-slate-500 font-medium mb-8">Modern Kitap Yazma & Proje Yönetim Platformu</p>
                              <div className="inline-block text-left bg-slate-50 p-6 rounded-xl border border-slate-200 max-w-sm w-full space-y-2">
                                  <div className="flex justify-between text-xs"><span className="text-slate-500">Versiyon:</span> <span className="font-bold text-slate-800">2.2.0 (Stable)</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-slate-500">Build:</span> <span className="font-bold text-slate-800">2024.10.25</span></div>
                                  <div className="flex justify-between text-xs"><span className="text-slate-500">Lisans:</span> <span className="font-bold text-slate-800">MIT / Open Source</span></div>
                              </div>
                              <div className="mt-8 text-[10px] text-slate-400">
                                  Designed with ❤️ for Writers
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          ) : (
          <div className={`bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all ${
              ['wiki', 'wikiPreview', 'citation', 'citationPreview', 'note', 'database', 'link-selector', 'project'].includes(modal.type) 
              ? 'max-w-5xl w-full h-[85vh]' 
              : 'max-w-lg w-full'
          }`}>
            <div className="px-6 py-6 border-b flex items-center justify-between bg-slate-50">
              
              {/* NEW HEADER DESIGN */}
              {modalHeader && (
                  <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl shadow-sm ${modalHeader.color}`}>
                          <modalHeader.icon size={32} />
                      </div>
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-1">
                              {modalHeader.title}
                          </h2>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                              {modalHeader.subtitle}
                          </p>
                      </div>
                  </div>
              )}

              <div className="flex items-center gap-3">
                  {(modal.type === 'wiki' || modal.type === 'citation' || modal.type === 'note') && (
                      <button 
                        form={modal.type === 'wiki' ? 'wiki-form' : modal.type === 'citation' ? 'citation-form' : 'note-form'}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-100 flex items-center gap-2"
                      >
                          <Save size={16} /> Kaydet
                      </button>
                  )}

                  <button onClick={() => setModal(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scroll bg-white">
                
              {/* ... All Forms (Project, Database, Wiki, etc.) from previous output ... */}
              {/* Keeping content same, just wrapper styles in main return updated above */}
              {/* --- PROJECT WIZARD --- */}
              {modal.type === 'project' && (
                  <form id="project-form" onSubmit={handleSaveProjectModal} className="h-full flex flex-col">
                      {/* Wizard Stepper */}
                      <div className="flex items-center justify-center mb-8">
                          {[1, 2, 3].map(step => (
                              <div key={step} className="flex items-center">
                              </div>
                          ))}
                          {/* Tab Navigation */}
                          <div className="border border-dashed border-slate-300 rounded-lg p-1 mb-8 flex bg-slate-50/50 w-full">
                              <button 
                                type="button"
                                onClick={() => setProjectModalTab('general')}
                                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 rounded-md transition-all ${projectModalTab === 'general' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Book size={14} /> Genel Bilgiler
                              </button>
                              <div className="w-px bg-slate-200 my-1"></div>
                              <button 
                                type="button"
                                onClick={() => setProjectModalTab('content')}
                                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 rounded-md transition-all ${projectModalTab === 'content' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <PenTool size={14} /> İçerik Detayları
                              </button>
                              <div className="w-px bg-slate-200 my-1"></div>
                              <button 
                                type="button"
                                onClick={() => setProjectModalTab('hierarchy')}
                                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 rounded-md transition-all ${projectModalTab === 'hierarchy' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <ListIcon size={14} /> Hiyerarşi
                              </button>
                              <div className="w-px bg-slate-200 my-1"></div>
                              <button 
                                type="button"
                                onClick={() => setProjectModalTab('settings')}
                                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 rounded-md transition-all ${projectModalTab === 'settings' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Settings size={14} /> Ayarlar
                              </button>
                          </div>
                      </div>

                      <div className="flex-1">
                          {/* GENERAL TAB - Using Hidden Class instead of Conditional Rendering */}
                          <div className={`space-y-4 animate-in fade-in slide-in-from-right-4 ${projectModalTab === 'general' ? 'block' : 'hidden'}`}>
                                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Genel Bilgiler</h3>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Kitap Adı</label>
                                      <input required name="name" defaultValue={modal.data?.name} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400" placeholder="Örn: Sessiz Gemi" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Yazar Adı</label>
                                      <input required name="author" defaultValue={modal.data?.author} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400" placeholder="Örn: John Doe" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Kısa Açıklama (Logline)</label>
                                      <input required name="description" defaultValue={modal.data?.description} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400" placeholder="Kitabın ana fikri..." />
                                  </div>
                          </div>

                          {/* CONTENT TAB */}
                          <div className={`space-y-4 animate-in fade-in slide-in-from-right-4 ${projectModalTab === 'content' ? 'block' : 'hidden'}`}>
                                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">İçerik Detayları</h3>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Uzun Özet (Sinopsis)</label>
                                      <textarea name="longSummary" defaultValue={modal.data?.longSummary} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400" placeholder="Kitabın detaylı özeti..." />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Taslak Plan</label>
                                      <textarea name="plan" defaultValue={modal.data?.plan} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400" placeholder="Bölüm planlaması..." />
                                  </div>
                          </div>

                          {/* HIERARCHY TAB */}
                          <div className={`space-y-4 animate-in fade-in slide-in-from-right-4 ${projectModalTab === 'hierarchy' ? 'block' : 'hidden'}`}>
                                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Hiyerarşi</h3>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Varsayılan Bölümler</label>
                                      <p className="text-[10px] text-slate-400 mb-2">Her satır yeni bir bölüm olarak oluşturulacaktır.</p>
                                      <textarea name="defaultPages" defaultValue={"Giriş\nBölüm 1\nSonsöz"} className="w-full h-48 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400 font-mono" />
                                  </div>
                          </div>

                          {/* SETTINGS TAB */}
                          <div className={`space-y-4 animate-in fade-in slide-in-from-right-4 ${projectModalTab === 'settings' ? 'block' : 'hidden'}`}>
                                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Sayfa & Yapı Ayarları</h3>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-slate-700 mb-1">Yönlendirme</label>
                                          <select name="orientation" defaultValue={modal.data?.orientation} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400">
                                              <option value="portrait">Dikey</option>
                                              <option value="landscape">Yatay</option>
                                          </select>
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-700 mb-1">Sayfa Boyutu</label>
                                          <select name="pageSize" defaultValue={modal.data?.pageSize} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400">
                                              <option value="A4">A4 (21 x 29.7 cm)</option>
                                              <option value="A5">A5 (14.8 x 21 cm)</option>
                                              <option value="B5">B5 (17.6 x 25 cm)</option>
                                              <option value="A3">A3 (29.7 x 42 cm)</option>
                                          </select>
                                      </div>
                                  </div>

                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">Sayfa Arkaplanı</label>
                                      <div className="flex items-center gap-2">
                                          <input 
                                            type="color" 
                                            value={wizardColor}
                                            onChange={(e) => setWizardColor(e.target.value)}
                                            className="h-10 w-12 rounded border border-slate-200 cursor-pointer bg-transparent p-0.5"
                                          />
                                          <input 
                                            name="pageTheme" 
                                            value={wizardColor}
                                            onChange={(e) => setWizardColor(e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400 uppercase font-mono"
                                          />
                                      </div>
                                  </div>
                          </div>
                      </div>

                      <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
                          {/* Navigation buttons logic if needed, or simple submit */}
                          <div/>
                          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                              <CheckCircle size={16} /> Projeyi {modal.mode === 'edit' ? 'Güncelle' : 'Oluştur'}
                          </button>
                      </div>
                  </form>
              )}
              
              {(modal.type === 'database' || modal.type === 'link-selector') && (
                  <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-slate-100">
                           <div className="relative flex-1 max-w-md flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input 
                                        autoFocus
                                        placeholder="Başlık, etiket veya kod ile ara..." 
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                                    <button 
                                        onClick={() => setFilterScope('all')}
                                        className={`p-2 rounded-md transition-all ${filterScope === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Tüm Projeler (Havuz)"
                                    >
                                        <Globe size={16} />
                                    </button>
                                    <button 
                                        onClick={() => setFilterScope('current')}
                                        className={`p-2 rounded-md transition-all ${filterScope === 'current' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Bu Proje (Origin)"
                                    >
                                        <BookOpen size={16} />
                                    </button>
                                </div>
                           </div>
                           <button 
                            onClick={() => setModal({ type: (modal.dbTab === 'wiki' || modal.linkType === 'wiki') ? 'wiki' : modal.dbTab === 'notes' ? 'note' : 'citation', mode: 'create' })}
                            className="ml-4 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                             <Plus size={14} /> Yeni Oluştur
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                          {((modal.type === 'database' && modal.dbTab === 'wiki') || (modal.type === 'link-selector' && modal.linkType === 'wiki')) && (
                              filteredWikis.length > 0 ? filteredWikis.map(wiki => (
                                <div 
                                    key={wiki.id} 
                                    onClick={() => modal.type === 'link-selector' ? handleLinkItem('wiki', wiki) : null}
                                    className={`bg-white p-5 rounded-xl border border-slate-200 transition-all group relative ${modal.type === 'link-selector' ? 'cursor-pointer hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100' : 'hover:border-indigo-300 hover:shadow-md'}`}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">{wiki.code}</span>
                                        <span className="flex-1 truncate font-bold text-slate-700">{wiki.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 h-12 leading-relaxed">
                                        {wiki.content.replace(/<[^>]*>?/gm, '')}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-1">
                                            {wiki.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded font-bold">{t}</span>)}
                                        </div>
                                        {filterScope === 'all' && (
                                            <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded truncate max-w-[100px]">{wiki.projectName}</span>
                                        )}
                                    </div>
                                    
                                    {modal.type === 'database' && (
                                        <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                                            <button onClick={(e) => {e.stopPropagation(); copyToClipboard(wiki.code, wiki.id)}} className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${copiedId === wiki.id ? 'text-green-600' : 'text-slate-400 hover:text-indigo-600'}`}>
                                                {copiedId === wiki.id ? 'KOPYALANDI' : 'KODU KOPYALA'}
                                            </button>
                                            <div className="flex gap-1">
                                                <button onClick={(e) => {e.stopPropagation(); setModal({ type: 'wikiPreview', data: wiki })}} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-500"><Eye size={14}/></button>
                                                <button onClick={(e) => {e.stopPropagation(); setModal({ type: 'wiki', data: wiki, mode: 'edit' })}} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-indigo-500"><Settings size={14}/></button>
                                                <button onClick={(e) => {e.stopPropagation(); handleDeleteWikiRequest(wiki)}} className="p-1.5 bg-slate-50 hover:bg-red-50 rounded text-red-500"><X size={14}/></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                              )) : <div className="col-span-3 text-center py-20 text-slate-400 italic">Kayıt bulunamadı.</div>
                          )}

                          {((modal.type === 'database' && modal.dbTab === 'citations') || (modal.type === 'link-selector' && modal.linkType === 'citation')) && (
                              filteredCitations.length > 0 ? filteredCitations.map(cite => (
                                <div 
                                    key={cite.id} 
                                    onClick={() => modal.type === 'link-selector' ? handleLinkItem('citation', cite) : null}
                                    className={`bg-white p-5 rounded-xl border border-slate-200 transition-all group relative ${modal.type === 'link-selector' ? 'cursor-pointer hover:border-emerald-500 hover:ring-2 hover:ring-emerald-100' : 'hover:border-emerald-300 hover:shadow-md'}`}
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 px-2 py-1 rounded">{cite.type}</span>
                                        <span className="font-mono text-[10px] font-bold text-slate-400">{cite.code}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{cite.source}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{cite.description}</p>
                                    {cite.author && (
                                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span> {cite.author}
                                        </div>
                                    )}
                                </div>
                              )) : <div className="col-span-3 text-center py-20 text-slate-400 italic">Kayıt bulunamadı.</div>
                          )}

                          {modal.type === 'database' && modal.dbTab === 'notes' && (
                              filteredNotes.length > 0 ? filteredNotes.map(note => (
                                <div key={note.id} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {note.type === 'task' ? <CheckSquare size={14} className="text-orange-500" /> : <StickyNote size={14} className="text-blue-500" />}
                                            <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${note.type === 'task' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {note.type === 'task' ? 'Görev' : 'Not'}
                                            </span>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded flex items-center gap-1">
                                            {note.projectName}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{note.title}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{note.shortDescription}</p>
                                    
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                                        <div className="flex gap-1">
                                            {note.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded font-bold">#{t}</span>)}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setModal({ type: 'note', data: note, mode: 'edit' })} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-indigo-500"><Settings size={14}/></button>
                                            <button onClick={() => handleDeleteNoteRequest(note)} className="p-1.5 bg-slate-50 hover:bg-red-50 rounded text-red-500"><X size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                              )) : <div className="col-span-3 text-center py-20 text-slate-400 italic">Kayıt bulunamadı.</div>
                          )}
                      </div>
                  </div>
              )}
              
                {/* WIKI FORM */}
                {modal.type === 'wiki' && (
                  <form id="wiki-form" onSubmit={handleSaveWiki} className="space-y-4">
                      {/* ... Content same ... */}
                      <input type="hidden" name="content-html" value={tempHtmlContent} />
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Proje</label>
                        <select name="projectId" defaultValue={modal.data?.projectId || 'global'} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400">
                            <option value="global">Genel (Projesiz)</option>
                            {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Başlık</label>
                          <input required name="title" defaultValue={modal.data?.title} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" placeholder="Wiki başlığı..." />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Etiketler (Virgül ile ayırın)</label>
                          <input name="tags" defaultValue={modal.data?.tags?.join(', ')} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" placeholder="tarih, önemli, karakter..." />
                      </div>
                      <div className="h-64 border border-slate-200 rounded-lg overflow-hidden">
                          <RichTextEditor 
                             content={tempHtmlContent} 
                             onChange={setTempHtmlContent} 
                             wikis={[]} citations={[]} onLinkRequested={() => {}} onPreview={() => {}} 
                             mode="simple" 
                          />
                      </div>
                  </form>
                )}

                {/* CITATION FORM */}
                {modal.type === 'citation' && (
                    <form id="citation-form" onSubmit={handleSaveCitation} className="space-y-4">
                       {/* ... Content same ... */}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Proje</label>
                                <select name="projectId" defaultValue={modal.data?.projectId || state.currentProject?.id} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400">
                                    {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Kaynak Tipi</label>
                               <select name="type" defaultValue={modal.data?.type || 'link'} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400">
                                   <option value="link">Web Bağlantısı</option>
                                   <option value="book">Kitap</option>
                                   <option value="author">Yazar / Kişi</option>
                                   <option value="article">Makale</option>
                                   <option value="note">Not</option>
                                </select>
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">Kaynak Adı / Başlık</label>
                           <input required name="source" defaultValue={modal.data?.source} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">Kısa Açıklama</label>
                           <input name="description" defaultValue={modal.data?.description} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">URL (Varsa)</label>
                               <input name="url" defaultValue={modal.data?.url} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-700 mb-1">Yazar (Varsa)</label>
                               <input name="author" defaultValue={modal.data?.author} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" />
                           </div>
                       </div>
                    </form>
                )}

                {/* NOTE FORM */}
                {modal.type === 'note' && (
                    <form id="note-form" onSubmit={handleSaveNote} className="space-y-4">
                        {/* ... Content same ... */}
                        <input type="hidden" name="content-html" value={tempHtmlContent} />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Proje</label>
                                <select name="projectId" defaultValue={modal.data?.projectId || (state.currentProject ? state.currentProject.id : 'global')} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400">
                                    <option value="global">Genel (Projesiz)</option>
                                    {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tip</label>
                                <select name="type" defaultValue={modal.data?.type || 'note'} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400">
                                    <option value="note">Not</option>
                                    <option value="task">Görev</option>
                                </select>
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Başlık</label>
                            <input required name="title" defaultValue={modal.data?.title} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Kısa Açıklama</label>
                            <input name="shortDescription" defaultValue={modal.data?.shortDescription} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Etiketler</label>
                            <input name="tags" defaultValue={modal.data?.tags?.join(', ')} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-400" placeholder="etiket1, etiket2..." />
                        </div>
                        <div className="h-48 border border-slate-200 rounded-lg overflow-hidden">
                           <RichTextEditor 
                             content={tempHtmlContent} 
                             onChange={setTempHtmlContent} 
                             wikis={[]} citations={[]} onLinkRequested={() => {}} onPreview={() => {}} 
                             mode="simple" 
                          />
                        </div>
                    </form>
                )}
                
                {/* Previews */}
                {(modal.type === 'wikiPreview' || modal.type === 'citationPreview') && (
                    <div className="space-y-4">
                         <div className="flex items-center gap-2 mb-4">
                             <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{modal.data?.code}</span>
                             <h1 className="text-xl font-bold text-slate-800">{modal.data?.title || modal.data?.source}</h1>
                         </div>
                         <div className="prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={{__html: modal.data?.content || modal.data?.detailContent || modal.data?.description || ''}} />
                    </div>
                )}
                
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;