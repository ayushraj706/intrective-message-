import React from 'react';

const Avatar = ({ name, src, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-lg"
  };

  return (
    <div className={`${sizeClasses[size]} rounded-xl overflow-hidden bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shrink-0 border border-white/10`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{name ? name.slice(-2).toUpperCase() : '??'}</span>
      )}
    </div>
  );
};

export default Avatar;
