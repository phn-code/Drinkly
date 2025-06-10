const express = require('express');
const router = express.Router();
const db = require('../scripts/db');

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

module.exports = router;
module.exports = router;
