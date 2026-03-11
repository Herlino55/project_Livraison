/*
  # DelivTrack Database Schema

  ## Overview
  This migration creates the complete database schema for DelivTrack, a delivery management application.

  ## New Tables

  ### 1. `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `phone` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  Stores additional user profile information for delivery drivers.

  ### 2. `clients`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text)
  - `phone` (text)
  - `email` (text, optional)
  - `address` (text, optional)
  - `notes` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  Stores client information for delivery recipients.

  ### 3. `deliveries`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `client_id` (uuid, references clients, optional)
  - `reference` (text)
  - `description` (text)
  - `recipient_name` (text)
  - `recipient_phone` (text)
  - `delivery_address` (text)
  - `price` (decimal)
  - `status` (text) - 'pending', 'in_progress', 'delivered', 'failed'
  - `scheduled_date` (timestamptz)
  - `delivered_at` (timestamptz, optional)
  - `notes` (text, optional)
  - `signature` (text, optional) - base64 signature image
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  Stores delivery information and tracking.

  ### 4. `delivery_photos`
  - `id` (uuid, primary key)
  - `delivery_id` (uuid, references deliveries)
  - `photo_url` (text)
  - `photo_type` (text) - 'product' or 'proof'
  - `created_at` (timestamptz)
  
  Stores photos for product images and delivery proof.

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Policies for authenticated users to manage their deliveries, clients, and photos
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text DEFAULT '',
  address text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  client_id uuid REFERENCES clients ON DELETE SET NULL,
  reference text NOT NULL,
  description text DEFAULT '',
  recipient_name text NOT NULL,
  recipient_phone text NOT NULL,
  delivery_address text NOT NULL,
  price decimal(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  scheduled_date timestamptz NOT NULL,
  delivered_at timestamptz,
  notes text DEFAULT '',
  signature text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT status_check CHECK (status IN ('pending', 'in_progress', 'delivered', 'failed'))
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deliveries"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deliveries"
  ON deliveries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deliveries"
  ON deliveries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create delivery_photos table
CREATE TABLE IF NOT EXISTS delivery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES deliveries ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text NOT NULL DEFAULT 'product',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT photo_type_check CHECK (photo_type IN ('product', 'proof'))
);

ALTER TABLE delivery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of own deliveries"
  ON delivery_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = delivery_photos.delivery_id
      AND deliveries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos for own deliveries"
  ON delivery_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = delivery_photos.delivery_id
      AND deliveries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own deliveries"
  ON delivery_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = delivery_photos.delivery_id
      AND deliveries.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_user_id ON deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_date ON deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_delivery_photos_delivery_id ON delivery_photos(delivery_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();