import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
    authorId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
}

export interface IDiscussionThread extends Document {
    authorId: mongoose.Types.ObjectId;
    title: string;
    content: string;
    category: 'YEAR' | 'PLACEMENT' | 'GENERAL' | 'SWE' | 'AI' | 'ML' | 'DATASCIENCE' | 'WEBDEV' | 'APPDEV' | 'CYBERSECURITY' | 'BLOCKCHAIN' | 'CLOUD' | 'DEVOPS';
    tags: string[];
    upvotes: mongoose.Types.ObjectId[];
    comments: IComment[];
    createdAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema({
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const DiscussionThreadSchema: Schema = new Schema({
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, enum: ['YEAR', 'PLACEMENT', 'GENERAL', 'SWE', 'AI', 'ML', 'DATASCIENCE', 'WEBDEV', 'APPDEV', 'CYBERSECURITY', 'BLOCKCHAIN', 'CLOUD', 'DEVOPS'], required: true },
    tags: [{ type: String }],
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    createdAt: { type: Date, default: Date.now },
});

// Delete the model if it exists to prevent hot-reload errors with schema changes
if (mongoose.models.DiscussionThread) {
    delete mongoose.models.DiscussionThread;
}

const DiscussionThread: Model<IDiscussionThread> = mongoose.model<IDiscussionThread>('DiscussionThread', DiscussionThreadSchema);

export default DiscussionThread;
