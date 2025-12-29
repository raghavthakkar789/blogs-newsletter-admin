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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Upload, Trash2, Sparkles, Loader2, RefreshCw } from 'lucide-react';
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

const VALID_CATEGORIES = ['Technology', 'Marketing', 'Business', 'Product Updates', 'Tutorials', 'Case Studies'];
const EMPTY_QUILL_CONTENT = '<p><br></p>';

export default function CreateBlog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
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

  // Watched values
  const content = watch('content');
  const watchSummary = watch('summary');
  const watchImage = watch('image');
  const watchTitle = watch('title');
  const watchCategory = watch('category');
  const watchAuthor = watch('author');

  // Component state
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Blog idea state
  const [blogIdea, setBlogIdea] = useState('');
  const [blogAbout, setBlogAbout] = useState('');
  const [audience, setAudience] = useState('');
  const [isCompanySpecific, setIsCompanySpecific] = useState(false);
  
  // AI dialog state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiIdea, setAiIdea] = useState('');
  const [aiDetails, setAiDetails] = useState('');
  
  // Regenerate dialog state
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Auto-save draft
  useEffect(() => {
    const draft = {
      title: watchTitle || '',
      summary: watchSummary || '',
      content: content || '',
      category: watchCategory || '',
      author: watchAuthor || '',
      tags,
      image: watchImage || ''
    };
    if (draft.title || draft.content) {
      localStorage.setItem('blog-draft', JSON.stringify(draft));
    }
  }, [watchTitle, watchSummary, content, watchCategory, watchAuthor, tags, watchImage]);

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
        // Ignore parse errors
      }
    }
  }, [setValue]);

  // Helper: Build webhook payload (only include non-empty fields)
  const buildWebhookPayload = () => {
    const payload: Record<string, any> = {
      blogIdea: blogIdea || '',
      blogAbout: blogAbout || '',
      audience: audience || '',
      isCompanySpecific: isCompanySpecific || false,
    };

    if (watchTitle?.trim()) payload.title = watchTitle;
    if (watchSummary?.trim()) payload.summary = watchSummary;
    if (content?.trim() && content !== EMPTY_QUILL_CONTENT) payload.content = content;
    if (watchCategory?.trim()) payload.category = watchCategory;
    if (tags.length > 0) payload.tags = tags.join(', ');
    if (watchImage?.trim()) payload.image = watchImage;
    if (watchAuthor?.trim()) payload.author = watchAuthor;

    return payload;
  };

  // Generate content from blog idea via n8n webhook
  const handleGenerateFromBlogIdea = async () => {
    if (!blogIdea.trim() && !blogAbout.trim()) {
      toast.error('Please enter a blog idea or what it\'s about');
      return;
    }

    const webhookUrl = (import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined) || 
      'http://54.88.119.163:5679/webhook/http://localhost:5000/api/blogs';

    try {
      setIsGenerating(true);
      const currentFormData = buildWebhookPayload();

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentFormData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get response as text first to handle potential JSON parsing issues
      const responseText = await response.text();
      console.log('Raw n8n Response (text):', responseText);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed n8n Response:', result);
        console.log('Response keys:', Object.keys(result));
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text:', responseText);
        throw new Error(`Invalid JSON response from webhook: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // IMPORTANT: NO STATUS CHECKS - n8n returns data directly
      // Expected format: { Title, Content, Summary, Tags } (no wrapper, no status field)
      
      // Handle n8n response format - direct response with capitalized fields
      // n8n returns: { Title, Content, Summary, Tags } directly
      // Support various response formats (direct, wrapped, or array)
      let data = result;
      
      // Handle array responses (n8n sometimes returns arrays)
      if (Array.isArray(result) && result.length > 0) {
        data = result[0].json || result[0];
      } 
      // Handle wrapped responses (if any)
      else if (result.data) {
        data = result.data;
      } else if (result.json) {
        data = result.json;
      }
      // Otherwise use result directly (most common case)
      
      console.log('Extracted data:', data);
      
      // Extract fields - handle both capitalized and lowercase field names
      const Title = data?.title || data?.Title;
      const Content = data?.contentHtml || data?.Content;
      const Summary = data?.summary || data?.Summary;
      const Tags = data?.tags || data?.Tags;
      const Category = data?.category || data?.Category;
      const Author = data?.author || data?.Author;
      const Image = data?.image || data?.Image;

      // Validate that we received at least title or content
      if (!Title && !Content) {
        console.error('Invalid response structure. Full result:', result);
        console.error('Extracted data:', data);
        throw new Error(`Response missing required fields (Title/Content). Received keys: ${Object.keys(data || {}).join(', ')}`);
      }

      if (Title) {
        setValue('title', Title.trim(), { shouldValidate: true, shouldDirty: true });
      }

      if (Content) {
        setValue('content', Content, { shouldValidate: true, shouldDirty: true });
      }

      if (Summary) {
        setValue('summary', Summary.trim(), { shouldValidate: true, shouldDirty: true });
      }

      if (Tags) {
        // Tags comes as a comma-separated string, convert to array
        const tagArray = typeof Tags === 'string' 
          ? Tags.split(',').map((t: string) => t.trim()).filter((t: string) => t)
          : Array.isArray(Tags) 
            ? Tags 
            : [];
        if (tagArray.length > 0) {
          setTags(tagArray);
        }
      }

      if (Category) {
        setValue('category', Category.trim(), { shouldValidate: true, shouldDirty: true });
      }

      if (Author) {
        setValue('author', Author.trim(), { shouldValidate: true, shouldDirty: true });
      }

      if (Image) {
        setValue('image', Image.trim(), { shouldValidate: true, shouldDirty: true });
        setImagePreview(Image.trim());
      }

      toast.success('Blog content generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate content. Please try again.');
      console.error('Error generating blog content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Tag handlers
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

  // Image handlers
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

  // AI generation
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
      if (generated.tags?.length) setTags(generated.tags);
      
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

  // Field regeneration
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
      
      const context = {
        title: watchTitle || '',
        summary: watchSummary || '',
        content: content || '',
        category: watchCategory || '',
        tags: tags,
        author: watchAuthor || ''
      };

      const fieldValueMap: Record<string, string> = {
        title: watchTitle || '',
        summary: watchSummary || '',
        content: content || '',
        category: watchCategory || '',
        tags: tags.join(', '),
        author: watchAuthor || '',
        image: watchImage || ''
      };

      const result = await aiService.regenerateField({
        field: regeneratingField as any,
        prompt: regeneratePrompt,
        currentValue: fieldValueMap[regeneratingField] || '',
        context
      });

      // Update the appropriate field
      if (regeneratingField === 'tags') {
        const tagArray = Array.isArray(result.value) 
          ? result.value 
          : typeof result.value === 'string' 
            ? result.value.split(',').map(t => t.trim()).filter(t => t)
            : [];
        setTags(tagArray);
      } else if (regeneratingField === 'image') {
        setValue('image', result.value);
        setImagePreview(result.value);
      } else {
        setValue(regeneratingField as keyof BlogFormData, result.value);
      }

      setShowRegenerateDialog(false);
      setRegeneratingField(null);
      setRegeneratePrompt('');
      toast.success(`${regeneratingField.charAt(0).toUpperCase() + regeneratingField.slice(1)} regenerated successfully!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate field');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      title: 'Title',
      summary: 'Summary',
      content: 'Content',
      category: 'Category',
      tags: 'Tags',
      author: 'Author',
      image: 'Image URL'
    };
    return labels[field] || field;
  };

  // Form submission
  const onSubmit = async (data: BlogFormData) => {
    try {
      setLoading(true);
      localStorage.removeItem('blog-draft');
      
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

  // Draft save
  const handleSaveDraft = () => {
    const draft = {
      title: watchTitle || '',
      summary: watchSummary || '',
      content: content || '',
      category: watchCategory || '',
      author: watchAuthor || '',
      tags,
      image: watchImage || ''
    };
    localStorage.setItem('blog-draft', JSON.stringify(draft));
    toast.success('Draft saved locally');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Blog</h1>
          <p className="text-muted-foreground mt-1">Write and publish a new blog post</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/blogs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blogs
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Blog Idea Section */}
          <Card>
            <CardHeader>
              <CardTitle>Blog Idea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="blogIdea">Enter your blog idea (optional)</Label>
                <Textarea
                  id="blogIdea"
                  rows={3}
                  placeholder="Describe your blog idea..."
                  value={blogIdea}
                  onChange={(e) => setBlogIdea(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="blogAbout">What it's about (optional)</Label>
                <Textarea
                  id="blogAbout"
                  rows={3}
                  placeholder="What is this blog about..."
                  value={blogAbout}
                  onChange={(e) => setBlogAbout(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="audience">Audience (optional)</Label>
                <Input
                  id="audience"
                  placeholder="Who is your target audience?"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isCompanySpecific" className="cursor-pointer">
                  Is it company specific?
                </Label>
                <Switch
                  id="isCompanySpecific"
                  checked={isCompanySpecific}
                  onCheckedChange={setIsCompanySpecific}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleGenerateFromBlogIdea}
                  disabled={isGenerating || (!blogIdea.trim() && !blogAbout.trim())}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
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
                <Input
                  id="title"
                  placeholder="Enter blog title..."
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
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
                <Textarea
                  id="summary"
                  rows={3}
                  placeholder="Brief summary of the blog..."
                  {...register('summary')}
                />
                <p className="text-xs text-muted-foreground mt-1">
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
                    value={watchCategory || ''} 
                    onValueChange={(value) => setValue('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
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
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="tags">Tags</Label>
                  {tags.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateField('tags')}
                      className="h-7 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerate
                    </Button>
                  )}
                </div>
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
                            className="ml-1 hover:text-destructive"
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
                <div className="flex gap-2">
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
              </div>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={content}
                onChange={(value) => setValue('content', value)}
              />
              {errors.content && (
                <p className="text-destructive text-sm mt-2">{errors.content.message}</p>
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
                      <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
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

      {/* Regenerate Field Dialog */}
      <Dialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate {regeneratingField && getFieldLabel(regeneratingField)}</DialogTitle>
            <DialogDescription>
              Enter a prompt to regenerate the {regeneratingField && getFieldLabel(regeneratingField).toLowerCase()} according to your requirements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="regeneratePrompt">Prompt</Label>
              <Textarea
                id="regeneratePrompt"
                rows={4}
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
              {isRegenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
