const User = require("../models/User");
const moment = require("moment");
var cron = require("node-cron");

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

//todo: use webhooks to handle email change in chckout

var task = cron.schedule("* * * * * *", () => {
  console.log("will execute every second until stopped");
});

task.stop();

const handleWebhook = async (req, res) => {
  let event;

  try {
    event = JSON.parse(req.body);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "invoice.payment_succeeded":
      //when sub cycle payment succeeds - since invoices only used for subs. also applies for first one
      /*===============================================================*/
      console.log("Event handled: " + event.type);
      const invoice = event.data.object;

      let subscriptionID = invoice.subscription;
      let subscriptionObj;
      let retrievalError = false;

      //retrieve associated sub
      await stripe.subscriptions
        .retrieve(subscriptionID)
        .then((subscription, err) => {
          if (err || !subscription) {
            retrievalError = true;
          } else {
            subscriptionObj = subscription;
          }
        });

      if (retrievalError) {
        return res.json({
          success: false,
          message: "Could not fetch subscription",
        });
      }

      //create the new sub object from the updated subscription
      let plan;
      let lbsLeft;

      switch (subscriptionObj.plan.id) {
        case familyAPI_ID:
          plan = "Family";
          lbsLeft = 84;
          break;
        case plusAPI_ID:
          plan = "Plus";
          lbsLeft = 66;
          break;
        case standardAPI_ID:
          plan = "Standard";
          lbsLeft = 48;
          break;
        case studentAPI_ID:
          plan = "Student";
          lbsLeft = 40;
          break;
      }

      let subscription = {
        id: subscriptionObj.id,
        anchorDate: moment.unix(subscriptionObj.billing_cycle_anchor).format(),
        startDate: moment.unix(subscriptionObj.start_date).format(),
        periodStart: moment.unix(subscriptionObj.current_period_start).format(),
        periodEnd: moment.unix(subscriptionObj.current_period_end).format(),
        plan: plan,
        status: subscriptionObj.status,
        lbsLeft: lbsLeft,
      };

      //update user's "subscription" property with the updated sub object
      await User.findOneAndUpdate(
        { "stripe.customerID": subscriptionObj.customer },
        { subscription: subscription }
      )
        .then((user) => {
          if (user) {
            return res.json({
              success: true,
              message: "Updated user subscription object",
            });
          } else {
            return res.json({
              success: false,
              message: "Could not find user associated with subscription",
            });
          }
        })
        .catch((error) => {
          return res.json({
            success: false,
            message: error,
          });
        });

      /*===============================================================*/
      break;

    case "invoice.failed":
      //when sub cycle payment fails - since invoices only used for subs
      /*===============================================================*/
      console.log("Event handled: " + event.type);
      return res.json({
        success: false,
        message: "Received an event not handled",
      });
      /*===============================================================*/
      break;

    default:
      //unexpected event type or one not handled
      /*===============================================================*/
      console.log("Event NOT handled: " + event.type);
      return res.json({
        success: false,
        message: "Received an event not handled",
      });
      /*===============================================================*/
      break;
  }
};

module.exports = { handleWebhook };

// console.log(
//   "test 1: " +
//     moment.unix(subscription.billing_cycle_anchor).format()
// ); //iso8601

// console.log(
//   "test 2: " + moment.unix(subscription.billing_cycle_anchor)
// ); //moment object, basically a Date

// console.log(
//   "this 1: " +
//     moment
//       .unix(subscription.billing_cycle_anchor)
//       .format("HH:mm:ss")
// );
// console.log(
//   "this 2: " +
//     moment
//       .unix(subscription.billing_cycle_anchor)
//       .format("MM/DD/YYYY")
// ); //format("MM/DD/YYYY");