import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, File, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubjectTest {
  id: string;
  name: string;
  description: string | null;
  year: number;
  created_at: string;
}

export const SubjectTests = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { user, userRole,session } = useAuth();
  const { t } = useLanguage();

  const [tests, setTests] = useState<SubjectTest[]>([]);
  const [newTestName, setNewTestName] = useState('');
  const [newTestYear, setNewTestYear] = useState(new Date().getFullYear());
  const [newTestDescription, setNewTestDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { questions?: File; answers?: File }>>({});

  useEffect(() => {
    fetchTests();
  }, [subjectId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('subject_tests')
        .select('*')
        .eq('subject_id', subjectId)
        .order('year', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error(t('Error fetching tests'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const role = userRole
    if (role !== 'admin') {
      toast.error(t('Only admins can send files for processing'));
      return;
    }
    setIsCreating(true);

    try {
      const { error } = await supabase.from('subject_tests').insert({
        subject_id: subjectId,
        name: newTestName,
        description: newTestDescription || null,
        year: newTestYear,
        user_id: user.id
      });
      if (error) throw error;

      toast.success(t('Test Created Successfully'));
      setNewTestName('');
      setNewTestDescription('');
      setNewTestYear(new Date().getFullYear());
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error(t('Error creating test'));
    } finally {
      setIsCreating(false);
    }
  };

  const sendFilesToRenderAPI = async (testId: string, questionFile: File, answerFile: File) => {
    if (!user) {
      toast.error(t('User not authenticated'));
      return;
    }

    const role = userRole
    if (role !== 'admin') {
      toast.error(t('Only admins can send files for processing'));
      return;
    }

    try {
      const test = tests.find(t => t.id === testId);
      if (!test) return;

      const formData = new FormData();
      formData.append('question_file', questionFile);
      formData.append('answer_file', answerFile);
      formData.append('subject', subjectId || '');
      formData.append('year', test.year.toString());
      formData.append('test_id', testId);

      const response = await fetch("https://toigsarjwwediuelpxvi.supabase.co/functions/v1/sendFilesToRender", {
  method: 'POST',
   headers: {
    Authorization: `Bearer ${session.access_token}`, 
  },
  body: formData,
});

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const data = await response.json();
      toast.success(t('Files sent successfully'));
    } catch (error) {
      console.error('Error sending files:', error);
      toast.error(t('Failed to send files'));
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('subject_tests').delete().eq('id', testId);
      if (error) throw error;

      toast.success(t('Deletion successful'));
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error(t('Error deleting test'));
    }
  };

  const handleFileUpload = async (testId: string, fileType: 'questions' | 'answers', file: File) => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${testId}_${fileType}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('subject-files').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('subject-files').getPublicUrl(filePath);

      const { error: fileError } = await supabase.from('test_files').insert({
        test_id: testId,
        file_type: fileType,
        file_name: file.name,
        file_url: publicUrl,
        user_id: user.id
      });

      if (fileError) throw fileError;

      toast.success(t('Upload Successful'));

      setUploadedFiles(prev => {
        const updated = {
          ...prev,
          [testId]: {
            ...prev[testId],
            [fileType]: file
          }
        };

        const files = updated[testId];
        if (files.questions && files.answers) {
          sendFilesToRenderAPI(testId, files.questions, files.answers);
        }

        return updated;
      });

      fetchTests();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('Upload Error'));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Create tests here')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testName">{t('Test Name')}</Label>
              <Input id="testName" value={newTestName} onChange={e => setNewTestName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testYear">{t('Test Year')}</Label>
              <Input id="testYear" type="number" value={newTestYear} onChange={e => setNewTestYear(Number(e.target.value))} required min="1900" max={new Date().getFullYear() + 1} />
            </div>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? t('Loading') : t('Create test')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {tests.map(test => (
          <Card key={test.id} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">{test.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {test.year} - {new Date(test.created_at).toLocaleDateString()}
                  </p>
                  {test.description && <p className="text-sm text-muted-foreground mt-1">{test.description}</p>}
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTest(test.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[200px]">
                  <input type="file" id={`questions-${test.id}`} className="hidden" onChange={e => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(test.id, 'questions', e.target.files[0]);
                    }
                  }} />
                  <label htmlFor={`questions-${test.id}`} className="flex items-center gap-2 justify-center w-full p-2 border rounded-md cursor-pointer hover:bg-secondary/50">
                    <FileText className="size-4" />
                {t('Upload Questions')}
              </label>
            </div>

            <div className="flex-1 min-w-[200px]">
              <input type="file" id={`answers-${test.id}`} className="hidden" onChange={e => {
                if (e.target.files?.[0]) {
                  handleFileUpload(test.id, 'answers', e.target.files[0]);
                }
              }} />
              <label htmlFor={`answers-${test.id}`} className="flex items-center gap-2 justify-center w-full p-2 border rounded-md cursor-pointer hover:bg-secondary/50">
                <File className="size-4" />
                {t('Upload Answers')}
              </label>
            </div>
          </div>
        </div>
      </Card>
    ))}

    {!loading && tests.length === 0 && (
      <Card className="p-8 text-center text-muted-foreground">
        <p>{t('No test available')}</p>
      </Card>
    )}
  </div>
</div>)}
