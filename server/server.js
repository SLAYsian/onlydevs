const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const path = require("path");
const cors = require("cors");
const session = require('express-session');
const passport = require("passport");
require('dotenv');

const { authMiddleware } = require("./utils/auth");
const { typeDefs, resolvers } = require("./schemas");
const db = require("./config/connection");
const routes = require("./routes");

const { InMemoryLRUCache } = require('apollo-server-caching');

const PORT = process.env.PORT || 3001;
const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' }
  })
);

const githubPassport = require('./controllers/github-controller');
app.use(githubPassport.initialize());

const googlePassport = require('./controllers/google-controller');
app.use(googlePassport.initialize());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
  persistedQueries: false
});

const startApolloServer = async () => {
  await server.start();

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  server.applyMiddleware({ app, path: "/graphql", cors: false });

  app.use("/", routes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
  }

  db.once("open", () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
    });
  });
};

startApolloServer();
