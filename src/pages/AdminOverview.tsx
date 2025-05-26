import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const AdminOverview = () => {
  const [userCount, setUserCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: users }, { count: sessions }] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('study_sessions').select('*', { count: 'exact', head: true }),
      ]);

      setUserCount(users || 0);
      setSessionCount(sessions || 0);
    };

    fetchCounts();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h3 className="text-lg font-semibold">Total Users</h3>
        <p className="text-2xl mt-2">{userCount}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
        <h3 className="text-lg font-semibold">Total Study Sessions</h3>
        <p className="text-2xl mt-2">{sessionCount}</p>
      </div>
    </div>
  );
};
