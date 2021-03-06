# Spotify Playlists to XLSX file
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

This application allows users to retrieve an .xlsx file filled with playlists and their respective tracks gathered from an Spotify account.

## Demo
https://spotxlsx.herokuapp.com/

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

You are required to have installed the following software:

* Node.js and NPM
* MongoDB

### Installing

**Install dependencies**

Go to the root of the project and run the following code:
```
npm install
```

**Create a .env File**

This application uses a file to configurate the application port, mongodb uri, Spotify key, Spotify secret, Spotify callback url, and Session secret.

Go to the root of the project, open `.envdefault` in a text editor, and save that file as `.env`

**Set Port**

By default, the application will listen on `process.env.PORT`. However, you can change the port in the `.env` file that you created by setting the variable `SERVER_PORT` to the desired port.

```
Note: If 'process.env.PORT' was already set, setting 'SERVER_PORT' in '.env' won't have any effect.
```

**Set MongoDB URI**

By default, MongoDB will use the URI on `process.env.MONGODB_URI`. However, you can change the MONGODB_URI in the `.env` file by setting the variable MY_MONGODB_URI to the desired port. 
```
Note: If 'process.env.MONGODB_URI' was already set, setting 'MY_MONGODB_URI' in '.env' won't have any effect.
```

**Set Spotify Keys and Callbacks**

In the `.env` file that you created, set `APP_KEY` to the Spotify client id, `APP_SECRET` to the Spotify secret id, and `CALLBACK_URL` to the Spotify callback url.

**Set Session Secret**

In order to make the sessions more secure, go to the `.env` file that you created and set `SESSION_SECRET` to any secure phrase.


## Deployment

**Start MongoDB**

This step varies depending on how MongoDB was installed.

Example:

Open a terminal and run the following code:

```
mongod
```

For more information visit [MongoDB documentation](https://docs.mongodb.com/)

**Start the server**
Go to the root of the project and run the following code:

```
npm run start
```

## Built With

* [Axios](https://www.npmjs.com/package/axios) - Promise based HTTP client for the browser and node.js
* [Express](http://expressjs.com/) - Node.js framework used
* [Gulp](https://gulpjs.com/) -  Javascript task runner
* [MongoDB](https://www.mongodb.com/) - NoSQL data base used
* [Mongoose](http://mongoosejs.com/) - MongoDB object modeling for node.js
* [PassportJS](http://www.passportjs.org/) - Authentication middleware for Node.JS
* [React](https://reactjs.org/) - A JavaScript library for building user interfaces
* [Reactstrap](https://reactstrap.github.io/) - Library to use React Bootstrap 4 components
* [Webpack](https://webpack.js.org/) -  Module bundler that generates static assets
* [Winston](https://github.com/winstonjs/winston) - A logger for just about everything.


## Authors

* **[Kevin Angeles](https://www.kevinangeles.com/)** - [spotxlsx](https://github.com/KevinAngeles/spotxlsx)

## License

This project is licensed under CC BY 4.0 - see the [LICENSE.md](LICENSE.md) file for details