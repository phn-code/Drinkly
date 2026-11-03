import { api, h, formatIngredient } from './lib.js';

const params = new URLSearchParams(window.location.search);
const list = {
  name: params.get('name')?.trim() || '',
  description: params.get('description')?.trim() || '',
  iconUrl: params.get('icon') || null,
};
if (!list.name) window.location.replace('/lists');

const results = document.getElementById('results');
const searchBox = document.getElementById('searchBox');
const selected = new Map();

document.getElementById('listTitleDisplay').textContent = `Creating list: ${list.name}`;

function renderSelection() {
  document.getElementById('selectedCount').textContent = selected.size;
  document.getElementById('selectedNames').replaceChildren(...[...selected.values()].map((name) => h('li', {}, name)));
}

function message(text, className = 'info-message') {
  results.replaceChildren(h('p', { class: className }, text));
}

function drinkCard(drink) {
  const card = h('div', { class: `drink-item detailed-card${selected.has(drink.id) ? ' selected' : ''}` },
    drink.thumbnail && h('img', { src: drink.thumbnail, alt: drink.name, class: 'drink-card-image' }),
    h('div', { class: 'drink-card-content' },
      h('h2', {}, drink.name),
      drink.category && h('p', { class: 'drink-card-category' }, h('strong', {}, 'Category:'), ` ${drink.category}`),
      drink.alcoholic && h('p', { class: 'drink-card-alcoholic' }, h('strong', {}, 'Type:'), ` ${drink.alcoholic}`),
      drink.glass && h('p', { class: 'drink-card-glass' }, h('strong', {}, 'Glass:'), ` ${drink.glass}`),
      h('details', { class: 'drink-card-details-toggle' },
        h('summary', {}, 'View Ingredients & Instructions'),
        h('div', { class: 'drink-card-ingredients' },
          h('h3', {}, 'Ingredients:'),
          h('ul', {}, drink.ingredients.map((ingredient) => h('li', {}, formatIngredient(ingredient))))),
        drink.instructions && h('div', { class: 'drink-card-instructions' },
          h('h3', {}, 'Instructions:'),
          h('p', {}, drink.instructions.split(/(?<=[.?!])\s+/).flatMap((line, i) => (i ? [h('br'), line] : [line])))))));

  card.addEventListener('click', (event) => {
    if (event.target.closest('details')) return;
    if (selected.has(drink.id)) selected.delete(drink.id);
    else selected.set(drink.id, drink.name);
    card.classList.toggle('selected', selected.has(drink.id));
    renderSelection();
  });
  return card;
}

document.getElementById('search-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = searchBox.value.trim();
  if (!name) return;
  message('Searching...');
  try {
    const drinks = await api(`/api/drinks?search=${encodeURIComponent(name)}`);
    if (drinks.length === 0) message(`No drinks found for "${name}".`);
    else results.replaceChildren(...drinks.map(drinkCard));
  } catch (err) {
    message(`Search failed: ${err.message}`, 'error-message');
  }
});

const saveButton = document.getElementById('doneBtn');
saveButton.addEventListener('click', async () => {
  if (selected.size === 0) {
    alert('No drinks have been selected to save.');
    return;
  }
  saveButton.disabled = true;
  try {
    await api('/api/lists', { method: 'POST', body: { ...list, drinkIds: [...selected.keys()] } });
    window.location.href = '/lists';
  } catch (err) {
    alert(`Error saving list: ${err.message}`);
    saveButton.disabled = false;
  }
});
