-- Expanded exercise seed. NOT EXISTS guard makes re-running safe and won't
-- touch user-created exercises that share a name.
-- Already seeded in 003 (excluded here):
--   Chest: Bench Press, Incline Bench Press, Push-Up, Cable Fly, Dip
--   Back:  Pull-Up, Barbell Row, Lat Pulldown, Seated Cable Row, Deadlift
--   Legs:  Squat, Romanian Deadlift, Leg Press, Leg Curl, Calf Raise, Lunges
--   Shoulders: Overhead Press, Lateral Raise, Front Raise, Face Pull
--   Arms:  Barbell Curl, Hammer Curl, Tricep Pushdown, Skull Crusher
--   Core:  Plank, Crunch, Hanging Leg Raise, Ab Wheel Rollout
--   Cardio: Running, Cycling, Jump Rope

insert into public.exercises (name, category, type, created_by)
select v.name, v.category::text, v.type::text, null
from (values

  -- ── CHEST ─────────────────────────────────────────────────────────────────
  -- Barbell
  ('Decline Bench Press',              'chest',     'strength'),
  ('Close-Grip Bench Press',           'chest',     'strength'),
  ('Spoto Press',                      'chest',     'strength'),
  ('Barbell Floor Press',              'chest',     'strength'),
  -- Dumbbell
  ('Dumbbell Bench Press',             'chest',     'strength'),
  ('Incline Dumbbell Press',           'chest',     'strength'),
  ('Decline Dumbbell Press',           'chest',     'strength'),
  ('Dumbbell Fly',                     'chest',     'strength'),
  ('Incline Dumbbell Fly',             'chest',     'strength'),
  ('Decline Dumbbell Fly',             'chest',     'strength'),
  -- Cable
  ('High Cable Fly',                   'chest',     'strength'),
  ('Low Cable Fly',                    'chest',     'strength'),
  ('Decline Cable Fly',                'chest',     'strength'),
  ('Cable Crossover',                  'chest',     'strength'),
  -- Machine
  ('Chest Press Machine',              'chest',     'strength'),
  ('Pec Deck Machine',                 'chest',     'strength'),
  ('Smith Machine Bench Press',        'chest',     'strength'),
  -- Bodyweight / Other
  ('Deficit Push-Up',                  'chest',     'bodyweight'),
  ('Archer Push-Up',                   'chest',     'bodyweight'),
  ('Landmine Press',                   'chest',     'strength'),

  -- ── BACK ──────────────────────────────────────────────────────────────────
  -- Barbell
  ('T-Bar Row',                        'back',      'strength'),
  ('Pendlay Row',                      'back',      'strength'),
  ('Meadows Row',                      'back',      'strength'),
  ('Rack Pull',                        'back',      'strength'),
  ('Good Morning',                     'back',      'strength'),
  ('Barbell Pullover',                 'back',      'strength'),
  ('Snatch-Grip Deadlift',             'back',      'strength'),
  ('Trap Bar Deadlift',                'back',      'strength'),
  ('Sumo Deadlift',                    'back',      'strength'),
  -- Dumbbell
  ('Dumbbell Row',                     'back',      'strength'),
  ('Chest-Supported Dumbbell Row',     'back',      'strength'),
  ('Incline Dumbbell Row',             'back',      'strength'),
  ('Dumbbell Pullover',                'back',      'strength'),
  -- Cable
  ('Single-Arm Cable Row',             'back',      'strength'),
  ('Wide-Grip Cable Row',              'back',      'strength'),
  ('High Cable Row',                   'back',      'strength'),
  ('Straight-Arm Pulldown',            'back',      'strength'),
  ('Cable Pullover',                   'back',      'strength'),
  ('Close-Grip Lat Pulldown',          'back',      'strength'),
  ('Wide-Grip Lat Pulldown',           'back',      'strength'),
  ('Underhand Lat Pulldown',           'back',      'strength'),
  -- Bodyweight / Other
  ('Chin-Up',                          'back',      'bodyweight'),
  ('Hyperextension',                   'back',      'bodyweight'),
  ('Inverted Row',                     'back',      'bodyweight'),

  -- ── LEGS ──────────────────────────────────────────────────────────────────
  -- Barbell
  ('Front Squat',                      'legs',      'strength'),
  ('Hack Squat',                       'legs',      'strength'),
  ('Zercher Squat',                    'legs',      'strength'),
  ('Barbell Hip Thrust',               'legs',      'strength'),
  ('Barbell Step-Up',                  'legs',      'strength'),
  ('Barbell Lunge',                    'legs',      'strength'),
  -- Dumbbell
  ('Goblet Squat',                     'legs',      'strength'),
  ('Dumbbell Romanian Deadlift',       'legs',      'strength'),
  ('Dumbbell Lunge',                   'legs',      'strength'),
  ('Dumbbell Step-Up',                 'legs',      'strength'),
  ('Dumbbell Hip Thrust',              'legs',      'strength'),
  ('Dumbbell Walking Lunge',           'legs',      'strength'),
  ('Dumbbell Sumo Squat',              'legs',      'strength'),
  -- Cable
  ('Cable Pull-Through',               'legs',      'strength'),
  ('Cable Hip Abduction',              'legs',      'strength'),
  ('Cable Hip Adduction',              'legs',      'strength'),
  ('Cable Kickback',                   'legs',      'strength'),
  -- Machine
  ('Leg Extension',                    'legs',      'strength'),
  ('Lying Leg Curl',                   'legs',      'strength'),
  ('Seated Leg Curl',                  'legs',      'strength'),
  ('Leg Abduction Machine',            'legs',      'strength'),
  ('Leg Adduction Machine',            'legs',      'strength'),
  ('Seated Calf Raise',                'legs',      'strength'),
  ('Hack Squat Machine',               'legs',      'strength'),
  ('Smith Machine Squat',              'legs',      'strength'),
  -- Bodyweight / Other
  ('Bulgarian Split Squat',            'legs',      'bodyweight'),
  ('Glute Bridge',                     'legs',      'bodyweight'),
  ('Box Jump',                         'legs',      'bodyweight'),
  ('Wall Sit',                         'legs',      'bodyweight'),
  ('Pistol Squat',                     'legs',      'bodyweight'),
  ('Walking Lunge',                    'legs',      'bodyweight'),
  ('Nordic Hamstring Curl',            'legs',      'bodyweight'),
  ('Jump Squat',                       'legs',      'bodyweight'),
  ('Step-Up',                          'legs',      'bodyweight'),
  ('Sled Push',                        'legs',      'strength'),
  ('Hip Thrust',                       'legs',      'strength'),

  -- ── SHOULDERS — FRONT DELT (anterior) ─────────────────────────────────────
  -- Barbell
  ('Push Press',                       'shoulders', 'strength'),
  ('Bradford Press',                   'shoulders', 'strength'),
  ('Behind-the-Neck Press',            'shoulders', 'strength'),
  -- Dumbbell
  ('Dumbbell Shoulder Press',          'shoulders', 'strength'),
  ('Seated Dumbbell Shoulder Press',   'shoulders', 'strength'),
  ('Arnold Press',                     'shoulders', 'strength'),
  ('Dumbbell Front Raise',             'shoulders', 'strength'),
  ('Alternating Dumbbell Press',       'shoulders', 'strength'),
  -- Cable
  ('Cable Front Raise',                'shoulders', 'strength'),

  -- ── SHOULDERS — SIDE DELT (lateral/medial) ────────────────────────────────
  -- Dumbbell
  ('Incline Lateral Raise',            'shoulders', 'strength'),
  ('Seated Lateral Raise',             'shoulders', 'strength'),
  ('Prone Y Raise',                    'shoulders', 'strength'),
  -- Cable
  ('Cable Lateral Raise',              'shoulders', 'strength'),
  ('Landmine Lateral Raise',           'shoulders', 'strength'),
  -- Machine
  ('Machine Lateral Raise',            'shoulders', 'strength'),

  -- ── SHOULDERS — REAR DELT (posterior) ────────────────────────────────────
  -- Dumbbell
  ('Rear Delt Fly',                    'shoulders', 'strength'),
  ('Bent-Over Lateral Raise',          'shoulders', 'strength'),
  ('Seated Rear Delt Fly',             'shoulders', 'strength'),
  -- Cable
  ('Cable Rear Delt Fly',              'shoulders', 'strength'),
  ('High Cable Rear Delt Fly',         'shoulders', 'strength'),
  -- Machine
  ('Reverse Pec Deck',                 'shoulders', 'strength'),

  -- ── SHOULDERS — GENERAL ───────────────────────────────────────────────────
  ('Barbell Shrug',                    'shoulders', 'strength'),
  ('Dumbbell Shrug',                   'shoulders', 'strength'),
  ('Upright Row',                      'shoulders', 'strength'),
  ('Dumbbell Upright Row',             'shoulders', 'strength'),
  ('Cable Upright Row',                'shoulders', 'strength'),
  ('Plate Front Raise',                'shoulders', 'strength'),
  ('Machine Shoulder Press',           'shoulders', 'strength'),

  -- ── ARMS — BICEPS ─────────────────────────────────────────────────────────
  -- Barbell
  ('EZ Bar Curl',                      'arms',      'strength'),
  ('Wide-Grip Barbell Curl',           'arms',      'strength'),
  ('Reverse Barbell Curl',             'arms',      'strength'),
  ('Preacher Curl',                    'arms',      'strength'),
  ('21s Curl',                         'arms',      'strength'),
  -- Dumbbell
  ('Incline Dumbbell Curl',            'arms',      'strength'),
  ('Concentration Curl',               'arms',      'strength'),
  ('Spider Curl',                      'arms',      'strength'),
  ('Zottman Curl',                     'arms',      'strength'),
  ('Alternating Dumbbell Curl',        'arms',      'strength'),
  ('Seated Dumbbell Curl',             'arms',      'strength'),
  -- Cable
  ('Cable Curl',                       'arms',      'strength'),
  ('High Cable Curl',                  'arms',      'strength'),
  ('Rope Hammer Curl',                 'arms',      'strength'),
  ('Single-Arm Cable Curl',            'arms',      'strength'),

  -- ── ARMS — TRICEPS ────────────────────────────────────────────────────────
  -- Barbell
  ('EZ Bar Skull Crusher',             'arms',      'strength'),
  ('Close-Grip Incline Press',         'arms',      'strength'),
  -- Dumbbell
  ('Overhead Dumbbell Tricep Extension', 'arms',    'strength'),
  ('Tricep Kickback',                  'arms',      'strength'),
  ('Dumbbell Tricep Extension',        'arms',      'strength'),
  -- Cable
  ('Rope Pushdown',                    'arms',      'strength'),
  ('Cable Overhead Tricep Extension',  'arms',      'strength'),
  ('Straight Bar Pushdown',            'arms',      'strength'),
  ('Reverse Grip Pushdown',            'arms',      'strength'),
  ('Single-Arm Tricep Pushdown',       'arms',      'strength'),
  -- Bodyweight
  ('Diamond Push-Up',                  'arms',      'bodyweight'),
  ('Close-Grip Push-Up',               'arms',      'bodyweight'),
  ('Tricep Dip',                       'arms',      'bodyweight'),

  -- ── ARMS — FOREARMS ───────────────────────────────────────────────────────
  ('Barbell Wrist Curl',               'arms',      'strength'),
  ('Barbell Reverse Wrist Curl',       'arms',      'strength'),
  ('Dumbbell Wrist Curl',              'arms',      'strength'),
  ('Dumbbell Reverse Wrist Curl',      'arms',      'strength'),
  ('Behind-the-Back Wrist Curl',       'arms',      'strength'),
  ('Cable Wrist Curl',                 'arms',      'strength'),
  ('Reverse Curl',                     'arms',      'strength'),
  ('Farmers Walk',                     'arms',      'strength'),
  ('Plate Pinch',                      'arms',      'strength'),
  ('Dead Hang',                        'arms',      'bodyweight'),
  ('Towel Pull-Up',                    'arms',      'bodyweight'),

  -- ── CORE ──────────────────────────────────────────────────────────────────
  ('Russian Twist',                    'core',      'bodyweight'),
  ('Decline Sit-Up',                   'core',      'bodyweight'),
  ('Bicycle Crunch',                   'core',      'bodyweight'),
  ('Side Plank',                       'core',      'bodyweight'),
  ('V-Up',                             'core',      'bodyweight'),
  ('Flutter Kicks',                    'core',      'bodyweight'),
  ('Leg Raise',                        'core',      'bodyweight'),
  ('Dead Bug',                         'core',      'bodyweight'),
  ('Mountain Climbers',                'core',      'bodyweight'),
  ('Dragon Flag',                      'core',      'bodyweight'),
  ('Hollow Body Hold',                 'core',      'bodyweight'),
  ('Toes to Bar',                      'core',      'bodyweight'),
  ('L-Sit',                            'core',      'bodyweight'),
  ('Cable Crunch',                     'core',      'strength'),
  ('Wood Chop',                        'core',      'strength'),
  ('Pallof Press',                     'core',      'strength'),
  ('Weighted Sit-Up',                  'core',      'strength'),
  ('Weighted Russian Twist',           'core',      'strength'),
  ('Cable Oblique Crunch',             'core',      'strength'),
  ('Landmine Twist',                   'core',      'strength'),

  -- ── CARDIO ────────────────────────────────────────────────────────────────
  ('Rowing Machine',                   'cardio',    'cardio'),
  ('Stair Climber',                    'cardio',    'cardio'),
  ('Elliptical',                       'cardio',    'cardio'),
  ('Swimming',                         'cardio',    'cardio'),
  ('Battle Ropes',                     'cardio',    'cardio'),
  ('Assault Bike',                     'cardio',    'cardio'),
  ('Walking',                          'cardio',    'cardio'),
  ('Sprints',                          'cardio',    'cardio'),
  ('Ski Erg',                          'cardio',    'cardio'),
  ('Sled Pull',                        'cardio',    'cardio'),
  ('Versa Climber',                    'cardio',    'cardio'),
  ('Burpees',                          'cardio',    'bodyweight'),
  ('High Knees',                       'cardio',    'bodyweight'),
  ('Box Step-Up Cardio',               'cardio',    'bodyweight')

) as v(name, category, type)
where not exists (
  select 1 from public.exercises e
  where e.name = v.name and e.created_by is null
);
