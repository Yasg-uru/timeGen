import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/userModel';

const JWT_SECRET: string = process.env.JWT_SECRET || 'please-change-this-secret';
const ACCESS_TOKEN_EXPIRES: string = process.env.JWT_ACCESS_EXP || '15m';
const REFRESH_TOKEN_EXPIRES: string = process.env.JWT_REFRESH_EXP || '7d';

function signAccessToken(user: IUser) {
    const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES as any };
    return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, options);
}

function signRefreshToken(user: IUser) {
    const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES as any };
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, options);
    return token;
}

class AuthService {
    async register(email: string, password: string, name?: string) {
        const existing = await User.findOne({ email });
        if (existing) throw new Error('Email already in use');

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashed, name });

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        user.refreshTokens.push(refreshToken);
        await user.save();

        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken };
    }

    async login(email: string, password: string) {
        const user = await User.findOne({ email });
        if (!user) throw new Error('Invalid credentials');

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new Error('Invalid credentials');

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        user.refreshTokens.push(refreshToken);
        await user.save();

        return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken };
    }

    async refresh(token: string) {
        try {
            const payload: any = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(payload.sub);
            if (!user) throw new Error('Invalid token');
            if (!user.refreshTokens.includes(token)) throw new Error('Refresh token revoked');

            const accessToken = signAccessToken(user);
            const refreshToken = signRefreshToken(user);

            // rotate refresh tokens
            user.refreshTokens = user.refreshTokens.filter(t => t !== token);
            user.refreshTokens.push(refreshToken);
            await user.save();

            return { accessToken, refreshToken };
        } catch (err) {
            throw new Error('Invalid refresh token');
        }
    }

    async logout(userId: string, token?: string) {
        const user = await User.findById(userId);
        if (!user) return;
        if (token) {
            user.refreshTokens = user.refreshTokens.filter(t => t !== token);
        } else {
            user.refreshTokens = [];
        }
        await user.save();
    }

    async getUserById(id: string) {
        const u = await User.findById(id).select('-password -refreshTokens');
        return u;
    }
}

export default new AuthService();
