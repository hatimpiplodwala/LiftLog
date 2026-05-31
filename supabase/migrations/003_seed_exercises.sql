-- Seed default exercises (created_by = null means immutable seeded record)

insert into public.exercises (name, category, type, created_by) values
-- Chest
('Bench Press',           'chest',     'strength',   null),
('Incline Bench Press',   'chest',     'strength',   null),
('Push-Up',               'chest',     'bodyweight', null),
('Cable Fly',             'chest',     'strength',   null),
('Dip',                   'chest',     'bodyweight', null),
-- Back
('Pull-Up',               'back',      'bodyweight', null),
('Barbell Row',           'back',      'strength',   null),
('Lat Pulldown',          'back',      'strength',   null),
('Seated Cable Row',      'back',      'strength',   null),
('Deadlift',              'back',      'strength',   null),
-- Legs
('Squat',                 'legs',      'strength',   null),
('Romanian Deadlift',     'legs',      'strength',   null),
('Leg Press',             'legs',      'strength',   null),
('Leg Curl',              'legs',      'strength',   null),
('Calf Raise',            'legs',      'strength',   null),
('Lunges',                'legs',      'strength',   null),
-- Shoulders
('Overhead Press',        'shoulders', 'strength',   null),
('Lateral Raise',         'shoulders', 'strength',   null),
('Front Raise',           'shoulders', 'strength',   null),
('Face Pull',             'shoulders', 'strength',   null),
-- Arms
('Barbell Curl',          'arms',      'strength',   null),
('Hammer Curl',           'arms',      'strength',   null),
('Tricep Pushdown',       'arms',      'strength',   null),
('Skull Crusher',         'arms',      'strength',   null),
-- Core
('Plank',                 'core',      'bodyweight', null),
('Crunch',                'core',      'bodyweight', null),
('Hanging Leg Raise',     'core',      'bodyweight', null),
('Ab Wheel Rollout',      'core',      'bodyweight', null),
-- Cardio
('Running',               'cardio',    'cardio',     null),
('Cycling',               'cardio',    'cardio',     null),
('Jump Rope',             'cardio',    'cardio',     null)
on conflict do nothing;
