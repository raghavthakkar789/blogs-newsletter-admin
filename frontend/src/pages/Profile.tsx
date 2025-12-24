import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { authService, analyticsService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { RoleBadge } from '@/components/common/RoleBadge';
import { toast } from 'sonner';
import { Upload, Loader2, Eye, EyeOff } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address')
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => analyticsService.getDashboard(),
    enabled: !!user?.id
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema)
  });

  const onSubmitProfile = async (data: UpdateProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      await authService.updateProfile(data);
      await refreshUser();
      toast.success('Profile updated successfully');
      resetProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    try {
      setIsUpdatingPassword(true);
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      resetPassword();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const totalBlogs = stats?.blogs?.total || 0;
  const totalNewsletters = stats?.newsletters?.total || 0;
  const approvedContent = (stats?.blogs?.approved || 0) + (stats?.newsletters?.approved || 0);
  const pendingContent = (stats?.blogs?.pending || 0) + (stats?.newsletters?.pending || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <RoleBadge role={user?.role || 'MARKETING_MANAGER'} className="mt-3" />

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last login</span>
                  <span className="font-medium">
                    {user?.lastLogin
                      ? formatDistanceToNow(new Date(user.lastLogin)) + ' ago'
                      : 'Never'}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-6">
                <Upload className="mr-2 h-4 w-4" />
                Change Avatar
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input {...registerProfile('firstName')} />
                    {profileErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{profileErrors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input {...registerProfile('lastName')} />
                    {profileErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{profileErrors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input {...registerProfile('email')} type="email" />
                  {profileErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{profileErrors.email.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerPassword('currentPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerPassword('newPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerPassword('confirmPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <p className="text-3xl font-bold text-blue-400">{totalBlogs}</p>
                  <p className="text-sm text-muted-foreground">Total Blogs</p>
                </div>
                <div className="text-center p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <p className="text-3xl font-bold text-purple-400">{totalNewsletters}</p>
                  <p className="text-sm text-muted-foreground">Total Newsletters</p>
                </div>
                <div className="text-center p-4 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-3xl font-bold text-green-400">{approvedContent}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
                <div className="text-center p-4 bg-amber-500/20 rounded-lg border border-amber-500/30">
                  <p className="text-3xl font-bold text-amber-400">{pendingContent}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
