import Joi from 'joi';

export const kompetisiValidation = {
  create: Joi.object({
    nama_event: Joi.string().min(3).max(255).required().messages({
      'string.empty': 'Nama event wajib diisi',
      'string.min': 'Nama event minimal 3 karakter',
      'string.max': 'Nama event maksimal 255 karakter'
    }),
    lokasi: Joi.string().min(3).max(255).required().messages({
      'string.empty': 'lokasi event wajib diisi',
      'string.min': 'Nama event minimal 3 karakter',
      'string.max': 'Nama event maksimal 255 karakter'
    }),
    tanggal_mulai: Joi.date().min('now').required().messages({
      'date.base': 'Format tanggal mulai tidak valid',
      'date.min': 'Tanggal mulai tidak boleh di masa lalu',
      'any.required': 'Tanggal mulai wajib diisi'
    }),
    tanggal_selesai: Joi.date().min(Joi.ref('tanggal_mulai')).required().messages({
      'date.base': 'Format tanggal selesai tidak valid',
      'date.min': 'Tanggal selesai tidak boleh sebelum tanggal mulai',
      'any.required': 'Tanggal selesai wajib diisi'
    }),
    status: Joi.string().valid('PENDAFTARAN', 'SEDANG_DIMULAI', 'SELESAI').required().messages({
      'any.only': 'Type kompetisi harus salah satu dari: PENDAFTARAN, SEDANG_DIMULAI, SELESAI',
      'any.required': 'Type kompetisi wajib diisi'
    }),
    id_penyelenggara: Joi.number().integer().positive().required().messages({
      'number.base': 'ID penyelenggara harus berupa angka',
      'number.integer': 'ID penyelenggara harus bilangan bulat',
      'number.positive': 'ID penyelenggara harus positif',
      'any.required': 'ID penyelenggara wajib diisi'
    })
  }),

  update: Joi.object({
    nama_event: Joi.string().min(3).max(255).optional().messages({
      'string.min': 'Nama event minimal 3 karakter',
      'string.max': 'Nama event maksimal 255 karakter'
    }),
    tanggal_mulai: Joi.date().optional().messages({
      'date.base': 'Format tanggal mulai tidak valid'
    }),
    tanggal_selesai: Joi.date().when('tanggal_mulai', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('tanggal_mulai')),
      otherwise: Joi.date()
    }).optional().messages({
      'date.base': 'Format tanggal selesai tidak valid',
      'date.min': 'Tanggal selesai tidak boleh sebelum tanggal mulai'
    }),
    type_kompetisi: Joi.string().valid('OPEN', 'TRAINING', 'GRADE_B', 'GRADE_C').optional().messages({
      'any.only': 'Type kompetisi harus salah satu dari: OPEN, TRAINING, GRADE_B, GRADE_C'
    }),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'CLOSED').optional().messages({
      'any.only': 'Status harus salah satu dari: DRAFT, PUBLISHED, CLOSED'
    })
  }),

  createClass: Joi.object({
    cabang: Joi.string().valid('POOMSAE', 'KYORUGI').required().messages({
      'any.only': 'Cabang harus POOMSAE atau KYORUGI',
      'any.required': 'Cabang wajib diisi'
    }),
    id_kategori_event: Joi.number().integer().positive().required().messages({
      'number.base': 'ID kategori event harus berupa angka',
      'number.integer': 'ID kategori event harus bilangan bulat',
      'number.positive': 'ID kategori event harus positif',
      'any.required': 'ID kategori event wajib diisi'
    }),
    id_kelompok: Joi.number().integer().positive().optional().messages({
      'number.base': 'ID kelompok harus berupa angka',
      'number.integer': 'ID kelompok harus bilangan bulat',
      'number.positive': 'ID kelompok harus positif'
    }),
    id_kelas_berat: Joi.number().integer().positive().when('cabang', {
      is: 'KYORUGI',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'number.base': 'ID kelas berat harus berupa angka',
      'number.integer': 'ID kelas berat harus bilangan bulat',
      'number.positive': 'ID kelas berat harus positif',
      'any.required': 'ID kelas berat wajib untuk cabang KYORUGI'
    }),
    id_poomsae: Joi.number().integer().positive().when('cabang', {
      is: 'POOMSAE',
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'number.base': 'ID poomsae harus berupa angka',
      'number.integer': 'ID poomsae harus bilangan bulat',
      'number.positive': 'ID poomsae harus positif',
      'any.required': 'ID poomsae wajib untuk cabang POOMSAE'
    })
  }),

  updateClass: Joi.object({
    cabang: Joi.string().valid('POOMSAE', 'KYORUGI').optional().messages({
      'any.only': 'Cabang harus POOMSAE atau KYORUGI'
    }),
    id_kategori_event: Joi.number().integer().positive().optional().messages({
      'number.base': 'ID kategori event harus berupa angka',
      'number.integer': 'ID kategori event harus bilangan bulat',
      'number.positive': 'ID kategori event harus positif'
    }),
    id_kelompok: Joi.number().integer().positive().optional().messages({
      'number.base': 'ID kelompok harus berupa angka',
      'number.integer': 'ID kelompok harus bilangan bulat',
      'number.positive': 'ID kelompok harus positif'
    }),
    id_kelas_berat: Joi.number().integer().positive().optional().messages({
      'number.base': 'ID kelas berat harus berupa angka',
      'number.integer': 'ID kelas berat harus bilangan bulat',
      'number.positive': 'ID kelas berat harus positif'
    }),
    id_poomsae: Joi.number().integer().positive().optional().messages({
      'number.base': 'ID poomsae harus berupa angka',
      'number.integer': 'ID poomsae harus bilangan bulat',
      'number.positive': 'ID poomsae harus positif'
    })
  }),

  register: Joi.object({
    id_atlet: Joi.number().integer().positive().required().messages({
      'number.base': 'ID atlet harus berupa angka',
      'number.integer': 'ID atlet harus bilangan bulat',
      'number.positive': 'ID atlet harus positif',
      'any.required': 'ID atlet wajib diisi'
    }),
    id_kelas_kejuaraan: Joi.number().integer().positive().required().messages({
      'number.base': 'ID kelas kejuaraan harus berupa angka',
      'number.integer': 'ID kelas kejuaraan harus bilangan bulat',
      'number.positive': 'ID kelas kejuaraan harus positif',
      'any.required': 'ID kelas kejuaraan wajib diisi'
    })
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').required().messages({
      'any.only': 'Status harus salah satu dari: PENDING, APPROVED, REJECTED',
      'any.required': 'Status wajib diisi'
    })
  }),

  generateBracket: Joi.object({
    kelasKejuaraanId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'ID kelas kejuaraan harus berupa angka',
        'number.integer': 'ID kelas kejuaraan harus berupa bilangan bulat',
        'number.positive': 'ID kelas kejuaraan harus positif',
        'any.required': 'ID kelas kejuaraan wajib diisi'
      })
  }),

  // Validation for updating match result
  updateMatch: Joi.object({
    winnerId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'ID pemenang harus berupa angka',
        'number.integer': 'ID pemenang harus berupa bilangan bulat',
        'number.positive': 'ID pemenang harus positif',
        'any.required': 'ID pemenang wajib diisi'
      }),
    
    scoreA: Joi.number()
      .integer()
      .min(0)
      .max(100)
      .required()
      .messages({
        'number.base': 'Skor A harus berupa angka',
        'number.integer': 'Skor A harus berupa bilangan bulat',
        'number.min': 'Skor A tidak boleh negatif',
        'number.max': 'Skor A maksimal 100',
        'any.required': 'Skor A wajib diisi'
      }),
    
    scoreB: Joi.number()
      .integer()
      .min(0)
      .max(100)
      .required()
      .messages({
        'number.base': 'Skor B harus berupa angka',
        'number.integer': 'Skor B harus berupa bilangan bulat',
        'number.min': 'Skor B tidak boleh negatif',
        'number.max': 'Skor B maksimal 100',
        'any.required': 'Skor B wajib diisi'
      })
  }).custom((value, helpers) => {
    // Ensure scores are not equal (no ties allowed)
    if (value.scoreA === value.scoreB) {
      return helpers.error('custom.tieNotAllowed');
    }
    
    // Ensure winner's score is higher
    const winnerScore = value.winnerId === value.participantA ? value.scoreA : value.scoreB;
    const loserScore = value.winnerId === value.participantA ? value.scoreB : value.scoreA;
    
    if (winnerScore <= loserScore) {
      return helpers.error('custom.winnerScoreMustBeHigher');
    }
    
    return value;
  }, 'Match result validation').messages({
    'custom.tieNotAllowed': 'Pertandingan tidak boleh berakhir seri',
    'custom.winnerScoreMustBeHigher': 'Skor pemenang harus lebih tinggi dari lawannya'
  }),

  // Validation for shuffle bracket
  shuffleBracket: Joi.object({
    kelasKejuaraanId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'ID kelas kejuaraan harus berupa angka',
        'number.integer': 'ID kelas kejuaraan harus berupa bilangan bulat',
        'number.positive': 'ID kelas kejuaraan harus positif',
        'any.required': 'ID kelas kejuaraan wajib diisi'
      })
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page harus berupa angka',
      'number.integer': 'Page harus berupa bilangan bulat',
      'number.min': 'Page minimal 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit harus berupa angka',
      'number.integer': 'Limit harus berupa bilangan bulat',
      'number.min': 'Limit minimal 1',
      'number.max': 'Limit maksimal 100'
    }),
    search: Joi.string().max(255).optional().messages({
      'string.max': 'Search maksimal 255 karakter'
    }),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'CLOSED').optional().messages({
      'any.only': 'Status harus salah satu dari: DRAFT, PUBLISHED, CLOSED'
    }),
    type_kompetisi: Joi.string().valid('OPEN', 'TRAINING', 'GRADE_B', 'GRADE_C').optional().messages({
      'any.only': 'Type kompetisi harus salah satu dari: OPEN, TRAINING, GRADE_B, GRADE_C'
    }),
    tanggal_mulai_from: Joi.date().optional().messages({
      'date.base': 'Format tanggal mulai dari tidak valid'
    }),
    tanggal_mulai_to: Joi.date().min(Joi.ref('tanggal_mulai_from')).optional().messages({
      'date.base': 'Format tanggal mulai sampai tidak valid',
      'date.min': 'Tanggal mulai sampai tidak boleh sebelum tanggal mulai dari'
    })
  })
};

