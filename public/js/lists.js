import { api, h } from './lib.js';

const createModal = document.getElementById('createListModal');
const drinksModal = document.getElementById('listDrinksModal');
const pageWrapper = document.querySelector('.page-wrapper');
const listsContainer = document.getElementById('existingLists');
const iconInput = document.getElementById('selectedListIcon');

function setModalOpen(modal, open) {
  modal.classList.toggle('active', open);
  pageWrapper.classList.toggle('blurred', open);
}

for (const modal of [createModal, drinksModal]) {
  modal.querySelector('.modal-close-btn').addEventListener('click', () => setModalOpen(modal, false));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) setModalOpen(modal, false);
  });
}

document.getElementById('openCreateListModalBtn').addEventListener('click', () => setModalOpen(createModal, true));

const iconOptions = document.querySelectorAll('.default-image-option');
iconOptions.forEach((option) => {
  option.addEventListener('click', () => {
    iconOptions.forEach((other) => other.classList.toggle('selected', other === option));
    iconInput.value = option.dataset.icon;
  });
});

async function showDrinks(list) {
  const container = document.getElementById('drinksInList');
  document.getElementById('listDrinksTitle').textContent = `Drinks in "${list.name}"`;
  container.replaceChildren(h('p', {}, 'Loading...'));
  setModalOpen(drinksModal, true);
  try {
    const drinks = await api(`/api/lists/${list.id}/drinks`);
    container.replaceChildren(...(drinks.length === 0
      ? [h('p', {}, 'No drinks in this list yet.')]
      : drinks.map((drink) => h('div', { class: 'drink-card' },
        h('img', { src: drink.thumbnail, alt: drink.name }),
        h('p', {}, drink.name)))));
  } catch (err) {
    container.replaceChildren(h('p', {}, `Failed to load drinks: ${err.message}`));
  }
}

async function deleteList(list, card) {
  if (!confirm(`Delete "${list.name}"?`)) return;
  try {
    await api(`/api/lists/${list.id}`, { method: 'DELETE' });
    card.remove();
    if (!listsContainer.children.length) renderLists([]);
  } catch (err) {
    alert(`Could not delete the list: ${err.message}`);
  }
}

function renderLists(lists) {
  if (lists.length === 0) {
    listsContainer.replaceChildren(h('p', {}, 'You have no drink lists yet.'));
    return;
  }
  listsContainer.replaceChildren(...lists.map((list) => {
    const card = h('div', { class: 'list-card', onclick: () => showDrinks(list) },
      h('img', { src: list.iconUrl || '/images/list-icons/1.jpeg', alt: list.name, class: 'list-icon' }),
      h('div', { class: 'list-info' },
        h('h3', {}, list.name),
        h('p', {}, `${list.drinkCount} drinks`)),
      h('button', {
        type: 'button',
        class: 'delete-list-btn',
        onclick: (event) => {
          event.stopPropagation();
          deleteList(list, card);
        },
      }, 'Delete'));
    return card;
  }));
}

api('/api/lists')
  .then(renderLists)
  .catch((err) => listsContainer.replaceChildren(h('p', {}, `Failed to load lists: ${err.message}`)));
