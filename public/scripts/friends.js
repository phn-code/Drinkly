


const app = Vue.createApp({
    data() {
        return {
            test: 'WORKS',
            suggestedPeople: [],
            friends: [],
            searchVal: "",
            timeout: null,
            activeTab: "all",
            topN: 10

        };
    },
    watch: {
        searchVal(newVal) {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.searchUsers();
            }, 300);
        }
    },
    created() {
        // fetch('/friends/getRandomUsers', { method: 'GET' }).then((result) => result.json()).then((results) => {
        //     this.suggestedPeople = results.users;
        //     console.log(this.suggestedPeople);
        // });
        this.getFriends();
        // this.searchUsers();
    },
    computed: {
        displayedPeople() {
            if (this.activeTab === 'popular') {
                return [...this.suggestedPeople].filter((u) => u.ranking !== null).sort((a, b) => a.ranking - b.ranking).slice(0, this.topN);
            }
            return this.suggestedPeople;
        }
    },

    methods: {


        // bufferToBase64(buffer) {
        //     // if (!this.p_image) return '';

        //     console.log("BUFFER: ", buffer);
        //     let binary = '';
        //     let bytes = new Uint8Array(buffer);
        //     let len = bytes.byteLength;
        //     for (let i = 0; i < len; i++) {
        //         binary += String.fromCharCode(bytes[i]);
        //     }
        //     return `data:image/png;base64,${btoa(binary)}`;
        // },

        getFriends() {
            fetch(`friends/getFriends`, { method: 'GET' }).then((result) => result.json()).then((results) => {
                this.friends = results.users;
                // console.log(this.suggestedPeople);
                this.friends = results.users.map((user) => ({
                    ...user,
                    isProcessing: false
                }));
                this.searchUsers();
            });
        },

        searchUsers() {
            fetch(`friends/searchUsers?search=${encodeURIComponent(this.searchVal)}`, { method: 'GET' }).then((result) => result.json()).then((results) => {
                this.suggestedPeople = results.users;
                console.log(this.suggestedPeople);
                this.suggestedPeople = results.users.map((user) => ({
                    ...user,
                    isProcessing: false
                }));
            });

        },


        toggleFriend(userID, isFriend) {
            console.log("Current Friend ID: " , userID, ", is the clicked person a friend : ", isFriend);
            const clickedUser = this.suggestedPeople.find((user) => user.id === userID);

            clickedUser.isProcessing = true;
            fetch('friends/toggleFriend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ friend: userID, removing: isFriend })
            }).then(() => {
                clickedUser.isFriend = !clickedUser.isFriend;
                clickedUser.isProcessing = false;
            }).catch((error) => console.error("Error: ", error)).finally(() => {
                clickedUser.isProcessing = false;
            });

            this.getFriends();
        }
    }


  });

let vueinst = app.mount('#body-cont');





// let suggestedPeople = [];



