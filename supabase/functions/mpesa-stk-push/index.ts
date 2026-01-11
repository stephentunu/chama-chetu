import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface STKPushRequest {
  phone_number: string;
  amount: number;
  chama_id: string;
  user_id: string;
  description?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone_number, amount, chama_id, user_id, description } = await req.json() as STKPushRequest;

    // Validate inputs
    if (!phone_number || !amount || !chama_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number to 254 format
    let formattedPhone = phone_number.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+254')) {
      formattedPhone = formattedPhone.substring(1);
    }

    // Get M-Pesa credentials
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
    const shortcode = Deno.env.get('MPESA_SHORTCODE');
    const passkey = Deno.env.get('MPESA_PASSKEY');

    if (!consumerKey || !consumerSecret || !shortcode || !passkey) {
      console.error('M-Pesa credentials not configured');
      return new Response(
        JSON.stringify({ error: 'M-Pesa integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate access token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      console.error('Failed to get M-Pesa access token');
      return new Response(
        JSON.stringify({ error: 'Failed to authenticate with M-Pesa' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Generate timestamp and password
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Get callback URL from Supabase project
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`;

    // Create transaction record first
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        chama_id,
        amount,
        type: 'contribution',
        status: 'pending',
        phone_number: formattedPhone,
        description: description || 'Chama contribution',
      })
      .select()
      .single();

    if (txError) {
      console.error('Failed to create transaction:', txError);
      return new Response(
        JSON.stringify({ error: 'Failed to initiate transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initiate STK Push
    const stkResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(amount),
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: transaction.id.substring(0, 12),
          TransactionDesc: description || 'Chama Contribution',
        }),
      }
    );

    const stkData = await stkResponse.json();
    console.log('STK Push Response:', stkData);

    if (stkData.ResponseCode === '0') {
      // Update transaction with checkout request ID
      await supabase
        .from('transactions')
        .update({ mpesa_ref: stkData.CheckoutRequestID })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent. Please enter your M-Pesa PIN.',
          transaction_id: transaction.id,
          checkout_request_id: stkData.CheckoutRequestID,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || 'STK Push failed',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('STK Push error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
