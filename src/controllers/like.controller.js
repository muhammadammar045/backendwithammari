import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!videoId?.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    let isLiked;

    const like = await Like.findOne(
        {
            likedBy: req.user?._id,
            video: videoId
        }
    )

    if (like) {
        await Like.deleteOne(
            {
                video: like.video,
                likedBy: like.likedBy
            }
        )
        isLiked = false
    } else {
        const newLike = new Like({
            likedBy: req.user?._id,
            video: videoId
        })
        await newLike.save()
        isLiked = true
    }

    const message = isLiked ? "Video liked successfully" : "Video unliked successfully"

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, message)
        )


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!commentId?.trim() || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    let isLiked;

    const like = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (like) {
        await Like.deleteOne(
            {
                comment: commentId,
                likedBy: req.user?._id
            }
        )
        isLiked = false
    } else {
        const newLike = new Like({
            comment: commentId,
            likedBy: req.user?._id
        })
        await newLike.save()
        isLiked = true
    }

    const message = isLiked ? "Comment liked successfully" : "Comment unliked successfully"

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                message
            )
        )


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!tweetId?.trim() || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet id")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    let isLiked;

    const like = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    if (like) {
        await Like.deleteOne(
            {
                tweet: tweetId,
                likedBy: req.user?._id
            }
        )
        isLiked = false
    } else {
        const newLike = new Like({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        await newLike.save()
        isLiked = true
    }

    const message = isLiked ? "Tweet liked successfully" : "Tweet unliked successfully"

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                message
            )
        )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}