const MAX_INGREDIENTS = 15;

function parseDrink(raw) {
  const ingredients = [];
  for (let i = 1; i <= MAX_INGREDIENTS; i++) {
    const name = raw[`strIngredient${i}`]?.trim();
    if (!name) break;
    ingredients.push({ name, measure: raw[`strMeasure${i}`]?.trim() || null });
  }
  return {
    id: raw.idDrink,
    name: raw.strDrink,
    alternateName: raw.strDrinkAlternate || null,
    tags: raw.strTags || null,
    category: raw.strCategory || null,
    ibaCategory: raw.strIBA || null,
    alcoholic: raw.strAlcoholic || null,
    glass: raw.strGlass || null,
    instructions: raw.strInstructions || null,
    thumbnail: raw.strDrinkThumb || null,
    imageSource: raw.strImageSource || null,
    ingredients,
  };
}

function createCocktailDb(baseUrl) {
  async function get(endpoint, params) {
    const response = await fetch(`${baseUrl}/${endpoint}?${new URLSearchParams(params)}`);
    if (!response.ok) throw new Error(`TheCocktailDB ${endpoint} returned ${response.status}`);
    const { drinks } = await response.json();
    return Array.isArray(drinks) ? drinks.map(parseDrink) : [];
  }

  return {
    search: (name) => get('search.php', { s: name }),
    lookup: async (id) => (await get('lookup.php', { i: id }))[0] ?? null,
  };
}

async function cacheDrink(db, drink) {
  await db.query(
    `INSERT IGNORE INTO Drinks (
       api_id, name, alternate_name, tags, category, iba_category,
       alcoholic_status, glass_type, instructions, thumbnail_url, image_source_url
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      drink.id, drink.name, drink.alternateName, drink.tags, drink.category, drink.ibaCategory,
      drink.alcoholic, drink.glass, drink.instructions, drink.thumbnail, drink.imageSource,
    ],
  );
}

// Reviews and lists reference Drinks by foreign key, so a drink must be stored locally first.
async function ensureDrinksCached(db, cocktailDb, ids) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const [rows] = await db.query('SELECT api_id FROM Drinks WHERE api_id IN (?)', [unique]);
  const cached = new Set(rows.map((row) => row.api_id));
  const missing = await Promise.all(
    unique.filter((id) => !cached.has(id)).map((id) => cocktailDb.lookup(id)),
  );
  for (const drink of missing) {
    if (drink) {
      await cacheDrink(db, drink);
      cached.add(drink.id);
    }
  }
  return unique.filter((id) => cached.has(id));
}

module.exports = { parseDrink, createCocktailDb, ensureDrinksCached };
