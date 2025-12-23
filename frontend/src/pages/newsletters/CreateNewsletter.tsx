import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { newsletterService, uploadService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const newsletterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().max(500, 'Summary must be less than 500 characters').optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal(''))
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export default function CreateNewsletter() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      content: ''
    }
  });

  const content = watch('content');
  const watchSummary = watch('summary');
  const watchTitle = watch('title');
  const watchCategory = watch('category');
  const watchTags = watch('tags');
  const watchImage = watch('image');

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      title: watchTitle || '',
      summary: watchSummary || '',
      content: content || '',
      category: watchCategory || '',
      tags: watchTags || '',
      image: watchImage || ''
    };
    if (draft.title || draft.content) {
      localStorage.setItem('newsletter-draft', JSON.stringify(draft));
    }
  }, [watchTitle, watchSummary, watchCategory, watchTags, watchImage, content]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('newsletter-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title || draft.content) {
          if (confirm('Found a saved newsletter draft. Would you like to restore it?')) {
            setValue('title', draft.title);
            setValue('summary', draft.summary);
            setValue('content', draft.content);
            setValue('category', draft.category);
            setValue('tags', draft.tags);
            setValue('image', draft.image);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [setValue]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadService.uploadFile(file);
      setValue('image', result.url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: NewsletterFormData) => {
    try {
      setLoading(true);
      localStorage.removeItem('newsletter-draft');
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];
      
      await newsletterService.createNewsletter({
        ...data,
        tags,
        image: data.image || undefined
      });
      
      toast.success('Newsletter created successfully');
      navigate('/admin/newsletters');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create newsletter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/newsletters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Newsletter</h1>
          <p className="text-gray-600 mt-1">Create a new newsletter</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Newsletter Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <textarea
                id="summary"
                {...register('summary')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <RichTextEditor
                value={content}
                onChange={(value) => setValue('content', value)}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" {...register('tags')} placeholder="tag1, tag2, tag3" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <div className="flex gap-2">
                <Input id="image" {...register('image')} placeholder="Image URL" />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/newsletters')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Newsletter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

