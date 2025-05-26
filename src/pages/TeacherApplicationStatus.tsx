import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TeacherApplicationStatus = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState<{
    status: string;
    rejection_reason?: string | null;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchApplication = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pending_requests")
        .select("status,rejection_reason,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching application status:", error);
      } else {
        setApplication(data);
      }
      setLoading(false);
    };

    fetchApplication();
  }, [user]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="text-green-700 bg-green-100 px-2 py-1 rounded font-semibold">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="text-red-700 bg-red-100 px-2 py-1 rounded font-semibold">
            Rejected
          </span>
        );
      case "pending":
        return (
          <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded font-semibold">
            Pending
          </span>
        );
      default:
        return (
          <span className="text-gray-600 bg-gray-200 px-2 py-1 rounded font-semibold">
            Unknown
          </span>
        );
    }
  };

  if (loading) return <p>Loading your application status...</p>;

  if (!application) return <p>You have not submitted a teacher application yet.</p>;

  return (
    <div className="max-w-md mx-auto mt-12 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Status: </strong>
            {renderStatusBadge(application.status)}
          </p>
          {application.status === "rejected" && application.rejection_reason && (
            <p className="mt-4 text-red-600">
              <strong>Rejection Reason:</strong> {application.rejection_reason}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            Submitted on: {new Date(application.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherApplicationStatus;
