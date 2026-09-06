import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Download, 
  Lock 
} from 'lucide-react';
import { getActiveConfig } from './config/picnicConfig';
import { submitRegistration, fileToBase64 } from './services/submissionService';
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
  
  // Dynamic Members State
  const [memberCount, setMemberCount] = useState(1);
  const [members, setMembers] = useState([{ name: '', age: '', gender: '' }]);

  // Screenshot Upload State
  const [screenshotBase64, setScreenshotBase64] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [screenshotName, setScreenshotName] = useState('');

  // UI States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [previewZoomOpen, setPreviewZoomOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Cost & Payment Calculations (₹100 per member)
  const pricePerMember = config.feePerMember || 100;
  const totalAmount = memberCount * pricePerMember;
  const qrImageSrc = "/qr-code.jpeg";

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

  // Download QR Code Image reliably
  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrImageSrc);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Picnic_Payment_QR.jpeg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      const link = document.createElement('a');
      link.href = qrImageSrc;
      link.download = 'Picnic_Payment_QR.jpeg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle Payment Screenshot File
  const handleFileChange = async (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      alert("Please upload a JPG, PNG, or WEBP image / કૃપા કરીને ફોટો ફાઈલ અપલોડ કરો.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File exceeds 5MB / ફાઈલ ૫ MB કરતા નાની હોવી જોઈએ.");
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setScreenshotBase64(base64);
      setScreenshotPreview(base64);
      setScreenshotName(file.name);
      if (errors.screenshot) {
        setErrors(prev => { const n = { ...prev }; delete n.screenshot; return n; });
      }
    } catch (e) {
      console.error(e);
      alert("Error reading file / ફોટો વાંચવામાં ભૂલ આવી.");
    }
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};
    if (!primaryName.trim()) {
      errs.primaryName = "Primary contact name is required / નામ લખવું જરૂરી છે.";
    }
    const pAge = parseInt(primaryAge, 10);
    if (!primaryAge || isNaN(pAge) || pAge <= 0 || pAge > 120) {
      errs.primaryAge = "Valid age (1-120) is required / સાચી ઉંમર લખો.";
    }
    if (!primaryGender) {
      errs.primaryGender = "Please select gender / જાતિ પસંદ કરો.";
    }
    if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      errs.mobileNumber = "Enter valid 10-digit mobile / ૧૦ આંકડાનો સાચો મોબાઈલ નંબર લખો.";
    }

    const memberErrs = {};
    let hasMemberErrors = false;
    members.forEach((m, idx) => {
      const mErr = {};
      if (!m.name?.trim()) { mErr.name = "Full name is required / પૂરું નામ લખો."; hasMemberErrors = true; }
      const ageNum = parseInt(m.age, 10);
      if (!m.age || isNaN(ageNum) || ageNum <= 0 || ageNum > 120) { mErr.age = "Valid age is required / ઉંમર લખો."; hasMemberErrors = true; }
      if (!m.gender) { mErr.gender = "Select gender / જાતિ પસંદ કરો."; hasMemberErrors = true; }
      if (Object.keys(mErr).length > 0) memberErrs[idx] = mErr;
    });
    if (hasMemberErrors) errs.members = memberErrs;

    if (!screenshotBase64) {
      errs.screenshot = "Please upload payment screenshot / પેમેન્ટ સ્ક્રીનશોટ અપલોડ કરો.";
    }
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
        totalMembers: memberCount,
        pricePerMember,
        totalAmount,
        members,
        screenshotBase64,
        screenshotFileName: screenshotName || `payment_${Date.now()}.jpg`,
        screenshotPreview
      };
      const res = await submitRegistration(payload);
      if (res?.success) {
        setSubmissionResult(res);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Registration could not be completed / રજીસ્ટ્રેશન થઈ શક્યું નથી.");
      }
    } catch (err) {
      console.error(err);
      alert("Submission error / સબમિટ કરવામાં ભૂલ આવી.");
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
    setMemberCount(1);
    setMembers([{ name: '', age: '', gender: '' }]);
    setScreenshotBase64('');
    setScreenshotPreview('');
    setScreenshotName('');
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
            <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight flex items-center flex-wrap gap-1 sm:gap-2">
              <span>1-Day Picnic Registration</span>
              <span className="text-emerald-700 font-semibold text-xs sm:text-sm">/ ૧-દિવસીય પિકનિક રજીસ્ટ્રેશન</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        
        {submissionResult ? (
          <SuccessModal
            result={submissionResult}
            formData={{ primaryName, primaryAge, primaryGender, mobileNumber, members, totalMembers: memberCount, totalAmount }}
            config={config}
            onReset={handleReset}
          />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* SECTION 1: PRIMARY CONTACT */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Primary contact / મુખ્ય સંપર્ક વિગતો
                </h2>
                <span className="text-xs text-slate-400 font-medium">Section 1 of 4</span>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    Primary contact name / મુખ્ય સંપર્ક વ્યક્તિનું નામ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Full name / પૂરું નામ"
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
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                      Age / ઉંમર <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Age / ઉંમર"
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
                      Gender / જાતિ <span className="text-rose-500">*</span>
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
                      <option value="">Select / પસંદ કરો</option>
                      <option value="Male">Male / પુરૂષ</option>
                      <option value="Female">Female / સ્ત્રી</option>
                      <option value="Other">Other / અન્ય</option>
                    </select>
                    {errors.primaryGender && <p className="text-xs font-semibold text-rose-600 mt-1">{errors.primaryGender}</p>}
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    Mobile number / મોબાઈલ નંબર <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-300 focus-within:border-emerald-500">
                    <div className="bg-slate-50 px-3.5 py-2.5 border-r border-slate-300 text-slate-700 font-semibold text-sm flex items-center">
                      +91
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile / ૧૦ આંકડાનો મોબાઈલ"
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
                    <p className="text-[11px] text-slate-500 mt-1">10-digit Indian mobile number only / ૧૦ આંકડાનો મોબાઈલ નંબર.</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: WHO IS COMING */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Who is coming / સાથે આવનાર સભ્યોની વિગતો
                </h2>
                <span className="text-xs text-slate-400 font-medium">Section 2 of 4</span>
              </div>

              <div className="space-y-4">
                {/* Count selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                    How many members are attending? / કેટલા સભ્યો પિકનિકમાં આવવાના છે? <span className="text-rose-500">*</span>
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
                    return (
                      <div key={index} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="font-bold text-sm text-slate-900">
                              Member {index + 1} / સભ્ય {index + 1}
                            </span>
                          </div>
                          {index === 0 && primaryName.trim() && (
                            <button
                              type="button"
                              onClick={handleAutoFillMember1}
                              className="text-xs text-emerald-700 font-semibold hover:underline bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"
                            >
                              Same as Primary / મુખ્ય વ્યક્તિ મુજબ
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full name / પૂરું નામ <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Full name / પૂરું નામ"
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
                              Age / ઉંમર <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Age / ઉંમર"
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
                              Gender / જાતિ <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={member.gender}
                              onChange={(e) => handleMemberFieldChange(index, 'gender', e.target.value)}
                              className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 focus:outline-none ${
                                mErr.gender ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 focus:border-emerald-500'
                              }`}
                            >
                              <option value="">Select / પસંદ કરો</option>
                              <option value="Male">Male / પુરૂષ</option>
                              <option value="Female">Female / સ્ત્રી</option>
                              <option value="Other">Other / અન્ય</option>
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

            {/* SECTION 3: PAYMENT DETAILS & QR CODE (UPI ID Removed, Custom QR Image, ₹100 Fee) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Payment details / પેમેન્ટ વિગતો
                </h2>
                <span className="text-xs text-slate-400 font-medium">Section 3 of 4</span>
              </div>

              <div className="space-y-4">
                {/* Total amount banner */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">
                      Total Members / કુલ સભ્યો: <strong>{memberCount}</strong> × ₹{pricePerMember}
                    </p>
                    <p className="text-[11px] text-emerald-700">કૃપા કરીને નીચે આપેલા QR કોડ પર પેમેન્ટ કરો</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Total / કુલ રકમ</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-700">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  {/* QR Image Box */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <img 
                      src={qrImageSrc} 
                      alt="Picnic Payment QR Code" 
                      className="w-52 h-52 object-contain rounded-lg block"
                    />
                    <span className="text-xs font-bold text-slate-700 mt-2 text-center">
                      Scan to Pay: <strong className="text-emerald-700 text-sm">₹{totalAmount.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>

                  {/* QR Download Action */}
                  <div className="space-y-3 w-full sm:w-auto flex-1 text-center sm:text-left">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Scan & Pay / સ્કેન કરીને પેમેન્ટ કરો
                      </p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Google Pay, PhonePe, Paytm અથવા કોઈપણ UPI એપથી આ QR કોડ સ્કેન કરી ₹{totalAmount.toLocaleString('en-IN')} નું પેમેન્ટ કરો.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR Code / ક્યુઆર કોડ ડાઉનલોડ કરો</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: UPLOAD PAYMENT SCREENSHOT */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Upload payment screenshot / પેમેન્ટ સ્ક્રીનશોટ અપલોડ કરો
                </h2>
                <span className="text-xs text-slate-400 font-medium">Section 4 of 4</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mb-3">
                Please complete payment of <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> and upload your payment screenshot.
              </p>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />

                {!screenshotPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      errors.screenshot ? 'border-rose-300 bg-rose-50/20' : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-sm text-slate-800">
                      Click to upload screenshot / સ્ક્રીનશોટ અપલોડ કરવા ક્લિક કરો <span className="text-rose-500">*</span>
                    </p>
                    <p className="text-xs text-slate-500">JPG, PNG, WEBP (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot Preview"
                        onClick={() => setPreviewZoomOpen(true)}
                        className="w-12 h-12 rounded-xl object-cover border border-emerald-300 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Uploaded ✓ / અપલોડ થઈ ગયો</span>
                        </p>
                        <p className="text-xs text-slate-600 truncate max-w-[180px]">{screenshotName || "proof.jpg"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewZoomOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-white text-slate-700 text-xs font-semibold border border-slate-200"
                      >
                        View / જુઓ
                      </button>
                      <button
                        type="button"
                        onClick={() => { setScreenshotBase64(''); setScreenshotPreview(''); setScreenshotName(''); }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200"
                      >
                        Remove / હટાવો
                      </button>
                    </div>
                  </div>
                )}

                {errors.screenshot && (
                  <p className="flex items-center gap-1 text-xs font-semibold text-rose-600 mt-2 bg-rose-50 p-2 rounded-xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.screenshot}</span>
                  </p>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                <span>Primary / મુખ્ય: <strong className="text-white">{primaryName || '—'}</strong></span>
                <span>Mobile / મોબાઈલ: <strong className="text-white">{mobileNumber ? `+91 ${mobileNumber}` : '—'}</strong></span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Total / કુલ રકમ</p>
                  <p className="text-2xl font-black text-emerald-400">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <p><strong>{memberCount}</strong> {memberCount === 1 ? 'Member / સભ્ય' : 'Members / સભ્યો'}</p>
                  <p className="text-emerald-300">{screenshotPreview ? "Screenshot Attached ✓" : "Screenshot Pending"}</p>
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
                    <span>Submitting / સબમિટ થઈ રહ્યું છે...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-200" />
                    <span>Submit Registration / રજીસ્ટ્રેશન સબમિટ કરો</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </main>

      {/* Footer with subtle organizer access */}
      <footer className="max-w-2xl mx-auto px-4 mt-8 text-center text-xs text-slate-400">
        <p>© 2026 1-Day Picnic Committee</p>
        <button
          type="button"
          onClick={() => setIsAdminOpen(true)}
          className="mt-1 text-[11px] text-slate-400 hover:text-slate-600 underline"
        >
          Organizer Login / એડમિન લોગિન
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

      {/* Screenshot Zoom Modal */}
      {previewZoomOpen && screenshotPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewZoomOpen(false)}>
          <div className="bg-white rounded-2xl p-4 max-w-md w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Payment Screenshot / સ્ક્રીનશોટ</span>
              <button onClick={() => setPreviewZoomOpen(false)} className="text-slate-500 font-bold px-1">✕</button>
            </div>
            <div className="py-2 flex items-center justify-center">
              <img src={screenshotPreview} alt="Zoom" className="max-h-[60vh] max-w-full object-contain rounded-lg" />
            </div>
            <button onClick={() => setPreviewZoomOpen(false)} className="w-full py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
              Close / બંધ કરો
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
