const { User, Book, Tags } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const ERROR_MESSAGES = {
  auth: 'Must be logged in',
  invalidCredentials: 'Invalid email or password',
  savePost: 'Must be logged in to save post',
  removePost: 'Must be logged in to remove post'
};

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate('savedPosts');
      }
      throw new AuthenticationError(ERROR_MESSAGES.auth);
    },
    getAllTags: async () => {
      return await Tags.find();
    },
    getTagById: async (_, { id }) => {
      return await Tags.findById(id);
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError(ERROR_MESSAGES.invalidCredentials);
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError(ERROR_MESSAGES.invalidCredentials);
      }
      const token = signToken(user);
      return { token, user };
    },
    addNewUser: async (parent, { input }) => {
      const newUser = await User.create(input);
      const authToken = signToken(newUser);
      return { authToken, user: newUser };
    },
    createTag: async (_, { name, description }) => {
      return await Tags.create({ name, description });
    },
    updateTags: async (_, { userId, tags }) => {
      return await User.findOneAndUpdate(
        { _id: userId },
        { $set: { tags } },
        { new: true }
      );
    },
    updatePostTags: async (_, { postId, tags }) => {
      return await Post.findOneAndUpdate(
        { _id: postId },
        { $set: { tags } },
        { new: true }
      );
    },
    createPost: async (_, { content }, context) => {
      if (!context.user) {
        throw new AuthenticationError('Must be logged in to create a post');
      }
      const newPost = await Post.create({ description: content, user: context.user._id });
      return newPost;
    },
  }
};

module.exports = resolvers;