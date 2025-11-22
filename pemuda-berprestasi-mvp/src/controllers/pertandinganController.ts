import { Request, Response } from 'express';
import * as pertandinganService from '../services/pertandinganService';

export const getPertandinganInfo = async (req: Request, res: Response) => {
  try {
    const id_kompetisi = parseInt(req.params.id_kompetisi, 10);
    const hari = req.query.hari ? parseInt(req.query.hari as string, 10) : undefined; // NEW: Get hari from query

    if (isNaN(id_kompetisi)) {
      return res.status(400).json({ message: 'ID Kompetisi tidak valid' });
    }

    // NEW: Pass hari to service
    const pertandinganData = await pertandinganService.getAtletMatchInfo(id_kompetisi, hari); 
    res.status(200).json({ success: true, data: pertandinganData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
