import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { newsletterService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, Search, CheckCircle, XCircle, Ban, Trash2, Edit, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function NewslettersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['newsletters', page, search, statusFilter, user?.id],
    queryFn: async () => {
      try {
        const result = await       newsletterService.getNewsletters({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
        console.log('Newsletters API Response:', result);
        return result;
      } catch (err) {
        console.error('Error fetching newsletters:', err);
        throw err;
      }
    },
    retry: 1
  });

  const newsletters = data?.newsletters || [];
  const totalPages = data?.totalPages || 0;
  const hasSelection = selectedIds.length > 0;
  
  console.log('NewslettersPage - newsletters:', newsletters, 'isLoading:', isLoading, 'error:', error);

  const approveMutation = useMutation({
    mutationFn: (id: string) => newsletterService.updateNewsletterStatus(id, 'APPROVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast.success('Newsletter approved successfully');
    },
    onError: () => toast.error('Failed to approve newsletter')
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => newsletterService.updateNewsletterStatus(id, 'REJECTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast.success('Newsletter rejected');
    },
    onError: () => toast.error('Failed to reject newsletter')
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => newsletterService.bulkUpdateNewsletterStatus(ids, 'APPROVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      setSelectedIds([]);
      toast.success('Selected newsletters approved successfully');
    },
    onError: () => toast.error('Failed to approve selected newsletters')
  });

  const bulkRejectMutation = useMutation({
    mutationFn: (ids: string[]) => newsletterService.bulkUpdateNewsletterStatus(ids, 'REJECTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      setSelectedIds([]);
      toast.success('Selected newsletters rejected');
    },
    onError: () => toast.error('Failed to reject selected newsletters')
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected = newsletters.length > 0 && selectedIds.length === newsletters.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(newsletters.map((n) => n.id));
    }
  };

  const handleBulkApprove = () => {
    if (!hasSelection) return;
    bulkApproveMutation.mutate(selectedIds);
  };

  const handleBulkReject = () => {
    if (!hasSelection) return;
    bulkRejectMutation.mutate(selectedIds);
  };

  const disableMutation = useMutation({
    mutationFn: (id: string) => newsletterService.updateNewsletterStatus(id, 'DISABLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast.success('Newsletter disabled successfully');
    },
    onError: () => toast.error('Failed to disable newsletter')
  });

  const enableMutation = useMutation({
    mutationFn: (id: string) => newsletterService.updateNewsletterStatus(id, 'APPROVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast.success('Newsletter enabled successfully');
    },
    onError: () => toast.error('Failed to enable newsletter')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsletterService.deleteNewsletter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
      toast.success('Newsletter deleted successfully');
    },
    onError: () => toast.error('Failed to delete newsletter')
  });

  const handleDisable = (id: string) => disableMutation.mutate(id);
  const handleEnable = (id: string) => enableMutation.mutate(id);
  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Newsletters</h1>
          <p className="text-muted-foreground mt-1">Manage your newsletters</p>
        </div>
        <Button onClick={() => navigate('/admin/newsletters/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Newsletter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search newsletters..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
             <select
               value={statusFilter}
               onChange={(e) => {
                 setStatusFilter(e.target.value);
                 setPage(1);
               }}
               className="px-5 py-2 bg-background border border-border text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
             >
               <option value="all">All Status</option>
               <option value="PENDING">Pending</option>
               <option value="APPROVED">Approved</option>
               <option value="REJECTED">Rejected</option>
               <option value="DISABLED">Disabled</option>
             </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">Error loading newsletters: {error instanceof Error ? error.message : 'Unknown error'}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No newsletters found</div>
          ) : (
            <div className="space-y-4">
            {user?.role === 'ADMIN' && (
              <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                <div>
                  {hasSelection
                    ? `${selectedIds.length} selected`
                    : 'Select newsletters to bulk approve or reject'}
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

            {user?.role === 'ADMIN' && newsletters.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>
            )}

              {newsletters.map((newsletter) => (
                <div
                  key={newsletter.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent ${
                    selectedIds.includes(newsletter.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => user?.role === 'ADMIN' && toggleSelect(newsletter.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/newsletters/${newsletter.id}/view`}
                        className="font-semibold text-lg hover:text-primary"
                      >
                        {newsletter.title}
                      </Link>
                      <StatusBadge status={newsletter.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {newsletter.summary || newsletter.content.substring(0, 100)}...
                    </p>
                     <div className="text-xs text-muted-foreground/70 mt-2 space-y-1">
                       <p>
                         Created by {newsletter.createdBy?.firstName} {newsletter.createdBy?.lastName} •{' '}
                         {format(new Date(newsletter.createdAt), 'MMM d, yyyy')}
                       </p>
                       {newsletter.lastEditedBy && (
                         <p className="text-orange-600">
                           Last edited by {newsletter.lastEditedBy} on{' '}
                           {format(new Date(newsletter.lastEditedAt || newsletter.updatedAt), 'MMM d, yyyy')}
                         </p>
                       )}
                     </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* View and Edit buttons - available for all authenticated users */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/admin/newsletters/${newsletter.id}/view`)}
                      title="View Newsletter"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/admin/newsletters/${newsletter.id}/edit`)}
                      title="Edit Newsletter"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    {/* Status management buttons - ADMIN only */}
                    {user?.role === 'ADMIN' && (
                      <>
                        {newsletter.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => approveMutation.mutate(newsletter.id)}
                              title="Approve Newsletter"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => rejectMutation.mutate(newsletter.id)}
                              title="Reject Newsletter"
                            >
                              <XCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {newsletter.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDisable(newsletter.id)}
                            title="Disable Newsletter"
                          >
                            <Ban className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        {newsletter.status === 'DISABLED' && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEnable(newsletter.id)}
                            title="Enable Newsletter"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(newsletter.id)}
                          title="Delete Newsletter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

