import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  FileText,
  Mail,
  Clock,
  CheckCircle,
  PlusCircle,
  UserPlus,
  Activity,
  Users
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        return await analyticsService.getDashboard();
      } catch (err: any) {
        console.error('Dashboard API Error:', err);
        toast.error('Failed to load dashboard data. Using default values.');
        // Return default stats on error
        return {
          blogs: { total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 },
          newsletters: { total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 },
          users: null,
          recentActivity: []
        };
      }
    },
    enabled: !!user, // Only fetch when user is loaded
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Default stats to show even if API fails
  const defaultStats = {
    blogs: { total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 },
    newsletters: { total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 },
    users: null,
    recentActivity: []
  };

  const stats = data || defaultStats;

  // Show loading state only while auth is loading (don't block on data loading)
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 animate-pulse">
          <div className="h-8 bg-blue-500/50 rounded w-64 mb-2"></div>
          <div className="h-4 bg-blue-500/50 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Log errors for debugging
  if (isError) {
    console.error('Dashboard query error:', error);
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('BLOG')) return <FileText className="h-4 w-4" />;
    if (action.includes('NEWSLETTER')) return <Mail className="h-4 w-4" />;
    if (action.includes('USER')) return <Users className="h-4 w-4" />;
    if (action === 'LOGIN') return <Activity className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActivityColor = (action: string) => {
    if (action.includes('APPROVE')) return 'bg-green-100 text-green-600';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'bg-red-100 text-red-600';
    if (action.includes('CREATE')) return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  // Ensure we always have a user object (even if null)
  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">
              Loading user information...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-800">
              ⚠️ Unable to load dashboard data. Showing default values. Please check your connection.
            </p>
            {error instanceof Error && (
              <p className="text-xs text-red-600 mt-1">
                Error: {error.message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading indicator for data */}
      {isLoading && !isError && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              📊 Loading dashboard statistics...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold">
          Welcome back, {user.firstName || 'User'}! 👋
        </h1>
        <p className="mt-2 text-blue-100">
          {user.role === 'ADMIN' ? 'Manage your content and users' : 'Create and manage your content'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Blogs</p>
                <p className="text-3xl font-bold mt-2">{stats.blogs.total}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.blogs.pending} pending, {stats.blogs.approved} approved
                </p>
              </div>
              <div className="p-4 rounded-full bg-blue-100">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.blogs.pending + stats.newsletters.pending}
                </p>
                <p className="text-sm text-gray-500 mt-2">Needs review</p>
              </div>
              <div className="p-4 rounded-full bg-amber-100">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved Content</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.blogs.approved + stats.newsletters.approved}
                </p>
                <p className="text-sm text-gray-500 mt-2">Published</p>
              </div>
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Newsletters</p>
                <p className="text-3xl font-bold mt-2">{stats.newsletters.total}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {stats.newsletters.pending} pending
                </p>
              </div>
              <div className="p-4 rounded-full bg-purple-100">
                <Mail className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {user?.role === 'ADMIN' && stats.users && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold mt-2">{stats.users.total}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {stats.users.active} active
                  </p>
                </div>
                <div className="p-4 rounded-full bg-indigo-100">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/admin/blogs/create')}
              className="h-24 flex-col"
            >
              <PlusCircle className="h-8 w-8 mb-2" />
              Create Blog
            </Button>
            <Button
              onClick={() => navigate('/admin/newsletters/create')}
              className="h-24 flex-col"
            >
              <Mail className="h-8 w-8 mb-2" />
              Create Newsletter
            </Button>
            {user?.role === 'ADMIN' && (
              <>
                <Button
                  onClick={() => navigate('/admin/users/create')}
                  variant="outline"
                  className="h-24 flex-col"
                >
                  <UserPlus className="h-8 w-8 mb-2" />
                  Add User
                </Button>
                <Button
                  onClick={() => navigate('/admin/blogs?status=PENDING')}
                  variant="outline"
                  className="h-24 flex-col"
                >
                  <Clock className="h-8 w-8 mb-2" />
                  Review Content
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              {user?.role === 'ADMIN' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/activity-logs')}
                >
                  View All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.action)}`}>
                      {getActivityIcon(activity.action)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.user?.firstName} {activity.user?.lastName} - {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.createdAt))} ago
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Content Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="blogs">
            <TabsList>
              <TabsTrigger value="blogs">Blogs</TabsTrigger>
              <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
            </TabsList>
            <TabsContent value="blogs" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{stats.blogs.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">{stats.blogs.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{stats.blogs.approved}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{stats.blogs.rejected}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="newsletters" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{stats.newsletters.total}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-3xl font-bold text-amber-600">{stats.newsletters.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{stats.newsletters.approved}</p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{stats.newsletters.rejected}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

