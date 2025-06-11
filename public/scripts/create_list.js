// public/scripts/create_list.js
document.addEventListener('DOMContentLoaded', () => {
let currentListName = 'My New List'; // Default or placeholder
let currentListDescription = '';   // Default
let currentListIconUrl = null;     // Default
// ... (all your existing const declarations for elements) ...
const listTitleDisplay = document.getElementById('listTitleDisplay');
const searchBtn = document.getElementById('searchBtn');
const searchBox = document.getElementById('searchBox');
const resultsDiv = document.getElementById('results');
const closeBtn = document.getElementById('closeBtn');
const doneBtn = document.getElementById('doneBtn');
const selectedDrinkIds = new Set();
const selectedCountSpan = document.getElementById('selectedCount');
const selectedDrinkNames = new Map();
const selectedNamesList = document.getElementById('selectedNames');
// ... (getListDetails, updateSelectedCountDisplay, closeBtn, doneBtn logic remains the same) ...
(async () => {
     try {
        const response = await fetch('/loginUser/getListDetails', { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            if (data.listName) {
                listTitleDisplay.textContent = `Creating list: ${data.listName}`;
                currentListName = data.listName; // Store it
                currentListDescription = data.listDescription || ''; // Store it
                currentListIconUrl = data.selectedListIcon || null; // Store it
            } else {
                listTitleDisplay.textContent = 'Creating New List';
            }
        } else {
            listTitleDisplay.textContent = 'Creating New List (Name N/A)';
        }
    } catch (err) {
        listTitleDisplay.textContent = 'Creating New List (Fetch Error)';
    }
})();

function updateSelectedCountDisplay() {
    selectedCountSpan.textContent = selectedDrinkIds.size;
    selectedNamesList.innerHTML = '';
    selectedDrinkIds.forEach(id => {
        const name = selectedDrinkNames.get(id);
        if (name) {
            const li = document.createElement('li');
            li.textContent = name;
            selectedNamesList.appendChild(li);
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        window.location.href = '/lists.html';
    });
}

if (doneBtn) {
    doneBtn.addEventListener('click', async () => {
        if (selectedDrinkIds.size === 0) {
            alert("No drinks have been selected to save.");
            return;
        }

        if (!currentListName || currentListName.trim() === '') {
            alert("Please ensure your list has a name.");
            // Potentially focus on a list name input field if you have one
            return;
        }

        const selectedDrinks = Array.from(selectedDrinkIds).map(id => ({ id }));
        resultsDiv.innerHTML = '<p class="info-message">Saving list...</p>';

        // --- CONSTRUCT THE FULL PAYLOAD ---
        const payload = {
            listName: currentListName.trim(), // Use the stored/retrieved list name
            description: currentListDescription ? currentListDescription.trim() : null,
            listIconUrl: currentListIconUrl || null, // Send null if not set
            selectedDrinks: selectedDrinks
        };

        console.log("CLIENT: Sending to /lists/saveFullList:", JSON.stringify(payload)); // DEBUG

        try {
            const response = await fetch('/lists/saveFullList', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload) // <<< SEND THE FULL PAYLOAD
            });
            const data = await response.json();
            if (response.ok) {
                alert('List saved successfully!');
                window.location.href = '/lists.html';
            } else {
                alert('Error saving list: ' + (data.error || 'Unknown server error'));
                // Re-enable search or provide other UI feedback
                if (searchBox.value.trim()) performSearch();
                else resultsDiv.innerHTML = '<p class="info-message">Save failed. You can try searching again or check the selected drinks.</p>';
            }
        } catch (err) {
            console.error("Network or server error saving list:", err);
            alert('Something went wrong while saving the list.');
            if (searchBox.value.trim()) performSearch();
            else resultsDiv.innerHTML = '<p class="info-message">Save failed due to a network error. You can try searching again.</p>';
        }
    });
}


async function performSearch() {
    const name = searchBox.value.trim();
    if (!name) {
        resultsDiv.innerHTML = '<p class="info-message">Please enter a drink name to search.</p>';
        return;
    }
    resultsDiv.innerHTML = '<p class="info-message">Searching...</p>';
    try {
        const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(name)}`);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        const data = await response.json();

        if (!data.drinks) {
            resultsDiv.innerHTML = `<p class="info-message">No drinks found for "${name}".</p>`;
            return;
        }

        resultsDiv.innerHTML = ''; // Clear previous results
        data.drinks.forEach(drink => {
            if (!drink || !drink.idDrink || !drink.strDrink) return;

            const drinkDiv = document.createElement('div');
            drinkDiv.classList.add('drink-item', 'detailed-card'); // Add 'detailed-card' for new styling
            drinkDiv.dataset.drinkId = drink.idDrink;
            if (selectedDrinkIds.has(drink.idDrink)) {
                drinkDiv.classList.add('selected');
            }

            // --- MODIFIED HTML Structure for more details ---
            let ingredientsListHtml = '<ul>';
            for (let i = 1; i <= 15; i++) {
                const ingredient = drink[`strIngredient${i}`];
                const measure = drink[`strMeasure${i}`];
                if (ingredient && ingredient.trim()) {
                    ingredientsListHtml += `<li>${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}</li>`;
                } else {
                    break;
                }
            }
            ingredientsListHtml += '</ul>';

            drinkDiv.innerHTML = `
                <img src="${drink.strDrinkThumb ? drink.strDrinkThumb : '/list_default_photos/placeholder_drink.png'}" alt="${drink.strDrink}" class="drink-card-image">
                <div class="drink-card-content">
                    <h2>${drink.strDrink}</h2>
                    ${drink.strCategory ? `<p class="drink-card-category"><strong>Category:</strong> ${drink.strCategory}</p>` : ''}
                    ${drink.strAlcoholic ? `<p class="drink-card-alcoholic"><strong>Type:</strong> ${drink.strAlcoholic}</p>` : ''}
                    ${drink.strGlass ? `<p class="drink-card-glass"><strong>Glass:</strong> ${drink.strGlass}</p>` : ''}

                    <details class="drink-card-details-toggle">
                        <summary>View Ingredients & Instructions</summary>
                        <div class="drink-card-ingredients">
                            <h3>Ingredients:</h3>
                            ${ingredientsListHtml}
                        </div>
                        ${drink.strInstructions ? `
                            <div class="drink-card-instructions">
                                <h3>Instructions:</h3>
                                <p>${drink.strInstructions.split(/(?<=[.?!])\s+/).filter(s => s.trim()).join('<br>')}</p>
                            </div>
                        ` : ''}
                    </details>
                </div>
            `;
            // --- END OF MODIFIED HTML ---

            drinkDiv.addEventListener('click', (event) => {
                // Prevent click on details/summary from toggling selection if desired
                if (event.target.closest('details')) {
                     // If you want to allow selection even when clicking details, remove this block
                    return;
                }

                const drinkId = drink.idDrink;
                const drinkName = drink.strDrink;
                if (selectedDrinkIds.has(drinkId)) {
                    selectedDrinkIds.delete(drinkId);
                    selectedDrinkNames.delete(drinkId);
                    drinkDiv.classList.remove('selected');
                } else {
                    selectedDrinkIds.add(drinkId);
                    selectedDrinkNames.set(drinkId, drinkName);
                    drinkDiv.classList.add('selected');
                }
                updateSelectedCountDisplay();
            });
            resultsDiv.appendChild(drinkDiv);
        });
    } catch (err) {
        console.error("Error during search:", err);
        resultsDiv.innerHTML = '<p class="error-message">Search failed. Please try again.</p>';
    }
}

if (searchBtn && searchBox) {
    searchBtn.addEventListener('click', performSearch);
    searchBox.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });
}

updateSelectedCountDisplay();
});