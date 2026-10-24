CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('electronique', 'beaute')),
  type text NOT NULL CHECK (type IN ('telephone', 'parfum', 'soin')),
  description text NOT NULL DEFAULT '',
  price_htg integer NOT NULL DEFAULT 0 CHECK (price_htg >= 0),
  image_url text NOT NULL DEFAULT '',
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO settings (key, value) VALUES ('shopName', 'Bel Achat') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('whatsappNumber', '') ON CONFLICT (key) DO NOTHING;
