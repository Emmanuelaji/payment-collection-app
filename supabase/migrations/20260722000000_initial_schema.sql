-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'collector'
        CHECK (role IN ('admin', 'collector')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT UNIQUE NOT NULL
        DEFAULT 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6)),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    customer_name TEXT,
    customer_phone TEXT,
    description TEXT,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'paid'
        CHECK (status IN ('paid', 'voided')),
    created_by UUID NOT NULL REFERENCES profiles(id),   -- FK references profiles now
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS payments_created_at_idx ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS payments_transaction_id_idx ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS payments_created_by_idx ON payments(created_by);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_customer_phone_idx ON payments(customer_phone);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payments_modtime ON payments;
CREATE TRIGGER update_payments_modtime
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Audit trigger for payments
CREATE OR REPLACE FUNCTION log_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
        VALUES (NEW.created_by, 'PAYMENT_CREATED', 'payment', NEW.transaction_id,
                jsonb_build_object('amount', NEW.amount, 'customer_name', NEW.customer_name));
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'voided' AND OLD.status = 'paid' THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
        VALUES (auth.uid(), 'PAYMENT_VOIDED', 'payment', NEW.transaction_id,
                jsonb_build_object('amount', NEW.amount));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS payments_audit ON payments;
CREATE TRIGGER payments_audit
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_changes();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read of all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Insert profile via trigger on auth.users creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'collector');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Payments RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Insert policy: any authenticated user (collector or admin) can create payments
CREATE POLICY "Authenticated users can insert payments"
    ON payments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Select policy: collectors see their own records; admins see all
CREATE POLICY "Collectors see own payments, admins see all"
    ON payments FOR SELECT
    TO authenticated
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        OR created_by = auth.uid()
    );

-- Update policy: only admins can void a paid payment
CREATE POLICY "Admins can void payments"
    ON payments FOR UPDATE
    TO authenticated
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        AND status = 'paid'
    )
    WITH CHECK (status = 'voided');

-- No delete allowed
CREATE POLICY "No deletion of payments"
    ON payments FOR DELETE
    TO authenticated
    USING (false);

-- Audit logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can see all audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');