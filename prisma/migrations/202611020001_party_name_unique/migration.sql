-- Rename pre-existing duplicate party names inside a workspace so the unique index can be created.
WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY "workbookId", "name" ORDER BY "createdAt", id) AS rn
  FROM "Party"
)
UPDATE "Party" p
SET "name" = left(p."name", 150) || ' (' || ranked.rn || ')'
FROM ranked
WHERE p.id = ranked.id AND ranked.rn > 1;

-- DropIndex
DROP INDEX "Party_workbookId_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Party_workbookId_name_key" ON "Party"("workbookId", "name");
