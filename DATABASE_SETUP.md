# SQL para Popular Tabela de Modelos

Execute o SQL abaixo no seu Supabase para popular a tabela `models` com os modelos que já estão no sistema.

```sql
-- Inserir modelos únicos extraídos dos produtos existentes
INSERT INTO public.models (name, brand, description, views, created_at, updated_at)
SELECT DISTINCT 
  p.name,
  p.brand,
  p.description,
  0 as views,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.models m 
  WHERE m.name = p.name AND m.brand = p.brand
)
ON CONFLICT (name) DO NOTHING;

-- Opcional: Atualizar os produtos para referenciar os modelos
-- Execute apenas se desejar vincular os produtos aos modelos
UPDATE public.products p
SET model_id = m.id
FROM public.models m
WHERE p.name = m.name AND p.brand = m.brand AND p.model_id IS NULL;
```

## Instruções de Execução

1. Acesse o Supabase Console (https://app.supabase.com/)
2. Vá para seu projeto
3. Abra a aba "SQL Editor"
4. Cole o SQL acima
5. Clique em "Run" para executar

## O que este SQL faz?

1. **Primeira query**: Cria registros de modelos a partir dos produtos existentes, evitando duplicatas pelo campo UNIQUE
2. **Segunda query** (opcional): Vincula os produtos aos modelos criados

## Exemplo de Dados

Isso criará modelos como:
- iPhone 14 Pro (Apple)
- Samsung Galaxy S23 (Samsung)
- Xiaomi 13 Pro (Xiaomi)
- Motorola Edge 40 (Motorola)
- E todos os outros modelos únicos da sua loja

## Notas Importantes

- O campo `name` da tabela `models` é UNIQUE, então não há risco de duplicatas
- Depois que executar, você pode começar a usar o campo de busca inteligente de modelos no admin
- Os modelos antigos continuarão funcionando, agora você apenas adicionou a referência de modelo aos produtos
