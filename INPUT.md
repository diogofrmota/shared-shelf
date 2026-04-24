# Application context:
This repository is for a web app created to manage shared lists bettwen users. Users can create "Shelves" where they can have a shared calendar, task list, trips, dates, recipes, track movies, TV shows, and books.

The application is deployed on Vercel free plan. Using Free Neon Postgresql database. No more than 12 Serverless Functions can be added to a Deployment on the free plan.

# UX/UI
Users can create accounts and login. Shelves work like a group, where multiple people can join 1 shelve. And you are able to share the shelve code to join or create a new one. Inside you have multiple tabs.

# Problem
Reverse the colores in the shelf (shelf is the group created where users can share their lists) so they login, select the shelf and then they are inside their shelf. At the moment the header is white and below the header is dark blue. It should be the oposite, dark blue hearder and white background bellow.

In the header it should be
1. Shelf Name
2. Calendar
3. Tasks
4. Date Ideas (Update to this new name instead of Dates)
5. Trips
6. Recipes
7. Media (Now there will only be a Media tab and inside you will have tvshows subtab, movies subtab and books subtab.)

Then on the right have
1. add
2. Settings (now share is inside settings) - inside settings you can only edit shelf name and share shelf. Settings popup ui should follow what it is used in the web app. dont have white text on white background box
3. Profile (same as shelf selection page)
4. Logout (same as shelf selection page)

Ui in the shelf page should follow same as used in login and shelf selection page

# What i expect for the output

Update UI shelf colors as requested.
Dont change colors in login screen and shelf selection screen, i already like it.
Remove shelf image
Change back from left to the right
No longer group in Plan, go and Track media, use it seperate
remove share button, now it is inside settings