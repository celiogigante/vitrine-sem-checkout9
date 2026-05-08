-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Identificação
  sku TEXT NOT NULL UNIQUE,
  
  -- Características físicas
  color TEXT,
  storage TEXT,
  ram TEXT,
  
  -- Condição e defeitos
  condition TEXT NOT NULL DEFAULT 'seminovo',
  specific_defects TEXT,
  
  -- Preço e estoque
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  stock_quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'disponivel',
  
  -- Metadata
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_product_id FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 2. Create index para buscar rápido
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_status ON product_variants(status);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso
CREATE POLICY "product_variants_read" ON product_variants 
  FOR SELECT TO anon, authenticated 
  USING (true);

CREATE POLICY "product_variants_insert" ON product_variants 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE auth.users.id = auth.uid())::boolean = true
  );

CREATE POLICY "product_variants_update" ON product_variants 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE auth.users.id = auth.uid())::boolean = true
  );

CREATE POLICY "product_variants_delete" ON product_variants 
  FOR DELETE TO authenticated 
  USING (
    (SELECT raw_user_meta_data->>'is_admin' FROM auth.users WHERE auth.users.id = auth.uid())::boolean = true
  );

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_product_variants_updated_at ON product_variants;
CREATE TRIGGER trigger_update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variants_updated_at();
