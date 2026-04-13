"use client";

import { useState, useRef, useEffect } from 'react';
import styles from './ReelSection.module.css';

const ReelSection = () => {
    const [currentReel, setCurrentReel] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true); // Auto-play enabled
    const videoRefs = useRef([]);

    // Updated reel data with your Cloudinary URLs
    const reels = [
        {
            id: 1,
            type: 'video',
            url: 'https://res.cloudinary.com/df3l7ppo6/video/upload/v1772738571/grok-video-9d40dccf-28f5-430b-8f60-60e736a7540e_klfes8.mp4',
            title: 'Product Showcase 1',
            description: 'Discover our latest products'
        },
        {
            id: 2,
            type: 'video',
            url: 'https://res.cloudinary.com/df3l7ppo6/video/upload/v1772738596/grok-video-8dd11ee1-686b-4ed8-8571-0c656e76f43b_uveryf.mp4',
            title: 'Product Showcase 2',
            description: 'Explore our premium collection'
        },
        {
            id: 3,
            type: 'video',
            url: 'https://res.cloudinary.com/df3l7ppo6/video/upload/v1772739297/grok-video-f2e6be2f-b4bb-45d8-b227-f2354208e721_nqajtq.mp4',
            title: 'Product Showcase 3',
            description: 'See our products in action'
        },
        {
            id: 4,
            type: 'video',
            url: 'https://res.cloudinary.com/df3l7ppo6/video/upload/v1772741133/grok-video-ce0a2fb4-b05d-41da-8df6-7f489a377250_o8s7rs.mp4',
            title: 'Featured Product',
            description: 'Check out our featured item'
        }
    ];

    const handleNext = () => {
        setCurrentReel((prev) => (prev + 1) % reels.length);
    };

    const handlePrev = () => {
        setCurrentReel((prev) => (prev - 1 + reels.length) % reels.length);
    };

    const togglePlay = () => {
        const currentVideo = videoRefs.current[currentReel];
        if (currentVideo && reels[currentReel].type === 'video') {
            if (isPlaying) {
                currentVideo.pause();
            } else {
                currentVideo.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Auto-play current video when reel changes
    useEffect(() => {
        // Pause all videos first
        videoRefs.current.forEach((video, index) => {
            if (video && index !== currentReel) {
                video.pause();
            }
        });

        // Auto-play current video if it's a video type
        const currentVideo = videoRefs.current[currentReel];
        if (currentVideo && reels[currentReel].type === 'video') {
            currentVideo.play().catch(console.error);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    }, [currentReel, reels]);

    // Auto-advance to next reel when video ends (for looping through all reels)
    const handleVideoEnd = () => {
        // Auto-advance to next reel after current video ends
        setTimeout(() => {
            handleNext();
        }, 500); // Small delay before switching
    };

    // Auto-advance for images (show for 5 seconds) - REMOVED since all are videos now

    return (
        <div className={styles.reelSection}>
            <div className={styles.container}>
                <h2 className={styles.title}>Our Latest Reels</h2>
                
                <div className={styles.reelContainer}>
                    <div className={styles.reelWrapper}>
                        {reels.map((reel, index) => (
                            <div
                                key={reel.id}
                                className={`${styles.reel} ${index === currentReel ? styles.active : ''}`}
                            >
                                {reel.type === 'video' ? (
                                    <video
                                        ref={(el) => (videoRefs.current[index] = el)}
                                        className={styles.media}
                                        src={reel.url}
                                        loop
                                        muted
                                        playsInline
                                        preload="metadata"
                                        autoPlay={index === currentReel}
                                        onEnded={handleVideoEnd}
                                    />
                                ) : (
                                    <img
                                        className={styles.media}
                                        src={reel.url}
                                        alt={reel.title}
                                    />
                                )}
                                
                                <div className={styles.overlay}>
                                    <div className={styles.content}>
                                        <h3 className={styles.reelTitle}>{reel.title}</h3>
                                        <p className={styles.reelDescription}>{reel.description}</p>
                                    </div>
                                    
                                    {reel.type === 'video' && (
                                        <button
                                            className={styles.playButton}
                                            onClick={togglePlay}
                                        >
                                            {isPlaying ? '⏸️' : '▶️'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Navigation */}
                    <button className={styles.navButton + ' ' + styles.prevButton} onClick={handlePrev}>
                        ‹
                    </button>
                    <button className={styles.navButton + ' ' + styles.nextButton} onClick={handleNext}>
                        ›
                    </button>
                    
                    {/* Dots indicator */}
                    <div className={styles.dots}>
                        {reels.map((_, index) => (
                            <button
                                key={index}
                                className={`${styles.dot} ${index === currentReel ? styles.activeDot : ''}`}
                                onClick={() => setCurrentReel(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReelSection;