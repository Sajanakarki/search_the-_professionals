import User from '../models/user.model.js';

export async function getUserList(req, res) {
  try {
    const users = await User.find().select('-password'); // exclude password
    res.status(200).json({
      message: 'User list fetched successfully',
      users: users
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
}

export async function searchUsers(req, res) {
  const { query } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const regex = new RegExp(query, 'i'); // case-insensitive partial match

    const users = await User.find({
      $or: [
        { username: regex },
        { email: regex }
      ]
    }).select('-password');

    res.status(200).json({
      message: `Found ${users.length} users matching "${query}"`,

      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error during user search',
      error: error.message
    });
  }
}
