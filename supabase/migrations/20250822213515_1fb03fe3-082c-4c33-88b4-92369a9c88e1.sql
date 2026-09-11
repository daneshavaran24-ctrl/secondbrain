-- Fix security issue: Remove redundant delegation_task_attachments view
-- This view is unnecessary since we have a table with the same name
-- and it's causing security linter warnings

DROP VIEW IF EXISTS public.delegation_task_attachments;