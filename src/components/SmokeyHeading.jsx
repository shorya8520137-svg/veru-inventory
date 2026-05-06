'use client';

import React from 'react';

/**
 * SmokeyHeading Component
 * Creates a heading with smokey/cloudy animated effect
 * 
 * Usage:
 * <SmokeyHeading>Your Text Here</SmokeyHeading>
 * <SmokeyHeading size="large">Large Text</SmokeyHeading>
 * <SmokeyHeading color="#FF6B6B">Colored Text</SmokeyHeading>
 */
const SmokeyHeading = ({ 
    children, 
    size = 'medium', 
    color = '#000000',
    className = '' 
}) => {
    const sizeStyles = {
        small: { fontSize: '2rem', letterSpacing: '0.05em' },
        medium: { fontSize: '4rem', letterSpacing: '0.08em' },
        large: { fontSize: '6rem', letterSpacing: '0.1em' },
        xlarge: { fontSize: '8rem', letterSpacing: '0.12em' }
    };

    const selectedSize = sizeStyles[size] || sizeStyles.medium;

    return (
        <>
            <style jsx>{`
                @keyframes smoke {
                    0% {
                        filter: blur(0px) opacity(1);
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        filter: blur(3px) opacity(0.8);
                        transform: translateY(-2px) scale(1.02);
                    }
                    100% {
                        filter: blur(0px) opacity(1);
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes cloudFloat {
                    0%, 100% {
                        transform: translateX(0) translateY(0);
                    }
                    25% {
                        transform: translateX(10px) translateY(-5px);
                    }
                    50% {
                        transform: translateX(-5px) translateY(5px);
                    }
                    75% {
                        transform: translateX(5px) translateY(-3px);
                    }
                }

                @keyframes fadeInOut {
                    0%, 100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }

                .smokey-heading-container {
                    position: relative;
                    display: inline-block;
                    padding: 20px 40px;
                }

                .smokey-text {
                    position: relative;
                    font-weight: 900;
                    color: ${color};
                    text-transform: uppercase;
                    z-index: 2;
                    animation: smoke 4s ease-in-out infinite;
                    text-shadow: 
                        0 0 10px rgba(255, 255, 255, 0.5),
                        0 0 20px rgba(255, 255, 255, 0.3),
                        0 0 30px rgba(255, 255, 255, 0.2),
                        2px 2px 4px rgba(0, 0, 0, 0.1);
                }

                .cloud-effect {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(
                        circle at center,
                        rgba(200, 200, 200, 0.4) 0%,
                        rgba(220, 220, 220, 0.2) 40%,
                        transparent 70%
                    );
                    filter: blur(20px);
                    z-index: 1;
                    animation: cloudFloat 8s ease-in-out infinite, fadeInOut 6s ease-in-out infinite;
                }

                .cloud-1 {
                    width: 200px;
                    height: 200px;
                    top: -50px;
                    left: -30px;
                    animation-delay: 0s;
                }

                .cloud-2 {
                    width: 250px;
                    height: 250px;
                    top: -60px;
                    right: -40px;
                    animation-delay: 2s;
                }

                .cloud-3 {
                    width: 180px;
                    height: 180px;
                    bottom: -40px;
                    left: 50%;
                    transform: translateX(-50%);
                    animation-delay: 4s;
                }

                .cloud-4 {
                    width: 150px;
                    height: 150px;
                    top: 50%;
                    left: -20px;
                    transform: translateY(-50%);
                    animation-delay: 1s;
                }

                .cloud-5 {
                    width: 170px;
                    height: 170px;
                    top: 50%;
                    right: -30px;
                    transform: translateY(-50%);
                    animation-delay: 3s;
                }

                /* Smoke particles */
                .smoke-particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.6);
                    border-radius: 50%;
                    filter: blur(2px);
                    animation: smokeRise 5s ease-in-out infinite;
                }

                @keyframes smokeRise {
                    0% {
                        transform: translateY(0) scale(1);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.8;
                    }
                    90% {
                        opacity: 0.3;
                    }
                    100% {
                        transform: translateY(-100px) scale(2);
                        opacity: 0;
                    }
                }

                .smoke-particle:nth-child(1) { left: 20%; animation-delay: 0s; }
                .smoke-particle:nth-child(2) { left: 40%; animation-delay: 1s; }
                .smoke-particle:nth-child(3) { left: 60%; animation-delay: 2s; }
                .smoke-particle:nth-child(4) { left: 80%; animation-delay: 3s; }
                .smoke-particle:nth-child(5) { left: 30%; animation-delay: 1.5s; }
                .smoke-particle:nth-child(6) { left: 70%; animation-delay: 2.5s; }
            `}</style>

            <div className={`smokey-heading-container ${className}`}>
                {/* Cloud effects */}
                <div className="cloud-effect cloud-1"></div>
                <div className="cloud-effect cloud-2"></div>
                <div className="cloud-effect cloud-3"></div>
                <div className="cloud-effect cloud-4"></div>
                <div className="cloud-effect cloud-5"></div>

                {/* Smoke particles */}
                <div className="smoke-particle" style={{ bottom: '10%' }}></div>
                <div className="smoke-particle" style={{ bottom: '15%' }}></div>
                <div className="smoke-particle" style={{ bottom: '20%' }}></div>
                <div className="smoke-particle" style={{ bottom: '12%' }}></div>
                <div className="smoke-particle" style={{ bottom: '18%' }}></div>
                <div className="smoke-particle" style={{ bottom: '25%' }}></div>

                {/* Main text */}
                <h1 
                    className="smokey-text" 
                    style={selectedSize}
                >
                    {children}
                </h1>
            </div>
        </>
    );
};

export default SmokeyHeading;
