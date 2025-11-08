import { Router } from 'express';

// Import routes yang dibuat Developer A (auth & foundation)
import authRoutes from './auth';
import pelatihRoutes from './pelatih';

// Import routes yang dibuat Developer B (business logic)
import dojangRoutes from './dojang';
import atletRoutes from './atlet';
import kompetisiRoutes from './kompetisi';

// ✅ Import PUBLIC routes (NO AUTH)
import publicRoutes from './public';

const router = Router();

// API version prefix
const API_VERSION = '/api';

// ⭐ CRITICAL: Public routes HARUS di atas protected routes
// Karena Express router matching dari atas ke bawah
router.use(`${API_VERSION}/public`, publicRoutes);

// Developer A routes (Authentication & Foundation)
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/pelatih`, pelatihRoutes);

// Developer B routes (Business Logic & Features)
router.use(`${API_VERSION}/dojang`, dojangRoutes);
router.use(`${API_VERSION}/atlet`, atletRoutes);
router.use(`${API_VERSION}/kompetisi`, kompetisiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Pemuda Berprestasi API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    title: 'Pemuda Berprestasi API Documentation',
    version: '1.0.0',
    description: 'API untuk sistem manajemen perlombaan taekwondo',
    endpoints: {
      // ✅ TAMBAH: Public endpoints
      public: {
        prefix: `${API_VERSION}/public`,
        description: 'Endpoints yang bisa diakses tanpa autentikasi',
        endpoints: [
          'GET /kompetisi - Get all published competitions',
          'GET /kompetisi/:id - Get competition details',
          'GET /kompetisi/:id/medal-tally - Get medal tally (leaderboard)',
          'GET /kompetisi/:id/brackets/:kelasKejuaraanId - Get bracket (read-only)'
        ]
      },
      authentication: {
        prefix: `${API_VERSION}/auth`,
        endpoints: [
          'POST /login - Login user',
          'POST /register - Register new user',
          'POST /logout - Logout user',
          'GET /me - Get current user profile'
        ]
      },
      pelatih: {
        prefix: `${API_VERSION}/pelatih`,
        endpoints: [
          'GET / - Get all pelatih',
          'GET /:id - Get pelatih by ID',
          'POST / - Create new pelatih',
          'PUT /:id - Update pelatih',
          'DELETE /:id - Delete pelatih'
        ]
      },
      dojang: {
        prefix: `${API_VERSION}/dojang`,
        endpoints: [
          'GET / - Get all dojang',
          'GET /:id - Get dojang by ID',
          'POST / - Create new dojang',
          'PUT /:id - Update dojang',
          'DELETE /:id - Delete dojang',
          'GET /:id/athletes - Get athletes from dojang'
        ]
      },
      atlet: {
        prefix: `${API_VERSION}/atlet`,
        endpoints: [
          'GET / - Get all athletes',
          'GET /:id - Get athlete by ID',
          'POST / - Create new athlete',
          'PUT /:id - Update athlete',
          'DELETE /:id - Delete athlete',
          'POST /bulk - Bulk create athletes',
          'GET /:id/eligibility/:competitionId - Check eligibility'
        ]
      },
      kompetisi: {
        prefix: `${API_VERSION}/kompetisi`,
        endpoints: [
          'GET /published - Get published competitions',
          'GET /upcoming - Get upcoming competitions',
          'GET / - Get all competitions',
          'GET /:id - Get competition by ID',
          'POST / - Create new competition',
          'PUT /:id - Update competition',
          'DELETE /:id - Delete competition',
          'POST /:id/classes - Create competition class',
          'POST /:id/register - Register athlete to competition'
        ]
      }
    }
  });
});

export default router;