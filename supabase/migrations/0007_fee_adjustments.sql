-- Per-child fee details entered by the branch manager after registration:
-- registration / medical / uniform amounts (left open on the parent form),
-- plus a discount or offer. Parents can read their own row (existing policy);
-- writes happen only through the branch-admin edge function.
alter table portal_registrations
  add column if not exists fee_adjustments jsonb;
