$content = @'
'use client';

import { useState, useRef, useEffect } from 'react';
import { Brain, Send, Loader2, Bot, User } from 'lucide-react';

export default function InventoryGPTPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am InventoryGPT, your AI-powered inventory assistant. I can help you with product queries, stock information, recommendations, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
      const productsRes = await fetch(`${apiBase}/api/products`);
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
      const categoriesRes = await fetch(`${apiBase}/api/categories`);
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const conversationHistory = messages.slice(-5).map(msg => ({ role: msg.role, content: msg.content }));
      const response = await fetch('/api/inventorygpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content, products, categories, conversationHistory }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer, timestamp: new Date(), tokens: data.tokens }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.fallback || 'Sorry, I encountered an error.', timestamp: new Date(), error: true }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I am having trouble connecting right now.', timestamp: new Date(), error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">InventoryGPT</h1>
              <p className="text-sm text-gray-500">AI-Powered Product Assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="h-full overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white' : message.error ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-gray-100 text-gray-900'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  {message.tokens && <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-500">Tokens: {message.tokens.total}</div>}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 flex gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything about your inventory..." className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" disabled={isLoading} />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-gradient-to-br from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Show all products', 'What is in stock?', 'Low stock items', 'Product categories'].map((suggestion, index) => (
            <button key={index} onClick={() => setInput(suggestion)} className="bg-white px-4 py-2 rounded-full text-sm text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all" disabled={isLoading}>{suggestion}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
'@

$content | Out-File -FilePath "src\app\inventorygpt\page.jsx" -Encoding UTF8 -NoNewline
Write-Host "File created successfully!"
