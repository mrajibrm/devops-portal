-- Database Initialization for DevOps Portal

-- 1. Create Logical Databases
CREATE DATABASE auth_db;
CREATE DATABASE ticket_db;
CREATE DATABASE audit_log_db;

-- 2. Create Roles (Principle of Least Privilege)
-- Note: In production, passwords should be strong and injected via secrets.
-- Here we use dev placeholders.
CREATE ROLE auth_service_user WITH LOGIN PASSWORD 'auth_pass_123';
CREATE ROLE ticket_service_user WITH LOGIN PASSWORD 'ticket_pass_123';
CREATE ROLE admin_user WITH LOGIN PASSWORD 'admin_pass_secure';

-- 3. Connect to Auth DB and Setup
\c auth_db
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL PRIVILEGES ON SCHEMA public TO auth_service_user;

-- 4. Connect to Ticket DB and Setup
\c ticket_db
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL PRIVILEGES ON SCHEMA public TO ticket_service_user;

-- 5. Connect to Audit DB and Setup
\c audit_log_db
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Audit Table Schema (Immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(50) NOT NULL,
    resource_id VARCHAR(50),
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Revoke Update/Delete to ensure immutability (Append-Only)
REVOKE UPDATE, DELETE ON audit_logs FROM ticket_service_user;
GRANT INSERT, SELECT ON audit_logs TO ticket_service_user;
GRANT SELECT ON audit_logs TO admin_user;
