import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sprout, 
  LogOut, 
  Wallet, 
  CreditCard, 
  FileText, 
  TrendingUp,
  Calendar,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface Profile {
  full_name: string;
  phone_number: string;
}

interface ChamamMembership {
  chama_id: string;
  member_role: string;
  chamas: {
    name: string;
    contribution_amount: number;
    contribution_frequency: string;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chamaInfo, setChamaInfo] = useState<ChamamMembership | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .eq('user_id', user.id)
          .single();
        
        if (profileData) setProfile(profileData);

        // Fetch chama membership
        const { data: membershipData } = await supabase
          .from('chama_members')
          .select(`
            chama_id,
            member_role,
            chamas (
              name,
              contribution_amount,
              contribution_frequency
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (membershipData) {
          setChamaInfo(membershipData as unknown as ChamamMembership);
        }

        // Fetch contributions total
        const { data: contributionsData } = await supabase
          .from('contributions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (contributionsData) {
          const total = contributionsData.reduce((sum, c) => sum + Number(c.amount), 0);
          setTotalSavings(total);
        }

        // Fetch recent transactions
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (transactionsData) {
          setTransactions(transactionsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">
          <Sprout className="w-12 h-12" />
        </div>
      </div>
    );
  }

  const savingsTarget = 100000;
  const savingsPercentage = Math.min((totalSavings / savingsTarget) * 100, 100);
  const loanLimit = totalSavings * 2;

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
              <span className="font-bold text-xl text-foreground">Our Future Chama</span>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {isLoadingData ? (
                  <Skeleton className="h-8 w-48 bg-primary-foreground/20" />
                ) : (
                  `Welcome back, ${profile?.full_name || 'Member'}!`
                )}
              </h1>
              {chamaInfo ? (
                <p className="text-primary-foreground/80">
                  Your Chama: <span className="font-semibold">{chamaInfo.chamas.name}</span>
                </p>
              ) : (
                <p className="text-primary-foreground/80">
                  You haven't joined a Chama yet
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-primary-foreground/10 rounded-lg px-4 py-2">
                <span className="opacity-80">Next Meeting:</span>
                <span className="font-semibold ml-2">15th Jan 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>Total Savings</CardDescription>
              <CardTitle className="text-2xl text-primary">
                {isLoadingData ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(totalSavings)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-success">
                <TrendingUp className="w-4 h-4" />
                <span>+12% this month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>Available Loan Limit</CardDescription>
              <CardTitle className="text-2xl text-accent">
                {isLoadingData ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(loanLimit)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Based on 2x your savings</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardDescription>Next Contribution Due</CardDescription>
              <CardTitle className="text-2xl text-secondary">
                {chamaInfo ? formatCurrency(Number(chamaInfo.chamas.contribution_amount)) : 'Ksh 0'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Due: 25th Jan 2026</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer group border-primary/20 hover:border-primary">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Make Contribution</h3>
                <p className="text-sm text-muted-foreground">Pay your savings</p>
              </div>
              <Plus className="w-5 h-5 text-primary" />
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer group border-accent/20 hover:border-accent">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Apply for Loan</h3>
                <p className="text-sm text-muted-foreground">Get funds when you need</p>
              </div>
              <Plus className="w-5 h-5 text-accent" />
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-elegant transition-shadow cursor-pointer group border-secondary/20 hover:border-secondary">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-secondary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">View Statement</h3>
                <p className="text-sm text-muted-foreground">Check your history</p>
              </div>
              <Plus className="w-5 h-5 text-secondary" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Savings Progress */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Savings Progress</CardTitle>
              <CardDescription>Track your savings goal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{formatCurrency(totalSavings)}</span>
                  <span className="text-muted-foreground">of {formatCurrency(savingsTarget)}</span>
                </div>
                <Progress value={savingsPercentage} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {savingsPercentage.toFixed(1)}% of your annual target achieved
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'contribution' ? 'bg-success/10' : 'bg-accent/10'
                      }`}>
                        {tx.type === 'contribution' ? (
                          <ArrowUpRight className="w-5 h-5 text-success" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground capitalize">{tx.type}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</p>
                      </div>
                      <span className={`font-semibold ${
                        tx.type === 'contribution' ? 'text-success' : 'text-foreground'
                      }`}>
                        {tx.type === 'contribution' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground">Your activity will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
