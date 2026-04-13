'use client';

import { useState } from 'react';
import { Sparkles, Copy, Download, RefreshCw, Loader2 } from 'lucide-react';

export default function SEOContentGenerator() {
  const [formData, setFormData] = useState({
    keyword: '',
    niche: '',
    target_country: '',
    language: 'English',
    content_type: 'Blog'
  });

  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateContent = async () => {
    if (!formData.keyword || !formData.niche || !formData.target_country) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/seo-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: formData.keyword,
          niche: formData.niche,
          target_country: formData.target_country,
          language: formData.language,
          content_type: formData.content_type
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const content = data.output || data.content || data.message || JSON.stringify(data, null, 2);
      
      setGeneratedContent(content);
      setHistory(prev => [{
        id: Date.now(),
        keyword: formData.keyword,
        content: content.substring(0, 100) + '...',
        timestamp: new Date().toLocaleString()
      }, ...prev.slice(0, 4)]);
      
      showToast('Content generated successfully!');
    } catch (error) {
      showToast('Failed to generate content. Please try again.', 'error');
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRewriteContent = async () => {
    if (!generatedContent) {
      showToast('No content to rewrite', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/seo-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: formData.keyword,
          niche: formData.niche,
          target_country: formData.target_country,
          language: formData.language,
          content_type: formData.content_type,
          original_content: generatedContent,
          rewrite: true
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const content = data.output || data.content || data.message || JSON.stringify(data, null, 2);
      
      setGeneratedContent(content);
      showToast('Content rewritten successfully!');
    } catch (error) {
      showToast('Failed to rewrite content', 'error');
      console.error('Error rewriting content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    showToast('Content copied to clipboard!');
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-content-${formData.keyword}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Content downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">SEO Content Generator</h1>
          </div>
          <p className="text-gray-600 ml-16">Generate high-quality, SEO-optimized content powered by AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Content Parameters</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Keyword */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keyword <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="keyword"
                    value={formData.keyword}
                    onChange={handleInputChange}
                    placeholder="e.g., best running shoes"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Niche */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niche <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="niche"
                    value={formData.niche}
                    onChange={handleInputChange}
                    placeholder="e.g., fitness, technology"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Target Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="target_country"
                    value={formData.target_country}
                    onChange={handleInputChange}
                    placeholder="e.g., United States, India"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                </div>

                {/* Content Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="Blog">Blog Post</option>
                    <option value="Product Description">Product Description</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Meta Description">Meta Description</option>
                    <option value="Social Media">Social Media Post</option>
                    <option value="Email">Email Content</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerateContent}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Content
                    </>
                  )}
                </button>

                {generatedContent && (
                  <button
                    onClick={handleRewriteContent}
                    disabled={loading}
                    className="px-6 py-3 border-2 border-purple-500 text-purple-500 rounded-lg font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Rewrite
                  </button>
                )}
              </div>
            </div>

            {/* Generated Content */}
            {generatedContent && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Generated Content</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border border-gray-200">
                  <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                    {generatedContent}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Generations</h2>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No history yet</p>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setGeneratedContent(item.content)}
                    >
                      <div className="font-medium text-gray-800 mb-1 truncate">
                        {item.keyword}
                      </div>
                      <div className="text-xs text-gray-500">{item.timestamp}</div>
                      <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {item.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
