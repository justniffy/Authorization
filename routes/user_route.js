const express =require("express");
const { sign_up, sign_in, make_admin, get_all_users, resend_otp, verify_email } = require("../controllers/user_control");
const { is_Auth } = require("../utils/is_authen");
const router = express.Router(); 


router.post('/sign_up',sign_up) 
router.post('/sign_in',sign_in)
router.patch("/verify_email", verify_email)
router.post("/resend_otp", resend_otp)
router.patch('/new_admin/:userId',make_admin)
router.get('/all_users', is_Auth, get_all_users)

module.exports = router;