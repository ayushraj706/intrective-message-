import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  addEdge, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save } from 'lucide-react';

// Firebase Firestore logic
import { db, auth } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore';

import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode';
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes = { whatsappNode: WhatsAppNode, startNode: StartNode };

const initialNodes = [
  { id: 'start_1', type: 'startNode', position: { x: 50, y: 200 }, data: {} },
  { 
    id: 'node_1', 
    type: 'whatsappNode', 
    position: { x: 200, y: 120 }, 
    data: { title: 'Message 1', blocks: [{ id: 'blk_1', type: 'text', content: 'Welcome to BaseKey!' }] } 
  },
];

const FlowBuilder = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Connection Logic
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 2. Drag & Drop with Sequential Naming
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });

      // Count existing whatsapp nodes for naming
      const currentMessageNodes = nodes.filter(n => n.type === 'whatsappNode').length;
      const newNodeTitle = `Message ${currentMessageNodes + 1}`;

      const newNode = {
        id: `node_${Date.now()}`,
        type: 'whatsappNode',
        position,
        data: { 
          title: newNodeTitle,
          blocks: [{ id: `blk_${Date.now()}`, type: 'text', content: 'Naya Message...' }] 
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes, setNodes]
  );

  // 3. Save to Firebase (Associated with User ID)
  const saveFlow = async () => {
    if (!reactFlowInstance || !auth.currentUser) return alert("Please Login first!");
    
    setIsSaving(true);
    try {
      const flowData = reactFlowInstance.toObject(); // Get JSON structure
      const userRef = doc(db, "users", auth.currentUser.uid, "flows", "main_flow");
      
      await setDoc(userRef, {
        flowData,
        updatedAt: new Date().toISOString(),
      });
      
      alert("Flow Saved Successfully!");
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save flow.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateNodeData = (nodeId, newBlocks) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, blocks: newBlocks } };
          if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
          return updatedNode;
        }
        return node;
      })
    );
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <ReactFlowProvider>
        <FlowSidebar /> 

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          {/* Save Button UI */}
          <button 
            onClick={saveFlow}
            disabled={isSaving}
            className="absolute top-4 right-4 z-[50] flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-xs shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            <Save size={16} /> {isSaving ? "Saving..." : "Save Flow"}
          </button>

          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onInit={setReactFlowInstance}
            onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onNodeClick={(e, node) => setSelectedNode(node)}
            nodeTypes={nodeTypes}
            fitView snapToGrid={true} snapGrid={[20, 20]}
          >
            <Background variant="dots" gap={20} size={1} color="#E2E8F0" />
            <Controls className="bg-white border-none shadow-md" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <PropertiesPanel 
            selectedNode={selectedNode}
            onUpdate={(id, blocks) => updateNodeData(id, blocks)}
            onDelete={(id) => { setNodes(nds => nds.filter(n => n.id !== id)); setSelectedNode(null); }}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
};

export default FlowBuilder;
