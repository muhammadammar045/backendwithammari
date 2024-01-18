import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    let { page = 1, limit = 10 } = req.query

    page = isNaN(page) ? 1 : Number(page)
    limit = isNaN(limit) ? 10 : Number(limit)

    if (page <= 0) {
        page = 1
    }
    if (limit <= 0) {
        limit = 10
    }

    if (!videoId.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }


    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentedBy",
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
                commentedBy: {
                    $first: "$commentedBy"
                }
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ])

    if (comments.length === 0) {
        throw new ApiError(404, "No comments found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId
    })

    if (!comment) {
        throw new ApiError(500, "Failed to add comment")
    }

    return res.status(201)
        .json(
            new ApiResponse(201, comment, "Comment added successfully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content
        }
        , { new: true })

    if (!comment) {
        throw new ApiError(404, "Comment not updated")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }

    const comment = await Comment.findByIdAndDelete(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment not deleted")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            comment,
            "Comment deleted successfully"
        )
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}