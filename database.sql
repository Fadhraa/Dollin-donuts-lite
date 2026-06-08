-- Database Schema for Dollin Donuts (PHP Native Migration)
-- Target Database: dollin_donuts

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `branch_stocks`;
DROP TABLE IF EXISTS `package_items`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `branches`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Create Branches Table
CREATE TABLE `branches` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(255) NOT NULL,
  `alamat` TEXT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `latitude` VARCHAR(255) NULL,
  `longitude` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create Users Table
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'client',
  `branch_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create Products Table
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `kode_produk` VARCHAR(255) NOT NULL UNIQUE,
  `nama` VARCHAR(255) NOT NULL,
  `harga` DECIMAL(12, 2) NOT NULL,
  `stok` INT NOT NULL DEFAULT 0,
  `deskripsi` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_favorite` TINYINT(1) NOT NULL DEFAULT 0,
  `is_new` TINYINT(1) NOT NULL DEFAULT 0,
  `tipe` VARCHAR(50) NOT NULL DEFAULT 'satuan', -- 'satuan', 'paket'
  `kategori` VARCHAR(50) NOT NULL DEFAULT 'donuts', -- 'donuts', 'mochi', 'pastry', 'beverage'
  `gambar` VARCHAR(255) NULL,
  `jumlah_pilihan` INT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Package Items Pivot Table
CREATE TABLE `package_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `package_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`package_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create Branch Stocks Table
CREATE TABLE `branch_stocks` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `branch_id` BIGINT UNSIGNED NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `product_branch_unique` (`product_id`, `branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create Orders Table
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `id_pesanan` VARCHAR(255) NOT NULL UNIQUE,
  `nama` VARCHAR(255) NOT NULL,
  `nohp` VARCHAR(50) NOT NULL,
  `alamat` TEXT NOT NULL,
  `latitude` VARCHAR(255) NULL,
  `longitude` VARCHAR(255) NULL,
  `total` INT NOT NULL,
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `order_status` VARCHAR(50) NOT NULL DEFAULT 'Menunggu Konfirmasi',
  `payment_method` VARCHAR(50) NULL,
  `delivery_method` VARCHAR(50) NOT NULL DEFAULT 'pickup',
  `delivery_fee` INT NOT NULL DEFAULT 0,
  `delivery_status` VARCHAR(50) NULL,
  `branch_id` BIGINT UNSIGNED NULL,
  `courier_id` BIGINT UNSIGNED NULL,
  `snap_token` VARCHAR(255) NULL,
  `midtrans_transaction_id` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`courier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create Order Items Table
CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `qty` INT NOT NULL,
  `harga` INT NOT NULL,
  `tipe` VARCHAR(50) NOT NULL,
  `isi_paket` TEXT NULL, -- JSON format list of selected donut IDs
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- SEED DATA
-- ====================================================

-- Seed Branches
INSERT INTO `branches` (`id`, `nama`, `alamat`, `is_active`, `latitude`, `longitude`) VALUES
(1, 'Dollin Merr Rungkut', 'Jl. Gn. Anyar Lor Gg. III No.31b, Gn. Anyar, Kec. Gn. Anyar, Surabaya, Jawa Timur 60294', 1, '-7.334543', '112.788533'),
(2, 'Dollin Sudirman', 'Jl. Putat Jaya Lebar C No. 11, Putat Jaya, Kec. Sawahan, Surabaya, Jawa Timur 61322', 1, '-7.266205', '112.723049');

-- Seed Users (Passwords are hashed 'owner_123', 'dollin_123', 'zyvaratech123')
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `branch_id`) VALUES
(1, 'Owner Dollin Donuts', 'owner@dollindonuts.com', '$2y$10$waSMn8F6hgP3KsrQYqb2Eu6LTJtxTrg4b/7rDEJl3Xw5Pjg7BhG9K', 'super_admin', NULL),
(2, 'Admin Dollin 1', 'dollin_admin1@gmail.com', '$2y$10$f2hUfxMXP3UAXR2A4jqC9.Twt8txv73yWesvy5hvuqhYFRl2QyJKC', 'staff', 1),
(3, 'Admin Dollin 2', 'dollin_admin2@gmail.com', '$2y$10$f2hUfxMXP3UAXR2A4jqC9.Twt8txv73yWesvy5hvuqhYFRl2QyJKC', 'staff', 2),
(4, 'Dollin Donuts Admin', 'dollin_donuts@gmail.com', '$2y$10$f2hUfxMXP3UAXR2A4jqC9.Twt8txv73yWesvy5hvuqhYFRl2QyJKC', 'client', NULL),
(5, 'ZyvaraTech Admin', 'zyvaratech.id@gmail.com', '$2y$10$OOpXQ7szKJCvT4iqaDN4KO5uXz9MWhZbwWAHvw2EoVSv9fcY4o7Lm', 'developer', NULL);

-- Seed Products
INSERT INTO `products` (`id`, `kode_produk`, `nama`, `harga`, `stok`, `deskripsi`, `is_active`, `is_favorite`, `is_new`, `tipe`, `kategori`, `gambar`, `jumlah_pilihan`) VALUES
(1, 'DNT-CLASS', 'Classic Glazed', 10000.00, 100, 'Donat klasik lembut dengan balutan gula halus premium.', 1, 1, 0, 'satuan', 'donuts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1170&auto=format&fit=crop', NULL),
(2, 'DNT-CHOCO', 'Chocolate Double', 12000.00, 80, 'Cokelat melimpah di luar dan di dalam.', 1, 1, 0, 'satuan', 'donuts', 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1170&auto=format&fit=crop', NULL),
(3, 'MCH-MATCHA', 'Mochi Matcha', 15000.00, 50, 'Mochi lembut khas Jepang dengan isian matcha premium.', 1, 0, 1, 'satuan', 'mochi', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=1170&auto=format&fit=crop', NULL),
(4, 'PKT-HALF', 'Paket Half Dozen (Isi 6)', 65000.00, 50, 'Pilih 6 varian donat favorit Anda dalam satu box hemat.', 1, 1, 0, 'paket', 'donuts', 'https://images.unsplash.com/photo-1612240498936-65f5101365d2?q=80&w=1170&auto=format&fit=crop', 6);

-- Seed Package Items (Which products are available to choose from for the box)
INSERT INTO `package_items` (`package_id`, `product_id`) VALUES
(4, 1),
(4, 2);

-- Seed Branch Stocks
INSERT INTO `branch_stocks` (`product_id`, `branch_id`, `stock`) VALUES
(1, 1, 50),
(1, 2, 45),
(2, 1, 30),
(2, 2, 25),
(3, 1, 20),
(3, 2, 15);
