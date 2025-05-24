import React, { useState, useEffect, useRef } from "react";
import { TeacherCard, Teacher } from "./TeacherCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const TeachersList = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCallLink, setCurrentCallLink] = useState<string | null>(null);

  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);

  const handleJoinCall = (callLink: string) => {
    setCurrentCallLink(callLink);
  };

  const handleLeaveCall = () => {
    setCurrentCallLink(null);
  };

  useEffect(() => {
    fetchTeachers();

    // Set up a realtime subscription to teachers table
    const channel = supabase
      .channel('teachers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teachers',
        },
        () => {
          fetchTeachers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTeachers(data || []);
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Jitsi API when currentCallLink changes
  useEffect(() => {
    if (currentCallLink && jitsiContainerRef.current) {
      const domain = "meet.jit.si";
      const roomName = new URL(currentCallLink).pathname.substring(1);

      // Dispose existing instance if any
      if (apiRef.current) {
        apiRef.current.dispose();
      }

      // @ts-ignore
      apiRef.current = new window.JitsiMeetExternalAPI(domain, {
        roomName,
        parentNode: jitsiContainerRef.current,
        width: "100%",
        height: 600,
        configOverwrite: {
          startWithAudioMuted: true,
          startWithVideoMuted: true,
        },
      });
    }

    // Clean up on unmount or call link change
    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [currentCallLink]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-md">
        Error loading teachers: {error}
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No teachers available at the moment.
      </div>
    );
  }

  return (
    <>
      {!currentCallLink ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            // Pass onJoinCall to each TeacherCard
            <TeacherCard key={teacher.id} teacher={teacher} onJoinCall={handleJoinCall} />
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={handleLeaveCall}
            className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Leave Call
          </button>
          <div
            ref={jitsiContainerRef}
            style={{ width: "100%", height: 600 }}
          />
        </div>
      )}
    </>
  );
};
