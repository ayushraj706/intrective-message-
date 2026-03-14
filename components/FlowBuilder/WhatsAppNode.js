import React from 'react';
import { Handle, Position } from 'reactflow';
import { MessageSquare, ExternalLink, Reply } from 'lucide-react';

const WhatsAppNode = ({ data, isConnectable }) => {
  const blocks = data?.blocks || [];

  return (
    <div className="bg-white dark:bg-zinc-900 border-2 border-blue-600 rounded-[2rem] shadow-2xl w-80 overflow-hidden ring-4 ring-black/5 dark:ring-white/5 relative">
      
      {/* Target Handle (Left side - Incoming messages) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        isConnectable={isConnectable}
        className="w-4 h-4 bg-zinc-400 border-4 border-white dark:border-zinc-900 -left-2 top-10" 
      />

      {/* Default Source Handle (Right side - If user just wants to connect the whole node) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="default"
        isConnectable={isConnectable}
        className="w-4 h-4 bg-zinc-400 border-4 border-white dark:border-zinc-900 -right-2 top-10" 
      />

      {/* Header */}
      <div className="bg-blue-600 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
          <MessageSquare size={14} /> WhatsApp Message
        </div>
      </div>

      <div className="p-5 space-y-4">
        {blocks.length > 0 ? blocks.map((block) => (
          <div key={block.id} className="relative group">
            {block.type === 'text' && (
              <div className="bg-zinc-100 dark:bg-black p-4 rounded-2xl text-[13px] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-medium whitespace-pre-wrap">
                {block.content || "Click to edit text..."}
              </div>
            )}

            {block.type === 'button' && (
              <div className="relative mt-2">
                <div className="flex items-center gap-3 bg-blue-600/5 dark:bg-blue-600/10 border-2 border-blue-500/20 text-blue-600 dark:text-blue-400 p-3.5 rounded-2xl text-[11px] font-black justify-center tracking-wider">
                  {block.subType === 'url' ? <ExternalLink size={14} /> : <Reply size={14} />}
                  {block.label || "New Button"}
                </div>
                {/* Individual Source Handle for Button Routing */}
                <Handle 
                  type="source" 
                  position={Position.Right} 
                  id={block.id} 
                  isConnectable={isConnectable}
                  className="w-4 h-4 bg-blue-600 border-2 border-white dark:border-zinc-900 -right-7" 
                />
              </div>
            )}
          </div>
        )) : (
          <p className="text-[10px] text-zinc-400 text-center italic">Empty Message Tile</p>
        )}
      </div>
    </div>
  );
};

export default WhatsAppNode;
