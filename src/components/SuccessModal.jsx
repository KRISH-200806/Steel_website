import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { 
  CheckCircle2, 
  Sparkles, 
  Download, 
  RotateCcw, 
  Copy, 
  Check, 
  Bus, 
  Car,
  Eye,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { RegistrationReceipt } from './RegistrationReceipt';

export const SuccessModal = ({
  result,
  formData,
  config,
  onReset
}) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
  const hiddenReceiptRef = useRef(null);

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

  const members = formData.members || [];
  const memberCount = members.length || result?.totalMembers || 1;
  const transportMode = formData.transportMode || result?.transportMode || 'Bus (Jothan)';
  const isBus = transportMode.includes('Bus');
  const pricePerMember = config.feePerMember || 100;

  // Fee calculation: Age > 5 is chargeable; Age <= 5 is free
  const chargeableCount = result?.chargeableCount !== undefined 
    ? result.chargeableCount 
    : members.filter(m => Number(m.age) > 5).length;

  const freeKidsCount = result?.freeKidsCount !== undefined 
    ? result.freeKidsCount 
    : members.filter(m => Number(m.age) > 0 && Number(m.age) <= 5).length;

  const totalAmount = result?.totalAmount !== undefined 
    ? result.totalAmount 
    : chargeableCount * pricePerMember;

  // Direct 1-Click Receipt Download from Success Screen
  const handleDirectDownload = async () => {
    if (!hiddenReceiptRef.current || isDownloading) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(hiddenReceiptRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: 0,
        scrollX: 0,
        allowTaint: true
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const filename = `Picnic_Receipt_${result?.registrationId || '2026'}.png`;
      link.download = filename;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Direct download failed:", err);
      // Fallback: open receipt modal
      setShowReceipt(true);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xl p-6 sm:p-10 text-center animate-fade-in max-w-2xl mx-auto relative">
      
      {/* Animated Success Icon */}
      <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 mb-6 transform hover:scale-105 transition-transform">
        <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>રજીસ્ટ્રેશન પૂર્ણ થયું</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mb-2">
        રજીસ્ટ્રેશન સફળ રહ્યું!
      </h2>
      <p className="text-emerald-700 font-bold text-base sm:text-lg mb-1">
        અભિનંદન! તમારી પિકનિક નોંધણી સફળતાપૂર્વક થઈ ગઈ છે.
      </p>
      <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto mb-6">
        નીચે આપેલા બટન પર ક્લિક કરીને તમારી સત્તાવાર રસીદ સીધી ડાઉનલોડ કરી લો.
      </p>

      {/* Registration ID Highlight Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-3xl p-5 sm:p-6 mb-6">
        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          તમારો સત્તાવાર રસીદ નંબર / ID
        </p>
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-wider font-mono">
            {result?.registrationId || "PIC-2026-0001"}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
            title="નંબર કોપી કરો"
          >
            {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          બસમાં બેસતી વખતે અથવા એન્ટ્રી વખતે આ રસીદ બતાવવાની રહેશે.
        </p>
      </div>

      {/* Fee & Registration Summary Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left text-xs sm:text-sm space-y-2.5 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">મુખ્ય વ્યક્તિ:</span>
          <span className="font-bold text-slate-900">{formData.primaryName} (+91 {formData.mobileNumber})</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">કુલ નોંધાયેલા સભ્યો:</span>
          <span className="font-bold text-slate-900">{memberCount} વ્યક્તિ</span>
        </div>

        {/* Age > 5 Fee Calculation */}
        <div className="flex items-center justify-between text-emerald-800">
          <span className="font-medium">૫ વર્ષથી મોટા સભ્યો (ચાર્જપાત્ર):</span>
          <span className="font-bold">{chargeableCount} વ્યક્તિ (₹{chargeableCount * pricePerMember})</span>
        </div>

        {freeKidsCount > 0 && (
          <div className="flex items-center justify-between text-teal-700">
            <span className="font-medium">૫ વર્ષ કે તેથી નાના બાળકો:</span>
            <span className="font-bold">{freeKidsCount} બાળકો (મફત - ₹૦)</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-800 font-bold text-sm sm:text-base">કુલ ચૂકવવાપાત્ર રકમ:</span>
          <span className="font-black text-emerald-700 font-mono text-base sm:text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-600 font-medium">મુસાફરીનું માધ્યમ:</span>
          <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-xs ${
            isBus ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
            {isBus ? <Bus className="w-3.5 h-3.5 text-blue-600" /> : <Car className="w-3.5 h-3.5 text-purple-600" />}
            <span>{isBus ? 'બસમાં (જોથાણથી બસ સુવિધા)' : 'પોતાનું વાહન'}</span>
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-600 font-medium">સ્થિતિ:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>રજીસ્ટ્રેશન કન્ફર્મ ✓</span>
          </span>
        </div>
      </div>

      {/* Download Success Notice */}
      {downloadSuccess && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 animate-scale-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>✓ રસીદ સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે!</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        
        {/* Direct Download Button */}
        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={isDownloading}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all transform active:scale-[0.98] disabled:opacity-60"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>રસીદ ડાઉનલોડ થાય છે...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>સત્તાવાર રસીદ ડાઉનલોડ કરો</span>
            </>
          )}
        </button>

        {/* View Receipt Modal Button */}
        <button
          type="button"
          onClick={() => setShowReceipt(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
          title="રસીદ જુઓ"
        >
          <Eye className="w-4 h-4 text-slate-600" />
          <span>રસીદ જુઓ</span>
        </button>

        {/* Register Another Button */}
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>બીજું રજીસ્ટ્રેશન</span>
        </button>
      </div>

      {/* Full Screen Receipt Modal */}
      {showReceipt && (
        <RegistrationReceipt
          registrationData={{
            ...formData,
            registrationId: result?.registrationId,
            timestamp: result?.timestamp,
            totalMembers: memberCount,
            chargeableCount: chargeableCount,
            freeKidsCount: freeKidsCount,
            freeCount: freeKidsCount,
            totalAmount: totalAmount,
            transportMode: transportMode,
            status: "Confirmed"
          }}
          config={config}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Hidden Off-Screen Receipt Template for Instant Direct 1-Click Download */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div 
          ref={hiddenReceiptRef}
          className="p-8 bg-white text-slate-800 font-sans"
          style={{ width: '560px', boxSizing: 'border-box' }}
        >
          {/* Header Title */}
          <div className="border-b-2 border-emerald-800/20 pb-4 mb-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">🌴</span>
              <h2 className="text-2xl font-black text-emerald-950 tracking-tight">
                ૧-દિવસીય વાર્ષિક પિકનિક ૨૦૨૬
              </h2>
            </div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              સત્તાવાર રજીસ્ટ્રેશન રસીદ
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              આનંદ, ઉલ્લાસ અને ભોજન સાથે યાદગાર પિકનિક
            </p>
          </div>

          {/* Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-5">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">રસીદ નંબર / ID</span>
                <span className="text-sm font-extrabold text-emerald-800 font-mono block">
                  {result?.registrationId || 'PIC-2026-0001'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">તારીખ અને સમય</span>
                <span className="text-xs font-bold text-slate-800 block">
                  {result?.timestamp || new Date().toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">મુખ્ય વ્યક્તિનું નામ</span>
                <span className="text-sm font-bold text-slate-900 block">
                  {formData.primaryName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">મોબાઈલ નંબર</span>
                <span className="text-sm font-bold text-slate-900 font-mono block">
                  +91 {formData.mobileNumber}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <span className="text-[11px] text-slate-500 font-bold block mb-1">મુસાફરીનું માધ્યમ (વાહનની વિગત)</span>
              <div className={`p-2.5 rounded-xl font-bold text-xs ${
                isBus ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-purple-100 text-purple-900 border border-purple-300'
              }`}>
                {isBus ? '🚌 બસમાં (જોથાણથી બસની વ્યવસ્થા કરવામાં આવેલ છે)' : '🚗 પોતાનું વાહન (પોતાની રીતે આવવાનું રહેશે)'}
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                નોંધાયેલા સભ્યોની યાદી ({memberCount} સભ્યો):
              </h4>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ૫ વર્ષથી ઉપર: ₹{pricePerMember} | ૫ વર્ષ કે તેથી નાના: મફત
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2.5 px-3 text-center w-10">ક્રમ</th>
                    <th className="py-2.5 px-3">સભ્યનું પૂરું નામ</th>
                    <th className="py-2.5 px-3 text-center">ઉંમર</th>
                    <th className="py-2.5 px-3 text-center">જાતિ</th>
                    <th className="py-2.5 px-3 text-right">ફી ગણતરી</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {members.map((m, idx) => {
                    const ageNum = Number(m.age) || 0;
                    const isAbove5 = ageNum > 5;

                    return (
                      <tr key={idx} className={isAbove5 ? "hover:bg-slate-50" : "bg-emerald-50/40"}>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{m.name || `સભ્ય ${idx + 1}`}</td>
                        <td className="py-2.5 px-3 text-center font-medium">{m.age} વર્ષ</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {m.gender === 'Male' ? 'પુરુષ' : m.gender === 'Female' ? 'સ્ત્રી' : 'અન્ય'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {isAbove5 ? (
                            <span className="text-slate-900 font-mono">₹{pricePerMember}</span>
                          ) : (
                            <span className="text-emerald-700 text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                              મફત (₹૦)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Calculation Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 mb-5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span>કુલ નોંધાયેલા સભ્યો:</span>
              <span className="font-bold text-slate-900">{memberCount} વ્યક્તિ</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>૫ વર્ષથી મોટી ઉંમરના સભ્યો (ચાર્જપાત્ર):</span>
              <span className="font-bold text-emerald-900">{chargeableCount} × ₹{pricePerMember} = ₹{chargeableCount * pricePerMember}</span>
            </div>
            {freeKidsCount > 0 && (
              <div className="flex items-center justify-between text-emerald-800">
                <span>૫ વર્ષ કે તેથી નાના બાળકો (મફત):</span>
                <span className="font-bold">{freeKidsCount} બાળકો (₹૦)</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2.5 border-t border-emerald-200 text-sm font-black text-emerald-950">
              <span>કુલ ચૂકવવાપાત્ર રકમ:</span>
              <span className="text-lg text-emerald-700 font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-1 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>રજીસ્ટ્રેશન કન્ફર્મ થયેલ છે ✓</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">૫ વર્ષથી નાના બાળકો માટે કોઈ ફી નથી</span>
            </div>
          </div>

          {/* Rules (Numbered List) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed mb-5 space-y-1.5">
            <p className="font-bold text-slate-900 mb-1">📌 અગત્યની સૂચનાઓ:</p>
            <p>૧. બસમાં બેસતી વખતે અને પિકનિક સ્થળ પર આ રસીદ બતાવવાની રહેશે.</p>
            <p>૨. ૫ વર્ષથી નાના બાળકો માટે કોઈ ફી ગણવામાં આવેલ નથી (મફત છે).</p>
            <p>૩. {isBus ? "જોથાણથી બસ સમયસર ઉપડશે, દરેક સભ્યોએ સમયસર હાજર રહેવું." : "પોતાના વાહન સાથે સમયસર પિકનિક સ્થળ પર પહોંચી જવું."}</p>
          </div>

          {/* Seal and Signature */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-300">
                ✓
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">સત્તાવાર મહોર (Verified)</p>
                <p className="text-[10px] text-slate-400">૧-દિવસીય પિકનિક કમિટી ૨૦૨૬</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800 text-xs">કમિટી પ્રતિનિધિ</p>
              <p className="text-[10px] text-slate-400">સત્તાવાર નોંધણી</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
