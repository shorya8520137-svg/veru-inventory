"use client";

import React, { useState } from "react";
import { Building2, Store } from "lucide-react";
import WarehouseTab from "./WarehouseTab";
import StoreTab from "./StoreTab";

export default function WarehouseManagementPage() {
    const [activeTab, setActiveTab] = useState("warehouses");

    return (
        <div style={{height:"100%",background:"#F5F7FA",fontFamily:"Inter,sans-serif",padding:"0",display:"flex",flexDirection:"column",minHeight:0}}>
            {/* Tab Navigation - No padding, edge to edge */}
            <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",display:"flex",flexShrink:0}}>
                <button
                    onClick={() => setActiveTab("warehouses")}
                    style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 24px",fontWeight:"600",fontSize:"14px",border:"none",background:"none",cursor:"pointer",color:activeTab === "warehouses" ? "#3B82F6" : "#6B7280",borderBottom:activeTab === "warehouses" ? "2px solid #3B82F6" : "none",transition:"all 0.2s"}}
                >
                    <Building2 size={18} />
                    Warehouses
                </button>
                <button
                    onClick={() => setActiveTab("stores")}
                    style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 24px",fontWeight:"600",fontSize:"14px",border:"none",background:"none",cursor:"pointer",color:activeTab === "stores" ? "#3B82F6" : "#6B7280",borderBottom:activeTab === "stores" ? "2px solid #3B82F6" : "none",transition:"all 0.2s"}}
                >
                    <Store size={18} />
                    Stores
                </button>
            </div>

            {/* Tab Content - Full height, no padding */}
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
                {activeTab === "warehouses" && <WarehouseTab />}
                {activeTab === "stores" && <StoreTab />}
            </div>
        </div>
    );
}