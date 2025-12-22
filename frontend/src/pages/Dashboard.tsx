import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.getDashboard()
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const stats = data || {
    blogs: { total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 },
    newsletters: { total: 0, pending: 0, approved: 0, rejected: 0, disabled: 0 },
    users: null,
    recentActivity: []
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Blogs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.blogs.total}</div>
            <div className="text-sm text-gray-500 mt-2">
              {stats.blogs.pending} pending, {stats.blogs.approved} approved
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total Newsletters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.newsletters.total}</div>
            <div className="text-sm text-gray-500 mt-2">
              {stats.newsletters.pending} pending, {stats.newsletters.approved} approved
            </div>
          </CardContent>
        </Card>

        {user?.role === 'ADMIN' && stats.users && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.users.total}</div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.users.active} active
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Pending Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.blogs.pending + stats.newsletters.pending}
            </div>
            <div className="text-sm text-gray-500 mt-2">Awaiting approval</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">
                      {activity.user?.firstName} {activity.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{activity.action}</p>
                  </div>
                  <p className="text-sm text-gray-400">
                    {format(new Date(activity.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

