// ... पुराने इंपोर्ट्स के साथ PropertiesPanel जोड़ें
import PropertiesPanel from './PropertiesPanel';

const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // नोड पर क्लिक करने का लॉजिक
  const onNodeClick = (event, node) => setSelectedNode(node);

  // टेक्स्ट अपडेट करने का लॉजिक
  const updateNodeLabel = (nodeId, newLabel) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#050505]">
      <FlowSidebar />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick} // <-- क्लिक इवेंट
          nodeTypes={nodeTypes}
          // ... बाकी पुराना कोड
        >
          <Background variant="dots" color="#333" />
        </ReactFlow>
      </div>
      
      {/* राईट साइड वाला प्रॉपर्टी पैनल */}
      <PropertiesPanel 
        selectedNode={selectedNode}
        onUpdate={updateNodeLabel}
        onDelete={(id) => setNodes((nds) => nds.filter(n => n.id !== id))}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};
