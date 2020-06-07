const baseURL = require("../config/baseURL");
const User = require("../models/User");

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripeSECRET =
  process.env.STRIPE_SECRET || require("../config/config").stripe.secret;

const stripe = require("stripe")(stripeSECRET);
const familyAPI_ID =
  process.env.STRIPE_FAMILY_API_ID ||
  require("../config/config").stripe.familyAPI_ID;
const plusAPI_ID =
  process.env.STRIPE_PLUS_API_ID ||
  require("../config/config").stripe.plusAPI_ID;
const standardAPI_ID =
  process.env.STANDARD_FAMILY_API_ID ||
  require("../config/config").stripe.standardAPI_ID;
const studentAPI_ID =
  process.env.STUDENT_FAMILY_API_ID ||
  require("../config/config").stripe.studentAPI_ID;

const createCheckoutSession = async (req, res) => {
  let planAPI_ID = "";

  switch (req.body.type) {
    case "Student":
      planAPI_ID = studentAPI_ID;
      break;

    case "Standard":
      planAPI_ID = standardAPI_ID;
      break;

    case "Plus":
      planAPI_ID = plusAPI_ID;
      break;

    case "Family":
      planAPI_ID = familyAPI_ID;
      break;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: planAPI_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: baseURL + "/userSubscription", //after they successfully checked out
      cancel_url: baseURL + "/userSubscription", //usually the page they were at before. if they click to go back
      customer: req.body.customerID,
    });

    return res.json({ success: true, message: session.id });
  } catch (error) {
    return res.json({
      success: false,
      message: "Error with creating Checkout session: " + error,
    });
  }
};

const createSetupIntent = async (req, res) => {
  try {
    const intent = await stripe.setupIntents.create({
      customer: req.body.customerID,
    });

    return res.json({ success: true, message: intent.client_secret });
  } catch (error) {
    return res.json({
      success: false,
      message: "Error with creating card setup intent: " + error,
    });
  }
};

const getCardDetails = async (req, res) => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(
      req.body.paymentID
    );

    return res.json({
      success: true,
      message: paymentMethod,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: "Error with grabbing card details: " + error,
    });
  }
};

const setRegPaymentID = async (req, res, next) => {
  await User.findOneAndUpdate(
    { email: req.body.userEmail },
    {
      "stripe.regPaymentID": req.body.regPaymentID,
    }
  )
    .then(async (user) => {
      if (!user) {
        return res.json({
          success: false,
          message: "User could not be found",
        });
      } else {
        res.locals.user = user;
        next();
      }
    })
    .catch((error) => {
      return res.json({
        success: false,
        message: error,
      });
    });
};

const detachOldPaymentID = async (req, res) => {
  let user = res.locals.user;

  let oldRegPaymentID = user.stripe.regPaymentID;

  if (oldRegPaymentID != "N/A") {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(oldRegPaymentID);

      return res.json({
        success: true,
        message: "Old payment method successfully detached in Stripe",
      });
    } catch (error) {
      return res.json({
        success: false,
        message: "Error with detaching old payment method in Stripe: " + error,
      });
    }
  }
};

const chargeCustomer = async (req, res, next) => {
  console.log(3);
  let user = res.locals.user;
  let subscription = user.subscription;

  //console.log(user);

  //calculate the lbs to be charged, if any
  let chargeLbs;

  //if the subscription has any lbs left, calculate the lbs to be deducted or charged
  if (subscription.lbsLeft > 0) {
    chargeLbs = req.body.weight - subscription.lbsLeft;
  } else {
    chargeLbs = req.body.weight;
  }

  //if the lbs to be charged is greater than 0, charge them. otherwise, they must be a subscriber so update their lbs left
  if (chargeLbs > 0) {
    //attempt a charge
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: chargeLbs * 1.5 * 100,
        currency: "usd",
        customer: user.stripe.customerID,
        payment_method: user.stripe.regPaymentID,
        off_session: true,
        confirm: true,
      });

      //if charge successful and they're a subscriber, move on to middleware to update their lbs left if its not already 0
      if (subscription.lbsLeft > 0) {
        next();
      } else {
        return res.json({
          success: true,
          message: "Non-subscriber charged successfully",
        });
      }
    } catch (error) {
      // Error code will be authentication_required if authentication is needed
      console.log("Error is: ", error);
      console.log("Error code is: ", error.code);

      // if (err.code === "authentication_required") {
      //   // const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(
      //   //   err.raw.payment_intent.id
      //   // );
      //   // console.log("PI retrieved: ", paymentIntentRetrieved.id);

      //   return res.json({
      //     success: false,
      //     message: "authentication_required",
      //   });
      // } else {
      //   return res.json({
      //     success: false,
      //     message: err.code,
      //   });
      // }

      return res.json({
        success: false,
        message: error.code,
      });
    }
  } else {
    //subscriber was not charged, so move on to middleware to update their lbs left
    next();
  }
};

const fetchUser = async (req, res, next) => {
  await User.findOne({ email: req.body.userEmail })
    .then((user) => {
      if (user) {
        console.log(2);
        //use res.locals for middleware add-on properties!
        res.locals.user = user;
        //user found, move on to next middleware
        next();
      } else {
        return res.json({
          success: false,
          message: "User not found",
        });
      }
    })
    .catch((error) => {
      return res.json({
        success: false,
        message: error,
      });
    });
};

const updateSubscriptionLbs = async (req, res) => {
  let chargeLbs = req.body.weight - res.locals.user.subscription.lbsLeft;
  let updatedLbs;

  if (chargeLbs > 0) {
    updatedLbs = 0;
  } else {
    updatedLbs = res.locals.user.subscription.lbsLeft - req.body.weight;
  }

  await User.findOneAndUpdate(
    { email: req.body.userEmail },
    { "subscription.lbsLeft": updatedLbs }
  )
    .then((user) => {
      if (user) {
        return res.json({
          success: true,
          message: "User subscription lbs left updated",
        });
      } else {
        return res.json({
          success: false,
          message: "User could not be found",
        });
      }
    })
    .catch((error) => {
      return res.json({
        success: false,
        message: error,
      });
    });
};

const createSelfPortal = async (req, res) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: req.body.customerID,
      return_url: baseURL + "/userSubscription",
    });

    return res.json({
      success: true,
      message: session.url,
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error,
    });
  }
};

module.exports = {
  createSetupIntent,
  //real:
  setRegPaymentID,
  detachOldPaymentID,
  getCardDetails,
  fetchUser,
  updateSubscriptionLbs,
  chargeCustomer,
  createSelfPortal,
  createCheckoutSession,
};
