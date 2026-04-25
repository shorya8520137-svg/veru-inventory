"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import "react-chat-elements/dist/main.css";

import {
    SidebarProvider,
    Sidebar,
    InventoryMenu,
} from "@/components/ui/sidebar";

import TopNavBar from "@/components/TopNavBar";
import { useAuth } from "@/contexts/AuthContext";
import SemiDial from "@/app/inventory/selftransfer/SemiDial";
import TransferForm from "@/app/products/TransferForm";
import DispatchForm from "@/app/order/dispatch/DispatchForm";
import DamageRecoveryModal from "@/app/inventory/selftransfer/DamageRecoveryModal";
import ReturnModal from "@/app/inventory/selftransfer/ReturnModal";
import InventoryEntry from "@/app/inventory/selftransfer/InventoryEntry";
import ProductUpload from "@/app/products/ProductUpload";

export default function ClientLayout({ children }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    
    // State hooks must be at the top, before any conditional returns
    const [openFIFO, setOpenFIFO] = useState(false);
    const [operationsOpen, setOperationsOpen] = useState(false);
    const [operationTab, setOperationTab] = useState("dispatch");
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showProductUpload, setShowProductUpload] = useState(false);

    // Expose bulk upload function globally for navbar access - MUST be at top level
    useEffect(() => {
        window.openBulkUpload = () => setShowBulkUpload(true);
        window.openProductUpload = () => setShowProductUpload(true);
        return () => {
            delete window.openBulkUpload;
            delete window.openProductUpload;
        };
    }, []);

    // Don't show sidebar on login pages - render directly without complex logic
    const isLoginPage = pathname === "/login" || pathname === "/simple-login" || pathname === "/login-isolated";

    // Redirect to login if not authenticated (only after loading is complete)
    useEffect(() => {
        if (!isLoginPage && !loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router, isLoginPage]);

    // For login pages, render directly without any authentication checks
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Wait for loading to complete before any redirects for other pages
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    function handleCommand(cmd) {
        if (cmd === "TRANSFER_SELF") setOpenFIFO(true);
        if (cmd === "INVENTORY_ENTRY") {
            setOperationTab("bulk");
            setOperationsOpen(true);
        }
        if (cmd === "DAMAGE_RECOVERY") {
            setOperationTab("damage");
            setOperationsOpen(true);
        }
        if (cmd === "RETURN_ENTRY") {
            setOperationTab("return");
            setOperationsOpen(true);
        }
    }

    // Check if current page is InventoryGPT or customer support chat
    const isInventoryGPTPage = pathname === "/inventorygpt";

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#ffffff' }}>
            {/* TOP NAVIGATION BAR - Full Width Above Everything */}
            {!isInventoryGPTPage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                    <TopNavBar onTransferStock={() => setOpenFIFO(true)} />
                </div>
            )}

            {/* MAIN LAYOUT - Below Top Navbar */}
            <div style={{ display: 'flex', flex: 1, paddingTop: isInventoryGPTPage ? 0 : '64px' }}>
                <SidebarProvider>
                    {/* SIDEBAR - Starts below top navbar */}
                    <Sidebar className="shrink-0 border-r border-slate-200 bg-white" style={{ backgroundColor: '#ffffff' }}>
                        <InventoryMenu 
                            onOpenOperation={(tab) => {
                                setOperationTab(tab);
                                setOperationsOpen(true);
                            }}
                        />
                    </Sidebar>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 min-w-0 h-full flex flex-col">
                        <main className="flex-1 min-w-0 overflow-hidden relative" style={{ backgroundColor: '#ffffff' }}>
                            <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
                                <div className="p-0">
                                    {children}
                                </div>
                            </div>
                        </main>
                    </div>

                    {/* COMMAND UI */}
                    <SemiDial onCommand={handleCommand} />

                    {/* MODALS - NO BACKGROUND OVERLAY */}
                    {openFIFO && (
                        <div 
                            style={{ 
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        >
                            <div 
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    width: '800px',
                                    maxHeight: '80vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backdropFilter: 'none',
                                    WebkitBackdropFilter: 'none',
                                    border: '2px solid #e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>Transfer Stock</h2>
                                    <button 
                                        onClick={() => setOpenFIFO(false)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
                                    <TransferForm onClose={() => setOpenFIFO(false)} />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Individual Operation Modals - NO BACKGROUND OVERLAY */}
                    {operationsOpen && operationTab === "dispatch" && (
                        <div 
                            style={{ 
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        >
                            <div 
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    width: '800px',
                                    maxHeight: '80vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backdropFilter: 'none',
                                    WebkitBackdropFilter: 'none',
                                    border: '2px solid #e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>Dispatch Management</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
                                    <DispatchForm />
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "damage" && (
                        <div 
                            style={{ 
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        >
                            <div 
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    width: '600px',
                                    maxHeight: '80vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backdropFilter: 'none',
                                    WebkitBackdropFilter: 'none',
                                    border: '2px solid #e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>Damage / Recovery</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
                                    <DamageRecoveryModal onClose={() => setOperationsOpen(false)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "return" && (
                        <div 
                            style={{ 
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        >
                            <div 
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    width: '600px',
                                    maxHeight: '80vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backdropFilter: 'none',
                                    WebkitBackdropFilter: 'none',
                                    border: '2px solid #e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>Return Management</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
                                    <ReturnModal onClose={() => setOperationsOpen(false)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "recover" && (
                        <div 
                            style={{ 
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        >
                            <div 
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    width: '600px',
                                    maxHeight: '80vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backdropFilter: 'none',
                                    WebkitBackdropFilter: 'none',
                                    border: '2px solid #e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>Recovery Operations</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 100px)', padding: '32px' }}>
                                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🔧</div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Recovery Operations</h3>
                                        <p style={{ color: '#64748b' }}>Recovery functionality coming soon...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "bulk" && (
                        <div 
                            style={{ 
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        >
                            <div 
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    width: '600px',
                                    maxHeight: '80vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backdropFilter: 'none',
                                    WebkitBackdropFilter: 'none',
                                    border: '2px solid #e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#0f172a' }}>Bulk Upload</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ overflowY: 'auto', maxHeight: 'calc(80vh - 100px)' }}>
                                    <InventoryEntry onClose={() => setOperationsOpen(false)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navbar Bulk Upload Modal - CLEAN 3D EFFECT */}
                    {showBulkUpload && (
                        <div 
                            style={{ 
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1001,
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        >
                            <div 
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    boxShadow: `
                                        0 25px 50px rgba(0,0,0,0.15),
                                        0 15px 35px rgba(0,0,0,0.1),
                                        0 5px 15px rgba(0,0,0,0.08)
                                    `,
                                    width: '600px',
                                    maxHeight: '80vh',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    backdropFilter: 'none',
                                    WebkitBackdropFilter: 'none',
                                    border: '1px solid rgba(226, 232, 240, 0.8)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = `
                                        0 35px 70px rgba(0,0,0,0.2),
                                        0 20px 45px rgba(0,0,0,0.15),
                                        0 8px 25px rgba(0,0,0,0.1)
                                    `;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0px)';
                                    e.currentTarget.style.boxShadow = `
                                        0 25px 50px rgba(0,0,0,0.15),
                                        0 15px 35px rgba(0,0,0,0.1),
                                        0 5px 15px rgba(0,0,0,0.08)
                                    `;
                                }}
                            >
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    padding: '24px', 
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px 16px 0 0'
                                }}>
                                    <h2 style={{ 
                                        margin: 0, 
                                        fontSize: '20px', 
                                        fontWeight: '600', 
                                        color: '#0f172a'
                                    }}>
                                        Bulk Upload Inventory
                                    </h2>
                                    <button 
                                        onClick={() => setShowBulkUpload(false)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f1f5f9',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#e2e8f0';
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#f1f5f9';
                                            e.target.style.transform = 'translateY(0px)';
                                            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div style={{ 
                                    overflowY: 'auto', 
                                    maxHeight: 'calc(80vh - 100px)',
                                    backgroundColor: '#ffffff'
                                }}>
                                    <InventoryEntry onClose={() => setShowBulkUpload(false)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Upload Modal */}
                    {showProductUpload && (
                        <ProductUpload onClose={() => setShowProductUpload(false)} />
                    )}

                </SidebarProvider>
            </div>
        </div>
    );
}