
import  crypto from "crypto"
import asyncHandler from "express-async-handler";
import User from "../models/UserModel.js";
import generateToken from '../utils/generateToken.js'
import { sendEmail } from "../utils/sendEmail.js";
import { logActivity } from "../utils/logActivity.js";
import { getJwtCookieOptions } from "../utils/cookieOptions.js";

// Register
export const register = asyncHandler(async (req, res) => {
  const {name, email, password, role} = req.body; 

    //Validation
    if (!name || !email || !password || !role) {
        res.status(400);
        throw new Error('Please fill in all required fields');

    }
    if (password.length < 8 ) {
        res.status(400);
        throw new Error('Password must not be less than 8 characters');
    }

    const userExists = await User.findOne({email}); 

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        status: role === "educator" ? "pending" : "approved",
        onboardingCompleted: false,  
    });

    if(user) {
        generateToken(res, user._id)

            const newUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      onboardingCompleted: user.onboardingCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
     // Log activity
    await logActivity(user._id, "Register", `Created account as ${role}`);
        res.status(201).json(newUser);
       
    } else{
        res.status(400);
        throw new Error('Invalid user data');
    }

});

// Login
export const login = asyncHandler(async (req, res) => {
  const {email, password } = req.body;

        //Validation
        if (!email || !password) {
            res.status(400);
            throw new Error('Please fill in all required fields');
    
        }
        //   check if user exists
      const user = await User.findOne({email});

    if(user && (await user.matchPassword(password))) {
        generateToken(res, user._id);
    const loggedInUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      onboardingCompleted: user.onboardingCompleted, 
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
        // Log activity
    await logActivity(user._id, "Login", "Logged into account");
    res.status(200).json(loggedInUser);
    } else{
        res.status(404);
        throw new Error('Invalid email or password');
    }
});

// @desc    Update user's onboarding status
// @route   PUT /api/users/complete-onboarding
// @access  Private (requires authentication)
export const completeOnboarding = asyncHandler(async (req, res) => {
   // Check if req.user is populated by the 'protect' middleware
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('Not authorized, user ID missing from request token.');
  }

  const user = await User.findById(req.user._id);

  if (user) {
   
    // Check if onboarding is already complete to avoid unnecessary updates/errors
    if (user.onboardingCompleted) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        onboardingCompleted: user.onboardingCompleted,
        message: 'Onboarding already marked as complete.'
      });
    }

    user.onboardingCompleted = true; // Set to true

    try {
      const updatedUser = await user.save();
      // Log activity
      await logActivity(req.user._id, "Onboarding", "Completed onboarding process");
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        onboardingCompleted: updatedUser.onboardingCompleted, // Should be true
        message: 'Onboarding marked as complete.'
      });
    } catch (saveError) {
      console.error("Backend: ERROR during user.save() for onboarding completion:", saveError.message);
      // Log validation errors specifically
      if (saveError.name === 'ValidationError') {
        const messages = Object.values(saveError.errors).map(val => val.message);
        console.error("Backend: Mongoose Validation Errors:", messages);
        res.status(400);
        throw new Error(`Validation failed: ${messages.join(', ')}`);
      }
      res.status(500);
      throw new Error('Failed to update user onboarding status in database.');
    }
  } else {
    console.error(`Backend: ERROR - User not found in DB for ID: ${req.user._id}`);
    res.status(404);
    throw new Error('User not found.');
  }
});

// Logout
export const logout = asyncHandler(async (req, res) => {
 res.cookie('jwt', '', {
        ...getJwtCookieOptions(),
        expires: new Date(0)
    })
        // Log activity
    await logActivity(req.user, "LOGOUT", {message: "User logged out"});
    
    res.status(200).json({ message: 'Logged out Successfully'});

});

// Forgot Password (Send Reset Token)
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const genericResponse = {
    message: "If an account with that email exists, a reset link has been sent.",
  };

  const user = await User.findOne({ email });

  // Always respond the same way whether or not the user exists,
  // so this endpoint can't be used to enumerate registered emails.
  if (!user) {
    return res.json(genericResponse);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/set-password/${resetToken}`;

  const message = `
 <h2>Hello ${user.name}</h2>
<p>Please use the link below to reset your password</p>
<p>The reset link is valid for 10 minutes</p>

<a href=${resetUrl} clicktracking=off>${resetUrl}</a>

<p>Regards...</p>
<p>Lecture Mate</p>
    `;

  try {
    await sendEmail({
      send_to: user.email,
      subject: "FORGOT PASSWORD",
      message,
    });
  } catch (err) {
    // Roll back the token so a failed email doesn't leave a live reset link
    // unreachable to the user, and don't leak the failure to the client.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Failed to send password reset email:", err.message);
  }

  res.json(genericResponse);
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  const {resetToken} =req.params 

    //    Hash token, then compare to token in the db
const hashedToken = crypto
.createHash("sha256")
.update(resetToken)
.digest("hex");

const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

if(!user){
 res.status(404)
    throw new Error("Invalid or expired Token")
    
  }

    const { password } = req.body;
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Force re-login on all devices by invalidating the current session cookie
    res.cookie('jwt', '', {
        ...getJwtCookieOptions(),
        expires: new Date(0),
    });

    // Log activity
    await logActivity(user._id, "Password Reset", "Reset account password");

    res.status(200).json({
        status: "Success",
        message: "Password Reset Successful"
    });
});
