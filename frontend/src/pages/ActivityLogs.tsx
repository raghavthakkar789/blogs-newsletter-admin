import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService, userService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Activity,
  FileText,
  Edit,
  CheckCircle,
  Trash2,
  Mail,
  Users,
  LogIn,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => userService.getUsers({ page: 1, limit: 100 })
  });

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, actionFilter, userFilter, dateFrom, dateTo],
    queryFn: () =>
      analyticsService.getActivityLogs({
        page,
        limit: 50,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        userId: userFilter !== 'all' ? userFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      })
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;
  const users = usersData?.users || [];

  const getActivityIcon = (action: string) => {
    if (action.includes('BLOG')) return <FileText className="h-4 w-4" />;
    if (action.includes('NEWSLETTER')) return <Mail className="h-4 w-4" />;
    if (action.includes('USER')) return <Users className="h-4 w-4" />;
    if (action === 'LOGIN') return <LogIn className="h-4 w-4" />;
    if (action.includes('APPROVE')) return <CheckCircle className="h-4 w-4" />;
    if (action.includes('REJECT') || action.includes('DELETE')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('EDIT')) return <Edit className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActivityBgColor = (action: string) => {
    if (action.includes('APPROVE')) return 'bg-green-100 text-green-600';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'bg-red-100 text-red-600';
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-600';
    if (action === 'LOGIN') return 'bg-purple-100 text-purple-600';
    return 'bg-gray-100 text-gray-600';
  };

  const getActivityDescription = (log: any) => {
    const descriptions: Record<string, string> = {
      CREATE_BLOG: `created a blog "${log.details?.title || 'Untitled'}"`,
      EDIT_BLOG: `edited blog "${log.details?.title || 'Untitled'}"`,
      APPROVE_BLOG: `approved blog "${log.details?.title || 'Untitled'}"`,
      REJECT_BLOG: `rejected blog "${log.details?.title || 'Untitled'}"`,
      DELETE_BLOG: `deleted a blog`,
      CREATE_NEWSLETTER: `created newsletter "${log.details?.title || 'Untitled'}"`,
      EDIT_NEWSLETTER: `edited newsletter "${log.details?.title || 'Untitled'}"`,
      APPROVE_NEWSLETTER: `approved newsletter "${log.details?.title || 'Untitled'}"`,
      REJECT_NEWSLETTER: `rejected newsletter "${log.details?.title || 'Untitled'}"`,
      DELETE_NEWSLETTER: `deleted a newsletter`,
      CREATE_USER: `created user account`,
      EDIT_USER: `edited user account`,
      DELETE_USER: `deleted user account`,
      LOGIN: `logged in to the system`,
      LOGOUT: `logged out of the system`
    };
    return descriptions[log.action] || log.action;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-gray-600 mt-1">Monitor all system activities and user actions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={actionFilter} onValueChange={(value) => {
              setActionFilter(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE_BLOG">Create Blog</SelectItem>
                <SelectItem value="EDIT_BLOG">Edit Blog</SelectItem>
                <SelectItem value="APPROVE_BLOG">Approve Blog</SelectItem>
                <SelectItem value="REJECT_BLOG">Reject Blog</SelectItem>
                <SelectItem value="DELETE_BLOG">Delete Blog</SelectItem>
                <SelectItem value="CREATE_NEWSLETTER">Create Newsletter</SelectItem>
                <SelectItem value="EDIT_NEWSLETTER">Edit Newsletter</SelectItem>
                <SelectItem value="APPROVE_NEWSLETTER">Approve Newsletter</SelectItem>
                <SelectItem value="REJECT_NEWSLETTER">Reject Newsletter</SelectItem>
                <SelectItem value="DELETE_NEWSLETTER">Delete Newsletter</SelectItem>
                <SelectItem value="CREATE_USER">Create User</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={(value) => {
              setUserFilter(value);
              setPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              placeholder="From date"
            />

            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              placeholder="To date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No activity found"
              description="There are no activity logs matching your filters"
            />
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${getActivityBgColor(log.action)}`}>
                      {getActivityIcon(log.action)}
                    </div>
                    {index < logs.length - 1 && (
                      <div className="w-px h-full bg-gray-200 mt-2" />
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {log.user?.firstName?.[0]}{log.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {log.user?.firstName} {log.user?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{getActivityDescription(log)}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(log.createdAt))} ago
                        </span>
                      </div>

                      {/* Additional Details */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-3 text-xs bg-white rounded p-3 font-mono max-h-32 overflow-auto">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}

                      {/* IP and User Agent */}
                      <div className="mt-2 flex gap-4 text-xs text-gray-500">
                        {log.ipAddress && (
                          <span>IP: {log.ipAddress}</span>
                        )}
                        {log.userAgent && (
                          <span className="truncate max-w-xs">UA: {log.userAgent}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          total={total}
          limit={50}
        />
      )}
    </div>
  );
}
