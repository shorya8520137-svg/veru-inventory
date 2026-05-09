"use client";

import { useState } from "react";
import { 
  Bell, 
  HelpCircle, 
  User, 
  ChevronRight,
  Check,
  Plus
} from "lucide-react";

/**
 * FULL PAGE ENTERPRISE SAAS CREATE ROLE UI
 * Inspired by Linear, Stripe, Notion, Atlassian
 * Complete dashboard layout with navbar, breadcrumb, and permission management
 */
export default function CreateRoleFullPage() {
  const [activeTab, setActiveTab] = useState("system");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [permissions, setPermissions] = useState({
    database_backup: false,
    security_settings: false,
    maintenance_mode: false,
    system_monitoring: false,
    access_logs: false,
    system_notifications: false
  });

  const colorOptions = [
    { id: 'blue', value: '#3B82F6' },
    { id: 'brown', value: '#92400E' },
    { id: 'gray', value: '#4B5563' },
    { id: 'purple', value: '#8B5CF6' },
    { id: 'pink', value: '#EC4899' },
    { id: 'orange', value: '#F97316' },
    { id: 'green', value: '#10B981' },
    { id: 'cyan', value: '#06B6D4' },
    { id: 'slate', value: '#475569' }
  ];

  const tabs = [
    { id: 'system', label: 'System' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'operations', label: 'Operations' },
    { id: 'warehouse', label: 'Warehouse Access' },
    { id: 'website', label: 'Website' }
  ];

  const permissionCards = [
    {
      id: 'database_backup',
      title: 'Database Backup',
      description: 'Initiate full system snapshots and download archival data packages from the core server.',
      critical: true
    },
    {
      id: 'security_settings',
      title: 'Security Settings',
      description: 'Modify global firewall rules, API encryption standards, and user authentication protocols.',
      critical: true
    },
    {
      id: 'maintenance_mode',
      title: 'Maintenance Mode',
      description: 'Toggle system-wide downtime for infrastructure updates or emergency deployments.',
      critical: true
    },
    {
      id: 'system_monitoring',
      title: 'System Monitoring',
      description: 'View real-time hardware performance, server latency, and global error rates.',
      critical: false
    },
    {
      id: 'access_logs',
      title: 'Access Logs',
      description: 'Search and filter historical event logs for security auditing and user behavior analysis.',
      critical: false
    },
    {
      id: 'system_notifications',
      title: 'System Notifications',
      description: 'Broadcast organization-wide alerts and manage automated email trigger templates.',
      critical: false
    }
  ];

  const togglePermission = (id) => {
    setPermissions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAll = () => {
    const allSelected = Object.values(permissions).every(v => v);
    const newState = {};
    Object.keys(permissions).forEach(key => {
      newState[key] = !allSelected;
    });
    setPermissions(newState);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="text-xl font-bold text-gray-900">PermitFlow</span>
              </div>
              
              <nav className="hidden md:flex space-x-1">
                <a href="#" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  Dashboard
                </a>
                <a href="#" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  Team
                </a>
                <a href="#" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                  Logs
                </a>
                <a href="#" className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                  Settings
                </a>
              </nav>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <span className="hover:text-gray-700 cursor-pointer">Settings</span>
          <ChevronRight className="w-4 h-4" />
          <span className="hover:text-gray-700 cursor-pointer">Role Management</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Create New Role</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Role</h1>
            <p className="text-gray-600 text-base">
              Define the permission scope and access levels for organization members.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Cancel
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">
              Save Changes
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - General Information (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">General Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Operations Manager"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OPS_MGR_01"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the responsibilities and access context for this role…"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Visual Identity (1/3 width) */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Visual Identity</h2>
              <p className="text-sm text-gray-600 mb-6">
                Select a color tag for role identification across the system.
              </p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {colorOptions.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-full h-12 rounded-xl transition-all duration-200 ${
                      selectedColor === color.value 
                        ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' 
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
                <button className="w-full h-12 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-gray-400 transition-colors">
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Kinetic Obsidian</div>
                    <div className="text-xs text-gray-500">Active branding profile applied.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Management Section */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1 overflow-x-auto">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={selectAll}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Select All</span>
              </button>
            </div>
          </div>

          {/* Permission Cards Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {permissionCards.map((card) => (
                <div
                  key={card.id}
                  className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    {card.critical && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        CRITICAL
                      </span>
                    )}
                    
                    <button
                      onClick={() => togglePermission(card.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permissions[card.id]
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          permissions[card.id]
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
