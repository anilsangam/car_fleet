import { BusinessSettings, IBusinessSettingsDocument } from '../models/BusinessSettings';

export class SettingsService {
  public static async getSettings(): Promise<IBusinessSettingsDocument> {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = await BusinessSettings.create({
        businessName: 'EliteRide Car Fleet',
        tagline: 'Chauffeur-Driven Luxury & Outstation Car Rentals',
        supportPhone: '+91 98765 43210',
        supportEmail: 'support@eliteride.com',
        officeAddress: 'Plot 42, Aerocity Commercial Hub, New Delhi, 110037',
        operatingHours: '24 Hours, 7 Days a Week',
        serviceAreas: ['Delhi NCR', 'Jaipur', 'Agra', 'Chandigarh', 'Dehradun', 'Shimla'],
        defaultCurrency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata',
      });
    }
    return settings;
  }

  public static async updateSettings(data: any): Promise<IBusinessSettingsDocument> {
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      settings = new BusinessSettings(data);
      return settings.save();
    }
    Object.assign(settings, data);
    return settings.save();
  }
}

