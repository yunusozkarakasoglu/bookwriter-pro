
import React, { useState } from 'react';
import { 
  Info, ChevronRight, Settings, Book, Layout, FileText, Smartphone, Monitor
} from 'lucide-react';
import { Project, WikiEntry, Citation } from '../../types';

interface RightPanelProps {
  project: Project | null;
  globalWikis: WikiEntry[]; 
  globalCitations: Citation[];
  togglePanel: () => void;
  viewOptions?: { showSubChapters: boolean; showCitations: boolean; };
  onViewOptionsChange?: (options: { showSubChapters: boolean; showCitations: boolean; }) => void;
  onUpdateProject?: (settings: Partial<Project>) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ project, togglePanel, viewOptions, onViewOptionsChange, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'settings' | 'properties'>('info');

  const handleToggleView = (key: 'showSubChapters' | 'showCitations') => {
      if(onViewOptionsChange && viewOptions) {
          onViewOptionsChange({
              ...viewOptions,
              [key]: !viewOptions[key]
          });
      }
  };

  const handleUpdate = (key: keyof Project, value: any) => {
      if (onUpdateProject) {
          onUpdateProject({ [key]: value });
      }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 border-l border-slate-200">
      
      {/* Header Tabs */}
      <div className="bg-white border-b border-slate-200 flex">
         <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'info' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
         >
            Künye
         </button>
         <button 
            onClick={() => setActiveTab('properties')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'properties' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
         >
            Özellikler
         </button>
         <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
         >
            Ayarlar
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scroll">
        
        {/* INFO TAB (KÜNYE) */}
        {activeTab === 'info' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Kitap Adı</label>
                    <input 
                        value={project?.name || ''}
                        onChange={(e) => handleUpdate('name', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Yazar</label>
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                            {project?.author.substring(0,2).toUpperCase()}
                        </div>
                        <input 
                            value={project?.author || ''}
                            onChange={(e) => handleUpdate('author', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Logline (Kısa Açıklama)</label>
                    <textarea 
                        value={project?.description || ''}
                        onChange={(e) => handleUpdate('description', e.target.value)}
                        className="w-full h-24 bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all resize-none font-serif italic"
                    />
                </div>
                
                 <div className="bg-white p-4 rounded-xl border border-slate-200 mt-4">
                    <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-slate-500">Oluşturulma:</span>
                        <span className="font-bold text-slate-700">Bugün</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Son Düzenleme:</span>
                        <span className="font-bold text-slate-700">{new Date(project?.lastModified || '').toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        )}

        {/* SETTINGS TAB (AYARLAR) */}
        {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                
                {/* Page Setup */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <Layout size={12} /> Sayfa Ayarları
                    </label>
                    
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                        <div>
                            <span className="text-xs font-bold text-slate-700 block mb-2">Sayfa Boyutu</span>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'A3', dim: '29.7 x 42 cm' },
                                    { id: 'A4', dim: '21 x 29.7 cm' },
                                    { id: 'A5', dim: '14.8 x 21 cm' },
                                    { id: 'B5', dim: '17.6 x 25 cm' }
                                ].map(size => (
                                    <button 
                                        key={size.id}
                                        onClick={() => handleUpdate('pageSize', size.id)}
                                        className={`p-2 rounded-lg border text-left transition-all ${project?.pageSize === size.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                                    >
                                        <div className="text-xs font-bold">{size.id}</div>
                                        <div className="text-[9px] opacity-70">{size.dim}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-slate-700 block mb-2">Yönlendirme</span>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button 
                                    onClick={() => handleUpdate('orientation', 'portrait')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${project?.orientation === 'portrait' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Dikey
                                </button>
                                <button 
                                    onClick={() => handleUpdate('orientation', 'landscape')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${project?.orientation === 'landscape' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Yatay
                                </button>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-slate-700 block mb-2">Sayfa Arkaplanı</span>
                            <div className="flex items-center gap-2">
                                  <input 
                                    type="color" 
                                    value={project?.pageTheme || '#ffffff'}
                                    onChange={(e) => handleUpdate('pageTheme', e.target.value)}
                                    className="h-9 w-12 rounded border border-slate-200 cursor-pointer bg-transparent p-0.5"
                                  />
                                  <input 
                                    value={project?.pageTheme || ''}
                                    onChange={(e) => handleUpdate('pageTheme', e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-400 uppercase font-mono"
                                  />
                            </div>
                        </div>
                    </div>
                </div>

                {/* View Options */}
                {viewOptions && (
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                            <Monitor size={12} /> Görünüm Seçenekleri
                        </label>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Alt Bölümleri Göster</span>
                                <button 
                                    onClick={() => handleToggleView('showSubChapters')}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${viewOptions.showSubChapters ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viewOptions.showSubChapters ? 'left-6' : 'left-1'}`}></span>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Kaynakça / Atıfları Göster</span>
                                <button 
                                    onClick={() => handleToggleView('showCitations')}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${viewOptions.showCitations ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${viewOptions.showCitations ? 'left-6' : 'left-1'}`}></span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* PROPERTIES TAB (ÖZELLİKLER) */}
        {activeTab === 'properties' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                 <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                        <FileText size={12} /> Uzun Özet (Sinopsis)
                    </label>
                    <textarea 
                        value={project?.longSummary || ''}
                        onChange={(e) => handleUpdate('longSummary', e.target.value)}
                        className="w-full h-40 bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all leading-relaxed whitespace-pre-wrap"
                        placeholder="Özet girilmemiş."
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                        <Book size={12} /> Taslak Planı
                    </label>
                    <textarea 
                        value={project?.plan || ''}
                        onChange={(e) => handleUpdate('plan', e.target.value)}
                        className="w-full h-40 bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all leading-relaxed whitespace-pre-wrap font-mono"
                        placeholder="Plan girilmemiş."
                    />
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default RightPanel;
