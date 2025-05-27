import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Layout/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { StudySessionsTable } from './StudySessionsTable';
import { UpcomingTeacherSessionsTable } from './UpcomingTeacherSessionsTable';
import { AdminOverview } from './AdminOverview';

const WelcomePage = () => {
  const { user, userRole } = useAuth();
  const [userInfo, setUserInfo] = useState<{ fullname?: string; email?: string } | null>(null);

  // Function to fetch user info from users table
  const fetchUserInfo = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('fullname, email')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Error fetching user info:', error);
      setUserInfo(null);
    } else {
      setUserInfo(data);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserInfo(user.id);
    }
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300 pt-20">
      <Navbar />

      <header className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold">
          Welcome, {userInfo?.fullname || user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          This platform helps manage and track virtual study sessions to support academic success.
        </p>
      </header>

      <main className="px-6 py-6">
        {userRole === 'student' && (
          <>
            <h2 className="text-xl font-semibold mb-4">Your Study Sessions</h2>
            <StudySessionsTable userId={user.id} />
          </>
        )}

        {userRole === 'teacher' && (
          <>
            <h2 className="text-xl font-semibold mb-4">Upcoming Sessions You're Teaching</h2>
            <UpcomingTeacherSessionsTable teacherId={user.id} />
          </>
        )}

        {userRole === 'admin' && (
          <>
            <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
            <AdminOverview />
          </>
        )}
      </main>
    </div>
  );
};

export default WelcomePage;