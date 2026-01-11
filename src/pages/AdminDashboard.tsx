import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Sprout,
  LogOut,
  Users,
  Wallet,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Member {
  id: string;
  user_id: string;
  member_role: string;
  status: string;
  join_date: string;
  profiles: {
    full_name: string;
    phone_number: string;
  } | null;
}

interface Contribution {
  id: string;
  amount: number;
  status: string;
  contribution_date: string;
  user_id: string;
  profiles: {
    full_name: string;
  } | null;
}

interface Loan {
  id: string;
  amount: number;
  status: string;
  purpose: string;
  interest_rate: number;
  repayment_period: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    phone_number: string;
  } | null;
}

interface Stats {
  totalMembers: number;
  totalSavings: number;
  totalLoans: number;
  pendingLoans: number;
}

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, totalSavings: 0, totalLoans: 0, pendingLoans: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [processingLoan, setProcessingLoan] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, user, navigate, toast]);

  useEffect(() => {
    async function fetchData() {
      if (!user || !isAdmin) return;

      try {
        // Fetch all members with profiles using separate queries
        const { data: membersData } = await supabase
          .from('chama_members')
          .select('*')
          .order('join_date', { ascending: false });

        if (membersData) {
          // Fetch profiles for each member
          const memberUserIds = membersData.map(m => m.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, phone_number')
            .in('user_id', memberUserIds);

          const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));
          
          const membersWithProfiles = membersData.map(m => ({
            ...m,
            profiles: profilesMap.get(m.user_id) || null,
          }));

          setMembers(membersWithProfiles);
        }

        // Fetch all contributions with profiles
        const { data: contributionsData } = await supabase
          .from('contributions')
          .select('*')
          .order('contribution_date', { ascending: false })
          .limit(50);

        if (contributionsData) {
          const contribUserIds = contributionsData.map(c => c.user_id);
          const { data: contribProfilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', contribUserIds);

          const contribProfilesMap = new Map(contribProfilesData?.map(p => [p.user_id, p]));
          
          const contributionsWithProfiles = contributionsData.map(c => ({
            ...c,
            profiles: contribProfilesMap.get(c.user_id) || null,
          }));

          setContributions(contributionsWithProfiles);
        }

        // Fetch all loans with profiles
        const { data: loansData } = await supabase
          .from('loans')
          .select('*')
          .order('created_at', { ascending: false });

        if (loansData) {
          const loanUserIds = loansData.map(l => l.user_id);
          const { data: loanProfilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, phone_number')
            .in('user_id', loanUserIds);

          const loanProfilesMap = new Map(loanProfilesData?.map(p => [p.user_id, p]));
          
          const loansWithProfiles = loansData.map(l => ({
            ...l,
            profiles: loanProfilesMap.get(l.user_id) || null,
          }));

          setLoans(loansWithProfiles);
        }

        // Calculate stats
        const totalMembers = membersData?.length || 0;
        const totalSavings = contributionsData?.filter(c => c.status === 'completed')
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const totalLoans = loansData?.filter(l => l.status === 'disbursed')
          .reduce((sum, l) => sum + Number(l.amount), 0) || 0;
        const pendingLoans = loansData?.filter(l => l.status === 'pending').length || 0;

        setStats({ totalMembers, totalSavings, totalLoans, pendingLoans });
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }

    if (isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject') => {
    setProcessingLoan(loanId);

    try {
      if (action === 'approve') {
        // Find the loan and member phone number
        const loan = loans.find(l => l.id === loanId);
        if (!loan) throw new Error('Loan not found');

        // Update loan to approved
        const { error: updateError } = await supabase
          .from('loans')
          .update({
            status: 'approved',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', loanId);

        if (updateError) throw updateError;

        // Disburse via M-Pesa
        const { data: response, error: disburseError } = await supabase.functions.invoke('mpesa-b2c', {
          body: {
            loan_id: loanId,
            phone_number: loan.profiles?.phone_number,
            amount: loan.amount,
            user_id: loan.user_id,
          },
        });

        if (disburseError) throw disburseError;

        toast({
          title: 'Loan Approved',
          description: `KES ${loan.amount.toLocaleString()} has been disbursed to the member.`,
        });
      } else {
        // Reject loan
        const { error } = await supabase
          .from('loans')
          .update({ status: 'rejected' })
          .eq('id', loanId);

        if (error) throw error;

        toast({
          title: 'Loan Rejected',
          description: 'The loan application has been rejected.',
        });
      }

      // Refresh loans
      const { data: updatedLoans } = await supabase
        .from('loans')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedLoans) {
        const loanUserIds = updatedLoans.map(l => l.user_id);
        const { data: loanProfilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone_number')
          .in('user_id', loanUserIds);

        const loanProfilesMap = new Map(loanProfilesData?.map(p => [p.user_id, p]));
        
        const loansWithProfiles = updatedLoans.map(l => ({
          ...l,
          profiles: loanProfilesMap.get(l.user_id) || null,
        }));

        setLoans(loansWithProfiles);
      }
    } catch (error: any) {
      console.error('Loan action error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process loan action.',
        variant: 'destructive',
      });
    } finally {
      setProcessingLoan(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'disbursed':
        return <Badge className="bg-success text-success-foreground">{status}</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">{status}</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">
          <Sprout className="w-12 h-12" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-xl text-foreground">Our Future Chama</span>
                <Badge variant="secondary" className="ml-2">Admin</Badge>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost">Member View</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Members
              </CardDescription>
              <CardTitle className="text-2xl">
                {isLoadingData ? <Skeleton className="h-8 w-16" /> : stats.totalMembers}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Total Savings
              </CardDescription>
              <CardTitle className="text-2xl text-primary">
                {isLoadingData ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats.totalSavings)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Active Loans
              </CardDescription>
              <CardTitle className="text-2xl text-accent">
                {isLoadingData ? <Skeleton className="h-8 w-32" /> : formatCurrency(stats.totalLoans)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Approvals
              </CardDescription>
              <CardTitle className="text-2xl text-warning">
                {isLoadingData ? <Skeleton className="h-8 w-16" /> : stats.pendingLoans}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="loans" className="space-y-6">
          <TabsList>
            <TabsTrigger value="loans" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Loan Requests
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="contributions" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Contributions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Loan Requests Tab */}
          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle>Loan Applications</CardTitle>
                <CardDescription>Review and process member loan requests</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : loans.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">
                            {loan.profiles?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell>{formatCurrency(Number(loan.amount))}</TableCell>
                          <TableCell className="max-w-xs truncate">{loan.purpose}</TableCell>
                          <TableCell>{loan.repayment_period} months</TableCell>
                          <TableCell>{getStatusBadge(loan.status)}</TableCell>
                          <TableCell>{formatDate(loan.created_at)}</TableCell>
                          <TableCell>
                            {loan.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-success hover:bg-success/90"
                                  onClick={() => handleLoanAction(loan.id, 'approve')}
                                  disabled={processingLoan === loan.id}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleLoanAction(loan.id, 'reject')}
                                  disabled={processingLoan === loan.id}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No loan applications yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Chama Members</CardTitle>
                <CardDescription>View and manage member information</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.profiles?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell>{member.profiles?.phone_number || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.member_role}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(member.status)}</TableCell>
                          <TableCell>{formatDate(member.join_date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No members yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contributions Tab */}
          <TabsContent value="contributions">
            <Card>
              <CardHeader>
                <CardTitle>Contributions</CardTitle>
                <CardDescription>View all member contributions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : contributions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.map((contrib) => (
                        <TableRow key={contrib.id}>
                          <TableCell className="font-medium">
                            {contrib.profiles?.full_name || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-success font-semibold">
                            {formatCurrency(Number(contrib.amount))}
                          </TableCell>
                          <TableCell>{getStatusBadge(contrib.status)}</TableCell>
                          <TableCell>{formatDate(contrib.contribution_date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No contributions yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Growth Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span>Monthly Savings Growth</span>
                      <span className="text-success font-semibold">+15%</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span>New Members This Month</span>
                      <span className="font-semibold">{stats.totalMembers}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span>Loan Repayment Rate</span>
                      <span className="text-success font-semibold">98%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-accent" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span>Total Collected</span>
                      <span className="text-primary font-semibold">{formatCurrency(stats.totalSavings)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span>Total Disbursed</span>
                      <span className="text-accent font-semibold">{formatCurrency(stats.totalLoans)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span>Available Balance</span>
                      <span className="font-semibold">{formatCurrency(stats.totalSavings - stats.totalLoans)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
