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
import ListNode from './ListNode'; // Naya List Node import kiya
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

// Node types register kiya
const nodeTypes = { 
  whatsappNode: WhatsAppNode, 
  startNode: StartNode,
  listNode: ListNode 
};

const FlowBuilderContent = () => {
  const reactFlowWrapper = useRef(null);
  const { setCenter, fitView, toObject } = useReactFlow(); 
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBotActive, setIsBotActive] = useState(false);

  // 1. Firebase se Flow Load karna (Safe logic)
  useEffect(() => {
    const loadFlow = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, "users", auth.currentUser.uid, "flows", "main_flow");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const { flowData, isActive } = docSnap.data();
          if (flowData?.nodes?.length > 0) {
            setNodes(flowData.nodes);
            setEdges(flowData.edges || []);
          } else {
            setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: { title: 'START ROOT' } }]);
          }
          setIsBotActive(isActive || false);
        } else {
          setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: { title: 'START ROOT' } }]);
        }
      } catch (e) { 
        setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: { title: 'START ROOT' } }]);
      }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  // 2. Node Click logic (Mismatch Fix karne ke liye Center & Select)
  const handleNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    const { x, y } = node.position;
    setCenter(x + 250, y + 100, { zoom: 1.2, duration: 800 }); 
  }, [setCenter, setSelectedNode]);

  // 3. Naya Node jodna (List Menu & Neural Message structure fix)
  const addNewNode = useCallback((type, position = null) => {
    const id = `node_${Date.now()}`;
    const spawnPos = position || { x: 400, y: 200 };
    
    // Naye node ke liye default backend structure
    const defaultData = type === 'listNode' ? {
      header: { type: 'text', text: 'LIST TITLE' },
      body: 'Select an option from our menu:',
      footer: 'BaseKey List System',
      listButton: 'View Menu',
      listRows: [{ id: `r_${Date.now()}`, title: 'Option 1', desc: 'Detail description here' }]
    } : {
      header: { type: 'text', text: 'WELCOME TITLE' },
      body: 'Type your business message here...',
      footer: '',
      buttons: []
    };

    const newNode = {
      id,
      type: type || 'whatsappNode',
      position: spawnPos,
      data: defaultData,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes]);

  // 4. Central Update handler (Crash-proof logic)
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        // Naya data merge ho raha hai
        const updatedNode = { ...node, data: { ...node.data, ...newData } };
        // Agar wahi node selected hai toh state bhi sync karo
        if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
        return updatedNode;
      }
      return node;
    }));
  }, [selectedNode, setNodes]);

  const saveFlow = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const flowData = toObject();
      await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), {
        flowData, 
        updatedAt: new Date().toISOString(),
        isActive: isBotActive
      }, { merge: true });
    } catch (e) { console.error("Save Error"); }
    setIsSaving(false);
  };

  const toggleBot = async () => {
    const newState = !isBotActive;
    setIsBotActive(newState);
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), { isActive: newState });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <FlowSidebar onAddNode={addNewNode} /> 

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        {/* Floating Controls */}
        <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
          <div className="flex gap-3 pointer-events-auto">
             <button onClick={() => fitView({ padding: 0.3 })} className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100 text-slate-600 hover:text-indigo-600 transition-all">
               <Maximize size={20} />
             </button>
             <button onClick={toggleBot} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all ${isBotActive ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-white text-slate-400 border border-slate-100 shadow-xl'}`}>
               {isBotActive ? <Zap size={14} className="fill-current"/> : <ZapOff size={14}/>}
               {isBotActive ? 'Neural Active' : 'Bot Offline'}
             </button>
          </div>

          <button onClick={saveFlow} disabled={isSaving} className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} 
            Deploy Architecture
          </button>
        </div>

        <ReactFlow
          nodes={nodes} edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedNode(null)}
          nodeTypes={nodeTypes} 
          fitView 
        >
          <Background variant="dots" gap={30} size={1} color="#E2E8F0" />
          <Controls className="bg-white rounded-2xl border-none shadow-2xl overflow-hidden" />
          <MiniMap className="rounded-3xl border-4 border-white shadow-2xl overflow-hidden mb-6 mr-6" />
        </ReactFlow>
      </div>
      
      {/* MISMATCH FIX: selectedNode.id as key ensures panel resets on node switch */}
      {selectedNode && (
        <PropertiesPanel 
          key={selectedNode.id} 
          selectedNode={selectedNode} 
          onUpdate={updateNodeData} 
          onDelete={(id) => { 
            setNodes(nds => nds.filter(n => n.id !== id)); 
            setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
            setSelectedNode(null); 
          }} 
          onClose={() => setSelectedNode(null)} 
        />
      )}
    </div>
  );
};

const FlowBuilder = () => (
  <ReactFlowProvider>
    <FlowBuilderContent />
  </ReactFlowProvider>
);

export default FlowBuilder;
            
