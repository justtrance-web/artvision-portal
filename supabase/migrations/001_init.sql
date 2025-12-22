-- Artvision Portal Database Schema
-- Supabase Migration

-- Клиенты
CREATE TABLE clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT,
    type TEXT NOT NULL, -- dental, legal, ecommerce, industrial, etc
    status TEXT NOT NULL DEFAULT 'presale', -- active, presale, archived
    telegram_chat_id BIGINT,
    portal_token TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Отчёты
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES clients(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- monthly, audit, proposal, tz
    file_url TEXT,
    month TEXT, -- 2025-01
    status TEXT DEFAULT 'draft', -- draft, sent, approved
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Позиции в поиске
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES clients(id),
    keyword TEXT NOT NULL,
    position INTEGER,
    url TEXT,
    search_engine TEXT DEFAULT 'yandex',
    region TEXT DEFAULT 'spb',
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Метрики
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES clients(id),
    date DATE NOT NULL,
    visitors INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    calls INTEGER DEFAULT 0,
    source TEXT, -- organic, direct, paid
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Пользователи портала (клиенты)
CREATE TABLE portal_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES clients(id),
    telegram_id BIGINT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'client', -- client, manager, admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Уведомления
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT REFERENCES clients(id),
    type TEXT NOT NULL, -- report_ready, position_change, new_lead
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_positions_client ON positions(client_id);
CREATE INDEX idx_positions_date ON positions(checked_at);
CREATE INDEX idx_metrics_client ON metrics(client_id);
CREATE INDEX idx_metrics_date ON metrics(date);
CREATE INDEX idx_reports_client ON reports(client_id);

-- RLS политики
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Начальные данные
INSERT INTO clients (id, name, domain, type, status) VALUES
('tvorim', 'Творим Совершенство', 'tvorimsovershenstvo.ru', 'dental', 'active'),
('atribeaute', 'Atribeaute Clinique', 'atribeaute.ru', 'dental', 'active'),
('ant', 'ANT Partners', 'ant-partners.ru', 'legal', 'active'),
('vlpco', 'VLPCo', 'vlpco.ru', 'ecommerce', 'active'),
('burenie', 'Бурение скважин', 'burenie-skv.ru', 'industrial', 'active'),
('escooter', 'Электросамокаты СПб', NULL, 'repair', 'presale'),
('geely', 'Geely A2Auto', 'geely-a2auto.ru', 'automotive', 'presale'),
('jivo', 'Jivo Medical', NULL, 'partnership', 'presale');
