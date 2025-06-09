CREATE DATABASE IF NOT EXISTS Drinkly;
USE Drinkly;

CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Follows (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Ingredients (
    ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
    ingredient_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL
);

CREATE TABLE IF NOT EXISTS Drinks (
    api_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    alternate_name VARCHAR(150) NULL,
    tags VARCHAR(255) NULL,
    category VARCHAR(100) NULL,
    iba_category VARCHAR(100) NULL,
    alcoholic_status VARCHAR(50) NULL,
    glass_type VARCHAR(100) NULL,
    instructions TEXT NULL,
    thumbnail_url VARCHAR(255) NULL,
    image_source_url VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS DrinkReview (
    drink_review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    drink_api_id VARCHAR(50) NOT NULL,
    times_drunk INT DEFAULT 1 NOT NULL,
    review_score TINYINT NOT NULL CHECK (review_score >= 0 AND review_score <= 5),
    review_text TEXT NULL,
    drink_review_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (drink_api_id) REFERENCES Drinks(api_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS DrinkIngredients (
    drink_api_id VARCHAR(50) NOT NULL,
    ingredient_id INT NOT NULL,
    measure VARCHAR(100) NULL,

    PRIMARY KEY (drink_api_id, ingredient_id),

    FOREIGN KEY (drink_api_id) REFERENCES Drinks(api_id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS UserLists (
    list_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    list_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    list_icon_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id, list_name)
);

CREATE TABLE IF NOT EXISTS UserListDrinks (
    list_id INT NOT NULL,
    drink_api_id VARCHAR(50) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (list_id, drink_api_id),
    FOREIGN KEY (list_id) REFERENCES UserLists(list_id) ON DELETE CASCADE,
    FOREIGN KEY (drink_api_id) REFERENCES Drinks(api_id) ON DELETE CASCADE
);

