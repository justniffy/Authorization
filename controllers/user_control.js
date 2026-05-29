const User = require("../models/user_model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


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
    const new_user = await User.create({first_name,last_name,email, password: hashed_password});
    // Do not return the password in the response
    const user_response ={
        id : new_user._id,
        first_name: new_user.first_name,
        last_name : new_user.last_name,
        email: new_user.email,
    };
        return res
        .status(201)
        .json({message : "user created successfully", user: user_response});
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

    const is_match = await bcrypt.compare(password, user.password);
    if (!is_match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({id : user._id , first_name: user.first_name}, process.env.JWT_SECRET,{
        expiresIn : "1h"
    });
    const user_response ={
        id : user._id,
        first_name: user.first_name,
        last_name : user.last_name,
        email: user.email,
        token : token
    };


    return res
      .status(200)
      .json({ message: "User signed in successfully", user,token });
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
        return res.status(403).json({message: "You are not an admin"});
    }
    try{
        const users = await User.find().select("-password");
        return res.status(200).json({users});
    }catch(e){
        console.log(e);
        return res.status(500).json({message : "Internal server error"});
    }
};


module.exports = {
    sign_up,
    sign_in,
    make_admin,
    get_all_users
}; 