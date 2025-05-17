


const app = Vue.createApp({
    data() {
        return {
            test: 'WORKS',
            suggestedPeople: [],
            friends: [],
            searchVal: "",
            timeout: null
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
        this.searchUsers();
    },

    methods: {

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



