import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { blogService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Grid,
  List,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Ban,
  Eye
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'grid' | 'table';

export default function BlogsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data, isLoading, error } = useQuery({
    queryKey: ['blogs', page, search, statusFilter, user?.id],
    queryFn: async () => {
      try {
        const result = await         blogService.getBlogs({
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        });
        console.log('Blogs API Response:', result);
        return result;
      } catch (err) {
        console.error('Error fetching blogs:', err);
        throw err;
      }
    },
    retry: 1
  });

  const blogs = data?.blogs || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;
  
  console.log('BlogsPage - blogs:', blogs, 'isLoading:', isLoading, 'error:', error);

  const approveMutation = useMutation({
    mutationFn: (id: string) => blogService.updateBlogStatus(id, 'APPROVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog approved successfully');
    },
    onError: () => toast.error('Failed to approve blog')
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => blogService.updateBlogStatus(id, 'REJECTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog rejected');
    },
    onError: () => toast.error('Failed to reject blog')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => blogService.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog deleted successfully');
    },
    onError: () => toast.error('Failed to delete blog')
  });

  const handleApprove = (id: string) => approveMutation.mutate(id);
  const handleReject = (id: string) => rejectMutation.mutate(id);
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this blog?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected = blogs.length > 0 && selectedIds.length === blogs.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(blogs.map((b) => b.id));
    }
  };

  const hasSelection = selectedIds.length > 0;

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => blogService.bulkUpdateBlogStatus(ids, 'APPROVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setSelectedIds([]);
      toast.success('Selected blogs approved successfully');
    },
    onError: () => toast.error('Failed to approve selected blogs')
  });

  const bulkRejectMutation = useMutation({
    mutationFn: (ids: string[]) => blogService.bulkUpdateBlogStatus(ids, 'REJECTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      setSelectedIds([]);
      toast.success('Selected blogs rejected');
    },
    onError: () => toast.error('Failed to reject selected blogs')
  });

  const handleBulkApprove = () => {
    if (!hasSelection) return;
    bulkApproveMutation.mutate(selectedIds);
  };

  const handleBulkReject = () => {
    if (!hasSelection) return;
    bulkRejectMutation.mutate(selectedIds);
  };

  const disableMutation = useMutation({
    mutationFn: (id: string) => blogService.updateBlogStatus(id, 'DISABLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog disabled successfully');
    },
    onError: () => toast.error('Failed to disable blog')
  });

  const enableMutation = useMutation({
    mutationFn: (id: string) => blogService.updateBlogStatus(id, 'APPROVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      toast.success('Blog enabled successfully');
    },
    onError: () => toast.error('Failed to enable blog')
  });

  const handleDisable = (id: string) => disableMutation.mutate(id);
  const handleEnable = (id: string) => enableMutation.mutate(id);

  // Search is debounced by React Query's queryKey dependency

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blogs</h1>
          <p className="text-muted-foreground mt-1">
            Manage all blog posts
          </p>
        </div>
        <Button onClick={() => navigate('/admin/blogs/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Blog
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blogs by title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="APPROVED">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Approved
                  </div>
                </SelectItem>
                <SelectItem value="REJECTED">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    Rejected
                  </div>
                </SelectItem>
                <SelectItem value="DISABLED">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-muted-foreground" />
                    Disabled
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Error loading blogs: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : blogs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No blogs found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first blog'}
          actionLabel="Create Blog"
          onAction={() => navigate('/admin/blogs/create')}
        />
      ) : viewMode === 'grid' ? (
        <>
          {(
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {hasSelection
                  ? `${selectedIds.length} selected`
                  : 'Select blogs to bulk approve or reject'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={!hasSelection || bulkApproveMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkReject}
                  disabled={!hasSelection || bulkRejectMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject Selected
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Card
                key={blog.id}
                className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  selectedIds.includes(blog.id) ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => toggleSelect(blog.id)}
              >
                {blog.image && (
                  <div className="aspect-video overflow-hidden">
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={blog.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/blogs/${blog.id}/view`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/admin/blogs/${blog.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {blog.status === 'PENDING' && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(blog.id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(blog.id)}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {blog.status === 'APPROVED' && (
                          <DropdownMenuItem onClick={() => handleDisable(blog.id)}>
                            <Ban className="mr-2 h-4 w-4 text-muted-foreground" />
                            Disable
                          </DropdownMenuItem>
                        )}
                        {blog.status === 'DISABLED' && (
                          <DropdownMenuItem onClick={() => handleEnable(blog.id)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                            Re-enable
                          </DropdownMenuItem>
                        )}
                        {(
                          <DropdownMenuItem onClick={() => handleDelete(blog.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">{blog.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {blog.summary || blog.content.substring(0, 150)}...
                  </p>
                   <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                     <div className="flex items-center justify-between">
                       <span>{blog.category || 'Uncategorized'}</span>
                       <span>{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</span>
                     </div>
                     {blog.lastEditedBy && (
                       <div className="text-xs text-orange-600">
                         Last edited by {blog.lastEditedBy} on{' '}
                         {format(new Date(blog.lastEditedAt || blog.updatedAt), 'MMM dd, yyyy')}
                       </div>
                     )}
                   </div>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-6 pt-0 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/admin/blogs/${blog.id}/view`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/admin/blogs/${blog.id}/edit`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {user?.role === 'ADMIN' && blog.status === 'PENDING' && (
                    <Button
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      onClick={() => handleApprove(blog.id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={total}
              limit={20}
            />
          )}
        </>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                {(
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    {(
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(blog.id)}
                          onChange={() => toggleSelect(blog.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {blog.image && (
                          <img src={blog.image} alt="" className="h-10 w-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium">{blog.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {blog.summary || blog.content.substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={blog.status} />
                    </TableCell>
                    <TableCell>{blog.category || '-'}</TableCell>
                    <TableCell>{blog.author || blog.createdBy?.firstName || '-'}</TableCell>
                    <TableCell>{format(new Date(blog.createdAt), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/blogs/${blog.id}/view`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/blogs/${blog.id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {blog.status === 'PENDING' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(blog.id)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReject(blog.id)}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {blog.status === 'APPROVED' && (
                            <DropdownMenuItem onClick={() => handleDisable(blog.id)}>
                              <Ban className="mr-2 h-4 w-4 text-muted-foreground" />
                              Disable
                            </DropdownMenuItem>
                          )}
                          {blog.status === 'DISABLED' && (
                            <DropdownMenuItem onClick={() => handleEnable(blog.id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Re-enable
                            </DropdownMenuItem>
                          )}
                          {(
                            <DropdownMenuItem onClick={() => handleDelete(blog.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={total}
              limit={20}
            />
          )}
        </>
      )}
    </div>
  );
}

