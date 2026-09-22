import { Response } from 'express';
import { Enquiry } from '../models/Enquiry';
import { SiteVisit } from '../models/SiteVisit';
import { GalleryItem } from '../models/content';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const dashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [
    total, newCount, contacted, scheduled, completed, threeBhk, openPlot,
    galleryCount, monthly, byType, byStatus, recent, upcoming,
  ] = await Promise.all([
    Enquiry.countDocuments(),
    Enquiry.countDocuments({ status: 'New' }),
    Enquiry.countDocuments({ status: 'Contacted' }),
    Enquiry.countDocuments({ status: 'Site Visit Scheduled' }),
    Enquiry.countDocuments({ status: 'Converted' }),
    Enquiry.countDocuments({ enquiryType: '3 BHK Residence' }),
    Enquiry.countDocuments({ enquiryType: 'Open Plot' }),
    GalleryItem.countDocuments({ active: true }),
    Enquiry.aggregate([
      { $match: { createdAt: { $gte: new Date(today.getFullYear(), today.getMonth() - 11, 1) } } },
      {
        $group: {
          _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Enquiry.aggregate([{ $group: { _id: '$enquiryType', count: { $sum: 1 } } }]),
    Enquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Enquiry.find().sort({ createdAt: -1 }).limit(6).lean(),
    SiteVisit.find({ status: { $in: ['Requested', 'Confirmed', 'Rescheduled'] }, visitDate: { $gte: startOfMonth } })
      .sort({ visitDate: 1, visitTime: 1 })
      .limit(6)
      .lean(),
  ]);

  const visitsStats = await SiteVisit.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);

  res.json({
    success:
      true,
    stats: {
      totalEnquiries: total,
      newEnquiries: newCount,
      newThisWeek: await Enquiry.countDocuments({ createdAt: { $gte: weekAgo } }),
      contacted,
      scheduledVisits: scheduled,
      completedVisits: await SiteVisit.countDocuments({ status: 'Completed' }),
      threeBhkEnquiries: threeBhk,
      openPlotEnquiries: openPlot,
      galleryImages: galleryCount,
      upcomingVisitsCount: upcoming.length,
    },
    monthly,
    byType,
    byStatus,
    visitStatuses: visitsStats,
    recentEnquiries: recent,
    upcomingVisits: upcoming,
  });
});
