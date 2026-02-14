import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { PhoneCall, ArrowLeft } from 'lucide-react';

interface Call {
  id: string;
  direction: string;
  status: string;
  fromNumber: string;
  toNumber: string;
  durationSeconds: number | null;
  transcript: string | null;
  summary: string | null;
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

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 ml-64 p-8">
      <div className="max-w-4xl">
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <h1 className="text-2xl font-semibold text-gray-900 mb-8">Call History</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <PhoneCall className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
            <p className="text-gray-500">Calls will appear here once your agents start making or receiving them.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {calls.map((call) => (
              <div key={call.id}>
                <button
                  onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      call.direction === 'outbound' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {call.direction === 'outbound' ? '↗ Out' : '↙ In'}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {call.direction === 'outbound' ? call.toNumber : call.fromNumber}
                      </div>
                      <div className="text-xs text-gray-400">
                        {call.agent?.name || 'Unknown'} · {new Date(call.createdAt).toLocaleString()}
                        {call.durationSeconds && ` · ${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s`}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    call.status === 'completed' ? 'bg-green-50 text-green-700' :
                    call.status === 'failed' || call.status === 'no_answer' ? 'bg-red-50 text-red-700' :
                    call.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {call.status.replace('_', ' ')}
                  </span>
                </button>

                {expandedCall === call.id && (call.transcript || call.summary) && (
                  <div className="px-6 pb-4 space-y-3">
                    {call.summary && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Summary</div>
                        <p className="text-sm text-gray-700">{call.summary}</p>
                      </div>
                    )}
                    {call.transcript && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Transcript</div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-3">
                          {call.transcript}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
