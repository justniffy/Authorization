const User = require("../models/user_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/email");

const sign_up = async(req,res) => {
    const{first_name, last_name,email,password} = req.body;
    try{
        if(!first_name || !last_name || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        const user = await User.findOne({email});
        if (user){
            return res.status(400).json({message: "User already exists"});
        }
        
    const hashed_password = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    const new_user = await User.create({
      first_name,
      last_name,
      email, 
      otp,
      otp_expiry,
      password: hashed_password});


    await sendEmail(
      email,
      "Email Verification",
      `Your OTP for email verification is: ${otp}. It is valid for 10 minutes.`,
    );

    // Do not return the password in the response
    const user_response ={
        id : new_user._id,
        first_name: new_user.first_name,
        last_name : new_user.last_name,
        email: new_user.email,
    };
        return res
        .status(201)
        .json({message : "user created successfully",  User: user_response});
    }catch(e){
        console.log(e);
        return res.status(500).json({message : "internal server error"});
    }
}
 
const sign_in = async(req,res) =>{
    const{email,password} = req.body;
    try{
       if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.is_verified) {
      return res
        .status(400)
        .json({ message: "Please verify your email before signing in" });
    }

    const is_match = await bcrypt.compare(password, user.password);
    if (!is_match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {id : user._id , first_name: user.first_name},
       process.env.JWT_SECRET,
       {
        expiresIn : "1h"
    },
  );
  const user_response ={
     id : user._id,
     first_name: user.first_name,
     last_name : user.last_name,
     email: user.email,
     token : token,
     role: user.role,
    };


    return res
      .status(200)
      .json({ message: "User signed in successfully", user_response });
    }catch(e){
         console.log(e)
         return res.status(500).json({message: "Internal server error"});
    }
};


const make_admin = async (req,res)=> {
    const{userId} = req.params;
    try{
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({message : "User not found"});
    }
    user.role = "admin";
    await user.save();
    return res.status(200).json({message : "User role updated to admin"});
    }catch(e){
        console.log(e);
        return res.status(500).json({message : "Internal server error"});

    }
};

const get_all_users = async (req,res) => {
    
    if(req.user.role !== "admin"){
        return res
        .status(403)
        .json({message: "You are not an admin"});
    }
    try{
        const users = await User.find().select("-password");
        return res.status(200).json({users});
    }catch(e){
        console.log(e);
        return res.status(500).json({message : "Internal server error"});
    }
};

const verify_email = async (req, res) => {
  const { otp } = req.body;
  try {
    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otp_expiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.is_verified = true;
    user.otp = undefined;
    user.otp_expiry = undefined;
    await user.save();
     
    return res.status(200).json({ message: "Email verified successfully" });
     } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};




const resend_otp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a new 6-digit OTP
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    user.otp = otp;
    user.otp_expiry = otp_expiry;
    await user.save();

     await sendEmail(
      email,
      "OTP Verification",
      `Your OTP is ${otp}. It expires in 10 minutes.`
    );

    return res.status(200).json({ message: "OTP resent successfully", otp });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
  

};


module.exports = {
    sign_up,
    sign_in,
    make_admin,
    resend_otp,
    verify_email,
    get_all_users
}; 