-- ============================================================
-- VinylVault — Database Schema (MySQL 8.0)
-- Records are imported from Discogs when users add them
-- ============================================================

CREATE DATABASE IF NOT EXISTS vinylvault;
USE vinylvault;

-- Users
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100),
    bio           TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Condition grading scale
CREATE TABLE condition_types (
    condition_id   INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(30) NOT NULL UNIQUE,
    abbreviation   VARCHAR(5)  NOT NULL UNIQUE,
    sort_order     TINYINT NOT NULL
);

INSERT INTO condition_types (name, abbreviation, sort_order) VALUES
('Mint','M',1),('Near Mint','NM',2),('Very Good Plus','VG+',3),('Very Good','VG',4),
('Good Plus','G+',5),('Good','G',6),('Fair','F',7),('Poor','P',8);

-- Genres
CREATE TABLE genres (
    genre_id   INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO genres (name) VALUES
('Rock'),('Jazz'),('Hip-Hop'),('Electronic'),('R&B/Soul'),('Classical'),
('Pop'),('Blues'),('Country'),('Punk'),('Metal'),('Reggae'),('Folk'),('Latin'),('Soundtrack');

-- Records — only created when a user imports from Discogs
CREATE TABLE records (
    record_id        INT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(300) NOT NULL,
    artist_name      VARCHAR(200) NOT NULL,
    artist_discogs_id VARCHAR(30),
    label_name       VARCHAR(200),
    label_discogs_id VARCHAR(30),
    release_year     SMALLINT,
    catalog_number   VARCHAR(50),
    format           VARCHAR(50) DEFAULT 'LP',
    country          VARCHAR(100),
    notes            TEXT,
    discogs_id       VARCHAR(30) UNIQUE,
    discogs_url      VARCHAR(300),
    cover_image      VARCHAR(500),
    thumb_image      VARCHAR(500),
    community_have   INT DEFAULT 0,
    community_want   INT DEFAULT 0,
    community_rating DECIMAL(3,2),
    lowest_price     DECIMAL(10,2),
    num_for_sale     INT DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_artist (artist_name),
    INDEX idx_discogs (discogs_id)
);

-- Record genres (many-to-many)
CREATE TABLE record_genres (
    record_id INT NOT NULL,
    genre_id  INT NOT NULL,
    PRIMARY KEY (record_id, genre_id),
    FOREIGN KEY (record_id) REFERENCES records(record_id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id)  REFERENCES genres(genre_id) ON DELETE CASCADE
);

-- Tracklists — imported from Discogs
CREATE TABLE tracklists (
    track_id    INT AUTO_INCREMENT PRIMARY KEY,
    record_id   INT NOT NULL,
    position    VARCHAR(10),
    title       VARCHAR(300) NOT NULL,
    duration    VARCHAR(20),
    sort_order  SMALLINT DEFAULT 0,
    FOREIGN KEY (record_id) REFERENCES records(record_id) ON DELETE CASCADE,
    INDEX idx_track_record (record_id)
);

-- User collections — what they own
CREATE TABLE collection_items (
    item_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    record_id      INT NOT NULL,
    condition_id   INT NOT NULL,
    purchase_price DECIMAL(10,2),
    current_value  DECIMAL(10,2),
    purchase_date  DATE,
    notes          TEXT,
    added_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)      REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (record_id)    REFERENCES records(record_id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES condition_types(condition_id),
    UNIQUE KEY uk_user_record (user_id, record_id)
);

-- Wishlists — can store Discogs ID for records not yet imported
CREATE TABLE wishlists (
    wishlist_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    record_id    INT,
    discogs_id   VARCHAR(30),
    title        VARCHAR(300),
    artist_name  VARCHAR(200),
    thumb_image  VARCHAR(500),
    priority     ENUM('Low','Medium','High') DEFAULT 'Medium',
    max_price    DECIMAL(10,2),
    added_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (record_id) REFERENCES records(record_id) ON DELETE SET NULL
);

-- Marketplace — users list collection items for sale
CREATE TABLE marketplace (
    listing_id     INT AUTO_INCREMENT PRIMARY KEY,
    seller_id      INT NOT NULL,
    buyer_id       INT,
    item_id        INT NOT NULL,
    asking_price   DECIMAL(10,2) NOT NULL,
    description    TEXT,
    status         ENUM('Active','Pending','Sold','Cancelled') DEFAULT 'Active',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sold_at        TIMESTAMP NULL,
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id)  REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (item_id)   REFERENCES collection_items(item_id) ON DELETE CASCADE,
    INDEX idx_status (status)
);

-- Views
CREATE OR REPLACE VIEW v_collection_summary AS
SELECT u.user_id, u.username,
    COUNT(ci.item_id) AS total_records,
    COALESCE(SUM(ci.current_value), 0) AS total_value,
    COALESCE(SUM(ci.purchase_price), 0) AS total_invested,
    COALESCE(SUM(ci.current_value) - SUM(ci.purchase_price), 0) AS total_gain
FROM users u LEFT JOIN collection_items ci ON u.user_id = ci.user_id
GROUP BY u.user_id, u.username;

CREATE OR REPLACE VIEW v_genre_distribution AS
SELECT ci.user_id, g.genre_id, g.name AS genre_name, COUNT(*) AS record_count
FROM collection_items ci
JOIN records r ON ci.record_id = r.record_id
JOIN record_genres rg ON r.record_id = rg.record_id
JOIN genres g ON rg.genre_id = g.genre_id
GROUP BY ci.user_id, g.genre_id, g.name;
