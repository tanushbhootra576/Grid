import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    type: 'universal' | 'year' | 'dm';
    year?: number;
    recipientId?: mongoose.Types.ObjectId;
    replyTo?: {
        _id: mongoose.Types.ObjectId;
        content: string;
        senderName: string;
    };
    reactions: {
        userId: mongoose.Types.ObjectId;
        emoji: string;
    }[];
    sticker?: string;
    senderVerified?: boolean;
    createdAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema({
    content: {
        type: String,
        trim: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        // enum: ['universal', 'year', 'dm'],
        required: true,
    },
    year: {
        type: Number,
    },
    recipientId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    replyTo: {
        _id: { type: Schema.Types.ObjectId, ref: 'Message' },
        content: String,
        senderName: String
    },
    reactions: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: String
    }],
    sticker: String,
    senderVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

// Delete the model if it exists to prevent hot-reload errors with schema changes
if (mongoose.models.Message) {
    delete mongoose.models.Message;
}

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

// Updated schema for DM support
export default Message;
