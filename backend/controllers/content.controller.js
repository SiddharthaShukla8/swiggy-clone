const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { buildSiteContent } = require("../services/content.service");

const getSiteContent = asyncHandler(async (req, res) => {
    const content = await buildSiteContent(req);

    return res.status(200).json(
        new ApiResponse(200, content, "Site content fetched successfully")
    );
});

module.exports = {
    getSiteContent,
};
