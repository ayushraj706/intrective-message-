import React, { useState, useCallback } from 'react';
import { 
  MessageSquare, Users, BarChart3, LayoutDashboard, 
  Settings, ChevronDown, Bot, Zap, ChevronLeft, ChevronRight,
  Plus, MessageCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; 
import UserProfile from './UserProfile';
import NotificationCenter from './layout/NotificationCenter'; 

const Sidebar = ({ setActiveTab, activeTab, isCollapsed, setIsCollapsed }) => {
  const [isConvOpen, setIsConvOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleConv = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setTimeout(() => setIsConvOpen(true), 250);
    } else {
      setIsConvOpen(prev => !prev);
    }
  }, [isCollapsed, setIsCollapsed]);

  const handleCollapseToggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
    if (!isCollapsed) setIsConvOpen(false);
  }, [isCollapsed, setIsCollapsed]);

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  return (
    <motion.div 
      variants={sidebarVariants}
      animate={isCollapsed ? "collapsed" : "expanded"}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-white dark:bg-[#0f1115] text-zinc-500 dark:text-gray-400 flex flex-col border-r border-zinc-200/80 dark:border-gray-800/80 shadow-2xl shadow-black/5 relative z-50"
    >
      {/* BRAND LOGO */}
      <div className={`h-[72px] shrink-0 flex items-center border-b border-zinc-100 dark:border-gray-800/50 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-5'}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/25 text-white shrink-0 ring-2 ring-blue-500/10"
          >
            B
          </motion.div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <span className="font-bold tracking-tight text-lg text-zinc-900 dark:text-white whitespace-nowrap">
                  Base<span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">Key</span>
                </span>
                <Sparkles size={14} className="text-blue-500 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <NotificationCenter />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 scrollbar-hide">
        
        {/* OVERVIEW */}
        <SectionLabel isCollapsed={isCollapsed}>Overview</SectionLabel>
        <NavItem 
          icon={<LayoutDashboard size={19}/>} 
          label="Dashboard" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          isCollapsed={isCollapsed}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
        />
        <NavItem 
          icon={<BarChart3 size={19}/>} 
          label="Reports" 
          active={activeTab === 'reports'} 
          onClick={() => setActiveTab('reports')} 
          isCollapsed={isCollapsed}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
        />

        {/* COMMUNICATION */}
        <SectionLabel isCollapsed={isCollapsed} delay>Communication</SectionLabel>
        
        <div className="space-y-1">
          <motion.button 
            onClick={toggleConv}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`w-full flex items-center justify-between py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-3.5'} 
              ${isConvOpen && !isCollapsed 
                ? 'bg-blue-50/80 dark:bg-blue-600/10 text-blue-600 shadow-sm ring-1 ring-blue-100 dark:ring-blue-600/20' 
                : 'hover:bg-zinc-50 dark:hover:bg-white/[0.03] text-zinc-600 dark:text-gray-300'
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`p-1 rounded-lg ${isConvOpen && !isCollapsed ? 'bg-blue-100 dark:bg-blue-600/20' : ''}`}>
                <MessageSquare size={19} className={isConvOpen && !isCollapsed ? 'text-blue-600' : 'text-zinc-400'} />
              </div>
              {!isCollapsed && <span className="whitespace-nowrap">Conversations</span>}
            </div>
            {!isCollapsed && (
              <motion.div 
                animate={{ rotate: isConvOpen ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ChevronDown size={14} className="text-zinc-400" />
              </motion.div>
            )}
          </motion.button>

          <AnimatePresence>
            {isConvOpen && !isCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden flex flex-col pl-11 space-y-0.5"
              >
                <SubNavItem 
                  icon={<MessageCircle size={16}/>} 
                  label="My Inbox" 
                  active={activeTab === 'inbox'} 
                  onClick={() => setActiveTab('inbox')} 
                />
                <SubNavItem 
                  icon={<Plus size={16}/>} 
                  label="Add Inbox" 
                  active={activeTab === 'add-inbox'} 
                  onClick={() => setActiveTab('add-inbox')} 
                />
                <SubNavItem 
                  icon={<Users size={16}/>} 
                  label="Contacts" 
                  active={activeTab === 'contacts'} 
                  onClick={() => setActiveTab('contacts')} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NEURAL ENGINE */}
        <div className={`mt-5 mb-1 flex items-center ${isCollapsed ? 'justify-center py-2' : 'px-3 py-2'}`}>
           {!isCollapsed ? (
             <div className="flex items-center gap-2">
               <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
               <span className="text-[9px] uppercase tracking-[0.25em] text-blue-600/70 dark:text-blue-400/70 font-black italic whitespace-nowrap">Neural Engine</span>
               <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
             </div>
           ) : (
             <div className="w-8 h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent rounded-full" />
           )}
        </div>
        
        <NavItem 
          icon={<Zap size={19}/>} 
          label="Interactive Flow" 
          active={activeTab === 'flow'} 
          onClick={() => setActiveTab('flow')} 
          isCollapsed={isCollapsed}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
        />
        <NavItem 
          icon={<Bot size={19}/>} 
          label="AI Integration" 
          active={activeTab === 'integration'} 
          onClick={() => setActiveTab('integration')} 
          isCollapsed={isCollapsed}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
        />

        {/* SYSTEM */}
        <SectionLabel isCollapsed={isCollapsed} delay>System</SectionLabel>
        <NavItem 
          icon={<Settings size={19}/>} 
          label="Settings" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          isCollapsed={isCollapsed}
          hoveredItem={hoveredItem}
          setHoveredItem={setHoveredItem}
        />
      </nav>

      {/* COLLAPSE TOGGLE */}
      <div className="px-3 py-2 border-t border-zinc-100 dark:border-gray-800/50">
        <motion.button 
          onClick={handleCollapseToggle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3 px-3'} py-2.5 rounded-xl text-zinc-400 hover:text-blue-600 dark:hover:bg-white/[0.03] transition-all duration-200 group`}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </motion.div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 group-hover:text-blue-600 transition-colors"
            >
              Collapse
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* USER PROFILE */}
      <div className="p-3 border-t border-zinc-100 dark:border-gray-800/50">
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </motion.div>
  );
};

// ─── Section Label ───
const SectionLabel = ({ isCollapsed, children, delay = false }) => {
  if (isCollapsed) return null;
  return (
    <motion.label 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ? 0.1 : 0, duration: 0.3 }}
      className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 font-black mb-1.5 block px-3.5 mt-5 select-none"
    >
      {children}
    </motion.label>
  );
};

// ─── SubNavItem ───
const SubNavItem = ({ icon, label, active, onClick }) => (
  <motion.button 
    onClick={onClick}
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.98 }}
    className={`w-full flex items-center gap-3 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all duration-200
      ${active 
        ? 'text-blue-600 bg-blue-50 dark:bg-blue-600/10 shadow-sm ring-1 ring-blue-100/50 dark:ring-blue-600/10' 
        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-gray-200 hover:bg-zinc-50/60 dark:hover:bg-white/[0.03]'
      }`}
  >
    <span className={`${active ? 'text-blue-600' : 'text-zinc-400'} transition-colors`}>{icon}</span>
    <span className="whitespace-nowrap tracking-tight">{label}</span>
    {active && (
      <motion.div 
        layoutId="activeIndicator"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"
      />
    )}
  </motion.button>
);

// ─── NavItem ───
const NavItem = ({ icon, label, active, onClick, isCollapsed, hoveredItem, setHoveredItem }) => {
  const isHovered = hoveredItem === label;
  
  return (
    <motion.button 
      onClick={onClick}
      onMouseEnter={() => setHoveredItem(label)}
      onMouseLeave={() => setHoveredItem(null)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isCollapsed ? 'justify-center px-0' : 'px-3.5'}
        ${active 
          ? 'bg-blue-50/90 dark:bg-blue-600/10 text-blue-600 shadow-sm ring-1 ring-blue-100/60 dark:ring-blue-600/20' 
          : 'text-zinc-600 dark:text-gray-300 hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]'
        }`}
    >
      <motion.div
        animate={{ 
          scale: isHovered && !active ? 1.1 : 1,
          rotate: isHovered && !active ? 3 : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`p-1.5 rounded-lg ${active ? 'bg-blue-100/70 dark:bg-blue-600/20' : ''}`}
      >
        <span className={`transition-colors duration-200 ${active ? 'text-blue-600' : 'text-zinc-400'}`}>
          {icon}
        </span>
      </motion.div>
      
      {!isCollapsed && (
        <motion.span 
          className="whitespace-nowrap tracking-tight"
          animate={{ x: isHovered && !active ? 2 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {label}
        </motion.span>
      )}
      
      {!isCollapsed && active && (
        <motion.div 
          layoutId="activeNavIndicator"
          className="ml-auto w-1 h-5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30"
        />
      )}
    </motion.button>
  );
};

export default Sidebar;
