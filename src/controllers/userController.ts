import { RequestHandler } from "express";
import { User } from "../models/user";
import { signUserToken } from "../services/auth";
import { devRecipient } from "../environmentTypes";
import { sendEmail } from "../services/sendEmail";

export async function findCreateUser(reqBody: any): Promise<User | null> {

    let user: User | null = await User.findOne({
        where: { email: reqBody.email }
    });

    if (!user) {
        const newUser: User = reqBody;
        try {
            let created = await User.create(newUser);
            user = created
        }
        catch (err) {
            return null;
        }
    }

    return user
}

export const loginUser: RequestHandler = async (req, res, next) => {
    function validateEmail(email: string) {
        let test = /\S+@\S+\.\S+/;
        return test.test(email);
      }

    if (!req.body.email || validateEmail(req.body.email) === false) {
        res.status(400).send('email required');
    }else{


    const user: User | null = await findCreateUser(req.body)
    if (!user) {
        return res.status(401).send('database err');
    }else{

    let token = await signUserToken(user);
    let tokenizedLink = "http://localhost:3001/login/token/" + token

    sendEmail({
        subject: "User Authentication",
        body: 'Click this link to login: ' + tokenizedLink,
        to: [devRecipient, { email: user.email }]
    })

    res.status(200).json({ user });
}
}
}

