import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Calendar, 
  Tag, 
  Loader2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function ViewBlog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', id],
    queryFn: async () => {
      // Use endpoint to get blog with any status
      const response = await api.get(`/blogs/${id}`);
      return response.data;
    },
    enabled: !!id
  });

  const blog = data?.blog;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !blog) {
    toast.error('Blog not found');
    navigate('/admin/blogs');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/blogs')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blogs
        </Button>
        <div className="flex items-center gap-3">
          <StatusBadge status={blog.status} />
          <Button 
            variant="outline"
            onClick={() => navigate(`/admin/blogs/${id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Blog
          </Button>
        </div>
      </div>

      {/* Featured Image */}
      {blog.image && (
        <div className="w-full h-[400px] overflow-hidden rounded-lg">
          <img 
            src={blog.image} 
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Category Badge */}
      {blog.category && (
        <div>
          <Badge variant="secondary">{blog.category}</Badge>
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl font-bold text-foreground leading-tight">
        {blog.title}
      </h1>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {blog.author && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{blog.author}</span>
          </div>
        )}
        {blog.publishedAt && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Published {format(new Date(blog.publishedAt), 'MMM dd, yyyy')}</span>
          </div>
        )}
        {!blog.publishedAt && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Created {format(new Date(blog.createdAt), 'MMM dd, yyyy')}</span>
          </div>
        )}
        {(blog as any).lastEditedBy && (
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-4 w-4" />
            <span>
              Last edited by {(blog as any).lastEditedBy} on{' '}
              {format(new Date((blog as any).lastEditedAt || blog.updatedAt), 'MMM dd, yyyy')}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Summary */}
      {blog.summary && (
        <Card className="bg-muted/50 border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <p className="text-lg italic text-foreground leading-relaxed">
              {blog.summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          <div 
            className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-foreground prose-p:leading-7 prose-p:mb-4
              prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4
              prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4
              prose-li:text-foreground prose-li:mb-2
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-4
              prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-foreground
              prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
              prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
              prose-strong:text-foreground prose-strong:font-semibold
              prose-em:text-foreground"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {blog.tags.map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/blogs')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blogs
        </Button>
        <Button 
          onClick={() => navigate(`/admin/blogs/${id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Blog
        </Button>
      </div>
    </div>
  );
}

