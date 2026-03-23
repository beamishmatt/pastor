-- 004_reading_plans.sql
-- Intelligent reading plans: tables + seed data

-- ─── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_days INT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  books TEXT[] DEFAULT '{}',
  themes TEXT[] DEFAULT '{}',
  is_pro BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plan_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  title TEXT NOT NULL,
  passage_ref TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INT NOT NULL,
  verse_start INT,
  verse_end INT,
  reflection_prompt TEXT,
  UNIQUE(plan_id, day_number)
);

CREATE TABLE plan_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ,
  current_day INT DEFAULT 1,
  UNIQUE(user_id, plan_id)
);

CREATE TABLE plan_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES plan_enrollments(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(enrollment_id, day_number)
);

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_plans_read" ON reading_plans FOR SELECT USING (true);
CREATE POLICY "public_plan_readings_read" ON plan_readings FOR SELECT USING (true);

CREATE POLICY "users_own_enrollments" ON plan_enrollments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_completions" ON plan_completions
  FOR ALL USING (
    enrollment_id IN (
      SELECT id FROM plan_enrollments WHERE user_id = auth.uid()
    )
  );

-- ─── Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX idx_plan_readings_plan_id ON plan_readings(plan_id);
CREATE INDEX idx_plan_enrollments_user_id ON plan_enrollments(user_id);
CREATE INDEX idx_plan_completions_enrollment_id ON plan_completions(enrollment_id);

-- ─── Seed: Plans ───────────────────────────────────────────────────────────

INSERT INTO reading_plans (id, slug, title, description, duration_days, tags, books, themes, is_pro) VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'prayer-praise',
    'Prayer & Praise',
    'Seven days of prayer-focused passages to deepen your devotional life and quiet your soul before God.',
    7,
    ARRAY['prayer', 'worship', 'praise', 'devotion', 'beginner']::TEXT[],
    ARRAY['Psalms', 'Matthew', 'Philippians', 'James']::TEXT[],
    ARRAY['prayer', 'worship', 'praise', 'gratitude', 'thanksgiving']::TEXT[],
    false
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'nt-30',
    'New Testament in 30 Days',
    'Read through the entire New Testament with daily passages and guided reflection.',
    30,
    ARRAY['new testament', 'survey', 'discipleship', 'beginner', 'faith']::TEXT[],
    ARRAY['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', 'Hebrews', 'James', 'Revelation']::TEXT[],
    ARRAY['gospel', 'discipleship', 'grace', 'faith', 'salvation']::TEXT[],
    false
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'life-of-jesus',
    'The Life of Jesus',
    'A harmony of the Gospels following Jesus from birth to resurrection and ascension.',
    21,
    ARRAY['jesus', 'gospels', 'resurrection', 'incarnation', 'faith']::TEXT[],
    ARRAY['Luke', 'Matthew', 'Mark', 'John', 'Acts']::TEXT[],
    ARRAY['incarnation', 'salvation', 'grace', 'resurrection', 'discipleship', 'kingdom', 'love']::TEXT[],
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'romans-deep-dive',
    'Romans Deep Dive',
    'Verse-by-verse through Paul''s masterwork on grace, faith, and the power of the gospel.',
    14,
    ARRAY['romans', 'theology', 'grace', 'justification', 'deep study', 'paul']::TEXT[],
    ARRAY['Romans']::TEXT[],
    ARRAY['grace', 'justification', 'salvation', 'faith', 'righteousness', 'sanctification', 'sin']::TEXT[],
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'psalms-proverbs',
    'Psalms & Proverbs',
    'Sixty days of daily wisdom and worship — pairing Israel''s greatest poetry with her wisest counsel.',
    60,
    ARRAY['wisdom', 'psalms', 'proverbs', 'devotion', 'praise', 'lament']::TEXT[],
    ARRAY['Psalms', 'Proverbs']::TEXT[],
    ARRAY['worship', 'wisdom', 'prayer', 'praise', 'trust', 'lament', 'gratitude']::TEXT[],
    true
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'ot-survey',
    'Old Testament Survey',
    'Walk through the major narratives, prophets, and poetry of the Old Testament over 90 days.',
    90,
    ARRAY['old testament', 'survey', 'covenant', 'history', 'creation', 'prophecy']::TEXT[],
    ARRAY['Genesis', 'Exodus', 'Psalms', 'Isaiah', 'Jeremiah', 'Daniel', 'Ruth', 'Job']::TEXT[],
    ARRAY['covenant', 'faith', 'creation', 'redemption', 'prophecy', 'salvation history']::TEXT[],
    true
  );

-- ─── Seed: Prayer & Praise (7 days) ───────────────────────────────────────

INSERT INTO plan_readings (plan_id, day_number, title, passage_ref, book, chapter, verse_start, verse_end, reflection_prompt) VALUES
  ('a1000000-0000-0000-0000-000000000001', 1,  'The Lord Is My Shepherd',       'Psalm 23',           'Psalms',      23,  NULL, NULL, 'How does knowing God as your shepherd change the way you face today''s uncertainties?'),
  ('a1000000-0000-0000-0000-000000000001', 2,  'Teach Us to Pray',              'Matthew 6:5–15',     'Matthew',      6,   5,   15, 'Which phrase from the Lord''s Prayer speaks most to where you are today?'),
  ('a1000000-0000-0000-0000-000000000001', 3,  'God Is Our Refuge',             'Psalm 46',           'Psalms',      46,  NULL, NULL, 'What does it look like for you to ''be still and know that He is God'' in the busyness of your life?'),
  ('a1000000-0000-0000-0000-000000000001', 4,  'Rejoice in the Lord Always',    'Philippians 4:4–8',  'Philippians',  4,   4,    8, 'What are three specific things you can thank God for right now, even in a difficult season?'),
  ('a1000000-0000-0000-0000-000000000001', 5,  'Create in Me a Clean Heart',    'Psalm 51',           'Psalms',      51,  NULL, NULL, 'Is there anything weighing on your heart that you need to bring honestly before God today?'),
  ('a1000000-0000-0000-0000-000000000001', 6,  'The Prayer of Faith',           'James 5:13–18',      'James',        5,  13,   18, 'Who in your life needs your prayers right now? What would it look like to pray fervently for them this week?'),
  ('a1000000-0000-0000-0000-000000000001', 7,  'Let Everything Praise the Lord', 'Psalm 150',         'Psalms',     150,  NULL, NULL, 'What would it look like for your whole life — not just moments of prayer — to become an act of praise?');

-- ─── Seed: New Testament in 30 Days ───────────────────────────────────────

INSERT INTO plan_readings (plan_id, day_number, title, passage_ref, book, chapter, verse_start, verse_end, reflection_prompt) VALUES
  ('a1000000-0000-0000-0000-000000000002',  1, 'The King Has Come',           'Matthew 1–4',        'Matthew',   1, NULL, NULL, 'What does Jesus'' baptism and temptation reveal about his identity and mission?'),
  ('a1000000-0000-0000-0000-000000000002',  2, 'The Sermon on the Mount',     'Matthew 5–7',        'Matthew',   5, NULL, NULL, 'Which beatitude speaks most to where you are in life right now?'),
  ('a1000000-0000-0000-0000-000000000002',  3, 'Faith and Authority',         'Matthew 8–11',       'Matthew',   8, NULL, NULL, 'What do Jesus'' miracles tell you about who he is and what he cares about?'),
  ('a1000000-0000-0000-0000-000000000002',  4, 'Who Is This Jesus?',          'Matthew 12–16',      'Matthew',  12, NULL, NULL, 'How does Peter''s confession — ''You are the Messiah'' — challenge you to answer the same question today?'),
  ('a1000000-0000-0000-0000-000000000002',  5, 'On the Way to Jerusalem',     'Matthew 17–20',      'Matthew',  17, NULL, NULL, 'What does it mean to ''deny yourself and take up your cross'' in your everyday life?'),
  ('a1000000-0000-0000-0000-000000000002',  6, 'The Coming Kingdom',          'Matthew 21–25',      'Matthew',  25, NULL, NULL, 'How does the parable of the ten virgins challenge you to be alert and prepared?'),
  ('a1000000-0000-0000-0000-000000000002',  7, 'Death and Resurrection',      'Matthew 26–28',      'Matthew',  28, NULL, NULL, 'What does the resurrection mean for your everyday life — not just your future, but your right now?'),
  ('a1000000-0000-0000-0000-000000000002',  8, 'The Servant Who Heals',       'Mark 1–5',           'Mark',      1, NULL, NULL, 'What strikes you about the urgency and authority with which Jesus moves through Mark''s Gospel?'),
  ('a1000000-0000-0000-0000-000000000002',  9, 'Who Can This Be?',            'Mark 6–10',          'Mark',      8, NULL, NULL, 'What does it mean to follow Jesus ''on the way'' — even when the path leads somewhere difficult?'),
  ('a1000000-0000-0000-0000-000000000002', 10, 'The Servant Who Dies',        'Mark 11–16',         'Mark',     15, NULL, NULL, 'As you read the crucifixion in Mark, what moves you most deeply?'),
  ('a1000000-0000-0000-0000-000000000002', 11, 'The Savior of All People',    'Luke 1–4',           'Luke',      2, NULL, NULL, 'How does the angels'' announcement — ''peace on earth, goodwill toward men'' — apply to your world today?'),
  ('a1000000-0000-0000-0000-000000000002', 12, 'The Kingdom Breaks In',       'Luke 5–9',           'Luke',      6, NULL, NULL, 'How does Jesus'' love for the poor, the sick, and the outcast challenge your own values?'),
  ('a1000000-0000-0000-0000-000000000002', 13, 'What the Kingdom Looks Like', 'Luke 10–14',         'Luke',     10, NULL, NULL, 'Who is your neighbor, and how is God calling you to love them?'),
  ('a1000000-0000-0000-0000-000000000002', 14, 'Lost and Found',              'Luke 15–19',         'Luke',     15, NULL, NULL, 'Which of the three lost parables resonates most with your own experience of God''s love?'),
  ('a1000000-0000-0000-0000-000000000002', 15, 'The Way of the Cross',        'Luke 20–24',         'Luke',     24, NULL, NULL, 'What does the Emmaus road story reveal about how Jesus meets us in grief and confusion?'),
  ('a1000000-0000-0000-0000-000000000002', 16, 'The Word Became Flesh',       'John 1–4',           'John',      1, NULL, NULL, 'What strikes you most about John''s ''In the beginning was the Word''?'),
  ('a1000000-0000-0000-0000-000000000002', 17, 'I Am the Bread of Life',      'John 5–8',           'John',      6, NULL, NULL, 'Which of Jesus'' ''I AM'' statements speaks most to a need in your life right now?'),
  ('a1000000-0000-0000-0000-000000000002', 18, 'Light of the World',          'John 9–12',          'John',     11, NULL, NULL, 'How does Jesus'' weeping at Lazarus'' tomb reveal something important about who God is?'),
  ('a1000000-0000-0000-0000-000000000002', 19, 'The Upper Room',              'John 13–17',         'John',     15, NULL, NULL, 'What does it mean to ''abide in Christ''? How do you practice that today?'),
  ('a1000000-0000-0000-0000-000000000002', 20, 'Crucified and Risen',         'John 18–21',         'John',     20, NULL, NULL, 'How does encountering the risen Jesus change you the way it changed Thomas?'),
  ('a1000000-0000-0000-0000-000000000002', 21, 'The Church Is Born',          'Acts 1–7',           'Acts',      2, NULL, NULL, 'What would it look like to be filled with the Spirit the way the early church was?'),
  ('a1000000-0000-0000-0000-000000000002', 22, 'The Gospel Goes Out',         'Acts 8–15',          'Acts',      9, NULL, NULL, 'How does Paul''s dramatic conversion challenge your assumptions about who can encounter Jesus?'),
  ('a1000000-0000-0000-0000-000000000002', 23, 'To the Ends of the Earth',    'Acts 16–28',         'Acts',     16, NULL, NULL, 'How does Paul and Silas singing in prison challenge you in your own hardships?'),
  ('a1000000-0000-0000-0000-000000000002', 24, 'The Heart of the Gospel',     'Romans 1–8',         'Romans',    8, NULL, NULL, 'What does ''nothing can separate us from the love of God'' mean for where you are right now?'),
  ('a1000000-0000-0000-0000-000000000002', 25, 'Grace and the Christian Life', 'Romans 9–16',       'Romans',   12, NULL, NULL, 'What does it mean to be a ''living sacrifice''? What would that look like practically for you today?'),
  ('a1000000-0000-0000-0000-000000000002', 26, 'Seated in the Heavens',       'Ephesians 1–6',      'Ephesians', 2, NULL, NULL, 'How does being ''seated with Christ in heavenly places'' change how you face earthly struggles?'),
  ('a1000000-0000-0000-0000-000000000002', 27, 'Greater Than All',            'Hebrews 1–13',       'Hebrews',  11, NULL, NULL, 'Which figure from Hebrews 11''s Hall of Faith encourages you most, and why?'),
  ('a1000000-0000-0000-0000-000000000002', 28, 'Faith in Action',             'James + 1 Peter',    'James',     1, NULL, NULL, 'Where in your life do you need to be a ''doer of the word, not just a hearer''?'),
  ('a1000000-0000-0000-0000-000000000002', 29, 'Walking in Love',             '1 John + Jude',      '1 John',    4, NULL, NULL, 'What does it mean that ''perfect love casts out fear''? Where do you need that truth today?'),
  ('a1000000-0000-0000-0000-000000000002', 30, 'Behold, He Is Coming',        'Revelation 1–22',    'Revelation',21, NULL, NULL, 'As you picture the new heaven and new earth, what are you most longing for?');

-- ─── Seed: Life of Jesus (21 days) ────────────────────────────────────────

INSERT INTO plan_readings (plan_id, day_number, title, passage_ref, book, chapter, verse_start, verse_end, reflection_prompt) VALUES
  ('a1000000-0000-0000-0000-000000000003',  1, 'The Promise of the Savior',   'Luke 1',             'Luke',      1, NULL, NULL, 'What does the angel''s word — ''nothing is impossible with God'' — mean for something you''re facing right now?'),
  ('a1000000-0000-0000-0000-000000000003',  2, 'The Birth of the King',       'Luke 2',             'Luke',      2, NULL, NULL, 'How does the humble setting of Jesus'' birth shape how you think about what God values?'),
  ('a1000000-0000-0000-0000-000000000003',  3, 'Baptism and Temptation',      'Matthew 3–4',        'Matthew',   4, NULL, NULL, 'How did Jesus overcome temptation? What does this teach you about facing your own?'),
  ('a1000000-0000-0000-0000-000000000003',  4, 'The Word Became Flesh',       'John 1',             'John',      1, NULL, NULL, 'What strikes you most about John''s description of Jesus as the eternal Word of God?'),
  ('a1000000-0000-0000-0000-000000000003',  5, 'The Kingdom Announced',       'Luke 4',             'Luke',      4, NULL, NULL, 'What does it mean that Jesus came ''to proclaim liberty to the captives''? How do you experience that today?'),
  ('a1000000-0000-0000-0000-000000000003',  6, 'Born Again',                  'John 3–4',           'John',      3, NULL, NULL, 'What does it mean to be ''born of the Spirit''? How has that become true in your life?'),
  ('a1000000-0000-0000-0000-000000000003',  7, 'The Sermon on the Mount',     'Matthew 5–7',        'Matthew',   5, NULL, NULL, 'Which teaching of Jesus challenges you most deeply today?'),
  ('a1000000-0000-0000-0000-000000000003',  8, 'Parables and Miracles',       'Mark 4–5',           'Mark',      4, NULL, NULL, 'What does the calming of the storm teach you about Jesus'' authority in your own storms?'),
  ('a1000000-0000-0000-0000-000000000003',  9, 'Love Your Neighbor',          'Luke 10',            'Luke',     10, NULL, NULL, 'Who is God calling you to be a good Samaritan to right now?'),
  ('a1000000-0000-0000-0000-000000000003', 10, 'The Resurrection and the Life', 'John 11',          'John',     11, NULL, NULL, 'What does ''I am the resurrection and the life'' mean to you in a season of loss or difficulty?'),
  ('a1000000-0000-0000-0000-000000000003', 11, 'Who Do You Say I Am?',        'Matthew 16–17',      'Matthew',  16, NULL, NULL, 'How would you answer Jesus'' question: ''Who do you say I am?'''),
  ('a1000000-0000-0000-0000-000000000003', 12, 'The Lost Son',                'Luke 15',            'Luke',     15, NULL, NULL, 'Which character in the parable of the prodigal son do you most identify with right now, and why?'),
  ('a1000000-0000-0000-0000-000000000003', 13, 'Servant Leadership',          'John 13–14',         'John',     13, NULL, NULL, 'What would it look like to ''wash someone''s feet'' — to serve sacrificially — this week?'),
  ('a1000000-0000-0000-0000-000000000003', 14, 'Abide in Me',                 'John 15–16',         'John',     15, NULL, NULL, 'What does it mean to ''abide'' in Christ? What helps you stay deeply connected to him?'),
  ('a1000000-0000-0000-0000-000000000003', 15, 'Jesus Prays for You',         'John 17',            'John',     17, NULL, NULL, 'As you read Jesus'' prayer for his disciples, what does it mean that this prayer is also for you?'),
  ('a1000000-0000-0000-0000-000000000003', 16, 'Not My Will, but Yours',      'Matthew 26',         'Matthew',  26, NULL, NULL, 'How does Jesus'' prayer in Gethsemane — ''not my will, but yours'' — shape how you pray in difficult circumstances?'),
  ('a1000000-0000-0000-0000-000000000003', 17, 'The Crucifixion',             'Matthew 27',         'Matthew',  27, NULL, NULL, 'Take time to sit with the weight of this day. What does the cross mean to you personally?'),
  ('a1000000-0000-0000-0000-000000000003', 18, 'He Has Risen',                'Luke 24:1–35',       'Luke',     24,  1,  35, 'What would it mean to have a ''burning heart'' as you walk with Jesus through Scripture?'),
  ('a1000000-0000-0000-0000-000000000003', 19, 'Doubting No More',            'John 20',            'John',     20, NULL, NULL, 'How does Jesus'' response to Thomas'' doubt encourage you in your own questions and doubts?'),
  ('a1000000-0000-0000-0000-000000000003', 20, 'Do You Love Me?',             'John 21',            'John',     21, NULL, NULL, 'Jesus asks Peter three times: ''Do you love me?'' How do you answer that question today?'),
  ('a1000000-0000-0000-0000-000000000003', 21, 'You Will Be My Witnesses',    'Acts 1',             'Acts',      1, NULL, NULL, 'What is your testimony of Jesus? Who in your life needs to hear it?');

-- ─── Seed: Romans Deep Dive (14 days) ─────────────────────────────────────

INSERT INTO plan_readings (plan_id, day_number, title, passage_ref, book, chapter, verse_start, verse_end, reflection_prompt) VALUES
  ('a1000000-0000-0000-0000-000000000004',  1, 'The Gospel''s Power',          'Romans 1',           'Romans',    1, NULL, NULL, 'What does it mean that the gospel is the ''power of God for salvation to everyone who believes''?'),
  ('a1000000-0000-0000-0000-000000000004',  2, 'All Have Sinned',              'Romans 2–3',         'Romans',    3, NULL, NULL, 'How does understanding your own need for grace change the way you see others?'),
  ('a1000000-0000-0000-0000-000000000004',  3, 'Justified by Faith',           'Romans 4–5',         'Romans',    4, NULL, NULL, 'What does it mean to believe God ''when circumstances say otherwise,'' the way Abraham did?'),
  ('a1000000-0000-0000-0000-000000000004',  4, 'Dead to Sin, Alive in Christ', 'Romans 6',           'Romans',    6, NULL, NULL, 'In what area of life do you need to ''consider yourself dead to sin and alive to God''?'),
  ('a1000000-0000-0000-0000-000000000004',  5, 'The War Within',               'Romans 7',           'Romans',    7, NULL, NULL, 'Can you relate to Paul''s struggle in this chapter? How do verses 24–25 offer you hope?'),
  ('a1000000-0000-0000-0000-000000000004',  6, 'Life in the Spirit',           'Romans 8:1–17',      'Romans',    8,  1,  17, 'How does ''no condemnation'' change how you approach God when you feel like you''ve failed?'),
  ('a1000000-0000-0000-0000-000000000004',  7, 'Nothing Can Separate Us',      'Romans 8:18–39',     'Romans',    8, 18,  39, 'Which verse in this passage speaks most powerfully to your current circumstances?'),
  ('a1000000-0000-0000-0000-000000000004',  8, 'Sovereign Grace',              'Romans 9–10',        'Romans',   10, NULL, NULL, 'How do you hold together God''s sovereignty and your responsibility to trust and obey him?'),
  ('a1000000-0000-0000-0000-000000000004',  9, 'His Faithfulness Endures',     'Romans 11',          'Romans',   11, NULL, NULL, 'What does God''s faithfulness to his promises to Israel tell you about his faithfulness to you?'),
  ('a1000000-0000-0000-0000-000000000004', 10, 'Living Sacrifices',            'Romans 12',          'Romans',   12, NULL, NULL, 'Which spiritual gift in this chapter do you sense God has given you? How are you using it?'),
  ('a1000000-0000-0000-0000-000000000004', 11, 'Love and Conscience',          'Romans 13–14',       'Romans',   13, NULL, NULL, 'What does it mean to ''put on Christ'' in your daily interactions with others?'),
  ('a1000000-0000-0000-0000-000000000004', 12, 'The Ministry of Hope',         'Romans 15',          'Romans',   15, NULL, NULL, 'How is God calling you to be a ''minister of hope'' to someone who needs encouragement this week?'),
  ('a1000000-0000-0000-0000-000000000004', 13, 'The People of Grace',          'Romans 16:1–16',     'Romans',   16,  1,  16, 'How does Paul''s long list of personal greetings challenge you in the depth of your own community?'),
  ('a1000000-0000-0000-0000-000000000004', 14, 'Doxology',                     'Romans 16:17–27',    'Romans',   16, 17,  27, 'Let the closing doxology wash over you. What about God''s character fills you with the most awe?');

-- ─── Seed: Psalms & Proverbs (60 days) ────────────────────────────────────

INSERT INTO plan_readings (plan_id, day_number, title, passage_ref, book, chapter, verse_start, verse_end, reflection_prompt) VALUES
  ('a1000000-0000-0000-0000-000000000005',  1, 'Two Paths',                    'Psalm 1 + Proverbs 1',    'Psalms',   1, NULL, NULL, 'What does it look like to ''delight in the law of the Lord'' in your daily life?'),
  ('a1000000-0000-0000-0000-000000000005',  2, 'Crowned with Glory',           'Psalm 8 + Proverbs 2',    'Psalms',   8, NULL, NULL, 'How does knowing you are made in the image of God change how you see yourself today?'),
  ('a1000000-0000-0000-0000-000000000005',  3, 'My Portion and Cup',           'Psalm 16 + Proverbs 3',   'Psalms',  16, NULL, NULL, 'What does it mean to ''trust the Lord with all your heart'' in a decision you''re currently facing?'),
  ('a1000000-0000-0000-0000-000000000005',  4, 'The Heavens Declare',          'Psalm 19 + Proverbs 4',   'Psalms',  19, NULL, NULL, 'Where do you most clearly see God''s glory in creation around you today?'),
  ('a1000000-0000-0000-0000-000000000005',  5, 'My God, My God',               'Psalm 22 + Proverbs 5',   'Psalms',  22, NULL, NULL, 'How does this psalm — quoted by Jesus on the cross — deepen your understanding of his suffering?'),
  ('a1000000-0000-0000-0000-000000000005',  6, 'The Lord Is My Shepherd',      'Psalm 23 + Proverbs 6',   'Psalms',  23, NULL, NULL, 'In what areas of your life do you most need the shepherd''s care right now?'),
  ('a1000000-0000-0000-0000-000000000005',  7, 'The Earth Is the Lord''s',     'Psalm 24 + Proverbs 7',   'Psalms',  24, NULL, NULL, 'What would it look like to live as a steward — not an owner — of what God has given you?'),
  ('a1000000-0000-0000-0000-000000000005',  8, 'The Lord Is My Light',         'Psalm 27 + Proverbs 8',   'Psalms',  27, NULL, NULL, 'What is the ''one thing'' you most desire of the Lord today?'),
  ('a1000000-0000-0000-0000-000000000005',  9, 'Into Your Hands',              'Psalm 31 + Proverbs 9',   'Psalms',  31, NULL, NULL, 'Are there areas of your life you''ve been holding onto that you need to release to God?'),
  ('a1000000-0000-0000-0000-000000000005', 10, 'Blessed Is the One Forgiven',  'Psalm 32 + Proverbs 10',  'Psalms',  32, NULL, NULL, 'Have you received God''s forgiveness fully? Is there something you''re still carrying guilt over?'),
  ('a1000000-0000-0000-0000-000000000005', 11, 'Sing Joyfully',                'Psalm 33 + Proverbs 11',  'Psalms',  33, NULL, NULL, 'What new song could you sing to the Lord about what he''s done in your life?'),
  ('a1000000-0000-0000-0000-000000000005', 12, 'Taste and See',                'Psalm 34 + Proverbs 12',  'Psalms',  34, NULL, NULL, 'When have you ''tasted and seen that the Lord is good''? How can you remind yourself of that today?'),
  ('a1000000-0000-0000-0000-000000000005', 13, 'Delight in the Lord',          'Psalm 37 + Proverbs 13',  'Psalms',  37, NULL, NULL, 'What are you fretting about today that you need to lay down and entrust to God?'),
  ('a1000000-0000-0000-0000-000000000005', 14, 'He Lifted Me Out',             'Psalm 40 + Proverbs 14',  'Psalms',  40, NULL, NULL, 'What ''pit'' has God lifted you out of? How does remembering that shape your faith today?'),
  ('a1000000-0000-0000-0000-000000000005', 15, 'As the Deer Pants',            'Psalm 42 + Proverbs 15',  'Psalms',  42, NULL, NULL, 'When you feel distant from God, what helps you find your way back to him?'),
  ('a1000000-0000-0000-0000-000000000005', 16, 'God Is Our Refuge',            'Psalm 46 + Proverbs 16',  'Psalms',  46, NULL, NULL, 'What does it mean to ''be still and know'' that God is God in your current circumstances?'),
  ('a1000000-0000-0000-0000-000000000005', 17, 'Have Mercy on Me',             'Psalm 51 + Proverbs 17',  'Psalms',  51, NULL, NULL, 'What does true repentance look like — not just remorse, but a turning? Is there anything to bring to God today?'),
  ('a1000000-0000-0000-0000-000000000005', 18, 'My Soul Finds Rest',           'Psalm 62 + Proverbs 18',  'Psalms',  62, NULL, NULL, 'What does it mean to find rest in God alone? What are you resting in instead of him?'),
  ('a1000000-0000-0000-0000-000000000005', 19, 'My Soul Thirsts for You',      'Psalm 63 + Proverbs 19',  'Psalms',  63, NULL, NULL, 'How would you describe your hunger and thirst for God right now — satisfied, growing, or dormant?'),
  ('a1000000-0000-0000-0000-000000000005', 20, 'Shout with Joy',               'Psalm 66 + Proverbs 20',  'Psalms',  66, NULL, NULL, 'What has God done in your life that deserves a shout of joy today?'),
  ('a1000000-0000-0000-0000-000000000005', 21, 'When the Wicked Prosper',      'Psalm 73 + Proverbs 21',  'Psalms',  73, NULL, NULL, 'Have you ever been envious of those who seem to prosper without God? What corrects that perspective?'),
  ('a1000000-0000-0000-0000-000000000005', 22, 'How Lovely Is Your Dwelling',  'Psalm 84 + Proverbs 22',  'Psalms',  84, NULL, NULL, 'What does it mean to long for God''s presence the way this psalmist does?'),
  ('a1000000-0000-0000-0000-000000000005', 23, 'Hear My Prayer, Lord',         'Psalm 86 + Proverbs 23',  'Psalms',  86, NULL, NULL, 'The psalmist brings everything to God — joy, need, praise, fear. What do you need to bring to him today?'),
  ('a1000000-0000-0000-0000-000000000005', 24, 'Our Dwelling Through All Generations', 'Psalm 90 + Proverbs 24', 'Psalms', 90, NULL, NULL, 'How does the reality of life''s brevity shape your priorities and what you choose to give your time to?'),
  ('a1000000-0000-0000-0000-000000000005', 25, 'Dwelling in the Shadow',       'Psalm 91 + Proverbs 25',  'Psalms',  91, NULL, NULL, 'What does it mean to ''dwell in the shelter of the Most High''? How do you live in that place daily?'),
  ('a1000000-0000-0000-0000-000000000005', 26, 'Planted in His Courts',        'Psalm 92 + Proverbs 26',  'Psalms',  92, NULL, NULL, 'What are the signs of spiritual fruitfulness you can see in your life right now?'),
  ('a1000000-0000-0000-0000-000000000005', 27, 'Come, Let Us Worship',         'Psalm 95 + Proverbs 27',  'Psalms',  95, NULL, NULL, 'How can you cultivate a heart of worship today, not just in church but in everyday moments?'),
  ('a1000000-0000-0000-0000-000000000005', 28, 'Sing a New Song',              'Psalm 96 + Proverbs 28',  'Psalms',  96, NULL, NULL, 'What new thing is God doing in your life that deserves a new song of praise?'),
  ('a1000000-0000-0000-0000-000000000005', 29, 'Enter with Thanksgiving',      'Psalm 100 + Proverbs 29', 'Psalms', 100, NULL, NULL, 'What does it mean to ''enter his gates with thanksgiving''? Can you do that right now?'),
  ('a1000000-0000-0000-0000-000000000005', 30, 'Bless the Lord, O My Soul',    'Psalm 103 + Proverbs 30', 'Psalms', 103, NULL, NULL, 'David says: ''Don''t forget his benefits.'' What benefits of God do you most easily forget?'),
  ('a1000000-0000-0000-0000-000000000005', 31, 'You Are Very Great',           'Psalm 104 + Proverbs 31', 'Psalms', 104, NULL, NULL, 'How does creation — as the psalmist sees it — reflect God''s majesty and care?'),
  ('a1000000-0000-0000-0000-000000000005', 32, 'His Steadfast Love Endures',   'Psalm 107 + Proverbs 1',  'Psalms', 107, NULL, NULL, 'Which of the four stories of redemption in Psalm 107 resonates most with your own story?'),
  ('a1000000-0000-0000-0000-000000000005', 33, 'The Lord''s Anointed King',    'Psalm 110 + Proverbs 2',  'Psalms', 110, NULL, NULL, 'How does knowing Jesus as your eternal King and Priest change how you relate to him?'),
  ('a1000000-0000-0000-0000-000000000005', 34, 'Great Are His Works',          'Psalm 111 + Proverbs 3',  'Psalms', 111, NULL, NULL, 'What work of God do you need to meditate on and remember today?'),
  ('a1000000-0000-0000-0000-000000000005', 35, 'The Righteous Will Not Waver', 'Psalm 112 + Proverbs 4',  'Psalms', 112, NULL, NULL, 'What does it look like to be a person who ''fears the Lord and delights greatly in his commands''?'),
  ('a1000000-0000-0000-0000-000000000005', 36, 'I Love the Lord',              'Psalm 116 + Proverbs 5',  'Psalms', 116, NULL, NULL, 'The psalmist asks: ''What shall I render to the Lord for all his benefits to me?'' How do you answer?'),
  ('a1000000-0000-0000-0000-000000000005', 37, 'This Is the Day',              'Psalm 118 + Proverbs 6',  'Psalms', 118, NULL, NULL, 'How does ''this is the day the Lord has made'' change how you approach even an ordinary, unremarkable day?'),
  ('a1000000-0000-0000-0000-000000000005', 38, 'Blessed in the Way',           'Psalm 119:1–32 + Proverbs 7',  'Psalms', 119,  1,  32, 'How does meditating on Scripture help ''keep your path clean''? Where do you need that most right now?'),
  ('a1000000-0000-0000-0000-000000000005', 39, 'Open My Eyes',                 'Psalm 119:33–72 + Proverbs 8', 'Psalms', 119, 33,  72, 'What does it mean that God''s word is ''a lamp to my feet''? Where do you need guidance right now?'),
  ('a1000000-0000-0000-0000-000000000005', 40, 'You Are My Comfort',           'Psalm 119:73–112 + Proverbs 9', 'Psalms', 119, 73, 112, 'How has Scripture comforted you in a difficult season? What verse have you clung to?'),
  ('a1000000-0000-0000-0000-000000000005', 41, 'Your Word Is My Hope',         'Psalm 119:113–152 + Proverbs 10', 'Psalms', 119, 113, 152, 'How does ''your word is very pure, therefore your servant loves it'' express your relationship with Scripture?'),
  ('a1000000-0000-0000-0000-000000000005', 42, 'I Have Gone Astray',           'Psalm 119:153–176 + Proverbs 11', 'Psalms', 119, 153, 176, 'When have you felt like a ''lost sheep''? How did you find your way back to God?'),
  ('a1000000-0000-0000-0000-000000000005', 43, 'My Help Comes from the Lord',  'Psalm 121 + Proverbs 12', 'Psalms', 121, NULL, NULL, 'What ''hills'' are you looking to for help instead of God? How can you reorient toward him today?'),
  ('a1000000-0000-0000-0000-000000000005', 44, 'I Was Glad When They Said',    'Psalm 122 + Proverbs 13', 'Psalms', 122, NULL, NULL, 'How do you feel about gathering with God''s people? What does that community mean to you?'),
  ('a1000000-0000-0000-0000-000000000005', 45, 'Our Eyes Look to the Lord',    'Psalm 123 + Proverbs 14', 'Psalms', 123, NULL, NULL, 'The psalmist is in a posture of waiting, eyes lifted. What are you waiting for God to do right now?'),
  ('a1000000-0000-0000-0000-000000000005', 46, 'Our Help Is in His Name',      'Psalm 124 + Proverbs 15', 'Psalms', 124, NULL, NULL, 'When has God rescued you from something that felt overwhelming? How do you carry that memory forward?'),
  ('a1000000-0000-0000-0000-000000000005', 47, 'Those Who Trust Will Not Move', 'Psalm 125 + Proverbs 16', 'Psalms', 125, NULL, NULL, 'What does it mean to be ''surrounded by the Lord'' the way mountains surround Jerusalem?'),
  ('a1000000-0000-0000-0000-000000000005', 48, 'The Lord Has Done Great Things', 'Psalm 126 + Proverbs 17', 'Psalms', 126, NULL, NULL, 'What ''captivity'' has the Lord restored you from? How does that shape your joy today?'),
  ('a1000000-0000-0000-0000-000000000005', 49, 'Unless the Lord Builds',       'Psalm 127 + Proverbs 18', 'Psalms', 127, NULL, NULL, 'Are there areas of your life where you''ve been building or laboring without inviting God in?'),
  ('a1000000-0000-0000-0000-000000000005', 50, 'Blessed Are All Who Fear Him', 'Psalm 128 + Proverbs 19', 'Psalms', 128, NULL, NULL, 'How does the picture of a fruitful, peaceful household reflect what you long for in your own family?'),
  ('a1000000-0000-0000-0000-000000000005', 51, 'Out of the Depths',            'Psalm 130 + Proverbs 20', 'Psalms', 130, NULL, NULL, 'Have you cried to God ''out of the depths''? What did that experience teach you about his character?'),
  ('a1000000-0000-0000-0000-000000000005', 52, 'A Quieted Soul',               'Psalm 131 + Proverbs 21', 'Psalms', 131, NULL, NULL, 'The psalmist has ''quieted his soul like a weaned child.'' What does that kind of settled rest look like for you?'),
  ('a1000000-0000-0000-0000-000000000005', 53, 'How Good and Pleasant',        'Psalm 133 + Proverbs 22', 'Psalms', 133, NULL, NULL, 'What does unity among God''s people look like in your life? Where is there friction that needs grace?'),
  ('a1000000-0000-0000-0000-000000000005', 54, 'Forever Faithful',             'Psalm 136 + Proverbs 23', 'Psalms', 136, NULL, NULL, 'Repeat the refrain slowly: ''His love endures forever.'' How does that truth speak into your current season?'),
  ('a1000000-0000-0000-0000-000000000005', 55, 'With All My Heart',            'Psalm 138 + Proverbs 24', 'Psalms', 138, NULL, NULL, 'What does wholehearted worship look like in your everyday life, not just in church on Sunday?'),
  ('a1000000-0000-0000-0000-000000000005', 56, 'You Have Searched Me',         'Psalm 139 + Proverbs 25', 'Psalms', 139, NULL, NULL, 'How does being fully known by God — and still fully loved — change how you see yourself?'),
  ('a1000000-0000-0000-0000-000000000005', 57, 'Teach Me to Do Your Will',     'Psalm 143 + Proverbs 26', 'Psalms', 143, NULL, NULL, 'Where do you need God''s guidance right now? What does surrendering to his will look like today?'),
  ('a1000000-0000-0000-0000-000000000005', 58, 'I Will Extol You, My God',     'Psalm 145 + Proverbs 27', 'Psalms', 145, NULL, NULL, 'What quality of God fills you with the most awe today? Take time to declare it.'),
  ('a1000000-0000-0000-0000-000000000005', 59, 'Praise from the Heavens',      'Psalm 148 + Proverbs 28', 'Psalms', 148, NULL, NULL, 'What in creation makes you want to praise God? Take a moment to do that now.'),
  ('a1000000-0000-0000-0000-000000000005', 60, 'Let Everything Praise the Lord', 'Psalm 150 + Proverbs 29–31', 'Psalms', 150, NULL, NULL, 'As you finish this plan, how has your understanding of praise and wisdom grown? What is your next step?');

-- ─── Seed: Old Testament Survey (90 days) ─────────────────────────────────

INSERT INTO plan_readings (plan_id, day_number, title, passage_ref, book, chapter, verse_start, verse_end, reflection_prompt) VALUES
  ('a1000000-0000-0000-0000-000000000006',  1, 'In the Beginning',              'Genesis 1',        'Genesis',    1, NULL, NULL, 'What does it mean to you that you are made ''in the image of God''?'),
  ('a1000000-0000-0000-0000-000000000006',  2, 'The First Garden',              'Genesis 2',        'Genesis',    2, NULL, NULL, 'What does the picture of man and woman together, without shame, say about God''s design for relationship?'),
  ('a1000000-0000-0000-0000-000000000006',  3, 'The Fall',                      'Genesis 3',        'Genesis',    3, NULL, NULL, 'How do you see the effects of the Fall in your own heart and the world around you?'),
  ('a1000000-0000-0000-0000-000000000006',  4, 'Noah and the Flood',            'Genesis 6–8',      'Genesis',    6, NULL, NULL, 'What does the story of Noah tell you about God''s judgment and his grace?'),
  ('a1000000-0000-0000-0000-000000000006',  5, 'The Call of Abraham',           'Genesis 12',       'Genesis',   12, NULL, NULL, 'What would it mean for you to leave what is familiar and follow God into the unknown?'),
  ('a1000000-0000-0000-0000-000000000006',  6, 'The Covenant with Abraham',     'Genesis 15',       'Genesis',   15, NULL, NULL, 'God makes a covenant based on faith alone. How does that speak to your own relationship with him?'),
  ('a1000000-0000-0000-0000-000000000006',  7, 'The Sacrifice of Isaac',        'Genesis 22',       'Genesis',   22, NULL, NULL, 'What is God asking you to surrender? How does Abraham''s obedience encourage your trust?'),
  ('a1000000-0000-0000-0000-000000000006',  8, 'Jacob and Esau',                'Genesis 25–27',    'Genesis',   25, NULL, NULL, 'How do you see God''s sovereign plan working through flawed and broken human choices in this story?'),
  ('a1000000-0000-0000-0000-000000000006',  9, 'Wrestling with God',            'Genesis 32',       'Genesis',   32, NULL, NULL, 'Have you ever wrestled with God? What did that encounter leave you with?'),
  ('a1000000-0000-0000-0000-000000000006', 10, 'Joseph Sold into Egypt',        'Genesis 37',       'Genesis',   37, NULL, NULL, 'When have you felt betrayed or abandoned? How does Joseph''s story give you hope?'),
  ('a1000000-0000-0000-0000-000000000006', 11, 'Joseph Revealed',               'Genesis 45',       'Genesis',   45, NULL, NULL, 'What does Joseph''s forgiveness of his brothers teach you about the nature of forgiveness?'),
  ('a1000000-0000-0000-0000-000000000006', 12, 'God Meant It for Good',         'Genesis 50',       'Genesis',   50, NULL, NULL, 'How have you seen God turn something meant for harm into something good in your own life?'),
  ('a1000000-0000-0000-0000-000000000006', 13, 'Moses in the Reeds',            'Exodus 1–2',       'Exodus',     2, NULL, NULL, 'How does Moses'' unlikely beginning encourage you when your circumstances seem impossible?'),
  ('a1000000-0000-0000-0000-000000000006', 14, 'The Burning Bush',              'Exodus 3',         'Exodus',     3, NULL, NULL, 'God says: ''I have heard my people''s cry.'' How does that truth speak to a burden you are carrying?'),
  ('a1000000-0000-0000-0000-000000000006', 15, 'Let My People Go',              'Exodus 5–7',       'Exodus',     5, NULL, NULL, 'When things seem to get worse before they get better, how do you hold onto God''s promises?'),
  ('a1000000-0000-0000-0000-000000000006', 16, 'The Passover',                  'Exodus 11–13',     'Exodus',    12, NULL, NULL, 'How does the Passover lamb point forward to what Christ has done for you?'),
  ('a1000000-0000-0000-0000-000000000006', 17, 'Parting the Sea',               'Exodus 14',        'Exodus',    14, NULL, NULL, 'How does the image of God parting the sea speak to an impossible situation you are currently facing?'),
  ('a1000000-0000-0000-0000-000000000006', 18, 'The Ten Commandments',          'Exodus 19–20',     'Exodus',    20, NULL, NULL, 'Which commandment speaks most powerfully to your life right now, and why?'),
  ('a1000000-0000-0000-0000-000000000006', 19, 'The Day of Atonement',          'Leviticus 16',     'Leviticus', 16, NULL, NULL, 'How does the Day of Atonement point forward to what Christ has accomplished for you on the cross?'),
  ('a1000000-0000-0000-0000-000000000006', 20, 'Love Your Neighbor',            'Leviticus 19',     'Leviticus', 19, NULL, NULL, 'Leviticus contains the command Jesus called the second greatest: ''Love your neighbor.'' Who is yours?'),
  ('a1000000-0000-0000-0000-000000000006', 21, 'The Faithless Spies',           'Numbers 13–14',    'Numbers',   13, NULL, NULL, 'Where in your life is fear preventing you from entering what God has promised you?'),
  ('a1000000-0000-0000-0000-000000000006', 22, 'The Bronze Serpent',            'Numbers 21',       'Numbers',   21, NULL, NULL, 'Jesus points to this story as a foreshadowing of himself. What does it mean to ''look to'' Christ for healing?'),
  ('a1000000-0000-0000-0000-000000000006', 23, 'Love the Lord Your God',        'Deuteronomy 6',    'Deuteronomy', 6, NULL, NULL, 'How are you passing on faith to the next generation? Who is watching your walk with God?'),
  ('a1000000-0000-0000-0000-000000000006', 24, 'Remember the Lord Your God',    'Deuteronomy 8',    'Deuteronomy', 8, NULL, NULL, 'Where in your own ''wilderness'' has God been providing for you without you fully noticing?'),
  ('a1000000-0000-0000-0000-000000000006', 25, 'Choose Life',                   'Deuteronomy 30',   'Deuteronomy', 30, NULL, NULL, '''Choose life.'' What decision are you facing that requires a fresh, wholehearted choice to walk with God?'),
  ('a1000000-0000-0000-0000-000000000006', 26, 'Be Strong and Courageous',      'Joshua 1',         'Joshua',     1, NULL, NULL, 'What promise of God do you need to stand on with courage right now?'),
  ('a1000000-0000-0000-0000-000000000006', 27, 'The Fall of Jericho',           'Joshua 6',         'Joshua',     6, NULL, NULL, 'Are there ''walls'' in your life that only God can bring down? How are you trusting him with them?'),
  ('a1000000-0000-0000-0000-000000000006', 28, 'As for Me and My House',        'Joshua 24',        'Joshua',    24, NULL, NULL, 'What would it mean to make Joshua''s declaration: ''As for me and my house, we will serve the Lord''?'),
  ('a1000000-0000-0000-0000-000000000006', 29, 'The Cycle of the Judges',       'Judges 2–4',       'Judges',     2, NULL, NULL, 'What patterns in your life resemble the Judges'' cycle of drifting, suffering, and returning? How do you break free?'),
  ('a1000000-0000-0000-0000-000000000006', 30, 'Gideon',                        'Judges 6–7',       'Judges',     6, NULL, NULL, 'Gideon felt too small for the task. Where has God called you into something beyond your own strength?'),
  ('a1000000-0000-0000-0000-000000000006', 31, 'The Fall of Samson',            'Judges 16',        'Judges',    16, NULL, NULL, 'How does Samson''s story warn you about the slow and quiet erosion of compromise?'),
  ('a1000000-0000-0000-0000-000000000006', 32, 'Wherever You Go',               'Ruth 1–4',         'Ruth',       1, NULL, NULL, 'Ruth''s loyalty to Naomi is a picture of covenant love. Who in your life needs that kind of steadfast presence?'),
  ('a1000000-0000-0000-0000-000000000006', 33, 'The Call of Samuel',            '1 Samuel 1–3',     '1 Samuel',   3, NULL, NULL, 'How do you cultivate a heart that says, ''Speak, Lord, for your servant is listening''?'),
  ('a1000000-0000-0000-0000-000000000006', 34, 'Give Us a King',                '1 Samuel 8',       '1 Samuel',   8, NULL, NULL, 'Are there areas of your life where you''ve been pushing for your own will rather than trusting God''s?'),
  ('a1000000-0000-0000-0000-000000000006', 35, 'To Obey Is Better',             '1 Samuel 15',      '1 Samuel',  15, NULL, NULL, '''To obey is better than sacrifice.'' What is God asking for your obedience in, not just your outward acts?'),
  ('a1000000-0000-0000-0000-000000000006', 36, 'David and Goliath',             '1 Samuel 17',      '1 Samuel',  17, NULL, NULL, 'What ''Goliath'' are you facing? How does David''s confidence in God inspire your own trust?'),
  ('a1000000-0000-0000-0000-000000000006', 37, 'David Spares Saul',             '1 Samuel 24',      '1 Samuel',  24, NULL, NULL, 'Is there someone you need to entrust to God''s judgment rather than taking matters into your own hands?'),
  ('a1000000-0000-0000-0000-000000000006', 38, 'The Davidic Covenant',          '2 Samuel 7',       '2 Samuel',   7, NULL, NULL, 'God promises David a kingdom that will never end — fulfilled in Jesus. How does this covenant encourage your faith?'),
  ('a1000000-0000-0000-0000-000000000006', 39, 'David and Bathsheba',           '2 Samuel 11–12',   '2 Samuel',  12, NULL, NULL, 'How does Nathan''s courageous confrontation of David model speaking truth in love to someone you care about?'),
  ('a1000000-0000-0000-0000-000000000006', 40, 'David''s Song of Praise',       '2 Samuel 22',      '2 Samuel',  22, NULL, NULL, 'What would it sound like for you to write a song of praise about how God has rescued you?'),
  ('a1000000-0000-0000-0000-000000000006', 41, 'Solomon''s Wisdom',             '1 Kings 3',        '1 Kings',    3, NULL, NULL, 'If God offered you one request, what would you ask for, and why?'),
  ('a1000000-0000-0000-0000-000000000006', 42, 'The Temple Dedication',         '1 Kings 8',        '1 Kings',    8, NULL, NULL, 'Solomon''s prayer is breathtaking. What do you learn about how to pray from his example here?'),
  ('a1000000-0000-0000-0000-000000000006', 43, 'The Kingdom Divided',           '1 Kings 11–12',    '1 Kings',   11, NULL, NULL, 'How does Solomon''s drift away from God warn you about the slow compromises of the heart?'),
  ('a1000000-0000-0000-0000-000000000006', 44, 'Elijah and the Prophets',       '1 Kings 18',       '1 Kings',   18, NULL, NULL, 'Elijah stood alone for what was true. Is there a moment when you need to take that same stand?'),
  ('a1000000-0000-0000-0000-000000000006', 45, 'The Still Small Voice',         '1 Kings 19',       '1 Kings',   19, NULL, NULL, 'God didn''t speak in the earthquake or fire — but in a gentle whisper. How do you create space to hear that voice?'),
  ('a1000000-0000-0000-0000-000000000006', 46, 'Elijah''s Departure',           '2 Kings 2',        '2 Kings',    2, NULL, NULL, 'Who has been an Elijah in your life — pouring into you and modeling faithful discipleship?'),
  ('a1000000-0000-0000-0000-000000000006', 47, 'Naaman Healed',                 '2 Kings 5',        '2 Kings',    5, NULL, NULL, 'Naaman nearly missed his healing because he expected it to look different. Are you resisting God''s way because it seems too simple?'),
  ('a1000000-0000-0000-0000-000000000006', 48, 'Josiah''s Reformation',         '2 Kings 22–23',    '2 Kings',   22, NULL, NULL, 'Josiah rediscovered the forgotten word of God and it changed everything. What would it mean to rediscover Scripture with fresh eyes?'),
  ('a1000000-0000-0000-0000-000000000006', 49, 'Return from Exile',             'Ezra 1',           'Ezra',       1, NULL, NULL, 'What ''exile'' has God brought you back from? How does this chapter encourage you about restoration?'),
  ('a1000000-0000-0000-0000-000000000006', 50, 'Study, Do, and Teach',          'Ezra 7–8',         'Ezra',       7, NULL, NULL, 'Ezra ''set his heart to study, do, and teach'' God''s word. What would that triple commitment look like for you?'),
  ('a1000000-0000-0000-0000-000000000006', 51, 'The Broken Walls',              'Nehemiah 1–2',     'Nehemiah',   1, NULL, NULL, 'When you see something broken in your community or church, how do you respond — with prayer, like Nehemiah?'),
  ('a1000000-0000-0000-0000-000000000006', 52, 'For Such a Time as This',       'Esther 4',         'Esther',     4, NULL, NULL, 'Where has God placed you ''for such a time as this''? How are you using that position for his purposes?'),
  ('a1000000-0000-0000-0000-000000000006', 53, 'Suffering Without Answers',     'Job 1–3',          'Job',        1, NULL, NULL, 'Have you experienced suffering without an explanation? What did that reveal about your faith?'),
  ('a1000000-0000-0000-0000-000000000006', 54, 'I Know My Redeemer Lives',      'Job 19',           'Job',       19, NULL, NULL, 'Even in his darkest moment, Job holds onto a redeemer. How do you hold onto hope when you cannot see God at work?'),
  ('a1000000-0000-0000-0000-000000000006', 55, 'God Speaks from the Whirlwind', 'Job 38–40',        'Job',       38, NULL, NULL, 'What does God''s answer to Job reveal about the difference between human wisdom and divine wisdom?'),
  ('a1000000-0000-0000-0000-000000000006', 56, 'Holy, Holy, Holy',              'Isaiah 6',         'Isaiah',     6, NULL, NULL, 'Isaiah is undone by God''s holiness. What does a fresh encounter with God''s holiness do to your sense of self?'),
  ('a1000000-0000-0000-0000-000000000006', 57, 'A Child Is Born',               'Isaiah 9',         'Isaiah',     9, NULL, NULL, 'Written 700 years before Christ, this prophecy is astonishing. How does it deepen your wonder at the incarnation?'),
  ('a1000000-0000-0000-0000-000000000006', 58, 'He Gives Strength to the Weary', 'Isaiah 40',       'Isaiah',    40, NULL, NULL, 'Are you weary right now? How does ''those who wait upon the Lord shall renew their strength'' speak to you?'),
  ('a1000000-0000-0000-0000-000000000006', 59, 'The Suffering Servant',         'Isaiah 53',        'Isaiah',    53, NULL, NULL, 'Read this slowly, knowing it describes Jesus. What phrase moves you most deeply?'),
  ('a1000000-0000-0000-0000-000000000006', 60, 'Come, All Who Are Thirsty',     'Isaiah 55',        'Isaiah',    55, NULL, NULL, 'God''s invitation is free — ''come, buy wine and milk without money.'' How do you receive that kind of grace?'),
  ('a1000000-0000-0000-0000-000000000006', 61, 'Before I Formed You',           'Jeremiah 1',       'Jeremiah',   1, NULL, NULL, 'God says he knew Jeremiah before he was born. How does that truth speak to your own sense of calling and identity?'),
  ('a1000000-0000-0000-0000-000000000006', 62, 'Plans to Give You Hope',        'Jeremiah 29',      'Jeremiah',  29, NULL, NULL, 'God''s plans for ''welfare and not evil'' were spoken to exiles. How does this promise speak to your current season?'),
  ('a1000000-0000-0000-0000-000000000006', 63, 'Great Is Thy Faithfulness',     'Lamentations 3',   'Lamentations', 3, NULL, NULL, 'Jeremiah writes in devastation: ''His mercies are new every morning.'' Can you say that about your own life today?'),
  ('a1000000-0000-0000-0000-000000000006', 64, 'The Valley of Dry Bones',       'Ezekiel 37',       'Ezekiel',   37, NULL, NULL, 'What in your life feels like ''dry bones'' — something beyond hope? Bring it before God now.'),
  ('a1000000-0000-0000-0000-000000000006', 65, 'A New Heart',                   'Ezekiel 36',       'Ezekiel',   36, NULL, NULL, 'God promises to give his people a heart of flesh. How have you experienced that transformation in yourself?'),
  ('a1000000-0000-0000-0000-000000000006', 66, 'Purpose in a Foreign Land',     'Daniel 1',         'Daniel',     1, NULL, NULL, 'Daniel maintained his convictions in an alien culture. What convictions do you need to hold onto in yours?'),
  ('a1000000-0000-0000-0000-000000000006', 67, 'The Fiery Furnace',             'Daniel 3',         'Daniel',     3, NULL, NULL, '''Even if he does not, we will not bow.'' What does that kind of faith look like in your own life right now?'),
  ('a1000000-0000-0000-0000-000000000006', 68, 'The Lions'' Den',               'Daniel 6',         'Daniel',     6, NULL, NULL, 'Daniel''s enemies couldn''t find fault in him except his devotion to God. What would it mean to live that way?'),
  ('a1000000-0000-0000-0000-000000000006', 69, 'I Will Betroth You Forever',    'Hosea 2',          'Hosea',      2, NULL, NULL, 'God pursues an unfaithful people the way a husband pursues a wayward spouse. How does that love astonish you?'),
  ('a1000000-0000-0000-0000-000000000006', 70, 'Rend Your Heart',               'Joel 2',           'Joel',       2, NULL, NULL, 'What does it mean to ''rend your heart'' rather than your garments? What does genuine repentance look like for you?'),
  ('a1000000-0000-0000-0000-000000000006', 71, 'Let Justice Roll',              'Amos 5',           'Amos',       5, NULL, NULL, 'God says he despises hollow worship without justice. How does this challenge your own worship and daily life?'),
  ('a1000000-0000-0000-0000-000000000006', 72, 'Running from God',              'Jonah 1–4',        'Jonah',      1, NULL, NULL, 'Have you ever run from God? What did that experience reveal about his relentless pursuit of you?'),
  ('a1000000-0000-0000-0000-000000000006', 73, 'What Does the Lord Require?',   'Micah 6',          'Micah',      6, NULL, NULL, '''Act justly, love mercy, walk humbly.'' Which of these three do you find most challenging right now?'),
  ('a1000000-0000-0000-0000-000000000006', 74, 'I Will Rejoice in the Lord',    'Habakkuk 3',       'Habakkuk',   3, NULL, NULL, 'Habakkuk says he will rejoice ''yet'' even when everything fails. Can you make that declaration today?'),
  ('a1000000-0000-0000-0000-000000000006', 75, 'The Lord Is in Your Midst',     'Zephaniah 3',      'Zephaniah',  3, NULL, NULL, 'God ''rejoices over you with singing.'' How does that image of God change how you understand his feelings toward you?'),
  ('a1000000-0000-0000-0000-000000000006', 76, 'Build My House',                'Haggai 1',         'Haggai',     1, NULL, NULL, 'What in your life has God been telling you to attend to that you''ve been putting off?'),
  ('a1000000-0000-0000-0000-000000000006', 77, 'Not by Might',                  'Zechariah 4',      'Zechariah',  4, NULL, NULL, 'What task feels impossible right now? How does ''not by might nor by power, but by my Spirit'' change your approach?'),
  ('a1000000-0000-0000-0000-000000000006', 78, 'Return to Me',                  'Malachi 3',        'Malachi',    3, NULL, NULL, 'God invites a wandering people to ''return.'' Is there an area of your life where you need to turn back to him?'),
  ('a1000000-0000-0000-0000-000000000006', 79, 'The Sun of Righteousness',      'Malachi 4',        'Malachi',    4, NULL, NULL, 'The OT ends with a promise of the coming Elijah. How does the whole sweep of the OT story point you to Christ?'),
  ('a1000000-0000-0000-0000-000000000006', 80, 'My God, My God',                'Psalm 22',         'Psalms',    22, NULL, NULL, 'Written centuries before the cross, this psalm perfectly describes the crucifixion. How does that fill you with awe?'),
  ('a1000000-0000-0000-0000-000000000006', 81, 'The Lord Said to My Lord',      'Psalm 110',        'Psalms',   110, NULL, NULL, 'Jesus cites this psalm about himself. How does the OT''s anticipation of the Messiah deepen your faith in Jesus?'),
  ('a1000000-0000-0000-0000-000000000006', 82, 'A Shoot from Jesse',            'Isaiah 11',        'Isaiah',    11, NULL, NULL, 'This vision of peace and justice is ultimately what Christ will establish. How does that hope shape your daily life?'),
  ('a1000000-0000-0000-0000-000000000006', 83, 'The Priestly Blessing',         'Numbers 6',        'Numbers',    6, NULL, NULL, 'Receive this ancient blessing — ''The Lord bless you and keep you'' — as a gift from God to you right now.'),
  ('a1000000-0000-0000-0000-000000000006', 84, 'You Are Very Great',            'Psalm 104',        'Psalms',   104, NULL, NULL, 'How does the psalmist''s vision of creation''s praise inspire your own response to God''s majesty?'),
  ('a1000000-0000-0000-0000-000000000006', 85, 'You Have Searched Me',          'Psalm 139',        'Psalms',   139, NULL, NULL, 'How does being fully known — and still fully loved — speak to the deepest fear you carry?'),
  ('a1000000-0000-0000-0000-000000000006', 86, 'Bless the Lord, O My Soul',     'Psalm 103',        'Psalms',   103, NULL, NULL, 'Don''t forget his benefits. Which of God''s mercies have you been taking for granted?'),
  ('a1000000-0000-0000-0000-000000000006', 87, 'He Gives Strength',             'Isaiah 40:27–31',  'Isaiah',    40, 27,  31, 'Is there a place in your life where you have been waiting on the Lord? What does it mean to soar on wings like eagles?'),
  ('a1000000-0000-0000-0000-000000000006', 88, 'My Eyes Are on You',            'Psalm 25',         'Psalms',    25, NULL, NULL, 'What does it mean to keep your eyes on the Lord, waiting for his guidance and rescue?'),
  ('a1000000-0000-0000-0000-000000000006', 89, 'Your Word Endures Forever',     'Psalm 119:89–112', 'Psalms',   119, 89, 112, 'Having walked through the Old Testament, how has God''s word become more precious and alive to you?'),
  ('a1000000-0000-0000-0000-000000000006', 90, 'Behold, I Create New Things',   'Isaiah 65:17–25',  'Isaiah',    65, 17,  25, 'What is the ''new thing'' you sense God is doing in your life? How does the vision of new creation fill you with hope?');
