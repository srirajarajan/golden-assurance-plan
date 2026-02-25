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
import { useToast } from '@/hooks/use-toast';
import AdminSummaryCards from '@/components/admin/AdminSummaryCards';
import SerialRangeDialog from '@/components/admin/SerialRangeDialog';
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
  Edit,
  Ban,
  RotateCcw,
  Hash,
  Lock,
  KeyRound,
} from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: 'pending' | 'active' | 'rejected' | 'terminated';
  created_at: string;
  range_start: number | null;
  range_end: number | null;
  current_serial: number;
}

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
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

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
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
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

  const handleSaveRange = async (rangeStart: number, rangeEnd: number) => {
    if (!selectedUser) return;

    // Validate via DB function
    const { error: valError } = await supabase.rpc('validate_serial_range', {
      p_user_id: selectedUser.user_id,
      p_range_start: rangeStart,
      p_range_end: rangeEnd,
    });

    if (valError) throw new Error(valError.message);

    const { error } = await supabase
      .from('profiles')
      .update({ range_start: rangeStart, range_end: rangeEnd })
      .eq('user_id', selectedUser.user_id);

    if (error) throw new Error(error.message);

    setUsers((prev) =>
      prev.map((u) =>
        u.user_id === selectedUser.user_id
          ? { ...u, range_start: rangeStart, range_end: rangeEnd }
          : u
      )
    );
    toast({ title: t.rangeUpdated });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredUsers =
    activeTab === 'pending' ? users.filter((u) => u.status === 'pending') : users;

  // Summary calculations
  const activeStaff = users.filter((u) => u.status === 'active').length;
  const terminatedStaff = users.filter((u) => u.status === 'terminated').length;
  const totalSerialsUsed = users.reduce((sum, u) => {
    if (u.range_start && u.current_serial >= u.range_start) {
      return sum + (u.current_serial - u.range_start + 1);
    }
    return sum;
  }, 0);

  const getUsageInfo = (profile: UserProfile) => {
    if (!profile.range_start || !profile.range_end) return null;
    const totalRange = profile.range_end - profile.range_start + 1;
    const used = profile.current_serial >= profile.range_start
      ? profile.current_serial - profile.range_start + 1
      : 0;
    const remaining = totalRange - used;
    const percentage = totalRange > 0 ? (used / totalRange) * 100 : 0;
    return { totalRange, used, remaining, percentage };
  };

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
          data={{ totalApplications, activeStaff, terminatedStaff, totalSerialsUsed }}
          language={language}
        />

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
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-3 font-medium">{t.email}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.name}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.status}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.rangeStart}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.rangeEnd}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.currentSerial}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.totalApps}/{t.remaining}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.usage}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.registeredOn}</th>
                      <th className="text-left py-3 px-3 font-medium">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((profile) => {
                      const usage = getUsageInfo(profile);
                      return (
                        <tr key={profile.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-3 text-xs">{profile.email}</td>
                          <td className="py-3 px-3">{profile.full_name || '—'}</td>
                          <td className="py-3 px-3">{getStatusBadge(profile.status)}</td>
                          <td className="py-3 px-3 font-mono text-xs">
                            {profile.range_start?.toString().padStart(5, '0') || '—'}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            {profile.range_end?.toString().padStart(5, '0') || '—'}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs">
                            {profile.current_serial > 0
                              ? profile.current_serial.toString().padStart(5, '0')
                              : '—'}
                          </td>
                          <td className="py-3 px-3 text-xs">
                            {usage ? (
                              <span>
                                {usage.used} / {usage.remaining}
                              </span>
                            ) : (
                              t.noRange
                            )}
                          </td>
                          <td className="py-3 px-3 w-24">
                            {usage ? (
                              <div className="space-y-1">
                                <Progress value={usage.percentage} className="h-2" />
                                <span className="text-xs text-muted-foreground">
                                  {usage.percentage.toFixed(1)}%
                                </span>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString()}
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

                              {/* Edit range for active/terminated */}
                              {(profile.status === 'active' || profile.status === 'terminated') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setSelectedUser(profile);
                                    setRangeDialogOpen(true);
                                  }}
                                >
                                  <Hash className="mr-1 h-3 w-3" />
                                  {profile.range_start ? t.editRange : t.assignRange}
                                </Button>
                              )}

                              {/* Terminate for active */}
                              {profile.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => updateUserStatus(profile.user_id, 'terminated')}
                                  disabled={processingUserId === profile.user_id}
                                >
                                  <Ban className="mr-1 h-3 w-3" />
                                  {t.terminate}
                                </Button>
                              )}

                              {/* Reactivate for terminated/rejected */}
                              {(profile.status === 'terminated' || profile.status === 'rejected') && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="h-7 text-xs"
                                  onClick={() => updateUserStatus(profile.user_id, 'active')}
                                  disabled={processingUserId === profile.user_id}
                                >
                                  <RotateCcw className="mr-1 h-3 w-3" />
                                  {t.reactivate}
                                </Button>
                              )}
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

      {/* Serial Range Dialog */}
      <SerialRangeDialog
        open={rangeDialogOpen}
        onClose={() => {
          setRangeDialogOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveRange}
        currentStart={selectedUser?.range_start}
        currentEnd={selectedUser?.range_end}
        currentSerial={selectedUser?.current_serial || 0}
        staffName={selectedUser?.full_name || selectedUser?.email}
        language={language}
      />

      {/* Change Password Section */}
      <ChangePasswordSection language={language} />
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
