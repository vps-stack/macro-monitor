# MacroMonitor
<img src="https://github.com/Flotsam3/MacroMonitor/assets/58853799/3558b89e-1b16-4db2-80e0-11afb0c40446" width=800 />

## What is it?

Like the name already indicates, this app is aiming to help you keeping track of your daily food consumption. It allows you to
record calories and macronutrients on a daily basis. By defining your individual threshold values, the app enables you to
keep an overview wheather your food intake meets your own requirements and supports a healthy lifestyle.

You can build up your own database by entering single food items or combining multiple food items to create a menu. The upload
of images for each item to the **cloudinary** service is supported.

## Installation & Usage

You need a (free) cloudinary account set up in order to use this app.  
- Create your `.env` file from the `.env.sample`. This step is necessary twice, for frontend and backend!
- For "VITE_CLOUDINARY_URL" you need to enter the public link, where your images are going to be stored at cloudinary
- To start the frontend part run `npm i` followed by `npm run dev` in the root folder  
- Navigate to the backend folder, run `npm i` and `npm start` to get the server running

## Details

The first thing you probably want to do is, set up your custom threshold values. You can do so by clicking on the `cog wheel`.
You'll see there are already predefined values, these are mostly recommendations from the ***Deutsche Gesellschaft
für Ernährung e.V. (DGE)***. You can leave them as they are or configure the values according to your requirements.

Once done you can continue by filling up the database with food items of your choice. This is happening in the `products` section.
Get the correct values from the product package itself or the internet. To record your daily consumption you can enter the proper 
grams for each food item and conclude by clicking on the `+` button.

Move over to the `balance` section to see the list of added food items along with the summarized calories and macros.
At this place, if you want, you can also store your daily consumption in the `archive` for future reference.

## Technology

**Frontend**: React with Vite, Typescript, SCSS, Toastify for message handling.  
**Backend**: Express, MongoDB, Mongoose, Cloudinary for image uploads.  
**Layout**: Figma

## Releases

Installation, Conventional Commits, einmaliger Ausgangstag und Aktivierung der
automatischen Releases sind in der [Release-Anleitung](docs/releases.md) beschrieben.
Nach Initialisierung startet ein Push auf `main` den Release-Job parallel zum Build.
