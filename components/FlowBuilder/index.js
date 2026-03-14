import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, useNodesState, useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2 } from 'lucide-react';

// Firebase Firestore logic
import { db, auth } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

  // 1. Firebase Load: Page khulte hi purana flow wapas aayega
  useEffect(() => {
    const loadFlow = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, "users", auth.currentUser.uid, "flows", "main_flow");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const { flowData } = docSnap.data();
        if (flowData) {
          setNodes(flowData.nodes || []);
          setEdges(flowData.edges || []);
        }
      } else {
        setNodes([
          { id: 'start_1', type: 'startNode', position: { x: 50, y: 200 }, data: {} },
          { id: 'node_1', type: 'whatsappNode', position: { x: 250, y: 150 }, 
            data: { title: 'Message 1', blocks: [{ id: 'b1', type: 'text', content: 'Welcome!' }] } 
          },
        ]);
      }
    };
    loadFlow();
  }, [auth.currentUser, setNodes, setEdges]);

  // 2. Add New Node Logic: Click aur Drag dono ke liye
  const addNewNode = useCallback((type, position = null) => {
    const spawnPos = position || { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 };
    // Sequential Naming
    const count = nodes.filter(n => n.type === 'whatsappNode').length;
    
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'whatsappNode',
      position: spawnPos,
      data: { 
        title: `Message ${count + 1}`,
        blocks: [{ id: `blk_${Date.now()}`, type: 'text', content: 'Type your message...' }] 
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes]);

  // 3. Sync Logic: Real-time update for Panel and Canvas
  const updateNodeData = (nodeId, newBlocks) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, blocks: newBlocks } };
          // Panel sync: Jab dabba update ho, toh selected state bhi update ho
          if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
          return updatedNode;
        }
        return node;
      })
    );
  };

  const saveFlow = async () => {
    if (!reactFlowInstance || !auth.currentUser) return alert("Login required!");
    setIsSaving(true);
    try {
      const flowData = reactFlowInstance.toObject();
      await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), {
        flowData, updatedAt: new Date().toISOString()
      });
      alert("Flow Saved Successfully!");
    } catch (e) { alert("Save failed"); }
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <ReactFlowProvider>
        <FlowSidebar onAddNode={(type) => addNewNode(type)} /> 

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <button onClick={saveFlow} disabled={isSaving} className="absolute top-4 right-4 z-[50] flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Flow
          </button>

          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
            onInit={setReactFlowInstance}
            onDrop={(e) => {
              e.preventDefault();
              const type = e.dataTransfer.getData('application/reactflow');
              const pos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
              if (type) addNewNode(type, pos);
            }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onNodeClick={(e, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes} fitView snapToGrid={true}
          >
            <Background variant="dots" gap={20} color="#E2E8F0" />
            <Controls />
          </ReactFlow>
        </div>
        {selectedNode && (
          <PropertiesPanel 
            selectedNode={selectedNode} 
            onUpdate={updateNodeData} // Pass the specialized sync function
            onDelete={(id) => { setNodes(nds => nds.filter(n => n.id !== id)); setSelectedNode(null); }}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
};

export default FlowBuilder;
  
