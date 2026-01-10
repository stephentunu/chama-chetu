-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    national_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create chamas table
CREATE TABLE public.chamas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE,
    description TEXT,
    location TEXT,
    contribution_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    contribution_frequency TEXT NOT NULL DEFAULT 'monthly',
    status TEXT NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chamas
ALTER TABLE public.chamas ENABLE ROW LEVEL SECURITY;

-- Create chama_members table
CREATE TABLE public.chama_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chama_id UUID REFERENCES public.chamas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    member_role TEXT NOT NULL DEFAULT 'member',
    join_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE (chama_id, user_id)
);

-- Enable RLS on chama_members
ALTER TABLE public.chama_members ENABLE ROW LEVEL SECURITY;

-- Create contributions table
CREATE TABLE public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chama_id UUID REFERENCES public.chamas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    transaction_ref TEXT,
    payment_method TEXT DEFAULT 'mpesa',
    status TEXT NOT NULL DEFAULT 'pending',
    contribution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contributions
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Create loans table
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chama_id UUID REFERENCES public.chamas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    purpose TEXT,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    repayment_period INTEGER NOT NULL DEFAULT 12,
    status TEXT NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    disbursed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on loans
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Create transactions table for M-Pesa records
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    chama_id UUID REFERENCES public.chamas(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    phone_number TEXT,
    mpesa_ref TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'phone_number', '')
    );
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member');
    
    RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chamas_updated_at
    BEFORE UPDATE ON public.chamas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for chamas
CREATE POLICY "Members can view their chamas"
    ON public.chamas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chama_members
            WHERE chama_members.chama_id = chamas.id
            AND chama_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create chamas"
    ON public.chamas FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Chama admins can update chamas"
    ON public.chamas FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.chama_members
            WHERE chama_members.chama_id = chamas.id
            AND chama_members.user_id = auth.uid()
            AND chama_members.member_role IN ('chairperson', 'treasurer', 'secretary')
        )
    );

-- RLS Policies for chama_members
CREATE POLICY "Members can view chama members"
    ON public.chama_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chama_members cm
            WHERE cm.chama_id = chama_members.chama_id
            AND cm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join chamas"
    ON public.chama_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for contributions
CREATE POLICY "Users can view their own contributions"
    ON public.contributions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contributions"
    ON public.contributions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loans
CREATE POLICY "Users can view their own loans"
    ON public.loans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can apply for loans"
    ON public.loans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);