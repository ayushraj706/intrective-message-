import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, { ReactFlowProvider, addEdge, Background, Controls } from 'reactflow';
import WhatsAppNode from './WhatsAppNode';
import FlowSidebar from './Sidebar';

const nodeTypes = { whatsappNode: WhatsAppNode };

const FlowBuilder = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { blocks: [{ type: 'text', content: 'Hello! Type here' }] },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#050505]">
      <ReactFlowProvider>
        <FlowSidebar />
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background variant="dots" gap={25} color="#333" />
            <Controls />
          </ReactFlow>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default FlowBuilder;
