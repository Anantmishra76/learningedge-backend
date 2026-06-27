// Import required modules
const Course = require('../models/course');
const Section = require('../models/section');

const sameId = (firstId, secondId) => firstId?.toString() === secondId?.toString();

const requireCourseOwner = async (courseId, instructorId) => {
    const course = await Course.findById(courseId);
    if (!course) {
        return { status: 404, message: "Course not found" };
    }

    if (!sameId(course.instructor, instructorId)) {
        return { status: 403, message: "You are not authorized to modify this course" };
    }

    return { course };
};

// ================ CREATE SECTION ================
exports.createSection = async (req, res) => {
    try {
        // Extract data from request body
        const { sectionName, courseId } = req.body;

        // Validate required fields
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }

        const ownerCheck = await requireCourseOwner(courseId, req.user.id);
        if (!ownerCheck.course) {
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message
            });
        }

        // Create section in database
        const newSection = await Section.create({ sectionName });

        // Add section to course
        const updatedCourse = await Course.findByIdAndUpdate(courseId,
            {
                $push: {
                    courseContent: newSection._id
                }
            },
            { new: true }
        );

        // Fetch updated course with populated sections
        const updatedCourseDetails = await Course.findById(courseId)
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection'
                }

            })

        // Return response
        res.status(200).json({
            success: true,
            updatedCourseDetails,
            message: 'Section created successfully'
        })
    }

    catch (error) {
        console.error('Error while creating section');
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating section'
        })
    }
}

// ================ UPDATE SECTION ================
exports.updateSection = async (req, res) => {
    try {
        // Extract data from request body
        const { sectionName, sectionId, courseId } = req.body;

        // Validate required fields
        if (!sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const ownerCheck = await requireCourseOwner(courseId, req.user.id);
        if (!ownerCheck.course) {
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message
            });
        }

        if (!ownerCheck.course.courseContent.some((id) => sameId(id, sectionId))) {
            return res.status(403).json({
                success: false,
                message: "Section does not belong to this course"
            });
        }

        // Update section name
        await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });

        // Fetch updated course
        const updatedCourseDetails = await Course.findById(courseId)
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection'
                }
            })

        // Return response
        res.status(200).json({
            success: true,
            data: updatedCourseDetails,
            message: 'Section updated successfully'
        });
    }
    catch (error) {
        console.error('Error while updating section');
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while updating section'
        })
    }
}

// ================ DELETE SECTION ================
exports.deleteSection = async (req, res) => {
    try {
        const { sectionId, courseId } = req.body;

        if (!sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const ownerCheck = await requireCourseOwner(courseId, req.user.id);
        if (!ownerCheck.course) {
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message
            });
        }

        if (!ownerCheck.course.courseContent.some((id) => sameId(id, sectionId))) {
            return res.status(403).json({
                success: false,
                message: "Section does not belong to this course"
            });
        }

        await Course.findByIdAndUpdate(courseId, {
            $pull: { courseContent: sectionId }
        });

        // Delete section from database
        await Section.findByIdAndDelete(sectionId);

        // Fetch updated course
        const updatedCourseDetails = await Course.findById(courseId)
            .populate({
                path: 'courseContent',
                populate: {
                    path: 'subSection'
                }
            })

        // Return response
        res.status(200).json({
            success: true,
            data: updatedCourseDetails,
            message: 'Section deleted successfully'
        })
    }
    catch (error) {
        console.error('Error while deleting section');
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while deleting section'
        })
    }
}

