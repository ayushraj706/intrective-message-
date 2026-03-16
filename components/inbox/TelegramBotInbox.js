import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, Loader2, CheckCheck, Clock, ChevronLeft, Paperclip, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const TelegramBotInbox = ({ onBack }) => {
  const platform = 'telegram';
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef();

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const filteredMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                           .filter(m => m.platform === 'telegram');
      setMessages(filteredMsgs);
      const uniqueIds = [...new Set(filteredMsgs.map(m => m.senderNumber))].filter(Boolean).reverse();
      setRooms(uniqueIds);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    const textToSend = inputText;
    setInputText('');
    try {
      await axios.post('/api/send-telegram', { userId: currentUserId, to: selectedRoom, text: textToSend });
    } catch (err) { toast.error("Bot message failed!"); }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
        {/* Sidebar mein ID ki jagah Naam dikhane ke liye: */}
        {/* lastMsg?.senderName || num */}
    </div>
  );
};

export default TelegramBotInbox;

