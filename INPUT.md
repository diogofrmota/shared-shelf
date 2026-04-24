# Application context:
This repository is for a web app created to manage shared lists bettwen users. Users can create "Shelves" where they can have a shared calendar, task list, trips, dates, recipes, track movies, TV shows, and books.

The application is deployed on Vercel free plan. Using Free Neon Postgresql database. No more than 12 Serverless Functions can be added to a Deployment on the free plan.

# UX/UI
Users can create accounts and login. Shelves work like a group, where multiple people can join 1 shelve. And you are able to share the shelve code to join or create a new one. Inside you have multiple tabs.

# Problem: 
I am able to register/login. Then in shelve selection i am able to create/join a shelve and i can join a shelve. But after creating one and Clicking to join i am taken to an empty white page, nothing loading.

# What i expect for the output:

Fix code in order to load page after i join the shelve.
This is the shelve logic

**Shelfs logic**
Users create their account, users can have and join multiple shelf. Each shelf has a shelf id(which can be used by other people to join where you can request in settings to generate a new shelf join code that will work for a 1-time join)Inside the specific shelf the text in the browser should be "Shared Shelf - <Name of the shelf>"

**Navigation** 
In the header you should have:
1. Shelf logo - users can edit from profile the shelf logo
2. Shelf name - shelf name that was given when creating the specific shelf (that can be edited from shelf settings
3. Plan button - open tab which is composed of Tasks and Calendar tab
4. Go button - open tab which is composed of Dates, Trips and Recipes tab
5. Media Track button - open tab which is composed of TV Shows, Movies and Books tab
6. + Add
7. Share - It shows shelf id and code
8. Settings (popup where you can manage account settings)
9. Account (Put logount inside the account popup)