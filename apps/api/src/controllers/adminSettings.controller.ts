import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';
import { AdminAuditLog } from '../models/AdminAuditLog';

export class AdminSettingsController {
  public static async getSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await SettingsService.updateSettings(req.body);

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'UPDATE_SETTINGS',
        targetType: 'BusinessSettings',
        details: req.body,
      });

      res.json({ success: true, data: updated, message: 'Settings saved successfully' });
    } catch (error) {
      next(error);
    }
  }
}

