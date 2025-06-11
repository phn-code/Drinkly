document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('searchBtn');
    const box = document.getElementById('searchBox');
    const results = document.getElementById('results');

    const searchNow = async () => {
    const name = box.value.trim();
    if (!name) return;
    results.innerHTML = 'Searching for drinks...';

    const response = await fetch(`/search?name=${encodeURIComponent(name)}`);
    const data = await response.json();

    if (!data.drinks) {
      results.innerHTML = 'No drinks found.';
      return;
    }

    results.innerHTML = '';
    data.drinks.forEach((drink) => {
      const drinkDiv = document.createElement('div');
      drinkDiv.innerHTML = `
    <div class="search-result">
      <a href="/drinks.html?id=${drink.idDrink}" class="drink-name">${drink.strDrink}</a>
      <a href="/drinks.html?id=${drink.idDrink}">
      <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" class="drink-image">
      </a>
    </div>
  `;

      results.appendChild(drinkDiv);
    });
  };

  btn.addEventListener('click', searchNow);
  box.addEventListener('keypress', (e) => {
    if(e.key === 'Enter'){
        searchNow();
    }
  });
});
