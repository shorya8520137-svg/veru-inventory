"use client";

import React, { useState } from "react";
import { Building2, Store, Truck, User } from "lucide-react";
import WarehouseTab from "./WarehouseTab";
import StoreTab from "./StoreTab";
import MasterDataTab from "./MasterDataTab";

export default function WarehouseManagementPage() {
    const [activeTab, setActiveTab] = useState("warehouses");
    const tabs = [
        { key: "warehouses", label: "Warehouses", icon: Building2 },
        { key: "stores", label: "Stores", icon: Store },
        { key: "logistics", label: "Logistics", icon: Truck },
        { key: "processed-by", label: "Processed By", icon: User }
    ];

    return (
        <div style={{height:"100%",background:"#ffffff",fontFamily:"Inter,sans-serif",padding:"0",display:"flex",flexDirection:"column",minHeight:0}}>
            {/* Tab Navigation - No padding, edge to edge */}
            <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",display:"flex",flexShrink:0,padding:"0 18px",gap:"8px",overflowX:"auto"}}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{display:"flex",alignItems:"center",gap:"8px",padding:"14px 10px 12px",fontWeight:"700",fontSize:"14px",border:"none",background:"none",cursor:"pointer",color:active ? "#2563EB" : "#6B7280",borderBottom:active ? "2px solid #2563EB" : "2px solid transparent",transition:"all 0.22s cubic-bezier(.2,.8,.2,1)",whiteSpace:"nowrap"}}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content - Full height, no padding */}
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
                {activeTab === "warehouses" && <WarehouseTab />}
                {activeTab === "stores" && <StoreTab />}
                {activeTab === "logistics" && <MasterDataTab type="logistics" />}
                {activeTab === "processed-by" && <MasterDataTab type="processed-by" />}
            </div>
        </div>
    );
}
