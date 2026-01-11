import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoanApplicationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  chamaId: string | null;
  maxLoanAmount: number;
  onSuccess: () => void;
}

export function LoanApplicationModal({
  open,
  onClose,
  userId,
  chamaId,
  maxLoanAmount,
  onSuccess,
}: LoanApplicationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const loanSchema = z.object({
    amount: z.number()
      .min(1000, 'Minimum loan amount is KES 1,000')
      .max(maxLoanAmount, `Maximum loan amount is KES ${maxLoanAmount.toLocaleString()}`),
    purpose: z.string().min(10, 'Please describe the purpose of the loan'),
    repaymentPeriod: z.number().min(1).max(24),
  });

  type LoanFormData = z.infer<typeof loanSchema>;

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      amount: Math.min(10000, maxLoanAmount),
      purpose: '',
      repaymentPeriod: 12,
    },
  });

  const handleSubmit = async (data: LoanFormData) => {
    if (!chamaId) {
      toast({
        title: 'Error',
        description: 'You must join a Chama first to apply for loans.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('loans')
        .insert({
          user_id: userId,
          chama_id: chamaId,
          amount: data.amount,
          purpose: data.purpose,
          repayment_period: data.repaymentPeriod,
          interest_rate: 10, // 10% default
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Application Submitted',
        description: 'Your loan application has been sent for approval.',
      });

      setTimeout(() => {
        onSuccess();
        onClose();
        setSubmitted(false);
        form.reset();
      }, 2000);
    } catch (error: any) {
      console.error('Loan application error:', error);
      toast({
        title: 'Application Failed',
        description: error.message || 'Failed to submit loan application.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Loan</DialogTitle>
          <DialogDescription>
            Request a loan from your Chama. Maximum loan based on your savings.
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your loan limit is <strong>{formatCurrency(maxLoanAmount)}</strong> (based on your savings)
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="amount">Loan Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                min={1000}
                max={maxLoanAmount}
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Loan</Label>
              <Textarea
                id="purpose"
                placeholder="Describe why you need this loan..."
                {...form.register('purpose')}
              />
              {form.formState.errors.purpose && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.purpose.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="repaymentPeriod">Repayment Period (months)</Label>
              <Input
                id="repaymentPeriod"
                type="number"
                min={1}
                max={24}
                {...form.register('repaymentPeriod', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Interest rate: 10% per annum
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-accent"
                disabled={isLoading || maxLoanAmount <= 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-success">Application Submitted!</h3>
            <p className="text-center text-muted-foreground">
              Your loan application is pending approval from the Chama admin.
              You will be notified once approved.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
