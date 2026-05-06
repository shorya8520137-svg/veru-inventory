# Smokey Heading Component - Usage Guide

## Overview
A beautiful animated heading component with smokey and cloudy effects. Perfect for hero sections, product titles, and eye-catching headings.

## Features
✨ **Animated smoke effect** - Subtle breathing animation
☁️ **Floating clouds** - Multiple cloud layers with independent animations
💨 **Rising smoke particles** - Realistic smoke particles rising from bottom
🎨 **Customizable** - Size, color, and styling options
📱 **Responsive** - Works on all screen sizes

## Installation
The component is already created at:
```
veru-inventory-main/src/components/SmokeyHeading.jsx
```

## Basic Usage

### 1. Import the component
```jsx
import SmokeyHeading from '@/components/SmokeyHeading';
```

### 2. Use in your page
```jsx
export default function MyPage() {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f5f5f5'
        }}>
            <SmokeyHeading>Highball Glasses</SmokeyHeading>
        </div>
    );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | string/node | required | The text to display |
| `size` | string | 'medium' | Size: 'small', 'medium', 'large', 'xlarge' |
| `color` | string | '#000000' | Text color (hex, rgb, or color name) |
| `className` | string | '' | Additional CSS classes |

## Examples

### Different Sizes
```jsx
<SmokeyHeading size="small">Small Text</SmokeyHeading>
<SmokeyHeading size="medium">Medium Text</SmokeyHeading>
<SmokeyHeading size="large">Large Text</SmokeyHeading>
<SmokeyHeading size="xlarge">Extra Large</SmokeyHeading>
```

### Different Colors
```jsx
<SmokeyHeading color="#2563EB">Blue Heading</SmokeyHeading>
<SmokeyHeading color="#DC2626">Red Heading</SmokeyHeading>
<SmokeyHeading color="#059669">Green Heading</SmokeyHeading>
<SmokeyHeading color="#7C3AED">Purple Heading</SmokeyHeading>
```

### With Custom Background
```jsx
<div style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}}>
    <SmokeyHeading color="#ffffff">
        Highball Glasses
    </SmokeyHeading>
</div>
```

### Product Page Example
```jsx
'use client';

import SmokeyHeading from '@/components/SmokeyHeading';

export default function ProductPage() {
    return (
        <div style={{ background: '#fafafa' }}>
            {/* Hero Section */}
            <section style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px'
            }}>
                <SmokeyHeading size="large" color="#1a1a1a">
                    Highball Glasses
                </SmokeyHeading>
                <p style={{
                    fontSize: '1.2rem',
                    color: '#666',
                    marginTop: '20px',
                    textAlign: 'center',
                    maxWidth: '600px'
                }}>
                    Premium glassware for your perfect cocktail experience
                </p>
            </section>

            {/* Rest of your content */}
            <section style={{ padding: '40px 20px' }}>
                {/* Product grid, details, etc. */}
            </section>
        </div>
    );
}
```

### E-commerce Homepage
```jsx
import SmokeyHeading from '@/components/SmokeyHeading';

export default function HomePage() {
    return (
        <div>
            {/* Hero Banner */}
            <div style={{
                background: 'linear-gradient(to bottom, #ffffff, #f0f0f0)',
                padding: '80px 20px',
                textAlign: 'center'
            }}>
                <SmokeyHeading size="xlarge" color="#000">
                    Highball Glasses
                </SmokeyHeading>
                <p style={{ fontSize: '1.5rem', marginTop: '20px', color: '#555' }}>
                    Elevate Your Drinking Experience
                </p>
                <button style={{
                    marginTop: '30px',
                    padding: '15px 40px',
                    fontSize: '1.1rem',
                    background: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                }}>
                    Shop Now
                </button>
            </div>
        </div>
    );
}
```

## Animation Details

### Smoke Effect
- Subtle breathing animation (4s cycle)
- Slight blur and scale changes
- Creates a misty, ethereal look

### Cloud Layers
- 5 independent cloud layers
- Each floats at different speeds
- Fade in/out for depth effect
- Positioned around the text

### Smoke Particles
- 6 rising particles
- Staggered animation delays
- Rise from bottom to top
- Fade out as they rise

## Customization Tips

### Change Animation Speed
Modify the animation durations in the component:
```jsx
animation: smoke 4s ease-in-out infinite;  // Change 4s to your preference
animation: cloudFloat 8s ease-in-out infinite;  // Change 8s
```

### Adjust Cloud Intensity
Modify the cloud background opacity:
```jsx
background: radial-gradient(
    circle at center,
    rgba(200, 200, 200, 0.4) 0%,  // Increase 0.4 for more visible clouds
    rgba(220, 220, 220, 0.2) 40%,
    transparent 70%
);
```

### More/Less Smoke Particles
Add or remove smoke particle divs in the component.

## Browser Compatibility
✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile browsers

## Performance
- Uses CSS animations (GPU accelerated)
- Minimal JavaScript
- Lightweight component
- No external dependencies

## Tips for Best Results

1. **Background**: Works best on light or gradient backgrounds
2. **Spacing**: Give it plenty of padding/margin
3. **Contrast**: Ensure text color contrasts with background
4. **Mobile**: Test on mobile - consider smaller size for mobile views
5. **Loading**: Component is client-side, use 'use client' directive

## Responsive Example
```jsx
<div style={{
    padding: '20px'
}}>
    <style jsx>{`
        @media (max-width: 768px) {
            .responsive-heading {
                font-size: 2rem !important;
            }
        }
    `}</style>
    
    <SmokeyHeading className="responsive-heading">
        Highball Glasses
    </SmokeyHeading>
</div>
```

## Need Help?
- The component is fully self-contained
- All animations are CSS-based
- No external dependencies required
- Works with Next.js 13+ App Router
