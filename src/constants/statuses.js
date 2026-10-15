module.exports = {
  APPLICATION_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    REJECTED: 'rejected',
  },
  REVIEW_DECISIONS: ['recommend_approve', 'recommend_reject', 'needs_info'],
  PAYMENT_METHODS: ['cash', 'bank_transfer', 'mobile_money', 'card'],
};