const { buildSchema } = require('graphql');
module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    body: String!
    imageUrl: String!
    user: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    email: String!
    name: String!
    password: String
    status: String!
    posts: [Post!]!
  }

  type AuthData {
    token: String!
    userId: String!
  }

  type PostData {
    posts: [Post!]!
    totalPosts: Int!
  }

  input UserInputData {
    email: String!
    name: String!
    password: String!
  }

  input PostInputData {
    title: String!
    body: String!
    imageUrl: String!
  }

  type RootQuery {
    login(email: String!, password: String!): AuthData!
    getPosts(page: Int!): PostData!
    greeting(name: String): String!
  }

  type RootMutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
