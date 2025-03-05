// server/routes/api/users.js (or similar file)
const router = require('express').Router();
const { User } = require('../../models');
const { signToken } = require('../../utils/auth');

// create a user, sign a token, and send it back
router.post('/', async (req: { body: any; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): any; new(): any; }; }; json: (arg0: { token: any; user: any; }) => any; }) => {
  try {
    const userData = await User.create(req.body);

    if (!userData) {
      return res.status(400).json({ message: 'Something went wrong!' });
    }

    // Create a token
    const token = signToken(userData);

    // Return the token and user data
    return res.json({
      token,
      user: userData
    });
  } catch (err) {
    console.error('User creation error:', err);
    
    // Check for MongoDB duplicate key error (code 11000)
    if ((err as any).code === 11000) {
      return res.status(400).json({ message: 'This email or username is already in use.' });
    }
    
    // Check for validation errors
    if ((err as Error).name === 'ValidationError') {
      const messages = Object.values((err as any).errors).map((val: any) => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    return res.status(500).json({ message: 'An error occurred during signup.' });
  }
});

// login a user, sign a token, and send it back
router.post('/login', async (req: { body: { email: any; password: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; json: (arg0: { token: any; user: any; }) => void; }) => {
  try {
    const userData = await User.findOne({ email: req.body.email });
    if (!userData) {
      return res.status(400).json({ message: "Can't find this user" });
    }

    const correctPw = await userData.isCorrectPassword(req.body.password);

    if (!correctPw) {
      return res.status(400).json({ message: 'Wrong password!' });
    }

    const token = signToken(userData);
    res.json({
      token,
      user: userData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
});

module.exports = router;