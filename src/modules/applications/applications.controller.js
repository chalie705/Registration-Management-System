const fs = require('fs');
const { db } = require('../../config/db');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const { getPagination, paginated } = require('../../utils/pagination');
const { logAudit } = require('../../utils/audit');
const { ROLES } = require('../../constants/roles');
const { APPLICATION_STATUS: ST } = require('../../constants/statuses');

const listColumns = [
  'a.id', 'a.application_no', 'a.status', 'a.submitted_at', 'a.decided_at', 'a.created_at',
  'u.full_name as applicant_name', 'u.email as applicant_email',
  'p.name as program_name', 'p.code as program_code', 'rp.name as period_name',
];

const baseQuery = () =>
  db('applications as a')
    .join('applicants as ap', 'ap.id', 'a.applicant_id')
    .join('users as u', 'u.id', 'ap.user_id')
    .join('programs as p', 'p.id', 'a.program_id')
    .join('registration_periods as rp', 'rp.id', 'a.period_id');

const addHistory = (trx, applicationId, from, to, userId, remarks = null) =>
  trx('application_status_history').insert({
    application_id: applicationId,
    from_status: from,
    to_status: to,
    changed_by: userId,
    remarks,
  });

const getOpenPeriod = (id) =>
  db('registration_periods')
    .where({ id, is_open: true })
    .where('start_date', '<=', db.raw('CURRENT_DATE'))
    .where('end_date', '>=', db.raw('CURRENT_DATE'))
    .first();

async function findOwned(req, id) {
  const app = await db('applications as a')
    .join('applicants as ap', 'ap.id', 'a.applicant_id')
    .where('a.id', id)
    .select('a.*', 'ap.user_id')
    .first();
  if (!app) throw new ApiError(404, 'Application not found');
  if (app.user_id !== req.user.id) throw new ApiError(403, 'You do not have access to this application');
  return app;
}

async function runList(req, res, query) {
  const pg = getPagination(req.query);
  const { status, program_id, period_id, search } = req.query;

  if (status) query.where('a.status', status);
  if (program_id) query.where('a.program_id', program_id);
  if (period_id) query.where('a.period_id', period_id);
  if (search) {
    query.where((b) =>
      b.whereILike('a.application_no', `%${search}%`).orWhereILike('u.full_name', `%${search}%`)
    );
  }

  const [{ count }] = await query.clone().count('* as count');
  const rows = await query.clone().select(listColumns).orderBy('a.created_at', 'desc').limit(pg.limit).offset(pg.offset);
  res.json(paginated(rows, Number(count), pg));
}

exports.listMine = asyncHandler(async (req, res) => {
  await runList(req, res, baseQuery().where('ap.user_id', req.user.id));
});

exports.listAll = asyncHandler(async (req, res) => {
  await runList(req, res, baseQuery().whereNot('a.status', ST.DRAFT));
});

exports.getOne = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const app = await baseQuery()
    .where('a.id', id)
    .select('a.*', 'ap.user_id', 'u.full_name as applicant_name', 'u.email as applicant_email',
      'p.name as program_name', 'p.code as program_code', 'rp.name as period_name')
    .first();
  if (!app) throw new ApiError(404, 'Application not found');

  const isApplicant = req.user.role === ROLES.APPLICANT;
  if (isApplicant && app.user_id !== req.user.id) throw new ApiError(403, 'You do not have access to this application');
  if (!isApplicant && app.status === ST.DRAFT) throw new ApiError(404, 'Application not found');

  const documents = await db('application_documents')
    .where({ application_id: id })
    .select('id', 'doc_type', 'file_name', 'mime_type', 'size_bytes', 'created_at');
  const history = await db('application_status_history').where({ application_id: id }).orderBy('created_at');

  const result = { ...app, documents, history };

  if (!isApplicant) {
    result.reviews = await db('application_reviews as r')
      .join('users as u', 'u.id', 'r.reviewer_id')
      .where('r.application_id', id)
      .select('r.*', 'u.full_name as reviewer_name')
      .orderBy('r.created_at');
    result.payments = await db('payments').where({ application_id: id }).orderBy('created_at');
  }

  res.json(result);
});

exports.create = asyncHandler(async (req, res) => {
  const { program_id, period_id, statement } = req.body;

  const applicant = await db('applicants').where({ user_id: req.user.id }).first();
  if (!applicant) throw new ApiError(400, 'Applicant profile not found');

  if (!(await db('programs').where({ id: program_id, is_active: true }).first())) {
    throw new ApiError(404, 'Program not found or inactive');
  }
  if (!(await getOpenPeriod(period_id))) throw new ApiError(422, 'Registration period is closed or not found');

  const duplicate = await db('applications')
    .where({ applicant_id: applicant.id, program_id, period_id })
    .whereNot('status', ST.REJECTED)
    .first();
  if (duplicate) throw new ApiError(409, 'You already have an application for this program and period');

  const application = await db.transaction(async (trx) => {
    const [row] = await trx('applications')
      .insert({ applicant_id: applicant.id, program_id, period_id, statement, status: ST.DRAFT })
      .returning('*');
    const [updated] = await trx('applications')
      .where({ id: row.id })
      .update({ application_no: `APP-${new Date().getFullYear()}-${String(row.id).padStart(6, '0')}` })
      .returning('*');
    await addHistory(trx, row.id, null, ST.DRAFT, req.user.id, 'Application created');
    return updated;
  });

  await logAudit(req, { action: 'application.create', entity: 'applications', entityId: application.id });
  res.status(201).json(application);
});

exports.updateDraft = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const app = await findOwned(req, id);
  if (app.status !== ST.DRAFT) throw new ApiError(409, 'Only draft applications can be edited');

  if (req.body.program_id && !(await db('programs').where({ id: req.body.program_id, is_active: true }).first())) {
    throw new ApiError(404, 'Program not found or inactive');
  }
  if (req.body.period_id && !(await getOpenPeriod(req.body.period_id))) {
    throw new ApiError(422, 'Registration period is closed or not found');
  }

  const [updated] = await db('applications')
    .where({ id })
    .update({ ...req.body, updated_at: db.fn.now() })
    .returning('*');
  res.json(updated);
});

exports.uploadDocument = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const file = req.file;
  if (!file) throw new ApiError(400, 'No file uploaded. Send the file in the "file" field');

  try {
    const app = await findOwned(req, id);
    if (app.status !== ST.DRAFT) throw new ApiError(409, 'Documents can only be added to draft applications');

    const [doc] = await db('application_documents')
      .insert({
        application_id: id,
        doc_type: (req.body.doc_type || 'other').slice(0, 50),
        file_name: file.originalname,
        file_path: file.path,
        mime_type: file.mimetype,
        size_bytes: file.size,
        uploaded_by: req.user.id,
      })
      .returning(['id', 'doc_type', 'file_name', 'mime_type', 'size_bytes', 'created_at']);

    res.status(201).json(doc);
  } catch (err) {
    fs.unlink(file.path, () => {});
    throw err;
  }
});

exports.submit = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const app = await findOwned(req, id);
  if (app.status !== ST.DRAFT) throw new ApiError(409, 'Application has already been submitted');

  const { count } = await db('application_documents').where({ application_id: id }).count('* as count').first();
  if (Number(count) < 1) throw new ApiError(422, 'Upload at least one document before submitting');
  if (!(await getOpenPeriod(app.period_id))) throw new ApiError(422, 'Registration period is closed');

  const updated = await db.transaction(async (trx) => {
    const [row] = await trx('applications')
      .where({ id })
      .update({ status: ST.SUBMITTED, submitted_at: db.fn.now(), updated_at: db.fn.now() })
      .returning('*');
    await addHistory(trx, id, ST.DRAFT, ST.SUBMITTED, req.user.id, 'Application submitted');
    return row;
  });

  await logAudit(req, { action: 'application.submit', entity: 'applications', entityId: id });
  res.json(updated);
});

exports.review = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const app = await db('applications').where({ id }).first();
  if (!app) throw new ApiError(404, 'Application not found');
  if (![ST.SUBMITTED, ST.UNDER_REVIEW].includes(app.status)) {
    throw new ApiError(409, `Cannot review an application with status "${app.status}"`);
  }

  const review = await db.transaction(async (trx) => {
    const [row] = await trx('application_reviews')
      .insert({ application_id: id, reviewer_id: req.user.id, ...req.body })
      .returning('*');
    if (app.status === ST.SUBMITTED) {
      await trx('applications').where({ id }).update({ status: ST.UNDER_REVIEW, updated_at: db.fn.now() });
      await addHistory(trx, id, ST.SUBMITTED, ST.UNDER_REVIEW, req.user.id, 'Review started');
    }
    return row;
  });

  await logAudit(req, { action: 'application.review', entity: 'applications', entityId: id, details: { decision: req.body.decision } });
  res.status(201).json(review);
});

exports.decide = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { decision, remarks } = req.body;

  const app = await db('applications').where({ id }).first();
  if (!app) throw new ApiError(404, 'Application not found');
  if (app.status !== ST.UNDER_REVIEW) throw new ApiError(409, 'Application must be under review before a final decision');

  const updated = await db.transaction(async (trx) => {
    const [row] = await trx('applications')
      .where({ id })
      .update({
        status: decision,
        decided_at: db.fn.now(),
        decided_by: req.user.id,
        decision_remarks: remarks,
        updated_at: db.fn.now(),
      })
      .returning('*');
    await addHistory(trx, id, ST.UNDER_REVIEW, decision, req.user.id, remarks);
    return row;
  });

  await logAudit(req, { action: 'application.decision', entity: 'applications', entityId: id, details: { decision } });
  res.json(updated);
});