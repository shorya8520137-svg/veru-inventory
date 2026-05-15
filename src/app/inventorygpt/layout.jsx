'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Key, MessageSquare } from 'lucide-react';

export default function InventoryGPTLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="h-screen w-full flex flex-col bg-black">
      {/* Navigation Tabs */}
      <div className="bg-zinc-900 border-b border-zinc-700 px-6 py-3 flex gap-6">
        <Link 
          href="/inventorygpt" 
          className={`pb-3 px-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            pathname === '/inventorygpt' 
              ? 'text-white border-b-2 border-white' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <MessageSquare size={16} /> Chat
        </Link>
        <Link 
          href="/inventorygpt/tokens" 
          className={`pb-3 px-2 font-medium text-sm transition-colors flex items-center gap-2 ${
            pathname?.includes('/inventorygpt/tokens')
              ? 'text-white border-b-2 border-white' 
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Key size={16} /> API Tokens
        </Link>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
