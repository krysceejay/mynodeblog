const User = require('../model/User');
const bcrypt = require('bcryptjs');
const validator = require('validator');

module.exports = {
  createUser: async function({ userInput }, req) {
    //const email = args.userInput.email
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'Email is invalid' });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 6 })
    ) {
      errors.push({ message: 'Invalid password or password too short' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid input');
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });

    if (existingUser) {
      const error = new Error('User exists already');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  hello: 'hello world',
  greeting(pr) {
    if (pr.name) {
      return `Hello ${pr.name}`;
    } else {
      return 'Hello';
    }
  }
};