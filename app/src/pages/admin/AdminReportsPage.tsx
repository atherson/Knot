import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Flag, CheckCircle, XCircle, Eye, MessageSquare, User } from 'lucide-react';

export function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await adminAPI.getReports();
        setReports(response.data.reports || []);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleResolve = async (reportId: number, action: string) => {
    try {
      await adminAPI.resolveReport(reportId, action);
      toast.success('Report resolved');
      setReports(reports.filter((r) => r.id !== reportId));
    } catch (error) {
      toast.error('Failed to resolve report');
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'post':
        return MessageSquare;
      case 'comment':
        return MessageSquare;
      case 'user':
        return User;
      default:
        return Flag;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports Queue</h1>
        <Badge className="bg-red-500 text-white">
          <Flag className="w-4 h-4 mr-1" />
          {reports.length} Pending
        </Badge>
      </div>

      <div className="space-y-4">
        {reports.map((report) => {
          const TargetIcon = getTargetIcon(report.target_type);
          
          return (
            <Card key={report.id} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <TargetIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{report.target_type}</Badge>
                      <span className="text-sm text-gray-500">
                        Reported {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="font-semibold text-gray-900 mb-1">
                      Reason: {report.reason}
                    </p>
                    
                    {report.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {report.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <span>Reported by:</span>
                      <span className="font-medium">{report.reporter?.name}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleResolve(report.id, 'dismiss')}
                        variant="outline"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                      <Button
                        onClick={() => handleResolve(report.id, 'remove_content')}
                        variant="outline"
                        className="text-orange-600"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Remove Content
                      </Button>
                      <Button
                        onClick={() => handleResolve(report.id, 'suspend_user')}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Suspend User
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {reports.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending reports</h3>
            <p className="text-gray-500">All reports have been resolved</p>
          </div>
        )}
      </div>
    </div>
  );
}
