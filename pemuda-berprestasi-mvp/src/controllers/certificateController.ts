import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CertificateController {
  
  /**
   * Generate certificate number for athlete in specific class
   */
  static async generateCertificateNumber(req: Request, res: Response) {
    try {
      const { id_atlet, id_peserta_kompetisi, id_kompetisi, medal_status } = req.body;
      
      console.log('📜 Generating certificate:', { 
        id_atlet, 
        id_peserta_kompetisi, 
        id_kompetisi, 
        medal_status 
      });
      
      // Check if certificate already exists
      const existing = await prisma.tb_certificate.findFirst({
        where: {
          id_atlet: parseInt(id_atlet),
          id_peserta_kompetisi: parseInt(id_peserta_kompetisi)
        }
      });
      
      if (existing) {
        console.log('✅ Certificate already exists:', existing.certificate_number);
        return res.json({
          success: true,
          data: {
            certificateNumber: existing.certificate_number,
            alreadyExists: true
          }
        });
      }
      
      // Get next certificate number (GLOBAL counter)
      const lastCert = await prisma.tb_certificate.findFirst({
        orderBy: { id_certificate: 'desc' }
      });
      
      const nextNumber = lastCert 
        ? parseInt(lastCert.certificate_number) + 1 
        : 1;
      
      const certificateNumber = String(nextNumber).padStart(5, '0');
      
      console.log('🔢 Next certificate number:', certificateNumber);
      
      // Create certificate record
      const certificate = await prisma.tb_certificate.create({
        data: {
          certificate_number: certificateNumber,
          id_atlet: parseInt(id_atlet),
          id_peserta_kompetisi: parseInt(id_peserta_kompetisi),
          id_kompetisi: parseInt(id_kompetisi),
          medal_status: medal_status
        }
      });
      
      console.log('✅ Certificate created:', certificate);
      
      res.json({
        success: true,
        data: {
          certificateNumber: certificate.certificate_number,
          alreadyExists: false
        }
      });
      
    } catch (error: any) {
      console.error('❌ Error generating certificate number:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get all certificates for an athlete
   */
  static async getAthleteCertificates(req: Request, res: Response) {
    try {
      const { id_atlet } = req.params;
      
      console.log('📋 Fetching certificates for athlete:', id_atlet);
      
      const certificates = await prisma.tb_certificate.findMany({
        where: { id_atlet: parseInt(id_atlet) },
        include: {
          peserta_kompetisi: {
            include: {
              kelas_kejuaraan: {
                include: {
                  kategori_event: true,
                  kelompok: true,
                  kelas_berat: true,
                  poomsae: true,
                  kompetisi: true
                }
              }
            }
          }
        },
        orderBy: { generated_at: 'desc' }
      });
      
      console.log(`✅ Found ${certificates.length} certificates`);
      
      res.json({
        success: true,
        data: certificates
      });
      
    } catch (error: any) {
      console.error('❌ Error fetching certificates:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Check if certificate exists
   */
  static async checkCertificateExists(req: Request, res: Response) {
    try {
      const { id_atlet, id_peserta_kompetisi } = req.params;
      
      const existing = await prisma.tb_certificate.findFirst({
        where: {
          id_atlet: parseInt(id_atlet),
          id_peserta_kompetisi: parseInt(id_peserta_kompetisi)
        }
      });
      
      res.json({
        success: true,
        data: {
          exists: !!existing,
          certificateNumber: existing?.certificate_number || null
        }
      });
      
    } catch (error: any) {
      console.error('❌ Error checking certificate:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}