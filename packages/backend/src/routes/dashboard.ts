import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.organizationId!;

    const [totalAgents, totalNumbers, totalCalls, activeCampaigns, recentCalls] = await Promise.all([
      prisma.agent.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.phoneNumber.count({ where: { organizationId: orgId, isActive: true } }),
      prisma.call.count({ where: { organizationId: orgId } }),
      prisma.campaign.count({ where: { organizationId: orgId, status: 'active' } }),
      prisma.call.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          agent: { select: { name: true } },
          phoneNumber: { select: { number: true } },
        },
      }),
    ]);

    // Call stats for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const callStats = await prisma.call.groupBy({
      by: ['status'],
      where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    const totalMinutes = await prisma.call.aggregate({
      where: { organizationId: orgId, durationSeconds: { not: null } },
      _sum: { durationSeconds: true },
    });

    res.json({
      success: true,
      data: {
        totalAgents,
        totalNumbers,
        totalCalls,
        activeCampaigns,
        totalMinutes: Math.round((totalMinutes._sum.durationSeconds || 0) / 60),
        callBreakdown: callStats.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
        recentCalls,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
