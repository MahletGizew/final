import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Fetch user info from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("fullname, email, created_at")
          .eq("id", userId)
          .single();
        if (userError) throw userError;
        setUser(userData);

        // Fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (rolesError) throw rolesError;
        setRoles((rolesData || []).map((r) => r.role));
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchUserProfile();
  }, [userId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 px-4">
        <div className="container mx-auto py-8">
          <Button variant="outline" className="mb-6" onClick={() => navigate(-1)}>
            &larr; Back
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>View user details and roles</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 rounded-full border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : user ? (
                <div className="space-y-4">
                  <div>
                    <span className="font-semibold">Full Name:</span>{" "}
                    {user.fullname || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    {user.email || "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Joined:</span>{" "}
                    {user.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Roles:</span>{" "}
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <span
                          key={role}
                          className={`inline-block px-2 py-1 mr-2 rounded text-xs ${
                            role === "admin"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No roles assigned</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  User not found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;