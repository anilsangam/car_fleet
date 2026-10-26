import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

export class AdminReportController {
  public static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo } = req.query;
      const metrics = await ReportService.getDashboardMetrics(
        dateFrom as string,
        dateTo as string
      );
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }

  public static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await ReportService.exportBookingsCSV(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="eliteride-bookings-${Date.now()}.csv"`
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

