import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {

    const { videoId } = req.params

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
            new ApiResponse(200, video?.title, message)
        )


})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

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

    const likedVideosOwner = await Like.findOne({ likedBy: req.user?._id });

    if (!likedVideosOwner) {
        throw new ApiError(401, "Unauthorized to get liked videos");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user?._id,
                video: {
                    $exists: true
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            views: 1,
                            videoFile: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likedVideos: {
                    $first: "$likedVideos"
                }
            }
        },
        {
            $project: {
                _id: 0,
                likedVideos: 1,
            }
        },
        {
            $replaceRoot: { newRoot: "$likedVideos" }
        }


    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, { likedVideos, videosCount: likedVideos.length }, "Liked Videos fetched Successfully")
        )


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}