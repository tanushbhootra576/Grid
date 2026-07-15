import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

export interface IUser extends Document {
  publicId?: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: "student" | "admin" | "alumni";
  year?: number;
  college?: string;
  city?: string;
  state?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  collaborationStatus?: {
    level: number; // 0=Not Looking, 1=Exploring, 2=Learning, 3=Actively Collaborating (Co-founder)
    visible: boolean;
  };
  powProjects: {
    title: string;
    url: string;
    description?: string;
    endorsements: string[]; // array of user IDs
  }[];
  powDesigns?: {
    title: string;
    type: string;
    url: string;
  }[];
  powEndorsements?: {
    authorName: string;
    role: string;
    text: string;
    skills: string[];
  }[];
  powExperience?: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
  profileLocked: boolean;
  verified: boolean;
  acceptedGuidelines: boolean;
  /**
   * A deterministic hash derived from the verified student ID card content
   * (name + college, lowercased and salted). Used to detect when the same
   * physical student tries to create a second account with a different Gmail.
   */
  studentIdHash?: string;
  /**
   * SHA-256 hash of the ID card image uploaded during verification.
   * Prevents the exact same image file from being used on multiple accounts.
   */
  studentIdImageHash?: string;
  /** Timestamp when the mandatory onboarding (profile completion) was finished. */
  profileCompletedAt?: Date;
  blockedUsers: string[];
  dmLastRead?: Record<string, Date>;
  pinnedDms?: string[];
  lastActive: Date;
  createdAt: Date;
}

function createPublicId() {
  // Opaque, URL-safe-ish id (no PII; not guessable). 24 chars keeps URLs short.
  return crypto.randomBytes(18).toString("hex");
}

const UserSchema: Schema<IUser> = new Schema({
  publicId: {
    type: String,
    unique: true,
    index: true,
    default: createPublicId,
  },
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "admin", "alumni"],
    default: "student",
  },
  year: { type: Number },
  college: { type: String, index: true },
  city: { type: String },
  state: { type: String },
  bio: { type: String },
  skills: [{ type: String }],
  interests: [{ type: String }],
  socialLinks: {
    github: String,
    linkedin: String,
    portfolio: String,
  },
  collaborationStatus: {
    level: { type: Number, default: 1, min: 0, max: 3 },
    visible: { type: Boolean, default: true },
  },
  powProjects: [{
    title: String,
    url: String,
    description: String,
    endorsements: [{ type: String }]
  }],
  powDesigns: [{
    title: String,
    type: String,
    url: String
  }],
  powEndorsements: [{
    authorName: String,
    role: String,
    text: String,
    skills: [{ type: String }]
  }],
  powExperience: [{
    role: String,
    company: String,
    duration: String,
    description: String
  }],
  profileLocked: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  acceptedGuidelines: {
    type: Boolean,
    default: false,
  },
  studentIdHash: {
    type: String,
    unique: true,    // DB-level enforcement: one hash per account
    sparse: true,    // sparse = null values are allowed (unverified users)
    index: true,
  },
  studentIdImageHash: {
    type: String,
    unique: true,    // DB-level enforcement: one photo per account
    sparse: true,
    index: true,
  },
  profileCompletedAt: { type: Date },
  blockedUsers: [{ type: String }],
  dmLastRead: {
    type: Map,
    of: Date,
    default: {},
  },
  pinnedDms: [{ type: String }],
  lastActive: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { strict: false });

UserSchema.pre("save", function (next) {
  // Ensure legacy users get a publicId without requiring a one-time migration.
  if (!this.publicId) {
    this.publicId = createPublicId();
  }
  next();
});

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default User;
