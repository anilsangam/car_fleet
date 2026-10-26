import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUser';
import { Car } from '../models/Car';
import { Driver } from '../models/Driver';
import { FareRule } from '../models/FareRule';
import { BusinessSettings } from '../models/BusinessSettings';
import { env } from '../config/env';

export class SeedService {
  public static async seedAll(): Promise<void> {
    console.log('--- Initializing Database Seed ---');

    // 1. Admin Account
    const existingAdmin = await AdminUser.findOne({ email: env.ADMIN_EMAIL });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
      await AdminUser.create({
        name: 'Fleet Operations Lead',
        email: env.ADMIN_EMAIL,
        passwordHash,
        role: 'superadmin',
        isActive: true,
      });
      console.log(`Created default admin: ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
    }

    // 2. Business Settings
    let settings = await BusinessSettings.findOne();
    if (!settings) {
      await BusinessSettings.create({
        businessName: 'EliteRide Car Fleet',
        tagline: 'Chauffeur-Driven Luxury & Outstation Fleet',
        supportPhone: '+91 98765 43210',
        supportEmail: 'dispatch@eliteride.com',
        officeAddress: 'Terminal 3 Commercial Zone, Aerocity, New Delhi 110037',
        operatingHours: '24 Hours / 7 Days a Week',
        serviceAreas: ['Delhi NCR', 'Jaipur', 'Agra', 'Chandigarh', 'Dehradun', 'Haridwar'],
        defaultCurrency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata',
        bufferMinutesBetweenTrips: 60,
        advanceBookingHoursRequired: 2,
        cancellationPolicyText:
          'Free cancellation up to 4 hours before scheduled pickup time. Because payment is 100% Cash-on-Arrival, please notify dispatch as early as possible if your travel plans change.',
        termsAndConditionsText:
          'Bookings include an experienced commercial chauffeur, clean fuel-filled vehicle, and passenger transit insurance. Toll taxes and state border tax permits are collected in cash as per actual toll receipts.',
        privacyPolicyText:
          'Your personal name and mobile number are utilized solely for trip coordination and driver dispatch.',
        cashPaymentInstructions:
          'Cash Only: Hand over the exact agreed fare to the chauffeur at pickup or destination. A printed / digital company receipt will be issued immediately.',
      });
      console.log('Seeded Business Settings');
    }

    // 3. Vehicles
    const carCount = await Car.countDocuments();
    if (carCount === 0) {
      const fleet = [
        {
          name: 'Toyota Camry Hybrid',
          brand: 'Toyota',
          model: 'Camry',
          category: 'luxury',
          registrationNumber: 'DL01-CA-1001',
          seatingCapacity: 4,
          luggageCapacity: 3,
          transmission: 'automatic',
          fuelType: 'hybrid',
          primaryImage: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Whisper-quiet luxury hybrid executive sedan with plush leather seating and ventilated climate control.',
          amenities: ['ac', 'wifi', 'leather_seats', 'water_bottle', 'charger', 'bluetooth'],
          baseRatePerKm: 22,
          baseRatePerHour: 450,
          fixedRatePerDay: 4500,
          status: 'active',
          isActive: true,
          year: 2024,
          color: 'Pearl White',
        },
        {
          name: 'Toyota Fortuner Legender 4x4',
          brand: 'Toyota',
          model: 'Fortuner Legender',
          category: 'suv',
          registrationNumber: 'DL01-FO-2002',
          seatingCapacity: 6,
          luggageCapacity: 4,
          transmission: 'automatic',
          fuelType: 'diesel',
          primaryImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Dominant 7-seater luxury SUV designed for rugged hill station routes and supreme highway safety.',
          amenities: ['ac', 'bluetooth', 'leather_seats', 'water_bottle', 'charger', 'gps', 'luggage_rack'],
          baseRatePerKm: 26,
          baseRatePerHour: 550,
          fixedRatePerDay: 5500,
          status: 'active',
          isActive: true,
          year: 2024,
          color: 'Attitude Black',
        },
        {
          name: 'Honda City VTEC',
          brand: 'Honda',
          model: 'City',
          category: 'sedan',
          registrationNumber: 'DL01-HC-3003',
          seatingCapacity: 4,
          luggageCapacity: 2,
          transmission: 'manual',
          fuelType: 'petrol',
          primaryImage: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Spacious family sedan celebrated for class-leading rear legroom, rear AC vents, and high fuel economy.',
          amenities: ['ac', 'bluetooth', 'water_bottle', 'charger'],
          baseRatePerKm: 14,
          baseRatePerHour: 250,
          fixedRatePerDay: 2600,
          status: 'active',
          isActive: true,
          year: 2023,
          color: 'Lunar Silver',
        },
        {
          name: 'Mercedes-Benz E-Class Exclusive',
          brand: 'Mercedes-Benz',
          model: 'E 220d',
          category: 'luxury',
          registrationNumber: 'DL01-MB-4004',
          seatingCapacity: 4,
          luggageCapacity: 3,
          transmission: 'automatic',
          fuelType: 'diesel',
          primaryImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Long wheelbase German flagship with panoramic sunroof, Burmester sound, and reclining rear memory lounge seats.',
          amenities: ['ac', 'wifi', 'bluetooth', 'leather_seats', 'water_bottle', 'charger', 'gps'],
          baseRatePerKm: 38,
          baseRatePerHour: 950,
          fixedRatePerDay: 9500,
          status: 'active',
          isActive: true,
          year: 2024,
          color: 'Obsidian Black',
        },
        {
          name: 'Force Urbania Luxury Van',
          brand: 'Force',
          model: 'Urbania 12S',
          category: 'tempo_traveller',
          registrationNumber: 'DL01-FU-5005',
          seatingCapacity: 12,
          luggageCapacity: 10,
          transmission: 'manual',
          fuelType: 'diesel',
          primaryImage: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Ultra-modern 12-passenger luxury coach featuring individual reclining bucket seats, overhead reading lamps, and USB ports.',
          amenities: ['ac', 'water_bottle', 'charger', 'bluetooth', 'luggage_rack'],
          baseRatePerKm: 32,
          baseRatePerHour: 750,
          fixedRatePerDay: 7500,
          status: 'active',
          isActive: true,
          year: 2023,
          color: 'Arctic Silver',
        },
        {
          name: 'Mahindra XUV700 AX7 Luxury',
          brand: 'Mahindra',
          model: 'XUV700',
          category: 'suv',
          registrationNumber: 'DL01-MX-6006',
          seatingCapacity: 6,
          luggageCapacity: 3,
          transmission: 'automatic',
          fuelType: 'diesel',
          primaryImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'
          ],
          description: '5-star safety rated premium crossover SUV packed with ADAS safety suite, skyroof, and dual-zone climate controls.',
          amenities: ['ac', 'bluetooth', 'charger', 'water_bottle', 'gps'],
          baseRatePerKm: 20,
          baseRatePerHour: 400,
          fixedRatePerDay: 4200,
          status: 'active',
          isActive: true,
          year: 2024,
          color: 'Midnight Blue',
        },
        {
          name: 'Hyundai Verna SX Turbo',
          brand: 'Hyundai',
          model: 'Verna',
          category: 'sedan',
          registrationNumber: 'DL01-HV-7007',
          seatingCapacity: 4,
          luggageCapacity: 2,
          transmission: 'automatic',
          fuelType: 'petrol',
          primaryImage: 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Futuristic fastback sedan with heated/ventilated front seats, Bose acoustics, and generous luggage boot space.',
          amenities: ['ac', 'bluetooth', 'charger', 'water_bottle'],
          baseRatePerKm: 15,
          baseRatePerHour: 280,
          fixedRatePerDay: 2800,
          status: 'active',
          isActive: true,
          year: 2023,
          color: 'Starry Night',
        },
        {
          name: 'Maruti Suzuki Swift VXi',
          brand: 'Maruti Suzuki',
          model: 'Swift',
          category: 'hatchback',
          registrationNumber: 'DL01-MS-8008',
          seatingCapacity: 4,
          luggageCapacity: 1,
          transmission: 'manual',
          fuelType: 'cng',
          primaryImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
          images: [
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80'
          ],
          description: 'Agile, economical city hatchback ideal for quick urban airport transfers and intracity point-to-point errands.',
          amenities: ['ac', 'charger'],
          baseRatePerKm: 11,
          baseRatePerHour: 180,
          fixedRatePerDay: 1900,
          status: 'active',
          isActive: true,
          year: 2023,
          color: 'Fire Red',
        }
      ];

      await Car.insertMany(fleet);
      console.log(`Seeded ${fleet.length} fleet vehicles`);
    }

    // 4. Drivers
    const driverCount = await Driver.countDocuments();
    if (driverCount === 0) {
      const drivers = [
        {
          name: 'Rajesh Kumar',
          phone: '+91 98111 22334',
          licenseNumber: 'DL-042012008451',
          experienceYears: 12,
          status: 'active',
          notes: 'Specialist in Delhi-Jaipur-Agra Golden Triangle outstation tours.',
        },
        {
          name: 'Vikram Singh',
          phone: '+91 98222 33445',
          licenseNumber: 'DL-072015009122',
          experienceYears: 9,
          status: 'active',
          notes: 'English fluent, highly rated for corporate VIP delegations.',
        },
        {
          name: 'Amit Sharma',
          phone: '+91 98333 44556',
          licenseNumber: 'DL-092016007633',
          experienceYears: 7,
          status: 'active',
          notes: 'Punctual, non-smoker, skilled in luxury automatic vehicles.',
        },
        {
          name: 'Ramesh Yadav',
          phone: '+91 98444 55667',
          licenseNumber: 'UP-142014002341',
          experienceYears: 14,
          status: 'active',
          notes: 'Expert hill-station driver for Shimla, Manali & Dehradun.',
        },
        {
          name: 'Sunil Verma',
          phone: '+91 98555 66778',
          licenseNumber: 'HR-262018005432',
          experienceYears: 6,
          status: 'active',
          notes: 'Gurugram & Delhi NCR local hourly route specialist.',
        },
        {
          name: 'Gurpreet Singh',
          phone: '+91 98666 77889',
          licenseNumber: 'PB-102011003419',
          experienceYears: 15,
          status: 'active',
          notes: 'Force Urbania certified coach captain for large tourist groups.',
        },
      ];

      await Driver.insertMany(drivers);
      console.log(`Seeded ${drivers.length} commercial fleet drivers`);
    }

    // 5. Fare Rules
    const rulesCount = await FareRule.countDocuments();
    if (rulesCount === 0) {
      const rules = [
        {
          name: 'Delhi to Agra Express Fixed Fare',
          tripType: 'one_way',
          carCategory: 'sedan',
          origin: 'delhi',
          destination: 'agra',
          fixedPrice: 3800,
          nightSurcharge: 300,
          driverAllowancePerDay: 300,
          priority: 10,
          isActive: true,
        },
        {
          name: 'Delhi to Jaipur Royal Fixed Fare',
          tripType: 'one_way',
          carCategory: 'sedan',
          origin: 'delhi',
          destination: 'jaipur',
          fixedPrice: 4500,
          nightSurcharge: 300,
          driverAllowancePerDay: 400,
          priority: 10,
          isActive: true,
        },
        {
          name: 'Delhi NCR Local City Hourly Package (Sedan)',
          tripType: 'hourly',
          carCategory: 'sedan',
          hourlyPackages: [
            { hours: 4, maxKm: 40, rate: 1200 },
            { hours: 8, maxKm: 80, rate: 2100 },
            { hours: 12, maxKm: 120, rate: 2900 },
          ],
          nightSurcharge: 250,
          driverAllowancePerDay: 0,
          priority: 5,
          isActive: true,
        },
        {
          name: 'Delhi NCR Local City Hourly Package (SUV)',
          tripType: 'hourly',
          carCategory: 'suv',
          hourlyPackages: [
            { hours: 4, maxKm: 40, rate: 1800 },
            { hours: 8, maxKm: 80, rate: 3200 },
            { hours: 12, maxKm: 120, rate: 4400 },
          ],
          nightSurcharge: 300,
          driverAllowancePerDay: 0,
          priority: 5,
          isActive: true,
        },
      ];

      await FareRule.insertMany(rules);
      console.log(`Seeded ${rules.length} custom fare rules`);
    }

    console.log('--- Database Seed Completed Successfully ---');
  }
}

