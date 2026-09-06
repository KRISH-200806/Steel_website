import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Palmtree, Printer, CheckCircle2, Bus, Car } from 'lucide-react';

export const RegistrationPass = ({ registrationData, config, onClose }) => {
  const qrRef = useRef(null);

  useEffect(() => {
    if (qrRef.current && registrationData) {
      const passInfo = JSON.stringify({
        id: registrationData.registrationId,
        lead: registrationData.primaryName,
        phone: registrationData.mobileNumber,
        transport: registrationData.transportMode || 'Bus (Jothan)',
        members: registrationData.members?.length || registrationData.totalMembers || 1
      });

      QRCode.toCanvas(qrRef.current, passInfo, {
        width: 140,
        margin: 1,
        color: {
          dark: '#064e3b',
          light: '#ffffff'
        }
      });
    }
  }, [registrationData]);

  const handlePrint = () => {
    window.print();
  };

  const members = registrationData.members || [];
  const memberCount = registrationData.totalMembers || members.length || 1;
  const isBus = (registrationData.transportMode || '').includes('Bus');

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6 sm:my-10">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print bg-slate-100 px-6 py-3.5 flex items-center justify-between border-b border-slate-200">
          <span className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
            <Palmtree className="w-4 h-4 text-emerald-600" />
            <span>ડિજિટલ એન્ટ્રી પાસ</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>પ્રિન્ટ / PDF સેવ કરો</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-all"
            >
              બંધ કરો
            </button>
          </div>
        </div>

        {/* The Printable Pass Body */}
        <div id="printable-pass" className="p-6 sm:p-8 bg-white">
          
          {/* Ticket Header */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 mb-6 relative overflow-hidden shadow-md">
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/30">
                  ઓફિશિયલ એન્ટ્રી પાસ
                </span>
                <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white mt-1">
                  {config.eventName || "૧-દિવસીય પિકનિક ૨૦૨૬"}
                </h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {config.eventTagline || "આનંદ, ઉલ્લાસ અને યાદગાર પળો સાથેની પિકનિક"}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/20 flex-shrink-0">
                <span className="block text-[10px] text-emerald-200 font-semibold">પાસ નંબર</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-300 font-mono">
                  {registrationData.registrationId}
                </span>
              </div>
            </div>
          </div>

          {/* Event Itinerary Summary */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center mb-6">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">તારીખ</p>
              <p className="text-xs font-bold text-slate-800">{config.eventDate || "રવિવાર"}</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-[10px] text-slate-400 font-bold uppercase">સમય</p>
              <p className="text-xs font-bold text-slate-800">{config.eventTime || "સવારે ૭:૦૦ થી"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">સ્થળ</p>
              <p className="text-xs font-bold text-slate-800 truncate" title={config.eventVenue}>
                {config.eventVenue || "રિસોર્ટ"}
              </p>
            </div>
          </div>

          {/* Attendee Details & Pass QR */}
          <div className="flex flex-col sm:flex-row gap-5 items-center justify-between border-y border-dashed border-slate-300 py-5 mb-6">
            <div className="space-y-2 text-xs sm:text-sm w-full sm:w-auto">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">મુખ્ય સંપર્ક વ્યક્તિ:</span>
                <span className="font-extrabold text-slate-900 text-base">
                  {registrationData.primaryName}
                  {registrationData.primaryAge && <span className="text-xs font-normal text-slate-500 ml-1">({registrationData.primaryAge} વર્ષ, {registrationData.primaryGender === 'Male' ? 'પુરુષ' : registrationData.primaryGender === 'Female' ? 'સ્ત્રી' : 'અન્ય'})</span>}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span>મોબાઈલ: <strong>+91 {registrationData.mobileNumber}</strong></span>
                <span>•</span>
                <span>સભ્યો: <strong>{memberCount} વ્યક્તિ</strong></span>
              </div>
              
              {/* Transport mode info */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isBus ? 'bg-blue-50 border border-blue-200 text-blue-900' : 'bg-purple-50 border border-purple-200 text-purple-900'
                }`}>
                  {isBus ? <Bus className="w-3.5 h-3.5 text-blue-600" /> : <Car className="w-3.5 h-3.5 text-purple-600" />}
                  <span>{isBus ? 'વાહન: બસમાં (જોથાણથી બસ)' : 'વાહન: પોતાનું વાહન'}</span>
                </span>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>કન્ફર્મ પાસ</span>
                </div>
              </div>
            </div>

            {/* Verification QR */}
            <div className="text-center flex-shrink-0 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <canvas ref={qrRef} className="block mx-auto rounded-lg" />
              <span className="text-[10px] font-bold text-slate-500 mt-1 block">એન્ટ્રી પર સ્કેન કરો</span>
            </div>
          </div>

          {/* List of Registered Members */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              નોંધાયેલા ગ્રૂપના સભ્યોની યાદી ({memberCount}):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {members.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800 truncate">
                    {i + 1}. {m.name || `સભ્ય ${i + 1}`}
                  </span>
                  <span className="text-slate-500 text-[11px] flex-shrink-0">
                    {m.age} વર્ષ • {m.gender === 'Male' ? 'પુરુષ' : m.gender === 'Female' ? 'સ્ત્રી' : 'અન્ય'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Important Assembly & Reporting Point Note */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed">
            <p className="font-bold mb-0.5">📍 સૂચના અને ઉપડવાનું સ્થળ:</p>
            <p>{config.reportingPoint || "બસ ઉપડવાનું સ્થળ: જોથાણ (સમયસર પહોંચવું)"}</p>
            <p className="mt-1 text-slate-500">
              {isBus ? "જોથાણથી બસ સમયસર ઉપડશે. બસમાં બેસતી વખતે આ ડિજિટલ પાસ ફોનમાં રાખવો." : "તમારા પોતાના વાહન સાથે સમયસર પિકનિક સ્થળ પર પહોંચી જવું."}
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 font-medium">
            કોઈપણ પ્રશ્ન કે મુશ્કેલી માટે પિકનિક કમિટીનો સંપર્ક કરવો.
          </p>
        </div>

      </div>
    </div>
  );
};
