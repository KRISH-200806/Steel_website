import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Users,
  Bus,
  Car,
  Plus,
  Trash2,
  PhoneCall,
  AlertTriangle
} from 'lucide-react';
import { getActiveConfig } from './config/picnicConfig';
import { submitRegistration } from './services/submissionService';
import { AdminDashboard } from './components/AdminDashboard';
import { SuccessModal } from './components/SuccessModal';

export default function App() {
  const [config, setConfig] = useState(getActiveConfig());
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Primary Contact State (Member 1 - Main Person)
  const [primaryName, setPrimaryName] = useState('');
  const [primaryAge, setPrimaryAge] = useState('');
  const [primaryGender, setPrimaryGender] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [transportMode, setTransportMode] = useState(''); // 'Bus (Jothan)' | 'Own Vehicle'

  // Additional Accompanying Members State (Member 2, 3, etc.)
  const [additionalMembers, setAdditionalMembers] = useState([]);

  // UI States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Add new additional member
  const handleAddMember = () => {
    if (additionalMembers.length < 25) {
      setAdditionalMembers(prev => [...prev, { name: '', age: '', gender: '' }]);
    }
  };

  // Remove an additional member
  const handleRemoveMember = (index) => {
    setAdditionalMembers(prev => prev.filter((_, idx) => idx !== index));
    if (errors.members?.[index]) {
      setErrors(prev => {
        const next = { ...prev };
        const memberErrs = { ...next.members };
        delete memberErrs[index];
        next.members = memberErrs;
        return next;
      });
    }
  };

  // Update additional member field
  const handleMemberFieldChange = (index, field, value) => {
    setAdditionalMembers(prev => {
      const list = [...prev];
      list[index] = { ...list[index], [field]: value };
      return list;
    });
    if (errors.members?.[index]?.[field]) {
      setErrors(prev => {
        const next = { ...prev };
        const memberErrs = { ...next.members };
        delete memberErrs[index][field];
        next.members = memberErrs;
        return next;
      });
    }
  };

  // Pricing constants
  const feePerMember = config.feePerMember || 100;
  const busFare = config.busFare || 200;
  const isBus = transportMode === 'Bus (Jothan)';

  // Build unified member list (Primary Person + Additional Members)
  const allMembersList = [
    {
      name: primaryName.trim(),
      age: primaryAge,
      gender: primaryGender,
      isPrimary: true
    },
    ...additionalMembers.map(m => ({
      name: (m.name || '').trim(),
      age: m.age,
      gender: m.gender,
      isPrimary: false
    }))
  ];

  const totalMembersCount = 1 + additionalMembers.length;

  // Calculate chargeable (>5 years) vs free (<=5 years) for all members including primary
  const pAgeNum = parseInt(primaryAge, 10);
  const isPrimaryChargeable = !isNaN(pAgeNum) && pAgeNum > 5;
  const isPrimaryFree = !isNaN(pAgeNum) && pAgeNum > 0 && pAgeNum <= 5;

  const addChargeableCount = additionalMembers.filter(m => {
    const a = parseInt(m.age, 10);
    return !isNaN(a) && a > 5;
  }).length;

  const addFreeCount = additionalMembers.filter(m => {
    const a = parseInt(m.age, 10);
    return !isNaN(a) && a > 0 && a <= 5;
  }).length;

  const chargeableCount = (isPrimaryChargeable ? 1 : 0) + addChargeableCount;
  const freeKidsCount = (isPrimaryFree ? 1 : 0) + addFreeCount;

  // Separate Fee Calculations (Only for age > 5)
  const memberFeeTotal = chargeableCount * feePerMember;
  const busFeeTotal = isBus ? (chargeableCount * busFare) : 0;
  const totalPayableAmount = memberFeeTotal + busFeeTotal;

  // Form Validation in Gujarati
  const validateForm = () => {
    const errs = {};
    if (!primaryName.trim()) {
      errs.primaryName = "કૃપા કરીને મુખ્ય વ્યક્તિનું નામ લખો.";
    }
    const pAge = parseInt(primaryAge, 10);
    if (!primaryAge || isNaN(pAge) || pAge <= 0 || pAge > 120) {
      errs.primaryAge = "કૃપા કરીને સાચી ઉંમર (૧ થી ૧૨૦) લખો.";
    }
    if (!primaryGender) {
      errs.primaryGender = "કૃપા કરીને જાતિ પસંદ કરો.";
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      errs.mobileNumber = "કૃપા કરીને ૧૦ આંકડાનો સાચો મોબાઈલ નંબર લખો.";
    }
    if (!transportMode) {
      errs.transportMode = "કૃપા કરીને મુસાફરીનું માધ્યમ (બસ અથવા પોતાનું વાહન) પસંદ કરો.";
    }

    const memberErrs = {};
    let hasMemberErrors = false;
    additionalMembers.forEach((m, idx) => {
      const mErr = {};
      if (!m.name?.trim()) { mErr.name = "સભ્યનું પૂરું નામ લખવું જરૂરી છે."; hasMemberErrors = true; }
      const ageNum = parseInt(m.age, 10);
      if (!m.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) { mErr.age = "સાચી ઉંમર લખો."; hasMemberErrors = true; }
      if (!m.gender) { mErr.gender = "જાતિ પસંદ કરો."; hasMemberErrors = true; }
      if (Object.keys(mErr).length > 0) memberErrs[idx] = mErr;
    });
    if (hasMemberErrors) errs.members = memberErrs;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        primaryName: primaryName.trim(),
        primaryAge: parseInt(primaryAge, 10),
        primaryGender,
        mobileNumber: mobileNumber.trim(),
        transportMode,
        totalMembers: totalMembersCount,
        chargeableCount,
        freeKidsCount,
        totalAmount: totalPayableAmount,
        members: allMembersList
      };

      const res = await submitRegistration(payload);
      if (res?.success) {
        setSubmissionResult(res);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("રજીસ્ટ્રેશન પૂર્ણ થઈ શક્યું નથી. કૃપા કરીને ફરી પ્રયાસ કરો.");
      }
    } catch (err) {
      console.error(err);
      alert("સબમિટ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setPrimaryName('');
    setPrimaryAge('');
    setPrimaryGender('');
    setMobileNumber('');
    setTransportMode('');
    setAdditionalMembers([]);
    setErrors({});
    setSubmissionResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans antialiased pb-12">

      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              🛕
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                {config.eventName || "શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા - 2026"}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                {config.eventTagline || "ભગવાનના સાનિધ્યમાં આનંદની 1 દિવસીય સત્સંગ યાત્રા"}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            નોંધણી પોર્ટલ
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-5">

        {submissionResult ? (
          <SuccessModal
            result={submissionResult}
            formData={{
              primaryName,
              primaryAge,
              primaryGender,
              mobileNumber,
              transportMode,
              members: allMembersList,
              totalMembers: totalMembersCount,
              chargeableCount,
              freeKidsCount,
              memberFeeTotal,
              busFeeTotal,
              totalAmount: totalPayableAmount
            }}
            config={config}
            onReset={handleReset}
          />
        ) : (
          <div>
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* SECTION 1: મુખ્ય વ્યક્તિની વિગતો */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>મુખ્ય વ્યક્તિની વિગતો</span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">સભ્ય ૧</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      મુખ્ય વ્યક્તિનું નામ આપોઆપ સભ્યોની યાદી અને રસીદમાં સામેલ થશે.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                      મુખ્ય વ્યક્તિનું પૂરું નામ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ઉદા. રમેશભાઈ પટેલ"
                      value={primaryName}
                      onChange={(e) => {
                        setPrimaryName(e.target.value);
                        if (errors.primaryName) setErrors(prev => ({ ...prev, primaryName: null }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${errors.primaryName ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                        }`}
                    />
                    {errors.primaryName && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.primaryName}</p>}
                  </div>

                  {/* Age & Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                          ઉંમર (વર્ષ) <span className="text-rose-500">*</span>
                        </label>
                        {primaryAge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${Number(primaryAge) > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                            {Number(primaryAge) > 5 
                              ? (isBus ? `₹${feePerMember + busFare} (ફી ₹${feePerMember} + બસ ₹${busFare})` : `₹${feePerMember}`) 
                              : 'મફત (₹૦)'}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="ઉંમર"
                        value={primaryAge}
                        onChange={(e) => {
                          setPrimaryAge(e.target.value);
                          if (errors.primaryAge) setErrors(prev => ({ ...prev, primaryAge: null }));
                        }}
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${errors.primaryAge ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                          }`}
                      />
                      {errors.primaryAge && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.primaryAge}</p>}
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                        જાતિ / લિંગ <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={primaryGender}
                        onChange={(e) => {
                          setPrimaryGender(e.target.value);
                          if (errors.primaryGender) setErrors(prev => ({ ...prev, primaryGender: null }));
                        }}
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 ${errors.primaryGender ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                          }`}
                      >
                        <option value="">જાતિ પસંદ કરો</option>
                        <option value="Male">પુરુષ</option>
                        <option value="Female">સ્ત્રી</option>
                        <option value="Other">અન્ય</option>
                      </select>
                      {errors.primaryGender && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.primaryGender}</p>}
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                      મોબાઈલ નંબર <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:border-emerald-500">
                      <div className="bg-slate-50 px-3.5 py-2.5 border-r border-slate-300 text-slate-700 font-semibold text-sm flex items-center">
                        +91
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="૧૦ આંકડાનો મોબાઈલ નંબર"
                        value={mobileNumber}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setMobileNumber(clean);
                          if (errors.mobileNumber) setErrors(prev => ({ ...prev, mobileNumber: null }));
                        }}
                        className="w-full px-3.5 py-2.5 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    {errors.mobileNumber ? (
                      <p className="text-xs font-semibold text-rose-600 mt-1">{errors.mobileNumber}</p>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1">૧૦ આંકડાનો સાચો મોબાઈલ નંબર લખવો.</p>
                    )}
                  </div>

                  {/* Transportation Mode */}
                  <div className="pt-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                      મુસાફરીનું માધ્યમ (વાહનની વિગત) <span className="text-rose-500">*</span>
                    </label>

                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl mb-3 flex items-start gap-2">
                      <Bus className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-950 font-bold leading-relaxed">
                        નોંધ: જોથાણ થી બસની વ્યવસ્થા કરેલી છે, તેમાં બસભાડુ - ₹{busFare}/- પ્રતિ વ્યક્તિ રહેશે.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        onClick={() => {
                          setTransportMode('Bus (Jothan)');
                          if (errors.transportMode) setErrors(prev => ({ ...prev, transportMode: null }));
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${transportMode === 'Bus (Jothan)'
                          ? 'bg-emerald-50/90 border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="transportMode"
                          value="Bus (Jothan)"
                          checked={transportMode === 'Bus (Jothan)'}
                          onChange={(e) => setTransportMode(e.target.value)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block flex items-center gap-1.5">
                            <Bus className="w-4 h-4 text-emerald-700" />
                            <span>બસમાં (જોથાણથી બસ સુવિધા)</span>
                          </span>
                          <span className="text-[11px] text-slate-500">બસભાડુ: ₹{busFare}/- પ્રતિ વ્યક્તિ</span>
                        </div>
                      </label>

                      <label
                        onClick={() => {
                          setTransportMode('Own Vehicle');
                          if (errors.transportMode) setErrors(prev => ({ ...prev, transportMode: null }));
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${transportMode === 'Own Vehicle'
                          ? 'bg-emerald-50/90 border-emerald-600 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="transportMode"
                          value="Own Vehicle"
                          checked={transportMode === 'Own Vehicle'}
                          onChange={(e) => setTransportMode(e.target.value)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 block flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-teal-700" />
                            <span>પોતાનું વાહન</span>
                          </span>
                          <span className="text-[11px] text-slate-500">પોતાની રીતે આવવાનું રહેશે</span>
                        </div>
                      </label>
                    </div>
                    {errors.transportMode && <p className="text-xs font-semibold text-rose-600 mt-1.5">{errors.transportMode}</p>}
                  </div>

                </div>
              </div>

              {/* SECTION 2: સાથે આવનાર અન્ય સભ્યોની વિગતો */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      સાથે આવનાર અન્ય સભ્યોની વિગતો
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      જો પરિવાર કે ગ્રૂપના અન્ય સભ્યો સાથે આવવાના હોય તો નીચે ઉમેરો.
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    કુલ સભ્યો: {totalMembersCount}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Dynamic Member Cards */}
                  {additionalMembers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                      <p className="text-xs text-slate-500">
                        હાલ ફક્ત મુખ્ય વ્યક્તિ (૧ સભ્ય) નોંધાયેલ છે. જો બીજા સભ્યો ઉમેરવા હોય તો નીચેના બટન પર ક્લિક કરો.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>અન્ય સભ્ય ઉમેરો</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {additionalMembers.map((member, index) => {
                        const mErr = errors.members?.[index] || {};
                        const memberAgeNum = Number(member.age) || 0;
                        const hasAge = Boolean(member.age);
                        const isChargeable = memberAgeNum > 5;

                        return (
                          <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                                  {index + 2}
                                </span>
                                <span className="font-bold text-sm text-slate-900">
                                  સભ્ય {index + 2}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {hasAge && (
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isChargeable ? 'bg-emerald-100 text-emerald-900' : 'bg-teal-100 text-teal-900'
                                    }`}>
                                    {isChargeable 
                                      ? (isBus ? `ચાર્જ: ₹${feePerMember + busFare} (ફી ₹${feePerMember} + બસ ₹${busFare})` : `ચાર્જ: ₹${feePerMember}`) 
                                      : '👶 મફત (₹૦)'}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(index)}
                                  className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="સભ્ય હટાવો"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                સભ્યનું પૂરું નામ <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="સભ્યનું પૂરું નામ લખો"
                                value={member.name}
                                onChange={(e) => handleMemberFieldChange(index, 'name', e.target.value)}
                                className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none ${mErr.name ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                                  }`}
                              />
                              {mErr.name && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{mErr.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  ઉંમર (વર્ષ) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="120"
                                  placeholder="ઉંમર"
                                  value={member.age}
                                  onChange={(e) => handleMemberFieldChange(index, 'age', e.target.value)}
                                  className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none ${mErr.age ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                                    }`}
                                />
                                {mErr.age && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{mErr.age}</p>}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  જાતિ / લિંગ <span className="text-rose-500">*</span>
                                </label>
                                <select
                                  value={member.gender}
                                  onChange={(e) => handleMemberFieldChange(index, 'gender', e.target.value)}
                                  className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:outline-none ${mErr.gender ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                                    }`}
                                >
                                  <option value="">જાતિ પસંદ કરો</option>
                                  <option value="Male">પુરુષ</option>
                                  <option value="Female">સ્ત્રી</option>
                                  <option value="Other">અન્ય</option>
                                </select>
                                {mErr.gender && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{mErr.gender}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={handleAddMember}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                      >
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <span>વધુ સભ્ય ઉમેરો</span>
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* SECTION 3: અગત્યની નોંધ */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 mb-1 border-b border-slate-100">
                  <h2 className="text-base sm:text-md font-bold text-slate-900 flex items-center gap-2">
                    <span>અગત્યની નોંધ</span>
                    <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">વિભાગ ૩ (૩ માંથી)</span>
                  </h2>
                </div>

                <div className="space-y-3.5">
                  <p className="text-base sm:text-md font-bold text-slate-900 leading-snug">
                    📌 તા. 16 - 09 - 2026 પહેલાં રસીદના રૂપિયા અલ્પેશભાઈ વેગડ પાસે જમા કરાવી દેવા.
                  </p>

                  <div className="flex items-center gap-2 text-base sm:text-md font-bold text-slate-800">
                    <PhoneCall className="w-5 h-5 text-slate-700 flex-shrink-0" />
                    <span>કોન્ટેક્ટ નંબર :</span>
                    <a
                      href="tel:7600312101"
                      className="font-mono text-base sm:text-md font-extrabold text-slate-950 hover:underline"
                    >
                      76003 12101
                    </a>
                  </div>

                  <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-700 font-bold text-base sm:text-md leading-snug shadow-xs">
                    ⚠️ તા. 16 - 09 - 2026 પહેલાં યાત્રાના પૈસા જે હરિભક્તે જમા નહીં કરાવ્યા હોય એમને યાત્રામાં લઈ જવામાં આવશે નહીં.
                  </div>                </div>
              </div>

              {/* SUBMIT BUTTON & LIVE PRICE SUMMARY BAR */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800 gap-2">
                  <span>મુખ્ય વ્યક્તિ: <strong className="text-white">{primaryName || '—'}</strong></span>
                  <span>વાહન: <strong className="text-white">{transportMode === 'Bus (Jothan)' ? 'બસ (જોથાણથી)' : transportMode === 'Own Vehicle' ? 'પોતાનું વાહન' : '—'}</strong></span>
                </div>

                {/* Calculation Detail */}
                <div className="space-y-1.5 text-xs text-slate-300 py-1">
                  <div className="flex items-center justify-between">
                    <span>કુલ નોંધાયેલા સભ્યો (મુખ્ય વ્યક્તિ સહિત):</span>
                    <strong className="text-white">{totalMembersCount} વ્યક્તિ</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>સભ્ય ફી (૫ વર્ષથી મોટા - ₹{feePerMember} × {chargeableCount}):</span>
                    <span className="text-emerald-400 font-bold">₹{memberFeeTotal}</span>
                  </div>
                  {isBus && (
                    <div className="flex items-center justify-between">
                      <span>બસ ભાડું (૫ વર્ષથી મોટા - ₹{busFare} × {chargeableCount}):</span>
                      <span className="text-emerald-400 font-bold">₹{busFeeTotal}</span>
                    </div>
                  )}
                  {freeKidsCount > 0 && (
                    <div className="flex items-center justify-between text-teal-300">
                      <span>૫ વર્ષ કે તેથી નાના બાળકો (મફત):</span>
                      <span className="font-bold">{freeKidsCount} બાળકો (₹૦)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">કુલ ચૂકવવાપાત્ર રકમ (યાત્રા ફી + બસ ભાડું)</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">
                        ₹{totalPayableAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-emerald-300 font-semibold bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-800/80">
                    <span>✓ રસીદ સાથે સબમિટ થશે</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${isSubmitting ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.99]'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>રજીસ્ટ્રેશન સબમિટ થઈ રહ્યું છે...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-emerald-200" />
                      <span>રજીસ્ટ્રેશન કન્ફર્મ કરો અને રસીદ મેળવો</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

      {/* Footer with organizer login */}
      <footer className="max-w-2xl mx-auto px-4 mt-8 text-center text-xs text-slate-400">
        <p>© ૨૦૨૬ શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા કમિટી</p>
        <button
          type="button"
          onClick={() => setIsAdminOpen(true)}
          className="mt-1 text-[11px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
        >
          ઓર્ગેનાઈઝર લોગિન
        </button>
      </footer>

      {/* Admin Dashboard Modal */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => {
            setIsAdminOpen(false);
            setConfig(getActiveConfig());
          }}
        />
      )}

    </div>
  );
}
