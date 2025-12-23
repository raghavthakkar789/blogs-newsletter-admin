import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Settings() {
  const [loading, setLoading] = useState(false);

  const handleSave = async (section: string) => {
    try {
      setLoading(true);
      // TODO: Implement API calls for settings
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      toast.success(`${section} settings saved successfully`);
    } catch (error) {
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system settings</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Name</Label>
                <Input defaultValue="Blog Admin Panel" />
              </div>

              <div>
                <Label>Site Description</Label>
                <Textarea rows={3} defaultValue="Manage blogs and newsletters" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">Temporarily disable the site</p>
                </div>
                <Switch />
              </div>

              <Button onClick={() => handleSave('General')} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SMTP Host</Label>
                <Input placeholder="smtp.gmail.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SMTP Port</Label>
                  <Input type="number" placeholder="587" />
                </div>
                <div>
                  <Label>Encryption</Label>
                  <Select defaultValue="tls">
                    <SelectTrigger>
                      <SelectValue placeholder="TLS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>SMTP Username</Label>
                <Input type="email" />
              </div>

              <div>
                <Label>SMTP Password</Label>
                <Input type="password" />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSave('Email')} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Email Settings
                </Button>
                <Button variant="outline">Send Test Email</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Strong Passwords</Label>
                  <p className="text-sm text-gray-600">Enforce password complexity rules</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Enable 2FA for all users</p>
                </div>
                <Switch />
              </div>

              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input type="number" defaultValue="60" />
              </div>

              <div>
                <Label>Max Login Attempts</Label>
                <Input type="number" defaultValue="5" />
              </div>

              <Button onClick={() => handleSave('Security')} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>AI Webhook URL</Label>
                <Input defaultValue="http://54.88.119.163:5679/webhook-test/..." />
              </div>

              <div>
                <Label>Max Upload Size (MB)</Label>
                <Input type="number" defaultValue="10" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-gray-600">Show detailed error messages</p>
                </div>
                <Switch />
              </div>

              <Button onClick={() => handleSave('Advanced')} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Advanced Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Clear All Cache</Label>
                  <p className="text-sm text-gray-600">Remove all cached data</p>
                </div>
                <Button variant="outline">Clear Cache</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Export All Data</Label>
                  <p className="text-sm text-gray-600">Download backup of all content</p>
                </div>
                <Button variant="outline">Export Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
