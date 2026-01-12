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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, Check } from 'lucide-react';

interface Chama {
  id: string;
  name: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  phone_number: string;
}

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberModal({ open, onClose, onSuccess }: AddMemberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedChama, setSelectedChama] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [memberRole, setMemberRole] = useState<'member' | 'treasurer' | 'secretary'>('member');
  const [existingMembers, setExistingMembers] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch chamas and profiles
  useEffect(() => {
    const fetchData = async () => {
      // Fetch chamas
      const { data: chamasData } = await supabase
        .from('chamas')
        .select('id, name')
        .eq('status', 'active');

      if (chamasData) {
        setChamas(chamasData);
      }

      // Fetch all profiles (admin can see all)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone_number');

      if (profilesData) {
        setProfiles(profilesData);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  // Fetch existing members when chama is selected
  useEffect(() => {
    const fetchExistingMembers = async () => {
      if (!selectedChama) return;

      const { data } = await supabase
        .from('chama_members')
        .select('user_id')
        .eq('chama_id', selectedChama);

      if (data) {
        setExistingMembers(data.map(m => m.user_id));
      }
    };

    fetchExistingMembers();
  }, [selectedChama]);

  const availableProfiles = profiles.filter(
    p => !existingMembers.includes(p.user_id)
  );

  const handleSubmit = async () => {
    if (!selectedChama || !selectedUser) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a chama and a member',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('chama_members')
        .insert({
          chama_id: selectedChama,
          user_id: selectedUser,
          member_role: memberRole,
          status: 'active',
        });

      if (error) throw error;

      const selectedProfile = profiles.find(p => p.user_id === selectedUser);
      
      toast({
        title: 'Member Added!',
        description: `${selectedProfile?.full_name || 'Member'} has been added to the chama.`,
      });

      setSelectedChama('');
      setSelectedUser('');
      setMemberRole('member');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add Member to Chama
          </DialogTitle>
          <DialogDescription>
            Select a registered user to add them to a chama.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Chama *</Label>
            <Select value={selectedChama} onValueChange={setSelectedChama}>
              <SelectTrigger>
                <SelectValue placeholder="Select a chama" />
              </SelectTrigger>
              <SelectContent>
                {chamas.map((chama) => (
                  <SelectItem key={chama.id} value={chama.id}>
                    {chama.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Member *</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser} disabled={!selectedChama}>
              <SelectTrigger>
                <SelectValue placeholder={selectedChama ? "Select a member" : "Select a chama first"} />
              </SelectTrigger>
              <SelectContent>
                {availableProfiles.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No available members
                  </SelectItem>
                ) : (
                  availableProfiles.map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      {profile.full_name} ({profile.phone_number})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedChama && availableProfiles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All registered users are already members of this chama.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Member Role *</Label>
            <Select value={memberRole} onValueChange={(v: 'member' | 'treasurer' | 'secretary') => setMemberRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="treasurer">Treasurer</SelectItem>
                <SelectItem value="secretary">Secretary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={isLoading || !selectedChama || !selectedUser}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
