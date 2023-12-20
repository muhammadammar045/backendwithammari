import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema
    (
        {
            videoFile: {
                type: String,
                required: [true, "Video File is required"],
            },
            thumbnail: {
                type: String,
                required: [true, "Thumbnail is required"],
            },
            title: {
                type: String,
                required: [true, "Title is required"],
            },
            description: {
                type: String,
                required: [true, "Description is required"],
            },
            owner: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: [true, "Owner is required"],
            },
            views: {
                type: Number,
                default: 0
            },
            duration: {
                type: Number,
                required: [true, "Duration is required"],
            },
            isPublished: {
                type: Boolean,
                default: true
            },
        },
        {
            timestamps: true
        }
    )

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);