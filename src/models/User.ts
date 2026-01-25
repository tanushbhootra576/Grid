import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    name: string;
    role: 'student' | 'admin' | 'alumni';
    branch?: string;
    year?: number;
    bio?: string;
    skills: string[];
    interests: string[];
    socialLinks: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
    };
    collaborationStatus?: {
        level: number; // 0=Not Looking, 1=Exploring, 2=Learning, 3=Actively Collaborating
        visible: boolean;
    };
    profileLocked: boolean;
    acceptedGuidelines: boolean;
    blockedUsers: string[];
    dmLastRead?: Record<string, Date>;
    pinnedDms?: string[];
    lastActive: Date;
    createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: {
        type: String,
        enum: ['student', 'admin', 'alumni'],
        default: 'student'
    },
    branch: { type: String },
    year: { type: Number },
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
        visible: { type: Boolean, default: true }
    },
    profileLocked: {
        type: Boolean,
        default: false,
    },
    acceptedGuidelines: {
        type: Boolean,
        default: false,
    },
    blockedUsers: [{ type: String }],
    dmLastRead: {
        type: Map,
        of: Date,
        default: {}
    },
    pinnedDms: [{ type: String }],
    lastActive: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

// Delete the model if it exists to prevent hot-reload errors with schema changes
if (mongoose.models.User) {
    delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
