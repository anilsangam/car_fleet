import { Request, Response, NextFunction } from 'express';
import { FareRule } from '../models/FareRule';
import { AdminAuditLog } from '../models/AdminAuditLog';

export class AdminPricingController {
  public static async listRules(_req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await FareRule.find().sort({ priority: -1, createdAt: -1 });
      res.json({ success: true, data: rules });
    } catch (error) {
      next(error);
    }
  }

  public static async createRule(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = new FareRule(req.body);
      await rule.save();

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'CREATE_FARE_RULE',
        targetType: 'FareRule',
        targetId: rule._id.toString(),
        details: { name: rule.name, tripType: rule.tripType },
      });

      res.status(201).json({ success: true, data: rule, message: 'Fare rule created successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async updateRule(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await FareRule.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!rule) {
        return res.status(404).json({ success: false, error: 'Fare rule not found' });
      }

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'UPDATE_FARE_RULE',
        targetType: 'FareRule',
        targetId: rule._id.toString(),
        details: req.body,
      });

      res.json({ success: true, data: rule, message: 'Fare rule updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteRule(req: Request, res: Response, next: NextFunction) {
    try {
      const rule = await FareRule.findByIdAndDelete(req.params.id);
      if (!rule) {
        return res.status(404).json({ success: false, error: 'Fare rule not found' });
      }

      await AdminAuditLog.create({
        adminId: req.adminUser!.id,
        adminEmail: req.adminUser!.email,
        action: 'DELETE_FARE_RULE',
        targetType: 'FareRule',
        targetId: req.params.id,
      });

      res.json({ success: true, message: 'Fare rule deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

