import { createApp } from './vue.js';
import { api, formatIngredient } from './lib.js';

const root = document.getElementById('app');
const drinkId = encodeURIComponent(root.dataset.drinkId);

createApp({
  data() {
    return {
      drink: null,
      error: null,
      reviews: [],
      activeTab: 'ingredients',
      showForm: false,
      newReview: '',
      saving: false,
    };
  },
  async created() {
    try {
      [this.drink, this.reviews] = await Promise.all([
        api(`/api/drinks/${drinkId}`),
        api(`/api/drinks/${drinkId}/reviews`),
      ]);
      document.title = `${this.drink.name} - Drinkly`;
    } catch (err) {
      this.error = err.message;
    }
  },
  methods: {
    formatIngredient,
    async submitReview() {
      this.saving = true;
      try {
        await api(`/api/drinks/${drinkId}/reviews`, {
          method: 'POST',
          body: { score: 5, body: this.newReview },
        });
        this.reviews = await api(`/api/drinks/${drinkId}/reviews`);
        this.newReview = '';
        this.showForm = false;
      } catch (err) {
        alert(`Could not save your review: ${err.message}`);
      } finally {
        this.saving = false;
      }
    },
  },
}).mount(root);
