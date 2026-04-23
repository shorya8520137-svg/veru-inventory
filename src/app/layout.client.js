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

export default function ClientLayout({ children }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    
    // State hooks must be at the top, before any conditional returns
    const [openFIFO, setOpenFIFO] = useState(false);
    const [operationsOpen, setOperationsOpen] = useState(false);
    const [operationTab, setOperationTab] = useState("dispatch");

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
        <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* TOP NAVIGATION BAR - Full Width Above Everything */}
            {!isInventoryGPTPage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
                    <TopNavBar />
                </div>
            )}

            {/* MAIN LAYOUT - Below Top Navbar */}
            <div className="flex flex-1" style={{ paddingTop: isInventoryGPTPage ? 0 : '64px' }}>
                <SidebarProvider>
                    {/* SIDEBAR - Starts below top navbar */}
                    <Sidebar className="shrink-0 border-r border-slate-200 bg-white backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                        <InventoryMenu 
                            onOpenOperation={(tab) => {
                                setOperationTab(tab);
                                setOperationsOpen(true);
                            }}
                        />
                    </Sidebar>

                    {/* MAIN CONTENT */}
                    <div className="flex-1 min-w-0 h-full flex flex-col">
                        <main className="flex-1 min-w-0 overflow-hidden relative bg-gradient-to-br from-slate-50 to-white" style={{ background: 'linear-gradient(to bottom right, rgba(248, 250, 252, 0.5), white)' }}>
                            <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
                                <div className="p-0">
                                    {children}
                                </div>
                            </div>
                        </main>
                    </div>

                    {/* COMMAND UI */}
                    <SemiDial onCommand={handleCommand} />

                    {/* MODALS */}
                    {openFIFO && <TransferForm onClose={() => setOpenFIFO(false)} />}
                    
                    {/* Individual Operation Modals */}
                    {operationsOpen && operationTab === "dispatch" && (
                        <div 
                            className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1001 }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setOperationsOpen(false);
                                }
                            }}
                        >
                            <div className="card-modern max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                                    <h2 className="text-xl font-semibold text-slate-900">Dispatch Management</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        className="button-secondary p-2 rounded-lg transition-all hover:bg-slate-100"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                                    <DispatchForm />
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "damage" && (
                        <div 
                            className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1001 }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setOperationsOpen(false);
                                }
                            }}
                        >
                            <div className="card-modern max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                                    <h2 className="text-xl font-semibold text-slate-900">Damage / Recovery</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        className="button-secondary p-2 rounded-lg transition-all hover:bg-slate-100"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                                    <DamageRecoveryModal onClose={() => setOperationsOpen(false)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "return" && (
                        <div 
                            className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1001 }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setOperationsOpen(false);
                                }
                            }}
                        >
                            <div className="card-modern max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                                    <h2 className="text-xl font-semibold text-slate-900">Return Management</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        className="button-secondary p-2 rounded-lg transition-all hover:bg-slate-100"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                                    <ReturnModal onClose={() => setOperationsOpen(false)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "recover" && (
                        <div 
                            className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1001 }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setOperationsOpen(false);
                                }
                            }}
                        >
                            <div className="card-modern max-w-2xl w-full max-h-[90vh] overflow-hidden relative">
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                                    <h2 className="text-xl font-semibold text-slate-900">Recovery Operations</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        className="button-secondary p-2 rounded-lg transition-all hover:bg-slate-100"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar p-8">
                                    <div className="text-center text-slate-500">
                                        <div className="text-6xl mb-6">🔧</div>
                                        <h3 className="text-xl font-semibold mb-3 text-slate-700">Recovery Operations</h3>
                                        <p className="text-slate-600">Recovery functionality coming soon...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {operationsOpen && operationTab === "bulk" && (
                        <div 
                            className="fixed inset-0 backdrop-blur-md flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1001 }}
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setOperationsOpen(false);
                                }
                            }}
                        >
                            <div className="card-modern max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
                                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
                                    <h2 className="text-xl font-semibold text-slate-900">Bulk Upload</h2>
                                    <button 
                                        onClick={() => setOperationsOpen(false)}
                                        className="button-secondary p-2 rounded-lg transition-all hover:bg-slate-100"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                                <div className="overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                                    <InventoryEntry onClose={() => setOperationsOpen(false)} />
                                </div>
                            </div>
                        </div>
                    )}

                </SidebarProvider>
            </div>
        </div>
    );
}