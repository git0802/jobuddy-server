const router = require("express").Router();
const { asyncHandler } = require("../middlewares/asyncHandler");
const checkEmail = require("../middlewares/checkEmail");
const {
  signup: signupValidator,
  signin: signinValidator,
  updateProfile: updateProfileValidator,
  updatePassword: updatePasswordValidator,
} = require("../validators/auth");
const authController = require("../controllers/auth.controller");
router
  .route("/signup")
  .post(
    signupValidator,
    asyncHandler(checkEmail),
    asyncHandler(authController.signup)
  );
router
  .route("/signin")
  .post(signinValidator, asyncHandler(authController.signin));

router.route("/getAdminEmail").get(asyncHandler(authController.getAdminEmail));
router
  .route("/updateProfile")
  .post(updateProfileValidator, asyncHandler(authController.updateProfile));
router
  .route("/updatePassword")
  .post(updatePasswordValidator, asyncHandler(authController.updatePassword));

module.exports = router;
