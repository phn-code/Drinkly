


const app = Vue.createApp({
    data() {
        return {
            test: 'WORKS',
            suggestedPeople: []
        };
    },
    created() {
        fetch('/friends/getRandomUsers', { method: 'GET' }).then((result) => result.json()).then((results) => {
            this.suggestedPeople = results.users;
            console.log(this.suggestedPeople);
        });
    }
  });

let vueinst = app.mount('#body-cont');





// let suggestedPeople = [];



