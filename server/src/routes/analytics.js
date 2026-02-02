const express = require('express');
const router = express.Router();
const ErrorModel = require('../models/Error');

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); 

const ErrorOccurrence = require('../models/ErrorOccurrence');

router.get('/trends', async (req, res) => {
  try {
    const { range = '7d', groupBy = 'day' } = req.query;

    const startDate = getStartDate(range);
    const dateFormat = getDateFormat(groupBy);

    const trendData = await ErrorOccurrence.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'errors',
          localField: 'errorId',
          foreignField: '_id',
          as: 'error'
        }
      },
      { $unwind: '$error' },
      {
        $group: {
          _id: {
            time: {
              $dateToString: {
                format: dateFormat,
                date: '$createdAt'
              }
            },
            environment: '$error.environment'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.time',
          environments: {
            $push: {
              k: '$_id.environment',
              v: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $project: {
          _id: 0,
          time: '$_id',
          count: '$total',
          environments: {
            $arrayToObject: '$environments'
          }
        }
      },
      { $sort: { time: 1 } }
    ]);

    const totalOccurrences = trendData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    res.json({
      range,
      groupBy,
      totalOccurrences,
      trend: trendData
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to load trends' });
  }
});


router.get('/top-errors', async (req, res) => {
  try {
    const { environment } = req.query;

    const filter = {};
    if (environment) {
      filter.environment = environment;
    }

    const [
      topErrors,
      recentErrors,
      criticalErrors
    ] = await Promise.all([
      ErrorModel.find(filter)
        .sort({ count: -1 })
        .limit(10)
        .select('message count environment status lastSeen')
        .lean(),

      ErrorModel.find(filter)
        .sort({ lastSeen: -1 })
        .limit(10)
        .select('message count environment status lastSeen')
        .lean(),

      ErrorModel.find({
        ...filter,
        status: 'open',
        count: { $gte: 10 }
      })
        .sort({ count: -1 })
        .limit(10)
        .select('message count environment lastSeen')
        .lean()
    ]);

    res.json({
      topErrors,
      recentErrors,
      criticalErrors
    });

  } catch (err) {
    res.status(500).json({ message: 'Failed to load top errors analytics' });
  }
});


router.get('/overview', async (req, res) => {
  try {
    // Cache check
    const cachedData = cache.get('analytics_overview');
    if (cachedData) {
      return res.json(cachedData);
    }

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalErrors,
      newErrorsLast24h,
      errorTrend,
      mostFrequentErrors
    ] = await Promise.all([
      ErrorModel.countDocuments(),
      ErrorModel.countDocuments({ firstSeen: { $gte: since24h } }),
      ErrorModel.aggregate([
        { $match: { lastSeen: { $gte: since7d } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$lastSeen'
              }
            },
            count: { $sum: '$count' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      ErrorModel.find()
        .sort({ count: -1 })
        .limit(5)
        .select('message count')
        .lean()
    ]);

    const responseData = {
      totalErrors,
      newErrorsLast24h,
      errorTrend,
      mostFrequentErrors
    };

    // Store in cache
    cache.set('analytics_overview', responseData);

    res.json(responseData);

  } catch (err) {
    res.status(500).json({ message: 'Failed to load analytics' });
  }
});

module.exports = router;
