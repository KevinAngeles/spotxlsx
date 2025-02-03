# Spotify Playlists to XLSX file
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

This application allows users to retrieve an .xlsx file filled with playlists and their respective tracks gathered from an Spotify account.

## Introduction

This application was originally developed only in JavaScript. Now, it has been updated to also support TypeScript.

## Demo
https://spotxlsx.vercel.app/

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

Go to the root of the project, open `.env.backup` in a text editor, and save that file as `.env`

**Set MongoDB URI**

By default, MongoDB will use the URI on `process.env.MONGODB_URI`.

**Set Spotify Keys and Callbacks**

In the `.env` file that you created, set `SPOTIFY_CLIENT_ID` to the Spotify client id, `SPOTIFY_CLIENT_SECRET` to the Spotify secret id, and `CALLBACK_URL` to the Spotify callback url.

**Set NEXTAUTH_SECRET**

The secret will be used on production mode.

**Set NEXTAUTH_URL**

If the application will be run on a local server, go to the `.env` file that you created, set NEXTAUTH_URL to the localhost url (I.E. http://localhost:3000)

Likewise, if the application will be run on a remote server, go to the `.env` file and set NEXTAUTH_URL to the remote url.

**Set Session Secret**

In order to make the sessions more secure, go to the `.env` file that you created and set `SESSION_SECRET` to any secure phrase.

**Starti MongoDB**

If your are planning to use remote MongoDB connection, skip this step.

This step varies depending on how MongoDB was installed.

Example:

Open a terminal and run the following code:

```
mongod
```

For more information visit [MongoDB documentation](https://docs.mongodb.com/)

## Run in development mode

Go to the `.env` file that you created and set `NODE_ENV` to `development`. Then, run the command:
```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

**Build the files**

Go to the root of the project and run the following code:

```
npm run build
```

**Start the server**

Go to the root of the project and run the following code:

```
npm run start
```

## Built With

* [Next.js](https://nextjs.org/) - React framework that gives you building blocks to create web applications
* [NextAuth.js](https://next-auth.js.org/) - Open source authentication library
* [MongoDB](https://www.mongodb.com/) - NoSQL data base used
* [Material UI](https://mui.com/) - Comprehensive suite of UI tools to help you ship new features faster
* [React](https://reactjs.org/) - A JavaScript library for building user interfaces
* [Excel4node](https://www.npmjs.com/package/excel4node) - A full featured xlsx file generation library allowing for the creation of advanced Excel files
* [TypeScript](https://www.typescriptlang.org/) - Strongly typed programming language that builds on JavaScript

## Authors

* **[Kevin Angeles](https://www.kevinangeles.com/)** - [spotxlsx](https://github.com/KevinAngeles/spotxlsx)

## License

This project is licensed under CC BY 4.0 - see the [LICENSE.md](LICENSE.md) file for details