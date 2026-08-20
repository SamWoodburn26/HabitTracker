import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
)

const appDataSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true },
)

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId }
export type AppDataDoc = InferSchemaType<typeof appDataSchema> & {
  _id: mongoose.Types.ObjectId
}

export const User = mongoose.model('User', userSchema)
export const AppData = mongoose.model('AppData', appDataSchema)
