import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { newsletterService, uploadService, newsletterContentService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, Ban, Trash2, RefreshCw, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { getFieldLabel } from '@/utils/regeneration';

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
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
  const watchTitle = watch('title');
  const watchSummary = watch('summary');
  const watchCategory = watch('category');
  const watchTags = watch('tags');
  const watchImage = watch('image');

  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (newsletter) {
      setValue('title', newsletter.title);
      setValue('content', newsletter.content);
      setValue('summary', newsletter.summary || '');
      setValue('category', newsletter.category || '');
      setValue('tags', newsletter.tags.join(', '));
      setValue('image', newsletter.image || '');
      if (newsletter.image) setImagePreview(newsletter.image);
    }
  }, [newsletter, setValue]);

  // Update image preview when image URL changes
  useEffect(() => {
    if (watchImage && watchImage.trim()) {
      setImagePreview(watchImage);
    } else if (!watchImage) {
      setImagePreview(null);
    }
  }, [watchImage]);

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
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : undefined;
      toast.error(errorMessage || 'Failed to update newsletter');
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
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : undefined;
      toast.error(errorMessage || 'Failed to update status');
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const result = await uploadService.uploadFile(file, 'newsletters');
      setValue('image', result.url);
      setImagePreview(result.url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setValue('image', '');
    setImagePreview(null);
  };

  const onSubmit = (data: NewsletterFormData) => {
    updateMutation.mutate(data);
  };

  const handleRegenerateField = (field: string) => {
    setRegeneratingField(field);
    setRegeneratePrompt('');
    setShowRegenerateDialog(true);
  };

  const handleConfirmRegenerate = async () => {
    if (!regeneratingField || !regeneratePrompt.trim()) {
      toast.error('Please enter a prompt for regeneration');
      return;
    }

    try {
      setIsRegenerating(true);

      const tagsArray = watchTags
        ? watchTags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const context = {
        title: watchTitle || '',
        summary: watchSummary || '',
        content: content || '',
        category: watchCategory || '',
        tags: tagsArray,
      };

      const currentValue =
        regeneratingField === 'title'
          ? watchTitle || ''
          : regeneratingField === 'summary'
          ? watchSummary || ''
          : regeneratingField === 'content'
          ? content || ''
          : regeneratingField === 'tags'
          ? watchTags || ''
          : regeneratingField === 'image'
          ? watchImage || ''
          : '';

      const result = await newsletterContentService.regenerateNewsletterField({
        field: regeneratingField as 'title' | 'summary' | 'content' | 'category' | 'tags' | 'image',
        prompt: regeneratePrompt,
        currentValue,
        context,
      });

      if (regeneratingField === 'title') {
        setValue('title', result.value);
      } else if (regeneratingField === 'summary') {
        setValue('summary', result.value);
      } else if (regeneratingField === 'content') {
        setValue('content', result.value);
      } else if (regeneratingField === 'tags') {
        const tagString = Array.isArray(result.value)
          ? result.value.join(', ')
          : String(result.value || '');
        setValue('tags', tagString);
      } else if (regeneratingField === 'image') {
        setValue('image', result.value);
      }

      setShowRegenerateDialog(false);
      setRegeneratingField(null);
      setRegeneratePrompt('');
      toast.success(`${getFieldLabel(regeneratingField)} regenerated successfully!`);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : undefined;
      toast.error(errorMessage || 'Failed to regenerate field');
    } finally {
      setIsRegenerating(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => newsletterService.deleteNewsletter(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast.success('Newsletter deleted successfully');
      navigate('/admin/newsletters');
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error.response as { data?: { message?: string } })?.data?.message
        : undefined;
      toast.error(errorMessage || 'Failed to delete newsletter');
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
           <p className="text-muted-foreground mt-1">
             {newsletter.lastEditedBy 
               ? `Last edited by ${newsletter.lastEditedBy} on ${new Date(newsletter.lastEditedAt || newsletter.updatedAt).toLocaleDateString()}`
               : `Created by ${newsletter.createdBy?.firstName} ${newsletter.createdBy?.lastName} on ${new Date(newsletter.createdAt).toLocaleDateString()}`
             }
           </p>
         </div>
        {(
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="title">Title *</Label>
                {watchTitle?.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRegenerateField('title')}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                )}
              </div>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="summary">Summary</Label>
                {watchSummary?.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRegenerateField('summary')}
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                )}
              </div>
              <textarea
                id="summary"
                {...register('summary')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="content">Content *</Label>
                {content?.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRegenerateField('content')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                )}
              </div>
              <RichTextEditor value={content} onChange={(value) => setValue('content', value)} />
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

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="image">Image URL</Label>
                      {watchImage?.trim() && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerateField('image')}
                          className="h-7 text-xs"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                      )}
                    </div>
                    <Input
                      id="image"
                      placeholder="https://example.com/your-image.jpg"
                      {...register('image')}
                    />
                    {errors.image && (
                      <p className="text-destructive text-sm mt-1">{errors.image.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You can paste a direct image URL or upload an image file below.
                    </p>
                  </div>

                  {!imagePreview && !watchImage ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="image-upload"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-1">
                          {uploading ? 'Uploading image...' : 'Upload an image'}
                        </p>
                        <p className="text-sm text-muted-foreground">All image types supported (up to 10MB)</p>
                      </label>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview || watchImage || ''}
                        alt="Preview"
                        className="w-full rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Edit History */}
            {newsletter.editHistory && newsletter.editHistory.length > 0 && (
              <div className="space-y-2">
                <Label>Edit History</Label>
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {newsletter.editHistory?.slice().reverse().map((edit, index: number) => (
                        <div key={index} className="border-l-2 border-l-primary pl-4 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{edit.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(edit.editedAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {edit.changes && edit.changes.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-muted-foreground">Changed: </span>
                              <span className="text-xs">
                                {edit.changes.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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

      {/* Regenerate Field Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Regenerate {regeneratingField && getFieldLabel(regeneratingField)}
            </DialogTitle>
            <DialogDescription>
              Enter a prompt to regenerate the{' '}
              {regeneratingField && getFieldLabel(regeneratingField).toLowerCase()} according to your requirements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="regeneratePrompt">Prompt</Label>
              <textarea
                id="regeneratePrompt"
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe how you want to regenerate this field..."
                value={regeneratePrompt}
                onChange={(e) => setRegeneratePrompt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRegenerateDialog(false);
                setRegeneratingField(null);
                setRegeneratePrompt('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmRegenerate} disabled={isRegenerating || !regeneratePrompt.trim()}>
              {isRegenerating && <span className="mr-2">...</span>}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

