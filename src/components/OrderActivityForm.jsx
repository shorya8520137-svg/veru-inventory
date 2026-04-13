"use client";

import React, { useState, useEffect } from 'react';
import styles from './OrderActivityForm.module.css';

const OrderActivityForm = ({ 
    isOpen, 
    onClose, 
    autoFillData = {}, // { awb, order_ref, customer_name, product_name, logistics }
    onSubmit 
}) => {
    const [formData, setFormData] = useState({
        // Auto-filled fields (read-only)
        awb: '',
        order_ref: '',
        customer_name: '',
        product_name: '',
        logistics: '',
        
        // User input fields
        warehouse: '',
        processed_by: '',
        status: 'Dispatch',
        remarks: ''
    });

    // Warehouse staff data
    const [warehouseStaff, setWarehouseStaff] = useState({});
    const [warehouses, setWarehouses] = useState([]);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [logistics, setLogistics] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Update form data when autoFillData changes
    useEffect(() => {
        console.log('OrderActivityForm - autoFillData received:', autoFillData);
        if (autoFillData && Object.keys(autoFillData).length > 0) {
            console.log('OrderActivityForm - Updating form data with:', autoFillData);
            setFormData(prev => ({
                ...prev,
                awb: autoFillData.awb || '',
                order_ref: autoFillData.order_ref || '',
                customer_name: autoFillData.customer_name || autoFillData.customer || '',
                product_name: autoFillData.product_name || '',
                logistics: autoFillData.logistics || ''
            }));
        }
    }, [autoFillData]);

    // Fetch warehouse staff data when component opens
    useEffect(() => {
        if (isOpen) {
            fetchWarehouseStaff();
            fetchLogistics();
        }
    }, [isOpen]);

    // Update available staff when warehouse changes
    useEffect(() => {
        if (formData.warehouse && warehouseStaff[formData.warehouse]) {
            setAvailableStaff(warehouseStaff[formData.warehouse]);
            // Reset processed_by when warehouse changes
            setFormData(prev => ({ ...prev, processed_by: '' }));
        } else {
            setAvailableStaff([]);
        }
    }, [formData.warehouse, warehouseStaff]);

    const fetchWarehouseStaff = async () => {
        try {
            setLoadingStaff(true);
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-order-activity/warehouse-staff`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch warehouse staff');
            }

            const data = await response.json();
            console.log('Warehouse staff data:', data);
            
            setWarehouseStaff(data.data || {});
            setWarehouses(data.warehouses || []);
            
            // Auto-select first warehouse
            if (data.warehouses && data.warehouses.length > 0 && !formData.warehouse) {
                const firstWarehouse = data.warehouses[0];
                setFormData(prev => ({ ...prev, warehouse: firstWarehouse }));
            }
        } catch (error) {
            console.error('Error fetching warehouse staff:', error);
            // Set fallback data
            const fallbackData = {
                'MUM_WH': ['Abhishek', 'Aniket', 'Rashid'],
                'BLR_WH': ['Mandhata', 'Rajbhar'],
                'GGM_WH': ['Pankaj Rajput', 'Pankaj Rawat', 'Nagdeo Pandey'],
                'AMD_WH': ['Rushant', 'Vikas'],
                'HYD_WH': ['Divya', 'Robin']
            };
            setWarehouseStaff(fallbackData);
            setWarehouses(Object.keys(fallbackData));
            
            // Auto-select first warehouse from fallback
            if (!formData.warehouse) {
                setFormData(prev => ({ ...prev, warehouse: 'MUM_WH' }));
            }
        } finally {
            setLoadingStaff(false);
        }
    };

    const fetchLogistics = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/warehouse-order-activity/logistics`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Logistics data:', data);
                setLogistics(data.data || []);
                
                // Auto-select first logistics option
                if (data.data && data.data.length > 0 && !formData.logistics) {
                    setFormData(prev => ({ ...prev, logistics: data.data[0].name }));
                }
            } else {
                // Fallback logistics data
                const fallbackLogistics = [
                    { id: 1, name: 'Delhivery' },
                    { id: 2, name: 'Blue Dart' },
                    { id: 3, name: 'Ecom Express' },
                    { id: 4, name: 'DTDC' }
                ];
                setLogistics(fallbackLogistics);
                
                // Auto-select first logistics from fallback
                if (!formData.logistics) {
                    setFormData(prev => ({ ...prev, logistics: 'Delhivery' }));
                }
            }
        } catch (error) {
            console.error('Error fetching logistics:', error);
            // Fallback logistics data
            const fallbackLogistics = [
                { id: 1, name: 'Delhivery' },
                { id: 2, name: 'Blue Dart' },
                { id: 3, name: 'Ecom Express' },
                { id: 4, name: 'DTDC' }
            ];
            setLogistics(fallbackLogistics);
            
            // Auto-select first logistics from fallback
            if (!formData.logistics) {
                setFormData(prev => ({ ...prev, logistics: 'Delhivery' }));
            }
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.warehouse) {
            newErrors.warehouse = 'Warehouse is required';
        }

        if (!formData.processed_by) {
            newErrors.processed_by = 'Processed by is required';
        }

        if (!formData.remarks.trim()) {
            newErrors.remarks = 'Remarks are required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Send updated JSON data (no phone number, includes warehouse and processed_by)
            const submitData = {
                awb: formData.awb,
                order_ref: formData.order_ref,
                customer_name: formData.customer_name,
                product_name: formData.product_name,
                logistics: formData.logistics,
                warehouse: formData.warehouse,
                processed_by: formData.processed_by,
                status: formData.status,
                remarks: formData.remarks
            };

            await onSubmit(submitData);
            
            // Reset form on success
            setFormData({
                awb: autoFillData.awb || '',
                order_ref: autoFillData.order_ref || '',
                customer_name: autoFillData.customer_name || autoFillData.customer || '',
                product_name: autoFillData.product_name || '',
                logistics: autoFillData.logistics || '',
                warehouse: '',
                processed_by: '',
                status: 'Dispatch',
                remarks: ''
            });
            onClose();
            
        } catch (error) {
            console.error('Submit error:', error);
            setErrors({ submit: 'Failed to submit order activity. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>Order Activity Form</h2>
                    <button 
                        className={styles.closeBtn}
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Auto-filled Fields (Read-only) */}
                    <div className={styles.section}>
                        <h3>Order Information (Auto-filled)</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>AWB Number</label>
                                <input
                                    type="text"
                                    value={formData.awb}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Order Reference</label>
                                <input
                                    type="text"
                                    value={formData.order_ref}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Customer Name</label>
                                <input
                                    type="text"
                                    value={formData.customer_name}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    value={formData.product_name}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Logistics</label>
                                <select
                                    name="logistics"
                                    value={formData.logistics}
                                    onChange={handleInputChange}
                                    className={styles.select}
                                >
                                    <option value="">Select Logistics</option>
                                    {logistics.map(logistic => (
                                        <option key={logistic.id} value={logistic.name}>
                                            {logistic.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* User Input Fields */}
                    <div className={styles.section}>
                        <h3>Warehouse & Processing Information</h3>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Warehouse *</label>
                                <select
                                    name="warehouse"
                                    value={formData.warehouse}
                                    onChange={handleInputChange}
                                    className={errors.warehouse ? styles.errorInput : styles.select}
                                    disabled={loadingStaff}
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map(warehouse => (
                                        <option key={warehouse} value={warehouse}>
                                            {warehouse.replace('_WH', ' Warehouse')}
                                        </option>
                                    ))}
                                </select>
                                {errors.warehouse && (
                                    <span className={styles.error}>{errors.warehouse}</span>
                                )}
                            </div>
                            <div className={styles.field}>
                                <label>Processed By *</label>
                                <select
                                    name="processed_by"
                                    value={formData.processed_by}
                                    onChange={handleInputChange}
                                    className={errors.processed_by ? styles.errorInput : styles.select}
                                    disabled={!formData.warehouse || availableStaff.length === 0}
                                >
                                    <option value="">
                                        {!formData.warehouse ? 'Select warehouse first' : 'Select staff member'}
                                    </option>
                                    {availableStaff.map(staff => (
                                        <option key={staff} value={staff}>
                                            {staff}
                                        </option>
                                    ))}
                                </select>
                                {errors.processed_by && (
                                    <span className={styles.error}>{errors.processed_by}</span>
                                )}
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Status *</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className={styles.select}
                                >
                                    <option value="Dispatch">Dispatch</option>
                                    <option value="Cancel">Cancel</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>Remarks *</label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleInputChange}
                                placeholder="Enter remarks about this order activity..."
                                rows={4}
                                className={errors.remarks ? styles.errorInput : ''}
                            />
                            {errors.remarks && (
                                <span className={styles.error}>{errors.remarks}</span>
                            )}
                        </div>
                    </div>

                    {errors.submit && (
                        <div className={styles.submitError}>
                            {errors.submit}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            className={styles.cancelBtn}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isSubmitting || loadingStaff}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Order Activity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OrderActivityForm;