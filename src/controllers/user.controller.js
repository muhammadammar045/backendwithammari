import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

// generate tokens
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

// register user
const registerUser = asyncHandler(async (req, res) => {

    // Extract form data
    const { fullName, email, userName, password } = req.body;

    // Validate form data
    if ([fullName, email, userName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Please fill all the fields");
    }

    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    });
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

// login user
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

// logout user
const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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

// refresh accesstoken
const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized reqwest")
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


export { registerUser, loginUser, logoutUser, refreshAccessToken };
