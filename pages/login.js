import { useState } from 'react';
import { auth } from '../firebase';
import { sendSignInLinkToEmail } from 'firebase/auth';
import { Mail, Send } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    const actionCodeSettings = {
      // Login के बाद यूजर कहाँ जाएगा
      url: window.location.origin + '/dashboard', 
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      // ईमेल को लोकल स्टोरेज में सेव करना ज़रूरी है ताकि लिंक क्लिक करने पर मैच हो सके
      window.localStorage.setItem('emailForSignIn', email);
      setSent(true);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-[#121212] border border-gray-800 rounded-3xl p-8">
        {!sent ? (
          <>
            <h1 className="text-3xl font-bold mb-4 text-center tracking-tighter">Magic Login 🪄</h1>
            <p className="text-gray-400 text-center mb-8 text-sm">अपना एडमिन ईमेल डालें, हम आपको एक सीक्रेट एंट्री लिंक भेजेंगे।</p>
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-gray-500" size={18} />
                <input 
                  type="email" 
                  placeholder="admin@basekey.ai" 
                  className="w-full bg-black border border-gray-800 rounded-xl px-12 py-4 focus:border-green-500 outline-none"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                Send Magic Link <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-2xl font-bold mb-2">Check your Email!</h2>
            <p className="text-gray-400">हमने <b>{email}</b> पर एक लॉगिन लिंक भेजा है। उस पर क्लिक करते ही आप डैशबोर्ड में पहुँच जाएंगे।</p>
          </div>
        )}
      </div>
    </div>
  );
}
