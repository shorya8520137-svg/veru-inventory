'use client';

import Link from 'next/link';
import { BookOpen, Brain, ShoppingCart, FileText, ArrowRight } from 'lucide-react';

export default function ApiDocsHome() {
  const sections = [
    {
      icon: Brain,
      title: 'InventoryGPT API',
      description: 'AI-powered inventory intelligence data feeds and recommendations',
      href: '/api-docs/inventorygpt',
      color: '#a78bfa',
      highlights: [
        'Real-time inventory state',
        'Warehouse performance metrics',
        'Regional demand analytics',
        'AI recommendations'
      ]
    },
    {
      icon: ShoppingCart,
      title: 'Storefront API',
      description: 'Build integrations with Insora commerce storefront and order management',
      href: '/api-docs/storefront',
      color: '#60a5fa',
      highlights: [
        'Product catalog',
        'Order management',
        'Customer auth',
        'Payments'
      ],
      comingSoon: true
    }
  ];

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '80px 40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            color: '#f1f5f9',
            margin: '0 0 16px 0',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            insora.in API Documentation
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#cbd5e1',
            margin: '0',
            lineHeight: '1.6'
          }}>
            Complete API references and integration guides for Insora services
          </p>
        </div>

        {/* API Sections Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          marginBottom: '80px'
        }}>
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '16px',
                  padding: '32px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  opacity: section.comingSoon ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!section.comingSoon) {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                    e.currentTarget.style.borderColor = `rgba(${section.color === '#a78bfa' ? '167, 139, 250' : '96, 165, 250'}, 0.5)`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {section.comingSoon && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(107, 114, 128, 0.3)',
                    color: '#9ca3af',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Coming Soon
                  </div>
                )}

                <Icon size={32} style={{ color: section.color, marginBottom: '16px' }} />

                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#f1f5f9',
                  margin: '0 0 8px 0'
                }}>
                  {section.title}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#cbd5e1',
                  margin: '0 0 20px 0',
                  lineHeight: '1.6'
                }}>
                  {section.description}
                </p>

                <div style={{ marginBottom: '20px' }}>
                  {section.highlights.map((highlight, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: '13px',
                        color: '#cbd5e1',
                        margin: '8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: section.color
                      }} />
                      {highlight}
                    </div>
                  ))}
                </div>

                {section.comingSoon ? (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'rgba(107, 114, 128, 0.1)',
                      border: '1px solid rgba(107, 114, 128, 0.2)',
                      color: '#9ca3af',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'not-allowed',
                      opacity: 0.6
                    }}
                  >
                    Coming Soon
                  </button>
                ) : (
                  <Link
                    href={section.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      background: `linear-gradient(135deg, ${section.color === '#a78bfa' ? 'rgba(167, 139, 250' : 'rgba(96, 165, 250'}, 0.2), ${section.color === '#a78bfa' ? 'rgba(167, 139, 250' : 'rgba(96, 165, 250'}, 0.1))`,
                      border: `1px solid ${section.color === '#a78bfa' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(96, 165, 250, 0.3)'}`,
                      color: section.color,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    View Documentation
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div style={{
          background: 'rgba(96, 165, 250, 0.1)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#f1f5f9',
            margin: '0 0 16px 0'
          }}>
            Need Help?
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#cbd5e1',
            margin: '0 0 20px 0'
          }}>
            Check our documentation or contact support@insora.in
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a
              href="https://insora.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 20px',
                background: 'rgba(60, 165, 250, 0.2)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                color: '#60a5fa',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              Visit insora.in
            </a>
            <a
              href="mailto:support@insora.in"
              style={{
                padding: '10px 20px',
                background: 'rgba(60, 165, 250, 0.2)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                color: '#60a5fa',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
