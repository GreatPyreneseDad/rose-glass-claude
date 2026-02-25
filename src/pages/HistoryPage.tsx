import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Session = Database['public']['Tables']['sessions']['Row'];

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDimensional = (value: number | null) => {
    if (value === null) return '—';
    return value.toFixed(2);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="bg-[var(--sidebar-bg)] border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--accent-hot)]">
              Session History
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Past translation sessions and dimensional trajectories
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/chat"
              className="px-4 py-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hot)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              New Session
            </Link>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded px-4 py-3">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[var(--text-muted)] mb-4">No sessions yet</div>
            <Link
              to="/chat"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hot)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Start Your First Translation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 hover:border-[var(--accent-primary)]/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                      {session.title || 'Untitled Session'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                      <span>Last active: {formatDate(session.last_active)}</span>
                      <span>•</span>
                      <span>{session.message_count} messages</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 rounded text-[var(--accent-primary)] text-xs font-mono">
                        /{session.mode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dimensional Averages */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Ψ (Psi)</div>
                    <div className="text-lg font-bold text-[var(--accent-primary)]">
                      {formatDimensional(session.avg_psi)}
                    </div>
                  </div>
                  <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">ρ (Rho)</div>
                    <div className="text-lg font-bold text-[var(--accent-hot)]">
                      {formatDimensional(session.avg_rho)}
                    </div>
                  </div>
                  <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">q</div>
                    <div className="text-lg font-bold text-[var(--accent-primary)]">
                      {formatDimensional(session.avg_q)}
                    </div>
                  </div>
                  <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">f</div>
                    <div className="text-lg font-bold text-[var(--accent-hot)]">
                      {formatDimensional(session.avg_f)}
                    </div>
                  </div>
                  <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Distortion</div>
                    <div className="text-lg font-bold text-[var(--text-secondary)]">
                      {formatDimensional(session.final_distortion)}
                    </div>
                  </div>
                  <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Messages</div>
                    <div className="text-lg font-bold text-[var(--text-secondary)]">
                      {session.message_count}
                    </div>
                  </div>
                </div>

                {/* Coherence Trajectory */}
                {session.coherence_trajectory && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="text-xs text-[var(--text-muted)] mb-2">Coherence Trajectory</div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {session.coherence_trajectory}
                    </div>
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
