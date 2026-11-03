import { api, h } from './lib.js';

const form = document.getElementById('search-form');
const box = document.getElementById('searchBox');
const results = document.getElementById('results');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = box.value.trim();
  if (!name) return;
  results.replaceChildren('Searching for drinks...');

  try {
    const drinks = await api(`/api/drinks?search=${encodeURIComponent(name)}`);
    if (drinks.length === 0) {
      results.replaceChildren('No drinks found.');
      return;
    }
    results.replaceChildren(...drinks.map((drink) => {
      const href = `/drinks/${encodeURIComponent(drink.id)}`;
      return h('div', {},
        h('div', { class: 'search-result' },
          h('a', { href }, h('img', { src: drink.thumbnail, alt: drink.name, class: 'drink-image' })),
          h('a', { href, class: 'drink-name' }, drink.name)));
    }));
  } catch (err) {
    results.replaceChildren(`Search failed: ${err.message}`);
  }
});
