import mongoose, { Schema, Document } from "mongoose";

// ============================================================
// 🎫 VERIFICATION TOKEN MODEL
// Stores temporary tokens for Magic Link and OTP verification.
// ============================================================

export interface IVerificationToken extends Document {
  identifier: string; // email or user id
  token: string;
  expires: Date;
  createdAt: Date;
}

const VerificationTokenSchema: Schema = new Schema(
  {
    identifier: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });
// Tokens expire automatically
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken = mongoose.model<IVerificationToken>(
  "VerificationToken",
  VerificationTokenSchema,
);
