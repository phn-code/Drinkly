document.addEventListener('DOMContentLoaded', () => {
  const openModalBtn = document.getElementById('openCreateListModalBtn');
  const modalOverlay = document.getElementById('createListModal');
  const closeModalBtn = modalOverlay.querySelector('.modal-close-btn');
  const createListForm = document.getElementById('createListForm');
  const pageWrapper = document.querySelector('.page-wrapper');
  // Image selection logic
  const imageOptions = document.querySelectorAll('.default-image-option');
  const selectedListIconInput = document.getElementById('selectedListIcon');
  // const selectedImagePreview = document.getElementById('selectedImagePreview');
  imageOptions.forEach((image) => {
    image.addEventListener('click', () => {
      imageOptions.forEach(img => img.classList.remove('selected'));
      image.classList.add('selected');
      const iconPath = image.dataset.iconPath;
      selectedListIconInput.value = iconPath;
      // selectedImagePreview.style.display = 'none';
      // Optionally show preview
      // selectedImagePreview.innerHTML = `<img src="${iconPath}" alt="Selected Icon" style="max-width: 50px; max-height: 50px; border-radius: 4px;">`;
    });
  });
  // Fetch and render user lists
  fetch('/lists/getUserLists')
    .then(res => res.json())
    .then(lists => {
      const container = document.getElementById('existingLists');
      container.innerHTML = ''; // Clear container
      if (lists.length === 0) {
        container.innerHTML = '<p>You have no drink lists yet.</p>';
        return;
      }

      lists.forEach(list => {
        const card = document.createElement('div');
        card.className = 'list-card';

        card.innerHTML = `
      <img src="${list.list_icon_url}" alt="${list.list_name}" class="list-icon">
      <div class="list-info">
        <h3>${list.list_name}</h3>
        <p>${list.drink_count} drinks</p>
      </div>
      <button class="delete-list-btn">Delete</button>
    `;

        // Click handler for opening drinks modal, except on delete button
        card.addEventListener('click', async (e) => {
          if (e.target.classList.contains('delete-list-btn')) return;

          console.log('List card clicked:', list.list_name);

          const modal = document.getElementById('listDrinksModal');
          const modalTitle = document.getElementById('listDrinksTitle');
          const drinksContainer = document.getElementById('drinksInList');

          modalTitle.textContent = `Drinks in "${list.list_name}"`;
          drinksContainer.innerHTML = '<p>Loading...</p>';
          modal.style.display = 'flex';
          modal.classList.add('active');

          try {
            const res = await fetch(`/lists/${list.list_id}/drinks`);
            const drinks = await res.json();

            console.log('Fetched drinks:', drinks);

            if (!drinks || drinks.length === 0) {
              drinksContainer.innerHTML = '<p>No drinks in this list yet.</p>';
            } else {
              drinksContainer.innerHTML = drinks.map(drink => `
            <div class="drink-card">
              <img src="${drink.strDrinkThumb}" alt="${drink.strDrink}" />
              <p>${drink.strDrink}</p>
            </div>
          `).join('');
            }
          } catch (err) {
            console.error(err);
            drinksContainer.innerHTML = '<p>Failed to load drinks.</p>';
          }
        });

        // Delete button handler
        card.querySelector('.delete-list-btn').addEventListener('click', async (e) => {
          e.stopPropagation();

          try {
            const res = await fetch(`/lists/${list.list_id}`, {
              method: 'DELETE',
              credentials: 'include'
            });

            if (res.ok) {
              card.remove();
            } else {
              console.error('Failed to delete list.');
              alert('Failed to delete list. Please try again.');
            }
          } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting list. Please try again.');
          }
        });

        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error('Failed to fetch lists:', err);
    });
  // Modal open/close functions
  function openModal() {
    modalOverlay.style.display = 'flex';
    setTimeout(() => {
      modalOverlay.classList.add('active');
      pageWrapper.classList.add('blurred');
    }, 10);
  }
  function closeModal() {
    modalOverlay.classList.remove('active');
    pageWrapper.classList.remove('blurred');
    setTimeout(() => {
      modalOverlay.style.display = 'none';
    }, 300);
  }
  if (openModalBtn) {
    openModalBtn.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });
  }
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  // Close drinks modal
  document.querySelector('#listDrinksModal .modal-close-btn').addEventListener('click', () => {
    document.getElementById('listDrinksModal').style.display = 'none';
  });
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        closeModal();
      }
    });
  }
  // Handle create list form submission
  if (createListForm) {
    createListForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(createListForm);
      const listName = formData.get('listName').trim();
      const listDescription = formData.get('listDescription').trim();
      const selectedListIcon = formData.get('selectedListIcon');

      if (!listName) {
        alert('Please enter a List Name.');
        return;
      }

      console.log('Form submitted!');
      console.log('List Name:', listName);
      console.log('Description:', listDescription);
      console.log('Icon:', selectedListIcon);

      try {
        const response = await fetch('/loginUser/storeListDetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ listName, listDescription, selectedListIcon })
        });

        if (response.ok) {
          window.location.href = 'create_list.html';
        } else {
          const error = await response.json();
          alert('Failed to save session data: ' + error.error);
        }
      } catch (err) {
        console.error('Error saving list details:', err);
        alert('Network or server error occurred.');
      }

      closeModal();
      createListForm.reset();
    });
  }
});