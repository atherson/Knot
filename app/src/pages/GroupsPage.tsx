import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI } from '@/lib/api';
import type { Group } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search, Plus, Users, BookOpen, Calendar, Trophy } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'department', label: 'Departments', icon: BookOpen },
  { id: 'course', label: 'Courses', icon: Calendar },
  { id: 'club', label: 'Clubs', icon: Trophy },
];

export function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchGroups = useCallback(async () => {
    try {
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const [allGroupsResponse, myGroupsResponse] = await Promise.all([
        groupsAPI.getGroups(category, 1, 20),
        groupsAPI.getMyGroups(),
      ]);
      setGroups(allGroupsResponse.data.groups);
      setMyGroups(myGroupsResponse.data.groups);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleJoinGroup = async (groupId: number) => {
    try {
      await groupsAPI.joinGroup(groupId);
      toast.success('Joined group successfully!');
      fetchGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join group');
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isMember = (groupId: number) => myGroups.some((g) => g.id === groupId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-14 rounded-2xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Groups & Communities</h1>
        <Button className="gradient-orange text-white btn-press">
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 bg-white border-0 shadow-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'gradient-orange text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Groups</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isMember={true}
                onClick={() => navigate(`/groups/${group.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* All Groups */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Discover Groups</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups
            .filter((g) => !isMember(g.id))
            .map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                isMember={false}
                onJoin={() => handleJoinGroup(group.id)}
                onClick={() => navigate(`/groups/${group.id}`)}
              />
            ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No groups found</h3>
          <p className="text-gray-500 mb-4">Create a group to connect with like-minded students</p>
          <Button className="gradient-orange text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      )}
    </div>
  );
}

interface GroupCardProps {
  group: Group;
  isMember: boolean;
  onClick?: () => void;
  onJoin?: () => void;
}

function GroupCard({ group, isMember, onClick, onJoin }: GroupCardProps) {
  return (
    <Card
      className="border-0 shadow-md overflow-hidden cursor-pointer card-hover"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16 rounded-xl">
            <AvatarImage src={group.avatar} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-xl rounded-xl">
              {group.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{group.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className="text-xs">
                {group.category}
              </Badge>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {group.members_count}
              </span>
            </div>
          </div>
        </div>
        {!isMember && onJoin && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onJoin();
            }}
            className="w-full mt-4 gradient-orange text-white"
            size="sm"
          >
            Join Group
          </Button>
        )}
        {isMember && (
          <Button
            variant="outline"
            className="w-full mt-4"
            size="sm"
            disabled
          >
            Member
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
