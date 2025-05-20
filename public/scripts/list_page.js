// js/list_page.js
console.log("JS is loaded");

document.addEventListener('DOMContentLoaded', () => {
    const openModalBtn = document.getElementById('openCreateListModalBtn');
    const modalOverlay = document.getElementById('createListModal');
    const closeModalBtn = modalOverlay.querySelector('.modal-close-btn');
    const createListForm = document.getElementById('createListForm');
    const pageWrapper = document.querySelector('.page-wrapper');

    //image logic
    const imageOptions = document.querySelectorAll('.default-image-option');
    const selectedListIconInput = document.getElementById('selectedListIcon');
    // const selectedImagePreview = document.getElementById('selectedImagePreview');
    imageOptions.forEach((image) => {
        image.addEventListener('click', () => {
            imageOptions.forEach((img) => img.classList.remove('selected'));
            image.classList.add('selected');
            const iconPath = image.dataset.iconPath;
            selectedListIconInput.value = iconPath;
            selectedImagePreview.style.display = 'none';

            // // Show image preview
            // selectedImagePreview.innerHTML = `<img src="${iconPath}" alt="Selected Icon" style="max-width: 50px; max-height: 50px; border-radius: 4px;">`;
        });
    });

    fetch('/lists/getUserLists')
    .then(res => res.json())
    .then(lists => {
        const container = document.getElementById('existingLists');
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
            `;
            card.addEventListener('click', () => {
                // Placeholder for future implementation
                alert(`List "${list.list_name}" clicked. Open detail view here.`);
            });
            container.appendChild(card);
        });
    })
    .catch(err => {
        console.error('Failed to fetch lists:', err);
    });


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

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
    }

    if (createListForm) {
        createListForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(createListForm);

            const listName = formData.get('listName').trim();

            console.log('Form submitted!');
            console.log('List Name:', listName);
            console.log('Description:', formData.get('listDescription'));
            console.log('Icon File:', formData.get('listIcon'));

            if (listName) {
                window.location.href = 'searchDemo.html';
            } else {
                alert('Please enter a List Name.');
            const listDescription = formData.get('listDescription').trim();
            const selectedListIcon = formData.get('selectedListIcon');

            if (!listName) {
                alert('Please enter a List Name.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/loginUser/storeListDetails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ listName, listDescription, selectedListIcon })
                });

                if (response.ok) {
                    window.location.href = 'searchDemo.html';
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
    }


});
