import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI, notificationsAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Bell, Shield, Mail, Smartphone, Save, Loader2 } from 'lucide-react';

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    department: user?.department || '',
    course: user?.course || '',
    year_of_study: user?.year_of_study?.toString() || '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email_likes: true,
    email_comments: true,
    email_messages: true,
    email_groups: true,
    push_likes: true,
    push_comments: true,
    push_messages: true,
    push_groups: true,
  });

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      const updates: any = { ...profileData };
      if (updates.year_of_study) {
        updates.year_of_study = parseInt(updates.year_of_study);
      }
      const response = await authAPI.updateProfile(updates);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setIsLoading(true);
    try {
      await notificationsAPI.updatePreferences(notifications);
      toast.success('Notification preferences updated!');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="border-0 shadow-md md:col-span-1 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === section.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="md:col-span-3 space-y-6">
          {activeSection === 'profile' && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={profileData.course}
                      onChange={(e) => setProfileData({ ...profileData, course: e.target.value })}
                      placeholder="e.g., BSc Computer Science"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year of Study</Label>
                  <Input
                    id="year"
                    type="number"
                    value={profileData.year_of_study}
                    onChange={(e) => setProfileData({ ...profileData, year_of_study: e.target.value })}
                    placeholder="e.g., 2"
                    min={1}
                    max={6}
                  />
                </div>

                <Button
                  onClick={handleProfileUpdate}
                  disabled={isLoading}
                  className="gradient-orange text-white"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'email_likes', label: 'Likes on your posts' },
                      { key: 'email_comments', label: 'Comments on your posts' },
                      { key: 'email_messages', label: 'New messages' },
                      { key: 'email_groups', label: 'Group activity' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.label}</span>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [item.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Push Notifications
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'push_likes', label: 'Likes on your posts' },
                      { key: 'push_comments', label: 'Comments on your posts' },
                      { key: 'push_messages', label: 'New messages' },
                      { key: 'push_groups', label: 'Group activity' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-gray-600">{item.label}</span>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [item.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleNotificationUpdate}
                  disabled={isLoading}
                  className="gradient-orange text-white"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'privacy' && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Account Security</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your account is secured with OTP-based authentication. Each login requires a
                    verification code sent to your email.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Shield className="w-4 h-4" />
                    <span>Two-factor authentication enabled</span>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-xl">
                  <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
                  <p className="text-sm text-red-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
