import jwt from "jsonwebtoken";
export const generateToken= (userId,res)=>{

    const Token = jwt.sign({userId},process.env.jwt_SECRET, {
        expiresIn:"7d"
    })

    res.cookie("jwt",Token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // miliseconds to 7 days
        httpOnly: true, //prevent xss attack cross-site scripting attacks
        sameSite: "none", //CSRF attack cross-site request forgery attacks
        secure: process.env.NODE_ENV !=="development",
    });

    return Token;
} 
