import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Lock,
  Users,
  Bus,
  Car
} from 'lucide-react';
import { getActiveConfig } from './config/picnicConfig';
import { submitRegistration } from './services/submissionService';
import { AdminDashboard } from './components/AdminDashboard';
import { SuccessModal } from './components/SuccessModal';

export default function App() {
  const [config, setConfig] = useState(getActiveConfig());
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Primary Contact State
  const [primaryName, setPrimaryName] = useState('');
  const [primaryAge, setPrimaryAge] = useState('');
  const [primaryGender, setPrimaryGender] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [transportMode, setTransportMode] = useState(''); // 'Bus (Jothan)' | 'Own Vehicle'
  
  // Dynamic Members State
  const [memberCount, setMemberCount] = useState(1);
  const [members, setMembers] = useState([{ name: '', age: '', gender: '' }]);

  // UI States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Quick autofill Member 1 from Primary Contact
  const handleAutoFillMember1 = () => {
    setMembers(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = { name: primaryName.trim(), age: primaryAge, gender: primaryGender };
      }
      return updated;
    });
  };

  // Adjust dynamic members count
  const handleMemberCountChange = (count) => {
    const valid = Math.max(1, Math.min(30, count));
    setMemberCount(valid);
    setMembers(prev => {
      const list = [...prev];
      if (valid > list.length) {
        for (let i = list.length; i < valid; i++) {
          list.push({ name: '', age: '', gender: '' });
        }
      } else if (valid < list.length) {
        list.splice(valid);
      }
      return list;
    });
  };

  // Update dynamic member field
  const handleMemberFieldChange = (index, field, value) => {
    setMembers(prev => {
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

  // Live fee calculation
  const feePerMember = config.feePerMember || 100;
  
  const chargeableCount = members.filter(m => {
    const a = parseInt(m.age, 10);
    return !isNaN(a) && a > 5;
  }).length;

  const freeKidsCount = members.filter(m => {
    const a = parseInt(m.age, 10);
    return !isNaN(a) && a > 0 && a <= 5;
  }).length;

  const totalPayableAmount = chargeableCount * feePerMember;

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
      errs.transportMode = "કૃપા કરીને બસ અથવા પોતાના વાહનનો વિકલ્પ પસંદ કરો.";
    }

    const memberErrs = {};
    let hasMemberErrors = false;
    members.forEach((m, idx) => {
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
        primaryName,
        primaryAge,
        primaryGender,
        mobileNumber,
        transportMode,
        totalMembers: memberCount,
        chargeableCount,
        freeKidsCount,
        totalAmount: totalPayableAmount,
        members
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
    setMemberCount(1);
    setMembers([{ name: '', age: '', gender: '' }]);
    setErrors({});
    setSubmissionResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] text-slate-800 font-sans antialiased pb-12">
      
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              🌴
            </div>
            <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
              ૧-દિવસીય પિકનિક રજીસ્ટ્રેશન
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        
        {submissionResult ? (
          <SuccessModal
            result={submissionResult}
            formData={{ 
              primaryName, 
              primaryAge, 
              primaryGender, 
              mobileNumber, 
              transportMode, 
              members, 
              totalMembers: memberCount,
              chargeableCount,
              freeKidsCount,
              totalAmount: totalPayableAmount
            }}
            config={config}
            onReset={handleReset}
          />
        ) : (
          <div>
            {/* Gujarati Important Deadline Notice */}
            <div className="bg-amber-50 border-2 border-amber-400/90 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-950 text-sm sm:text-base leading-snug">
                  📌 નોંધ: 16/09/2026 પહેલાં જ ફોર્મ રજીસ્ટર કરી લેવું, પછી ફોર્મ લેવામાં આવશે નહીં.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              
              {/* SECTION 1: મુખ્ય સંપર્ક વિગતો */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    મુખ્ય સંપર્ક વ્યક્તિની વિગતો
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">વિભાગ ૧ (૨ માંથી)</span>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                      મુખ્ય વ્યક્તિનું નામ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="પૂરું નામ લખો"
                      value={primaryName}
                      onChange={(e) => {
                        setPrimaryName(e.target.value);
                        if (errors.primaryName) setErrors(prev => ({ ...prev, primaryName: null }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        errors.primaryName ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                      }`}
                    />
                    {errors.primaryName && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.primaryName}</p>}
                  </div>

                  {/* Age & Gender */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                          ઉંમર <span className="text-rose-500">*</span>
                        </label>
                        {primaryAge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            Number(primaryAge) > 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {Number(primaryAge) > 5 ? '₹૧૦૦' : 'મફત (₹૦)'}
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
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                          errors.primaryAge ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
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
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 ${
                          errors.primaryGender ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
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

                  {/* Transportation Mode (Bus from Jothan or Own Vehicle) */}
                  <div className="pt-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                      મુસાફરીનું માધ્યમ (વાહનની વિગત) <span className="text-rose-500">*</span>
                    </label>
                    <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl mb-3 flex items-start gap-2">
                      <Bus className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                        નોંધ: જોથાણ (Jothan) થી બસની વ્યવસ્થા કરવામાં આવેલ છે.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label 
                        onClick={() => {
                          setTransportMode('Bus (Jothan)');
                          if (errors.transportMode) setErrors(prev => ({ ...prev, transportMode: null }));
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          transportMode === 'Bus (Jothan)' 
                            ? 'bg-emerald-50/80 border-emerald-600 shadow-xs' 
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
                          <span className="text-[11px] text-slate-500">જોથાણથી બસ ઉપડશે</span>
                        </div>
                      </label>

                      <label 
                        onClick={() => {
                          setTransportMode('Own Vehicle');
                          if (errors.transportMode) setErrors(prev => ({ ...prev, transportMode: null }));
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          transportMode === 'Own Vehicle' 
                            ? 'bg-emerald-50/80 border-emerald-600 shadow-xs' 
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

              {/* SECTION 2: સાથે આવનાર સભ્યોની વિગતો */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    સાથે આવનાર સભ્યોની વિગતો
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">વિભાગ ૨ (૨ માંથી)</span>
                </div>

                <div className="space-y-4">
                  {/* Count selector */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                      કુલ કેટલા સભ્યો પિકનિકમાં આવવાના છે? <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={memberCount}
                        onChange={(e) => handleMemberCountChange(parseInt(e.target.value) || 1)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMemberCountChange(Math.max(1, memberCount - 1))}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-base"
                          disabled={memberCount <= 1}
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMemberCountChange(memberCount + 1)}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-base"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Member Cards */}
                  <div className="space-y-3 pt-1">
                    {members.map((member, index) => {
                      const mErr = errors.members?.[index] || {};
                      const memberAgeNum = Number(member.age) || 0;
                      const hasAge = Boolean(member.age);
                      const isChargeable = memberAgeNum > 5;

                      return (
                        <div key={index} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-bold text-sm text-slate-900">
                                સભ્ય {index + 1}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {hasAge && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  isChargeable ? 'bg-emerald-100 text-emerald-900' : 'bg-teal-100 text-teal-900'
                                }`}>
                                  {isChargeable ? `ચાર્જ: ₹${feePerMember}` : '👶 મફત (₹૦)'}
                                </span>
                              )}
                              {index === 0 && primaryName.trim() && (
                                <button
                                  type="button"
                                  onClick={handleAutoFillMember1}
                                  className="text-xs text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
                                >
                                  મુખ્ય વ્યક્તિ મુજબ
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              પૂરું નામ <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="સભ્યનું પૂરું નામ લખો"
                              value={member.name}
                              onChange={(e) => handleMemberFieldChange(index, 'name', e.target.value)}
                              className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                                mErr.name ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                              }`}
                            />
                            {mErr.name && <p className="text-[11px] font-semibold text-rose-600 mt-0.5">{mErr.name}</p>}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                ઉંમર <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="120"
                                placeholder="ઉંમર (વર્ષ)"
                                value={member.age}
                                onChange={(e) => handleMemberFieldChange(index, 'age', e.target.value)}
                                className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none ${
                                  mErr.age ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
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
                                className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:outline-none ${
                                  mErr.gender ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
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
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON & LIVE PRICE SUMMARY BAR */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md space-y-3">
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800 gap-2">
                  <span>મુખ્ય વ્યક્તિ: <strong className="text-white">{primaryName || '—'}</strong></span>
                  <span>વાહન: <strong className="text-white">{transportMode === 'Bus (Jothan)' ? 'બસ (જોથાણ)' : transportMode === 'Own Vehicle' ? 'પોતાનું વાહન' : '—'}</strong></span>
                </div>

                {/* Calculation Detail */}
                <div className="space-y-1 text-xs text-slate-300 py-1">
                  <div className="flex items-center justify-between">
                    <span>કુલ સભ્યો:</span>
                    <strong className="text-white">{memberCount} વ્યક્તિ</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>૫ વર્ષથી મોટા (₹{feePerMember} પ્રતિ વ્યક્તિ):</span>
                    <span className="text-emerald-400 font-bold">{chargeableCount} વ્યક્તિ = ₹{chargeableCount * feePerMember}</span>
                  </div>
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
                      <p className="text-[11px] text-slate-400 font-semibold uppercase">કુલ ચૂકવવાપાત્ર રકમ</p>
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
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isSubmitting ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
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
        <p>© ૨૦૨૬ ૧-દિવસીય પિકનિક કમિટી</p>
        <button
          type="button"
          onClick={() => setIsAdminOpen(true)}
          className="mt-1 text-[11px] text-slate-400 hover:text-slate-600 underline"
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
