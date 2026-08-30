import { useState, useEffect } from 'react';
import { Shield, Sparkles, LayoutGrid, ClipboardList, PlusCircle, AlertCircle, FileText } from 'lucide-react';
import type { Patient, VitalsReading, Recommendation, AuditLogEntry, EsiLevel } from './types';
import { VITALS_HISTORIES } from './data/mockData';
import { Dashboard } from './screens/Dashboard';
import { IntakeForm } from './screens/IntakeForm';
import { PatientDetail } from './screens/PatientDetail';
import { CapacityView } from './screens/CapacityView';
import { AuditTrailView } from './screens/AuditTrailView';
import { AboutView } from './screens/AboutView';
import { DeteriorationAlertModal, RecommendationCard, DecisionButtons, DemoPanel } from './components';

function App() {
  const [currentRoute, setCurrentRoute] = useState<'dashboard' | 'intake' | 'capacity' | 'audit' | 'patient-detail' | 'pending-triage' | 'about'>('dashboard');
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [surgeMode, setSurgeMode] = useState<boolean>(false);

  // Core queue data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [vitals, setVitals] = useState<Record<string, VitalsReading>>({});
  const [recommendations, setRecommendations] = useState<Record<string, Recommendation>>({});
  const [triageStatuses, setTriageStatuses] = useState<Record<string, 'PENDING' | 'ACCEPTED' | 'MODIFIED' | 'OVERRIDDEN'>>({});
  const [waitTimes, setWaitTimes] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  // Intake staging states
  const [stagingPatient, setStagingPatient] = useState<Patient | null>(null);
  const [stagingVitals, setStagingVitals] = useState<VitalsReading | null>(null);
  const [stagingRecommendation, setStagingRecommendation] = useState<Recommendation | null>(null);

  // Toast & Modal states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertPatientId, setAlertPatientId] = useState('');
  const [alertReason, setAlertReason] = useState('');

  // Simulation states
  const [simState, setSimState] = useState({ isRunning: false, multiplier: 1, simNow: new Date().toISOString() });
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // Fetch functions
  const loadPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      
      const pList: Patient[] = [];
      const vMap: Record<string, VitalsReading> = {};
      const rMap: Record<string, Recommendation> = {};
      const tMap: Record<string, any> = {};
      const wMap: Record<string, number> = {};
      
      data.forEach((p: any) => {
        pList.push(p);
        if (p.latest_vitals) vMap[p.id] = p.latest_vitals;
        if (p.latest_recommendation) {
          rMap[p.id] = {
            ...p.latest_recommendation,
            acuity_score: p.latest_recommendation.acuity_score,
            confidence_score: p.latest_recommendation.confidence_pct,
            explanation: p.latest_recommendation.rationale_text || '',
            escalation_reason: p.latest_recommendation.escalation_reason || null,
            is_escalated_low_confidence: p.latest_recommendation.escalated,
            is_escalated_red_flag: false,
            is_escalated_clinical: false,
          };
        }
        tMap[p.id] = p.triage_status;
        
        // Mock wait times based on created_at difference using SIMULATED TIME
        const createdTime = new Date(p.created_at).getTime();
        const simNowMs = new Date(simState.simNow).getTime();
        const diffMins = Math.floor((simNowMs - createdTime) / 60000);
        wMap[p.id] = Math.max(0, diffMins);
      });
      
      setPatients(pList);
      setVitals(vMap);
      setRecommendations(rMap);
      setTriageStatuses(tMap);
      setWaitTimes(wMap);
    } catch (err) {
      console.error('Failed to load patients', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs', err);
    }
  };

  const loadCapacity = async () => {
    try {
      await fetch('/api/capacity');
    } catch (err) {
      console.error('Failed to load capacity', err);
    }
  };

  const pollSimState = async () => {
    try {
      const res = await fetch('/api/simulation/state');
      const data = await res.json();
      setSimState({ isRunning: data.isRunning, multiplier: data.multiplier, simNow: data.simNow });
      setActiveAlerts(data.alerts);
      
      // If we have an active alert and the modal isn't open, open it
      if (data.alerts.length > 0 && !isAlertOpen) {
        setAlertPatientId(data.alerts[0].patient_id);
        setAlertReason(data.alerts[0].message);
        setIsAlertOpen(true);
      }
    } catch (err) {
      console.error('Failed to poll sim state', err);
    }
  };

  useEffect(() => {
    loadPatients();
    loadAuditLogs();
    loadCapacity();
    
    // Fast polling for demo simulation
    const interval = setInterval(() => {
      pollSimState();
      loadPatients(); // keep queue fresh in demo mode
    }, 2000);
    return () => clearInterval(interval);
  }, [simState.simNow]); // Re-bind on simNow change to keep wait times calculating correctly

  const handleSimControl = async (action: string, multiplier?: number) => {
    await fetch('/api/simulation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, multiplier })
    });
    pollSimState();
  };

  const handleFireDeterioration = async (patientId: string) => {
    await fetch('/api/simulation/deteriorate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId })
    });
  };

  const handleForceZoneFull = async () => {
    await fetch('/api/capacity/force-full', { method: 'POST' });
    loadCapacity();
  };

  const handleResetDb = async () => {
    await fetch('/api/reset-db', { method: 'POST' });
    window.location.reload();
  };

  const handleDismissAlert = async () => {
    if (activeAlerts.length > 0) {
      const alertId = activeAlerts[0].id;
      await fetch(`/api/alerts/${alertId}/dismiss`, { method: 'POST' });
    }
    setIsAlertOpen(false);
    loadAuditLogs();
  };

  const handleToggleSurgeMode = async () => {
    const newMode = !surgeMode;
    setSurgeMode(newMode);
    try {
      await fetch('/api/capacity/surge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surge_mode: newMode, actor: 'charge_nurse_admin' })
      });
      triggerToast(`Surge Mode ${newMode ? 'ACTIVATED' : 'DEACTIVATED'}. Audit log recorded.`);
      loadAuditLogs();
      loadCapacity();
    } catch (err) {
      console.error(err);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const executeTriageAction = async (rId: string, action_type: string, modified_acuity: number | null, modified_routing: string, note: string) => {
    try {
      await fetch(`/api/recommendations/${rId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type, modified_acuity, modified_routing, note, actor_name: 'nurse_carter_rn' })
      });
      triggerToast(`Triage action ${action_type} confirmed for patient.`);
      
      if (currentRoute === 'pending-triage') {
        setCurrentRoute('dashboard');
      }
      loadPatients();
      loadAuditLogs();
    } catch (err) {
      console.error('Failed to triage', err);
    }
  };

  const handleTriageAccept = (rId: string, routing: string) => {
    executeTriageAction(rId, 'ACCEPT', null, routing, 'Accepted AI recommendation.');
  };

  const handleTriageModify = (rId: string, routing: string) => {
    executeTriageAction(rId, 'MODIFY', null, routing, `Modified routing to: ${routing}`);
  };

  const handleTriageOverride = (rId: string, newEsi: EsiLevel, note: string, routing: string) => {
    executeTriageAction(rId, 'OVERRIDE', newEsi, routing, note);
  };

  const handleIntakeSubmit = async (newPatData: any, newVitData: any, nurseObs: string) => {
    try {
      // 1. Create Patient & initial Vitals
      const pRes = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPatData, nurse_observation: nurseObs, vitals: newVitData })
      });
      const { id: pId } = await pRes.json();

      // 3. Trigger Recommendation (Backend evaluates and creates recommendation using Gemini AI)
      const rRes = await fetch(`/api/patients/${pId}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Let backend dynamically extract redFlags, lifeThreateningFlags, symptoms
      });
      const { id: rId, evaluation } = await rRes.json();

      // Set Staging State
      setStagingPatient({ ...newPatData, id: pId, created_at: new Date().toISOString() });
      setStagingVitals(newVitData);
      setStagingRecommendation({
        id: rId,
        patient_id: pId,
        acuity_score: evaluation.acuity_score,
        confidence_score: evaluation.confidence_pct,
        explanation: evaluation.clinical_rationale,
        escalation_reason: evaluation.escalation_reason || null,
        key_drivers: evaluation.key_drivers,
        is_escalated_low_confidence: evaluation.confidence_pct < 60,
        is_escalated_red_flag: evaluation.key_drivers.some((d: string) => d.includes('Red Flag') || d.includes('Life Threat')),
        is_escalated_clinical: false,
        suggested_routing: evaluation.suggested_routing,
        is_capacity_adjusted: evaluation.is_capacity_adjusted,
        model_version: evaluation.model_version,
        shap_drivers: evaluation.shap_drivers,
        deterioration_risk_pct: evaluation.deterioration_risk_pct,
        time_to_deterioration_mins: evaluation.time_to_deterioration_mins,
        timestamp: new Date().toISOString()
      });

      setCurrentRoute('pending-triage');
      loadPatients();
      loadAuditLogs();
    } catch (err) {
      console.error('Intake failed', err);
    }
  };

  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];
  const activeVitals = activePatient ? vitals[activePatient.id] : null;
  const activeRecommendation = activePatient ? recommendations[activePatient.id] : null;
  const activeHistory = activePatient ? VITALS_HISTORIES[activePatient.id] || { heart_rate: [75, 78, 80] } : null;

  return (
    <div className="min-h-screen bg-clinical-bg flex flex-col font-sans relative">
      <nav className="bg-slate-900 text-white shadow-md select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-blue-600 rounded">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-wider flex items-center">
                  MIAI <span className="ml-1.5 px-1.5 py-0.25 bg-blue-500/30 text-blue-200 border border-blue-500/40 rounded text-[9px] font-semibold">Triage.ai</span>
                </span>
                <span className="block text-[9px] text-slate-400">Emergency Medicine Decision Assistant</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-semibold">
              <button onClick={() => setCurrentRoute('dashboard')} className={`px-3 py-1.5 rounded transition-colors flex items-center ${currentRoute === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'}`}>
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Triage Queue
              </button>
              <button onClick={() => setCurrentRoute('intake')} className={`px-3 py-1.5 rounded transition-colors flex items-center ${currentRoute === 'intake' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'}`}>
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> New Intake
              </button>
              <button onClick={() => setCurrentRoute('capacity')} className={`px-3 py-1.5 rounded transition-colors flex items-center ${currentRoute === 'capacity' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'}`}>
                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Capacity Analytics
              </button>
              <button onClick={() => setCurrentRoute('audit')} className={`px-3 py-1.5 rounded transition-colors flex items-center ${currentRoute === 'audit' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:text-white'}`}>
                <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> HIPAA Audit Logs
              </button>
            <button
              onClick={() => setCurrentRoute('about')}
              className={`flex flex-col items-center p-2 rounded w-16 transition-colors ${currentRoute === 'about' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-semibold tracking-wider">About</span>
            </button>
            </div>
          </div>
        </div>
      </nav>

      {toastMessage && (
        <div className="fixed top-4 right-4 z-55 max-w-sm w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-3 shadow-2xl flex items-center space-x-2.5 animate-bounce-slow">
          <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-pulse" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {currentRoute === 'dashboard' && (
          <Dashboard
            patients={patients}
            vitals={vitals}
            triageStatuses={triageStatuses}
            waitTimes={waitTimes}
            surgeMode={surgeMode}
            onToggleSurgeMode={handleToggleSurgeMode}
            onSelectPatient={(id) => {
              setActivePatientId(id);
              setCurrentRoute('patient-detail');
            }}
            triggerDemoAlert={(id, reason) => {
              setAlertPatientId(id);
              setAlertReason(reason);
              setIsAlertOpen(true);
            }}
          />
        )}

        {currentRoute === 'intake' && (
          <IntakeForm onSubmit={handleIntakeSubmit} />
        )}

        {currentRoute === 'patient-detail' && activePatient && activeVitals && activeRecommendation && activeHistory && (
          <PatientDetail
            patient={activePatient}
            vitals={activeVitals}
            vitalsHistory={activeHistory}
            recommendation={activeRecommendation}
            status={triageStatuses[activePatient.id] || 'PENDING'}
            onAccept={(routing) => handleTriageAccept(activeRecommendation.id, routing)}
            onModify={(routing) => handleTriageModify(activeRecommendation.id, routing)}
            onOverride={(newEsi, note, routing) => handleTriageOverride(activeRecommendation.id, newEsi, note, routing)}
            onBack={() => setCurrentRoute('dashboard')}
          />
        )}

        {currentRoute === 'capacity' && (
          <CapacityView
            patients={patients}
            waitTimes={waitTimes}
            surgeMode={surgeMode}
          />
        )}

        {currentRoute === 'audit' && (
          <AuditTrailView logs={logs} />
        )}

        {currentRoute === 'about' && (
          <AboutView />
        )}

        {currentRoute === 'pending-triage' && stagingPatient && stagingRecommendation && stagingVitals && (
          <div className="max-w-2xl mx-auto space-y-6">
            <header className="bg-slate-50 border p-4 rounded flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Triage Intake complete</h2>
                <p className="text-xs text-slate-500 mt-0.5">Please confirm clinical triage scoring for patient {stagingPatient.name}.</p>
              </div>
              <span className="text-xs font-mono bg-slate-200 border px-1.5 rounded">T0 Stage</span>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Recommendation</h3>
                <RecommendationCard recommendation={stagingRecommendation} />
              </div>

              <div className="bg-white border rounded p-4.5 space-y-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-blue-500" /> Sign-off Action Required
                  </h3>
                  <p className="text-xs text-slate-500 mb-3.5">
                    Select triage routing or ESI override values before this patient is queued on the main board.
                  </p>

                  <DecisionButtons
                    recommendedEsi={stagingRecommendation.acuity_score}
                    suggestedRouting={stagingRecommendation.suggested_routing}
                    onAccept={(routing) => handleTriageAccept(stagingRecommendation.id, routing)}
                    onModify={(routing) => handleTriageModify(stagingRecommendation.id, routing)}
                    onOverride={(newEsi, note, routing) => handleTriageOverride(stagingRecommendation.id, newEsi, note, routing)}
                  />
                </div>
                
                <div className="pt-3 border-t text-[10px] text-clinical-text-secondary leading-normal">
                  Note: Confirmed decisions are logged automatically to the HIPAA-compliant ledger.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isAlertOpen && (
        <DeteriorationAlertModal
          isOpen={isAlertOpen}
          onClose={handleDismissAlert}
          patientName={patients.find(p => p.id === alertPatientId)?.name || 'Unknown Patient'}
          patientId={alertPatientId}
          reason={alertReason}
          onReassess={() => {
            handleDismissAlert();
            setActivePatientId(alertPatientId);
            setCurrentRoute('patient-detail');
          }}
        />
      )}

      <DemoPanel
        simState={simState}
        surgeMode={surgeMode}
        patients={patients.map(p => ({ id: p.id, name: p.name }))}
        onSimControl={handleSimControl}
        onToggleSurge={() => setSurgeMode(!surgeMode)}
        onForceZoneFull={handleForceZoneFull}
        onFireDeterioration={handleFireDeterioration}
        onResetDb={handleResetDb}
      />

      <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 py-3.5 text-center text-xs fixed bottom-0 left-0 right-0 z-40 select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>MIAI Emergency Department Dashboard • Accenture Innovation Challenge 2026</span>
          <span className="font-semibold text-amber-500 flex items-center">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Prototype for demonstration only. Uses simulated data. Not clinically validated.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
