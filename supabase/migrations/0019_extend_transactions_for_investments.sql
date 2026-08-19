-- Extends 0005's transactions table with a 4th type: 'investment'. Reuses
-- the exact same row shape 'transfer' already has (account_id +
-- destination_account_id, no category_id) — an investment transaction IS
-- an account-to-account movement, just one where the destination is
-- specifically an investment account and the money is never counted as
-- income or expense. This is additive only: existing income/expense/
-- transfer rows and behavior are completely unchanged, and this migration
-- never edits 0005's file, only supersedes its function/constraints via
-- create-or-replace / drop-and-recreate, the normal way to evolve a
-- constraint across migrations.

alter table public.transactions drop constraint transactions_type_supported;
alter table public.transactions add constraint transactions_type_supported
  check (type in ('income', 'expense', 'transfer', 'investment'));

alter table public.transactions drop constraint transactions_type_shape;
alter table public.transactions add constraint transactions_type_shape check (
  (type in ('income', 'expense') and category_id is not null and destination_account_id is null)
  or
  (type in ('transfer', 'investment') and category_id is null and destination_account_id is not null)
);

-- Adds one rule on top of 0005's validate_transaction(): when type =
-- 'investment', the destination account must itself be an investment-type
-- account (0003's accounts.type = 'investment') — you can't "invest into"
-- a bank or cash account. Everything else (ownership, currency matching,
-- category validation) is unchanged from 0005.
create or replace function public.validate_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  account_owner uuid;
  account_currency text;
  destination_owner uuid;
  destination_currency text;
  destination_type text;
  category_owner uuid;
  category_type text;
begin
  select user_id, currency into account_owner, account_currency
  from public.accounts where id = new.account_id;

  if account_owner is null or account_owner <> auth.uid() then
    raise exception 'Account not found';
  end if;

  if new.destination_account_id is not null then
    select user_id, currency, type into destination_owner, destination_currency, destination_type
    from public.accounts where id = new.destination_account_id;

    if destination_owner is null or destination_owner <> auth.uid() then
      raise exception 'Destination account not found';
    end if;

    if destination_currency <> account_currency then
      raise exception 'Cannot transfer between accounts with different currencies';
    end if;

    if new.type = 'investment' and destination_type <> 'investment' then
      raise exception 'Destination account must be an investment account';
    end if;
  end if;

  if new.category_id is not null then
    select user_id, type into category_owner, category_type
    from public.categories where id = new.category_id;

    if category_owner is null or category_owner <> auth.uid() then
      raise exception 'Category not found';
    end if;

    if category_type <> new.type then
      raise exception 'Category type does not match transaction type';
    end if;
  end if;

  return new;
end;
$$;
