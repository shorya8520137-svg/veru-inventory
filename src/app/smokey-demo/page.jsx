'use client';

import React, { useState } from 'react';
import SmokeyHeading from '@/components/SmokeyHeading';

export default function SmokeyDemoPage() {
    const [selectedSize, setSelectedSize] = useState('medium');
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [customText, setCustomText] = useState('Highball Glasses');

    const colorPresets = [
        { name: 'Black', value: '#000000' },
        { name: 'Blue', value: '#2563EB' },
        { name: 'Red', value: '#DC2626' },
        { name: 'Green', value: '#059669' },
        { name: 'Purple', value: '#7C3AED' },
        { name: 'Orange', value: '#EA580C' },
        { name: 'Pink', value: '#DB2777' },
        { name: 'Teal', value: '#0D9488' },
    ];

    return (
        <div style={{ 
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '20px 40px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                marginBottom: '40px'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                    🌫️ Smokey Heading Demo
                </h1>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                    Interactive demo of the smokey text effect component
                </p>
            </div>

            {/* Main Demo Area */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                padding: '40px 20px'
            }}>
                <SmokeyHeading size={selectedSize} color={selectedColor}>
                    {customText}
                </SmokeyHeading>
            </div>

            {/* Controls */}
            <div style={{
                maxWidth: '900px',
                margin: '0 auto',
                padding: '0 20px 60px'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '30px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ 
                        fontSize: '1.3rem', 
                        fontWeight: 700, 
                        marginBottom: '20px',
                        color: '#1a1a1a'
                    }}>
                        Customize Your Heading
                    </h2>

                    {/* Text Input */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            Text Content
                        </label>
                        <input
                            type="text"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder="Enter your text..."
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '1rem',
                                border: '2px solid #E5E7EB',
                                borderRadius: '10px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                        />
                    </div>

                    {/* Size Selection */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '12px'
                        }}>
                            Size
                        </label>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {['small', 'medium', 'large', 'xlarge'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        border: selectedSize === size ? 'none' : '2px solid #E5E7EB',
                                        background: selectedSize === size ? '#2563EB' : 'white',
                                        color: selectedSize === size ? 'white' : '#374151',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedSize !== size) {
                                            e.target.style.background = '#F3F4F6';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedSize !== size) {
                                            e.target.style.background = 'white';
                                        }
                                    }}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '12px'
                        }}>
                            Color
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                            {colorPresets.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => setSelectedColor(preset.value)}
                                    style={{
                                        padding: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        border: selectedColor === preset.value ? `3px solid ${preset.value}` : '2px solid #E5E7EB',
                                        background: 'white',
                                        color: preset.value,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: preset.value,
                                        border: '2px solid white',
                                        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                                    }}></div>
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                        
                        {/* Custom Color Picker */}
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                Custom:
                            </label>
                            <input
                                type="color"
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                style={{
                                    width: '50px',
                                    height: '40px',
                                    border: '2px solid #E5E7EB',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            />
                            <input
                                type="text"
                                value={selectedColor}
                                onChange={(e) => setSelectedColor(e.target.value)}
                                placeholder="#000000"
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    fontSize: '0.9rem',
                                    border: '2px solid #E5E7EB',
                                    borderRadius: '8px',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                    </div>

                    {/* Code Example */}
                    <div style={{
                        background: '#1F2937',
                        borderRadius: '10px',
                        padding: '20px',
                        marginTop: '30px'
                    }}>
                        <div style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: '#9CA3AF',
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Code Example
                        </div>
                        <pre style={{
                            margin: 0,
                            color: '#E5E7EB',
                            fontSize: '0.9rem',
                            fontFamily: 'monospace',
                            lineHeight: '1.6',
                            overflow: 'auto'
                        }}>
{`<SmokeyHeading 
    size="${selectedSize}" 
    color="${selectedColor}"
>
    ${customText}
</SmokeyHeading>`}
                        </pre>
                    </div>
                </div>

                {/* Examples Section */}
                <div style={{
                    marginTop: '40px',
                    background: 'white',
                    borderRadius: '16px',
                    padding: '30px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ 
                        fontSize: '1.3rem', 
                        fontWeight: 700, 
                        marginBottom: '20px',
                        color: '#1a1a1a'
                    }}>
                        Usage Examples
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                                1. Import the component
                            </h3>
                            <pre style={{
                                background: '#F3F4F6',
                                padding: '15px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                overflow: 'auto',
                                margin: 0
                            }}>
{`import SmokeyHeading from '@/components/SmokeyHeading';`}
                            </pre>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                                2. Use in your page
                            </h3>
                            <pre style={{
                                background: '#F3F4F6',
                                padding: '15px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                overflow: 'auto',
                                margin: 0,
                                lineHeight: '1.6'
                            }}>
{`<SmokeyHeading>Highball Glasses</SmokeyHeading>
<SmokeyHeading size="large" color="#2563EB">
    Premium Collection
</SmokeyHeading>`}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
