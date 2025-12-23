import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { blogService, uploadService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Upload, Trash2, Loader2, Clock, CheckCircle, XCircle, Ban, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().max(500, 'Summary must be less than 500 characters').optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  author: z.string().optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal(''))
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function EditBlog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['blog', id],
    queryFn: () => blogService.getBlog(id!)
  });

  const blog = data?.blog;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema)
  });

  const content = watch('content');
  const watchSummary = watch('summary');
  const watchImage = watch('image');

  useEffect(() => {
    if (blog) {
      setValue('title', blog.title);
      setValue('content', blog.content);
      setValue('summary', blog.summary || '');
      setValue('category', blog.category || '');
      setValue('author', blog.author || '');
      setValue('image', blog.image || '');
      setTags(blog.tags || []);
      if (blog.image) setImagePreview(blog.image);
    }
  }, [blog, setValue]);

  const updateMutation = useMutation({
    mutationFn: (data: BlogFormData) => {
      return blogService.updateBlog(id!, {
        ...data,
        tags,
        image: data.image || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', id] });
      toast.success('Blog updated successfully');
      navigate('/admin/blogs');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update blog');
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED') => 
      blogService.updateBlogStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', id] });
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

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
      const result = await uploadService.uploadFile(file);
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

  const onSubmit = (data: BlogFormData) => {
    updateMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      case 'DISABLED': return <Ban className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusAlertVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'default';
      case 'APPROVED': return 'default';
      case 'REJECTED': return 'destructive';
      case 'DISABLED': return 'default';
      default: return 'default';
    }
  };

  // Permission check
  const canEdit = user?.role === 'ADMIN' || 
    (user?.role === 'MARKETING_MANAGER' && blog && 
     (blog.status === 'PENDING' || blog.status === 'REJECTED') && 
     blog.createdById === user.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Blog not found</p>
        <Button onClick={() => navigate('/admin/blogs')} className="mt-4">
          Back to Blogs
        </Button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to edit this blog.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/admin/blogs')} className="mt-4">
          Back to Blogs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Blog</h1>
          <p className="text-gray-600 mt-1">Update blog post details</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/blogs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blogs
        </Button>
      </div>

      {/* Status Alert */}
      <Alert className={getStatusAlertVariant(blog.status)}>
        <AlertTitle className="flex items-center gap-2">
          {getStatusIcon(blog.status)}
          Blog Status: {blog.status}
        </AlertTitle>
        {blog.status === 'REJECTED' && (blog as any).rejectionReason && (
          <AlertDescription>
            Rejection Reason: {(blog as any).rejectionReason}
          </AlertDescription>
        )}
        {blog.status === 'PENDING' && user?.role === 'MARKETING_MANAGER' && (
          <AlertDescription>
            Your blog is awaiting admin approval
          </AlertDescription>
        )}
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter blog title..."
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  rows={3}
                  placeholder="Brief summary of the blog..."
                  {...register('summary')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(watchSummary?.length || 0)}/500 characters
                </p>
                {errors.summary && (
                  <p className="text-red-500 text-sm mt-1">{errors.summary.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={watch('category') || ''} 
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Product Updates">Product Updates</SelectItem>
                      <SelectItem value="Tutorials">Tutorials</SelectItem>
                      <SelectItem value="Case Studies">Case Studies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Author name..."
                    {...register('author')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(index)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Content *</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={content}
                onChange={(value) => setValue('content', value)}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-2">{errors.content.message}</p>
              )}
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              {!imagePreview && !watchImage ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-1">Upload an image</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/blogs')}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {blog.status === 'PENDING' && user?.role === 'MARKETING_MANAGER' 
                  ? 'Resubmit for Approval' 
                  : 'Update Blog'}
              </Button>
              {user?.role === 'ADMIN' && (
                <>
                  {blog.status === 'PENDING' && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => statusMutation.mutate('APPROVED')}
                        disabled={statusMutation.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => statusMutation.mutate('REJECTED')}
                        disabled={statusMutation.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  {blog.status === 'APPROVED' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => statusMutation.mutate('DISABLED')}
                      disabled={statusMutation.isPending}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Disable
                    </Button>
                  )}
                  {blog.status === 'DISABLED' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => statusMutation.mutate('APPROVED')}
                      disabled={statusMutation.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Re-enable
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
