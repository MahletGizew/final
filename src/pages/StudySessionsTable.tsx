import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface StudySession {
  id: string;
  subject_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  notes: string | null;
}

export const StudySessionsTable = ({ userId }: { userId: string }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);

 // Fetch sessions
  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .order('start_time', { ascending: true });

    if (!error && data) setSessions(data);
  };

  useEffect(() => {
    fetchSessions();

    // Set up realtime subscription to live_sessions
    const channel = supabase
      .channel('live_sessions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_sessions' },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);


  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="p-3 text-left">Subject</th>
            <th className="p-3 text-left">Start Time</th>
            <th className="p-3 text-left">End Time</th>
            <th className="p-3 text-left">Duration</th>
            <th className="p-3 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="p-3">{session.subject_id}</td>
              <td className="p-3">{new Date(session.start_time).toLocaleString()}</td>
              <td className="p-3">{new Date(session.end_time).toLocaleString()}</td>
              <td className="p-3">{session.duration} min</td>
              <td className="p-3">{session.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
