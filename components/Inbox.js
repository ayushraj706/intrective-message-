import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const Inbox = () => {
  const chatRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vue Library ko dynamic load karna
    const initChat = async () => {
      const { register } = await import('vue-advanced-chat');
      register();
    };
    initChat();

    // 2. Real-time Firestore Listener
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          content: data.text || '',
          senderId: data.sender === 'admin' ? '1' : '2',
          username: data.sender === 'admin' ? 'Ayush' : 'Customer',
          timestamp: data.timestamp ? new Date(data.timestamp.toMillis()).toTimeString().slice(0, 5) : '',
          date: data.timestamp ? new Date(data.timestamp.toMillis()).toDateString() : '',
          // Agar image hai toh Cloudinary link yahan aayega
          files: data.image ? [{ url: data.image, type: 'image/png', name: 'photo.png' }] : []
        };
      });
      
      setMessages(msgList);
      setLoading(false); // Data mil gaya, loading band!
    });

    return () => unsubscribe();
  }, []);

  // 3. Vue Component ko data supply karna
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.rooms = JSON.stringify([{
        roomId: '1',
        roomName: 'Ayush Raj (BaseKey)',
        avatar: 'https://ayus.fun/logo.png',
        users: [{ _id: '1', username: 'Ayush' }, { _id: '2', username: 'Customer' }]
      }]);
      
      chatRef.current.messages = JSON.stringify(messages);
      chatRef.current.currentUserId = '1';
      
      // YE SABSE ZAROORI HAI: Spinner rokne ke liye
      chatRef.current.messagesLoaded = JSON.stringify(!loading);
      chatRef.current.roomsLoaded = JSON.stringify(true);
    }
  }, [messages, loading]);

  return (
    <div className="h-screen w-full bg-[#0a0a0a]">
      <vue-advanced-chat
        ref={chatRef}
        height="100vh"
        theme="dark"
        // Loading state pass karna
        messages-loaded={!loading} 
      />
    </div>
  );
};

export default Inbox;
