const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    username: {
      type: String,
      required: [true, "Username is required."],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    country: {
      type: String,
    },
    description: {
      type: String,
    },
    genres: {
      type: [String],
    },
    instruments: {
      type: [String],
    },
    rank: {
      type: Number,
    },
    img: {
      type: String,
      default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGjt2yc1eucAzdqAa7ThZTYxtpMXXem3J16Q&usqp=CAU",
    },
    samples: [
      {
        type: Schema.Types.ObjectId,
        ref: "Sample",
      },
    ],
    bands: {
      type: Schema.Types.ObjectId,
      ref: "Band",
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    bandReviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    artistReviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    postNotifications: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
  {
    // this second object adds extra properties: `createdAt` and `updatedAt`
    timestamps: true,
  }
);

const User = model("User", userSchema);

module.exports = User;
