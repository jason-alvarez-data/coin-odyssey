# Database Schema Documentation

This directory contains the SQL schema definitions for the Coin Collecting App.

## Schema Files

- `schemas/01_initial_schema.sql`: Initial schema setup with collections, coins, and sharing tables

## Tables

### Collections
Stores user coin collections
- `id`: UUID primary key
- `user_id`: References auth.users
- `name`: Collection name
- `description`: Optional collection description
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### Coins
Stores individual coins within collections
- `id`: UUID primary key
- `collection_id`: References collections
- `denomination`: Coin denomination
- `year`: Year of minting
- `mint_mark`: Optional mint mark
- `grade`: Optional coin grade
- `purchase_price`: Optional purchase price
- `purchase_date`: Optional date of purchase
- `notes`: Optional notes
- `images`: Array of image URLs
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### Collection Shares
Manages collection sharing between users
- `collection_id`: References collections
- `shared_with_user_id`: References auth.users
- `permission_level`: Either 'view' or 'edit'
- `created_at`: Timestamp of creation

## Row Level Security (RLS)

Each table has RLS policies to ensure:
- Users can only access their own collections
- Users can only access coins in their collections
- Users can only access collections shared with them
- Collection owners can manage sharing of their collections