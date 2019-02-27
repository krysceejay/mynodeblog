const express = require('express');
const mongoose = require('mongoose');
const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const app = express();

//DB Config
const db = require('./config/keys').mongoURI;

mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log('Mongodb Connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => res.send('hello'));

app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true
  })
);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
