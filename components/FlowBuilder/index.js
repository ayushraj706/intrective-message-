import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, MiniMap, useNodesState, useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2, Zap, ZapOff } from 'lucide-react';
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode';
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes = { whatsappNode: WhatsAppNode, startNode: StartNode };

const FlowBuilder = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBotActive, setIsBotActive] = useState(false);

  // FIXED: Firebase Load logic with auto StartNode
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
            // IF EMPTY: Add default Start Node
            setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: {} }]);
          }
          setIsBotActive(isActive || false);
        } else {
          // NEW USER: Add default Start Node
          setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: {} }]);
        }
      } catch (e) { 
        console.error("Load error:", e);
        // Fallback for errors
        setNodes([{ id: 'start_0', type: 'startNode', position: { x: 50, y: 150 }, data: {} }]);
      }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  const addNewNode = useCallback((type, position = null) => {
    const spawnPos = position || { x: 300, y: 300 };
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'whatsappNode',
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
      <ReactFlowProvider>
        <FlowSidebar onAddNode={(type) => addNewNode(type)} /> 

        <div className="flex-1 relative bg-slate-50" ref={reactFlowWrapper}>
          {/* Header Controls */}
          <div className="absolute top-6 left-6 right-6 z-[50] flex justify-between items-center pointer-events-none">
            <div className="bg-white p-1 rounded-full shadow-2xl border border-slate-100 flex gap-1 pointer-events-auto">
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
            nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
            onInit={setReactFlowInstance}
            onNodeClick={(e, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes} fitView snapToGrid={true}
          >
            <Background variant="dots" gap={25} size={1} color="#CBD5E1" />
            <Controls className="bg-white shadow-xl border-none rounded-xl" />
            <MiniMap 
              nodeColor="#6366f1" 
              maskColor="rgba(241, 245, 249, 0.7)" 
              className="rounded-2xl shadow-2xl border-4 border-white mb-4 mr-4"
              style={{ height: 100, width: 150 }}
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
      </ReactFlowProvider>
    </div>
  );
};

export default FlowBuilder;
              
