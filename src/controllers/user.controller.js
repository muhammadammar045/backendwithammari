import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//! generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong with generating access and refresh tokens");
    }


}

//! register user
const registerUser = asyncHandler(async (req, res) => {

    // Extract form data
    const { fullName, email, userName, password } = req.body;

    // Validate form data
    if ([fullName, email, userName, password]
        .some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Please fill all the fields");
    }

    // Check if user already exists
    const existedUser = await User.findOne(
        {
            $or: [{ email }, { userName }]
        }
    );
    if (existedUser) {
        throw new ApiError(409, "User already exists with the email or username");
    }

    // Receive avatar and cover
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Check for avatar existence
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    // Upload images to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // Check if avatar upload was successful
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Create User
    const user = await User.create({
        fullName,
        email,
        userName: userName.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });

    // Retrieve user without password and refresh token
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    // Send the response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
}
);

//! login user
const loginUser = asyncHandler(async (req, res) => {

    const { email, userName, password } = req.body;

    // Check if email or userName is provided
    if (!email && !userName) {
        throw new ApiError(400, "Email or userName is required");
    }

    //find the user in db
    const user = await User.findOne({
        $or: [{ email }, { userName }
        ]
    })

    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    // check the password with db
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // generate the tokens with the above method
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // after generating tokens it will save the user again without sending password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    // send the data {user : provided below } incase the user is using mobile or want to store on local
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Logged in successfully")
        )

})

//! logout user
const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Logged out successfully"))
})

//! refresh accesstoken
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const { accessToken, newRefreshToken } = generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Access Token refreshed successfully"))
    } catch (error) {
        throw new ApiError(400, "Invalid refresh token")
    }

})

//! change password
const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Please provide old and new password")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))

})

//! get Current User
const getCurrentUser = asyncHandler(async (req, res) => {
    // the jwt middleware is passed through this so it will have req.user
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched Successfully"))
})

//! update account details
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "Please provide full name or email")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                // you can write it both ways
                fullName: fullName,
                email
            }
        },
        { new: true, }
    ).select("-password")
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})

//! change avatar
const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Please provide an avatar")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Could not upload avatar on cloudinary")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar?.url
            },
        },
        { new: true }
    ).select("-password")
})

//! change coverImage
const updateCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Please provide a cover Image")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Could not upload cover Image on cloudinary")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: coverImage?.url
            },
        },
        { new: true }
    ).select("-password")
})

//! channel 
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { userName } = req.params
    if (!userName?.trim()) {
        throw new ApiError(400, "Please provide a user name")
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }

        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                userName: 1,
                fullName: 1,
                email: 1,
                subscribersCount: 1,
                isSubscribed: 1,
                channelsSubscribedToCount: 1,
                coverImage: 1,
                avatar: 1,
            }
        }
    ])
    // console.log(channel);

    if (!channel?.length) {
        throw new ApiError(404, "Channel Not Exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User Channel Fetched Successfully"
            )
        )
})

//! watch History
const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        //just for frontend purpose check in both cases nested pipelines
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }

                    }
                ]
            }

        }

    ])

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user[0].watchHistory,
            "User history fetched Successfully"
        ))
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    uploadVideo
};
