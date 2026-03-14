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

// Firebase imports retained
import { db, auth } from '../../firebase'; 
import WhatsAppNode from './WhatsAppNode';
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

const nodeTypes = { whatsappNode: WhatsAppNode };

const initialNodes = [
  { 
    id: 'node_1', 
    type: 'whatsappNode', 
    position: { x: 250, y: 100 }, 
    data: { blocks: [{ id: 'blk_1', type: 'text', content: 'Welcome to BaseKey!' }] } 
  },
];

const FlowBuilder = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // 1. Connection Logic (Connecting nodes & buttons)
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 2. Drag & Drop Logic
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
        data: { blocks: [{ id: `blk_${Date.now()}`, type: 'text', content: 'New Message' }] },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // 3. Update Node Data Logic (For Properties Panel)
  const updateNodeData = (nodeId, newBlocks) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, blocks: newBlocks } };
          // Agar selected node update ho raha hai, toh panel ko bhi sync karein
          if (selectedNode?.id === nodeId) setSelectedNode(updatedNode);
          return updatedNode;
        }
        return node;
      })
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#050505]">
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
            onPaneClick={() => setSelectedNode(null)} // Click outside to close panel
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant="dots" gap={25} color="#333" />
            <Controls className="bg-white dark:bg-zinc-900 border-none shadow-xl" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <PropertiesPanel 
            selectedNode={selectedNode}
            onUpdate={(id, newBlocks) => updateNodeData(id, newBlocks)}
            onDelete={(id) => {
              setNodes((nds) => nds.filter((n) => n.id !== id));
              // Associated edges will automatically be cleaned up by React Flow
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
        
