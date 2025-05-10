require('dotenv').config();
const mysql = require('mysql2/promise');
const fetch = global.fetch;
const API_URL = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?f=m';

async function loadDrinks() {
    // --- Database Connection ---
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    });
    
    const response = await fetch(API_URL);
    const data = await response.json();

    for (const drink of data.drinks) {
        console.log(`Processing Drink: ${drink.strDrink} (ID: ${drink.idDrink})`);

        const drinkSql = `
            INSERT INTO Drinks (
                api_id, name, alternate_name, tags, category, iba_category,
                alcoholic_status, glass_type, instructions, thumbnail_url, image_source_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name), alternate_name = VALUES(alternate_name), tags = VALUES(tags),
                category = VALUES(category), iba_category = VALUES(iba_category),
                alcoholic_status = VALUES(alcoholic_status), glass_type = VALUES(glass_type),
                instructions = VALUES(instructions), thumbnail_url = VALUES(thumbnail_url),
                image_source_url = VALUES(image_source_url);
        `;
        const drinkValues = [
            drink.idDrink, drink.strDrink, drink.strDrinkAlternate, drink.strTags, drink.strCategory,
            drink.strIBA, drink.strAlcoholic, drink.strGlass, drink.strInstructions,
            drink.strDrinkThumb, drink.strImageSource
        ];
        await connection.query(drinkSql, drinkValues); 

        // 2. Process Ingredients and Measures
        for (let i = 1; i <= 15; i++) {
            const ingredientName = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];

            if (!ingredientName) break; // Stop if no more ingredients

            const trimmedIngredientName = ingredientName.trim();
            const trimmedMeasure = measure ? measure.trim() : null;

            if (!trimmedIngredientName) continue; // Skip empty ingredient names

            // 3. Insert Ingredient if it doesn't exist and get its ID
            // Note: DB errors here will crash the script.
            const ingredientSql = 'INSERT IGNORE INTO Ingredients (ingredient_name) VALUES (?)';
            await connection.query(ingredientSql, [trimmedIngredientName]); // No try/catch

            // Note: If SELECT fails or returns no rows, script will crash accessing rows[0].
            const [rows] = await connection.query('SELECT ingredient_id FROM Ingredients WHERE ingredient_name = ?', [trimmedIngredientName]);
            const ingredientId = rows[0].ingredient_id; // Assumes ingredient exists

            // 4. Link Drink and Ingredient in DrinkIngredients table
            // Note: DB errors here will crash the script.
            const linkSql = 'INSERT IGNORE INTO DrinkIngredients (drink_api_id, ingredient_id, measure) VALUES (?, ?, ?)';
            await connection.query(linkSql, [drink.idDrink, ingredientId, trimmedMeasure]); // No try/catch
        }
         console.log(`  -> Finished processing ingredients for ${drink.strDrink}.`);
    } // End of the "for (const drink of data.drinks)" loop

    console.log('\nFinished loading all drinks from the API call.');

    // ========================================
    // --- READING TEST SECTION ---
    // ========================================
    console.log('\n--- Running Read Tests ---');

    // --- Test 1: Find Mojito and print its instructions ---
    const testDrinkId = '11000'; // Mojito's API ID
    console.log(`\n[Test 1] Checking for Drink with api_id = ${testDrinkId} and printing instructions...`);
    // Note: DB errors here will crash the script.
    const [drinkRows] = await connection.query('SELECT api_id, name, instructions FROM Drinks WHERE api_id = ?', [testDrinkId]);
    if (drinkRows.length > 0) {
        const foundDrink = drinkRows[0];
        console.log(`  -> SUCCESS: Found Drink: Name: '${foundDrink.name}', API ID: '${foundDrink.api_id}'`);
        console.log(`  -> Instructions for ${foundDrink.name}:`);
        console.log(foundDrink.instructions ? `     "${foundDrink.instructions}"` : "     (No instructions found in DB)");
    } else {
        console.log(`  -> NOTE: Drink with api_id ${testDrinkId} not found.`); // Changed from warn
    }

    // --- Test 2: Find a specific ingredient (e.g., Light rum) ---
    const testIngredientName = 'Light rum'; // Mojito ingredient
    console.log(`\n[Test 2] Checking for Ingredient: ${testIngredientName}...`);
    // Note: DB errors here will crash the script.
    const [ingredientRows] = await connection.query('SELECT ingredient_id, ingredient_name FROM Ingredients WHERE ingredient_name = ?', [testIngredientName]);
    let testIngredientId = null;
    if (ingredientRows.length > 0) {
        testIngredientId = ingredientRows[0].ingredient_id;
        console.log(`  -> SUCCESS: Found Ingredient:`, ingredientRows[0]);
    } else {
        console.log(`  -> NOTE: Ingredient '${testIngredientName}' not found.`); // Changed from warn
    }

    // --- Test 3: Check the link between the drink and ingredient ---
    console.log(`\n[Test 3] Checking link between Drink ${testDrinkId} and Ingredient '${testIngredientName}'...`);
    if (drinkRows.length > 0 && testIngredientId !== null) {
        // Note: DB errors here will crash the script.
        const [linkRows] = await connection.query(
            'SELECT drink_api_id, ingredient_id, measure FROM DrinkIngredients WHERE drink_api_id = ? AND ingredient_id = ?',
            [testDrinkId, testIngredientId]
        );
        if (linkRows.length > 0) {
            console.log(`  -> SUCCESS: Found link:`, linkRows[0]);
        } else {
            console.log(`  -> NOTE: Link between Drink ${testDrinkId} and Ingredient ${testIngredientId} ('${testIngredientName}') not found.`); // Changed from error
        }
    } else {
        console.log('  -> SKIPPED: Cannot check link because Drink or Ingredient was not found.'); // Changed from warn
    }

    console.log('\n--- Read Tests Finished ---');
    // ========================================
    // --- END OF READING TEST SECTION ---
    // ========================================

    // --- Close Connection ---
    // Note: Moved outside any potential error path from the original try block
    await connection.end();
    console.log('\nDatabase connection closed.');
}


loadDrinks();