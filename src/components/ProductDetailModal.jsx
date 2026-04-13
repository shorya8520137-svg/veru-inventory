"use client";

import React, { useState } from 'react';
import styles from './ProductDetailModal.module.css';

const ProductDetailModal = ({ product, onClose }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    if (!product) return null;

    // Parse additional images safely
    let additionalImages = [];
    if (product.additional_images) {
        try {
            if (typeof product.additional_images === 'string') {
                const parsed = JSON.parse(product.additional_images);
                additionalImages = Array.isArray(parsed) ? parsed : [parsed];
            } else if (Array.isArray(product.additional_images)) {
                additionalImages = product.additional_images;
            }
        } catch (e) {
            console.error('Error parsing additional images:', e);
            if (typeof product.additional_images === 'string' && product.additional_images.trim()) {
                additionalImages = [product.additional_images];
            }
        }
    }

    // Combine all images and filter out empty ones
    const allImages = [product.image_url, ...additionalImages]
        .filter(img => img && typeof img === 'string' && img.trim())
        .map(img => img.trim());

    console.log('Product additional_images:', product.additional_images);
    console.log('All images:', allImages);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className={styles.closeButton} onClick={onClose}>
                    ✕
                </button>

                <div className={styles.container}>
                    {/* Image Section */}
                    <div className={styles.imageSection}>
                        {/* Main Image */}
                        <div className={styles.mainImageContainer}>
                            {allImages.length > 0 && allImages[selectedImageIndex] ? (
                                <img 
                                    src={allImages[selectedImageIndex]} 
                                    alt={product.product_name}
                                    className={styles.mainImage}
                                />
                            ) : (
                                <div className={styles.noImage}>No Image Available</div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {allImages.length > 1 && (
                            <div className={styles.additionalImagesContainer}>
                                <p className={styles.additionalImagesLabel}>All Images ({allImages.length}):</p>
                                <div className={styles.additionalImagesList}>
                                    {allImages.map((image, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.additionalImageItem} ${index === selectedImageIndex ? styles.activeImage : ''}`}
                                            onClick={() => setSelectedImageIndex(index)}
                                            title={`Image ${index + 1}`}
                                        >
                                            <img 
                                                src={image} 
                                                alt={`${product.product_name} - ${index + 1}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className={styles.detailsSection}>
                        <h2 className={styles.productName}>{product.product_name}</h2>

                        {/* Featured Badge */}
                        {product.is_featured && (
                            <span className={styles.featuredBadge}>⭐ Featured Product</span>
                        )}

                        {/* Category */}
                        {product.category_name && (
                            <p className={styles.category}>
                                <strong>Category:</strong> {product.category_name}
                            </p>
                        )}

                        {/* SKU */}
                        {product.sku && (
                            <p className={styles.sku}>
                                <strong>SKU:</strong> {product.sku}
                            </p>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div className={styles.description}>
                                <strong>Description:</strong>
                                <p>{product.description}</p>
                            </div>
                        )}

                        {/* Key Features */}
                        {product.key_features && (() => {
                            try {
                                const features = typeof product.key_features === 'string' 
                                    ? JSON.parse(product.key_features) 
                                    : product.key_features;
                                
                                if (Array.isArray(features) && features.length > 0) {
                                    return (
                                        <div className={styles.keyFeatures}>
                                            <strong>Key Features:</strong>
                                            <ul className={styles.featuresList}>
                                                {features.map((feature, index) => (
                                                    <li key={index}>{feature}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                }
                            } catch (e) {
                                console.error('Error parsing key features:', e);
                            }
                            return null;
                        })()}

                        {/* Short Description */}
                        {product.short_description && (
                            <p className={styles.shortDescription}>
                                <strong>Short Description:</strong> {product.short_description}
                            </p>
                        )}

                        {/* Pricing */}
                        <div className={styles.pricingSection}>
                            <div className={styles.priceRow}>
                                <span className={styles.priceLabel}>Price:</span>
                                <span className={styles.price}>₹{product.price}</span>
                            </div>

                            {product.offer_price && (
                                <div className={styles.priceRow}>
                                    <span className={styles.priceLabel}>Offer Price:</span>
                                    <span className={styles.offerPrice}>₹{product.offer_price}</span>
                                    {product.discount_percentage && (
                                        <span className={styles.discount}>
                                            {product.discount_percentage}% OFF
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stock Information */}
                        <div className={styles.stockSection}>
                            <p>
                                <strong>Stock Quantity:</strong>{' '}
                                <span className={
                                    product.stock_quantity <= product.min_stock_level
                                        ? styles.lowStock
                                        : styles.normalStock
                                }>
                                    {product.stock_quantity} units
                                </span>
                            </p>
                            <p>
                                <strong>Min Stock Level:</strong> {product.min_stock_level}
                            </p>
                        </div>

                        {/* Specifications */}
                        {(product.weight || product.dimensions) && (
                            <div className={styles.specifications}>
                                {product.weight && (
                                    <p><strong>Weight:</strong> {product.weight}</p>
                                )}
                                {product.dimensions && (
                                    <p><strong>Dimensions:</strong> {product.dimensions}</p>
                                )}
                            </div>
                        )}

                        {/* Status */}
                        <div className={styles.statusSection}>
                            <span className={
                                product.is_active 
                                    ? styles.activeStatus 
                                    : styles.inactiveStatus
                            }>
                                {product.is_active ? '✓ Active' : '✗ Inactive'}
                            </span>
                        </div>

                        {/* Meta Information */}
                        {(product.meta_title || product.meta_description) && (
                            <div className={styles.metaSection}>
                                {product.meta_title && (
                                    <p><strong>Meta Title:</strong> {product.meta_title}</p>
                                )}
                                {product.meta_description && (
                                    <p><strong>Meta Description:</strong> {product.meta_description}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;