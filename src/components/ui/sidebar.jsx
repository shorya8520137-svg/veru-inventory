"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Package,
    Package2,
    Truck,
    ChevronDown,
    Menu,
    ChevronLeft,
    ChevronRight,
    Settings,
    Box,
    LogOut,
    Plus,
    Shield,
    Activity,
    Lock,
    Ticket,
    Users,
    MessageSquare,
    Brain,
    Star,
    Sparkles
} from "lucide-react";
import { cva } from "class-variance-authority";
import { motion, AnimatePresence } from "framer-motion";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, PERMISSIONS } from "@/contexts/PermissionsContext";

/* ================= CONTEXT ================= */

const SidebarContext = React.createContext(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within SidebarProvider");
    }
    return context;
}

/* ================= PROVIDER ================= */

const SidebarProvider = ({ children }) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [collapsed, setCollapsed] = React.useState(false);

    const toggleCollapse = () => setCollapsed((prev) => !prev);

    return (
        <SidebarContext.Provider value={{ isMobile, openMobile, setOpenMobile, collapsed, toggleCollapse }}>
            <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
                {children}
            </div>
        </SidebarContext.Provider>
    );
};

/* ================= SIDEBAR ================= */

const Sidebar = ({ children }) => {
    const { isMobile, openMobile, setOpenMobile, collapsed, toggleCollapse } = useSidebar();

    if (isMobile) {
        return (
            <>
                <div className="fixed top-4 left-4 z-40 md:hidden">
                    <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
                <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                    <SheetContent side="left" className="w-64 p-0 bg-white border-r border-slate-200">
                        {children}
                    </SheetContent>
                </Sheet>
            </>
        );
    }

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 60 : 220 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden md:flex flex-col border-r border-slate-200 bg-white relative shrink-0 z-30 shadow-sm"
        >
             {/* Collapse Toggle Button */}
            <motion.button
                onClick={toggleCollapse}
                className="absolute -right-3 top-4 bg-white border border-slate-200 rounded-full p-1 shadow-md hover:bg-slate-50 text-slate-500 z-50 transition-all duration-200 hover:shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    animate={{ rotate: collapsed ? 0 : 180 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronRight size={12} />
                </motion.div>
            </motion.button>
            
            {children}
        </motion.aside>
    );
};

/* ================= BASIC BLOCKS ================= */

const SidebarContent = ({ children }) => (
    <div className="flex flex-1 flex-col overflow-y-auto py-2 scrollbar-hide">{children}</div>
);

const SidebarMenu = ({ children }) => (
    <ul className="flex flex-col gap-0.5 px-2">{children}</ul>
);

const SidebarMenuItem = ({ children }) => <li>{children}</li>;

const sidebarMenuButtonVariants = cva(
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
    {
        variants: {
            active: {
                true: "bg-slate-100 text-slate-900 shadow-sm border-l-2 border-blue-500",
                false: "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
            },
            collapsed: {
                true: "justify-center px-2",
                false: "",
            }
        },
        defaultVariants: {
            active: false,
            collapsed: false
        }
    }
);

/* ================= MENU ================= */

const InventoryMenu = ({ onOpenOperation }) => {
    const pathname = usePathname();
    const { collapsed } = useSidebar();
    const { logout } = useAuth();
    const { hasPermission, userRole, hasAnyInventoryAccess, hasAnyOrderAccess } = usePermissions();

    const isInventoryRoute = pathname.startsWith("/inventory");
    const isOrdersRoute = pathname.startsWith("/order");
    const isSupportRoute = pathname.startsWith("/customer-support");

    // Local state for expanded submenus (only relevant when sidebar is NOT collapsed)
    const [inventoryOpen, setInventoryOpen] = React.useState(true); // Default open for visibility
    const [ordersOpen, setOrdersOpen] = React.useState(true);
    const [supportOpen, setSupportOpen] = React.useState(true);
    const [operationsExpanded, setOperationsExpanded] = React.useState(false);

    // Auto-expand if active (but don't auto-close if user opened it)
    React.useEffect(() => {
        if (isInventoryRoute) setInventoryOpen(true);
        if (isOrdersRoute) setOrdersOpen(true);
        if (isSupportRoute) setSupportOpen(true);
    }, [isInventoryRoute, isOrdersRoute, isSupportRoute]);

    // Helper for rendering Logo
    const Logo = () => (
        <motion.div 
            className={cn("flex items-center gap-2.5 px-3 py-3 border-b border-slate-100", collapsed && "justify-center px-2")}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <motion.img 
                src="/logo-dark.png" 
                alt="Company Logo"
                className="h-8 w-8 shrink-0 rounded-lg border border-blue-200 shadow-sm object-cover"
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.2 }}
            />
            <AnimatePresence>
                {!collapsed && (
                    <motion.div 
                        initial={{ opacity: 0, width: 0 }} 
                        animate={{ opacity: 1, width: "auto" }} 
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden whitespace-nowrap"
                    >
                        <div className="text-xs font-bold text-slate-900">hunyhuny</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    // Helper for Menu Item with Submenu
    const MenuItemWithSub = ({ 
        icon: Icon, 
        label, 
        isActive, 
        isOpen, 
        onToggle, 
        basePath, 
        children 
    }) => {
        if (collapsed) {
            // When collapsed, just show the main icon as a link to the base path
             return (
                <SidebarMenuItem>
                    <motion.div 
                        className="relative group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                         <Link 
                            href={basePath} 
                            className={cn(sidebarMenuButtonVariants({ active: isActive, collapsed: true }))}
                        >
                            <Icon size={16} />
                        </Link>
                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {label}
                        </div>
                    </motion.div>
                </SidebarMenuItem>
            );
        }

        return (
            <SidebarMenuItem>
                <motion.div 
                    className="flex flex-col gap-0.5"
                    initial={false}
                    animate={{ opacity: 1 }}
                >
                    <div className="flex items-center">
                        <motion.div
                            className="flex-1"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link 
                                href={basePath} 
                                className={cn(
                                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-all duration-200",
                                    isActive ? "bg-slate-100 text-slate-900 border-l-2 border-blue-500" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon size={16} />
                                <span>{label}</span>
                            </Link>
                        </motion.div>
                        <motion.button
                            onClick={onToggle}
                            className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-100"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={14} />
                            </motion.div>
                        </motion.button>
                    </div>
                    
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden ml-3 pl-2 border-l border-slate-200 space-y-0.5"
                            >
                                {children}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </SidebarMenuItem>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <Logo />

            <SidebarContent>
                <SidebarMenu>
                    
                    {/* DASHBOARD - DISABLED - Code removed for cleaner build */}

                    {/* TRACKING - DISABLED - Code removed for cleaner build */}

                    {/* PRODUCTS */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/products" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname === "/products", collapsed }))}
                                >
                                    <Package2 size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Products</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* WEBSITE PRODUCT MANAGEMENT */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/website-products" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname === "/website-products", collapsed }))}
                                >
                                    <Box size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Website Products</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* WEBSITE CUSTOMERS */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/website-customers" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname === "/website-customers", collapsed }))}
                                >
                                    <Users size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Website Customers</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* CUSTOMER SUPPORT */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/customer-support" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname.startsWith("/customer-support"), collapsed }))}
                                >
                                    <MessageSquare size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Customer Support</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* DELIVERY */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/delivery" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname.startsWith("/delivery") && !pathname.startsWith("/delivery/order"), collapsed }))}
                                >
                                    <Truck size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Delivery</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* ORDER (sub-tab under delivery) */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}>
                                <Link href="/delivery/order"
                                    className={cn(sidebarMenuButtonVariants({ active: pathname.startsWith("/delivery/order"), collapsed }))}
                                    style={{ paddingLeft: collapsed ? undefined : 28 }}
                                >
                                    <Package size={collapsed ? 16 : 14} />
                                    {!collapsed && <span style={{ fontSize: 13 }}>Create Order</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* ORDERS TABLE */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div whileHover={{ scale: 1.02, x: 2 }} whileTap={{ scale: 0.98 }}>
                                <Link href="/delivery/orders"
                                    className={cn(sidebarMenuButtonVariants({ active: pathname.startsWith("/delivery/orders"), collapsed }))}
                                    style={{ paddingLeft: collapsed ? undefined : 28 }}
                                >
                                    <Activity size={collapsed ? 16 : 14} />
                                    {!collapsed && <span style={{ fontSize: 13 }}>Orders</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* INVENTORY GPT */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/inventorygpt" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname.startsWith("/inventorygpt"), collapsed }))}
                                >
                                    <Brain size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>InventoryGPT</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* REVIEWS */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/reviews" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname.startsWith("/reviews"), collapsed }))}
                                >
                                    <Star size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Reviews</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* SEO CONTENT GENERATOR */}
                    {hasPermission(PERMISSIONS.PRODUCTS_VIEW) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/seo" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname.startsWith("/seo"), collapsed }))}
                                >
                                    <Sparkles size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>SEO</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* INVENTORY */}
                    {hasAnyInventoryAccess() && (
                        <MenuItemWithSub
                            icon={Package}
                            label="Inventory"
                            isActive={isInventoryRoute}
                            isOpen={inventoryOpen}
                            onToggle={() => setInventoryOpen(!inventoryOpen)}
                            basePath="/inventory"
                        >
                            <motion.div
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/inventory/movement-records"
                                    className={cn(
                                        "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200",
                                        pathname === "/inventory/movement-records" ? "text-slate-900 font-medium bg-slate-50" : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    Movement Records
                                </Link>
                            </motion.div>
                        </MenuItemWithSub>
                    )}

                    {/* OPERATIONS */}
                    {(hasPermission(PERMISSIONS.OPERATIONS_DAMAGE) || 
                      hasPermission(PERMISSIONS.OPERATIONS_RETURN) || 
                      hasPermission(PERMISSIONS.OPERATIONS_BULK) ||
                      hasPermission(PERMISSIONS.OPERATIONS_SELF_TRANSFER)) && (
                        <MenuItemWithSub
                            icon={Plus}
                            label="Operations"
                            isActive={false}
                            isOpen={operationsExpanded}
                            onToggle={() => setOperationsExpanded(!operationsExpanded)}
                            basePath="#"
                        >
                            {hasPermission(PERMISSIONS.OPERATIONS_DAMAGE) && (
                                <motion.button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("damage");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200 w-full text-left hover:scale-[1.02]",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ⚠️ Damage
                                </motion.button>
                            )}
                            {hasPermission(PERMISSIONS.OPERATIONS_RETURN) && (
                                <motion.button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("return");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200 w-full text-left hover:scale-[1.02]",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    🔄 Return
                                </motion.button>
                            )}
                            {hasPermission(PERMISSIONS.OPERATIONS_BULK) && (
                                <motion.button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("bulk");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200 w-full text-left hover:scale-[1.02]",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    📤 Bulk Upload
                                </motion.button>
                            )}
                            {hasPermission(PERMISSIONS.OPERATIONS_SELF_TRANSFER) && (
                                <motion.button 
                                    onClick={() => {
                                        if (onOpenOperation) {
                                            onOpenOperation("transfer");
                                        }
                                    }}
                                    className={cn(
                                        "block rounded-md px-2.5 py-1.5 text-xs transition-all duration-200 w-full text-left hover:scale-[1.02]",
                                        "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                    whileHover={{ x: 2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    🔄 Self Transfer
                                </motion.button>
                            )}
                        </MenuItemWithSub>
                    )}

                    {/* PERMISSIONS & USER MANAGEMENT */}
                    {(hasPermission(PERMISSIONS.SYSTEM_USER_MANAGEMENT) || 
                      hasPermission(PERMISSIONS.SYSTEM_ROLE_MANAGEMENT) || 
                      hasPermission(PERMISSIONS.SYSTEM_AUDIT_LOG)) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/permissions" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname === "/permissions", collapsed }))}
                                >
                                    <Shield size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Permissions</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* AUDIT LOGS */}
                    {hasPermission(PERMISSIONS.SYSTEM_AUDIT_LOG) && (
                        <SidebarMenuItem>
                            <motion.div
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link 
                                    href="/audit-logs" 
                                    className={cn(sidebarMenuButtonVariants({ active: pathname === "/audit-logs", collapsed }))}
                                >
                                    <Activity size={collapsed ? 16 : 16} />
                                    {!collapsed && <span>Audit Logs</span>}
                                </Link>
                            </motion.div>
                        </SidebarMenuItem>
                    )}

                    {/* SECURITY SETTINGS */}
                    <SidebarMenuItem>
                        <motion.div
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Link 
                                href="/security" 
                                className={cn(sidebarMenuButtonVariants({ active: pathname === "/security", collapsed }))}
                            >
                                <Lock size={collapsed ? 16 : 16} />
                                {!collapsed && <span>Security</span>}
                            </Link>
                        </motion.div>
                    </SidebarMenuItem>

                    {/* TICKET MANAGEMENT - REMOVED */}
                    {/* PROFILE - REMOVED */}

                    {/* ACCESS CONTROL - DISABLED - Code removed for cleaner build */}

                </SidebarMenu>
            </SidebarContent>

            {/* FOOTER */}
            <motion.div 
                className={cn("p-3 border-t border-slate-100", collapsed && "flex flex-col gap-1.5 items-center")}
                initial={false}
                animate={{ padding: collapsed ? "12px 8px" : "12px" }}
            >
                {!collapsed ? (
                    <div className="space-y-1.5">
                        {/* User Role Display */}
                        <motion.div 
                            className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <motion.div 
                                className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: userRole?.color || '#64748b' }}
                                whileHover={{ rotate: 5 }}
                            >
                                {userRole?.name?.charAt(0) || 'U'}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-slate-900 truncate">
                                    {userRole?.name || 'User'}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                    {userRole?.permissions?.length || 0} permissions
                                </div>
                            </div>
                        </motion.div>
                        
                        {hasPermission(PERMISSIONS.SYSTEM_SETTINGS) && (
                            <motion.div 
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <Settings size={14} />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-slate-900">Settings</div>
                                    <div className="text-[10px] text-slate-500">v1.0.0</div>
                                </div>
                            </motion.div>
                        )}
                        
                        <motion.button 
                            onClick={logout}
                            className="flex items-center gap-2.5 w-full p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            whileHover={{ scale: 1.02, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center">
                                <LogOut size={14} />
                            </div>
                            <div className="text-xs font-medium">Logout</div>
                        </motion.button>
                    </div>
                ) : (
                    <>
                        {/* Collapsed Role Indicator */}
                        <motion.div 
                            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                            style={{ backgroundColor: userRole?.color || '#64748b' }}
                            title={`${userRole?.name || 'User'} - ${userRole?.permissions?.length || 0} permissions`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {userRole?.name?.charAt(0) || 'U'}
                        </motion.div>
                        
                        {hasPermission(PERMISSIONS.SYSTEM_SETTINGS) && (
                            <motion.div 
                                className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Settings size={14} />
                            </motion.div>
                        )}
                        
                        <motion.button 
                            onClick={logout}
                            className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <LogOut size={14} />
                        </motion.button>
                    </>
                )}
            </motion.div>
        </div>
    );
};

/* ================= EXPORTS ================= */

export {
    Sidebar,
    SidebarProvider,
    SidebarContent,
    InventoryMenu 
};
