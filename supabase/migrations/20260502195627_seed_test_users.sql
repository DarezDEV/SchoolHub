-- Seed 4 test users (one per role) in Supabase Auth and app tables.
DO $$
DECLARE
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
  v_director_id uuid := gen_random_uuid();
  v_coordinator_id uuid := gen_random_uuid();
  v_teacher_id uuid := gen_random_uuid();
  v_student_id uuid := gen_random_uuid();
BEGIN
  -- Remove previous test users if they exist.
  DELETE FROM auth.identities
  WHERE user_id IN (
    SELECT id
    FROM auth.users
    WHERE email IN (
      'director@schoolhub.dev',
      'coordinator@schoolhub.dev',
      'teacher@schoolhub.dev',
      'student@schoolhub.dev'
    )
  );

  DELETE FROM auth.users
  WHERE email IN (
    'director@schoolhub.dev',
    'coordinator@schoolhub.dev',
    'teacher@schoolhub.dev',
    'student@schoolhub.dev'
  );

  -- Create auth users.
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES
    (
      v_instance_id,
      v_director_id,
      'authenticated',
      'authenticated',
      'director@schoolhub.dev',
      extensions.crypt('Director123!', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Demo","last_name":"Director"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      v_instance_id,
      v_coordinator_id,
      'authenticated',
      'authenticated',
      'coordinator@schoolhub.dev',
      extensions.crypt('Coordinator123!', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Demo","last_name":"Coordinator"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      v_instance_id,
      v_teacher_id,
      'authenticated',
      'authenticated',
      'teacher@schoolhub.dev',
      extensions.crypt('Teacher123!', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Demo","last_name":"Teacher"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      v_instance_id,
      v_student_id,
      'authenticated',
      'authenticated',
      'student@schoolhub.dev',
      extensions.crypt('Student123!', extensions.gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Demo","last_name":"Student"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

  -- Create email identities.
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (
      gen_random_uuid(),
      v_director_id,
      format('{"sub":"%s","email":"%s"}', v_director_id::text, 'director@schoolhub.dev')::jsonb,
      'email',
      v_director_id::text,
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      v_coordinator_id,
      format('{"sub":"%s","email":"%s"}', v_coordinator_id::text, 'coordinator@schoolhub.dev')::jsonb,
      'email',
      v_coordinator_id::text,
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      v_teacher_id,
      format('{"sub":"%s","email":"%s"}', v_teacher_id::text, 'teacher@schoolhub.dev')::jsonb,
      'email',
      v_teacher_id::text,
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      v_student_id,
      format('{"sub":"%s","email":"%s"}', v_student_id::text, 'student@schoolhub.dev')::jsonb,
      'email',
      v_student_id::text,
      now(),
      now(),
      now()
    );

  -- Ensure profiles exist.
  INSERT INTO public.profiles (id, name, last_name, email, active)
  VALUES
    (v_director_id, 'Demo', 'Director', 'director@schoolhub.dev', true),
    (v_coordinator_id, 'Demo', 'Coordinator', 'coordinator@schoolhub.dev', true),
    (v_teacher_id, 'Demo', 'Teacher', 'teacher@schoolhub.dev', true),
    (v_student_id, 'Demo', 'Student', 'student@schoolhub.dev', true)
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    active = EXCLUDED.active;

  -- Assign each user one role.
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES
    (v_director_id, (SELECT id FROM public.roles WHERE name = 'director')),
    (v_coordinator_id, (SELECT id FROM public.roles WHERE name = 'coordinator')),
    (v_teacher_id, (SELECT id FROM public.roles WHERE name = 'teacher')),
    (v_student_id, (SELECT id FROM public.roles WHERE name = 'student'))
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;
