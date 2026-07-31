import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import AdminSummaryCards from '@/components/admin/AdminSummaryCards';
import ManageUpdates from '@/components/admin/ManageUpdates';
import ManageDocumentations from '@/components/admin/ManageDocumentations';
import InlineEditCell from '@/components/admin/InlineEditCell';
import StaffPerformanceSection from '@/components/admin/StaffPerformanceSection';
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
  Search,
  Ban,
  RotateCcw,
  Lock,
  KeyRound,
  FileText,
  Eye,
  Pencil,
  Power,
  ShieldCheck,
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  district: string | null;
  status: 'pending' | 'active' | 'rejected' | 'terminated';
  created_at: string;
  range_start: number | null;
  range_end: number | null;
  current_serial: number;
  exit_date: string | null;
  last_login_at: string | null;
}

type RoleName = 'super_admin' | 'admin' | 'user';

const SUPER_ADMIN_EMAIL = 'williamcareyfuneral99@gmail.com';

const adminTranslations = {
  en: {
    title: 'Admin Dashboard',
    pendingUsers: 'Pending',
    allUsers: 'All Staff',
    approve: 'Approve',
    reject: 'Reject',
    logout: 'Logout',
    noUsers: 'No users found',
    email: 'Email',
    name: 'Name',
    status: 'Status',
    registeredOn: 'Registered',
    actions: 'Actions',
    pending: 'Pending',
    active: 'Active',
    rejected: 'Rejected',
    terminated: 'Terminated',
    approveSuccess: 'User approved successfully',
    rejectSuccess: 'User rejected successfully',
    terminateSuccess: 'Staff terminated successfully',
    reactivateSuccess: 'Staff reactivated successfully',
    errorTitle: 'Error',
    notAuthorized: 'You are not authorized to access this page',
    rangeStart: 'Range Start',
    rangeEnd: 'Range End',
    currentSerial: 'Current',
    totalApps: 'Apps',
    remaining: 'Remaining',
    usage: 'Usage',
    assignRange: 'Assign Range',
    editRange: 'Edit Range',
    terminate: 'Terminate',
    reactivate: 'Reactivate',
    edit: 'Edit',
    rangeUpdated: 'Serial range updated successfully',
    noRange: 'No range',
  },
  ta: {
    title: 'நிர்வாகி டாஷ்போர்டு',
    pendingUsers: 'நிலுவை',
    allUsers: 'அனைத்து ஊழியர்கள்',
    approve: 'அங்கீகரி',
    reject: 'நிராகரி',
    logout: 'வெளியேறு',
    noUsers: 'பயனர்கள் இல்லை',
    email: 'மின்னஞ்சல்',
    name: 'பெயர்',
    status: 'நிலை',
    registeredOn: 'பதிவு',
    actions: 'செயல்கள்',
    pending: 'நிலுவையில்',
    active: 'செயலில்',
    rejected: 'நிராகரிக்கப்பட்டது',
    terminated: 'நிறுத்தப்பட்டது',
    approveSuccess: 'பயனர் அங்கீகரிக்கப்பட்டார்',
    rejectSuccess: 'பயனர் நிராகரிக்கப்பட்டார்',
    terminateSuccess: 'ஊழியர் நிறுத்தப்பட்டார்',
    reactivateSuccess: 'ஊழியர் மீண்டும் செயல்படுத்தப்பட்டார்',
    errorTitle: 'பிழை',
    notAuthorized: 'இந்த பக்கத்தை அணுக உங்களுக்கு அனுமதி இல்லை',
    rangeStart: 'வரம்பு தொடக்கம்',
    rangeEnd: 'வரம்பு முடிவு',
    currentSerial: 'தற்போதைய',
    totalApps: 'விண்ணப்பங்கள்',
    remaining: 'மீதம்',
    usage: 'பயன்பாடு',
    assignRange: 'வரம்பு ஒதுக்கு',
    editRange: 'வரம்பு திருத்து',
    terminate: 'நிறுத்து',
    reactivate: 'மீண்டும் செயல்படுத்து',
    edit: 'திருத்து',
    rangeUpdated: 'சீரியல் வரம்பு புதுப்பிக்கப்பட்டது',
    noRange: 'வரம்பு இல்லை',
  },
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading, signOut, checkIsAdmin } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [totalApplications, setTotalApplications] = useState(0);
  const [staffSearch, setStaffSearch] = useState('');
  const [roles, setRoles] = useState<Record<string, RoleName>>({});
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<UserProfile | null>(null);
  const [exitDate, setExitDate] = useState('');
  const [editTarget, setEditTarget] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', district: '', exit_date: '' });

  const { isSuperAdmin } = useAuth();

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
          toast({ title: t.errorTitle, description: t.notAuthorized, variant: 'destructive' });
          navigate('/');
          return;
        }
        fetchUsers();
        fetchTotalApplications();
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

      // Roles (highest wins) — used for role column + admin protection rules
      const { data: roleRows } = await supabase.from('user_roles').select('user_id, role');
      const roleMap: Record<string, RoleName> = {};
      (roleRows || []).forEach((r: any) => {
        const current = roleMap[r.user_id];
        const rank = (x: string) => (x === 'super_admin' ? 3 : x === 'admin' ? 2 : 1);
        if (!current || rank(r.role) > rank(current)) roleMap[r.user_id] = r.role;
      });
      setRoles(roleMap);

      // Applications completed per staff (records are never deleted)
      const { data: appRows } = await supabase.from('applications').select('staff_user_id');
      const counts: Record<string, number> = {};
      (appRows || []).forEach((a: any) => {
        counts[a.staff_user_id] = (counts[a.staff_user_id] || 0) + 1;
      });
      setAppCounts(counts);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTotalApplications = async () => {
    try {
      const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true });
      if (!error) setTotalApplications(count || 0);
    } catch (e) {
      console.error('Error fetching application count:', e);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'active' | 'rejected' | 'terminated') => {
    setProcessingUserId(userId);
    try {
      const now = new Date().toISOString();
      const current = users.find((u) => u.user_id === userId);
      const audit: Record<string, any> = { status: newStatus };
      if (newStatus === 'active') {
        if (current?.status === 'pending') {
          audit.approved_at = now;
          audit.approved_by = user?.id || null;
        } else {
          audit.reactivated_at = now;
          audit.reactivated_by = user?.id || null;
        }
      }
      if (newStatus === 'terminated' || newStatus === 'rejected') {
        audit.deactivated_at = now;
      }
      const { error } = await supabase
        .from('profiles')
        .update(audit)
        .eq('user_id', userId);
      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u))
      );

      const msgMap = {
        active: t.approveSuccess,
        rejected: t.rejectSuccess,
        terminated: t.terminateSuccess,
      };
      toast({ title: msgMap[newStatus] || t.reactivateSuccess });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({ title: t.errorTitle, description: 'Failed to update', variant: 'destructive' });
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleInlineUpdate = (userId: string, field: string, value: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, [field]: value } : u))
    );
  };

  const getRole = (u: UserProfile): RoleName =>
    u.email === SUPER_ADMIN_EMAIL ? 'super_admin' : roles[u.user_id] || 'user';

  const isProtected = (u: UserProfile) => getRole(u) === 'super_admin';

  const activeAdminCount = users.filter(
    (u) => u.status === 'active' && (getRole(u) === 'admin' || getRole(u) === 'super_admin')
  ).length;

  // Soft delete: deactivate the account, keep every record permanently.
  const requestDeactivate = (profile: UserProfile) => {
    if (isProtected(profile)) {
      toast({
        title: t.errorTitle,
        description: 'The Super Admin account cannot be deactivated or removed.',
        variant: 'destructive',
      });
      return;
    }
    const role = getRole(profile);
    if ((role === 'admin' || role === 'super_admin') && activeAdminCount <= 1) {
      toast({
        title: t.errorTitle,
        description:
          'Cannot deactivate the last active administrator. At least one active administrator is required to manage the system.',
        variant: 'destructive',
      });
      return;
    }
    if ((role === 'admin' || role === 'super_admin') && !isSuperAdmin) {
      toast({
        title: t.errorTitle,
        description: 'Only the Super Admin can manage administrator accounts.',
        variant: 'destructive',
      });
      return;
    }
    setExitDate(profile.exit_date || '');
    setDeactivateTarget(profile);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    const userId = deactivateTarget.user_id;
    setProcessingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'terminated', exit_date: exitDate || null })
        .eq('user_id', userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, status: 'terminated', exit_date: exitDate || null } : u
        )
      );
      toast({ title: language === 'ta' ? 'கணக்கு செயலிழக்கப்பட்டது' : 'User deactivated' });
      setDeactivateTarget(null);
    } catch (error: any) {
      toast({ title: t.errorTitle, description: error.message, variant: 'destructive' });
    } finally {
      setProcessingUserId(null);
    }
  };

  const activateUser = async (profile: UserProfile) => {
    const role = getRole(profile);
    if ((role === 'admin' || role === 'super_admin') && !isSuperAdmin) {
      toast({
        title: t.errorTitle,
        description: 'Only the Super Admin can reactivate administrator accounts.',
        variant: 'destructive',
      });
      return;
    }
    await updateUserStatus(profile.user_id, 'active');
  };

  const openEdit = (profile: UserProfile) => {
    setEditForm({
      full_name: profile.full_name || '',
      phone_number: profile.phone_number || '',
      district: profile.district || '',
      exit_date: profile.exit_date || '',
    });
    setEditTarget(profile);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setProcessingUserId(editTarget.user_id);
    try {
      const payload = {
        full_name: editForm.full_name.trim() || null,
        phone_number: editForm.phone_number.trim() || null,
        district: editForm.district.trim() || null,
        exit_date: editForm.exit_date || null,
      };
      const { error } = await supabase.from('profiles').update(payload).eq('user_id', editTarget.user_id);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.user_id === editTarget.user_id ? { ...u, ...payload } : u))
      );
      toast({ title: language === 'ta' ? 'புதுப்பிக்கப்பட்டது' : 'Profile updated' });
      setEditTarget(null);
    } catch (error: any) {
      toast({ title: t.errorTitle, description: error.message, variant: 'destructive' });
    } finally {
      setProcessingUserId(null);
    }
  };

  const sendPasswordReset = async (profile: UserProfile) => {
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: t.errorTitle, description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Password reset email sent', description: profile.email });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const baseUsers = activeTab === 'pending' ? users.filter((u) => u.status === 'pending') : users;
  const q = staffSearch.trim().toLowerCase();
  const filteredUsers = q
    ? baseUsers.filter((u) =>
        [u.email, u.full_name, u.phone_number, u.district]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q))
      )
    : baseUsers;

  // Summary calculations
  const pendingStaffCount = users.filter((u) => u.status === 'pending').length;
  const totalStaff = users.filter((u) => u.status !== 'pending').length;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="h-3 w-3" />, label: t.pending },
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="h-3 w-3" />, label: t.active },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="h-3 w-3" />, label: t.rejected },
      terminated: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Ban className="h-3 w-3" />, label: t.terminated },
    };
    const s = styles[status];
    if (!s) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.icon}
        {s.label}
      </span>
    );
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
      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <AdminSummaryCards
          data={{
            totalApplications,
            completedApplications: totalApplications,
            pendingApplications: pendingStaffCount,
            totalStaff,
          }}
          language={language}
        />

        {/* Staff Performance */}
        <StaffPerformanceSection language={language} />

        <Card className="shadow-xl border-2">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                <Shield className="h-6 w-6" />
                {t.title}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="default" onClick={() => navigate('/admin/invoices')}>
                  <FileText className="mr-2 h-4 w-4" />
                  {language === 'ta' ? 'விலைப்பட்டியல் உருவாக்கி' : 'Invoice Generator'}
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.logout}
                </Button>
              </div>
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

            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ta' ? 'தேடு...' : 'Search staff by name, email, phone or district...'}
                className="pl-9"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
              />
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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-3 font-medium">{t.name}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.email}</th>
                      <th className="text-left py-3 px-3 font-medium">{language === 'ta' ? 'தொலைபேசி' : 'Phone'}</th>
                      <th className="text-left py-3 px-3 font-medium">{language === 'ta' ? 'மாவட்டம்' : 'District'}</th>
                      <th className="text-left py-3 px-3 font-medium">{language === 'ta' ? 'பங்கு' : 'Role'}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.status}</th>
                      <th className="text-left py-3 px-3 font-medium">{language === 'ta' ? 'விண்ணப்பங்கள்' : 'Applications'}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.registeredOn}</th>
                      <th className="text-left py-3 px-3 font-medium">{language === 'ta' ? 'கடைசி உள்நுழைவு' : 'Last Login'}</th>
                      <th className="text-left py-3 px-3 font-medium">{language === 'ta' ? 'வெளியேறிய தேதி' : 'Exit Date'}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((profile) => {
                      return (
                        <tr key={profile.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-3">{profile.full_name || '—'}</td>
                          <td className="py-3 px-3 text-xs">{profile.email}</td>
                          <td className="py-3 px-3 text-xs">
                            <InlineEditCell
                              value={profile.phone_number}
                              field="phone_number"
                              userId={profile.user_id}
                              onUpdate={handleInlineUpdate}
                            />
                          </td>
                          <td className="py-3 px-3 text-xs">
                            <InlineEditCell
                              value={profile.district}
                              field="district"
                              userId={profile.user_id}
                              onUpdate={handleInlineUpdate}
                            />
                          </td>
                          <td className="py-3 px-3 text-xs">
                            <span className="inline-flex items-center gap-1 capitalize">
                              {getRole(profile) === 'super_admin' && (
                                <ShieldCheck className="h-3 w-3 text-primary" />
                              )}
                              {getRole(profile) === 'super_admin'
                                ? 'Super Admin'
                                : getRole(profile) === 'admin'
                                ? 'Admin'
                                : 'Staff'}
                            </span>
                          </td>
                          <td className="py-3 px-3">{getStatusBadge(profile.status)}</td>
                          <td className="py-3 px-3 text-xs font-medium">{appCounts[profile.user_id] || 0}</td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">
                            {profile.last_login_at
                              ? new Date(profile.last_login_at).toLocaleString()
                              : '—'}
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">
                            {profile.status === 'terminated' && profile.exit_date
                              ? new Date(profile.exit_date).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1">
                              {/* Approve / Reject for pending */}
                              {profile.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="h-7 text-xs"
                                    onClick={() => updateUserStatus(profile.user_id, 'active')}
                                    disabled={processingUserId === profile.user_id}
                                  >
                                    {processingUserId === profile.user_id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <UserCheck className="mr-1 h-3 w-3" />
                                        {t.approve}
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-7 text-xs"
                                    onClick={() => updateUserStatus(profile.user_id, 'rejected')}
                                    disabled={processingUserId === profile.user_id}
                                  >
                                    <UserX className="mr-1 h-3 w-3" />
                                    {t.reject}
                                  </Button>
                                </>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => navigate(`/admin/staff/${profile.user_id}`)}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                {language === 'ta' ? 'பார்' : 'View'}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => openEdit(profile)}
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                {t.edit}
                              </Button>

                              {profile.status === 'active' && !isProtected(profile) && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => requestDeactivate(profile)}
                                  disabled={processingUserId === profile.user_id}
                                >
                                  <Power className="mr-1 h-3 w-3" />
                                  {language === 'ta' ? 'செயலிழக்கு' : 'Deactivate'}
                                </Button>
                              )}

                              {(profile.status === 'terminated' || profile.status === 'rejected') && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs"
                                  onClick={() => activateUser(profile)}
                                  disabled={processingUserId === profile.user_id}
                                >
                                  <RotateCcw className="mr-1 h-3 w-3" />
                                  {language === 'ta' ? 'செயல்படுத்து' : 'Activate'}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => sendPasswordReset(profile)}
                              >
                                <KeyRound className="mr-1 h-3 w-3" />
                                {language === 'ta' ? 'கடவுச்சொல் மீட்டமை' : 'Reset Password'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manage Updates */}
      <ManageUpdates language={language} />

      {/* Manage Documentations */}
      <ManageDocumentations language={language} />

      {/* Change Password Section */}
      <ChangePasswordSection language={language} />

      {/* Deactivate dialog — soft delete with optional resignation date */}
      <Dialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate User</DialogTitle>
            <DialogDescription>
              {deactivateTarget?.full_name || deactivateTarget?.email} will no longer be able to
              sign in. All applications, invoices and records created by this user are kept
              permanently.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="exitDate">Resignation / Exit Date (optional)</Label>
            <Input
              id="exitDate"
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeactivate}
              disabled={!!processingUserId}
            >
              {processingUserId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>{editTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={editForm.phone_number}
                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editDistrict">District</Label>
              <Input
                id="editDistrict"
                value={editForm.district}
                onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="editExit">Resignation / Exit Date</Label>
              <Input
                id="editExit"
                type="date"
                value={editForm.exit_date}
                onChange={(e) => setEditForm({ ...editForm, exit_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={!!processingUserId}>
              {processingUserId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const changePasswordTranslations = {
  en: {
    title: 'Change Password',
    oldPassword: 'Old Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    submit: 'Update Password',
    updating: 'Updating...',
    successTitle: 'Password Updated',
    successMsg: 'Your password has been updated successfully.',
    errorTitle: 'Error',
    mismatch: 'Passwords do not match',
    tooShort: 'Password must be at least 8 characters',
    weakPassword: 'Password must include letters and numbers',
    wrongOldPassword: 'Old password is incorrect',
  },
  ta: {
    title: 'கடவுச்சொல்லை மாற்று',
    oldPassword: 'பழைய கடவுச்சொல்',
    newPassword: 'புதிய கடவுச்சொல்',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்து',
    submit: 'கடவுச்சொல்லை புதுப்பி',
    updating: 'புதுப்பிக்கிறது...',
    successTitle: 'கடவுச்சொல் புதுப்பிக்கப்பட்டது',
    successMsg: 'உங்கள் கடவுச்சொல் வெற்றிகரமாக புதுப்பிக்கப்பட்டது.',
    errorTitle: 'பிழை',
    mismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை',
    tooShort: 'கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் இருக்க வேண்டும்',
    weakPassword: 'கடவுச்சொல்லில் எழுத்துகளும் எண்களும் இருக்க வேண்டும்',
    wrongOldPassword: 'பழைய கடவுச்சொல் தவறானது',
  },
};

const ChangePasswordSection: React.FC<{ language: 'en' | 'ta' }> = ({ language }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = changePasswordTranslations[language];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (newPassword !== confirmPassword) {
      toast({ title: t.errorTitle, description: t.mismatch, variant: 'destructive' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: t.errorTitle, description: t.tooShort, variant: 'destructive' });
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast({ title: t.errorTitle, description: t.weakPassword, variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify old password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        toast({ title: t.errorTitle, description: t.wrongOldPassword, variant: 'destructive' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: t.successTitle, description: t.successMsg });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: t.errorTitle, description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-7xl mx-auto mt-6 shadow-xl border-2">
      <CardHeader className="bg-primary/5 border-b">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div>
            <Label htmlFor="oldPassword" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t.oldPassword}
            </Label>
            <Input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="adminNewPassword" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t.newPassword}
            </Label>
            <Input
              id="adminNewPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1"
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="adminConfirmPassword" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t.confirmPassword}
            </Label>
            <Input
              id="adminConfirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.updating}
              </>
            ) : (
              t.submit
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
