import React, { useEffect, useRef } from 'react';

const Inbox = () => {
  const chatRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      const { register } = await import('vue-advanced-chat');
      register();
      if (chatRef.current) {
        chatRef.current.rooms = JSON.stringify([{
            roomId: '1',
            roomName: 'Ayush Raj (BaseKey)',
            avatar: 'https://ayus.fun/logo.png',
            users: [{ _id: '1', username: 'Ayush' }]
        }]);
        chatRef.current.messages = JSON.stringify([]);
        chatRef.current.messagesLoaded = true;
      }
    };
    initChat();
  }, []);

  return (
    <div className="h-screen w-full bg-[#0a0a0a] animate-in fade-in duration-500">
      <vue-advanced-chat
        ref={chatRef}
        height="100vh"
        theme="dark"
      />
    </div>
  );
};

export default Inbox;
