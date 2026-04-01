var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");

const messageModel = require("../schemas/messages");
const userModel = require("../schemas/users");
const { CheckLogin } = require("../utils/authHandler");
const upload = require("../utils/uploadHandler");

// GET /api/v1/messages/:userID
// Lấy toàn bộ message giữa user hiện tại và userID
router.get("/:userID", CheckLogin, async function (req, res, next) {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userID;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).send({ message: "userID khong hop le" });
    }

    const messages = await messageModel
      .find({
        $or: [
          { from: currentUserId, to: otherUserId },
          { from: otherUserId, to: currentUserId },
        ],
      })
      .populate("from", "username email fullName avatarUrl")
      .populate("to", "username email fullName avatarUrl")
      .sort({ createdAt: 1 });

    res.send(messages);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// POST /api/v1/messages/:userID
// Gửi tin nhắn đến userID
// Nếu có file => type = "file", text = req.file.path
// Nếu không có file => type = "text", text = nội dung gửi
router.post(
  "/:userID",
  CheckLogin,
  function (req, res, next) {
    upload.single("file")(req, res, function (err) {
      if (err) {
        return res.status(400).send({ message: err.message });
      }
      next();
    });
  },
  async function (req, res, next) {
    try {
      const currentUserId = req.user._id;
      const toUserId = req.params.userID;

      if (!mongoose.Types.ObjectId.isValid(toUserId)) {
        return res.status(400).send({ message: "userID khong hop le" });
      }

      if (String(currentUserId) === String(toUserId)) {
        return res.status(400).send({ message: "khong the gui tin nhan cho chinh minh" });
      }

      const toUser = await userModel.findOne({
        _id: toUserId,
        isDeleted: false,
      });

      if (!toUser) {
        return res.status(404).send({ message: "nguoi nhan khong ton tai" });
      }

      let messageType = "text";
      let messageText = "";

      if (req.file) {
        messageType = "file";
        messageText = req.file.path;
      } else {
        messageText = req.body.text;
      }

      if (!messageText || !messageText.trim()) {
        return res.status(400).send({ message: "noi dung tin nhan khong duoc de trong" });
      }

      const newMessage = new messageModel({
        from: currentUserId,
        to: toUserId,
        messageContent: {
          type: messageType,
          text: messageText,
        },
      });

      await newMessage.save();
      await newMessage.populate("from", "username email fullName avatarUrl");
      await newMessage.populate("to", "username email fullName avatarUrl");

      res.send(newMessage);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  }
);

// GET /api/v1/messages
// Lấy message cuối cùng của mỗi user mà current user đã nhắn hoặc được nhắn
router.get("/", CheckLogin, async function (req, res, next) {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user._id);

    const lastMessages = await messageModel.aggregate([
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        },
      },
      {
        $addFields: {
          partnerId: {
            $cond: [{ $eq: ["$from", currentUserId] }, "$to", "$from"],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$partnerId",
          lastMessage: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "from",
          foreignField: "_id",
          as: "from",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "to",
          foreignField: "_id",
          as: "to",
        },
      },
      {
        $unwind: "$from",
      },
      {
        $unwind: "$to",
      },
      {
        $project: {
          "from.password": 0,
          "from.loginCount": 0,
          "from.lockTime": 0,
          "from.forgotPasswordToken": 0,
          "from.forgotPasswordTokenExp": 0,
          "to.password": 0,
          "to.loginCount": 0,
          "to.lockTime": 0,
          "to.forgotPasswordToken": 0,
          "to.forgotPasswordTokenExp": 0,
        },
      },
    ]);

    res.send(lastMessages);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;