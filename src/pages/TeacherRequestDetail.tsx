
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TeacherRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase.from("pending_requests").select("*").eq("id", id).single();
        if (error) throw error;
        setRequest(data);
      } catch (error) {
        console.error("Error loading request:", error);
        toast.error("Failed to load request details");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  const handleApprove = async () => {
    if (!request) return;
    try {
      await supabase.from("user_roles").upsert({ user_id: request.user_id, role: "teacher" });
      await supabase.from("pending_requests").update({ status: "approved" }).eq("id", request.id);
      toast.success("Request approved and user promoted to teacher");
      navigate("/admin");
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    }
  };

  const handleReject = async () => {
    if (!request) return;
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await supabase.from("pending_requests").update({ status: "rejected", rejection_reason: reason }).eq("id", request.id);
      toast.success("Request rejected");
      navigate("/admin");
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin h-8 w-8 rounded-full border-t-2 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center">
          <p className="text-red-500">Request not found.</p>
          <Button onClick={() => navigate("/admin")}>Back to Admin</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Teacher Request Details</h1>
        <div className="space-y-4 max-w-2xl">
          <div>
            <strong>Full Name:</strong> {request.full_name}
          </div>
          <div>
            <strong>Subject:</strong> {request.subject}
          </div>
          <div>
            <strong>Grade:</strong> {request.grade}
          </div>
          <div>
            <strong>CV:</strong>{" "}
            <a href={request.cv_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
              View CV
            </a>
          </div>
          <div>
            <strong>Certificates:</strong>
            <ul className="list-disc list-inside">
              {request.certificates_url?.map((url: string, i: number) => (
                <li key={i}>
                  <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                    Certificate {i + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Additional Info:</strong>
            <p>{request.additional_info || "N/A"}</p>
          </div>
          {/* Add more fields here as needed */}
          <div className="flex gap-4 mt-6">
            <Button onClick={handleApprove}>Approve</Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Back
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherRequestDetail;
