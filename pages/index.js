import Sidebar from './components/Sidebar';
import Configuration from './components/Configuration';
import Integration from './components/Integration';
// import Inbox from './components/Inbox'; // Ye agla step hai!

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* 1. Sidebar Fixed Rahega */}
      <Sidebar />

      {/* 2. Content area jo scroll hoga */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Yahan hum Routing laga sakte hain, abhi test ke liye: */}
        <Integration /> 
      </main>
    </div>
  );
}
