-- پاکسازی سازمان‌های تکراری - نگه‌داشتن فقط اولین سازمان برای هر user
DELETE FROM organizations 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id, name ORDER BY created_at ASC) as rn
    FROM organizations 
    WHERE name = 'سازمان شماره یک'
  ) t
  WHERE t.rn > 1
);