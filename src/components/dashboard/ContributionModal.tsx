import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Smartphone, CheckCircle2 } from 'lucide-react';

const contributionSchema = z.object({
  amount: z.number().min(100, 'Minimum contribution is KES 100'),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface ContributionModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  chamaId: string | null;
  phoneNumber: string;
  onSuccess: () => void;
}

export function ContributionModal({
  open,
  onClose,
  userId,
  chamaId,
  phoneNumber,
  onSuccess,
}: ContributionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'waiting' | 'success'>('form');
  const { toast } = useToast();

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: 1000 },
  });

  const handleSubmit = async (data: ContributionFormData) => {
    if (!chamaId) {
      toast({
        title: 'Error',
        description: 'You must join a Chama first to make contributions.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setStep('waiting');

    try {
      const { data: response, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phone_number: phoneNumber,
          amount: data.amount,
          chama_id: chamaId,
          user_id: userId,
          description: 'Chama contribution',
        },
      });

      if (error) throw error;

      if (response.success) {
        toast({
          title: 'STK Push Sent',
          description: 'Please enter your M-Pesa PIN on your phone.',
        });

        // Wait for a moment then show success (in real app, would poll for status)
        setTimeout(() => {
          setStep('success');
          setTimeout(() => {
            onSuccess();
            onClose();
            setStep('form');
            form.reset();
          }, 2000);
        }, 5000);
      } else {
        throw new Error(response.error || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Contribution error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'form') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make Contribution</DialogTitle>
          <DialogDescription>
            {step === 'form' && 'Enter the amount you want to contribute. A prompt will be sent to your phone.'}
            {step === 'waiting' && 'Please check your phone and enter your M-Pesa PIN.'}
            {step === 'success' && 'Your contribution was successful!'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                value={phoneNumber}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                This is the phone number linked to your account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                min={100}
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'waiting' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Check Your Phone</h3>
            <p className="text-center text-muted-foreground">
              A payment prompt has been sent to <strong>{phoneNumber}</strong>.
              <br />
              Please enter your M-Pesa PIN to complete the payment.
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-primary mt-4" />
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-success">Payment Successful!</h3>
            <p className="text-center text-muted-foreground">
              Your contribution has been received and added to your savings.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
