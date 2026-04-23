"use client";

import React, { useState } from "react";
import { Building2, Store } from "lucide-react";
import WarehouseTab from "./WarehouseTab";
import StoreTab from "./StoreTab";

export default function WarehouseManagementPage() {
    const [activeTab, setActiveTab] = useState("warehouses");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Warehouse & Store Management
                    </h1>
                    <p className="text-slate-600">
                        Manage warehouses and stores with location details
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab("warehouses")}
                            className={`flex items-center gap-3 px-6 py-4 font-medium transition-all ${
                                activeTab === "warehouses"
                                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <Building2 size={20} />
                            Warehouses
                        </button>
                        <button
                            onClick={() => setActiveTab("stores")}
                            className={`flex items-center gap-3 px-6 py-4 font-medium transition-all ${
                                activeTab === "stores"
                                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                        >
                            <Store size={20} />
                            Stores
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "warehouses" && <WarehouseTab />}
                        {activeTab === "stores" && <StoreTab />}
                    </div>
                </div>
            </div>
        </div>
    );
}