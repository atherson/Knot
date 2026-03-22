import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Ban, CheckCircle, MoreVertical, Shield } from 'lucide-react';

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminAPI.getUsers();
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSuspend = async (userId: number) => {
    try {
      await adminAPI.suspendUser(userId);
      toast.success('User suspended');
      setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: true } : u));
    } catch (error) {
      toast.error('Failed to suspend user');
    }
  };

  const handleUnsuspend = async (userId: number) => {
    try {
      await adminAPI.unsuspendUser(userId);
      toast.success('User unsuspended');
      setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: false } : u));
    } catch (error) {
      toast.error('Failed to unsuspend user');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 rounded-2xl" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 bg-white border-0 shadow-sm"
        />
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{user.name || 'Anonymous'}</p>
                    {user.is_admin && (
                      <Badge className="bg-purple-500 text-white">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {user.is_suspended && (
                      <Badge variant="destructive">Suspended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.is_suspended ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnsuspend(user.id)}
                      className="text-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspend(user.id)}
                      className="text-red-600"
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
