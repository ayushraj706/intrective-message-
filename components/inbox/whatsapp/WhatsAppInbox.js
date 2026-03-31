import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase'; 
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import axios from 'axios';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react'; // MessageSquare import missing tha yahan

import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

const WhatsAppInbox = ({ onBack }) => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  
  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  useEffect(() => {
    if (!currentUserId) return;
    try {
      const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
          setMessages([]);
          setRooms([]);
          return;
        }
        const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filteredMsgs = allMsgs.filter(m => m && (!m.platform || m.platform === 'whatsapp'));
        setMessages(filteredMsgs);
        
        // SAFE ROOM LOGIC: Ensure senderNumber is a string before Set
        const uniqueRooms = [...new Set(filteredMsgs.map(m => String(m.senderNumber || '')))].filter(Boolean).reverse();
        setRooms(uniqueRooms);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase Error:", err);
    }
  }, [currentUserId]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    const textToSend = inputText;
    const cleanNumber = String(selectedRoom).replace(/\D/g, ''); 
    setInputText('');
    try {
      await axios.post('/api/send-message', { userId: currentUserId, to: cleanNumber, text: textToSend });
    } catch (err) { 
      toast.error("WhatsApp failed!"); 
    }
  };

  return (
    <div className="flex h-screen bg-[#080808] overflow-hidden">
      <ChatSidebar 
        rooms={rooms} 
        selectedRoom={selectedRoom} 
        setSelectedRoom={setSelectedRoom} 
        onBack={onBack} 
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {selectedRoom ? (
          <>
            <ChatWindow 
              messages={messages.filter(m => String(m.senderNumber) === String(selectedRoom))} 
              selectedRoom={selectedRoom} 
            />
            <ChatInput 
              inputText={inputText} 
              setInputText={setInputText} 
              onSend={sendMessage} 
            />
          </>
        ) : (
          <div className="m-auto flex flex-col items-center gap-4 opacity-20">
            <div className="w-20 h-20 rounded-full border-2 border-green-600 flex items-center justify-center animate-pulse">
               <MessageSquare size={40} className="text-green-600" />
            </div>
            <p className="text-green-600 font-black italic tracking-widest uppercase text-xs">Select a secure channel</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppInbox;
