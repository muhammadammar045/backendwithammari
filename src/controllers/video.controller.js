import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import uploadOnCloudinary from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {

    // Extract title and description from request body
    const { title, description } = req.body;

    // Check if title and description are provided
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    // Get the path of the uploaded video file
    const videoPath = req.files?.videoFile[0]?.path;

    // Check if video file is provided
    if (!videoPath) {
        throw new ApiError(400, "Video file is required");
    }

    // Get the path of the uploaded thumbnail file
    const thumbnailPath = req.files?.thumbnail[0]?.path;

    // Check if thumbnail is provided
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    // Upload thumbnail and video to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    const video = await uploadOnCloudinary(videoPath);

    // Check if video and thumbnail were successfully uploaded to Cloudinary
    if (!video) {
        throw new ApiError(400, "Video file is not uploaded");
    }

    if (!thumbnail) {
        throw new ApiError(400, "Failed to upload thumbnail");
    }

    // Create a new video record in the database
    const createdVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        owner: req.user?._id,
        duration: video.duration,
        views: 0,

    });

    // Respond with success message and the created video details
    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video uploaded successfully")
    );

});

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id

    const { videoId } = req.params


    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video found")
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail

    const { videoId } = req.params


    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const { title, description } = req.body
    const thumbnailPath = req.file?.path;

    if (!title && !description && !thumbnailPath) {
        throw new ApiError(400, "Please provide title, description, or thumbnail");
    }
    if (thumbnailPath) {
        const thumbnailUrl = await uploadOnCloudinary(thumbnailPath);
        if (!thumbnailUrl.url) {
            throw new ApiError(500, "Failed to upload thumbnail");
        }
        const updatedVideo = await Video.findByIdAndUpdate(
            video,
            {
                $set: {
                    title,
                    description,
                    thumbnail: thumbnailUrl.url
                }
            },
            { new: true }
        )
        if (!updatedVideo) {
            throw new ApiError(500, "Failed to update video");
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Video updated successfully")
            )
    } else {
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title,
                    description
                }
            },
            { new: true }
        );

        if (!updatedVideo) {
            throw new ApiError(500, "Failed to update video");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, updatedVideo, "Video updated successfully")
            );
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const deletedVideo = await Video.findByIdAndDelete(video);

    if (!deletedVideo) {
        throw new ApiError(500, "Failed to delete video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedVideo, "Video deleted successfully")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params


    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.isPublished = !video.isPublished;

    const updatedVideo = await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Publish status updated successfully")
        )



})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}