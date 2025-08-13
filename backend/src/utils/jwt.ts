import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id_pelatih: number;
  email: string;
  nama_pelatih: string;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
};