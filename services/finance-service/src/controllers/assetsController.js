const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { emitFinanceEvent } = require('../events/financeEvents');

/**
 * FITUR 3.4.E: Fixed Assets Management Controller
 * Handles asset registration and depreciation
 */

// Get all assets with summary
exports.getAllAssets = async (req, res) => {
  try {
    const { category, status } = req.query;

    const where = {};
    if (category) where.category = category;
    if (status) where.status = status;

    const assets = await prisma.fixed_assets.findMany({
      where,
      orderBy: { acquisition_date: 'desc' },
      include: {
        depreciation_history: {
          orderBy: { period: 'desc' },
          take: 5
        }
      }
    });

    // Calculate summary
    const totalAcquisitionCost = assets.reduce((sum, a) => sum + Number(a.acquisition_cost), 0);
    const totalAccumulatedDep = assets.reduce((sum, a) => sum + Number(a.accumulated_depreciation), 0);
    const totalBookValue = assets.reduce((sum, a) => sum + Number(a.current_book_value), 0);

    const summary = {
      total_assets: assets.length,
      total_acquisition_cost: totalAcquisitionCost,
      total_depreciation: totalAccumulatedDep,
      total_book_value: totalBookValue,
      by_category: {}
    };

    // Group by category
    assets.forEach(asset => {
      if (!summary.by_category[asset.category]) {
        summary.by_category[asset.category] = {
          count: 0,
          total_cost: 0,
          total_book_value: 0
        };
      }
      summary.by_category[asset.category].count++;
      summary.by_category[asset.category].total_cost += Number(asset.acquisition_cost);
      summary.by_category[asset.category].total_book_value += Number(asset.current_book_value);
    });

    res.json({
      success: true,
      data: assets,
      summary
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assets',
      error: error.message
    });
  }
};

// Get single asset by ID
exports.getAssetById = async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await prisma.fixed_assets.findUnique({
      where: { id: parseInt(id) },
      include: {
        depreciation_history: {
          orderBy: { period: 'desc' }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset',
      error: error.message
    });
  }
};

// Get depreciation history
exports.getDepreciationHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await prisma.asset_depreciation_history.findMany({
      where: { asset_id: parseInt(id) },
      orderBy: { period: 'desc' }
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching depreciation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch depreciation history',
      error: error.message
    });
  }
};

// Create new asset
exports.createAsset = async (req, res) => {
  try {
    const {
      asset_name,
      asset_code,
      category,
      acquisition_date,
      acquisition_cost,
      residual_value = 0,
      useful_life_years,
      depreciation_method = 'STRAIGHT_LINE',
      location,
      notes
    } = req.body;

    // Validation
    if (!asset_name || !asset_code || !category || !acquisition_date || !acquisition_cost || !useful_life_years) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check duplicate asset code
    const existing = await prisma.fixed_assets.findUnique({
      where: { asset_code }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Asset code already exists'
      });
    }

    // Calculate monthly depreciation
    const depreciableAmount = Number(acquisition_cost) - Number(residual_value);
    const monthlyDepreciation = depreciableAmount / (Number(useful_life_years) * 12);

    // Create asset
    const asset = await prisma.fixed_assets.create({
      data: {
        asset_name,
        asset_code,
        category,
        acquisition_date: new Date(acquisition_date),
        acquisition_cost: Number(acquisition_cost),
        residual_value: Number(residual_value),
        useful_life_years: Number(useful_life_years),
        depreciation_method,
        monthly_depreciation_amount: monthlyDepreciation,
        current_book_value: Number(acquisition_cost),
        accumulated_depreciation: 0,
        status: 'ACTIVE',
        location: location || null,
        notes: notes || null
      }
    });

    // Emit event for journal entry (asset acquisition)
    emitFinanceEvent('asset.acquired', {
      assetId: asset.id,
      assetName: asset.asset_name,
      cost: Number(asset.acquisition_cost),
      acquisitionDate: asset.acquisition_date,
      category: asset.category
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: asset
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset',
      error: error.message
    });
  }
};

// Run depreciation for single asset
exports.runDepreciationForAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.body; // Format: YYYY-MM

    const asset = await prisma.fixed_assets.findUnique({
      where: { id: parseInt(id) }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not active'
      });
    }

    // Check if already depreciated for this period
    const existingDep = await prisma.asset_depreciation_history.findFirst({
      where: {
        asset_id: parseInt(id),
        period
      }
    });

    if (existingDep) {
      return res.status(400).json({
        success: false,
        message: 'Depreciation already recorded for this period'
      });
    }

    // Check if book value > residual value
    if (Number(asset.current_book_value) <= Number(asset.residual_value)) {
      return res.status(400).json({
        success: false,
        message: 'Asset already fully depreciated'
      });
    }

    const depreciationAmount = Number(asset.monthly_depreciation_amount);
    const newAccumulatedDep = Number(asset.accumulated_depreciation) + depreciationAmount;
    const newBookValue = Number(asset.acquisition_cost) - newAccumulatedDep;

    // Create depreciation history
    const depHistory = await prisma.asset_depreciation_history.create({
      data: {
        asset_id: parseInt(id),
        period,
        depreciation_expense: depreciationAmount,
        accumulated_depreciation: newAccumulatedDep,
        book_value: newBookValue
      }
    });

    // Update asset
    const newStatus = newBookValue <= Number(asset.residual_value) ? 'FULLY_DEPRECIATED' : 'ACTIVE';
    await prisma.fixed_assets.update({
      where: { id: parseInt(id) },
      data: {
        accumulated_depreciation: newAccumulatedDep,
        current_book_value: newBookValue,
        status: newStatus
      }
    });

    // Emit event for journal entry
    emitFinanceEvent('depreciation.recorded', {
      assetId: asset.id,
      assetName: asset.asset_name,
      amount: depreciationAmount,
      period,
      accumulatedDepreciation: newAccumulatedDep
    });

    res.json({
      success: true,
      message: 'Depreciation recorded successfully',
      data: depHistory
    });
  } catch (error) {
    console.error('Error running depreciation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run depreciation',
      error: error.message
    });
  }
};

// Run monthly depreciation for all assets
exports.runMonthlyDepreciation = async (req, res) => {
  try {
    const period = req.body.period || new Date().toISOString().substring(0, 7);

    const activeAssets = await prisma.fixed_assets.findMany({
      where: { status: 'ACTIVE' }
    });

    let totalDepreciation = 0;
    let processedCount = 0;
    const results = [];

    for (const asset of activeAssets) {
      // Check if already depreciated
      const existing = await prisma.asset_depreciation_history.findFirst({
        where: {
          asset_id: asset.id,
          period
        }
      });

      if (existing) {
        continue;
      }

      // Check if book value > residual value
      if (Number(asset.current_book_value) <= Number(asset.residual_value)) {
        await prisma.fixed_assets.update({
          where: { id: asset.id },
          data: { status: 'FULLY_DEPRECIATED' }
        });
        continue;
      }

      const depreciationAmount = Number(asset.monthly_depreciation_amount);
      const newAccumulatedDep = Number(asset.accumulated_depreciation) + depreciationAmount;
      const newBookValue = Number(asset.acquisition_cost) - newAccumulatedDep;

      // Create history
      await prisma.asset_depreciation_history.create({
        data: {
          asset_id: asset.id,
          period,
          depreciation_expense: depreciationAmount,
          accumulated_depreciation: newAccumulatedDep,
          book_value: newBookValue
        }
      });

      // Update asset
      const newStatus = newBookValue <= Number(asset.residual_value) ? 'FULLY_DEPRECIATED' : 'ACTIVE';
      await prisma.fixed_assets.update({
        where: { id: asset.id },
        data: {
          accumulated_depreciation: newAccumulatedDep,
          current_book_value: newBookValue,
          status: newStatus
        }
      });

      totalDepreciation += depreciationAmount;
      processedCount++;
      results.push({
        assetId: asset.id,
        assetName: asset.asset_name,
        depreciationAmount
      });
    }

    // Emit aggregate event for journal entry
    if (totalDepreciation > 0) {
      emitFinanceEvent('depreciation.posted', {
        period,
        totalAmount: totalDepreciation,
        assetsCount: processedCount,
        details: results
      });
    }

    res.json({
      success: true,
      message: `Monthly depreciation completed for period ${period}`,
      data: {
        period,
        total_depreciation: totalDepreciation,
        assets_processed: processedCount,
        results
      }
    });
  } catch (error) {
    console.error('Error running monthly depreciation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run monthly depreciation',
      error: error.message
    });
  }
};

// Update asset
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const asset = await prisma.fixed_assets.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: asset
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset',
      error: error.message
    });
  }
};

// Dispose asset
exports.disposeAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { disposal_date, disposal_value, notes } = req.body;

    const asset = await prisma.fixed_assets.update({
      where: { id: parseInt(id) },
      data: {
        status: 'DISPOSED',
        notes: notes || asset.notes
      }
    });

    // Emit event for disposal journal
    emitFinanceEvent('asset.disposed', {
      assetId: asset.id,
      assetName: asset.asset_name,
      bookValue: Number(asset.current_book_value),
      disposalValue: Number(disposal_value) || 0,
      disposalDate: new Date(disposal_date)
    });

    res.json({
      success: true,
      message: 'Asset disposed successfully',
      data: asset
    });
  } catch (error) {
    console.error('Error disposing asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispose asset',
      error: error.message
    });
  }
};

// Delete asset
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.fixed_assets.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset',
      error: error.message
    });
  }
};

// Get asset summary
exports.getAssetSummary = async (req, res) => {
  try {
    const assets = await prisma.fixed_assets.findMany();

    const summary = {
      total_assets: assets.length,
      total_acquisition_cost: 0,
      total_accumulated_depreciation: 0,
      total_book_value: 0,
      by_status: { ACTIVE: 0, DISPOSED: 0, FULLY_DEPRECIATED: 0 },
      by_category: {}
    };

    assets.forEach(asset => {
      summary.total_acquisition_cost += Number(asset.acquisition_cost);
      summary.total_accumulated_depreciation += Number(asset.accumulated_depreciation);
      summary.total_book_value += Number(asset.current_book_value);
      summary.by_status[asset.status]++;

      if (!summary.by_category[asset.category]) {
        summary.by_category[asset.category] = {
          count: 0,
          total_cost: 0,
          total_book_value: 0
        };
      }
      summary.by_category[asset.category].count++;
      summary.by_category[asset.category].total_cost += Number(asset.acquisition_cost);
      summary.by_category[asset.category].total_book_value += Number(asset.current_book_value);
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting asset summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get asset summary',
      error: error.message
    });
  }
};
