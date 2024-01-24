import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {

    const { channelId } = req.params

    if (!channelId.trim() || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const subscription = await Subscription.findOne({ subscriber: user?._id, channel: channelId })
    let isSubscribed

    if (subscription) {

        const unsubscribed = await Subscription.findByIdAndDelete(subscription?._id)

        if (!unsubscribed) {
            throw new ApiError(400, "Failed to unsubscribe")
        }

        isSubscribed = false

    } else {
        const newSubscription = await Subscription.create({ subscriber: user?._id, channel: channelId })

        if (!newSubscription) {
            throw new ApiError(400, "Failed to subscribe")
        }

        isSubscribed = true

    }

    const message = isSubscribed ? "Subscribed successfully" : "Unsubscribed successfully"
    return res.status(200).json(
        new ApiResponse(200, {}, message)
    )


})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId.trim() || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const channelSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId.trim())
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribersList",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribersList: {
                    $first: "$subscribersList"
                }
            }
        },
        {
            $project: {
                subscribersList: 1,
                _id: 0
            }
        },
        {
            $replaceRoot: {
                newRoot: "$subscribersList"
            }
        }
    ]);


    res.status(200).json(new ApiResponse(
        200,
        channelSubscribers,
        "Get channel subscribers list success"
    ));
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId.trim() || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            description: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channelDetails: {
                    $first: "$channelDetails"
                }
            }
        },
        {
            $project: {
                channelDetails: 1
            }
        },
        {
            $replaceRoot: {
                newRoot: '$channelDetails'
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed Channels")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}