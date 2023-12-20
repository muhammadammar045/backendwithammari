const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((error) => next(error))
    }
}

export default asyncHandler;

//  Both Are Same

// const asyncHandler = (requestHandler) => {
//     async (req, res, next) => {
//         try {
//             await requestHandler(req, res, next)
//         } catch (error) {
//             res.status(error.code || 500).json({
//                 message: error.message,
//                 success: false
//             })
//         }
//     }
// }