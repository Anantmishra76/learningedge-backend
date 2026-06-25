// Import required modules
const Course = require('../models/course');
const Section = require('../models/section');
const SubSection = require('../models/subSection');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

const sameId = (firstId, secondId) => firstId?.toString() === secondId?.toString();

const requireSectionOwner = async (sectionId, instructorId) => {
    const course = await Course.findOne({
        courseContent: sectionId,
        instructor: instructorId,
    });

    if (!course) {
        return { status: 403, message: "You are not authorized to modify this section" };
    }

    return { course };
};

// ================ CREATE SUBSECTION ================
exports.createSubSection = async (req, res) => {
    try {
        // Extract data from request body
        const { title, description, sectionId } = req.body;

        // Extract video file
        const videoFile = req.files.video

        // Validate required fields
        if (!title || !description || !videoFile || !sectionId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }

        const ownerCheck = await requireSectionOwner(sectionId, req.user.id);
        if (!ownerCheck.course) {
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message
            });
        }

        // Upload video to Cloudinary
        const videoFileDetails = await uploadImageToCloudinary(videoFile, process.env.FOLDER_NAME);

        // Create subsection in database
        const SubSectionDetails = await SubSection.create(
            { title, timeDuration: videoFileDetails.duration, description, videoUrl: videoFileDetails.secure_url })

        // Add subsection to section
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: SubSectionDetails._id } },
            { new: true }
        ).populate("subSection")

        // Return response
        res.status(200).json({
            success: true,
            data: updatedSection,
            message: 'SubSection created successfully'
        });
    }
    catch (error) {
        console.log('Error while creating SubSection');
        console.log(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating SubSection'
        })
    }
}

// ================ UPDATE SUBSECTION ================
exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description } = req.body;

        // Validate subsection ID
        if (!sectionId || !subSectionId) {
            return res.status(400).json({
                success: false,
                message: 'Section ID and SubSection ID are required to update'
            });
        }

        const ownerCheck = await requireSectionOwner(sectionId, req.user.id);
        if (!ownerCheck.course) {
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message
            });
        }

        const section = await Section.findById(sectionId);
        if (!section?.subSection.some((id) => sameId(id, subSectionId))) {
            return res.status(403).json({
                success: false,
                message: "SubSection does not belong to this section"
            });
        }

        // Find subsection
        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            })
        }

        // Update fields if provided
        if (title) {
            subSection.title = title;
        }

        if (description) {
            subSection.description = description;
        }

        // Update video if provided
        if (req.files && req.files.videoFile !== undefined) {
            const video = req.files.videoFile;
            const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = uploadDetails.duration;
        }

        // Save changes
        await subSection.save();

        // Fetch updated section
        const updatedSection = await Section.findById(sectionId).populate("subSection")

        // Return response
        return res.json({
            success: true,
            data: updatedSection,
            message: "Section updated successfully",
        });
    }
    catch (error) {
        console.error('Error while updating the section')
        console.error(error)
        return res.status(500).json({
            success: false,
            error: error.message,
            message: "Error while updating the section",
        })
    }
}

// ================ DELETE SUBSECTION ================
exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body

        if (!sectionId || !subSectionId) {
            return res.status(400).json({
                success: false,
                message: "Section ID and SubSection ID are required"
            });
        }

        const ownerCheck = await requireSectionOwner(sectionId, req.user.id);
        if (!ownerCheck.course) {
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message
            });
        }

        const section = await Section.findById(sectionId);
        if (!section?.subSection.some((id) => sameId(id, subSectionId))) {
            return res.status(403).json({
                success: false,
                message: "SubSection does not belong to this section"
            });
        }

        // Remove subsection from section
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )

        // Delete subsection from database
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
                .status(404)
                .json({ success: false, message: "SubSection not found" })
        }

        // Fetch updated section
        const updatedSection = await Section.findById(sectionId).populate('subSection')

        // Return response
        return res.json({
            success: true,
            data: updatedSection,
            message: "SubSection deleted successfully",
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,

            error: error.message,
            message: "An error occurred while deleting the SubSection",
        })
    }
}
