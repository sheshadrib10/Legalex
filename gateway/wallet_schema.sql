-- User virtual wallet table for token-metering
CREATE TABLE IF NOT EXISTS public.user_wallets (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    virtual_api_key VARCHAR(64) UNIQUE NOT NULL,
    balance_usd NUMERIC(12, 6) NOT NULL DEFAULT 0.000000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction audit ledger for 5x token accounting
CREATE TABLE IF NOT EXISTS public.usage_ledger (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.user_wallets(user_id),
    prompt_tokens INT NOT NULL,
    cached_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    actual_cost_usd NUMERIC(12, 6) NOT NULL,
    charged_amount_usd NUMERIC(12, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atomic balance deduction function
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
    p_virtual_key VARCHAR,
    p_charge_usd NUMERIC,
    p_prompt_tokens INT,
    p_cached_tokens INT,
    p_completion_tokens INT,
    p_actual_cost NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT user_id INTO v_user_id
    FROM public.user_wallets
    WHERE virtual_api_key = p_virtual_key AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE public.user_wallets
    SET balance_usd = balance_usd - p_charge_usd
    WHERE user_id = v_user_id;

    INSERT INTO public.usage_ledger (
        user_id, prompt_tokens, cached_tokens, completion_tokens, actual_cost_usd, charged_amount_usd
    ) VALUES (
        v_user_id, p_prompt_tokens, p_cached_tokens, p_completion_tokens, p_actual_cost, p_charge_usd
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
