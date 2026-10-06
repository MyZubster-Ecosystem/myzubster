const crypto = require('crypto');
const mongoose = require('mongoose');

const ZorgaxCreditAccount = require('../models/ZorgaxCreditAccount');
const {
  LEDGER_TYPES,
  ZorgaxLedgerEntry
} = require('../models/ZorgaxLedgerEntry');

function requireOwnerId(ownerId) {
  const normalized = String(ownerId || '').trim();

  if (!normalized) {
    throw new Error('ownerId is required');
  }

  return normalized;
}

function requirePositiveCredits(value, fieldName = 'credits') {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive safe integer`);
  }

  return value;
}

function requireReference(value, fieldName) {
  const normalized = String(value || '').trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

function newEntryId() {
  return `zle_${crypto.randomUUID()}`;
}

async function getBalance(ownerId) {
  const normalizedOwnerId = requireOwnerId(ownerId);

  const account = await ZorgaxCreditAccount.findOne({
    ownerId: normalizedOwnerId
  }).lean();

  return {
    ownerId: normalizedOwnerId,
    balanceCredits: account?.balanceCredits || 0,
    totalPurchasedCredits: account?.totalPurchasedCredits || 0,
    totalConsumedCredits: account?.totalConsumedCredits || 0
  };
}

async function listLedger({
  ownerId,
  limit = 50,
  before = null
}) {
  const normalizedOwnerId = requireOwnerId(ownerId);

  if (!Number.isSafeInteger(limit) || limit <= 0 || limit > 100) {
    throw new Error('limit must be an integer between 1 and 100');
  }

  const query = {
    ownerId: normalizedOwnerId
  };

  if (before) {
    const beforeDate = new Date(before);

    if (Number.isNaN(beforeDate.getTime())) {
      throw new Error('before must be a valid date');
    }

    query.createdAt = {
      $lt: beforeDate
    };
  }

  return ZorgaxLedgerEntry.find(query)
    .sort({
      createdAt: -1,
      _id: -1
    })
    .limit(limit)
    .lean();
}

async function grantPurchaseCredits({
  ownerId,
  credits,
  paymentIntentId,
  productId = null,
  metadata = {}
}) {
  const normalizedOwnerId = requireOwnerId(ownerId);
  const normalizedCredits = requirePositiveCredits(credits);
  const normalizedPaymentIntentId = requireReference(
    paymentIntentId,
    'paymentIntentId'
  );

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existingEntry = await ZorgaxLedgerEntry.findOne({
        paymentIntentId: normalizedPaymentIntentId
      })
        .session(session)
        .lean();

      if (existingEntry) {
        if (
          existingEntry.ownerId !== normalizedOwnerId ||
          existingEntry.type !== LEDGER_TYPES.PURCHASE
        ) {
          throw new Error(
            'paymentIntentId is already bound to another ledger operation'
          );
        }

        result = {
          replay: true,
          entry: existingEntry,
          balanceCredits: existingEntry.balanceAfterCredits
        };

        return;
      }

      const account = await ZorgaxCreditAccount.findOneAndUpdate(
        {
          ownerId: normalizedOwnerId
        },
        {
          $setOnInsert: {
            ownerId: normalizedOwnerId,
            metadata: {}
          },
          $inc: {
            balanceCredits: normalizedCredits,
            totalPurchasedCredits: normalizedCredits
          }
        },
        {
          new: true,
          upsert: true,
          session,
          runValidators: true
        }
      );

      const [entry] = await ZorgaxLedgerEntry.create(
        [
          {
            entryId: newEntryId(),
            ownerId: normalizedOwnerId,
            type: LEDGER_TYPES.PURCHASE,
            amountCredits: normalizedCredits,
            balanceAfterCredits: account.balanceCredits,
            productId:
              productId === null || productId === undefined
                ? null
                : String(productId).trim() || null,
            paymentIntentId: normalizedPaymentIntentId,
            usageReference: null,
            metadata
          }
        ],
        {
          session
        }
      );

      result = {
        replay: false,
        entry: entry.toObject(),
        balanceCredits: account.balanceCredits
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

async function consumeCredits({
  ownerId,
  credits,
  usageReference,
  productId = null,
  metadata = {}
}) {
  const normalizedOwnerId = requireOwnerId(ownerId);
  const normalizedCredits = requirePositiveCredits(credits);
  const normalizedUsageReference = requireReference(
    usageReference,
    'usageReference'
  );

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const existingEntry = await ZorgaxLedgerEntry.findOne({
        ownerId: normalizedOwnerId,
        usageReference: normalizedUsageReference
      })
        .session(session)
        .lean();

      if (existingEntry) {
        if (existingEntry.type !== LEDGER_TYPES.USAGE) {
          throw new Error(
            'usageReference is already bound to another ledger operation'
          );
        }

        result = {
          replay: true,
          entry: existingEntry,
          balanceCredits: existingEntry.balanceAfterCredits
        };

        return;
      }

      const account = await ZorgaxCreditAccount.findOneAndUpdate(
        {
          ownerId: normalizedOwnerId,
          balanceCredits: {
            $gte: normalizedCredits
          }
        },
        {
          $inc: {
            balanceCredits: -normalizedCredits,
            totalConsumedCredits: normalizedCredits
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!account) {
        const existingAccount = await ZorgaxCreditAccount.findOne({
          ownerId: normalizedOwnerId
        })
          .session(session)
          .lean();

        const currentBalance = existingAccount?.balanceCredits || 0;

        throw new Error(
          `Insufficient Zorgax credits: required ${normalizedCredits}, available ${currentBalance}`
        );
      }

      const [entry] = await ZorgaxLedgerEntry.create(
        [
          {
            entryId: newEntryId(),
            ownerId: normalizedOwnerId,
            type: LEDGER_TYPES.USAGE,
            amountCredits: -normalizedCredits,
            balanceAfterCredits: account.balanceCredits,
            productId:
              productId === null || productId === undefined
                ? null
                : String(productId).trim() || null,
            paymentIntentId: null,
            usageReference: normalizedUsageReference,
            metadata
          }
        ],
        {
          session
        }
      );

      result = {
        replay: false,
        entry: entry.toObject(),
        balanceCredits: account.balanceCredits
      };
    });

    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = {
  consumeCredits,
  getBalance,
  grantPurchaseCredits,
  listLedger,
  requireOwnerId,
  requirePositiveCredits,
  requireReference
};