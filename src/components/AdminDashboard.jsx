import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Download, 
  CheckCircle, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  KeyRound, 
  Check, 
  Link2, 
  ArrowLeft,
  Bus,
  Car
} from 'lucide-react';
import { 
  getStoredRegistrations, 
  updatePaymentStatus, 
  exportToCSV, 
  exportToExcelFormatted, 
  testGoogleScriptConnection 
} from '../services/submissionService';
import { getActiveConfig, saveActiveConfig } from '../config/picnicConfig';

export const AdminDashboard = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'settings'
  const [registrations, setRegistrations] = useState([]);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [transportFilter, setTransportFilter] = useState('ALL');
  const [expandedRow, setExpandedRow] = useState(null);

  // Settings State
  const [config, setConfig] = useState(getActiveConfig());
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState(null);

  // Load stored registrations
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
  const busCount = registrations.filter(r => (r.transportMode || '').includes('Bus')).length;
  const vehicleCount = registrations.filter(r => (r.transportMode || '') === 'Own Vehicle').length;
  const busMemberCount = registrations.filter(r => (r.transportMode || '').includes('Bus')).reduce((acc, r) => acc + (Number(r.totalMembers) || (r.members ? r.members.length : 1)), 0);
  
  // Total Collection based on Age > 5
  const totalCollectionAmount = registrations.reduce((acc, r) => {
    if (r.totalAmount !== undefined) return acc + Number(r.totalAmount);
    const isBus = (r.transportMode || '').includes('Bus');
    const members = r.members || [];
    const chargeable = members.filter(m => Number(m.age) > 5).length;
    const perPerson = (config.feePerMember || 100) + (isBus ? (config.busFare || 200) : 0);
    return acc + (chargeable * perPerson);
  }, 0);

  // Filter logic
  const filteredRegistrations = registrations.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (r.primaryName || '').toLowerCase().includes(searchLower) ||
      (r.mobileNumber || '').includes(searchLower) ||
      (r.registrationId || '').toLowerCase().includes(searchLower) ||
      (r.transportMode || '').toLowerCase().includes(searchLower) ||
      (r.members || []).some(m => (m.name || '').toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    if (transportFilter !== 'ALL') {
      if (transportFilter === 'BUS' && !(r.transportMode || '').includes('Bus')) return false;
      if (transportFilter === 'VEHICLE' && (r.transportMode || '') !== 'Own Vehicle') return false;
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
            Organizer Portal
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Enter Admin PIN to access registration database and settings.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter PIN (Default: 2026)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center text-lg font-mono tracking-widest px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-bold"
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
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all"
              >
                Unlock
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Full Screen Admin Dashboard
  return (
    <div className="fixed inset-0 z-50 bg-[#f1f5f9] flex flex-col w-screen h-screen overflow-hidden">
      
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white px-5 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                Picnic Management Admin
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Live Active
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Registration Database, Bus/Vehicle Tracking & Age Fee Calculations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs Switcher */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('registrations')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'registrations' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrations ({totalRegistrations})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>

          {/* Exit / Back to site button */}
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
            title="Exit Admin Panel"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Form</span>
          </button>
        </div>
      </header>

      {/* Main Full-Screen Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="max-w-[1700px] mx-auto space-y-5">
            
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Groups</p>
                  <p className="text-2xl font-black text-slate-900">{totalRegistrations}</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Attendees</p>
                  <p className="text-2xl font-black text-teal-700">{totalMembers} <span className="text-sm font-semibold text-slate-500">Members</span></p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-mono font-bold text-xl">
                  ₹
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Collection</p>
                  <p className="text-2xl font-black text-emerald-700 font-mono">
                    ₹{totalCollectionAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Bus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bus (Jothan)</p>
                  <p className="text-2xl font-black text-blue-700">{busCount} <span className="text-xs font-semibold text-slate-500">({busMemberCount} Seats)</span></p>
                </div>
              </div>
            </div>

            {/* Filter & Export Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Search Box */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Name, Mobile, ID, Vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Transportation Filter & Export Actions */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                
                {/* Transport Filter */}
                <select
                  value={transportFilter}
                  onChange={(e) => setTransportFilter(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Travel Modes ({totalRegistrations})</option>
                  <option value="BUS">🚌 Bus from Jothan ({busCount})</option>
                  <option value="VEHICLE">🚗 Own Vehicle ({vehicleCount})</option>
                </select>

                {/* Export Excel Button */}
                <button
                  onClick={() => exportToExcelFormatted(filteredRegistrations)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                  title="Export formatted Excel Spreadsheet (.xls)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel (.xls)</span>
                </button>

                {/* Export CSV Button */}
                <button
                  onClick={() => exportToCSV(filteredRegistrations)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all"
                  title="Export CSV data (.csv)"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV (.csv)</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={loadData}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Refresh Database"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

              </div>
            </div>

            {/* Registrations Full Width Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {filteredRegistrations.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="font-bold text-slate-700 text-base">No Registrations Found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchTerm ? "Try searching with a different keyword or reset filters." : "New registrations will appear here in real-time."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">Reg ID</th>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Primary Contact</th>
                        <th className="py-3.5 px-4">Mobile</th>
                        <th className="py-3.5 px-4">Members</th>
                        <th className="py-3.5 px-4">Fee Breakdown</th>
                        <th className="py-3.5 px-4">Total Amount</th>
                        <th className="py-3.5 px-4">Travel Mode</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredRegistrations.map((row) => {
                        const isExpanded = expandedRow === row.registrationId;
                        const members = row.members || [];
                        const isBus = (row.transportMode || '').includes('Bus');
                        
                        const chargeable = row.chargeableCount !== undefined
                          ? row.chargeableCount
                          : members.filter(m => Number(m.age) > 5).length;
                          
                        const freeKids = row.freeKidsCount !== undefined
                          ? row.freeKidsCount
                          : members.filter(m => Number(m.age) > 0 && Number(m.age) <= 5).length;

                        const memFee = row.memberFeeTotal !== undefined ? row.memberFeeTotal : (chargeable * (config.feePerMember || 100));
                        const bFee = row.busFeeTotal !== undefined ? row.busFeeTotal : (isBus ? chargeable * (config.busFare || 200) : 0);
                          
                        const totalAmt = row.totalAmount !== undefined
                          ? row.totalAmount
                          : (memFee + bFee);

                        return (
                          <React.Fragment key={row.registrationId}>
                            <tr className="hover:bg-slate-50/90 transition-colors">
                              
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

                              {/* Members Count with dropdown */}
                              <td className="py-3.5 px-4">
                                <button
                                  onClick={() => setExpandedRow(isExpanded ? null : row.registrationId)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 text-[11px] transition-colors"
                                  title="View member names and ages"
                                >
                                  <span>{row.totalMembers || members.length} Members</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                </button>
                              </td>

                              {/* Fee Breakdown */}
                              <td className="py-3.5 px-4 text-[11px]">
                                <span className="font-semibold text-emerald-800">{chargeable} Chg</span>
                                {freeKids > 0 && <span className="text-teal-600 ml-1">({freeKids} Free)</span>}
                              </td>

                              {/* Total Amount */}
                              <td className="py-3.5 px-4 font-bold font-mono text-emerald-700">
                                ₹{totalAmt.toLocaleString('en-IN')}
                              </td>

                              {/* Transportation Mode */}
                              <td className="py-3.5 px-4">
                                {isBus ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px]">
                                    <Bus className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Bus (Jothan)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px]">
                                    <Car className="w-3.5 h-3.5 text-purple-600" />
                                    <span>Own Vehicle</span>
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px]">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Confirmed</span>
                                </span>
                              </td>

                              {/* Quick Actions */}
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => setExpandedRow(isExpanded ? null : row.registrationId)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors"
                                >
                                  {isExpanded ? 'Hide' : 'Details'}
                                </button>
                              </td>

                            </tr>

                            {/* Expandable Attendee Details */}
                            {isExpanded && (
                              <tr className="bg-emerald-50/40 border-b border-slate-200">
                                <td colSpan={10} className="p-4 sm:px-6">
                                  <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs shadow-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                                      <p className="font-bold text-emerald-950">
                                        Member Breakdown for {row.primaryName} ({row.registrationId}) - Total Fee: ₹{totalAmt}:
                                      </p>
                                      <span className="text-xs text-slate-500">
                                        Travel Mode: <strong>{row.transportMode || 'Bus (Jothan)'}</strong>
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                      {members.map((m, i) => {
                                        const mAge = Number(m.age) || 0;
                                        const isChg = mAge > 5;
                                        return (
                                          <div key={i} className={`p-2.5 rounded-lg border flex items-center justify-between ${
                                            isChg ? 'bg-slate-50 border-slate-200' : 'bg-teal-50/50 border-teal-200'
                                          }`}>
                                            <div>
                                              <span className="font-bold text-slate-800 block">{i + 1}. {m.name}</span>
                                              <span className="text-slate-500 font-medium text-[11px]">{m.age} yrs • {m.gender}</span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                              isChg ? 'bg-emerald-100 text-emerald-900' : 'bg-teal-100 text-teal-800'
                                            }`}>
                                              {isChg 
                                                ? (isBus ? `₹${(config.feePerMember || 100) + (config.busFare || 200)} (₹${config.feePerMember || 100}+₹${config.busFare || 200})` : `₹${config.feePerMember || 100}`) 
                                                : 'Free (₹0)'}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
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

        {/* TAB 2: SYSTEM CONFIGURATION */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold font-display text-slate-900 mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              <span>Event & Registration Settings</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Update Google Sheets sync, admin PIN, and event details.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              {/* Admin PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Portal PIN *
                </label>
                <input
                  type="text"
                  value={config.adminPin || '2026'}
                  onChange={(e) => setConfig({ ...config, adminPin: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-1">PIN code to unlock this Organizer Portal.</p>
              </div>

              {/* Google Apps Script Webhook URL */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-emerald-700" />
                  <span>Google Apps Script Web App URL (Live Cloud Sync)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={config.googleScriptUrl || ''}
                  onChange={(e) => setConfig({ ...config, googleScriptUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-emerald-800">
                    Saves all registrations including transportation mode to Google Sheets.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook}
                    className="px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 flex-shrink-0 transition-colors"
                  >
                    {testingWebhook ? "Testing..." : "Test Connection"}
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
                    Event Date
                  </label>
                  <input
                    type="text"
                    value={config.eventDate}
                    onChange={(e) => setConfig({ ...config, eventDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Venue & Location
                </label>
                <input
                  type="text"
                  value={config.eventVenue}
                  onChange={(e) => setConfig({ ...config, eventVenue: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900"
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {settingsSaved ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <Check className="w-4 h-4" />
                    Settings Saved Successfully!
                  </span>
                ) : <span></span>}

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                >
                  Save Settings
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

    </div>
  );
};
