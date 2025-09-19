// In a real app, this would interact with a database
const users = [{ id: 1, name: 'John Doe', email: 'john@example.com' }];

module.exports = {
  getAllUsers: async (req, res) => {
    return users;
  },

  getUserById: async (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
  },

  createUser: async (req, res) => {
    const newUser = { id: users.length + 1, ...req.body };
    users.push(newUser);
    return newUser;
  },
};