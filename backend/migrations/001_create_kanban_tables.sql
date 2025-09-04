-- Migration: Create Kanban tables
-- Safe to re-run; uses IF NOT EXISTS clauses

-- Boards
CREATE TABLE IF NOT EXISTS crm_kanban_board (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  description      TEXT DEFAULT '' NOT NULL,
  owner_id         INTEGER NOT NULL,
  archived         BOOLEAN DEFAULT FALSE NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lists
CREATE TABLE IF NOT EXISTS crm_kanban_list (
  id               SERIAL PRIMARY KEY,
  board_id         INTEGER NOT NULL REFERENCES crm_kanban_board(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  position         INTEGER NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards
CREATE TABLE IF NOT EXISTS crm_kanban_card (
  id               SERIAL PRIMARY KEY,
  board_id         INTEGER NOT NULL REFERENCES crm_kanban_board(id) ON DELETE CASCADE,
  list_id          INTEGER NOT NULL REFERENCES crm_kanban_list(id) ON DELETE CASCADE,
  title            VARCHAR(255) NOT NULL,
  description      TEXT DEFAULT '' NOT NULL,
  due_date         TIMESTAMP WITH TIME ZONE,
  position         INTEGER NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS crm_kanban_comment (
  id               SERIAL PRIMARY KEY,
  card_id          INTEGER NOT NULL REFERENCES crm_kanban_card(id) ON DELETE CASCADE,
  author_id        INTEGER NOT NULL,
  content          TEXT NOT NULL,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_kanban_list_board ON crm_kanban_list(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_card_list ON crm_kanban_card(list_id);
CREATE INDEX IF NOT EXISTS idx_kanban_card_board ON crm_kanban_card(board_id);
CREATE INDEX IF NOT EXISTS idx_kanban_comment_card ON crm_kanban_comment(card_id);