import React, { useState } from 'react';
import { ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import type { Patient, VitalsReading } from '../types';

interface IntakeFormProps {
  onSubmit: (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>, vitals: Omit<VitalsReading, 'id' | 'patient_id' | 'timestamp'>, nurseObservation: string) => void;
  className?: string;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({ onSubmit, className = '' }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Female');
  const [arrivalMode, setArrivalMode] = useState('Walk-in');
  const [chiefComplaint, setChiefComplaint] = useState('');
  
  // Vitals
  const [hr, setHr] = useState<number | ''>('');
  const [bpSystolic, setBpSystolic] = useState<number | ''>('');
  const [bpDiastolic, setBpDiastolic] = useState<number | ''>('');
  const [rr, setRr] = useState<number | ''>('');
  const [spo2, setSpo2] = useState<number | ''>('');
  const [temp, setTemp] = useState<number | ''>('');
  const [pain, setPain] = useState<number>(0);
  
  // Observations
  const [nurseObs, setNurseObs] = useState('');
  const [hasHistory, setHasHistory] = useState(true);
  const [historySummary, setHistorySummary] = useState('History of asthma, allergies to NSAIDs.');

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !chiefComplaint.trim() || hr === '' || bpSystolic === '' || bpDiastolic === '' || rr === '' || spo2 === '' || temp === '') {
      setFormError('All fields including vital signs are required to calculate ESI.');
      return;
    }

    setFormError('');
    setIsLoading(true);

    // Simulate AI extraction loading state
    setTimeout(() => {
      setIsLoading(false);
      onSubmit(
        {
          name: name.trim(),
          dob: dob || '1980-01-01',
          gender,
          has_prior_history: hasHistory,
          arrival_mode: arrivalMode,
          history_summary: hasHistory ? historySummary : null
        },
        {
          heart_rate: Number(hr),
          blood_pressure_systolic: Number(bpSystolic),
          blood_pressure_diastolic: Number(bpDiastolic),
          respiratory_rate: Number(rr),
          oxygen_saturation: Number(spo2),
          temperature: Number(temp),
          pain_score: Number(pain)
        },
        nurseObs.trim()
      );
    }, 1500); // 1.5s loading delay for visual satisfaction
  };

  const loadExampleCase = (type: 'pediatric' | 'geriatric' | 'atypical' | 'zero') => {
    setFormError('');
    switch (type) {
      case 'pediatric':
        setName('Toby Vance');
        setDob('2023-01-15');
        setGender('Male');
        setArrivalMode('Walk-in');
        setChiefComplaint('Child running high fever, extremely lethargic, not eating, had a small seizure warning indicator.');
        setHr(138);
        setBpSystolic(98);
        setBpDiastolic(62);
        setRr(32);
        setSpo2(96);
        setTemp(103.1);
        setPain(7);
        setNurseObs('Toddler is lethargic, warm to touch. Slow response to visual stimuli.');
        setHasHistory(true);
        setHistorySummary('Prior febrile seizure at 18 months.');
        break;
      case 'geriatric':
        setName('Arthur Pendelton');
        setDob('1958-04-12');
        setGender('Male');
        setArrivalMode('Ambulance');
        setChiefComplaint('Elderly male complaining of mild shortness of breath, chronic cough worsening over two days.');
        setHr(94);
        setBpSystolic(138);
        setBpDiastolic(82);
        setRr(22);
        setSpo2(93);
        setTemp(98.4);
        setPain(4);
        setNurseObs('Patient is alert and oriented, using baseline albuterol, wheezing noted globally.');
        setHasHistory(true);
        setHistorySummary('COPD, Congestive Heart Failure, Hypertension.');
        break;
      case 'atypical':
        setName('Elena Rostova');
        setDob('1984-08-22');
        setGender('Female');
        setArrivalMode('Walk-in');
        setChiefComplaint('Presents with severe jaw ache and nausea for 3 hours, feels clammy, pain radiates down left neck.');
        setHr(78);
        setBpSystolic(122);
        setBpDiastolic(78);
        setRr(16);
        setSpo2(99);
        setTemp(98.6);
        setPain(8);
        setNurseObs('Atypical presentation of jaw pain and nausea in female - potential MI equivalent. Normal vitals but clinically ambiguous.');
        setHasHistory(true);
        setHistorySummary('Mild asthma, family history of coronary artery disease.');
        break;
      case 'zero':
        setName('Liam Chen');
        setDob('1997-11-05');
        setGender('Male');
        setArrivalMode('Walk-in');
        setChiefComplaint('Accidental deep cut on forearm from kitchen knife. bleeding controlled. Pain score 5/10.');
        setHr(80);
        setBpSystolic(118);
        setBpDiastolic(76);
        setRr(14);
        setSpo2(98);
        setTemp(98.2);
        setPain(5);
        setNurseObs('Clean 4cm linear laceration, bleeding stopped. Normal movement of fingers, no neural deficits.');
        setHasHistory(false);
        setHistorySummary('');
        break;
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}>
      {/* Form Area */}
      <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-clinical-border rounded p-4.5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-clinical-text-primary">New Patient Clinical Intake</h2>
            <p className="text-xs text-clinical-text-secondary mt-0.5">Enter demographics and T0 vitals to run the ESI assessment engine.</p>
          </div>
          
          <div className="flex space-x-1.5">
            <span className="text-[10px] text-clinical-text-muted font-bold uppercase mr-1">Load Demo Case:</span>
            {['pediatric', 'geriatric', 'atypical', 'zero'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => loadExampleCase(type as any)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border text-[10px] font-semibold text-slate-700 rounded transition-colors"
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 p-2.5 rounded text-xs text-red-800 font-semibold flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Grid 1: Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold text-clinical-text-muted uppercase mb-1">Patient Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-clinical-text-muted uppercase mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-clinical-text-muted uppercase mb-1">Sex</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Grid 2: Arrival & Complaint */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-clinical-text-muted uppercase mb-1">Arrival Mode</label>
            <select
              value={arrivalMode}
              onChange={(e) => setArrivalMode(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Walk-in">Walk-in</option>
              <option value="Ambulance">Ambulance</option>
              <option value="Police">Police</option>
              <option value="Air Transport">Air Transport</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="block text-[10px] font-semibold text-clinical-text-muted uppercase mb-1">Chief Complaint (Free-text)</label>
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="Primary clinical symptom reporting (e.g. crushing chest pain, dyspnea)..."
            />
          </div>
        </div>

        {/* Grid 3: Vitals Reading */}
        <div className="bg-slate-50/50 border border-slate-200 rounded p-3 space-y-2.5">
          <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">T0 Vital Signs Reading</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            <div>
              <label className="block text-[9px] font-semibold text-clinical-text-muted uppercase mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                value={hr}
                onChange={(e) => setHr(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="HR"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-clinical-text-muted uppercase mb-1">BP Systolic</label>
              <input
                type="number"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Systolic"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-clinical-text-muted uppercase mb-1">BP Diastolic</label>
              <input
                type="number"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Diastolic"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-clinical-text-muted uppercase mb-1">Resp Rate (rr)</label>
              <input
                type="number"
                value={rr}
                onChange={(e) => setRr(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="RR"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-clinical-text-muted uppercase mb-1">SpO2 (%)</label>
              <input
                type="number"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="SpO2"
              />
            </div>
            <div>
              <label className="block text-[9px] font-semibold text-clinical-text-muted uppercase mb-1">Temp (°F)</label>
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Temp"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[9px] font-semibold text-clinical-text-muted uppercase">Pain Score (0 - 10)</label>
              <span className="text-xs font-bold text-slate-800">{pain} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={pain}
              onChange={(e) => setPain(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Grid 4: Observation Notes */}
        <div>
          <label className="block text-[10px] font-semibold text-clinical-text-muted uppercase mb-1">Nurse Observation Notes</label>
          <textarea
            rows={2}
            value={nurseObs}
            onChange={(e) => setNurseObs(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Mental status, physical distress cues, mobility limitations, other clinical observations..."
          />
        </div>

        {/* Prior History Area */}
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-clinical-text-muted uppercase">Prior Medical History Summary</span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-clinical-text-secondary">History on File?</span>
              <button
                type="button"
                onClick={() => setHasHistory(prev => !prev)}
                className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hasHistory ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasHistory ? 'translate-x-3.5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {hasHistory ? (
            <textarea
              rows={2}
              value={historySummary}
              onChange={(e) => setHistorySummary(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. Asthma, CAD, Type II Diabetes..."
            />
          ) : (
            <div className="p-3.5 text-center text-xs italic bg-slate-50 border rounded text-clinical-text-secondary border-dashed">
              First-time patient — zero historical medical records found on file.
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded border border-blue-700 shadow-sm transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Extracting clinical findings...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-100" />
                Generate AI Recommendation
              </>
            )}
          </button>
        </div>
      </form>

      {/* Side Help Block */}
      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 p-4.5 rounded shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b pb-1.5">Machine Learning Inference Protocol</h3>
        <p className="text-xs text-clinical-text-secondary leading-relaxed">
          The MIAI system leverages a multi-modal AI approach for predicting patient acuity and deterioration risks.
        </p>
        <div className="bg-white border rounded p-2.5 text-[11px] text-clinical-text-secondary space-y-1.5">
          <p className="font-bold text-slate-800">Model Ensemble:</p>
          <ul className="list-disc list-inside pl-1 space-y-1">
            <li><strong>XGBoost ESI Triage:</strong> Extracts features and scores ESI 1-5 with SHAP value explanations.</li>
            <li><strong>Temporal DNN / GRU:</strong> Predicts continuous deterioration risk using baseline vitals and temporal variance.</li>
            <li><strong>Gemini 1.5 Flash:</strong> Extracts key NLP variables, acts as the persona for evaluation, and synthesizes the final clinical rationale.</li>
          </ul>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-[11px] text-blue-950 font-medium">
          <strong>SHAP Explainability:</strong> The system surfaces all contributing positive and negative drivers so clinicians can transparently trust or overrule the model.
        </div>
      </div>
    </div>
  );
};
