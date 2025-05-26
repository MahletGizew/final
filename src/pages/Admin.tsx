import React, { useState, useEffect } from "react";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UserCheck, Shield } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";  // <-- React Router

const Admin = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const navigate = useNavigate();  // <-- React Router navigate
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all users with their roles
  useEffect(() => {
    const fetchUsers = async () => {
  try {
    setLoading(true);

    // Fetch users from `auth.users` and extract metadata
    const { data: authUsers, error: authError } = await supabase
      .from("auth.users")
      .select("id, meta_data"); // Adjust field names based on your schema
    if (authError) throw authError;

    // Fetch roles from `user_roles`
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (rolesError) throw rolesError;

    // Merge user roles with fullname from metadata
    const mergedUsers = userRoles.map((role) => {
      const user = authUsers.find((u) => u.id === role.user_id);
      return {
        user_id: role.user_id,
        role: role.role,
        fullname: user?.meta_data?.fullname || "Unknown", // Extract fullname correctly
      };
    });

    setUsers(mergedUsers || []);
  } catch (error) {
    console.error("Error fetching users:", error);
    toast.error("Failed to load users");
  } finally {
    setLoading(false);
  }
};



    fetchUsers();

    const fetchRequests = async () => {
      try {
        setRequestsLoading(true);
        const { data, error } = await supabase.from("pending_requests").select("*").eq("status", "pending");
        if (error) throw error;
        setPendingRequests(data || []);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Failed to load teacher requests");
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchUsers();
    fetchRequests();
  }, []);
 const filteredUsers = users.filter(user =>
    user.metadata?.fullname?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handlePromoteToAdmin = async (userId: string) => {
    try {
      const { data: existingRole, error: checkError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingRole) {
        toast.info("User is already an admin");
        return;
      }

      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
      if (error) throw error;

      toast.success("User promoted to admin");

      const { data: updatedRoles } = await supabase.from("user_roles").select("*");
      setUsers(updatedRoles || []);
    } catch (error: any) {
      console.error("Error promoting user:", error);
      toast.error(error.message || "Failed to promote user");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 px-4">
        <div className="container mx-auto py-8">
          <div className="flex items-center mb-8">
            <Shield className="h-8 w-8 mr-4 text-red-500" />
            <h1 className="text-3xl font-bold">{t("Admin Dashboard")}</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="h-5 w-5 mr-2" />
                {t("Users") || "Users"}
              </CardTitle>
              <CardDescription>{t("Manage user accounts and roles")}</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                placeholder="Search users by name..."
                className="border px-4 py-2 mb-4 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 rounded-full border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userRole) => (
                      <TableRow key={userRole.id}>
                        <TableCell>{userRole.metadata?.fullname || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              userRole.role === "admin"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {userRole.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/admin/user-profile/${userRole.user_id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2" />
                  {t("Teacher Requests") || "Teacher Requests"}
                </CardTitle>
                <CardDescription>{t("Review pending teacher applications")}</CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-6 w-6 rounded-full border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending requests</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>CV</TableHead>
                        <TableHead>Certs</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>{req.full_name}</TableCell>
                          <TableCell>{req.subject}</TableCell>
                          <TableCell>{req.grade}</TableCell>
                          <TableCell>
                            <a href={req.cv_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                              View CV
                            </a>
                          </TableCell>
                          <TableCell>
                            {req.certificates_url?.map((url: string, i: number) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-blue-600 underline"
                              >
                                Cert {i + 1}
                              </a>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => navigate(`/admin/teacher-request/${req.id}`)}>
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
