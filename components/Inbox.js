import React, { useEffect, useRef } from 'react';
import { register } from 'vue-advanced-chat';

// लाइब्रेरी को रजिस्टर करना (यह वही लाइब्रेरी है जो आपकी रेपो में है)
if (typeof window !== 'undefined') {
  register();
}

const Inbox = () => {
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      // यहाँ हम अपनी रेपो वाला डेटा सेट करेंगे
      chatRef.current.rooms = JSON.stringify([
        {
          roomId: '1',
          roomName: 'Ayush Raj (BaseKey)',
          avatar: 'https://ayus.fun/logo.png',
          users: [{ _id: '1', username: 'Ayush' }]
        }
      ]);
      chatRef.current.messages = JSON.stringify([]);
      chatRef.current.currentUserId = '1';
    }
  }, []);

  return (
    <div className="h-screen w-full">
      {/* ये वही टैग है जो आपकी Vue वाली रेपो को यहाँ रेंडर करेगा */}
      <vue-advanced-chat
        ref={chatRef}
        height="100vh"
        theme="dark"
        styles={JSON.stringify({
          general: { background: '#0a0a0a' },
          header: { background: '#121212' }
        })}
      />
    </div>
  );
};

export default Inbox;
