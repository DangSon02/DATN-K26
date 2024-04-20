"use strict";

const { NotFoundError, BadRequestError } = require("../core/error.response");
const { course, courseDataVideo } = require("../model/course.model");
const {
  review,
  replyReview,
  questionReview,
  anwserReview,
} = require("../model/feedback.model");
const {
  getAllReview,
  getReviewsWithReplies,
  getQuestionByVideo,
} = require("../model/repositories/feedback.repo");

const userModel = require("../model/user.model");

// hàm tinh tổng rating của user đánh khóa học
const calculateAvgRating = async (courseId) => {
  const reviewByCourseId = await review.find({ courseId });

  const avgRating = reviewByCourseId.reduce(
    (total, rev) => total + rev.review_rating,
    0
  );

  return (avgRating / reviewByCourseId.length).toFixed(1);
};

// hàm cập nhật cái rating trung binh của khóa học
const updateCourseAverageRating = async (courseId, avgRating) => {
  const checkCourse = await course.findById(courseId);

  if (checkCourse) {
    checkCourse.course_ratingsAverage = avgRating;
    await checkCourse.save();
  }
};

const checkUserReview = async (userId, courseId) => {
  const findCourse = await review.find({ courseId }).populate("userId");

  for (let i = 0; i < findCourse.length; i++) {
    if (findCourse[i].userId._id.toString() === userId) {
      return true;
    }
  }
  return false;
};

const addReview = async ({ userId, courseId, rating, comment }) => {
  const existUser = await checkUserReview(userId, courseId);

  if (existUser) {
    throw new BadRequestError("Only one review is allowed ");
  }

  const checkCourse = await course.findById(courseId);

  if (!checkCourse) {
    throw new NotFoundError("Course is not exist");
  }

  const user = await userModel.findById(userId);

  const existCourse = user.user_course.find(
    (course) => course._id.toString() === courseId
  );

  if (!existCourse) {
    throw new NotFoundError("You must purchase the course to comment");
  }

  const reviewData = {
    userId,
    courseId,
    review_rating: rating,
    review_comment: comment,
  };

  const newReview = await review.create(reviewData);

  const avgRating = await calculateAvgRating(courseId);

  await updateCourseAverageRating(courseId, avgRating);

  return newReview;
};

const addReplyReview = async ({ reviewId, courseId, comment, userId }) => {
  const checkCourse = await course.findById(courseId);

  if (!checkCourse) {
    throw new BadRequestError("Course is not exist");
  }

  const findByIdReview = await review.findById(reviewId);

  if (!findByIdReview) {
    throw new BadRequestError("Review is not exist");
  }

  const replyData = {
    reviewId,
    userId,
    courseId,
    reply_comment: comment,
  };

  const newReplyReview = await replyReview.create(replyData);

  return newReplyReview;
};

const addQuestion = async ({
  userId,
  videoTime,
  courseId,
  videoId,
  question,
}) => {
  const checkCourse = await course.findById(courseId);

  if (!checkCourse) {
    throw new BadRequestError("Course is not exist");
  }

  const findByIdVideo = await courseDataVideo.findById(videoId);

  if (!findByIdVideo) {
    throw new BadRequestError("Video is not exist");
  }

  const user = await userModel.findById(userId);

  const existCourse = user.user_course.find(
    (course) => course._id.toString() === courseId
  );

  if (!existCourse) {
    throw new NotFoundError("You must purchase the course to comment");
  }

  const questionData = {
    userId,
    video_time: videoTime,
    courseId,
    videoId,
    question_comment: question,
  };

  const newQuestion = await questionReview.create(questionData);

  return newQuestion;
};

const addAnwser = async ({ questionId, userId, anwser }) => {
  const findByIdQuestion = await questionReview.findById(questionId);

  if (!findByIdQuestion) {
    throw new BadRequestError("Question is not exist");
  }

  const anwserData = {
    questionId,
    userId,
    answser_comment: anwser,
  };

  const newAnwser = await anwserReview.create(anwserData);

  return newAnwser;
};

const getAllReviewByCourse = async ({ courseId, limit, page }) => {
  return await getAllReview({
    courseId,
    limit,
    page,
    select: [
      "userId",
      "user_avatar",
      "review_rating",
      "review_comment",
      "createdAt",
      "reply_comment",
    ],
  });
};

const getAllQuestionByVideo = async ({ videoId, limit, page }) => {
  return await getQuestionByVideo({
    videoId,
    limit,
    page,
    select: [
      "userId",
      "user_avatar",
      "video_time",
      "answser_comment",
      "question_comment",
      "createdAt",
    ],
  });
};

module.exports = {
  addReview,
  getAllReviewByCourse,
  addReplyReview,
  addQuestion,
  getAllQuestionByVideo,
  addAnwser,
  checkUserReview,
};