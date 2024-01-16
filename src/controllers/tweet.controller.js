import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body


    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if (!tweet) {
        throw new ApiError(500, "Tweet creation failed")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Tweet created successfully")
        )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    const user = await User.findById(userId)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweets = await Tweet.find(
        {
            owner: userId
        }
    )

    if (!tweets) {
        throw new ApiError(404, "Tweets not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "Tweets fetched successfully")
        )


})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content: content
        }
    })
    if (!tweet) {
        throw new ApiError(404, "Tweet not found or updated")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet updated successfully")
        )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found or deleted")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet deleted successfully")
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}