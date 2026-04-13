import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import styles from './DeleteConfirmationModal.module.css';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Delete Item", 
    message = "Are you sure you want to delete this item?",
    itemName = "",
    itemType = "item",
    details = null,
    isLoading = false,
    destructive = true
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.iconContainer}>
                        <div className={`${styles.iconWrapper} ${destructive ? styles.destructive : styles.warning}`}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <button 
                        className={styles.closeButton}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    <h3 className={styles.title}>{title}</h3>
                    
                    <div className={styles.message}>
                        <p>{message}</p>
                        {itemName && (
                            <div className={styles.itemInfo}>
                                <strong>"{itemName}"</strong>
                            </div>
                        )}
                    </div>

                    {details && (
                        <div className={styles.details}>
                            {Object.entries(details).map(([key, value]) => (
                                <div key={key} className={styles.detailRow}>
                                    <span className={styles.detailLabel}>{key}:</span>
                                    <span className={styles.detailValue}>{value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={styles.warning}>
                        <div className={styles.warningIcon}>
                            <AlertTriangle size={16} />
                        </div>
                        <div className={styles.warningText}>
                            <strong>This action cannot be undone.</strong>
                            <p>This will permanently delete the {itemType} and remove all associated data.</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button 
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button 
                        className={`${styles.confirmButton} ${destructive ? styles.destructive : styles.primary}`}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className={styles.spinner}></div>
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Delete {itemType}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;