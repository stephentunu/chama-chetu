import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, MapPin, Calendar, Coins } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Chama {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  contribution_amount: number;
  contribution_frequency: string;
}

interface JoinChamaModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function JoinChamaModal({ open, onClose, userId, onSuccess }: JoinChamaModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [joinedChamaIds, setJoinedChamaIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchChamas();
    }
  }, [open, userId]);

  const fetchChamas = async () => {
    setIsLoading(true);
    try {
      // Fetch all active chamas
      const { data: chamasData, error: chamasError } = await supabase
        .from('chamas')
        .select('id, name, description, location, contribution_amount, contribution_frequency')
        .eq('status', 'active');

      if (chamasError) throw chamasError;
      setChamas(chamasData || []);

      // Fetch user's current memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('chama_members')
        .select('chama_id')
        .eq('user_id', userId);

      if (membershipsError) throw membershipsError;
      setJoinedChamaIds(memberships?.map(m => m.chama_id) || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load chamas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChama = async (chamaId: string) => {
    setJoiningId(chamaId);
    try {
      const { error } = await supabase
        .from('chama_members')
        .insert({
          chama_id: chamaId,
          user_id: userId,
          member_role: 'member',
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'You have joined the chama successfully.',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join chama',
        variant: 'destructive',
      });
    } finally {
      setJoiningId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const availableChamas = chamas.filter(c => !joinedChamaIds.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Join a Chama
          </DialogTitle>
          <DialogDescription>
            Browse available savings groups and join one to start contributing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : availableChamas.length > 0 ? (
            availableChamas.map((chama) => (
              <Card key={chama.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{chama.name}</CardTitle>
                      {chama.location && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {chama.location}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {chama.contribution_frequency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {chama.description && (
                    <p className="text-sm text-muted-foreground mb-3">{chama.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Coins className="w-4 h-4" />
                        {formatCurrency(Number(chama.contribution_amount))}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {chama.contribution_frequency}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinChama(chama.id)}
                      disabled={joiningId === chama.id}
                    >
                      {joiningId === chama.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No chamas available to join</p>
              <p className="text-sm text-muted-foreground">
                {joinedChamaIds.length > 0 
                  ? "You've already joined all available chamas."
                  : "Check back later for new savings groups."}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
