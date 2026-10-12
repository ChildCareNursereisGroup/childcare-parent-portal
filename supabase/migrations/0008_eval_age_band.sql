-- The monthly evaluation is now skill-based: ratings holds { skillId: level 1-5 },
-- and age_band records which developmental stage's skills were assessed.
alter table monthly_evaluations add column if not exists age_band text;
