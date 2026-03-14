import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, ExternalLink, Reply, Plus } from 'lucide-react';

const WhatsAppNode = ({ data }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-3xl shadow-2xl w-80 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 p-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <MessageSquare size={14} /> WhatsApp Message
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* यहाँ तुम्हारे सारे ब्लॉक्स दिखेंगे (Text, Buttons etc.) */}
        {data.blocks.map((block, index) => (
          <div key={index} className="relative group">
            {block.type === 'text' && (
              <div className="bg-zinc-100 dark:bg-black p-3 rounded-2xl text-xs dark:text-white border border-zinc-200 dark:border-zinc-800">
                {block.content || "Type your message..."}
              </div>
            )}

            {block.type === 'button' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/30 text-blue-500 p-3 rounded-xl text-[11px] font-bold justify-center relative">
                  {block.content === 'url' ? <ExternalLink size={12}/> : <Reply size={12}/>}
                  {block.label || "New Button"}
                  {/* हर बटन का अपना आउटपुट हैंडल (Source) होगा */}
                  <Handle 
                    type="source" 
                    position={Position.Right} 
                    id={`btn-${index}`} 
                    className="w-3 h-3 bg-blue-500 -right-5" 
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 'Add Block' बटन जो नोड के अंदर ही रहेगा */}
        <button className="w-full py-2 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase">
          <Plus size={14} /> Add Element
        </button>
      </div>

      {/* इनकमिंग हैंडल (Target) */}
      <Handle type="target" position={Position.Left} className="w-4 h-4 bg-zinc-400 border-4 border-white dark:border-zinc-900" />
    </div>
  );
};

export default WhatsAppNode;
              
