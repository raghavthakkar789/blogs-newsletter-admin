import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { newsletterService, uploadService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Ban, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const newsletterSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().max(500, 'Summary must be less than 500 characters').optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal(''))
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export default function EditNewsletter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['newsletter', id],
    queryFn: () => newsletterService.getNewsletter(id!)
  });

  const newsletter = data?.newsletter;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema)
  });

  const content = watch('content');

  useEffect(() => {
    if (newsletter) {
      setValue('title', newsletter.title);
      setValue('content', newsletter.content);
      setValue('summary', newsletter.summary || '');
      setValue('category', newsletter.category || '');
      setValue('tags', newsletter.tags.join(', '));
      setValue('image', newsletter.image || '');
    }
  }, [newsletter, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: NewsletterFormData) => {
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];
      
      return newsletterService.updateNewsletter(id!, {
        ...data,
        tags,
        image: data.image || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] });
      toast.success('Newsletter updated successfully');
      navigate('/admin/newsletters');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update newsletter');
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED') =>
      newsletterService.updateNewsletterStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter', id] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

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

  const onSubmit = (data: NewsletterFormData) => {
    updateMutation.mutate(data);
  };

  const deleteMutation = useMutation({
    mutationFn: () => newsletterService.deleteNewsletter(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast.success('Newsletter deleted successfully');
      navigate('/admin/newsletters');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete newsletter');
    }
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!newsletter) {
    return <div>Newsletter not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/newsletters">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Edit Newsletter</h1>
            <StatusBadge status={newsletter.status} />
          </div>
          <p className="text-muted-foreground mt-1">Update newsletter details</p>
        </div>
        {user?.role === 'ADMIN' && (
          <div className="flex gap-2">
            {newsletter.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => statusMutation.mutate('APPROVED')}
                  disabled={statusMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => statusMutation.mutate('REJECTED')}
                  disabled={statusMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {newsletter.status === 'APPROVED' && (
              <Button
                variant="outline"
                onClick={() => statusMutation.mutate('DISABLED')}
                disabled={statusMutation.isPending}
              >
                <Ban className="w-4 h-4 mr-1" />
                Disable
              </Button>
            )}
            {newsletter.status === 'DISABLED' && (
              <Button
                variant="outline"
                onClick={() => statusMutation.mutate('APPROVED')}
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Re-enable
              </Button>
            )}
            <Button
              variant="outline"
              className="text-red-600"
              onClick={() => {
                if (confirm('Are you sure you want to delete this newsletter?')) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
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
                <p className="text-sm text-destructive">{errors.title.message}</p>
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
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Newsletter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

