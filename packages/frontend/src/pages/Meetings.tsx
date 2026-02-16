import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Calendar, Clock, User, Video, ArrowLeft, ExternalLink } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingLink?: string;
  agentName?: string;
  createdAt: string;
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/calendar/meetings');
      setMeetings(response.data || []);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (filter === 'upcoming') return new Date(meeting.startTime) > new Date();
    if (filter === 'past') return new Date(meeting.startTime) <= new Date();
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/dashboard" className="text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-stone-900">Scheduled Meetings</h1>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-6 animate-pulse">
              <div className="h-5 bg-stone-200 rounded w-48 mb-2" />
              <div className="h-4 bg-stone-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="text-stone-500 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-stone-900">Scheduled Meetings</h1>
        </div>
        <div className="flex gap-2">
          {(['all', 'upcoming', 'past'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">No meetings scheduled</h3>
          <p className="text-stone-500 mb-6">
            Your AI agents can schedule meetings during calls. Connect your calendar to get started.
          </p>
          <Link
            to="/dashboard/calendar"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
          >
            Connect Calendar
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-lg hover:border-amber-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-stone-900">{meeting.title}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      meeting.status === 'scheduled' ? 'bg-green-50 text-green-700' :
                      meeting.status === 'completed' ? 'bg-stone-100 text-stone-600' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                  
                  {meeting.description && (
                    <p className="text-stone-500 text-sm mb-3">{meeting.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-stone-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span>{formatDate(meeting.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                    </div>
                    {meeting.attendeeName && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-500" />
                        <span>{meeting.attendeeName}</span>
                      </div>
                    )}
                  </div>

                  {meeting.agentName && (
                    <div className="mt-3 text-sm text-stone-500">
                      Scheduled by: <span className="text-stone-700 font-medium">{meeting.agentName}</span>
                    </div>
                  )}
                </div>

                {meeting.meetingLink && meeting.status === 'scheduled' && (
                  <a
                    href={meeting.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
                  >
                    <Video className="w-4 h-4" />
                    Join
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
