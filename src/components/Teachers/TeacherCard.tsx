import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  grade?: string;
  educational_background?: string;   // added educational_background
  rating?: number;
  call_link?: string;
  created_at: string;
  is_live?: boolean;
  created_by: string;
}

interface TeacherCardProps {
  teacher: Teacher;
  onJoinCall: (callLink: string, teacher: Teacher) => void;
}

export const TeacherCard = ({ teacher, onJoinCall }: TeacherCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between">
          <span>{teacher.name}</span>
          <span className="text-sm font-normal text-muted-foreground mt-2 sm:mt-0">
            {teacher.subject}
          </span>
           {teacher.is_live && (
    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse">
      LIVE
    </span>
  )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Available since {formatDistanceToNow(new Date(teacher.created_at), { addSuffix: true })}
        </p>
        {teacher.grade && (
          <p className="text-sm mt-1">
            <strong>Grade:</strong> {teacher.grade}
          </p>
        )}
        {teacher.educational_background && (
          <p className="text-sm mt-1">
            <strong>Education:</strong> {teacher.educational_background}
          </p>
        )}
        {typeof teacher.rating === "number" && (
          <p className="text-sm mt-1 flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span>{teacher.rating.toFixed(1)}</span>
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        {teacher.call_link && (
         <Button
  onClick={() => onJoinCall(teacher.call_link!, teacher)}
  className="flex-1"
>
  <Video className="h-4 w-4 mr-2" />
  Join Video Call
</Button>
        )}
      </CardFooter>
    </Card>
  );
};
