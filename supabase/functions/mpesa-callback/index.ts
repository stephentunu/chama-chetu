import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find the transaction by checkout request ID
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_ref', CheckoutRequestID)
      .single();

    if (findError || !transaction) {
      console.error('Transaction not found:', CheckoutRequestID);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (ResultCode === 0) {
      // Payment successful
      let mpesaReceiptNumber = '';
      let amount = transaction.amount;

      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') {
            mpesaReceiptNumber = item.Value;
          }
          if (item.Name === 'Amount') {
            amount = item.Value;
          }
        }
      }

      // Update transaction to completed
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          mpesa_ref: mpesaReceiptNumber || CheckoutRequestID,
        })
        .eq('id', transaction.id);

      // Create contribution record
      await supabase
        .from('contributions')
        .insert({
          user_id: transaction.user_id,
          chama_id: transaction.chama_id,
          amount: amount,
          status: 'completed',
          payment_method: 'mpesa',
          transaction_ref: mpesaReceiptNumber || CheckoutRequestID,
        });

      console.log('Payment processed successfully:', mpesaReceiptNumber);
    } else {
      // Payment failed
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
          description: `${transaction.description} - Failed: ${ResultDesc}`,
        })
        .eq('id', transaction.id);

      console.log('Payment failed:', ResultDesc);
    }

    // Return success to M-Pesa
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Callback processing error:', error);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
