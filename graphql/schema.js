const { buildSchema } = require('graphql');
module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    body: String!
    category: [String!]
    status: Boolean!
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
    posts: [Post!]!
  }

  type Category {
    _id: ID!
    name: String!
    createdAt: String!
    updatedAt: String!
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
    status: Boolean!
    category: [String!]
  }

  type RootQuery {
    login(email: String!, password: String!): AuthData!
    getPosts(page: Int!): PostData!
    getPost(id: ID!): Post!
    getUser: User!
    greeting(name: String): String!
  }

  type RootMutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
    updatePost(id: ID!, postInput: PostInputData):
     Post!
    deletePost(id: ID!): Boolean
    createCategory(name: String!): Category!
  }

  type RootSubscription {
    count: Int!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
    subscription: RootSubscription
  }
`);
