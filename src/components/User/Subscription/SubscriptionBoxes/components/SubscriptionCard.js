import React, { Component } from "react";
import {
  withStyles,
  Typography,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Divider,
  CardHeader,
} from "@material-ui/core";
import { loadStripe } from "@stripe/stripe-js";
import { getCurrentUser, updateToken } from "../../../../../helpers/session";
import { caughtError, showConsoleError } from "../../../../../helpers/errors";
import { withRouter } from "next/router";
import compose from "recompose/compose";
import PropTypes from "prop-types";
import LoadingButton from "../../../../other/LoadingButton";
import axios from "../../../../../helpers/axios";
import MainAppContext from "../../../../../contexts/MainAppContext";
import subscriptionCardStyles from "../../../../../styles/User/Subscription/components/SubscriptionBoxes/components/subscriptionCardStyles";

const stripeKEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  require("../../../../../config").stripe.publishableKEY;

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(stripeKEY);

class SubscriptionCard extends Component {
  static contextType = MainAppContext;

  handlePurchase = async () => {
    // When the customer clicks on the button, redirect them to Checkout.
    // Call your backend to create the Checkout session.
    try {
      const { planName } = this.props;

      //fetch current user when button clicked in case email changed in new tab, for example
      const response_one = await getCurrentUser();

      if (!response_one.data.success) {
        if (response_one.data.redirect) {
          return this.props.router.push(response_one.data.message);
        } else {
          return this.context.showAlert(response_one.data.message);
        }
      }

      const currentUser = response_one.data.message;

      //check if student
      if (
        planName === "Student" &&
        currentUser.email.substr(currentUser.email.length - 3) != "edu"
      ) {
        return this.context.showAlert(
          "Sorry, you must have a valid student email (.edu) to purchase a Student subscription."
        );
      }

      const response = await axios.post(
        "/api/stripe/createCheckoutSession",
        {
          type: planName,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const sessionId = response.data.message;

        const stripe = await stripePromise;

        // If `redirectToCheckout` fails due to a browser or network
        // error, display the localized error message to your customer
        // using `error.message`.
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (error) {
          this.context.showAlert(
            caughtError("creating checkout session", error, 99)
          );
        }
      } else {
        if (response.data.redirect) {
          this.props.router.push(response.data.message);
        } else {
          this.context.showAlert(response.data.message);
        }
      }
    } catch (error) {
      showConsoleError("creating checkout session", error);
      this.context.showAlert(
        caughtError("creating checkout session", error, 99)
      );
    }
  };

  render() {
    const { classes, planName, priceText, text, image } = this.props;

    return (
      <React.Fragment>
        <div className={classes.layout}>
          <Card className={classes.root} elevation={5}>
            <CardHeader
              title={planName}
              titleTypographyProps={{
                variant: "h3",
                style: {
                  color: "white",
                  textAlign: "center",
                },
              }}
              className={classes.cardHeader}
            />
            <CardMedia className={classes.media} image={image} />
            <CardContent style={{ textAlign: "center" }}>
              <Typography variant="h4" gutterBottom>
                {priceText}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {text}
              </Typography>
            </CardContent>
            <Divider />
            <CardActions
              style={{ justifyContent: "center" }}
              className={classes.cardHeader}
            >
              <LoadingButton
                size="medium"
                variant="contained"
                className={classes.mainButton}
                onClick={this.handlePurchase}
              >
                Purchase
              </LoadingButton>
            </CardActions>
          </Card>
        </div>
      </React.Fragment>
    );
  }
}

SubscriptionCard.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default compose(
  withRouter,
  withStyles(subscriptionCardStyles)
)(SubscriptionCard);
