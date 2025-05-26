import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Layout/Navbar";

const ApplyTeacher = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    address: "",
    phone: "",
    subject: "",
    grade: "",
    educational_background: "",
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<FileList | null>(null);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [teacherLicenseFile, setTeacherLicenseFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadFile = async (file: File) => {
  try {
    const fileName = `${Date.now()}-${file.name}`;
    // IMPORTANT: No "cv" or other folder, start path with user ID directly
    const filePath = `${user?.id}/${fileName}`;
    console.log("Uploading to path:", filePath);

    const { data, error } = await supabase.storage
      .from("teacher_resumes")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    const { data: urlData, error: urlError } = supabase.storage
      .from("teacher_resumes")
      .getPublicUrl(filePath);

    if (urlError) {
      console.error("Public URL error:", urlError);
      throw urlError;
    }

    return urlData.publicUrl;
  } catch (err) {
    console.error("UploadFile function error:", err);
    throw err;
  }
};


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phoneRegex.test(form.phone)) {
    toast.error("Enter a valid phone number.");
    return;
  }

  if (!cvFile || !certFiles || !nationalIdFile) {
    toast.error("Please upload all required documents.");
    return;
  }

  try {
    setLoading(true);

    const cvUrl = await uploadFile(cvFile);
    const certUrls: string[] = [];

    for (let i = 0; i < certFiles.length; i++) {
      const url = await uploadFile(certFiles[i]);
      certUrls.push(url);
    }

    const nationalIdUrl = await uploadFile(nationalIdFile);
    const teacherLicenseUrl = teacherLicenseFile ? await uploadFile(teacherLicenseFile) : null;

    const { error } = await supabase.from("pending_requests").insert({
      user_id: user?.id,
      ...form,
      cv_url: cvUrl,
      certificates_url: certUrls,
      national_id_url: nationalIdUrl,
      teacher_license_url: teacherLicenseUrl,
      status: "pending",
    });

    if (error) throw error;
    toast.success("Application submitted! Awaiting admin approval.");
  } catch (err: any) {
    console.error(err);
    toast.error("Submission failed.");
  } finally {
    setLoading(false);
  }
};


  return (
    <><Navbar/>
    <div style={{ paddingTop: '125px' }}>
    <div className="max-w-2xl mx-auto p-8 mt-12 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Apply to Become a Teacher</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="full_name"
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address"
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="text"
            name="phone"
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="e.g., 09123456789"
            required
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
  name="subject"
  onChange={handleInputChange}
  className="w-full border border-gray-300 rounded px-3 py-2"
  required
>
  <option value="">Select Subject</option>
  <option>Math</option>
  <option>Physics</option>
  <option>Chemistry</option>
  <option>Biology</option>
  <option>English</option>
  <option>History</option>
  <option>Civics</option>
  <option>Geography</option>
</select>

        </div>

        {/* Grade Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
          <div className="flex gap-6">
            {[9, 10, 11, 12].map((grade) => (
              <label key={grade} className="flex items-center space-x-2 text-gray-700">
                <input
                  type="radio"
                  name="grade"
                  value={grade}
                  onChange={handleInputChange}
                  required
                />
                <span>Grade {grade}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Educational Background */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Educational Background</label>
          <select
            name="educational_background"
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          >
            <option value="">Select Background</option>
            <option>B.Ed</option>
            <option>M.Ed</option>
            <option>Ph.D</option>
            <option>Other</option>
          </select>
        </div>

        {/* File Uploads */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload CV (PDF)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Certificates (PDF/JPG)</label>
          <input type="file" accept="application/pdf,image/*" multiple onChange={(e) => setCertFiles(e.target.files)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload National ID (PDF/Image)</label>
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Teacher License (Optional)</label>
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setTeacherLicenseFile(e.target.files?.[0] || null)} />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
    </div>
    </>
  );
};

export default ApplyTeacher;
