-- Add status enum type
CREATE TYPE content_status AS ENUM ('draft', 'public', 'private');

-- Add status column to mind_maps table
ALTER TABLE mind_maps 
ADD COLUMN IF NOT EXISTS status content_status DEFAULT 'public';

-- Migrate existing is_public data to status
UPDATE mind_maps SET status = 'public' WHERE is_public = true;
UPDATE mind_maps SET status = 'private' WHERE is_public = false;

-- Add status column to nodes table
ALTER TABLE nodes 
ADD COLUMN IF NOT EXISTS status content_status DEFAULT 'public';

-- Set all existing nodes to public
UPDATE nodes SET status = 'public';

-- Update RLS policies for mind_maps to handle status
DROP POLICY IF EXISTS "mind_maps_select" ON mind_maps;
CREATE POLICY "mind_maps_select" ON mind_maps 
FOR SELECT USING (
  status = 'public' 
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  )
);

DROP POLICY IF EXISTS "mind_maps_insert" ON mind_maps;
CREATE POLICY "mind_maps_insert" ON mind_maps 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mind_maps_update" ON mind_maps;
CREATE POLICY "mind_maps_update" ON mind_maps 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mind_maps_delete" ON mind_maps;
CREATE POLICY "mind_maps_delete" ON mind_maps 
FOR DELETE USING (auth.uid() = user_id);

-- Update RLS policies for nodes to handle status
DROP POLICY IF EXISTS "nodes_select" ON nodes;
CREATE POLICY "nodes_select" ON nodes 
FOR SELECT USING (
  status = 'public'
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM mind_maps mm WHERE mm.id = mind_map_id AND mm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  )
);

DROP POLICY IF EXISTS "nodes_insert" ON nodes;
CREATE POLICY "nodes_insert" ON nodes 
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM mind_maps mm WHERE mm.id = mind_map_id AND mm.status = 'public'
  )
);

DROP POLICY IF EXISTS "nodes_update" ON nodes;
CREATE POLICY "nodes_update" ON nodes 
FOR UPDATE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM mind_maps mm WHERE mm.id = mind_map_id AND mm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "nodes_delete" ON nodes;
CREATE POLICY "nodes_delete" ON nodes 
FOR DELETE USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM mind_maps mm WHERE mm.id = mind_map_id AND mm.user_id = auth.uid()
  )
);

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_mind_maps_status ON mind_maps(status);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
