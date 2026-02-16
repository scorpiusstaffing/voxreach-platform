import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { PhoneCall, ArrowLeft, Mic, Bot, FileText, Sparkles, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Call {
  id: string;
  direction: string;
  status: string;
  fromNumber: string;
  toNumber: string;
  durationSeconds: number | null;
  transcript: string | null;
  summary: string | null;
  recordingUrl: string | null;
  outcome: string | null;
  metadata: any;
  agent: { id: string; name: string } | null;
  phoneNumber: { id: string; number: string; friendlyName: string } | null;
  createdAt: string;
}

export default function Calls() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      api.get('/calls?limit=50')
        .then((res) => setCalls(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getAnalysis = (call: Call) => {
    return call.metadata?.analysis || null;
  };

  const getStructuredData = (call: Call) => {
    return call.metadata?.analysis?.structuredData || null;
  };

  if (authLoading || !user) return null;

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <h1 className="text-2xl font-semibold text-stone-900 mb-8">Call History</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
                <div className="h-4 bg-stone-100 rounded w-48 mb-2" />
                <div className="h-3 bg-stone-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <PhoneCall className="w-12 h-12 text-stone-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900 mb-2">No calls yet</h3>
            <p className="text-stone-500">Calls will appear here once your agents start making or receiving them.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200">
            {calls.map((call, index) => {
              const isExpanded = expandedCall === call.id;
              const analysis = getAnalysis(call);
              const structuredData = getStructuredData(call);
              
              return (
                <div key={call.id} className={index !== calls.length - 1 ? 'border-b border-stone-200' : ''}>
                  <button
                    onClick={() => setExpandedCall(isExpanded ? null : call.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        call.direction === 'outbound' ? 'bg-stone-1000/10 text-blue-400 border border-stone-200' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {call.direction === 'outbound' ? '↗ Out' : '↙ In'}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-stone-900">
                          {call.direction === 'outbound' ? call.toNumber : call.fromNumber}
                        </div>
                        <div className="text-xs text-stone-500">
                          {call.agent?.name || 'Unknown'} · {new Date(call.createdAt).toLocaleString()}
                          {call.durationSeconds ? ` · ${formatDuration(call.durationSeconds)}` : ''}
                        </div>
                      </div>
                      {analysis?.successEvaluation && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          analysis.successEvaluation.toLowerCase().includes('success') 
                            ? 'badge-success-dark' 
                            : 'badge-error-dark'
                        }`}>
                          {analysis.successEvaluation.toLowerCase().includes('success') 
                            ? <CheckCircle className="w-3 h-3" /> 
                            : <XCircle className="w-3 h-3" />
                          }
                          {analysis.successEvaluation}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        call.status === 'completed' ? 'badge-success-dark' :
                        call.status === 'failed' || call.status === 'no_answer' ? 'badge-error-dark' :
                        call.status === 'in_progress' ? 'badge-warning-dark' :
                        'badge-neutral-dark'
                      }`}>
                        {call.status.replace('_', ' ')}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 bg-white/50">
                      {analysis?.summary && (
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-stone-900 mb-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            AI Summary
                          </div>
                          <p className="text-sm text-stone-500">{analysis.summary}</p>
                        </div>
                      )}

                      {structuredData && Object.keys(structuredData).length > 0 && (
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-stone-900 mb-3">
                            <FileText className="w-4 h-4 text-amber-600" />
                            Extracted Data
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(structuredData).map(([key, value]) => (
                              <div key={key} className="bg-stone-50 rounded-lg p-3 border border-stone-200">
                                <div className="text-xs text-stone-500 uppercase tracking-wider">{key}</div>
                                <div className="text-sm font-medium text-stone-900">{String(value)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {call.transcript && (
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-stone-900 mb-2">
                            <Mic className="w-4 h-4 text-stone-500" />
                            Transcript
                          </div>
                          <p className="text-sm text-stone-500 whitespace-pre-wrap max-h-64 overflow-y-auto bg-stone-50 rounded-lg p-3 border border-stone-200">
                            {call.transcript}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div className="bg-white rounded-lg p-3 border border-stone-200">
                          <div className="text-xs text-stone-500 mb-1">From</div>
                          <div className="font-medium text-stone-900">{call.fromNumber}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-stone-200">
                          <div className="text-xs text-stone-500 mb-1">To</div>
                          <div className="font-medium text-stone-900">{call.toNumber}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-stone-200">
                          <div className="text-xs text-stone-500 mb-1">Duration</div>
                          <div className="font-medium text-stone-900">{formatDuration(call.durationSeconds)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-stone-200">
                          <div className="text-xs text-stone-500 mb-1">Agent</div>
                          <div className="font-medium text-stone-900">{call.agent?.name || 'Unknown'}</div>
                        </div>
                      </div>

                      {call.recordingUrl && (
                        <div className="bg-white rounded-lg p-4 border border-stone-200">
                          <div className="flex items-center gap-2 text-sm font-medium text-stone-900 mb-2">
                            <PhoneCall className="w-4 h-4 text-stone-500" />
                            Recording
                          </div>
                          <audio controls className="w-full">
                            <source src={call.recordingUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
