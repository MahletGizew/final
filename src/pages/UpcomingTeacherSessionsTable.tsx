import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface StudySession {
  id: string;
  subject_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  notes: string | null;
}

export const UpcomingTeacherSessionsTable = ({ teacherId }: { teacherId: string }) => {
    const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<Partial<StudySession>>({});

  const fetchSessions = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', teacherId)
    //   .gt('start_time', now)
      .order('start_time');
     fetchSessions()
    if (!error) setSessions(data || []);
  };

  useEffect(() => {
    fetchSessions();
  }, [teacherId]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('study_sessions').delete().eq('id', id);
    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleEdit = (session: StudySession) => {
    setEditingId(session.id);
    setFormState(session);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setLoading(true);

    const { error } = await supabase
      .from('study_sessions')
      .update({
        subject_id: formState.subject_id,
        start_time: formState.start_time,
        end_time: formState.end_time,
        duration: formState.duration,
        notes: formState.notes,
      })
      .eq('id', editingId);

    if (!error) {
      await fetchSessions();
      setEditingId(null);
    }

    setLoading(false);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="p-3 text-left">Subject</th>
            <th className="p-3 text-left">Start</th>
            <th className="p-3 text-left">End</th>
            <th className="p-3 text-left">Duration</th>
            <th className="p-3 text-left">Notes</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
             {sessions.length === 0 ? (
    <tr>
      <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
        <p className="mb-4">No upcoming study sessions found.</p>
        <Button onClick={() => navigate('/teacher-connect')}>Create a Session</Button>
      </td>
    </tr>
  ) : (
          sessions.map((session) => (
            <tr
              key={session.id}
              className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {editingId === session.id ? (
                <>
                  <td className="p-2">
                    <input
                      className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-1 rounded"
                      value={formState.subject_id || ''}
                      onChange={(e) => setFormState({ ...formState, subject_id: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="datetime-local"
                      className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-1 rounded"
                      value={formState.start_time?.slice(0, 16) || ''}
                      onChange={(e) => setFormState({ ...formState, start_time: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="datetime-local"
                      className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-1 rounded"
                      value={formState.end_time?.slice(0, 16) || ''}
                      onChange={(e) => setFormState({ ...formState, end_time: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-1 rounded"
                      value={formState.duration || 0}
                      onChange={(e) => setFormState({ ...formState, duration: +e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full bg-white dark:bg-gray-700 text-black dark:text-white p-1 rounded"
                      value={formState.notes || ''}
                      onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    />
                  </td>
                  <td className="p-2 flex gap-2">
                    <Button onClick={handleSave} disabled={loading}>
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-3">{session.subject_id}</td>
                  <td className="p-3">{format(new Date(session.start_time), 'PPpp')}</td>
                  <td className="p-3">{format(new Date(session.end_time), 'PPpp')}</td>
                  <td className="p-3">{session.duration} min</td>
                  <td className="p-3">{session.notes || '—'}</td>
                  <td className="p-3 flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(session)} variant="secondary">
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </td>
                </>
              )}
            </tr>
    ))
  )}
</tbody>
      </table>
    </div>
  );
};
