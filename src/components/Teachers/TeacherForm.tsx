import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const studySessionSchema = z
  .object({
    subject_id: z.string().min(1, "Subject is required"),
    start_time: z.coerce.date({ required_error: "Start time is required" }),
    end_time: z.coerce.date({ required_error: "End time is required" }),
    notes: z.string().optional(),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

type StudySessionFormValues = z.infer<typeof studySessionSchema>;

export interface StudySessionFormProps {
  onSuccess?: () => void;
}

export const TeacherForm = ({ onSuccess }: StudySessionFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StudySessionFormValues>({
    resolver: zodResolver(studySessionSchema),
    defaultValues: {
      subject_id: "",
      start_time: undefined,
      end_time: undefined,
      notes: "",
    },
  });

  const onSubmit = async (data: StudySessionFormValues) => {
    if (!user) {
      toast.error("You must be logged in to add a study session");
      return;
    }

    setIsSubmitting(true);

    try {
      const duration = Math.round(
        (data.end_time.getTime() - data.start_time.getTime()) / (1000 * 60)
      );

      const { error } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        subject_id: data.subject_id,
        start_time: data.start_time.toISOString(),
        end_time: data.end_time.toISOString(),
        duration,
        notes: data.notes || null,
      });

      if (error) throw error;

      toast.success("Study session added successfully!");
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adding study session:", error);
      toast.error(error.message || "Failed to add study session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        {/* Subject ID input - assuming string */}
        <FormField
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject ID</FormLabel>
              <FormControl>
                <input
                  type="text"
                  placeholder="Enter subject ID"
                  className="input input-bordered w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Time picker */}
        <FormField
          control={form.control}
          name="start_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time</FormLabel>
              <FormControl>
                <DatePicker
                  selected={field.value}
                  onChange={(date) => field.onChange(date)}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="Pp"
                  placeholderText="Select start date and time"
                  className="input input-bordered w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Time picker */}
        <FormField
          control={form.control}
          name="end_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time</FormLabel>
              <FormControl>
                <DatePicker
                  selected={field.value}
                  onChange={(date) => field.onChange(date)}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="Pp"
                  placeholderText="Select end date and time"
                  className="input input-bordered w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <textarea
                  placeholder="Add any notes here"
                  className="textarea textarea-bordered w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Study Session
        </Button>
      </form>
    </Form>
  );
};
