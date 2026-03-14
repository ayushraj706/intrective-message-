import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, MousePointer2, Plus, Trash2, ExternalLink, Reply } from 'lucide-react';

const WhatsAppNode = ({ data }) => {
  // अगर ब्लॉक्स नहीं हैं, तो डिफ़ॉल्ट टेक्स्ट ब्लॉक दिखाएँ
  const blocks = data.blocks || [{ type: 'text', content: 'New Message' }];

  return (
    <div className="bg-white dark:bg-zinc-900 border-2 border-blue-600 rounded-[2rem] shadow-2xl w-80 overflow-hidden ring-4 ring-black/5 dark:ring-white/5 animate-in zoom-in-95 duration-300">
      
      {/* 1. Header: WhatsApp Style */}
      <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
          <MessageSquare size={14} /> WhatsApp Message
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* 2. Dynamic Blocks Loop */}
        {blocks.map((block, index) => (
          <div key={index} className="relative group">
            
            {/* Text Block Design */}
            {block.type === 'text' && (
              <div className="bg-zinc-100 dark:bg-black p-4 rounded-2xl text-[13px] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 leading-relaxed font-medium">
                {block.content || "Click to edit message text..."}
              </div>
            )}

            {/* Button Block Design */}
            {block.type === 'button' && (
              <div className="relative mt-2">
                <div className="flex items-center gap-3 bg-blue-600/5 dark:bg-blue-600/10 border-2 border-blue-500/20 text-blue-600 dark:text-blue-400 p-3.5 rounded-2xl text-[11px] font-black justify-center tracking-wider hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
                  {block.subType === 'url' ? <ExternalLink size={14} /> : <Reply size={14} />}
                  {block.label || `Button ${index + 1}`}
                </div>
                
                {/* हर बटन का अपना आउटपुट तार (Source Handle) */}
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={`btn-${index}`} 
                  className="w-3 h-3 bg-blue-600 border-2 border-white dark:border-zinc-900 -right-5 !top-1/2" 
                />
              </div>
            )}
          </div>
        ))}

        {/* 3. Add Element Button: प्रोफेशनल डैशबोर्ड फील के लिए */}
        <button className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 dark:text-zinc-600 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest mt-2">
          <Plus size={16} /> Add Element
        </button>
      </div>

      {/* Main Input Handle (जहाँ पिछला मैसेज जुड़ेगा) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-4 h-4 bg-zinc-400 border-4 border-white dark:border-zinc-900 !left-[-8px]" 
      />
    </div>
  );
};

export default WhatsAppNode;
