import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {

    return res.json(
        new ApiResponse("OK", {}, "Service is running")
    )

})

export {
    healthcheck
}
