'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';

export default function InventoryGPTPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${apiBase}/api/products`),
          fetch(`${apiBase}/api/categories`)
        ]);
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products || []);
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventorygpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.content,
          products,
          categories,
          conversationHistory: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
        }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer, timestamp: new Date() }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.fallback || 'Error occurred.', timestamp: new Date(), error: true }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.', timestamp: new Date(), error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <h1 className="text-4xl font-semibold text-white text-center mb-12">InventoryGPT</h1>
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about your inventory..." className="w-full px-6 py-4 bg-zinc-800 text-white rounded-full border border-zinc-700 focus:outline-none focus:border-zinc-600 placeholder-zinc-500" />
                <button type="submit" disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-50 transition-all">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <React.Fragment>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              {messages.map((message, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-zinc-800">
                    {message.role === 'assistant' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${message.error ? 'text-red-400' : 'text-gray-300'}`}>{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-zinc-800">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="border-t border-zinc-800 bg-black">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." className="w-full px-6 py-4 bg-zinc-800 text-white rounded-full border border-zinc-700 focus:outline-none focus:border-zinc-600 placeholder-zinc-500" />
                  <button type="submit" disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-50 transition-all">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
// Build: 20260215163747
