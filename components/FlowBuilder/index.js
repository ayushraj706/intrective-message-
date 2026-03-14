import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  ReactFlowProvider, addEdge, Background, Controls, useNodesState, useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Loader2 } from 'lucide-react';

// Firebase
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

  // 1. Firebase se Purana Flow Load karna
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
        // Agar pehle se kuch nahi hai toh default nodes dikhao
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

  // 2. Naya Dabba (Node) banane ka main function
  const addNewNode = useCallback((type, position = null) => {
    // Agar position nahi di (click kiya), toh center mein spawn karo
    const spawnPos = position || { x: Math.random() * 400, y: Math.random() * 400 };
    
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

  // 3. Drag and Drop support
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type || !reactFlowInstance) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addNewNode(type, position);
  }, [reactFlowInstance, addNewNode]);

  // 4. Save Logic
  const saveFlow = async () => {
    if (!reactFlowInstance || !auth.currentUser) return alert("Login required!");
    setIsSaving(true);
    try {
      const flowData = reactFlowInstance.toObject();
      await setDoc(doc(db, "users", auth.currentUser.uid, "flows", "main_flow"), {
        flowData, updatedAt: new Date().toISOString()
      });
      alert("Flow Saved!");
    } catch (e) { alert("Save failed"); }
    setIsSaving(false);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <ReactFlowProvider>
        {/* Sidebar ko addNewNode function pass kiya */}
        <FlowSidebar onAddNode={(type) => addNewNode(type)} /> 

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <button onClick={saveFlow} className="absolute top-4 right-4 z-[50] flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg">
            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Save Flow
          </button>

          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
            onInit={setReactFlowInstance} onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onNodeClick={(e, node) => setSelectedNode(node)}
            nodeTypes={nodeTypes} fitView snapToGrid={true}
          >
            <Background variant="dots" gap={20} color="#E2E8F0" />
            <Controls />
          </ReactFlow>
        </div>
        {selectedNode && (
          <PropertiesPanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)}
            onUpdate={(id, blocks) => setNodes(nds => nds.map(n => n.id === id ? {...n, data: {...n.data, blocks}} : n))}
            onDelete={(id) => { setNodes(nds => nds.filter(n => n.id !== id)); setSelectedNode(null); }}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
};

export default FlowBuilder;
              
