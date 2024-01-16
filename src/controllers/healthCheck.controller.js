import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        return res.json(
            new ApiResponse("OK", {}, "Service is running")
        )
    } catch (error) {
        return res.status(500).json(
            new ApiError("Internal Server Error", error)
        )
    }
})

export {
    healthcheck
}
