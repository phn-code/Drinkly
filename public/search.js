document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('searchBtn');
    const box = document.getElementById('searchBox');
    const results = document.getElementById('results');

    const searchNow = async () => {
    const name = box.value.trim();
    if (!name) return;
    results.innerHTML = 'Searching at da mommnent...';

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
        <h2><a href="/drink/${drink.idDrink}">${drink.strDrink}</a></h2>
        <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" width="200">
        <hr>
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
