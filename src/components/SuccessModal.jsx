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
  Loader2,
  AlertTriangle,
  PhoneCall
} from 'lucide-react';
import { RegistrationReceipt } from './RegistrationReceipt';

export const SuccessModal = ({
  result,
  formData,
  config = {},
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

  const primaryName = (formData.primaryName || '').trim();
  const primaryAge = formData.primaryAge || '';
  const primaryGender = formData.primaryGender || '';
  const mobileNumber = formData.mobileNumber || '';
  const transportMode = formData.transportMode || result?.transportMode || 'Bus (Jothan)';
  const isBus = transportMode.includes('Bus');
  const pricePerMember = config.feePerMember || 100;
  const busFare = config.busFare || 200;

  // Build unified member list ensuring primary person is ALWAYS listed and counted in the table
  const rawMembers = formData.members || [];
  let allMembers = [];

  if (rawMembers.length > 0) {
    const firstMemberMatchesPrimary = primaryName && rawMembers[0]?.name?.trim().toLowerCase() === primaryName.toLowerCase();
    if (firstMemberMatchesPrimary) {
      allMembers = rawMembers.map((m, idx) => ({
        ...m,
        isPrimary: idx === 0
      }));
    } else if (primaryName) {
      allMembers = [
        {
          name: primaryName,
          age: primaryAge,
          gender: primaryGender,
          isPrimary: true
        },
        ...rawMembers.map(m => ({ ...m, isPrimary: false }))
      ];
    } else {
      allMembers = rawMembers.map((m, idx) => ({ ...m, isPrimary: idx === 0 }));
    }
  } else if (primaryName) {
    allMembers = [
      {
        name: primaryName,
        age: primaryAge,
        gender: primaryGender,
        isPrimary: true
      }
    ];
  }

  const memberCount = allMembers.length || 1;

  // Fee calculation: Age > 5 is chargeable; Age <= 5 is free
  const chargeableCount = allMembers.filter(m => {
    const a = Number(m.age);
    return !isNaN(a) && a > 5;
  }).length;

  const freeKidsCount = allMembers.filter(m => {
    const a = Number(m.age);
    return !isNaN(a) && a > 0 && a <= 5;
  }).length;

  // Fee calculations (Age > 5 only)
  const memberFeeTotal = formData.memberFeeTotal !== undefined 
    ? formData.memberFeeTotal 
    : chargeableCount * pricePerMember;

  const busFeeTotal = formData.busFeeTotal !== undefined 
    ? formData.busFeeTotal 
    : (isBus ? chargeableCount * busFare : 0);

  const totalAmount = formData.totalAmount !== undefined 
    ? formData.totalAmount 
    : (memberFeeTotal + busFeeTotal);

  // Direct 1-Click Receipt Download from Success Screen
  const handleDirectDownload = async () => {
    if (!hiddenReceiptRef.current || isDownloading) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(hiddenReceiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: 0,
        scrollX: 0,
        allowTaint: true
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const filename = `Satsang_Yatra_Receipt_${result?.registrationId || '2026'}.png`;
      link.download = filename;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Direct download failed:", err);
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
        <span>રજીસ્ટ્રેશન નોંધણી પૂર્ણ થઈ</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mb-2">
        રજીસ્ટ્રેશન સફળ રહ્યું!
      </h2>
      <p className="text-emerald-700 font-bold text-base sm:text-lg mb-1">
        શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા - 2026 માં આપનું સ્વાગત છે.
      </p>
      <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto mb-6">
        નીચે આપેલા બટન પર ક્લિક કરીને તમારી રસીદ સીધી ડાઉનલોડ કરી લો.
      </p>

      {/* Registration ID Highlight Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
          તમારો રસીદ નંબર / ID
        </p>
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-wider font-mono">
            {result?.registrationId || "SBSY-2026-0001"}
          </span>
          <button
            type="button"
            onClick={handleCopyId}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
            title="નંબર કોપી કરો"
          >
            {copiedId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          બસમાં બેસતી વખતે અથવા સ્થળ પર આ રસીદ બતાવવાની રહેશે.
        </p>
      </div>

      {/* Fee & Registration Summary Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-left text-xs sm:text-sm space-y-2 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">મુખ્ય વ્યક્તિ:</span>
          <span className="font-bold text-slate-900">{primaryName} (+91 {mobileNumber})</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">કુલ નોંધાયેલા સભ્યો:</span>
          <span className="font-bold text-slate-900">{memberCount} વ્યક્તિ</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600 font-medium">સભ્ય ફી (૫ વર્ષથી મોટા):</span>
          <span className="font-bold text-slate-900">{chargeableCount} વ્યક્તિ (₹{memberFeeTotal})</span>
        </div>

        {isBus && (
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">બસ ભાડું (૫ વર્ષથી મોટા):</span>
            <span className="font-bold text-slate-900">{chargeableCount} વ્યક્તિ (₹{busFeeTotal})</span>
          </div>
        )}

        {freeKidsCount > 0 && (
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-medium">૫ વર્ષ કે તેથી નાના બાળકો:</span>
            <span className="font-bold text-slate-800">{freeKidsCount} બાળકો (મફત - ₹૦)</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-800 font-bold text-sm sm:text-base">કુલ ચૂકવવાપાત્ર રકમ:</span>
          <span className="font-black text-emerald-700 font-mono text-base sm:text-lg">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-600 font-medium">મુસાફરીનું માધ્યમ:</span>
          <span className="font-bold text-slate-900">
            {isBus ? `બસમાં (જોથાણથી બસ - બસભાડુ: ₹${busFare}/- પ્રતિ વ્યક્તિ)` : 'પોતાનું વાહન'}
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
        <button
          type="button"
          onClick={handleDirectDownload}
          disabled={isDownloading}
          className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all transform active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>રસીદ ડાઉનલોડ થાય છે...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>રસીદ ડાઉનલોડ કરો</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowReceipt(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
          title="રસીદ જુઓ"
        >
          <Eye className="w-4 h-4 text-slate-600" />
          <span>રસીદ જુઓ</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
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
            members: allMembers,
            totalMembers: memberCount,
            chargeableCount: chargeableCount,
            freeKidsCount: freeKidsCount,
            freeCount: freeKidsCount,
            memberFeeTotal: memberFeeTotal,
            busFeeTotal: busFeeTotal,
            totalAmount: totalAmount,
            transportMode: transportMode,
            status: "Confirmed"
          }}
          config={config}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Hidden Off-Screen Clean Receipt Template for Instant Direct 1-Click Download */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div 
          ref={hiddenReceiptRef}
          style={{ 
            width: '600px', 
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            padding: '20px 24px',
            color: '#0f172a',
            fontFamily: "'Noto Sans Gujarati', 'Plus Jakarta Sans', sans-serif"
          }}
        >
          {/* Header Title */}
          <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '2px solid #0f172a', marginBottom: '10px' }}>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2', marginBottom: '2px' }}>
              🛕 {config.eventName || "શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા - 2026"}
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              રજિસ્ટ્રેશન રસીદ
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '1px' }}>
              {config.eventTagline || "ભગવાનના સાનિધ્યમાં આનંદની 1 દિવસીય સત્સંગ યાત્રા"}
            </div>
          </div>

          {/* Primary Details Grid */}
          <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', padding: '3px 0', verticalAlign: 'top' }}>
                    <span style={{ color: '#64748b' }}>રસીદ નંબર / ID: </span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '15px' }}>
                      {result?.registrationId || 'SBSY-2026-0001'}
                    </strong>
                  </td>
                  <td style={{ width: '50%', padding: '3px 0', textAlign: 'right', verticalAlign: 'top' }}>
                    <span style={{ color: '#64748b' }}>તારીખ: </span>
                    <strong style={{ color: '#0f172a' }}>
                      {result?.timestamp || new Date().toLocaleString('en-IN')}
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                    <span style={{ color: '#64748b' }}>મુખ્ય વ્યક્તિ: </span>
                    <strong style={{ color: '#0f172a' }}>{primaryName || '—'}</strong>
                  </td>
                  <td style={{ padding: '3px 0', textAlign: 'right', verticalAlign: 'top' }}>
                    <span style={{ color: '#64748b' }}>મોબાઈલ: </span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>+91 {mobileNumber}</strong>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ padding: '3px 0', paddingTop: '4px', verticalAlign: 'top' }}>
                    <span style={{ color: '#64748b' }}>વાહન / મુસાફરી: </span>
                    <strong style={{ color: '#0f172a' }}>
                      {isBus 
                        ? `બસમાં (જોથાણથી બસ વ્યવસ્થા - બસભાડુ: ₹${busFare}/- પ્રતિ વ્યક્તિ)` 
                        : 'પોતાનું વાહન (પોતાની રીતે આવવાનું રહેશે)'}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Members Table */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '5px' }}>
              નોંધાયેલા સભ્યોની યાદી ({memberCount} સભ્યો):
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '1px solid #cbd5e1' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', fontWeight: '800', color: '#1e293b' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '36px', borderRight: '1px solid #cbd5e1' }}>ક્રમ</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>સભ્યનું નામ</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '70px', borderRight: '1px solid #cbd5e1' }}>ઉંમર</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '60px', borderRight: '1px solid #cbd5e1' }}>જાતિ</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '115px' }}>ફી</th>
                </tr>
              </thead>
              <tbody>
                {allMembers.map((m, idx) => {
                  const ageNum = Number(m.age) || 0;
                  const isAbove5 = ageNum > 5;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '6px 8px', fontWeight: '700', color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                        {m.name || `સભ્ય ${idx + 1}`} {m.isPrimary && <span style={{ color: '#047857', fontWeight: '600' }}>(મુખ્ય વ્યક્તિ)</span>}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                        {m.age ? `${m.age} વર્ષ` : '—'}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                        {m.gender === 'Male' ? 'પુરુષ' : m.gender === 'Female' ? 'સ્ત્રી' : (m.gender === 'Other' ? 'અન્ય' : '—')}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>
                        {isAbove5 ? (
                          isBus ? (
                            <div>
                              <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', lineHeight: '1.2' }}>₹300</div>
                              <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px', whiteSpace: 'nowrap' }}>ફી ₹100 + બસ ₹200</div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: '800', fontSize: '15px', color: '#0f172a', lineHeight: '1.2' }}>₹100</div>
                              <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>(સભ્ય ફી)</div>
                            </div>
                          )
                        ) : (
                          <div style={{ fontWeight: '800', fontSize: '14px', color: '#059669' }}>
                            મફત (₹0)
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Fee Summary */}
          <div style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '8px 0', marginBottom: '10px', fontSize: '14px', lineHeight: '1.5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
              <span>કુલ સભ્યો:</span>
              <strong style={{ color: '#0f172a' }}>{memberCount} વ્યક્તિ</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
              <span>સભ્ય ફી (૫ વર્ષથી મોટા - ₹{pricePerMember} × {chargeableCount}):</span>
              <strong style={{ color: '#0f172a' }}>₹{memberFeeTotal}</strong>
            </div>
            {isBus && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <span>બસ ભાડું (૫ વર્ષથી મોટા - ₹{busFare} × {chargeableCount}):</span>
                <strong style={{ color: '#0f172a' }}>₹{busFeeTotal}</strong>
              </div>
            )}
            {freeKidsCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '600' }}>
                <span>૫ વર્ષ કે તેથી નાના બાળકો (મફત):</span>
                <span>{freeKidsCount} બાળકો (₹૦)</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '5px', marginTop: '3px', borderTop: '1px solid #e2e8f0' }}>
              <strong style={{ color: '#0f172a', fontSize: '15px' }}>કુલ ચૂકવવાપાત્ર રકમ:</strong>
              <strong style={{ fontSize: '19px', color: '#0f172a', fontFamily: 'monospace', fontWeight: '900' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Payment Contact Notice (Clean Simple Text, No Yellow Box) */}
          <div style={{ 
            marginBottom: '10px', 
            fontSize: '14px', 
            lineHeight: '1.5',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
              📌 તા. 16 - 09 - 2026 પહેલાં રસીદના રૂપિયા અલ્પેશભાઈ વેગડ પાસે જમા કરાવી દેવા.
            </div>
            <div style={{ fontWeight: '700', color: '#334155', marginTop: '2px', fontSize: '14px' }}>
              કોન્ટેક્ટ નંબર : <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '15px' }}>76003 12101</strong>
            </div>
          </div>

          {/* Important Warning Notice Box */}
          <div style={{ 
            border: '1.5px solid #fca5a5', 
            backgroundColor: '#fef2f2', 
            borderRadius: '8px', 
            padding: '8px 12px', 
            color: '#991b1b', 
            fontWeight: '800', 
            fontSize: '13px', 
            lineHeight: '1.5',
            textAlign: 'center'
          }}>
            ⚠️ તા. 16 - 09 - 2026 પહેલાં યાત્રાના પૈસા જે હરિભક્તે જમા નહીં કરાવ્યા હોય એમને યાત્રામાં લઈ જવામાં આવશે નહીં.
          </div>

        </div>
      </div>

    </div>
  );
};
