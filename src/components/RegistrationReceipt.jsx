import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Download, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Loader2
} from 'lucide-react';

export const RegistrationReceipt = ({ registrationData, config, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef(null);

  // Lock body scroll while receipt modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const members = registrationData.members || [];
  const memberCount = registrationData.totalMembers || members.length || 1;
  const transportMode = registrationData.transportMode || 'Bus (Jothan)';
  const isBus = transportMode.includes('Bus');
  const pricePerMember = config.feePerMember || 100;

  // Calculate age > 5 chargeable vs <= 5 free
  const chargeableCount = registrationData.chargeableCount !== undefined 
    ? registrationData.chargeableCount 
    : members.filter(m => Number(m.age) > 5).length;

  const freeCount = registrationData.freeKidsCount !== undefined 
    ? registrationData.freeKidsCount 
    : (registrationData.freeCount !== undefined 
        ? registrationData.freeCount 
        : members.filter(m => Number(m.age) > 0 && Number(m.age) <= 5).length);
  const freeKidsCount = freeCount;

  const totalAmount = registrationData.totalAmount !== undefined 
    ? registrationData.totalAmount 
    : chargeableCount * pricePerMember;

  // Direct High Resolution Download using html2canvas
  const handleDownload = async () => {
    if (!receiptRef.current || isDownloading) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(receiptRef.current, {
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
      const filename = `Picnic_Receipt_${registrationData.registrationId || '2026'}.png`;
      link.download = filename;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Receipt download failed:", err);
      alert("રસીદ ડાઉનલોડ કરવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 sm:my-10 animate-scale-up">
        
        {/* Top Header Control Bar */}
        <div className="bg-slate-100 px-5 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
          <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>સત્તાવાર પિકનિક રસીદ</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>ડાઉનલોડ થાય છે...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>રસીદ ડાઉનલોડ કરો</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-600 font-bold border border-slate-200 transition-all"
              title="બંધ કરો"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Crisp, Perfectly Aligned Printable/Downloadable Receipt */}
        <div 
          ref={receiptRef} 
          id="printable-receipt"
          className="p-6 sm:p-8 bg-white text-slate-800 font-sans"
          style={{ width: '100%', boxSizing: 'border-box' }}
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

          {/* Clean Primary Details Table Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-5">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">રસીદ નંબર / ID</span>
                <span className="text-sm font-extrabold text-emerald-800 font-mono block">
                  {registrationData.registrationId}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">તારીખ અને સમય</span>
                <span className="text-xs font-bold text-slate-800 block">
                  {registrationData.timestamp || new Date().toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">મુખ્ય વ્યક્તિનું નામ</span>
                <span className="text-sm font-bold text-slate-900 block">
                  {registrationData.primaryName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-bold block mb-0.5">મોબાઈલ નંબર</span>
                <span className="text-sm font-bold text-slate-900 font-mono block">
                  +91 {registrationData.mobileNumber}
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

          {/* Member Details Table */}
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
                            <span className="text-emerald-700 text-[11px] bg-emerald-100 px-2 py-0.5 rounded font-bold">
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
            {freeCount > 0 && (
              <div className="flex items-center justify-between text-emerald-800">
                <span>૫ વર્ષ કે તેથી નાના બાળકો (મફત):</span>
                <span className="font-bold">{freeCount} બાળકો (₹૦)</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2.5 border-t border-emerald-200 text-sm font-black text-emerald-950">
              <span>કુલ ચૂકવવાપાત્ર રકમ:</span>
              <span className="text-lg text-emerald-700 font-mono">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-1 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>રજીસ્ટ્રેશન કન્ફર્મ થયેલ છે ✓</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">૫ વર્ષથી નાના બાળકો માટે કોઈ ફી નથી</span>
            </div>
          </div>

          {/* Important Rules (Numbered List) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed mb-5 space-y-1.5">
            <p className="font-bold text-slate-900 mb-1">📌 અગત્યની સૂચનાઓ:</p>
            <p>૧. બસમાં બેસતી વખતે અને પિકનિક સ્થળ પર આ રસીદ બતાવવાની રહેશે.</p>
            <p>૨. ૫ વર્ષથી નાના બાળકો માટે કોઈ ફી ગણવામાં આવેલ નથી (મફત છે).</p>
            <p>૩. {isBus ? "જોથાણથી બસ સમયસર ઉપડશે, દરેક સભ્યોએ સમયસર હાજર રહેવું." : "પોતાના વાહન સાથે સમયસર પિકનિક સ્થળ પર પહોંચી જવું."}</p>
          </div>

          {/* Official Seal and Signature */}
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

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            રસીદ સાચવીને રાખો.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ડાઉનલોડ થાય છે...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>રસીદ ડાઉનલોડ કરો</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all"
            >
              બંધ કરો
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
