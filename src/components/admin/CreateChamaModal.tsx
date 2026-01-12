import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users } from 'lucide-react';

const chamaSchema = z.object({
  name: z.string().min(3, 'Chama name must be at least 3 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
  contributionAmount: z.string().min(1, 'Contribution amount is required'),
  contributionFrequency: z.enum(['weekly', 'monthly', 'quarterly']),
});

type ChamaFormData = z.infer<typeof chamaSchema>;

interface CreateChamaModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function CreateChamaModal({ open, onClose, userId, onSuccess }: CreateChamaModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ChamaFormData>({
    resolver: zodResolver(chamaSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      contributionAmount: '',
      contributionFrequency: 'monthly',
    },
  });

  const handleSubmit = async (data: ChamaFormData) => {
    setIsLoading(true);

    try {
      // Create the chama
      const { data: chamaData, error: chamaError } = await supabase
        .from('chamas')
        .insert({
          name: data.name,
          description: data.description || null,
          location: data.location || null,
          contribution_amount: parseFloat(data.contributionAmount),
          contribution_frequency: data.contributionFrequency,
          created_by: userId,
        })
        .select()
        .single();

      if (chamaError) throw chamaError;

      // Add admin as chairperson member
      const { error: memberError } = await supabase
        .from('chama_members')
        .insert({
          chama_id: chamaData.id,
          user_id: userId,
          member_role: 'chairperson',
          status: 'active',
        });

      if (memberError) throw memberError;

      toast({
        title: 'Chama Created!',
        description: `${data.name} has been created successfully.`,
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create chama',
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
            <Users className="w-5 h-5 text-primary" />
            Create New Chama
          </DialogTitle>
          <DialogDescription>
            Set up a new savings group for members to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Chama Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Maendeleo Savings Group"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the chama..."
              {...form.register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Nairobi, Kenya"
              {...form.register('location')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contributionAmount">Contribution Amount (KES) *</Label>
              <Input
                id="contributionAmount"
                type="number"
                placeholder="1000"
                {...form.register('contributionAmount')}
              />
              {form.formState.errors.contributionAmount && (
                <p className="text-sm text-destructive">{form.formState.errors.contributionAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select
                value={form.watch('contributionFrequency')}
                onValueChange={(value: 'weekly' | 'monthly' | 'quarterly') => 
                  form.setValue('contributionFrequency', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Chama'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
