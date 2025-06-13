# Group Repository for COMP SCI 2207/7207 Web & Database Computing Web Application Project (2023 Semester 1) 

Your group's shared repository for the WDC 2023 Web App Project. 

Auto commit/push/sync to Github is disabled by default in this repository.  
- Enable the GitDoc extension to use this fucntionality (either in your VSCode settings, or in the Dev Container settings) 

See [HERE](https://myuni.adelaide.edu.au/courses/85266/pages/2023-web-application-group-project-specification) for the project specification.

We recommend using the 'Shared Repository Model (Branch & Pull)' to collaborate on your work in this single repostory.
- You can read more about collaborating on GitHub repositories [HERE](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests)
- When working on the same file at the same time, the 'Live Share' feature in VSCode can also help.

---------------------------------------------------------------------------------------------------------------------------------------------------------
Our WDC project, Drinkly, is a web application created for individuals with a passion for drinks and a hobby of creating them. The functionalities of Drinkly are thereby implemented to support users through their drink-related interests, from discovering and creating to fostering connections with other drink enthusiasts. On the main page, users can search for different drinks using the search function, which can showcase information cards containing details of the drink. This includes the required ingredients, instructions, a general rating, and a review section. On the info cards, users can also leave a rating and use the review button to comment and share with the public. 

The application also enables users to generate personalised drink lists through a separate interface that supports easy click-and-save interactions. This allows them to group different drinks by themes, taste, and personal categories that are then saved within their profiles. Furthermore, users can also follow others on Drinkly to connect and make friends. Users can view the lists of their friends to share ideas, reviews, and thoughts with each other. Additionally, the team intends to create another interface dedicated for users to journal their journey whilst creating drinks. This interface will allow text inputs and timeline layout to support experimentation and documentation. Altogether, Drinkly aims to be a platform that brings everything together for drink enthusiasts that can accommodate their interests. Whether it be discovering recipes or sharing with others, the application offers a simple and intuitive space to engage with what they love. 

setup instructions: 
git clone https://github.com/UAdelaide/25S1_WDC_UG_Groups_33 
set up database with: 
    - mysql -u root -p
    - CREATE DATABASE Drinkly;
    - USE Drinkly;
    - EXIT;
    -  mysql -u root -p Drinkly < drinkly_db.sql
    - mysql -u root -p Drinkly < v3db.sql
check package.json and install all dependencies with npm install
npm start
setup done, go to http://localhost:3000 or whatever port you're running in

List of features and functionality: 
    Drink Search Functionality
        Users can search drinks by name.
        Results show drink cards with image, ingredients, instructions, and rating.

    Drink Detail View
        Clicking a drink shows a dedicated page with full info.
        Includes a reviews section and overall drink rating.
        Users can leave a comment or review.

    Custom Drink Lists
        Users can create personalized drink lists (like Spotify playlists).
        Lists include a name, description, icon, and drink selections.
        Lists are saved to the user profile.
        Lists viewable under a dedicated "lists" tab.

    Friend System
        Users can search for friends and follow/unfollow others.
        View friends and their lists.
        Social interaction supported via following and exploring drink ideas.

    Authentication System
        Secure registration and login using bcrypt password hashing.
        Session management using Express sessions.
        Middleware to protect authenticated routes.

    Dark Mode Toggle
        Users can switch between light and dark mode.

Known bugs or limitations: 
- none that we are aware of 

