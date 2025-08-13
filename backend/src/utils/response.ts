import { Response } from 'express';

interface ApiResponseData {
  success: boolean;
  message: string;
  data?: any;
  pagination?: any;
  timestamp: string;
}

export class ApiResponse {
  static success(res: Response, data: any = null, message: string = 'Success', statusCode: number = 200) {
    const response: ApiResponseData = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    if (data && data.pagination) {
      response.pagination = data.pagination;
      response.data = data.data || data;
    }

    return res.status(statusCode).json(response);
  }

  static error(res: Response, message: string = 'Error', statusCode: number = 400, data: any = null) {
    const response: ApiResponseData = {
      success: false,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    return res.status(statusCode).json(response);
  }
}