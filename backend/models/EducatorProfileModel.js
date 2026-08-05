import mongoose from "mongoose";

const educatorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    expertise: {
      type: String,
      required: true,
      trim: true,
    },
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: String,
      enum: ["<1", "1-3", "3-5", "5+"],
      required: true,
    },
    teachingMode: {
      type: String,
      enum: ["Online", "In-person", "Hybrid"],
      required: true,
    },
    availability: {
      type: String,
      enum: ["Morning", "Afternoon", "Evening", "Flexible"],
      required: true,
    },
    groupSize: {
      type: String,
      enum: ["1-5", "6-15", "15+"],
      required: true,
    },
    platforms: {
      type: [String],
      enum: ["Zoom", "Google Meet", "LMS", "Blackboard"],
      default: [],
    },
    sampleLink: {
      type: String,
      trim: true,
    },
    hasDigitalExperience: {
      type: Boolean,
      default: false,
    },
    motivation: {
      type: String,
      trim: true,
    },
    subjects: {
      type: String,
      trim: true,
    },
    valueProposition: {
      type: String,
      trim: true,
    },
    credentialsFile: {
      type: String,
      trim: true,
    },
    agreedToTerms: {
      type: Boolean,
      default: false,
    },
    agreedToTermsAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const EducatorProfile = mongoose.model("EducatorProfile", educatorProfileSchema);
export default EducatorProfile;
