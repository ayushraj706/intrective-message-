import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, MiniMap, 
  useNodesState, useEdgesState, useReactFlow 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, Zap, ZapOff, Maximize } from 'lucide-react';

// Firebase Logic
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode';
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes = { whatsappNode: WhatsAppNode, startNode: StartNode };

// ZAROORI: Hooks use karne ke liye content ko alag component mein rakha hai
const FlowBuilderContent = () => {
  const reactFlowWrapper = useRef(null);
  const { setCenter, fitView } = useReactFlow(); // ReactFlow Hooks
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBotActive, setIsBotActive] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 1. Firebase Load logic
  useEffect(() => {
    const loadFlow = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "flows", "main_flow");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const { flowData, isActive } = docSnap.data();
          if (flowData && flowData.nodes && flowData.nodes.length > 0) {
            setNodes(flowData.nodes);
            setEdges(flowData.edges || []);
          } else {
            setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: {} }]);
          }
          setIsBotActive(isActive || false);
        } else {
          setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: {} }]);
        }
      } catch (e) { 
        console.error("Load error:", e);
        setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: {} }]);
      }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  // 2. Auto-Zoom & Center Logic: Node click par bara dikhega
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    const { x, y } = node.position;
    // zoom: 1.5 taaki content ekdam clear dikhe
    setCenter(x + 150, y + 100, { zoom: 1.5, duration: 800 }); 
  }, [setCenter, setSelectedNode]);

  // 3. Fit View function: Poore flow ko screen par layega
  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 800 });
  };

  // 4. Quick Delete Listener
  useEffect(() => {
    const handleDelete = (e) => {
      const nodeId = e.detail;
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNode?.id === nodeId) setSelectedNode(null);
    };
    window.addEventListener('deleteNode', handleDelete);
    return () => window.removeEventListener('deleteNode', handleDelete);
  }, [selectedNode, setNodes, setEdges]);

  const addNewNode = useCallback((type, position = null) => {
    const spawnPos = position || { x: 300, y: 300 };
    const newNode = {
      id: `node_${Date.now()}`,
      type: type || 'whatsappNode',
      position: spawnPos,
      data: { 
        title: `Message ${nodes.filter(n => n.type === 'whatsappNode').length + 1}`,
        blocks: [{ id: `blk_${Date.now()}`, type: 'text', content: 'Type your neural message...' }] 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes]);

  const updateNodeData = (nodeId, newBlocks) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        const updatedNode = { ...node, data: { ...node.data, blocks: newBlocks } };
        if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
        return updatedNode;
      }
      return node;
    }));
  };

  const saveFlow = async () => {
    if (!reactFlowInstance || !auth.currentUser) return;
    setIsSaving(true);
    try {
      const flowData = reactFlowInstance.toObject();
      await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), {
        flowData, 
        updatedAt: new Date().toISOString(),
        isActive: isBotActive
      }, { merge: true });
    } catch (e) { console.error("Save failed"); }
    setIsSaving(false);
  };

  const toggleBot = async () => {
    const newState = !isBotActive;
    setIsBotActive(newState);
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), {
        isActive: newState
      });
    } catch (e) { console.error("Status update failed"); }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      <FlowSidebar 
        onAddNode={addNewNode} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      /> 

      <div className="flex-1 relative bg-slate-50" ref={reactFlowWrapper}>
        {/* Header Controls: Multi-button layout */}
        <div className="absolute top-6 left-6 right-6 z-[50] flex justify-between items-center pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
             {/* Fit View Button */}
             <button 
               onClick={handleFitView}
               className="p-3 bg-white rounded-full shadow-lg text-slate-500 hover:text-indigo-600 transition-all border border-slate-100"
               title="Center Canvas"
             >
               <Maximize size={18} />
             </button>

             {/* Bot Status Toggle */}
             <button 
               onClick={toggleBot} 
               className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isBotActive ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
             >
               {isBotActive ? <Zap size={14} className="fill-current"/> : <ZapOff size={14}/>}
               {isBotActive ? 'Bot: Online' : 'Bot: Offline'}
             </button>
          </div>

          <button onClick={saveFlow} disabled={isSaving} className="pointer-events-auto flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Architecture
          </button>
        </div>

        <ReactFlow
          nodes={nodes} edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
          onInit={setReactFlowInstance}
          onNodeClick={handleNodeClick} // FIXED: Auto-zoom logic call
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes} 
          fitView 
          snapToGrid={true}
        >
          <Background variant="dots" gap={25} size={1} color="#CBD5E1" />
          <Controls className="bg-white shadow-xl border-none rounded-xl" />
          
          <MiniMap 
            nodeColor={(n) => n.type === 'startNode' ? '#22c55e' : '#6366f1'} 
            maskColor="rgba(248, 250, 252, 0.8)" 
            className="rounded-2xl shadow-2xl border-4 border-white mb-6 mr-6 overflow-hidden"
            style={{ height: 120, width: 180, background: '#f8fafc' }}
          />
        </ReactFlow>
      </div>
      
      {selectedNode && (
        <PropertiesPanel 
          selectedNode={selectedNode} 
          onUpdate={updateNodeData} 
          onDelete={(id) => { setNodes(nds => nds.filter(n => n.id !== id)); setSelectedNode(null); }} 
          onClose={() => setSelectedNode(null)} 
        />
      )}
    </div>
  );
};

// ReactFlow Provider Wrapper (Hooks ki accessibility ke liye)
const FlowBuilder = () => (
  <ReactFlowProvider>
    <FlowBuilderContent />
  </ReactFlowProvider>
);

export default FlowBuilder;
  
