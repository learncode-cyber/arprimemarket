
-- Add database constraint on tracking pixel IDs to prevent XSS
ALTER TABLE public.tracking_pixels
ADD CONSTRAINT pixel_id_format 
CHECK (pixel_id ~ '^[A-Za-z0-9_\-.:]{1,80}$');
