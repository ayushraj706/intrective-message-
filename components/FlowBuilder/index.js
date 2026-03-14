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

// Firebase imports (Safe)
import { db, auth } from '../../firebase'; 
import WhatsAppNode from './WhatsAppNode';
import StartNode from './StartNode'; // Naya component
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

// Node Types Register
const nodeTypes = { 
  whatsappNode: WhatsAppNode,
  startNode: StartNode 
};

// Initial State: Ek Start icon aur ek Welcome message pehle se rahega
const initialNodes = [
  { 
    id: 'start_1', 
    type: 'startNode', 
    position: { x: 50, y: 200 }, 
    data: {} 
  },
  { 
    id: 'node_1', 
    type: 'whatsappNode', 
    position: { x: 200, y: 120 }, 
    data: { blocks: [{ id: 'blk_1', type: 'text', content: 'Welcome to BaseKey!' }] } 
  },
];

const FlowBuilder = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // 1. Connection Logic: Ismein button handles automatically map honge
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 2. Drag & Drop Logic: Screen coordinates ko flow coordinates mein convert karna
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type: 'whatsappNode',
        position,
        data: { 
          blocks: [{ id: `blk_${Date.now()}`, type: 'text', content: 'New Message' }] 
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // 3. Sync Logic: Jab properties panel mein update ho toh canvas par dikhe
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
    <div className="flex h-screen bg-[#F8FAFC]"> {/* Professional Light Background */}
      <ReactFlowProvider>
        <FlowSidebar /> 

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(e, node) => setSelectedNode(node)}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes}
            fitView
            // Professional Look Settings
            snapToGrid={true}
            snapGrid={[20, 20]}
          >
            {/* Background Style Updated */}
            <Background variant="dots" gap={20} size={1} color="#E2E8F0" />
            <Controls className="bg-white border-none shadow-md" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <PropertiesPanel 
            selectedNode={selectedNode}
            onUpdate={(id, newBlocks) => updateNodeData(id, newBlocks)}
            onDelete={(id) => {
              setNodes((nds) => nds.filter((n) => n.id !== id));
              setSelectedNode(null);
            }}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </ReactFlowProvider>
    </div>
  );
};

export default FlowBuilder;
