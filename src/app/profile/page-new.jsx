'use client';

import React, { useState, useEffect } from 'react';
import styles from './profile.module.css';

const ProfilePage = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        avatar: null,
        memberSince: ''
    });
    
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showSuccessCard, setShowSuccessCard] = useState(false);
    const [ticket, setTicket] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        category: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [tickets, setTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.giftgala.in';

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        if (activeTab === 'tickets') {
            fetchUserTickets();
        }
    }, [activeTab]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUser({
                        name: data.data.name || '',
                 