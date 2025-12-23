import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { blogService, uploadService, aiService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Upload, Trash2, Sparkles, Loader2 } from 'lucide-react';
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

export default function CreateBlog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiIdea, setAiIdea] = useState('');
  const [aiDetails, setAiDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      content: '',
      author: user ? `${user.firstName} ${user.lastName}` : ''
    }
  });

  const content = watch('content');
  const watchSummary = watch('summary');
  const watchImage = watch('image');

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      title: watch('title') || '',
      summary: watchSummary || '',
      content: content || '',
      category: watch('category') || '',
      author: watch('author') || '',
      tags,
      image: watchImage || ''
    };
    if (draft.title || draft.content) {
      localStorage.setItem('blog-draft', JSON.stringify(draft));
    }
  }, [watch, content, watchSummary, watchImage, tags]);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('blog-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title || draft.content) {
          if (confirm('Found a saved draft. Would you like to restore it?')) {
            setValue('title', draft.title);
            setValue('summary', draft.summary);
            setValue('content', draft.content);
            setValue('category', draft.category);
            setValue('author', draft.author);
            setValue('image', draft.image);
            setTags(draft.tags || []);
            if (draft.image) setImagePreview(draft.image);
          }
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [setValue]);

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

  const handleGenerateAI = async () => {
    if (!aiIdea.trim()) {
      toast.error('Please provide a blog idea');
      return;
    }

    try {
      setIsGenerating(true);
      const generated = await aiService.generateBlogContent({
        idea: aiIdea,
        details: aiDetails
      });
      
      if (generated.title) setValue('title', generated.title);
      if (generated.summary) setValue('summary', generated.summary);
      if (generated.content) setValue('content', generated.content);
      if (generated.tags && generated.tags.length > 0) {
        setTags(generated.tags);
      }
      
      setShowAIDialog(false);
      setAiIdea('');
      setAiDetails('');
      toast.success('Content generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      title: watch('title') || '',
      summary: watchSummary || '',
      content: content || '',
      category: watch('category') || '',
      author: watch('author') || '',
      tags,
      image: watchImage || ''
    };
    localStorage.setItem('blog-draft', JSON.stringify(draft));
    toast.success('Draft saved locally');
  };

  const onSubmit = async (data: BlogFormData) => {
    try {
      setLoading(true);
      localStorage.removeItem('blog-draft'); // Clear draft on successful submit
      
      await blogService.createBlog({
        ...data,
        tags,
        image: data.image || undefined
      });
      
      toast.success('Blog created successfully');
      navigate('/admin/blogs');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Blog</h1>
          <p className="text-gray-600 mt-1">Write and publish a new blog post</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/blogs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blogs
        </Button>
      </div>

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
                  <Select onValueChange={(value) => setValue('category', value)}>
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
              <div className="flex items-center justify-between">
                <CardTitle>Content *</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAIDialog(true)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    placeholder="https://example.com/your-image.jpg"
                    {...register('image')}
                  />
                  {errors.image && (
                    <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    You can paste a direct image URL or upload an image file below.
                  </p>
                </div>

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
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/blogs')}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleSaveDraft}>
                Save as Draft
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {user?.role === 'ADMIN' ? 'Publish' : 'Submit for Approval'}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Blog with AI</DialogTitle>
            <DialogDescription>
              Provide some details and let AI help you create content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Blog Idea</Label>
              <Input
                placeholder="What's your blog about?"
                value={aiIdea}
                onChange={(e) => setAiIdea(e.target.value)}
              />
            </div>
            <div>
              <Label>Additional Details</Label>
              <Textarea
                rows={3}
                placeholder="Any specific points to cover..."
                value={aiDetails}
                onChange={(e) => setAiDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateAI} disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

