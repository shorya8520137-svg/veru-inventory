-- =====================================================
-- Add image_url field to website_categories table
-- =====================================================

-- Add image_url column to categories table
ALTER TABLE `website_categories` 
ADD COLUMN `image_url` VARCHAR(500) NULL AFTER `description`;

-- Add index for image_url field
ALTER TABLE `website_categories` 
ADD INDEX `idx_category_image` (`image_url`);

-- Verify the change
DESCRIBE `website_categories`;

-- =====================================================
-- Migration Complete
-- =====================================================
-- The website_categories table now supports image URLs
-- You can now store category images in the image_url field