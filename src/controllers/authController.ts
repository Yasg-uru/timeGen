import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    // 15 minutes
    maxAge: 15 * 60 * 1000,
  };
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    // set access token in an httpOnly cookie for browser requests
    const accessToken = (result as any).accessToken;
    const cookieOptions = getCookieOptions();
    res.cookie('accessToken', accessToken, cookieOptions);

    // still return tokens/user payload in body for API clients
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.sub;
    const { refreshToken } = req.body;
    await authService.logout(userId, refreshToken);
    // clear auth cookie (use same options so cookie is removed correctly in browser)
    res.clearCookie('accessToken', getCookieOptions());
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.sub;
    const user = await authService.getUserById(userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const token = await authService.requestPasswordReset(email);
    // In production you would email the token. For now return it for development.
    res.json({ ok: true, token });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

export default { register, login, refresh, logout, me, forgotPassword, resetPassword };
