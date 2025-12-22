import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { newsletterService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function NewslettersPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['newsletters', page, search, statusFilter, user?.id],
    queryFn: () =>
      newsletterService.getNewsletters({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        createdById: user?.role === 'MARKETING_MANAGER' ? user.id : undefined
      })
  });

  const newsletters = data?.newsletters || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletters</h1>
          <p className="text-gray-600 mt-1">Manage your newsletters</p>
        </div>
        <Link to="/admin/newsletters/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Newsletter
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
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
          ) : newsletters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No newsletters found</div>
          ) : (
            <div className="space-y-4">
              {newsletters.map((newsletter) => (
                <div
                  key={newsletter.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/newsletters/${newsletter.id}/edit`}
                        className="font-semibold text-lg hover:text-primary"
                      >
                        {newsletter.title}
                      </Link>
                      <StatusBadge status={newsletter.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {newsletter.summary || newsletter.content.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created by {newsletter.createdBy?.firstName} {newsletter.createdBy?.lastName} •{' '}
                      {format(new Date(newsletter.createdAt), 'MMM d, yyyy')}
                    </p>
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

