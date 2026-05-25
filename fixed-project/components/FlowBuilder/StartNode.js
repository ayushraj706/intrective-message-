import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play } from 'lucide-react';

const StartNode = () => {
  return (
    <div className="bg-white border-2 border-green-500 p-3 rounded-full shadow-lg flex items-center justify-center w-12 h-12 relative group">
      {/* Visual Icon */}
      <Play size={20} className="text-green-500 fill-green-500" />
      
      {/* Label (Optional - Hover karne par dikhega) */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-tighter">
        Start
      </div>

      {/* Source Handle - Jahan se wire niklegi */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-green-500 border-2 border-white" 
      />
    </div>
  );
};

export default StartNode;
