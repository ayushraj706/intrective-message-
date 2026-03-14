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

// पाथ फिक्स: दो फोल्डर बाहर (root) में firebase.js है
import { db, auth } from '../../firebase'; 
import WhatsAppNode from './WhatsAppNode';
import FlowSidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';

// कस्टम नोड रजिस्टर करना
const nodeTypes = { whatsappNode: WhatsAppNode };

// शुरुआती डेटा
const initialNodes = [
  { 
    id: 'node_1', 
    type: 'whatsappNode', 
    position: { x: 250, y: 100 }, 
    data: { blocks: [{ type: 'text', content: 'Welcome to BaseKey!' }] } 
  },
];

const FlowBuilder = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // 1. कनेक्शन लॉजिक (तार जोड़ना)
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // 2. ड्रैग एंड ड्रॉप लॉजिक (वीडियो फिक्स)
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
        type: 'whatsappNode', // हमेशा व्हाट्सएप स्टाइल नोड बनेगा
        position,
        data: { blocks: [{ type: 'text', content: 'New Message' }] },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // 3. अपडेट लॉजिक (Properties Panel के लिए)
  const updateNodeData = (nodeId, newBlocks) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, blocks: newBlocks } };
        }
        return node;
      })
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#050505]">
      <ReactFlowProvider>
        {/* बाएँ तरफ वाला मेनू */}
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
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant="dots" gap={25} color="#333" />
            <Controls className="bg-white dark:bg-zinc-900 border-none shadow-xl" />
          </ReactFlow>
        </div>

        {/* दाएँ तरफ वाला एडिट पैनल */}
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
