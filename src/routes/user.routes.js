import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

// register
router.route("/register").post(upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), registerUser)

// login
router.route("/login").post(loginUser)

// logout
router.route("/logout").post(verifyJWT, logoutUser)

// refresh token
router.route("/refresh-token").post(refreshAccessToken)

// change password
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

// get current user
router.route("/current-user").get(verifyJWT, getCurrentUser)

// update user
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

// upload avatar
router.route("/avatar").patch(verifyJWT, upload.single["avatar"], updateUserAvatar)

// upload cover image
router.route("/cover-image").patch(verifyJWT, upload.single["coverImage"], updateCoverImage)

// get channel profile
router.route("/c/:userName").get(verifyJWT, getUserChannelProfile)

// get user hsitory
router.route("/history").get(verifyJWT, getWatchHistory)

export default router;