const express = require('express');

const Artwork = require('../models/Artwork');
const { requireApiKeyAndJwt } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/asyncHandler');
const { canAccessMuseum } = require('../services/tenant');
const { generateEntityId } = require('../services/ids');
const { paginateQuery } = require('../services/pagination');

const router = express.Router();

router.use(requireApiKeyAndJwt);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.user.role === 'museum_curator') {
      filter.museumId = { $in: req.user.assignedMuseumIds || [] };
    }

    const result = await paginateQuery({
      model: Artwork,
      req,
      baseFilter: filter,
      allowedSortFields: ['id', 'museumId', 'title', 'artist', 'category', 'style', 'status', 'createdAt', 'updatedAt'],
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      searchableFields: ['id', 'museumId', 'title', 'artist', 'category', 'style', 'description', 'universalObjectId'],
    });

    return res.status(200).json(result);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const artwork = await Artwork.findOne({ id: req.params.id });
    if (!artwork) {
      return res.status(404).json({ error: { message: 'Artwork not found', status: 404 } });
    }

    if (!canAccessMuseum(req.user, artwork.museumId)) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    return res.status(200).json(artwork);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = req.body || {};

    if (!payload.museumId || !canAccessMuseum(req.user, payload.museumId)) {
      return res.status(403).json({ error: { message: 'Forbidden museum scope', status: 403 } });
    }

    const artwork = await Artwork.create({
      ...payload,
      id: payload.id || generateEntityId('art'),
    });

    return res.status(201).json(artwork);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const artwork = await Artwork.findOne({ id: req.params.id });

    if (!artwork) {
      return res.status(404).json({ error: { message: 'Artwork not found', status: 404 } });
    }

    if (!canAccessMuseum(req.user, artwork.museumId)) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    Object.assign(artwork, req.body || {});
    await artwork.save();

    return res.status(200).json(artwork);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const artwork = await Artwork.findOne({ id: req.params.id });

    if (!artwork) {
      return res.status(404).json({ error: { message: 'Artwork not found', status: 404 } });
    }

    if (!canAccessMuseum(req.user, artwork.museumId)) {
      return res.status(403).json({ error: { message: 'Forbidden', status: 403 } });
    }

    await artwork.deleteOne();
    return res.status(204).send();
  })
);

module.exports = router;
