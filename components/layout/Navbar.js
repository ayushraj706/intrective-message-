import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-6 bg-black">
      <h1 className="text-xl font-bold">BaseKey</h1>
      
      <div className="flex items-center gap-4">
        {/* Yahan humne Bell Icon fit kar diya */}
        <NotificationCenter /> 
        
        <div className="w-10 h-10 bg-zinc-800 rounded-full"></div> {/* Profile Icon */}
      </div>
    </nav>
  );
};

