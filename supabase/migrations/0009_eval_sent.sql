-- Records when the finished monthly report was emailed to the parents.
alter table monthly_evaluations
  add column if not exists sent_at timestamptz,
  add column if not exists sent_to text[];
