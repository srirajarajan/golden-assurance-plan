import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  Shield,
  Users,
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: 'pending' | 'active' | 'rejected';
  created_at: string;
}

const adminTranslations = {
  en: {
    title: 'Admin Dashboard',
    pendingUsers: 'Pending Users',
    allUsers: 'All Users',
    approve: 'Approve',
    reject: 'Reject',
    logout: 'Logout',
    noUsers: 'No pending users',
    email: 'Email',
    name: 'Name',
    status: 'Status',
    registeredOn: 'Registered On',
    actions: 'Actions',
    pending: 'Pending',
    active: 'Active',
    rejected: 'Rejected',
    approveSuccess: 'User approved successfully',
    rejectSuccess: 'User rejected successfully',
    errorTitle: 'Error',
    notAuthorized: 'You are not authorized to access this page',
  },
  ta: {
    title: 'நிர்வாகி டாஷ்போர்டு',
    pendingUsers: 'நிலுவையில் உள்ள பயனர்கள்',
    allUsers: 'அனைத்து பயனர்கள்',
    approve: 'அங்கீகரிக்க',
    reject: 'நிராகரிக்க',
    logout: 'வெளியேறு',
    noUsers: 'நிலுவையில் பயனர்கள் இல்லை',
    email: 'மின்னஞ்சல்',
    name: 'பெயர்',
    status: 'நிலை',
    registeredOn: 'பதிவு தேதி',
    actions: 'செயல்கள்',
    pending: 'நிலுவையில்',
    active: 'செயலில்',
    rejected: 'நிராகரிக்கப்பட்டது',
    approveSuccess: 'பயனர் வெற்றிகரமாக அங்கீகரிக்கப்பட்டார்',
    rejectSuccess: 'பயனர் வெற்றிகரமாக நிராகரிக்கப்பட்டார்',
    errorTitle: 'பிழை',
    notAuthorized: 'இந்த பக்கத்தை அணுக உங்களுக்கு அனுமதி இல்லை',
  },
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAdmin, signOut, checkIsAdmin } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  const t = adminTranslations[language];

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user && !isLoading) {
        navigate('/login');
        return;
      }

      if (user && !isLoading) {
        const adminStatus = await checkIsAdmin();
        if (!adminStatus) {
          toast({
            title: t.errorTitle,
            description: t.notAuthorized,
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        fetchUsers();
      }
    };

    checkAdminAndFetch();
  }, [user, isLoading]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data as UserProfile[]) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'rejected') => {
    setProcessingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u))
      );

      toast({
        title: newStatus === 'active' ? t.approveSuccess : t.rejectSuccess,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: t.errorTitle,
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredUsers =
    activeTab === 'pending' ? users.filter((u) => u.status === 'pending') : users;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            {t.pending}
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            {t.active}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            {t.rejected}
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Shield className="h-6 w-6" />
                {t.title}
              </CardTitle>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t.logout}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'pending' ? 'default' : 'outline'}
                onClick={() => setActiveTab('pending')}
              >
                <Clock className="mr-2 h-4 w-4" />
                {t.pendingUsers} ({users.filter((u) => u.status === 'pending').length})
              </Button>
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
              >
                <Users className="mr-2 h-4 w-4" />
                {t.allUsers} ({users.length})
              </Button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noUsers}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">{t.email}</th>
                      <th className="text-left py-3 px-4 font-medium">{t.name}</th>
                      <th className="text-left py-3 px-4 font-medium">{t.status}</th>
                      <th className="text-left py-3 px-4 font-medium">{t.registeredOn}</th>
                      <th className="text-left py-3 px-4 font-medium">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((profile) => (
                      <tr key={profile.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{profile.email}</td>
                        <td className="py-3 px-4">{profile.full_name || '—'}</td>
                        <td className="py-3 px-4">{getStatusBadge(profile.status)}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {profile.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateUserStatus(profile.user_id, 'active')}
                                disabled={processingUserId === profile.user_id}
                              >
                                {processingUserId === profile.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserCheck className="mr-1 h-4 w-4" />
                                    {t.approve}
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateUserStatus(profile.user_id, 'rejected')}
                                disabled={processingUserId === profile.user_id}
                              >
                                {processingUserId === profile.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <UserX className="mr-1 h-4 w-4" />
                                    {t.reject}
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                          {profile.status === 'rejected' && (
                            <Button
                              size="sm"
                              onClick={() => updateUserStatus(profile.user_id, 'active')}
                              disabled={processingUserId === profile.user_id}
                            >
                              {processingUserId === profile.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="mr-1 h-4 w-4" />
                                  {t.approve}
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
