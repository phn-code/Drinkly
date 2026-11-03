import { createApp } from './vue.js';
import { api } from './lib.js';

const SEARCH_DEBOUNCE_MS = 300;
const POPULAR_LIMIT = 10;

createApp({
  data() {
    return {
      friends: [],
      people: [],
      search: '',
      activeTab: 'all',
      pending: new Set(),
      placeholder: '/images/profile-placeholder.png',
      searchTimer: null,
    };
  },
  computed: {
    displayedPeople() {
      if (this.activeTab !== 'popular') return this.people;
      return this.people
        .filter((user) => user.popularityRank !== null)
        .sort((a, b) => a.popularityRank - b.popularityRank)
        .slice(0, POPULAR_LIMIT);
    },
  },
  watch: {
    search() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.loadPeople(), SEARCH_DEBOUNCE_MS);
    },
  },
  created() {
    this.loadFriends();
    this.loadPeople();
  },
  methods: {
    async loadFriends() {
      this.friends = await api('/api/friends');
    },
    async loadPeople() {
      this.people = await api(`/api/users?search=${encodeURIComponent(this.search)}`);
    },
    async toggleFriend(user) {
      const wasFriend = user.isFriend;
      this.pending.add(user.id);
      try {
        await api(`/api/friends/${user.id}`, { method: wasFriend ? 'DELETE' : 'PUT' });
        await Promise.all([this.loadFriends(), this.loadPeople()]);
      } catch (err) {
        alert(err.message);
      } finally {
        this.pending.delete(user.id);
      }
    },
  },
}).mount('#app');
