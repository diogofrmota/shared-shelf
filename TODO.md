**In Login Page** - CHECK IF IMPLEMENTED
In the login page for the app users should be able to register/ sign-in. Using both an email to register or use Google/Apple SSO. When creating account add an input validation feedback in real-time (e.g., "Username must be at least 4 characters")
In the login page please change add a "Remember me" checkbox, Include a "Forgot password?" link

After sign in then you go to a screen like when you enter netflix with profiles but in this case its "shelfs", where you see your shelfs horizontly, squares from left to right, where the last square in an empty square with add written where you can add a new shelf. Bellow you have a rectangle box with "Join a Shelf". If you click it, it asks for shelf id and code.

Also in the login page add a tag line like "Organize your life, together. Create your shared calendar, mark your favorite dating spots, favourite recipes and track your movies, tv shows and books."

---

**Shelfs logic** - CHECK IF IMPLEMENTED
Please change how shelfs exist in the app. Users create their account, users can have and join multiple shelf. Each shelf has a shelf id(which can be used by other people to join where you can request in settings to generate a new shelf join code that will work for a 1-time join)

In the login page (starting point) the text in the browser should be "Shared Shelf - Homepage"
After login the text in the browser should be "Shared Shelf - Join your Shelf"
Inside the specific shelf the text in the browser should be "Shared Shelf - <Name of the shelf>"

---

**Change Navigation** - CHECK IF IMPLEMENTED
Please updated header to be like this, from left to right:
1. Shelf logo - users can edit from profile the shelf logo
2. Shelf name - shelf name that was given when creating the specific shelf (that can be edited from shelf settings
3. Plan button - open tab which is composed of Tasks and Calendar tab
4. Go button - open tab which is composed of Dates, Trips and Recipes tab
5. Media Track button - open tab which is composed of TV Shows, Movies and Books tab
6. + Add
7. Share - It shows shelf id and code
8. Settings (popup where you can manage account settings)
9. Account (Put logount inside the account popup)

Meaning that the big 8 horizontal tabs will disapear and will only have 3 main tabs that will be included inside the header.

---

**Tasks tab** - CHECK IF IMPLEMENTED
In the tasks tab, "Mark as completed" is not well implemented, at the moment it appears when i click a specific task. Please remove this mark as completed feature.
Completed tasks should be at the end all together where you can open or collapse.
Put icons (move up, move down, edit and delete) a bit bigger, can be triple of the current size.

---

**Calendar** - CHECK IF IMPLEMENTED
In the calendar tab remove Export to Google Calendar button. Also let me edit activities in the agenda by clicking in them in the calendar or at the agenda that appears bellow.
Calendar is a bit big, you can reduce to 60% of the current size.

---

**Dates** - CHECK IF IMPLEMENTED
In date tabs change "Been There" to "Visited". Also change the categories, which appears in filter, to All, Restaurant, Bar, Brunch, Viewpoint, Other, Fvourites and Visited.
Remove (check) Been there, it should be like this:
(Date Spot) (star, which you are able to click to add or remove from favourites) (check, instead of the written check it should be the emoji of a green check that you can click to add or remove as visited)
Bellow it has a tag with the category (removed the pinned)
Bellow it should have the 5 stars to evaluate but it is not well programmed, when i have my mouse for example in the middle start it should fill the starts before it, it is only filling the starts before after clicking.
Bellow it should have the address
Bellow have the Open in OpenStreetMap

Also in the dates tabe the map takes too long to render and most of the times it only renders half and stays stuck.