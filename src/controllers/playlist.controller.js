import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    //TODO: create playlist

    if (!name || !description) {
        throw new ApiError(400, "Playlist name and description are required")
    }

    const playlist = await Playlist.create(
        {
            name,
            description,
            owner: req.user?._id,
            videos: []
        }
    )

    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, playlist, "Playlist created successfully")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId.trim() || !isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }

    if (userId.toString() !== req?.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to access this user's playlists")
    }

    const playlists = await Playlist.find(
        {
            owner: userId
        }
    )

    if (!playlists || playlists.length === 0) {
        throw new ApiError(404, "No playlists found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "Playlists fetched successfully")
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {

    const { playlistId } = req.params

    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist fetched successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!videoId.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)

    if (playlist?.owner.toString() !== req?.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to add video to this playlist")
    }

    if (!video || !playlist) {
        throw new ApiError(404, "Video or playlist not found")
    }

    if (playlist?.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in playlist")
    }

    if (playlist?.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not allowed to add videos to this playlist")
    }

    const addVideoToPlaylist = await Playlist.videos.push(videoId)

    if (!addVideoToPlaylist) {
        throw new ApiError(500, "Failed to add video to playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video added to playlist successfully")
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!videoId.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)

    if (playlist?.owner.toString() !== req?.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to remove video from playlist")
    }

    if (!video || !playlist) {
        throw new ApiError(404, "Video or playlist not found")
    }

    if (!playlist?.videos.includes(videoId)) {
        throw new ApiError(400, "Video Does not exists in playlist")
    }

    const removeVideoFromPlaylist = await Playlist.videos.pull(videoId)

    if (!removeVideoFromPlaylist) {
        throw new ApiError(500, "Failed to remove video from playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video removed from playlist successfully")
        )


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (playlist?.owner.toString() !== req?.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletePlaylist) {
        throw new ApiError(500, "Failed to delete playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletePlaylist, "Playlist deleted successfully")
        )

})

const updatePlaylist = asyncHandler(async (req, res) => {

    const { playlistId } = req.params
    const { name, description } = req.body


    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (playlist?.owner.toString() !== req?.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist")
    }

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true })

    if (!updatePlaylist) {
        throw new ApiError(500, "Failed to update playlist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatePlaylist, "Playlist updated successfully")
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}