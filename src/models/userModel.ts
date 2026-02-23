import { Schema, model, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IUser extends Document {
  uid?: string;
  email: string;
  name?: string;
  password: string;
  role: 'admin' | 'user';
  refreshTokens: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, default: uuidv4, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: false, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    refreshTokens: { type: [String], default: [] }
      ,
      resetPasswordToken: { type: String, required: false },
      resetPasswordExpires: { type: Date, required: false }
  },
  { timestamps: true }
);

const User = model<IUser>('User', userSchema);

export default User;
