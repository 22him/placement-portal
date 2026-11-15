import { asyncHandler, HttpError } from '../middleware/auth.js';

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Generic CRUD controller factory used for admin-managed collections.
export function crud(Model, { searchFields = [], populate = '', sort = { createdAt: -1 }, label = 'Item' } = {}) {
  return {
    list: asyncHandler(async (req, res) => {
      const { search, ...filters } = req.query;
      const q = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v && Model.schema.path(k)) q[k] = v;
      });
      if (search && searchFields.length) q.$or = searchFields.map((f) => ({ [f]: new RegExp(esc(search), 'i') }));
      const items = await Model.find(q).sort(sort).populate(populate);
      res.json({ items });
    }),
    get: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id).populate(populate);
      if (!item) throw new HttpError(404, `${label} not found`);
      res.json({ item });
    }),
    create: asyncHandler(async (req, res) => {
      const item = await Model.create(req.body);
      res.status(201).json({ item });
    }),
    update: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) throw new HttpError(404, `${label} not found`);
      res.json({ item });
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw new HttpError(404, `${label} not found`);
      res.json({ message: `${label} deleted` });
    }),
  };
}
