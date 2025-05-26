
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


  const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <h3 className="text-sm font-semibold text-muted-foreground mb-1">{label}:</h3>
    <p className="text-sm">{value || "N/A"}</p>
  </div>
);


 const handleApprove = async () => {
  if (!request) return;

  try {
    const userId = request.user_id;

    // 1. Promote user to teacher
    await supabase.from("user_roles").upsert([
  {
    user_id: userId,
    role: "teacher" as any
  }
]);
await supabase.from("user_roles").upsert([
  {
    user_id: userId,
    role: "teacher" as any
  }
]);

    // 2. Update request status
    await supabase
      .from("pending_requests")
      .update({ status: "approved" })
      .eq("id", request.id);
const generateCallLink = () => `https://meet.jit.si/${crypto.randomUUID()}`;

    // 3. Insert new teacher record
    const { error: insertError } = await supabase.from("teachers").insert({
      name: request.full_name,
      subject: request.subject,
      grade: request.grade,
      educational_background: request.educational_background || null,
      rating: null,
      call_link: generateCallLink(),
      created_by: userId,
    });

    if (insertError) throw insertError;

    toast.success("Request approved and teacher added to system");
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
    <div className="min-h-screen flex flex-col bg-muted">
  <Navbar />
  <main className="flex-grow container mx-auto py-12 px-6">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-primary">Teacher Request Details</h1>

      <div className="space-y-5">
        <DetailRow label="Full Name" value={request.full_name} />
        <DetailRow label="Subject" value={request.subject} />
        <DetailRow label="Grade" value={request.grade} />

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">CV:</h3>
          <a
            href={request.cv_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline hover:text-blue-800 transition"
          >
            View CV
          </a>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Certificates:</h3>
          {request.certificates_url?.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {request.certificates_url.map((url: string, i: number) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 transition"
                  >
                    Certificate {i + 1}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No certificates uploaded.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">Additional Info:</h3>
          <p className="text-sm">{request.additional_info || "N/A"}</p>
        </div>

        <div className="pt-6 flex flex-wrap gap-4">
          <Button onClick={handleApprove}>✅ Approve</Button>
          <Button variant="destructive" onClick={handleReject}>
            ❌ Reject
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            ← Back
          </Button>
        </div>
      </div>
    </div>
  </main>
  <Footer />
</div>

  );
};

export default TeacherRequestDetail;
