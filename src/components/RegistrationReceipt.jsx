import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { 
  Download, 
  CheckCircle2, 
  X, 
  Loader2
} from 'lucide-react';

export const RegistrationReceipt = ({ registrationData, config = {}, onClose }) => {
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

  const primaryName = (registrationData.primaryName || '').trim();
  const primaryAge = registrationData.primaryAge || '';
  const primaryGender = registrationData.primaryGender || '';
  const mobileNumber = registrationData.mobileNumber || '';
  const transportMode = registrationData.transportMode || 'Bus (Jothan)';
  const isBus = transportMode.includes('Bus');
  const pricePerMember = config.feePerMember || 100;
  const busFare = config.busFare || 200;

  // Build unified member list ensuring primary person is ALWAYS listed and counted in the table
  const rawMembers = registrationData.members || [];
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

  // Calculate age > 5 chargeable vs <= 5 free
  const chargeableCount = allMembers.filter(m => {
    const a = Number(m.age);
    return !isNaN(a) && a > 5;
  }).length;

  const freeKidsCount = allMembers.filter(m => {
    const a = Number(m.age);
    return !isNaN(a) && a > 0 && a <= 5;
  }).length;

  const totalAmount = chargeableCount * pricePerMember;

  // Direct High Resolution Download using html2canvas
  const handleDownload = async () => {
    if (!receiptRef.current || isDownloading) return;

    try {
      setIsDownloading(true);

      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollY: 0,
        scrollX: 0,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('printable-receipt');
          if (el) {
            el.style.width = '600px';
            el.style.maxWidth = '600px';
          }
        }
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const filename = `Satsang_Yatra_Receipt_${registrationData.registrationId || '2026'}.png`;
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
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 sm:my-10 animate-scale-up">
        
        {/* Top Control Bar */}
        <div className="bg-slate-100 px-5 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
          <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>સત્તાવાર રસીદ</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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
              className="p-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-600 font-bold border border-slate-200 transition-all cursor-pointer"
              title="બંધ કરો"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean, Simple, Official Receipt (No heavy decorative colored boxes) */}
        <div className="p-4 sm:p-6 bg-slate-100/50 flex justify-center overflow-x-auto">
          <div 
            ref={receiptRef} 
            id="printable-receipt"
            style={{ 
              width: '100%', 
              maxWidth: '600px', 
              backgroundColor: '#ffffff',
              padding: '24px 28px',
              color: '#0f172a',
              boxSizing: 'border-box',
              fontFamily: "'Noto Sans Gujarati', 'Plus Jakarta Sans', sans-serif"
            }}
          >
            
            {/* Header Title */}
            <div style={{ textAlign: 'center', paddingBottom: '14px', borderBottom: '2px solid #0f172a', marginBottom: '16px' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', lineHeight: '1.3', marginBottom: '3px' }}>
                🛕 {config.eventName || "શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા - 2026"}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                રજિસ્ટ્રેશન રસીદ
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
                {config.eventTagline || "ભગવાનના સાનિધ્યમાં આનંદની 1 દિવસીય સત્સંગ યાત્રા"}
              </div>
            </div>

            {/* Primary Details Grid (Clean Simple Rows) */}
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px', fontSize: '12px', lineHeight: '1.6' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', padding: '4px 0', verticalAlign: 'top' }}>
                      <span style={{ color: '#64748b' }}>રસીદ નંબર / ID: </span>
                      <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>
                        {registrationData.registrationId || 'SBSY-2026-0001'}
                      </strong>
                    </td>
                    <td style={{ width: '50%', padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>
                      <span style={{ color: '#64748b' }}>તારીખ: </span>
                      <strong style={{ color: '#0f172a' }}>
                        {registrationData.timestamp || new Date().toLocaleString('en-IN')}
                      </strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', verticalAlign: 'top' }}>
                      <span style={{ color: '#64748b' }}>મુખ્ય વ્યક્તિ: </span>
                      <strong style={{ color: '#0f172a' }}>{primaryName || '—'}</strong>
                    </td>
                    <td style={{ padding: '4px 0', textAlign: 'right', verticalAlign: 'top' }}>
                      <span style={{ color: '#64748b' }}>મોબાઈલ: </span>
                      <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>+91 {mobileNumber}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ padding: '4px 0', paddingTop: '6px', verticalAlign: 'top' }}>
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
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                નોંધાયેલા સભ્યોની યાદી ({memberCount} સભ્યો):
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', fontWeight: '800', color: '#1e293b' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '36px', borderRight: '1px solid #cbd5e1' }}>ક્રમ</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>સભ્યનું નામ</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '70px', borderRight: '1px solid #cbd5e1' }}>ઉંમર</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '60px', borderRight: '1px solid #cbd5e1' }}>જાતિ</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right', width: '80px' }}>ફી</th>
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
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                          {isAbove5 ? `₹${pricePerMember}` : 'મફત'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Fee Summary (Clean Lines, No Background Boxes) */}
            <div style={{ borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', padding: '10px 0', marginBottom: '14px', fontSize: '12px', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <span>કુલ સભ્યો:</span>
                <strong style={{ color: '#0f172a' }}>{memberCount} વ્યક્તિ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                <span>૫ વર્ષથી મોટી ઉંમરના સભ્યો (ચાર્જપાત્ર):</span>
                <strong style={{ color: '#0f172a' }}>{chargeableCount} × ₹{pricePerMember} = ₹{chargeableCount * pricePerMember}</strong>
              </div>
              {freeKidsCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>૫ વર્ષ કે તેથી નાના બાળકો (મફત):</span>
                  <span>{freeKidsCount} બાળકો (₹૦)</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', marginTop: '4px', borderTop: '1px solid #e2e8f0', fontSize: '13px' }}>
                <strong style={{ color: '#0f172a' }}>કુલ ચૂકવવાપાત્ર રકમ (યાત્રા ફી):</strong>
                <strong style={{ fontSize: '16px', color: '#0f172a', fontFamily: 'monospace' }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Payment Contact Notice (Simple Clean Text) */}
            <div style={{ marginBottom: '14px', fontSize: '12px', lineHeight: '1.6' }}>
              <div style={{ fontWeight: '800', color: '#0f172a' }}>
                📌 તા. 16 - 09 - 2026 પહેલાં રસીદના રૂપિયા અલ્પેશભાઈ વેગડ પાસે જમા કરાવી દેવા.
              </div>
              <div style={{ fontWeight: '700', color: '#334155', marginTop: '2px' }}>
                કોન્ટેક્ટ નંબર : <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '13px' }}>76003 12101</strong>
              </div>
            </div>

            {/* Important Instructions (Clean Numbered List) */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginBottom: '16px', fontSize: '11px', lineHeight: '1.6', color: '#334155' }}>
              <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                અગત્યની સૂચનાઓ:
              </div>
              <div style={{ fontWeight: '700', color: '#991b1b', marginBottom: '3px' }}>
                ૧. રસીદના રૂપિયા જમા થયા વગર તે રસીદનું કન્ફર્મેશન કરવામાં આવશે નહીં. તેની સૌએ ખાસ નોંધ લેવી.
              </div>
              <div style={{ marginBottom: '2px' }}>
                ૨. નાના બાળકોની જવાબદારી તેના માતા - પિતાની રહેશે.
              </div>
              <div>
                ૩. જોથાણ થી બસની વ્યવસ્થા કરેલી છે, તેમાં બસભાડુ – ₹૨૦૦/- પ્રતિ વ્યક્તિ રહેશે.
              </div>
            </div>

            {/* Official Signature / Seal */}
            <div style={{ borderTop: '1px solid #0f172a', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#475569' }}>
              <div>
                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px' }}>✓ સત્તાવાર મહોર (Verified)</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>શ્રી બ્રહ્માનંદ સત્સંગ યાત્રા કમિટી ૨૦૨૬</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '12px' }}>કમિટી પ્રતિનિધિ</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>સત્તાવાર નોંધણી</div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            રસીદ સાચવીને રાખો.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
            >
              બંધ કરો
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
