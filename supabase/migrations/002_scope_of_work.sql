-- =============================================
-- Artvision CRM: Scope of Work + Blockchain
-- Версионирование договоров с фиксацией в Bitcoin
-- =============================================

-- Scope of Work (основной документ)
CREATE TABLE IF NOT EXISTS scope_of_work (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Содержимое
    title TEXT NOT NULL DEFAULT 'Scope of Work',
    description TEXT,
    
    -- Текущая активная версия
    current_version_id UUID,
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Версии документа
CREATE TABLE IF NOT EXISTS sow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sow_id UUID REFERENCES scope_of_work(id) ON DELETE CASCADE,
    
    -- Номер версии
    version_number INTEGER NOT NULL,
    
    -- Содержимое версии (JSON с услугами/задачами)
    content JSONB NOT NULL,
    -- Пример content:
    -- {
    --   "services": [
    --     {"name": "SEO-продвижение", "description": "...", "deliverables": ["...", "..."]},
    --     {"name": "Контекстная реклама", "description": "...", "deliverables": ["..."]}
    --   ],
    --   "terms": "12 месяцев",
    --   "budget": "50000",
    --   "notes": "Дополнительные условия..."
    -- }
    
    -- Причина изменения (для версий > 1)
    change_reason TEXT,
    
    -- Хеш документа для блокчейна (SHA-256)
    content_hash TEXT NOT NULL,
    
    -- Статус согласования
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    
    -- Метаданные
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Согласования (подписи сторон)
CREATE TABLE IF NOT EXISTS sow_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID REFERENCES sow_versions(id) ON DELETE CASCADE,
    
    -- Кто подписал
    user_id UUID REFERENCES users(id),
    user_email TEXT NOT NULL,
    user_name TEXT,
    
    -- Роль подписанта
    role TEXT NOT NULL CHECK (role IN ('agency', 'client')),
    
    -- Подтверждение
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- IP и User-Agent для аудита
    ip_address TEXT,
    user_agent TEXT,
    
    -- Уникальный токен для подтверждения (для email-ссылок)
    approval_token UUID DEFAULT gen_random_uuid(),
    token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blockchain proofs (фиксация в Bitcoin через OpenTimestamps)
CREATE TABLE IF NOT EXISTS blockchain_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Что фиксируем
    entity_type TEXT NOT NULL CHECK (entity_type IN ('sow_version', 'sow_approval')),
    entity_id UUID NOT NULL,
    
    -- Хеш данных
    data_hash TEXT NOT NULL,
    
    -- OpenTimestamps
    ots_file BYTEA, -- .ots файл
    ots_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (ots_status IN ('pending', 'stamped', 'verified', 'error')),
    
    -- Bitcoin transaction (после подтверждения)
    bitcoin_tx_id TEXT,
    bitcoin_block_height INTEGER,
    bitcoin_block_time TIMESTAMP WITH TIME ZONE,
    
    -- Ссылка на proof
    proof_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE
);

-- Уведомления о согласованиях
CREATE TABLE IF NOT EXISTS sow_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID REFERENCES sow_approvals(id) ON DELETE CASCADE,
    
    -- Способ уведомления
    channel TEXT NOT NULL CHECK (channel IN ('email', 'telegram')),
    
    -- Статус отправки
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Для повторных отправок
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_sow_project ON scope_of_work(project_id);
CREATE INDEX idx_sow_versions_sow ON sow_versions(sow_id);
CREATE INDEX idx_sow_versions_status ON sow_versions(status);
CREATE INDEX idx_sow_approvals_version ON sow_approvals(version_id);
CREATE INDEX idx_sow_approvals_token ON sow_approvals(approval_token);
CREATE INDEX idx_blockchain_proofs_entity ON blockchain_proofs(entity_type, entity_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sow_updated_at
    BEFORE UPDATE ON scope_of_work
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- RLS политики
ALTER TABLE scope_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_notifications ENABLE ROW LEVEL SECURITY;

-- Политики доступа (участники проекта видят SOW)
CREATE POLICY "Users can view SOW for their projects" ON scope_of_work
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agency can manage SOW" ON scope_of_work
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid() AND role = 'agency'
        )
    );

-- Аналогичные политики для версий и согласований
CREATE POLICY "Users can view versions for their projects" ON sow_versions
    FOR SELECT USING (
        sow_id IN (
            SELECT id FROM scope_of_work WHERE project_id IN (
                SELECT project_id FROM project_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view their approvals" ON sow_approvals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their approvals" ON sow_approvals
    FOR UPDATE USING (user_id = auth.uid());
