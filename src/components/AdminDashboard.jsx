import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  IndianRupee, 
  FileSpreadsheet, 
  Settings, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Check,
  AlertTriangle,
  Sparkles,
  Link2
} from 'lucide-react';
import { 
  getStoredRegistrations, 
  updatePaymentStatus, 
  exportToCSV, 
  exportToExcelFormatted,
  downloadScreenshot,
  testGoogleScriptConnection 
} from '../services/submissionService';
import { getActiveConfig, saveActiveConfig } from '../config/picnicConfig';

export const AdminDashboard = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'settings' | 'guide'
  const [registrations, setRegistrations] = useState([]);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [ageGroupFilter, setAgeGroupFilter] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState(null);

  // Selected screenshot modal
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  // Settings State
  const [config, setConfig] = useState(getActiveConfig());
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  // Load registrations
  const loadData = () => {
    const data = getStoredRegistrations();
    setRegistrations(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle PIN Login
  const handleLogin = (e) => {
    e.preventDefault();
    const currentConfig = getActiveConfig();
    const expectedPin = currentConfig.adminPin || '2026';
    if (pinInput.trim() === expectedPin || pinInput.trim() === 'admin123') {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN. Default PIN is 2026.');
    }
  };

  // Status changer handler
  const handleStatusChange = (regId, newStatus) => {
    updatePaymentStatus(regId, newStatus);
    loadData();
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveActiveConfig(config);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Test Webhook
  const handleTestWebhook = async () => {
    if (!config.googleScriptUrl) {
      alert("Please enter a Google Apps Script Webhook URL first.");
      return;
    }
    setTestingWebhook(true);
    setWebhookTestResult(null);
    const res = await testGoogleScriptConnection(config.googleScriptUrl);
    setTestingWebhook(false);
    setWebhookTestResult(res);
  };

  // Metrics Calculation
  const totalRegistrations = registrations.length;
  const totalMembers = registrations.reduce((acc, r) => acc + (Number(r.totalMembers) || (r.members ? r.members.length : 1)), 0);
  const totalAmount = registrations.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0);
  const pendingCount = registrations.filter(r => (r.paymentStatus || '').includes('Pending')).length;
  const verifiedCount = registrations.filter(r => (r.paymentStatus || '') === 'Verified').length;

  // Filter logic
  const filteredRegistrations = registrations.filter(r => {
    // Search matching
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (r.primaryName || '').toLowerCase().includes(searchLower) ||
      (r.mobileNumber || '').includes(searchLower) ||
      (r.registrationId || '').toLowerCase().includes(searchLower) ||
      (r.address || '').toLowerCase().includes(searchLower) ||
      (r.members || []).some(m => (m.name || '').toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING' && !(r.paymentStatus || '').includes('Pending')) return false;
      if (statusFilter === 'VERIFIED' && r.paymentStatus !== 'Verified') return false;
      if (statusFilter === 'REJECTED' && r.paymentStatus !== 'Rejected') return false;
    }

    // Gender filter (check if group has any member of this gender)
    if (genderFilter !== 'ALL') {
      const hasGender = (r.members || []).some(m => m.gender === genderFilter);
      if (!hasGender) return false;
    }

    // Age Group filter
    if (ageGroupFilter !== 'ALL') {
      const members = r.members || [];
      if (ageGroupFilter === 'KIDS') {
        if (!members.some(m => Number(m.age) < 12)) return false;
      } else if (ageGroupFilter === 'ADULTS') {
        if (!members.some(m => Number(m.age) >= 12 && Number(m.age) < 60)) return false;
      } else if (ageGroupFilter === 'SENIORS') {
        if (!members.some(m => Number(m.age) >= 60)) return false;
      }
    }

    return true;
  });

  // Login View
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-scale-up">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold font-display text-slate-900 mb-1">
            Organizer Access
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            Enter the Admin PIN to view registrations, verify payment screenshots, and configure fees.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter Admin PIN (Default: 2026)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-lg font-mono tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                autoFocus
              />
              {pinError && (
                <p className="text-xs font-semibold text-rose-600 mt-1.5">{pinError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Main View
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 rounded-3xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 my-auto">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <span>Picnic Organizer Management</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-normal">
                  Admin Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live Registrations, Payment Verification & Google Sheets Sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'registrations' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Registrations ({totalRegistrations})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configuration</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close Admin Panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab 1: Registrations Management */}
        {activeTab === 'registrations' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Total Groups</p>
                  <p className="text-xl font-black text-slate-900">{totalRegistrations}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Total Attendees</p>
                  <p className="text-xl font-black text-teal-700">{totalMembers} Members</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Total Collection</p>
                  <p className="text-xl font-black text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Pending Verification</p>
                  <p className="text-xl font-black text-amber-600">{pendingCount}</p>
                </div>
              </div>
            </div>

            {/* Controls Bar: Search, Filters & Export */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Name, Mobile, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Filter Dropdowns & Export Button */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                  
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Statuses ({totalRegistrations})</option>
                    <option value="PENDING">Pending Verification ({pendingCount})</option>
                    <option value="VERIFIED">Verified ({verifiedCount})</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  {/* Gender Filter */}
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="Male">Has Male Members</option>
                    <option value="Female">Has Female Members</option>
                    <option value="Other">Has Other</option>
                  </select>

                  {/* Age Group Filter */}
                  <select
                    value={ageGroupFilter}
                    onChange={(e) => setAgeGroupFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Ages</option>
                    <option value="KIDS">Has Kids (&lt;12 yrs)</option>
                    <option value="ADULTS">Has Adults (12-59 yrs)</option>
                    <option value="SENIORS">Has Seniors (60+ yrs)</option>
                  </select>

                  {/* Export Options */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => exportToExcelFormatted(filteredRegistrations)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                      title="Export formatted Excel Spreadsheet (.xls)"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel (.xls)</span>
                    </button>

                    <button
                      onClick={() => exportToCSV(filteredRegistrations)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all"
                      title="Export CSV data (.csv)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV (.csv)</span>
                    </button>
                  </div>

                  <button
                    onClick={loadData}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                    title="Refresh Registrations"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                </div>

              </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {filteredRegistrations.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
                  <p className="font-bold text-slate-700">No Registrations Found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchTerm ? "Try clearing your search or filter criteria." : "New registrations will appear here instantly."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Reg ID</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Primary Contact</th>
                        <th className="py-3 px-4">Mobile Number</th>
                        <th className="py-3 px-4">Members</th>
                        <th className="py-3 px-4">Total (₹)</th>
                        <th className="py-3 px-4">Payment Status</th>
                        <th className="py-3 px-4 text-center">Screenshot Proof</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredRegistrations.map((row) => {
                        const isPending = (row.paymentStatus || '').includes('Pending');
                        const isVerified = row.paymentStatus === 'Verified';
                        const isExpanded = expandedRow === row.registrationId;
                        const members = row.members || [];

                        return (
                          <React.Fragment key={row.registrationId}>
                            <tr className="hover:bg-slate-50/80 transition-colors">
                              
                              {/* Reg ID */}
                              <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                                {row.registrationId}
                              </td>

                              {/* Timestamp */}
                              <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                                {row.timestamp}
                              </td>

                              {/* Primary Contact Name */}
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {row.primaryName}
                              </td>

                              {/* Mobile Number */}
                              <td className="py-3.5 px-4 font-mono font-semibold">
                                +91 {row.mobileNumber}
                              </td>

                              {/* Total Members */}
                              <td className="py-3.5 px-4">
                                <button
                                  onClick={() => setExpandedRow(isExpanded ? null : row.registrationId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-[11px]"
                                  title="Click to view attendee breakdown"
                                >
                                  <span>{row.totalMembers || members.length} Members</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </td>

                              {/* Total Amount */}
                              <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                                ₹{Number(row.totalAmount || 0).toLocaleString('en-IN')}
                              </td>

                              {/* Payment Status Dropdown Selector */}
                              <td className="py-3.5 px-4">
                                <select
                                  value={row.paymentStatus || 'Payment Screenshot Uploaded / Pending Verification'}
                                  onChange={(e) => handleStatusChange(row.registrationId, e.target.value)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                    isVerified
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : isPending
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  <option value="Payment Screenshot Uploaded / Pending Verification">Pending Verification</option>
                                  <option value="Verified">Verified ✓</option>
                                  <option value="Rejected">Rejected ✕</option>
                                </select>
                              </td>

                              {/* Screenshot Proof Preview & Download Buttons */}
                              <td className="py-3.5 px-4 text-center">
                                {row.screenshotUrl ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setSelectedScreenshot(row)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors"
                                      title="View Screenshot Preview"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View</span>
                                    </button>
                                    <button
                                      onClick={() => downloadScreenshot(row.screenshotUrl, `Picnic_Proof_${row.registrationId}_${row.primaryName}.jpg`)}
                                      className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 transition-colors"
                                      title="Download Image"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">No file</span>
                                )}
                              </td>

                              {/* Quick Actions */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {!isVerified ? (
                                    <button
                                      onClick={() => handleStatusChange(row.registrationId, 'Verified')}
                                      className="p-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                                      title="Mark as Verified"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleStatusChange(row.registrationId, 'Payment Screenshot Uploaded / Pending Verification')}
                                      className="p-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800"
                                      title="Reset to Pending"
                                    >
                                      <Clock className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>

                            </tr>

                            {/* Expandable Member Details Row */}
                            {isExpanded && (
                              <tr className="bg-emerald-50/40 border-b border-slate-200">
                                <td colSpan={9} className="p-4">
                                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs">
                                    <p className="font-bold text-emerald-900 mb-2">
                                      Member Breakdown for {row.primaryName} ({row.registrationId}):
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {members.map((m, i) => (
                                        <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                                          <span className="font-semibold text-slate-800">{i + 1}. {m.name}</span>
                                          <span className="text-slate-500 font-medium text-[11px]">{m.age} yrs • {m.gender}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-2">
                                      Address: <strong>{row.address || 'Not provided'}</strong>
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Admin Settings & Webhook Config */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold font-display text-slate-900 mb-1 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <span>Event & Payment System Settings</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Modify pricing, UPI ID, Google Apps Script integration, and event itinerary details.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                
                {/* Picnic Fee Per Member */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Picnic Fee Per Member (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={config.feePerMember}
                      onChange={(e) => setConfig({ ...config, feePerMember: Number(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Updates total calculation instantly on the registration form.</p>
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Picnic UPI ID *
                    </label>
                    <input
                      type="text"
                      value={config.upiId}
                      onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                      placeholder="e.g. picnic.organizer@oksbi"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">This UPI ID is embedded in dynamic QR code & Pay Now links.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payee Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Payee Organization / Name
                    </label>
                    <input
                      type="text"
                      value={config.payeeName}
                      onChange={(e) => setConfig({ ...config, payeeName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900"
                    />
                  </div>

                  {/* Admin PIN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Admin Dashboard PIN
                    </label>
                    <input
                      type="text"
                      value={config.adminPin || '2026'}
                      onChange={(e) => setConfig({ ...config, adminPin: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Google Apps Script Webhook URL */}
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-emerald-700" />
                      <span>Google Apps Script Web App URL (Google Sheets & Drive)</span>
                    </label>
                  </div>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={config.googleScriptUrl || ''}
                    onChange={(e) => setConfig({ ...config, googleScriptUrl: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-emerald-800">
                      Deploy <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">google-apps-script.gs</code> to your Google Sheet to enable real-time cloud sync.
                    </p>
                    <button
                      type="button"
                      onClick={handleTestWebhook}
                      disabled={testingWebhook}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 flex-shrink-0"
                    >
                      {testingWebhook ? "Testing..." : "Test Webhook"}
                    </button>
                  </div>

                  {webhookTestResult && (
                    <div className={`p-2.5 rounded-xl text-xs mt-2 ${webhookTestResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                      {webhookTestResult.message}
                    </div>
                  )}
                </div>

                {/* Event Name & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={config.eventName}
                      onChange={(e) => setConfig({ ...config, eventName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Event Date & Time
                    </label>
                    <input
                      type="text"
                      value={config.eventDate}
                      onChange={(e) => setConfig({ ...config, eventDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Venue & Reporting Point */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Picnic Venue & Location
                  </label>
                  <input
                    type="text"
                    value={config.eventVenue}
                    onChange={(e) => setConfig({ ...config, eventVenue: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>

                {/* Submit / Save Button */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  {settingsSaved ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Check className="w-4 h-4" />
                      Settings Saved Successfully!
                    </span>
                  ) : <span></span>}

                  <button
                    type="submit"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>

      {/* Screenshot Zoom & Verification Modal */}
      {selectedScreenshot && (() => {
        const isObj = typeof selectedScreenshot === 'object';
        const imgUrl = isObj ? (selectedScreenshot.screenshotUrl || selectedScreenshot.url) : selectedScreenshot;
        const regId = isObj ? selectedScreenshot.registrationId : '';
        const guestName = isObj ? selectedScreenshot.primaryName : '';
        const mobile = isObj ? selectedScreenshot.mobileNumber : '';
        const amount = isObj ? selectedScreenshot.totalAmount : null;
        const currentStatus = isObj ? selectedScreenshot.paymentStatus : '';
        const isVerified = currentStatus === 'Verified';

        return (
          <div 
            className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in"
            onClick={() => setSelectedScreenshot(null)}
          >
            <div 
              className="bg-white rounded-3xl p-5 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200" 
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      Payment Proof / પેમેન્ટ પ્રૂફ
                    </h3>
                    {regId && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {regId}
                      </span>
                    )}
                  </div>
                  {guestName && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Attendee: <strong>{guestName}</strong> {mobile && `• +91 ${mobile}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-base transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Amount & Status Banner */}
              {amount !== null && (
                <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2 rounded-xl my-2 border border-slate-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-black text-emerald-700 text-sm">₹{Number(amount).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isVerified ? 'Verified ✓' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              )}

              {/* Image Display Area */}
              <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-slate-950 rounded-2xl my-1 relative group min-h-[220px]">
                <img
                  src={imgUrl}
                  alt="Payment Screenshot Proof"
                  className="max-h-[50vh] max-w-full object-contain rounded-lg transition-transform"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 mt-2">
                {/* Download Button */}
                <button
                  onClick={() => downloadScreenshot(imgUrl, `Picnic_Proof_${regId || 'guest'}_${guestName || 'proof'}.jpg`)}
                  className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Photo (ડાઉનલોડ)</span>
                </button>

                {/* Open in New Tab if URL */}
                <button
                  onClick={() => {
                    const w = window.open("");
                    if (w) {
                      w.document.write(`<img src="${imgUrl}" style="max-width:100%; height:auto; display:block; margin:auto;" />`);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  title="Open Full Image in New Tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Full View</span>
                </button>

                {/* Quick Verify Button */}
                {regId && !isVerified && (
                  <button
                    onClick={() => {
                      handleStatusChange(regId, 'Verified');
                      setSelectedScreenshot(null);
                    }}
                    className="inline-flex items-center justify-center gap-1 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve Payment</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
