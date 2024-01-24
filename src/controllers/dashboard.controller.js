import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const { channelId } = req.params
    if (!channelId.trim() || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likes: {
                    $size: {
                        $ifNull: ["$likes", []]
                    }
                }
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribers: {
                    $size: {
                        $ifNull: ["$subscribers", []]
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                },
                totalLikes: {
                    $sum: "$likes"
                },
                totalSubscribers: {
                    $sum: 1
                },
                totalVideos: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                owner: 0
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoStats, "Channel stats fetched successfully")
        )
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const { channelId } = req.params

    if (!channelId.trim() || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channelVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
            }
        }

    ]);

    if (channelVideos.length === 0) {
        throw new ApiError(404, "No video available on this Channel")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channelVideos, "All Video Fetched From Channel")
        )

})

export {
    getChannelStats,
    getChannelVideos
}
