const router = require("express").Router();
const mongoose = require("mongoose");
const { isAuthenticated } = require("../middleware/jwt.middleware");

/* Requiring models */
const Band = require("../models/Band.model");
const Review = require("../models/Review.model");
const User = require("../models/User.model");
const Sample = require("../models/Sample.model");

/* GET route to render user profiles */
router.get("/profile/:userId", isAuthenticated, async (req, res) => {
  let { userId } = req.params;
  const user = req.payload;
  try {
    let currentUser = await User.findById(user._id);
    let profileUser = await User.findById(userId);
    await profileUser.populate("bands bandReviews artistReviews samples friends");
    await profileUser.populate({
      path: "bandReviews",
      populate: {
        path: "band",
        model: "Band",
      },
    });
    await profileUser.populate({
      path: "artistReviews",
      populate: {
        path: "artist",
        model: "User",
      },
    });

    res.json({ profileUser, currentUser });
  } catch (error) {
    res.json(error);
  }
});

/* POST route to edit profile page */
router.put("/profile/:userId/edit", isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      username,
      firstName,
      lastName,
      img,
      nationality,
      description,
      genres,
    } = req.body;

    const currentUser = await User.findById(req.payload._id);
    const profileUser = await User.findById(userId);

    // Check if the current user is the profile user
    const permission =
      currentUser._id.toString() === profileUser._id.toString();

    if (permission) {
      // Update the user's profile
      await User.findByIdAndUpdate(userId, {
        username,
        firstName,
        lastName,
        img,
        nationality,
        description,
        genres,
      });
      res.json({ success: true, message: "Profile updated successfully" });
    } else {
      res.status(403).json({ error: "Permission denied" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

/* POST Route to delete user profile */
router.post("/profile/:userId/delete", async (req, res) => {
  try {
    let { userId } = req.params;
    let currentUser = await User.findById(req.session.currentUser._id);
    let profileUser = await User.findById(userId);
    let permission = false;
    if (currentUser === profileUser) {
      permission = true;
    }
    if (permission) {
      await User.findByIdAndDelete(userId);
      req.session.destroy((err) => {
        if (err) {
          res
            .status(500)
            .render("/profile/:userId", { errorMessage: err.message });
          return;
        }
      });
    }
    req.json(permission);
  } catch (error) {}
});

/* POST Route to leave a review on the artist */
router.post("/profile/:userId/review", isAuthenticated, async (req, res) => {
  const { userId } = req.params;
  const { content, rating, img } = req.body;
  const user = req.payload;
  try {
    const newReview = await Review.create({
      content,
      img,
      rating,
    });

    await User.findByIdAndUpdate(userId, {
      $push: { reviews: newReview._id },
    });

    await User.findByIdAndUpdate(user._id, {
      $push: { artistReviews: newReview._id },
    });

    await Review.findByIdAndUpdate(newReview._id, {
      $push: { user: user._id },
    });

    await Review.findByIdAndUpdate(newReview._id, {
      $push: { artist: userId },
    });

    res.json(newReview);
  } catch (error) {
    res.json(error);
  }
});

/* POST route to delete reviews */
router.post("/review/:reviewId/delete", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const removedReview = await Review.findById(reviewId).populate("user");

    if (!removedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    const user = await User.findById(removedReview.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(user._id, {
      $pull: {
        bandReviews: removedReview._id,
        artistReviews: removedReview._id,
      },
    });

    await Band.findByIdAndUpdate(removedReview.band._id, {
      $pull: {
        reviews: removedReview._id,
      },
    });

    await Review.findByIdAndDelete(removedReview._id);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

/* GET Route to get all the artists */
router.get("/artists", async (req, res) => {
  try {
    let allArtists = await User.find();
    res.json(allArtists);
  } catch (error) {
    res.json(error);
  }
});

/* FRIEND REQUESTS */

/* GET Route to see friend requests */
router.get("/friend-requests", isAuthenticated, async (req, res) => {
  const user = req.payload;
  try {
    const currentUser = await User.findById(user._id);
    currentUser.populate("friendRequests");
    res.json(currentUser.friendRequests);
  } catch (error) {
    res.json(error);
  }
});

/* PUT Route to send a friend request */
router.put("/friend-request/:friendId", isAuthenticated, async (req, res) => {
  const { friendId } = req.params;
  const user = req.payload;
  try {
    await User.findByIdAndUpdate(friendId, {
      $push: { friendRequests: user._id },
    });
    res.json({ message: "success" });
  } catch (error) {
    res.json(error);
  }
});

/* PUT Route to remove a friend request */
router.put(
  "/friend-request/:friendId/remove",
  isAuthenticated,
  async (req, res) => {
    const { friendId } = req.params;
    const user = req.payload;
    try {
      await User.findByIdAndUpdate(friendId, {
        $pull: { friendRequests: user._id },
      });
      res.json({ message: "success" });
    } catch (error) {
      res.json(error);
    }
  }
);

/* PUT Route to accept a friend request */
router.put(
  "/friend-request/:friendId/accept",
  isAuthenticated,
  async (req, res) => {
    const { friendId } = req.params;
    const user = req.payload;
    try {
      await User.findByIdAndUpdate(user._id, {
        $pull: { friendRequests: friendId },
        $push: { friends: friendId },
      });
      await User.findByIdAndUpdate(friendId, {
        $push: {friends: user._id}
      })
      res.json({ message: "success" });
    } catch (error) {
      res.json(error);
    }
  }
);

/* PUT Route to decline a friend request */
router.put(
  "/friend-request/:friendId/decline",
  isAuthenticated,
  async (req, res) => {
    const { friendId } = req.params;
    const user = req.payload;
    try {
      await User.findByIdAndUpdate(user._id, {
        $pull: { friendRequests: friendId },
      });
      res.json({ message: "success" });
    } catch (error) {
      res.json(error);
    }
  }
);

/* GET Route to see all friends */
router.get("/friends", isAuthenticated, async (req, res) => {
  const user = req.payload;
  try {
    const currentUser = await User.findById(user._id);
    currentUser.populate("friends");
    res.json(currentUser.friends);
  } catch (error) {
    res.json(error);
  }
});

/* SAMPLES */

/* POST Route to post samples */
router.post("/samples", async (req, res) => {
  const { artist, audio, name } = req.body;

  try {
    let response = await Sample.create({
      artist,
      audio,
      name,
    });
    console.log("Response from Sample.create:", response);
    await User.findByIdAndUpdate(artist, {
      $push: { samples: response._id },
    });
    res.json(response);
  } catch (error) {
    res.json(error);
  }
});

module.exports = router;
