import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Printer, 
  RotateCcw, 
  ShieldCheck, 
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { RegistrationPass } from './RegistrationPass';

export const SuccessModal = ({
  result,
  formData,
  config,
  onReset
}) => {
  const [showPass, setShowPass] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Trigger celebratory confetti burst
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 350);
    } catch (e) {
      console.log("Confetti trigger:", e);
    }
  }, []);

  const handleCopyId = () => {
    if (result?.registrationId) {
      navigator.clipboard.writeText(result.registrationId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const memberCount = formData.members?.length || result?.totalMembers || 1;
  const totalAmount = result?.totalAmount || memberCount * (config.feePerMember || 500);

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl p-6 sm:p-10 text-center animate-fade-in max-w-2xl mx-auto">
      
      {/* Animated Success Icon */}
      <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 mb-6 transform hover:scale-105 transition-transform">
        <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Registration Completed / રજીસ્ટ્રેશન પૂર્ણ થયું</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mb-2">
        Registration Successful!
      </h2>
      <p className="text-emerald-700 font-bold text-base sm:text-lg mb-1">
        અભિનંદન! તમારું રજીસ્ટ્રેશન સફળતાપૂર્વક થઈ ગયું છે.
      </p>
      <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto mb-6">
        Thank you for registering for our <strong>{config.eventName || "1-Day Picnic"}</strong>.
      </p>

      {/* Registration ID Highlight Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-3xl p-5 sm:p-6 mb-6">
        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          Your Unique Registration ID / તમારો રજીસ્ટ્રેશન નંબર
        </p>
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-wider font-mono">
            {result?.registrationId || "PIC-2026-0001"}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
            title="Copy Registration ID"
          >
            {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Please keep this ID handy for reference / બસમાં બેસતી વખતે આ નંબર બતાવવાનો રહેશે.
        </p>
      </div>

      {/* Verification Status Checklist */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs sm:text-sm space-y-2.5 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Primary Contact / મુખ્ય વ્યક્તિ:</span>
          <span className="font-bold text-slate-900">{formData.primaryName} (+91 {formData.mobileNumber})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Total Registered Members / કુલ સભ્યો:</span>
          <span className="font-bold text-slate-900">{memberCount} Members / સભ્યો</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Total Paid Amount / કુલ ચૂકવેલ રકમ:</span>
          <span className="font-extrabold text-emerald-700">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-600 font-medium">Payment Screenshot / સ્ક્રીનશોટ:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Uploaded Successfully ✓ / અપલોડ થઈ ગયો છે</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">Verification Status / સ્થિતિ:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-xs">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>Pending Verification / ચકાસણી બાકી છે</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setShowPass(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all transform active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Download Pass / ડિજિટલ પાસ ડાઉનલોડ કરો</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>Register Another Group / બીજું રજીસ્ટ્રેશન કરો</span>
        </button>
      </div>

      {/* Render Digital Pass Modal if requested */}
      {showPass && (
        <RegistrationPass
          registrationData={{
            ...formData,
            registrationId: result?.registrationId,
            totalAmount: totalAmount,
            totalMembers: memberCount,
            paymentStatus: "Payment Screenshot Uploaded / Pending Verification"
          }}
          config={config}
          onClose={() => setShowPass(false)}
        />
      )}

    </div>
  );
};
