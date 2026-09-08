jest.mock("../models/ChatChannel");
jest.mock("../models/ChatMessage");
jest.mock("../models/CommunityMembership");
jest.mock("./realtimeModeration");
jest.mock("./notificationService", () => ({ createNotification: jest.fn() }));

const mongoose = require("mongoose");
const ChatChannel = require("../models/ChatChannel");
const ChatMessage = require("../models/ChatMessage");
const CommunityMembership = require("../models/CommunityMembership");
const { deliveryDecision } = require("./realtimeModeration");
const { createNotification } = require("./notificationService");
const {
  isCommunityMember,
  persistMessage,
  cleanBody,
  MESSAGE_BURST_LIMIT,
} = require("./chatMessaging");

describe("chatMessaging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: 1,
    });
    ChatMessage.countDocuments.mockResolvedValue(0);
  });

  test("sanitizes control characters and bounds message length", () => {
    expect(cleanBody("hello\u0000world")).toBe("helloworld");
    expect(cleanBody("x".repeat(2500))).toHaveLength(2000);
  });

  test("community membership authority only accepts active membership", async () => {
    CommunityMembership.findOne.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({
          communityId: "c1",
          userId: "u1",
          status: "active",
        }),
    });
    await expect(
      isCommunityMember({ communityId: "c1", userId: "u1" }),
    ).resolves.toBe(true);
  });

  test("blocked direct delivery is rejected before persistence", async () => {
    ChatChannel.findOne.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({
          channelId: "d1",
          type: "direct",
          participantUserIds: ["u1", "u2"],
        }),
    });
    ChatMessage.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    deliveryDecision.mockResolvedValue({
      allowed: false,
      status: "blocked",
      reason: "block-policy",
    });
    const result = await persistMessage({
      actorUserId: "u1",
      channelId: "d1",
      clientMessageId: "client-1",
      body: "hi",
    });
    expect(result.valid).toBe(false);
    expect(result.status).toBe(403);
    expect(ChatMessage.create).not.toHaveBeenCalled();
  });

  test("duplicate clientMessageId does not create or redeliver message", async () => {
    const existing = {
      messageId: "m1",
      clientMessageId: "client-1",
      channelId: "d1",
      senderUserId: "u1",
      body: "hi",
    };
    ChatChannel.findOne.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({
          channelId: "d1",
          type: "direct",
          participantUserIds: ["u1", "u2"],
        }),
    });
    ChatMessage.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(existing),
    });
    const result = await persistMessage({
      actorUserId: "u1",
      channelId: "d1",
      clientMessageId: "client-1",
      body: "hi",
    });
    expect(result.valid).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(result.deliverTo).toEqual([]);
    expect(ChatMessage.create).not.toHaveBeenCalled();
    expect(ChatMessage.countDocuments).not.toHaveBeenCalled();
  });

  test("burst messaging is rate limited using persisted message history", async () => {
    ChatChannel.findOne.mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({
          channelId: "d1",
          type: "direct",
          participantUserIds: ["u1", "u2"],
        }),
    });
    ChatMessage.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    ChatMessage.countDocuments.mockResolvedValue(MESSAGE_BURST_LIMIT);
    const result = await persistMessage({
      actorUserId: "u1",
      channelId: "d1",
      clientMessageId: "client-rate",
      body: "too fast",
    });
    expect(result.valid).toBe(false);
    expect(result.status).toBe(429);
    expect(result.reason).toBe("message-burst-rate-limit");
    expect(ChatMessage.create).not.toHaveBeenCalled();
  });

  test("keeps the durable message successful when live notification processing fails", async () => {
    const channel = {
      channelId: "d1",
      type: "direct",
      participantUserIds: ["u1", "u2"],
    };
    const durableMessage = {
      messageId: "m1",
      clientMessageId: "client-restart",
      channelId: "d1",
      senderUserId: "u1",
      body: "survives worker restart",
      createdAt: new Date(),
    };
    ChatChannel.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(channel),
    });
    ChatMessage.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    ChatMessage.create.mockResolvedValue({ toObject: () => durableMessage });
    deliveryDecision.mockResolvedValue({ allowed: true });
    createNotification.mockRejectedValue(
      new Error("notification worker restarting"),
    );

    const result = await persistMessage({
      actorUserId: "u1",
      channelId: "d1",
      clientMessageId: "client-restart",
      body: "survives worker restart",
    });

    expect(result.valid).toBe(true);
    expect(result.message.messageId).toBe("m1");
    expect(result.notificationSummary).toEqual({
      attempted: 1,
      persisted: 0,
      skipped: 0,
      failed: 1,
    });
    expect(ChatMessage.create).toHaveBeenCalledTimes(1);
  });
});
