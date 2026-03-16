import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, MessageSquare, Loader2, Check, CheckCheck, Clock, ChevronLeft, Paperclip, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const WhatsAppInbox = ({ onBack }) => {
  const platform = 'whatsapp';
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();
  const fileInputRef = useRef();

  const currentUserId = auth.currentUser?.uid || localStorage.getItem('admin_email');

  useEffect(() => {
    if (!currentUserId) return;
    const q = query(collection(db, "users", currentUserId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredMsgs = allMsgs.filter(m => !m.platform || m.platform === 'whatsapp');
      setMessages(filteredMsgs);
      const uniqueNumbers = [...new Set(filteredMsgs.map(m => m.senderNumber))].filter(Boolean).reverse();
      setRooms(uniqueNumbers);
    });
    return () => unsubscribe();
  }, [currentUserId]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, selectedRoom]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    const textToSend = inputText;
    const cleanNumber = selectedRoom.replace(/\D/g, ''); 
    setInputText('');
    try {
      await axios.post('/api/send-message', { userId: currentUserId, to: cleanNumber, text: textToSend });
    } catch (err) { toast.error("WhatsApp message failed!"); }
  };

  return (
    // ... (UI Code with Green Theme)
    <div className="flex h-screen bg-white dark:bg-[#080808] overflow-hidden">
        {/* Sidebar aur Chat Area bilkul aapke purane code jaisa, 
            bas 'platform' ki jagah seedha WhatsApp values use hongi */}
    </div>
  );
};

export default WhatsAppInbox;

