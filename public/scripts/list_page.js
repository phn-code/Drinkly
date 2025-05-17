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
            }

            closeModal();
            createListForm.reset();
        });
    }


});
