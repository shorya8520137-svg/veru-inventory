"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Plus, 
  Bell, 
  HelpCircle, 
  User,
  Settings,
  Users,
  FileText,
  BarChart3,
  Shield,
  AlertTriangle
} from "lucide-react";

/**
 * MODERN ENTERPRISE SAAS CREATE ROLE PAGE
 * Inspired by Linear, Stripe, Notion, Atlassian
 * Premium dashboard UI with clean typography and spacious layout
 */
export default function CreateRoleModern({ role, permissions, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState("system");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [formData, setFormData] = useState({
    name: role?.name || '',
    display_name: role?.display_name || '',
    description: role?.description || '',
    color: role?.color || '#3B82F6',
    permissionIds: role?.permissions?.map(p => p.id) || []
  });

  // Color palette for role identification
  const colorOptions = [
    { id: 'blue', name: 'Blue', value: '#3B82F6', bg: 'bg-blue-500' },
    { id: 'orange', name: 'Orange', value: '#F97316', bg: 'bg-orange-500' },
    { id: 'gray', name: 'Gray', value: '#6B7280', bg: 'bg-gray-500' },
    { id: 'purple', name: 'Purple', value: '#8B5CF6', bg: 'bg-purple-500' },
    { id: 'pink', name: 'Pink', value: '#EC4899', bg: 'bg-pink-500' },
    { id: 'green', name: 'Green', value: '#10B981', bg: 'bg-emerald-500' },
    { id: 'cyan', name: 'Cyan', value: '#06B6D4', bg: 'bg-cyan-500' },
    { id: 'slate', name: 'Dark Slate', value: '#475569', bg: 'bg-slate-600' }
  ];

  // Permission tabs configuration
  const permissionTabs = [
    { id: 'system', label: 'System', icon: Settings },
    { id: 'inventory', label: 'Inventory', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: FileText },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'operations', label: 'Operations', icon: Settings },
    { id: 'warehouse', label: 'Warehouse Access', icon: Settings },
    { id: 'website', label: 'Website', icon: Settings }
  ];

  // Sample permissions data
  const samplePermissions = {
    system: [
      {
        id: 1,
        name: 'Database Backup',
        description: 'Initiate full system snapshots and download archival data packages from the core server.',
        category: 'CRITICAL',
        enabled: false
      },
      {
        id: 2,
        name: 'Security Settings',
        description: 'Modify global firewall rules, API encryption standards, and user authentication protocols.',
        category: 'CRITICAL',
        enabled: false
      },
      {
        id: 3,
        name: 'Maintenance Mode',
        description: 'Toggle system-wide downtime for infrastructure updates or emergency deployments.',
        category: 'CRITICAL',
        enabled: false
      },
      {
        id: 4,
        name: 'System Monitoring',
        description: 'View real-time hardware performance, server latency, and global error rates.',
        category: 'STANDARD',
        enabled: false
      },
      {
        id: 5,
        name: 'Access Logs',
        description: 'Search and filter historical event logs for security auditing and user behavior analysis.',
        category: 'STANDARD',
        enabled: false
      },
      {
        id: 6,
        name: 'System Notifications',
        description: 'Broadcast organization-wide alerts and manage automated email trigger templates.',
        category: 'STANDARD',
        enabled: false
      }
    ]
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color.id);
    setFormData({ ...formData, color: color.value });
  };

  const togglePermission = (permissionId) => {
    const newPermissionIds = formData.permissionIds.includes(permissionId)
      ? formData.permissionIds.filter(id => id !== permissionId)
      : [...formData.permissionIds, permissionId];
    
    setFormData({ ...formData, permissionIds: newPermissionIds });
  };

  const selectAllPermissions = () => {
    const currentPermissions = samplePermissions[activeTab] || [];
    const allIds = currentPermissions.map(p => p.id);
    const allSelected = allIds.every(id => formData.permissionIds.includes(id));
    
    if (allSelected) {
      setFormData({
        ...formData,
        permissionIds: formData.permissionIds.filter(id => !allIds.includes(id))
      });
    } else {
      setFormData({
        ...formData,
        permissionIds: [...new Set([...formData.permissionIds, ...allIds])]
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">PermitFlow</span>
              </div>
              
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Team</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Logs</a>
                <a href="#" className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">Settings</a>
              </nav>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <HelpCircle className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <span>Settings</span>
          <ChevronRight className="w-4 h-4" />
          <span>Role Management</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Create New Role</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Role</h1>
            <p className="text-gray-600 text-lg">Define the permission scope and access levels for organization members.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - General Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">General Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Operations Manager"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g. OPS_MGR_01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the responsibilities and access context for this role…"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Identity */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Visual Identity</h2>
              <p className="text-gray-600 text-sm mb-6">Select a color tag for role identification across the system.</p>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                {colorOptions.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorSelect(color)}
                    className={`w-full h-12 rounded-xl ${color.bg} transition-all duration-200 ${
                      selectedColor === color.id 
                        ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' 
                        : 'hover:scale-105'
                    }`}
                  />
                ))}
                <button className="w-full h-12 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center hover:border-gray-400 transition-colors">
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${colorOptions.find(c => c.id === selectedColor)?.bg}`}></div>
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
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Permission Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex items-center justify-between">
              <div className="flex space-x-1 overflow-x-auto">
                {permissionTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={selectAllPermissions}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Select All</span>
              </button>
            </div>
          </div>

          {/* Permission Cards */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(samplePermissions[activeTab] || []).map((permission) => (
                <div
                  key={permission.id}
                  className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {permission.category === 'CRITICAL' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          CRITICAL
                        </span>
                      )}
                      {permission.category === 'STANDARD' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          <Shield className="w-3 h-3 mr-1" />
                          STANDARD
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => togglePermission(permission.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.permissionIds.includes(permission.id)
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.permissionIds.includes(permission.id)
                            ? 'translate-x-6'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{permission.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{permission.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}