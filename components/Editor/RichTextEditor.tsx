
import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, BookOpen, Eraser, 
  Indent, Outdent, Type, Baseline, Palette, Highlighter, CornerDownRight, Link as LinkIcon, X, Check
} from 'lucide-react';
import { WikiEntry, Citation, Chapter } from '../../types';

interface RichTextEditorProps {
  chapter?: Chapter;
  content: string; 
  onChange: (content: string) => void;
  onLinkRequested: (type: 'wiki' | 'citation', range: Range, text: string) => void;
  wikis: WikiEntry[];
  citations: Citation[];
  onPreview: () => void;
  mode?: 'full' | 'simple';
  viewOptions?: { showSubChapters: boolean; showCitations: boolean; };
  pageTheme?: string;
}

const RecursiveBlock: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
    return (
        <div className="mt-8 ml-4 pl-4 border-l-2 border-slate-100 group">
             <div className="flex items-center gap-2 mb-2">
                <CornerDownRight size={14} className="text-slate-300" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{chapter.title}</h3>
             </div>
             <div 
                className="prose prose-sm prose-slate max-w-none opacity-80"
                dangerouslySetInnerHTML={{__html: chapter.content || '<p class="text-slate-300 italic">İçerik yok...</p>'}} 
             />
             {chapter.children.map(child => <RecursiveBlock key={child.id} chapter={child} />)}
        </div>
    );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    chapter, content, onChange, onLinkRequested, wikis, citations, onPreview, mode = 'full', viewOptions, pageTheme = '#ffffff'
}) => {
  const [showBubbleMenu, setShowBubbleMenu] = useState(false);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 });
  const [orderedCitations, setOrderedCitations] = useState<any[]>([]);
  
  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkData, setLinkData] = useState({ text: '', url: '', targetBlank: true });
  const savedSelection = useRef<Range | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);

  // --- Logic to re-order citations ---
  const updateCitationNumbers = () => {
    if (!editorRef.current || mode !== 'full') return;
    const markers = Array.from(editorRef.current.querySelectorAll('.citation-marker'));
    const newOrderedList: any[] = [];
    markers.forEach((marker, index) => {
        const el = marker as HTMLElement;
        const id = el.getAttribute('data-id');
        if (id) {
            el.innerText = `(${index + 1})`;
            const entry = wikis.find(w => w.id === id) || citations.find(c => c.id === id);
            if (entry) {
                newOrderedList.push({ ...entry, displayOrder: index + 1 });
            }
        }
    });
    setOrderedCitations(newOrderedList);
  };

  useEffect(() => {
    if (editorRef.current) {
        const targetContent = chapter ? chapter.content : content;
        if (editorRef.current.innerHTML !== targetContent && document.activeElement !== editorRef.current) {
             editorRef.current.innerHTML = targetContent;
        }
        setTimeout(updateCitationNumbers, 0);
    }
  }, [chapter, content]);

  const handleInput = () => {
      updateCitationNumbers();
      if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      if (editorRef.current && editorRef.current.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setBubblePos({
            top: rect.top - 45 + window.scrollY,
            left: rect.left + (rect.width / 2) - 50 + window.scrollX
          });
          setShowBubbleMenu(true);
          selectionRangeRef.current = range.cloneRange();
      }
    } else {
      setShowBubbleMenu(false);
    }
  };

  const execCmd = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    editorRef.current?.focus();
  };

  const requestLink = (type: 'wiki' | 'citation') => {
      if (selectionRangeRef.current) {
          onLinkRequested(type, selectionRangeRef.current, selectionRangeRef.current.toString());
          setShowBubbleMenu(false);
      }
  };

  // --- Hyperlink Logic ---
  const openLinkModal = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
          savedSelection.current = selection.getRangeAt(0).cloneRange();
          setLinkData({ 
              text: selection.toString(), 
              url: '', 
              targetBlank: true 
          });
          setShowLinkModal(true);
      } else {
          // If no selection, just open empty
          savedSelection.current = null;
          setLinkData({ text: '', url: '', targetBlank: true });
          setShowLinkModal(true);
      }
  };

  const applyLink = () => {
      if (savedSelection.current) {
          // Restore selection
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(savedSelection.current);
          
          // Create Link Element
          const a = document.createElement('a');
          a.href = linkData.url.startsWith('http') ? linkData.url : `https://${linkData.url}`;
          a.innerText = linkData.text || linkData.url;
          if (linkData.targetBlank) a.target = '_blank';
          a.className = "text-blue-600 underline hover:text-blue-800 cursor-pointer";
          
          savedSelection.current.deleteContents();
          savedSelection.current.insertNode(a);
      } else if (editorRef.current) {
          // Insert at end if no selection (fallback)
          const a = document.createElement('a');
          a.href = linkData.url.startsWith('http') ? linkData.url : `https://${linkData.url}`;
          a.innerText = linkData.text || linkData.url;
          if (linkData.targetBlank) a.target = '_blank';
          a.className = "text-blue-600 underline hover:text-blue-800 cursor-pointer";
          editorRef.current.appendChild(a);
      }

      setShowLinkModal(false);
      handleInput(); // Trigger save
  };

  const fonts = [
    { name: 'Varsayılan', val: 'Inter' },
    { name: 'Serif (Kitap)', val: 'Playfair Display' },
    { name: 'Sans-Serif', val: 'Arial' },
    { name: 'Monospace', val: 'Courier New' },
    { name: 'Times New Roman', val: 'Times New Roman' },
    { name: 'Georgia', val: 'Georgia' }
  ];

  return (
    <div className="relative h-full flex flex-col">
      {/* Advanced Toolbar */}
      <div className={`flex flex-col bg-white z-20 border-b border-slate-200 transition-all ${mode === 'full' ? 'sticky top-[-3rem] mb-8 shadow-sm rounded-lg border' : 'mb-2 border-b-0'}`}>
        
        <div className="flex flex-wrap items-center gap-1 p-2">
            
            {/* History */}
            <div className="flex items-center border-r border-slate-200 pr-2 mr-1 gap-0.5">
                <button onClick={() => execCmd('undo')} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded" title="Geri Al"><Undo size={16} /></button>
                <button onClick={() => execCmd('redo')} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded" title="Yinele"><Redo size={16} /></button>
            </div>

            {/* Font & Size */}
            <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
                <select onChange={(e) => execCmd('fontName', e.target.value)} className="h-8 text-xs border border-slate-200 rounded px-1 min-w-[100px] outline-none focus:border-indigo-400 text-slate-600">
                    {fonts.map(f => <option key={f.val} value={f.val}>{f.name}</option>)}
                </select>
                <select onChange={(e) => execCmd('fontSize', e.target.value)} className="h-8 text-xs border border-slate-200 rounded px-1 w-14 outline-none focus:border-indigo-400 text-slate-600">
                    <option value="1">10px</option>
                    <option value="2">13px</option>
                    <option value="3" selected>16px</option>
                    <option value="4">18px</option>
                    <option value="5">24px</option>
                    <option value="6">32px</option>
                    <option value="7">48px</option>
                </select>
            </div>

            {/* Formatting */}
            <div className="flex items-center border-r border-slate-200 pr-2 mr-1 gap-0.5">
                <button onClick={() => execCmd('bold')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded font-bold" title="Kalın"><Bold size={16} /></button>
                <button onClick={() => execCmd('italic')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded italic" title="İtalik"><Italic size={16} /></button>
                <button onClick={() => execCmd('underline')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded underline" title="Altı Çizili"><Underline size={16} /></button>
                <button onClick={() => execCmd('strikeThrough')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded line-through font-serif" title="Üstü Çizili">S</button>
            </div>

            {/* Colors */}
            <div className="flex items-center border-r border-slate-200 pr-2 mr-1 gap-1">
                 <div className="relative group">
                    <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded flex items-center gap-1"><Baseline size={16} /><span className="w-2 h-2 rounded-full bg-black"></span></button>
                    <input type="color" onChange={(e) => execCmd('foreColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Yazı Rengi" />
                 </div>
                 <div className="relative group">
                    <button className="p-1.5 text-slate-600 hover:bg-slate-100 rounded flex items-center gap-1"><Highlighter size={16} /><span className="w-2 h-2 rounded-full bg-yellow-300"></span></button>
                    <input type="color" onChange={(e) => execCmd('hiliteColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Vurgu Rengi" />
                 </div>
            </div>

            {/* Alignment */}
            <div className="flex items-center border-r border-slate-200 pr-2 mr-1 gap-0.5">
                <button onClick={() => execCmd('justifyLeft')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><AlignLeft size={16} /></button>
                <button onClick={() => execCmd('justifyCenter')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><AlignCenter size={16} /></button>
                <button onClick={() => execCmd('justifyRight')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><AlignRight size={16} /></button>
                <button onClick={() => execCmd('justifyFull')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><AlignJustify size={16} /></button>
            </div>

            {/* Lists & Indent */}
            <div className="flex items-center border-r border-slate-200 pr-2 mr-1 gap-0.5">
                <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><List size={16} /></button>
                <button onClick={() => execCmd('insertOrderedList')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><ListOrdered size={16} /></button>
                <button onClick={() => execCmd('indent')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Indent size={16} /></button>
                <button onClick={() => execCmd('outdent')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded"><Outdent size={16} /></button>
            </div>

            {/* Utils */}
            <div className="flex items-center gap-0.5">
                 <button onClick={openLinkModal} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Link Ekle"><LinkIcon size={16} /></button>
                 <button onClick={() => execCmd('removeFormat')} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="Biçimi Temizle"><Eraser size={16} /></button>
            </div>

        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        <div 
            ref={editorRef}
            contentEditable
            onMouseUp={handleSelection}
            onKeyUp={handleSelection}
            onInput={handleInput}
            style={{ color: '#1e293b' }} 
            className={`editor-content ${mode === 'full' ? 'min-h-[600px] text-[16px]' : 'h-full min-h-[300px] text-sm'} leading-[1.8] font-serif focus:outline-none selection:bg-indigo-100 selection:text-indigo-900`}
            onBlur={(e) => onChange(e.currentTarget.innerHTML)}
            placeholder="Yazmaya başlayın..."
        />
        
        {mode === 'full' && viewOptions?.showSubChapters && chapter && chapter.children.length > 0 && (
            <div className="mt-12 pt-8 border-t border-dashed border-slate-200">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Alt Bölüm İçerikleri</h4>
                {chapter.children.map(child => <RecursiveBlock key={child.id} chapter={child} />)}
            </div>
        )}
      </div>

      {/* Footer / Citations Area */}
      {mode === 'full' && viewOptions?.showCitations && (
        <div className="border-t-4 border-slate-100 pt-8 mt-12 pb-12">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BookOpen size={14} /> Kaynakça & Atıflar
            </h3>
            <div className="grid grid-cols-1 gap-2">
                {orderedCitations.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex gap-4 p-3 bg-slate-50/50 rounded-lg border border-slate-100 items-start hover:border-indigo-100 transition-colors">
                         <span className="font-bold text-indigo-600 bg-white border border-indigo-100 w-6 h-6 flex items-center justify-center rounded-full text-xs shadow-sm shrink-0">
                            {item.displayOrder}
                        </span>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-sm">
                                {'type' in item ? (item as Citation).source : (item as WikiEntry).title}
                                <span className="ml-2 text-[9px] uppercase tracking-wider text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                    {'type' in item ? (item as Citation).code : (item as WikiEntry).code}
                                </span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                {'type' in item ? (item as Citation).description : (item as WikiEntry).content.replace(/<[^>]*>?/gm, '')}
                            </p>
                        </div>
                    </div>
                ))}
                {orderedCitations.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-lg">
                        Bu sayfada henüz herhangi bir wiki veya kaynak bağlantısı kullanılmadı.
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Bubble Menu */}
      {showBubbleMenu && mode === 'full' && (
        <div 
          className="fixed z-50 bg-slate-900 text-white rounded-lg shadow-xl flex items-center gap-1 p-1 animate-in zoom-in-95 duration-100"
          style={{ top: bubblePos.top, left: bubblePos.left }}
        >
          <button onClick={() => requestLink('wiki')} className="px-3 py-1.5 hover:bg-slate-700 rounded text-xs font-bold transition-colors">Wiki</button>
          <div className="w-px h-4 bg-slate-700"></div>
          <button onClick={() => requestLink('citation')} className="px-3 py-1.5 hover:bg-slate-700 rounded text-xs font-bold transition-colors">Alıntı</button>
        </div>
      )}

      {/* Link Insertion Modal */}
      {showLinkModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 p-5 animate-in zoom-in-95 duration-200">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <LinkIcon size={16} className="text-blue-500" /> Link Ekle
                  </h3>
                  
                  <div className="space-y-3">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Görüntülenecek Metin</label>
                          <input 
                            value={linkData.text} 
                            onChange={(e) => setLinkData({...linkData, text: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-400"
                            placeholder="Metin..."
                          />
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Web Adresi (URL)</label>
                          <input 
                            value={linkData.url} 
                            onChange={(e) => setLinkData({...linkData, url: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-400"
                            placeholder="https://..."
                            autoFocus
                          />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={linkData.targetBlank} 
                            onChange={(e) => setLinkData({...linkData, targetBlank: e.target.checked})}
                            className="accent-blue-600 w-4 h-4 cursor-pointer" 
                          />
                          <span className="text-xs text-slate-600 group-hover:text-slate-800">Yeni pencerede aç</span>
                      </label>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
                      <button onClick={() => setShowLinkModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">İptal</button>
                      <button onClick={applyLink} className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-blue-600 flex items-center justify-center gap-2">
                          <Check size={14} /> Kaydet
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RichTextEditor;
