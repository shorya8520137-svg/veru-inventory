'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Brain, ArrowRight } from 'lucide-react';

export default function ApiDocsLayout({ children }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Navigation Bar */}
      <nav style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px'
      }}>
        <Link 
          href="/api-docs"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
        >
          <BookOpen size={24} color="#60a5fa" />
          <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '16px' }}>API Documentation</span>
        </Link>
        
        <div style={{ flex: 1 }} />
        
        <Link 
          href="/api-docs/inventorygpt"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            textDecoration: 'none',
            background: pathname?.includes('/inventorygpt') 
              ? 'rgba(96, 165, 250, 0.2)' 
              : 'transparent',
            border: pathname?.includes('/inventorygpt')
              ? '1px solid rgba(96, 165, 250, 0.4)'
              : '1px solid transparent',
            color: pathname?.includes('/inventorygpt')
              ? '#60a5fa'
              : '#cbd5e1',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
        >
          <Brain size={18} />
          <span>InventoryGPT API</span>
        </Link>
      </nav>

      {/* Content */}
      {children}
    </div>
  );
}
