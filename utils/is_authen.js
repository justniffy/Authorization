const jwt = require("jsonwebtoken");
const User = require("../models/user_model");


const is_Auth = async (req,res,next) => {
    const auth_head = req.headers.authorization;
    if (!auth_head || !auth_head.startsWith("Bearer")){
        return res.status(401).json({message: "Unauthorized"});
    }
    const token = auth_head.split(" ")[1];
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({message : "Unauthorised"});
        }
        req.user = user;
        next();
    } catch(e){
        console.log(e);
        return res.status(401).json({message : "Unauthorized"});
    }
};

module.exports = {
    is_Auth
}