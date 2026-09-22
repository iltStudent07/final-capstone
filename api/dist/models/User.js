import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';
export const USER_ROLES = ['admin', 'member'];
const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: USER_ROLES,
        default: 'member',
        required: true,
    },
}, {
    timestamps: true,
});
userSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
const User = model('User', userSchema);
export default User;
