-- =============================================
-- TELLAL — Initial Schema Migration
-- =============================================

-- UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

create table offices (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan_type text not null check (plan_type in ('starter', 'growth', 'fullstack')),
  meta_account_id text,
  google_account_id text,
  meta_access_token text,
  google_access_token text,
  whatsapp_number text,
  webhook_secret text not null default encode(gen_random_bytes(32), 'hex'),
  stripe_customer_id text,
  stripe_subscription_id text,
  settings jsonb not null default '{}',
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now()
);

create table agents (
  id uuid primary key default uuid_generate_v4(),
  office_id uuid references offices(id) on delete cascade not null,
  name text not null,
  phone text not null,
  regions text[] not null default '{}',
  is_available boolean not null default true,
  active_lead_count int not null default 0,
  conversion_rate decimal(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default uuid_generate_v4(),
  office_id uuid references offices(id) on delete cascade not null,
  agent_id uuid references agents(id) on delete set null,
  name text not null,
  phone text not null,
  source text not null check (source in ('meta_ads', 'google_ads', 'web_form', 'referral', 'manual')),
  interest text not null,
  budget text not null,
  ai_score int check (ai_score >= 0 and ai_score <= 100),
  ai_reasoning text,
  recommended_tone text check (recommended_tone in ('urgent', 'informative', 'casual')),
  status text not null default 'new' check (status in ('new', 'contacted', 'responded', 'appointment', 'closed', 'cold')),
  first_contact_at timestamptz,
  closed_at timestamptz,
  sale_value decimal(12,2),
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade not null,
  channel text not null check (channel in ('whatsapp', 'sms', 'email')),
  content text not null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),
  sequence_step int,
  sent_at timestamptz not null default now()
);

create table sequences (
  id uuid primary key default uuid_generate_v4(),
  office_id uuid references offices(id) on delete cascade not null,
  name text not null,
  steps jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  office_id uuid references offices(id) on delete cascade not null,
  platform text not null check (platform in ('meta', 'google')),
  external_id text,
  name text not null,
  status text not null default 'draft' check (status in ('active', 'paused', 'ended', 'draft')),
  daily_budget decimal(10,2) not null default 0,
  spent decimal(10,2) not null default 0,
  leads_count int not null default 0,
  performance jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table analytics (
  id uuid primary key default uuid_generate_v4(),
  office_id uuid references offices(id) on delete cascade not null,
  date date not null,
  leads_count int not null default 0,
  contacted_count int not null default 0,
  response_rate decimal(5,2) not null default 0,
  conversion_rate decimal(5,2) not null default 0,
  ad_spend decimal(10,2) not null default 0,
  revenue_generated decimal(12,2) not null default 0,
  unique(office_id, date)
);

-- =============================================
-- INDEXES
-- =============================================

create index idx_agents_office_id on agents(office_id);
create index idx_leads_office_id on leads(office_id);
create index idx_leads_agent_id on leads(agent_id);
create index idx_leads_status on leads(status);
create index idx_leads_created_at on leads(created_at desc);
create index idx_messages_lead_id on messages(lead_id);
create index idx_campaigns_office_id on campaigns(office_id);
create index idx_analytics_office_date on analytics(office_id, date desc);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table offices enable row level security;
alter table agents enable row level security;
alter table leads enable row level security;
alter table messages enable row level security;
alter table sequences enable row level security;
alter table campaigns enable row level security;
alter table analytics enable row level security;

-- OFFICES
create policy "Kullanıcı kendi ofisini görür"
  on offices for select
  using (auth.uid() = user_id);

create policy "Kullanıcı kendi ofisini oluşturur"
  on offices for insert
  with check (auth.uid() = user_id);

create policy "Kullanıcı kendi ofisini günceller"
  on offices for update
  using (auth.uid() = user_id);

-- AGENTS
create policy "Ofis sahibi danışmanları görür"
  on agents for select
  using (
    exists (
      select 1 from offices
      where offices.id = agents.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi danışman ekler"
  on agents for insert
  with check (
    exists (
      select 1 from offices
      where offices.id = agents.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi danışman günceller"
  on agents for update
  using (
    exists (
      select 1 from offices
      where offices.id = agents.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi danışman siler"
  on agents for delete
  using (
    exists (
      select 1 from offices
      where offices.id = agents.office_id
      and offices.user_id = auth.uid()
    )
  );

-- LEADS
create policy "Ofis sahibi leadleri görür"
  on leads for select
  using (
    exists (
      select 1 from offices
      where offices.id = leads.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi lead ekler"
  on leads for insert
  with check (
    exists (
      select 1 from offices
      where offices.id = leads.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi lead günceller"
  on leads for update
  using (
    exists (
      select 1 from offices
      where offices.id = leads.office_id
      and offices.user_id = auth.uid()
    )
  );

-- MESSAGES
create policy "Ofis sahibi mesajları görür"
  on messages for select
  using (
    exists (
      select 1 from leads
      join offices on offices.id = leads.office_id
      where leads.id = messages.lead_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi mesaj ekler"
  on messages for insert
  with check (
    exists (
      select 1 from leads
      join offices on offices.id = leads.office_id
      where leads.id = messages.lead_id
      and offices.user_id = auth.uid()
    )
  );

-- SEQUENCES
create policy "Ofis sahibi sekansları görür"
  on sequences for select
  using (
    exists (
      select 1 from offices
      where offices.id = sequences.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi sekans ekler"
  on sequences for insert
  with check (
    exists (
      select 1 from offices
      where offices.id = sequences.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi sekans günceller"
  on sequences for update
  using (
    exists (
      select 1 from offices
      where offices.id = sequences.office_id
      and offices.user_id = auth.uid()
    )
  );

-- CAMPAIGNS
create policy "Ofis sahibi kampanyaları görür"
  on campaigns for select
  using (
    exists (
      select 1 from offices
      where offices.id = campaigns.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi kampanya ekler"
  on campaigns for insert
  with check (
    exists (
      select 1 from offices
      where offices.id = campaigns.office_id
      and offices.user_id = auth.uid()
    )
  );

create policy "Ofis sahibi kampanya günceller"
  on campaigns for update
  using (
    exists (
      select 1 from offices
      where offices.id = campaigns.office_id
      and offices.user_id = auth.uid()
    )
  );

-- ANALYTICS
create policy "Ofis sahibi analitiği görür"
  on analytics for select
  using (
    exists (
      select 1 from offices
      where offices.id = analytics.office_id
      and offices.user_id = auth.uid()
    )
  );

-- Service role tüm tablolara erişir (webhook'lar için)
-- Bu Supabase'de otomatik — service_role RLS'yi bypass eder
