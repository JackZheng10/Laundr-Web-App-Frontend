import React, { Component } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import PerfectScrollbar from "react-perfect-scrollbar";
import { makeStyles } from "@material-ui/styles";
import {
  Card,
  CardActions,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  withStyles,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  IconButton,
} from "@material-ui/core";
import Close from "@material-ui/icons/Close";
import orderTableStyles from "../../../styles/DriverDashboard/components/orderTableStyles";

class OrderTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dialog: false,
      dialogText: "",
      dialogTitle: "",
      currentOrder: null,
      openSnackbar: false,
      snackbarMessage: "",
      snackbarSuccess: true,
    };
  }

  renderStage = (stage) => {
    if (stage === 0) {
      return "Pickup";
    }
  };

  renderActions = (stage) => {
    if (stage === 0) {
      return "Accept";
    }
  };

  handleActionClicked = (stage, order) => {
    this.setState({ currentOrder: order }, () => {
      if (stage === 0) {
        this.setState({
          dialog: true,
          dialogTitle: "Confirmation",
        });
      }
    });
  };

  renderDialogContent = () => {
    let order = this.state.currentOrder;

    if (order) {
      if (order.orderInfo.status === 0) {
        return (
          <React.Fragment>
            <Typography variant="body1">
              Plese confirm that you are accepting an order from:&nbsp;
            </Typography>
            <Typography
              variant="body1"
              style={{ fontWeight: 600, textAlign: "center" }}
            >
              {`${order.userInfo.fname} ${order.userInfo.lname}`}
            </Typography>
          </React.Fragment>
        );
      }
    }
  };

  renderDialogActions = () => {
    let order = this.state.currentOrder;

    if (order) {
      if (order.orderInfo.status === 0) {
        return (
          <React.Fragment>
            <Button onClick={this.handleDialogClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={async () => {
                let success = await this.props.acceptOrder(
                  this.state.currentOrder
                );
                if (success) {
                  this.renderAcceptedMsg();
                } else {
                  this.renderErrorAcceptMsg();
                }
              }}
              color="primary"
            >
              Confirm
            </Button>
          </React.Fragment>
        );
      }
    }
  };

  handleDialogClose = () => {
    this.setState({ dialog: false });
  };

  renderAcceptedMsg = () => {
    this.setState({ dialog: false }, () => {
      this.setState({
        openSnackbar: true,
        snackbarMessage: "Order successfully accepted!",
        snackbarSuccess: true,
      });
    });
  };

  renderErrorAcceptMsg = () => {
    this.setState({ dialog: false }, () => {
      this.setState({
        openSnackbar: true,
        snackbarMessage:
          "Error with accepting this order - you could be too late! Please refresh and try again.",
        snackbarSuccess: false,
      });
    });
  };

  render() {
    const classes = this.props.classes;

    return (
      <Card>
        <CardContent className={classes.content}>
          <PerfectScrollbar>
            <React.Fragment>
              <Dialog open={this.state.dialog} onClose={this.handleDialogClose}>
                <DialogTitle>{this.state.dialogTitle}</DialogTitle>
                <DialogContent>{this.renderDialogContent()}</DialogContent>
                <DialogActions>{this.renderDialogActions()}</DialogActions>
              </Dialog>
            </React.Fragment>
            <div className={classes.inner}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="left">Date/Time</TableCell>
                    <TableCell align="left">Address</TableCell>
                    <TableCell align="left">User Phone</TableCell>
                    <TableCell align="left">Instructions</TableCell>
                    <TableCell align="left">Load Size</TableCell>
                    <TableCell align="left">Stage</TableCell>
                    <TableCell align="left">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {this.props.orders.map((order) => (
                    <TableRow hover key={order.orderInfo.orderID}>
                      <TableCell>
                        <div className={classes.nameContainer}>
                          <Typography variant="body1">
                            {`${order.userInfo.fname} ${order.userInfo.lname}`}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Typography
                            variant="body1"
                            style={{ fontWeight: 600 }}
                          >
                            Pickup:&nbsp;
                          </Typography>
                          <Typography variant="body1">{` ${order.driverInfo.pickupDate} @ ${order.driverInfo.pickupTime}`}</Typography>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Typography
                            variant="body1"
                            style={{ fontWeight: 600 }}
                          >
                            Dropoff:&nbsp;
                          </Typography>
                          <Typography variant="body1">
                            {"placeholder"}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Typography
                            variant="body1"
                            style={{ fontWeight: 600 }}
                          >
                            User:&nbsp;
                          </Typography>
                          <Typography variant="body1">{` ${order.driverInfo.address}`}</Typography>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Typography
                            variant="body1"
                            style={{ fontWeight: 600 }}
                          >
                            Washer:&nbsp;
                          </Typography>
                          <Typography variant="body1">
                            {"placeholder"}
                          </Typography>
                        </div>
                      </TableCell>
                      <TableCell>{order.userInfo.phone}</TableCell>
                      <TableCell>{order.driverInfo.addressPrefs}</TableCell>
                      <TableCell>{420}</TableCell>
                      <TableCell>
                        {this.renderStage(order.orderInfo.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            this.handleActionClicked(
                              order.orderInfo.status,
                              order
                            );
                          }}
                        >
                          {this.renderActions(order.orderInfo.status)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PerfectScrollbar>
        </CardContent>
        <CardActions className={classes.actions}></CardActions>
        <React.Fragment>
          <Snackbar
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            open={this.state.openSnackbar}
            autoHideDuration={10000}
            onClose={() => {
              this.setState({ openSnackbar: false });
            }}
            message={this.state.snackbarMessage}
            action={
              <React.Fragment>
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => {
                    this.setState({ openSnackbar: false });
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </React.Fragment>
            }
            ContentProps={{
              style: {
                backgroundColor: this.state.snackbarSuccess ? "green" : "red",
              },
            }}
          />
        </React.Fragment>
      </Card>
    );
  }
}

OrderTable.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(orderTableStyles)(OrderTable);
