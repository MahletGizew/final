import React, { useState, useEffect, useRef } from "react";
import { TeacherCard, Teacher } from "./TeacherCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import {useAuth} from '@/context/AuthContext'

const GRADES = ["All", "9", "10", "11", "12"];
const SORT_OPTIONS = [
  { label: "Rating: High to Low", value: "rating_desc" },
  { label: "Rating: Low to High", value: "rating_asc" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

export const TeachersList = () => {
  const {user, userRole}= useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCallLink, setCurrentCallLink] = useState<string | null>(null);

  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSort, setSelectedSort] = useState("newest");

  const jitsiContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLiveOnly, setShowLiveOnly] = useState(false);

  const apiRef = useRef<any>(null);

 const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
const [currentCallTeacherId, setCurrentCallTeacherId] = useState<string | null>(null);

const handleJoinCall = async (callLink: string, teacher: Teacher) => {
  if (userRole === "teacher" && user?.id === teacher.created_by) {
    await supabase
      .from("teachers")
      .update({ is_live: true })
      .eq("id", teacher.id);
  }

  setCurrentCallTeacherId(teacher.id);
  setCurrentCallLink(callLink);
};

const handleLeaveCall = async () => {
  if (!currentCallTeacherId) return;

  const currentTeacher = teachers.find(t => t.id === currentCallTeacherId);
  if (userRole === "teacher" && user?.id === currentTeacher?.created_by) {
    await supabase
      .from("teachers")
      .update({ is_live: false })
      .eq("id", currentCallTeacherId);
  }

  setCurrentCallTeacherId(null);
  setCurrentCallLink(null);
};



  useEffect(() => {
    fetchTeachers();

    // Set up realtime subscription
    const channel = supabase
      .channel("teachers_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teachers" },
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
        .from("teachers")
        .select("*");

      if (error) throw error;

      setTeachers(data || []);
    } catch (err: any) {
      console.error("Error fetching teachers:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers by selectedGrade
const filteredTeachers = teachers.filter((teacher) => {
  if (showLiveOnly && !teacher.is_live) return false;
  if (selectedGrade !== "All" && teacher.grade !== selectedGrade) return false;
  return true;
});

  // Sort filtered teachers
  const sortedTeachers = [...filteredTeachers].sort((a, b) => {
    switch (selectedSort) {
      case "rating_desc":
        return (b.rating ?? 0) - (a.rating ?? 0);
      case "rating_asc":
        return (a.rating ?? 0) - (b.rating ?? 0);
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      default:
        return 0;
    }
  });

  // Jitsi effect remains unchanged
  useEffect(() => {
    if (currentCallLink && jitsiContainerRef.current) {
      const domain = "meet.jit.si";
      const roomName = new URL(currentCallLink).pathname.substring(1);

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

  return (
    <>
      {!currentCallLink ? (
        <>
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Grade filter */}
            <label>
              Grade:{" "}
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="border rounded p-1"
              >
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>

            {/* Sort by rating or date */}
            <label>
              Sort by:{" "}
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="border rounded p-1"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center space-x-2 mb-4">
  <input
    type="checkbox"
    checked={showLiveOnly}
    onChange={() => setShowLiveOnly(!showLiveOnly)}
  />
  <span>Show Live Teachers Only</span>
</label>
          </div>

          {sortedTeachers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No teachers match the selected filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTeachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onJoinCall={handleJoinCall}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          <button
            onClick={handleLeaveCall}
            className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Leave Call
          </button>
          <div ref={jitsiContainerRef} style={{ width: "100%", height: 600 }} />
        </div>
      )}
    </>
  );
};
