
export interface WikiEntry {
  id: string;
  projectId: string; // Origin Project ID
  code: string;
  title: string;
  content: string; // HTML content
  tags: string[];
}

export interface Citation {
  id: string;
  projectId: string; // Origin Project ID
  code: string;
  type: 'note' | 'info' | 'link' | 'reference' | 'author' | 'source';
  source: string; // Title / Name
  description: string; // Short description
  detailContent?: string; // Long HTML content
  url?: string;
  author?: string;
  number: number;
}

export interface NoteEntry {
  id: string;
  projectId: string | 'global'; // 'global' for general notes, or Project ID
  type: 'note' | 'task';
  title: string;
  shortDescription: string;
  content: string; // HTML Rich Text
  tags: string[];
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  children: Chapter[];
  citations?: any[]; 
}

export interface Project {
  id: string;
  name: string;
  author: string;
  description: string;
  longSummary: string;
  plan: string;
  orientation: 'portrait' | 'landscape';
  pageSize: 'A3' | 'A4' | 'A5' | 'B5';
  pageTheme: string; // Hex Code
  chapters: Chapter[];
  lastModified: string;
  isDraft?: boolean;
}

export interface AppState {
  currentProject: Project | null;
  activeChapterId: string | null;
  projects: Project[];
  wikis: WikiEntry[]; 
  citations: Citation[];
  notes: NoteEntry[]; // New Notes Database
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelWidth: number;
  activeRightTab: 'plan' | 'hierarchy' | 'citations' | 'wiki';
  editorViewOptions: {
      showSubChapters: boolean;
      showCitations: boolean;
  };
}
