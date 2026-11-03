import { api } from './lib.js';

const forms = {
  login: document.getElementById('login'),
  signup: document.getElementById('signup'),
};

function show(name) {
  for (const [key, form] of Object.entries(forms)) form.hidden = key !== name;
}

document.querySelectorAll('[data-show]').forEach((button) => {
  button.addEventListener('click', () => show(button.dataset.show));
});

function handleSubmit(form, submit) {
  const alert = form.querySelector('.alert-message');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    alert.hidden = true;
    try {
      await submit(new FormData(form));
      window.location.href = '/';
    } catch (err) {
      alert.textContent = err.message;
      alert.hidden = false;
      form.querySelector('input[type="password"]').value = '';
    }
  });
}

handleSubmit(forms.login, (data) => api('/api/auth/login', { method: 'POST', body: Object.fromEntries(data) }));

handleSubmit(forms.signup, (data) => {
  if (data.get('avatar')?.size === 0) data.delete('avatar');
  return api('/api/auth/signup', { method: 'POST', body: data });
});
