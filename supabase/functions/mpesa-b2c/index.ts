import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface B2CRequest {
  loan_id: string;
  phone_number: string;
  amount: number;
  user_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { loan_id, phone_number, amount, user_id } = await req.json() as B2CRequest;

    // Validate inputs
    if (!loan_id || !phone_number || !amount || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number
    let formattedPhone = phone_number.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Get M-Pesa credentials
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');

    if (!consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ error: 'M-Pesa integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For sandbox/demo, we'll simulate a successful disbursement
    // In production, you would call the actual B2C API
    console.log(`Simulating B2C disbursement of KES ${amount} to ${formattedPhone}`);

    // Update loan status to disbursed
    const { error: loanError } = await supabase
      .from('loans')
      .update({
        status: 'disbursed',
        disbursed_at: new Date().toISOString(),
      })
      .eq('id', loan_id);

    if (loanError) {
      console.error('Failed to update loan:', loanError);
      return new Response(
        JSON.stringify({ error: 'Failed to update loan status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create disbursement transaction record
    const { data: loan } = await supabase
      .from('loans')
      .select('chama_id')
      .eq('id', loan_id)
      .single();

    await supabase
      .from('transactions')
      .insert({
        user_id,
        chama_id: loan?.chama_id,
        amount,
        type: 'loan_disbursement',
        status: 'completed',
        phone_number: formattedPhone,
        description: 'Loan disbursement',
        mpesa_ref: `SIM${Date.now()}`, // Simulated reference
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan disbursed successfully. Check your M-Pesa for the funds.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('B2C error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
