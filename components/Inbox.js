import React, { useState, useEffect, useRef } from 'react';
// रास्ता ठीक किया: components से root तक जाने के लिए सिर्फ एक '../' चाहिए
import { db, auth } from '../firebase'; 
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Send, Search, MoreVertical, MessageSquare, Loader2, Check, ChevronLeft, Paperclip, FileText } from 'lucide-react';
import axios from 'axios';

const Inbox = () => {
  const [messages, setMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(allMsgs);
      const uniqueNumbers = [...new Set(allMsgs.map(m => m.senderNumber))].filter(Boolean);
      setRooms(uniqueNumbers);
    });
    return () => unsubscribe();
  }, [userId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedRoom) return;
    setLoading(true);
    try {
      // यह तुम्हारे backend api/send-message.js को कॉल करेगा
      await axios.post('/api/send-message', { userId, to: selectedRoom, text: inputText });
      setInputText('');
    } catch (err) { 
      alert("मैसेज भेजने में फेल! API चेक करें।");
    }
    setLoading(false);
  };

  // ... बाकी UI कोड वैसा ही रहेगा जैसा तुमने दिया है
  return (
    // तुम्हारा UI कोड यहाँ आएगा
    <div>Dashboard Code...</div>
  );
};

export default Inbox;
