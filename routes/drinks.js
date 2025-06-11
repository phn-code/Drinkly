const express = require('express');
const router = express.Router();
const db = require('../scripts/db');
const axios = require('axios');

//code for inserting new drink
router.post('/',(req,res) => {
    //destructing input
    const{api_id, name, alternate_name, tags, category, iba_category, alcoholic_status, glass_type, instructions, thumbnail_url, image_source_url} = req.body;
    //inserting into database placeholders
    const query = `
    INSERT INTO Drinks(
        api_id, name, alternate_name, tags, category,
        iba_category, alcoholic_status, glass_type,
        instructions, thumbnail_url, image_source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        api_id, name, alternate_name, tags, category,
        iba_category, alcoholic_status, glass_type,
        instructions, thumbnail_url, image_source_url
    ];

    db.query(query,values,(err,result) => {
        if(err){
            console.error('Error inserting drink into database: ',err);
            return res.status(500).json({ error: 'Database fetch failed' });
        }

    });
});

//code for retriveing cocktail based on
router.get('/:id',(req,res) => {
    var api_id = req.params.id;

    db.query('SELECT * FROM Drinks WHERE api_id = ?', [api_id], (err,results) => {
        if(err){
            console.error('Error retrieving drink from database: ',err);
            return res.status(500).json({ error: 'Database fetch failed' });
        }
        if(results.length ===0){
            return res.status(404).json({ message: 'Drink not found' });
        }
        res.json(results[0]);
    });
});

//for edamam
router.post('/api/analyze-nutrition', async (req, res) => {
    const { ingredients } = req.body; // Use let if you plan to keep the test override for a bit

    // --- TEMPORARY TEST CODE (You can remove this now or keep for one more test) ---
    // console.log("Original ingredients from request:", ingredients);
    // ingredients = ["1 large apple", "100g sugar"];
    // console.log("--- SERVER DEBUG: USING TEST INGREDIENTS ---", ingredients);
    // --- END OF TEMPORARY TEST CODE ---


    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: 'Ingredients array is required.' });
    }

    const appId = process.env.EDAMAM_APP_ID;
    const appKey = process.env.EDAMAM_APP_KEY;

    if (!appId || !appKey) {
        console.error('--- SERVER DEBUG: Edamam API credentials missing from .env! ---');
        return res.status(500).json({ error: 'Nutrition service configuration error on server. API keys missing.' });
    }
    console.log("--- SERVER DEBUG: Edamam App ID and Key found ---");

    // REMOVE OR COMMENT OUT THE Edamam-Account-User LOGIC
    // const edamamUserId = req.sessionID; // Or "test_user_12345"
    // if (!edamamUserId) {
    //     console.error("--- SERVER DEBUG: Session ID not available (though not sending header now).");
    //     // return res.status(500).json({ error: 'Server session error, cannot generate user ID.' });
    // }
    // console.log(`--- SERVER DEBUG: NOT Using Edamam-Account-User header based on API response.`);


    const edamamApiUrl = `https://api.edamam.com/api/nutrition-details?app_id=${appId}&app_key=${appKey}`;
    try {
        const edamamPayload = { ingr: ingredients };
        console.log('--- SERVER DEBUG: Sending to Edamam (NO Edamam-Account-User header):', JSON.stringify(edamamPayload));

        const edamamResponse = await axios.post(edamamApiUrl, edamamPayload, {
            headers: {
                'Content-Type': 'application/json'
                // 'Edamam-Account-User': edamamUserId // <<<<<< REMOVE THIS LINE
            }
        });
        console.log('--- SERVER DEBUG: Edamam Response Status:', edamamResponse.status);
        console.log('--- SERVER DEBUG: Edamam Response Data:', JSON.stringify(edamamResponse.data, null, 2));
        res.json(edamamResponse.data);

    } catch (error) {
        console.error('--- SERVER DEBUG: Error proxying to Edamam API:', error.message);
        let errorMsg = 'Failed to get nutritional analysis from external service.';
        let status = 500;
        let responseDetails = null;

        if (error.response) {
            status = error.response.status;
            responseDetails = error.response.data;
            console.error('--- SERVER DEBUG: Edamam Service Error Status:', status);
            // ... (your existing detailed error parsing logic for Edamam errors) ...
            if (typeof responseDetails === 'string' && responseDetails.trim().toLowerCase().startsWith('<!doctype')) {
                // ...
            } else {
                console.error('--- SERVER DEBUG: Edamam Service Error Data (JSON or other):', JSON.stringify(responseDetails, null, 2));
                // ...
            }
        } else if (error.request) { /* ... */ } else { /* ... */ }
        return res.status(status).json({ error: errorMsg, details: (typeof responseDetails === 'object' && responseDetails !== null) ? responseDetails : undefined });
    }
});

module.exports = router;