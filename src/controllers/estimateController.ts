import { Estimate } from './../models/estimate';
import { RequestHandler } from "express";
import { User } from "../models/user";
import { sendEmail } from '../services/sendEmail';
import { adminRecipient } from '../environmentTypes';
import { findCreateUser } from './userController';
import { verifyReCaptcha } from '../services/auth';

export const getAllEstimates: RequestHandler = async (req, res, next) => {
    let estimates = await Estimate.findAll();
    res.status(200).json(estimates);
}

export const createEstimate: RequestHandler = async (req, res, next) => {

    // ------------reCAPTCHA------------
    // verify human; return 403 if bot
    let human: boolean | null | undefined = await verifyReCaptcha(req);
    if (!human) { return res.status(403).send() }
    
    function validateEmail(email: string) {
        let test = /\S+@\S+\.\S+/;
        return test.test(email);
      }

    if (!req.body.email || validateEmail(req.body.email) === false) {
        res.status(400).send('email required');
    }else{

    const user: User | null = await findCreateUser(req.body)
    if (!user) {
        return res.status(400).send('database err');
    }

    let newEstimate: any = {
        userId: user.userId,
        seats: req.body.seats,
        leather: req.body.leather,
        conditioner: req.body.conditioner,
        pets: req.body.pets,
        smoke: req.body.smoke,
        price: req.body.price
    };

    if (newEstimate.userId && newEstimate.seats && newEstimate.price) {
        // console.log(newEstimate)
        let created = await Estimate.create(newEstimate);
        // console.log(created)
        res.status(201).json(created);
    } else {
        return res.status(400).send();
    }

    sendEmail({
        subject: "New Estimate",
        body: 'Thank you for submitting your estimate. We will reach out to schedule an appointment soon.' + 
        "Price (tax included): " + newEstimate.price + 
        " Seats: " + newEstimate.seats + 
        " Leather: " + newEstimate.leather + 
        " conditioner: " + newEstimate.conditioner + 
        " pets: " + newEstimate.pets + 
        " smoke: " + newEstimate.smoke,
        to: [adminRecipient, { email: user.email }]
    })
}
}

export const getOneEstimate: RequestHandler = async (req, res, next) => {
    let estimateId = req.params.estimateId;
    let estimateFound = await Estimate.findByPk(estimateId);
    if (estimateFound) {
        res.status(200).json(estimateFound);
    }
    else {
        res.status(404).json({});
    }
}

export const deleteEstimate: RequestHandler = async (req, res, next) => {

    let estimateId = req.params.estimateId;
    let estimateFound = await Estimate.findByPk(estimateId);

    if (estimateFound) {
        await Estimate.destroy({
            where: { estimateId: estimateId }
        });
        res.status(200).json();
    }
    else {
        res.status(404).json();
    }
}